# Mollie Payment Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Mollie payment processing to events so parents can buy tickets directly, with per-event toggle, per-occurrence inventory, and admin order management.

**Architecture:** Per-event `use_mollie` flag controls whether the purchase widget (Mollie checkout) or external link is shown. Each occurrence has its own ticket stock, visibility toggle, and max-per-purchase limit. Orders are tracked in a new `orders` table. Mollie webhook confirms payment status. Admin sees orders in a read-only table.

**Tech Stack:** Next.js 14 API routes, Supabase PostgreSQL, @mollie/api-client, existing Tailwind design system (brand-*, ocean-*, warm-* tokens).

---

## Batch 1: Database + Types

### Task 1.1: SQL Migration

**File:** Create `supabase-mollie-migration.sql` (run in Supabase SQL Editor)

```sql
-- ══════════════════════════════════════
-- Mollie Payments Migration
-- ══════════════════════════════════════

-- 1. Add use_mollie to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS use_mollie BOOLEAN DEFAULT false;

-- 2. Add inventory fields to event_occurrences
ALTER TABLE event_occurrences ADD COLUMN IF NOT EXISTS ticket_quantity INTEGER;
ALTER TABLE event_occurrences ADD COLUMN IF NOT EXISTS max_per_purchase INTEGER DEFAULT 5;
ALTER TABLE event_occurrences ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- 3. Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  occurrence_id UUID NOT NULL REFERENCES event_occurrences(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_amount DECIMAL(10,2) NOT NULL,
  attendee_names JSONB NOT NULL DEFAULT '[]',
  notes TEXT CHECK (char_length(notes) <= 300),
  mollie_payment_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_orders_event ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_occurrence ON orders(occurrence_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_mollie ON orders(mollie_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- 5. RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Public can insert (for creating orders) and read by ID (for confirmation page)
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read orders by id" ON orders FOR SELECT USING (true);

-- Service role has full access (for webhook updates, admin reads)
CREATE POLICY "Service role full access on orders" ON orders FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

**Step 1:** Save the SQL file to project root
**Step 2:** User runs it in Supabase SQL Editor
**Step 3:** Also update `schema.sql` reference file with the new table/columns

### Task 1.2: Update TypeScript Types

**File:** Modify `src/types/index.ts`

Add to `EventOccurrence` interface (after `notes` field):
```typescript
// Inventory (Mollie)
ticket_quantity: number | null;
max_per_purchase: number | null;
is_visible: boolean;
```

Add to `Event` interface (after `is_promoted`):
```typescript
use_mollie: boolean;
```

Add new `Order` interface:
```typescript
export interface Order {
  id: string;
  event_id: string;
  occurrence_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  quantity: number;
  total_amount: number;
  attendee_names: string[];
  notes: string | null;
  mollie_payment_id: string | null;
  payment_status: "pending" | "paid" | "failed" | "expired";
  created_at: string;
  // Joined
  event?: { title: string; slug: string; image_url: string | null; price_min: number | null };
  occurrence?: { occurrence_date: string; time_start: string | null; location_name: string | null };
}
```

### Task 1.3: Update Activity Log Types

**File:** Modify `src/lib/activityLog.ts`

Add to `ActivityAction` union:
```typescript
| "order_status_update"
```

Add to `ActivityEntityType` union (if exists):
```typescript
| "order"
```

---

## Batch 2: Mollie Integration + Payment APIs

### Task 2.1: Install Mollie SDK + Create Helper

**Step 1:** Install package
```bash
npm install @mollie/api-client
```

**Step 2:** Create `src/lib/mollie.ts`

```typescript
import createMollieClient from "@mollie/api-client";

export function getMollieClient() {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) throw new Error("MOLLIE_API_KEY is not configured");
  return createMollieClient({ apiKey });
}
```

### Task 2.2: Create Payment API — POST /api/payments

**File:** Create `src/app/api/payments/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getMollieClient } from "@/lib/mollie";

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  // 1. Parse input
  const body = await req.json();
  const {
    occurrence_id,
    quantity,
    buyer_name,
    buyer_email,
    buyer_phone,
    attendee_names,
    notes,
  } = body;

  // 2. Validate required fields
  if (!occurrence_id || !quantity || !buyer_name || !buyer_email || !buyer_phone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!attendee_names || attendee_names.length !== quantity) {
    return NextResponse.json({ error: "Must provide a name for each ticket" }, { status: 400 });
  }
  if (notes && notes.length > 300) {
    return NextResponse.json({ error: "Notes max 300 characters" }, { status: 400 });
  }

  // 3. Fetch occurrence + event
  const { data: occurrence } = await supabase
    .from("event_occurrences")
    .select("*, event:events(id, title, slug, price_min, price_max, is_free, use_mollie)")
    .eq("id", occurrence_id)
    .single();

  if (!occurrence || !occurrence.event) {
    return NextResponse.json({ error: "Occurrence not found" }, { status: 404 });
  }

  const event = occurrence.event as {
    id: string; title: string; slug: string;
    price_min: number | null; price_max: number | null;
    is_free: boolean; use_mollie: boolean;
  };

  if (!event.use_mollie) {
    return NextResponse.json({ error: "Mollie payments not enabled for this event" }, { status: 400 });
  }
  if (!occurrence.is_visible) {
    return NextResponse.json({ error: "This date is not available" }, { status: 400 });
  }
  if (!occurrence.ticket_quantity) {
    return NextResponse.json({ error: "No ticket quantity configured" }, { status: 400 });
  }

  // 4. Check max per purchase
  const maxPerPurchase = occurrence.max_per_purchase || 5;
  if (quantity > maxPerPurchase) {
    return NextResponse.json({ error: `Maximum ${maxPerPurchase} tickets per purchase` }, { status: 400 });
  }

  // 5. Check stock availability
  const { data: soldOrders } = await supabase
    .from("orders")
    .select("quantity")
    .eq("occurrence_id", occurrence_id)
    .eq("payment_status", "paid");

  const totalSold = (soldOrders || []).reduce((sum, o) => sum + o.quantity, 0);
  const available = occurrence.ticket_quantity - totalSold;

  if (quantity > available) {
    return NextResponse.json({
      error: available > 0 ? `Only ${available} tickets remaining` : "Sold out",
      available,
    }, { status: 400 });
  }

  // 6. Calculate total
  const unitPrice = event.price_min || 0;
  const totalAmount = unitPrice * quantity;

  // 7. Create order in DB
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      event_id: event.id,
      occurrence_id,
      buyer_name,
      buyer_email,
      buyer_phone,
      quantity,
      total_amount: totalAmount,
      attendee_names,
      notes: notes || null,
      payment_status: "pending",
    })
    .select()
    .single();

  if (orderError || !order) {
    console.error("[payments] order create error:", orderError);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  // 8. Create Mollie payment
  try {
    const mollieClient = getMollieClient();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;

    const payment = await mollieClient.payments.create({
      amount: {
        currency: "EUR",
        value: totalAmount.toFixed(2),
      },
      description: `${event.title} x${quantity} — Padres en Madrid`,
      redirectUrl: `${baseUrl}/eventos/${event.slug}/confirmacion?order=${order.id}`,
      webhookUrl: `${baseUrl}/api/payments/webhook`,
      metadata: {
        order_id: order.id,
        event_id: event.id,
        occurrence_id,
      },
    });

    // 9. Save Mollie payment ID to order
    await supabase
      .from("orders")
      .update({ mollie_payment_id: payment.id })
      .eq("id", order.id);

    // 10. Return checkout URL
    return NextResponse.json({
      checkoutUrl: payment.getCheckoutUrl(),
      orderId: order.id,
    });
  } catch (err) {
    console.error("[payments] Mollie error:", err);
    // Clean up the pending order
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: "Payment service error" }, { status: 500 });
  }
}
```

### Task 2.3: Create Webhook — POST /api/payments/webhook

**File:** Create `src/app/api/payments/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getMollieClient } from "@/lib/mollie";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = new URLSearchParams(body);
  const paymentId = params.get("id");

  if (!paymentId) {
    return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
  }

  try {
    const mollieClient = getMollieClient();
    const payment = await mollieClient.payments.get(paymentId);

    const orderId = (payment.metadata as { order_id?: string })?.order_id;
    if (!orderId) {
      console.error("[webhook] No order_id in payment metadata");
      return NextResponse.json({ error: "No order ID" }, { status: 400 });
    }

    // Map Mollie status to our status
    let status: string;
    switch (payment.status) {
      case "paid":
        status = "paid";
        break;
      case "failed":
      case "canceled":
        status = "failed";
        break;
      case "expired":
        status = "expired";
        break;
      default:
        status = "pending";
    }

    const supabase = createServerClient();
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: status })
      .eq("id", orderId);

    if (error) {
      console.error("[webhook] update error:", error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    // Revalidate event page to update stock display
    if (payment.metadata) {
      const eventSlug = (payment.metadata as { event_slug?: string })?.event_slug;
      if (eventSlug) revalidatePath(`/eventos/${eventSlug}`);
    }
    revalidatePath("/eventos");

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
```

### Task 2.4: Create Order Details API — GET /api/payments/[orderId]

**File:** Create `src/app/api/payments/[orderId]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      event:events(title, slug, image_url, price_min),
      occurrence:event_occurrences(occurrence_date, time_start, time_end, location_name)
    `)
    .eq("id", orderId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order: data });
}
```

### Task 2.5: Create Admin Orders API — GET /api/admin/orders

**File:** Create `src/app/api/admin/orders/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerClient();
  const url = new URL(req.url);

  const eventId = url.searchParams.get("event_id") || "";
  const status = url.searchParams.get("status") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("orders")
    .select(`
      *,
      event:events(title, slug),
      occurrence:event_occurrences(occurrence_date, time_start, location_name)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (eventId) query = query.eq("event_id", eventId);
  if (status) query = query.eq("payment_status", status);

  const { data, error, count } = await query;

  if (error) {
    console.error("[admin/orders]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data || [], total: count || 0, page });
}
```

---

## Batch 3: Data Functions + Stock

### Task 3.1: Add Stock Calculation to data.ts

**File:** Modify `src/lib/data.ts`

Add new function after `getRelatedEvents`:

```typescript
export async function getOccurrenceStock(eventId: string): Promise<Record<string, number>> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("orders")
    .select("occurrence_id, quantity")
    .eq("event_id", eventId)
    .eq("payment_status", "paid");

  const sold: Record<string, number> = {};
  for (const order of data || []) {
    sold[order.occurrence_id] = (sold[order.occurrence_id] || 0) + order.quantity;
  }
  return sold;
}
```

### Task 3.2: Filter Non-Visible Occurrences

**File:** Modify `src/lib/data.ts`

In `getEventBySlug` — after sorting occurrences, filter out non-visible ones for public display:

```typescript
if (event.occurrences) {
  event.occurrences = event.occurrences
    .filter((occ) => occ.is_visible !== false)
    .sort((a, b) => a.occurrence_date.localeCompare(b.occurrence_date));
}
```

In `getUpcomingEvents` — same filter when processing occurrences:
After the line that filters future occurrences, also filter `is_visible !== false`.

---

## Batch 4: Admin Panel Updates

### Task 4.1: Update Admin Events Form — Mollie Toggle

**File:** Modify `src/app/admin/events/page.tsx`

**In the EventRow interface**, add:
```typescript
use_mollie: boolean;
```

**In the form state** (where title, slug, etc. are managed), add:
```typescript
const [useMollie, setUseMollie] = useState(false);
```

**In the edit panel JSX** (after `is_promoted` toggle), add Mollie toggle:
```tsx
{/* Mollie Payment */}
<div className="flex items-center justify-between p-3 bg-ocean-50 rounded-xl border border-ocean-100">
  <div>
    <label className="text-sm font-semibold text-ocean-800">Vender con Mollie</label>
    <p className="text-xs text-ocean-600 mt-0.5">Activar pago directo en la web</p>
  </div>
  <button
    type="button"
    onClick={() => setUseMollie(!useMollie)}
    className={`relative w-11 h-6 rounded-full transition-colors ${useMollie ? "bg-ocean-600" : "bg-warm-300"}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${useMollie ? "translate-x-5" : ""}`} />
  </button>
</div>
```

**In the save handler**, include `use_mollie: useMollie` in the body sent to the API.

**In the load/edit handler**, set `setUseMollie(event.use_mollie || false)` when loading an event.

**In the API PATCH route** (`src/app/api/admin/events/[id]/route.ts`), add `"use_mollie"` to the allowed fields whitelist.

### Task 4.2: Update Admin Occurrences — Inventory Fields

**File:** Modify `src/app/admin/events/page.tsx`

**In the OccurrenceRow interface**, add:
```typescript
ticket_quantity: number | null;
max_per_purchase: number | null;
is_visible: boolean;
```

**In the occurrence add/edit form**, add fields:
```tsx
{/* Only show when Mollie is enabled */}
{useMollie && (
  <div className="grid grid-cols-2 gap-3 mt-3">
    <div>
      <label className="block text-xs font-semibold text-warm-600 mb-1">Entradas disponibles</label>
      <input type="number" min="0" className="input-field text-sm py-2" placeholder="Ej: 10"
        value={occTicketQuantity} onChange={(e) => setOccTicketQuantity(e.target.value)} />
    </div>
    <div>
      <label className="block text-xs font-semibold text-warm-600 mb-1">Máx. por compra</label>
      <input type="number" min="1" max="20" className="input-field text-sm py-2" placeholder="5"
        value={occMaxPerPurchase} onChange={(e) => setOccMaxPerPurchase(e.target.value)} />
    </div>
  </div>
)}
```

**In the occurrence list**, add visibility toggle and stock indicator:
```tsx
{/* Per-occurrence: visible toggle + stock */}
{useMollie && occ.ticket_quantity != null && (
  <div className="flex items-center gap-3 mt-1">
    <button onClick={() => toggleOccurrenceVisibility(occ.id, occ.is_visible)}
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${occ.is_visible ? "bg-verified-50 text-verified-700" : "bg-warm-100 text-warm-400"}`}>
      {occ.is_visible ? "Visible" : "Oculto"}
    </button>
    <span className="text-xs text-warm-500">
      {soldCount}/{occ.ticket_quantity} vendidas
    </span>
  </div>
)}
```

**In the occurrence POST body**, include the new fields:
```typescript
ticket_quantity: occTicketQuantity ? parseInt(occTicketQuantity) : null,
max_per_purchase: occMaxPerPurchase ? parseInt(occMaxPerPurchase) : 5,
is_visible: true,
```

**In the occurrences API** (`src/app/api/admin/events/[id]/occurrences/route.ts`), add the new fields to the insert mapping.

### Task 4.3: Add Orders to Admin Navigation

**File:** Modify `src/app/admin/layout.tsx`

Add nav item after Events:
```typescript
{ label: "Pedidos", href: "/admin/orders", icon: Ticket },
```

Import `Ticket` from lucide-react.

### Task 4.4: Create Admin Orders Page

**File:** Create `src/app/admin/orders/page.tsx`

A `"use client"` page following the same patterns as `src/app/admin/events/page.tsx`:

- Auth check with `useEffect` + Bearer token
- Fetch orders from `/api/admin/orders`
- Filter by event (dropdown), payment status (paid/pending/failed/expired)
- Table with columns: Pedido (short ID), Evento, Fecha, Comprador, Email, Teléfono, Cantidad, Total, Estado, Creado
- Expandable row to show: attendee names, notes, Mollie payment ID
- Status badge colors: paid=green, pending=amber, failed=red, expired=gray
- Pagination

**Status badge config:**
```typescript
const ORDER_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  paid: { bg: "bg-verified-50", text: "text-verified-700", label: "Pagado" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Pendiente" },
  failed: { bg: "bg-red-50", text: "text-red-700", label: "Fallido" },
  expired: { bg: "bg-warm-100", text: "text-warm-500", label: "Expirado" },
};
```

---

## Batch 5: Frontend — Purchase Widget

### Task 5.1: Create Purchase Widget Component

**File:** Create `src/components/events/MolliePurchaseWidget.tsx`

A `"use client"` component that receives event data + occurrence stock and renders the full purchase form.

**Props:**
```typescript
interface MolliePurchaseWidgetProps {
  event: {
    id: string;
    title: string;
    slug: string;
    price_min: number | null;
    is_free: boolean;
  };
  occurrences: Array<{
    id: string;
    occurrence_date: string;
    time_start: string | null;
    time_end: string | null;
    location_name: string | null;
    ticket_quantity: number | null;
    max_per_purchase: number | null;
    available: number; // pre-computed: ticket_quantity - sold
  }>;
}
```

**State:**
```typescript
const [selectedOccurrence, setSelectedOccurrence] = useState<string>("");
const [quantity, setQuantity] = useState(1);
const [buyerName, setBuyerName] = useState("");
const [buyerEmail, setBuyerEmail] = useState("");
const [buyerPhone, setBuyerPhone] = useState("");
const [attendeeNames, setAttendeeNames] = useState<string[]>([""]);
const [notes, setNotes] = useState("");
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState("");
```

**UI sections (in order):**
1. Price display header
2. Date selector — radio buttons for each visible occurrence with stock indicator
3. Quantity selector — minus/plus buttons, respects max_per_purchase and available stock
4. Buyer info form — name, email, phone inputs
5. Attendee names — dynamic list, one input per ticket
6. Notes textarea — optional, character counter (X/300)
7. Total display — `unitPrice × quantity = total`
8. Submit button — "Pagar {total}€" with lock icon, ocean-600
9. Trust text — "Pago seguro · Recibirás tu entrada en 1-5 horas"

**Stock indicators per date:**
- available >= 5 → green "Disponible"
- available 1-4 → amber "Quedan {n}"
- available 0 → red "Agotado" (disabled, can't select)

**Submit handler:**
```typescript
const handleSubmit = async () => {
  setSubmitting(true);
  setError("");
  try {
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        occurrence_id: selectedOccurrence,
        quantity,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone,
        attendee_names: attendeeNames,
        notes: notes || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Error al procesar el pago");
      return;
    }
    // Redirect to Mollie checkout
    window.location.href = data.checkoutUrl;
  } catch {
    setError("Error de conexión");
  } finally {
    setSubmitting(false);
  }
};
```

### Task 5.2: Update Event Detail Page — Show Widget or Link

**File:** Modify `src/app/(directory)/eventos/[slug]/page.tsx`

**Import the widget:**
```typescript
import { MolliePurchaseWidget } from "@/components/events/MolliePurchaseWidget";
import { getOccurrenceStock } from "@/lib/data";
```

**In the page function**, after fetching the event, conditionally fetch stock:
```typescript
let occurrenceStock: Record<string, number> = {};
if (event.use_mollie) {
  occurrenceStock = await getOccurrenceStock(event.id);
}
```

**Compute available stock per occurrence:**
```typescript
const occurrencesWithStock = (event.use_mollie && futureOccurrences.length > 0)
  ? futureOccurrences.map((occ) => ({
      ...occ,
      available: (occ.ticket_quantity || 0) - (occurrenceStock[occ.id] || 0),
    }))
  : [];
```

**In the sidebar (right column)**, replace the current purchase card:
```tsx
{event.use_mollie ? (
  <MolliePurchaseWidget
    event={{
      id: event.id,
      title: event.title,
      slug: event.slug,
      price_min: event.price_min,
      is_free: event.is_free,
    }}
    occurrences={occurrencesWithStock}
  />
) : (
  /* Existing purchase card with external link — keep as-is */
)}
```

### Task 5.3: Create Confirmation Page

**File:** Create `src/app/(directory)/eventos/[slug]/confirmacion/page.tsx`

A `"use client"` page that:
1. Reads `?order=` from URL search params
2. Fetches order details from `/api/payments/{orderId}`
3. Shows one of three states:

**Paid state:**
- Green checkmark icon
- "¡Pago confirmado!"
- "Recibirás tu entrada por email en un plazo de 1 a 5 horas"
- Order summary card: event title, date, time, venue, quantity, total, buyer name, email, attendee names
- Order number: `#${orderId.slice(0, 8).toUpperCase()}`
- "Volver a eventos" link

**Pending state:**
- Spinner animation
- "Procesando tu pago..."
- "Esto puede tardar unos segundos"
- Auto-polls `/api/payments/{orderId}` every 3 seconds
- Switches to paid/failed once resolved

**Failed state:**
- Red X icon
- "El pago no se ha completado"
- "Reintentar" button → creates new payment via POST /api/payments with same data
- "Volver al evento" link

**Design:** Use the site's warm design system. White card on warm-50 background. `container-padres` for width. `shadow-card` on the summary card.

---

## Batch 6: Polish + Integration

### Task 6.1: Update Public Events API for Visibility

**File:** Modify `src/app/api/events/route.ts`

When filtering occurrences, also exclude `is_visible = false`:
```typescript
const futureOccs = (event.occurrences || []).filter(
  (occ) => occ.occurrence_date >= today
    && occ.availability !== "cancelled"
    && occ.is_visible !== false
);
```

### Task 6.2: Update EventCard Sold-Out Display

**File:** Modify `src/components/events/EventCard.tsx`

No changes needed — sold-out is handled at the occurrence level, not the card level. The card already shows the date range and occurrence count based on available occurrences.

### Task 6.3: Update Event Detail Dates Section

**File:** Modify `src/app/(directory)/eventos/[slug]/page.tsx`

When `use_mollie = true`, the dates section in the left column should show stock indicators instead of external "Comprar" buttons. The purchase flow is handled by the sidebar widget.

Replace the per-occurrence "Comprar" button logic:
```tsx
{event.use_mollie ? (
  // Stock indicator only — purchase happens in sidebar
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
    occAvailable >= 5 ? "bg-verified-50 text-verified-700" :
    occAvailable > 0 ? "bg-amber-50 text-amber-700" :
    "bg-red-50 text-red-700"
  }`}>
    <span className={`h-1.5 w-1.5 rounded-full ${
      occAvailable >= 5 ? "bg-verified-500" :
      occAvailable > 0 ? "bg-amber-500" :
      "bg-red-500"
    }`} />
    {occAvailable >= 5 ? "Disponible" :
     occAvailable > 0 ? `Quedan ${occAvailable}` :
     "Agotado"}
  </span>
) : (
  // Existing external link button — keep as-is
)}
```

### Task 6.4: Env Variable Setup

**File:** Update `.env.local` (or `.env`)

Add:
```
MOLLIE_API_KEY=test_xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SITE_URL=https://padresenmadrid.com
```

The user will provide the actual Mollie API key.

---

## Files Summary

| Action | File |
|--------|------|
| Create | `supabase-mollie-migration.sql` |
| Modify | `src/types/index.ts` |
| Modify | `src/lib/activityLog.ts` |
| Create | `src/lib/mollie.ts` |
| Modify | `src/lib/data.ts` |
| Create | `src/app/api/payments/route.ts` |
| Create | `src/app/api/payments/webhook/route.ts` |
| Create | `src/app/api/payments/[orderId]/route.ts` |
| Create | `src/app/api/admin/orders/route.ts` |
| Modify | `src/app/api/admin/events/[id]/route.ts` |
| Modify | `src/app/api/admin/events/[id]/occurrences/route.ts` |
| Modify | `src/app/admin/layout.tsx` |
| Create | `src/app/admin/orders/page.tsx` |
| Modify | `src/app/admin/events/page.tsx` |
| Create | `src/components/events/MolliePurchaseWidget.tsx` |
| Modify | `src/app/(directory)/eventos/[slug]/page.tsx` |
| Create | `src/app/(directory)/eventos/[slug]/confirmacion/page.tsx` |
| Modify | `src/app/api/events/route.ts` |

## Verification

1. Run SQL migration in Supabase → verify `orders` table + new columns
2. `npx next build` — no TypeScript errors
3. Admin: create event → toggle "Vender con Mollie" → add occurrence with 5 tickets
4. Public: `/eventos/[slug]` → see purchase widget instead of external link
5. Purchase: select date → 2 tickets → fill form → redirect to Mollie test checkout
6. After payment: webhook updates order → confirmation page shows "Pago confirmado"
7. Admin: `/admin/orders` → see the order with all details
8. Stock: buy all tickets → occurrence shows "Agotado" → can't buy more
9. Visibility: hide an occurrence in admin → doesn't appear on public page

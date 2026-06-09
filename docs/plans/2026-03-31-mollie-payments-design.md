# Mollie Payment Integration for Events

**Date:** 2026-03-31
**Status:** Approved

## Overview

Add Mollie payment processing to events so parents can buy tickets directly on the site. Per-event toggle: if Mollie is enabled, parents pay through Mollie; if not, they see the external link as today.

## Requirements

1. **Per-event Mollie toggle** — admin checkbox per event
2. **Per-occurrence inventory** — each date has its own stock, max-per-purchase limit, and on/off visibility toggle
3. **Purchase flow** — select date → quantity → buyer info + attendee names + notes → Mollie checkout → confirmation page
4. **Auto sold-out** — when stock reaches 0 for a date, show "Agotado"
5. **Admin orders page** — read-only table of all orders with filters
6. **Manual ticket delivery** — admin sends tickets by email within 1-5 hours

## Database Changes

### Events table — add field:
- `use_mollie BOOLEAN DEFAULT false`

### Event occurrences table — add fields:
- `ticket_quantity INT` — total tickets for this date
- `max_per_purchase INT DEFAULT 5` — cap per transaction
- `is_visible BOOLEAN DEFAULT true` — show/hide toggle

### New `orders` table:
- `id UUID PK DEFAULT gen_random_uuid()`
- `event_id UUID FK events NOT NULL`
- `occurrence_id UUID FK event_occurrences NOT NULL`
- `buyer_name TEXT NOT NULL`
- `buyer_email TEXT NOT NULL`
- `buyer_phone TEXT NOT NULL`
- `quantity INT NOT NULL`
- `total_amount DECIMAL NOT NULL`
- `attendee_names JSONB NOT NULL` — e.g. `["Ana García", "Luis García"]`
- `notes TEXT` — optional, max 300 chars
- `mollie_payment_id TEXT`
- `payment_status TEXT DEFAULT 'pending' CHECK (pending/paid/failed/expired)`
- `created_at TIMESTAMPTZ DEFAULT now()`

Stock calculation: `ticket_quantity - SUM(orders.quantity WHERE payment_status = 'paid')` per occurrence.

## API Routes

### POST /api/payments
- Input: occurrence_id, quantity, buyer_name, buyer_email, buyer_phone, attendee_names, notes
- Validates stock, quantity within max_per_purchase
- Creates order (status: pending)
- Creates Mollie payment (amount, description, redirectUrl, webhookUrl)
- Returns Mollie checkout URL

### POST /api/payments/webhook
- Called by Mollie automatically
- Fetches payment status from Mollie API
- Updates order payment_status (paid/failed/expired)

### GET /api/payments/[orderId]
- Returns order details for confirmation page
- Public (no auth) — uses order UUID as access token

### GET /api/admin/orders
- Auth required (Bearer token)
- Filters: event_id, payment_status, date range
- Returns orders with event/occurrence joins

## Frontend

### Event Detail Page — Purchase Widget (client component)
When `use_mollie = true`, the sidebar shows:
1. Price per ticket
2. Date selector (only visible dates, stock indicators)
3. Quantity selector (respects max_per_purchase and remaining stock)
4. Buyer form (name, email, phone)
5. Attendee names (one per ticket)
6. Notes field (optional, 300 char max)
7. "Pagar X€ con Mollie" CTA button
8. Trust indicators (secure payment, delivery time)

Stock indicators:
- 5+ left → "Disponible" (green)
- 1-4 left → "Quedan N" (amber)
- 0 left → "Agotado" (red, disabled)

When `use_mollie = false`, show external link as today (no changes).

### Confirmation Page
Route: `/eventos/[slug]/confirmacion?order=[orderId]`

States:
- **Paid**: Success message + order summary + "Recibirás tu entrada en 1-5 horas"
- **Pending**: Spinner + "Procesando tu pago..." (polls every 3s)
- **Failed**: Error message + "Reintentar" button

### Admin Panel
- Event form: add "Vender con Mollie" toggle
- Occurrence form: add quantity, max_per_purchase, is_visible fields
- New `/admin/orders` page: filterable order table, expandable rows for attendee details

## Environment Variables
- `MOLLIE_API_KEY` — from Mollie dashboard

## Tech Stack
- Mollie Node.js SDK (`@mollie/api-client`)
- Existing Supabase for database
- Existing Next.js API routes
- No email service — manual ticket delivery

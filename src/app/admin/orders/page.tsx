"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Download,
  X,
  Copy,
  Check,
  Mail,
  Phone,
  MessageCircle,
  Save,
  ExternalLink,
} from "lucide-react";

interface OrderRow {
  id: string;
  order_number: string | null;
  event_id: string;
  occurrence_id: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  attendee_names: string[] | null;
  quantity: number;
  total_amount: number;
  payment_status: string;
  payment_provider: string | null;
  mollie_payment_id: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  revolut_order_id: string | null;
  revolut_public_id: string | null;
  is_deposit: boolean | null;
  deposit_percent: number | null;
  deposit_amount: number | null;
  remaining_amount: number | null;
  notes: string | null;
  admin_notes: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  refund_amount: number | null;
  confirmation_email_sent_at: string | null;
  failure_email_sent_at: string | null;
  created_at: string;
  event?: { id: string; title: string; slug: string; section?: string; image_url?: string | null };
  occurrence?: {
    occurrence_date: string;
    time_start: string | null;
    time_end?: string | null;
    location_name: string | null;
    street_address?: string | null;
  };
}

interface EventOption {
  id: string;
  title: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  paid:         { bg: "bg-emerald-50",  text: "text-emerald-700", label: "Pagado" },
  deposit_paid: { bg: "bg-amber-50",    text: "text-amber-800",   label: "Depósito · falta cobrar" },
  pending:      { bg: "bg-amber-50",    text: "text-amber-700",   label: "Pendiente" },
  failed:       { bg: "bg-red-50",      text: "text-red-700",     label: "Fallido" },
  expired:      { bg: "bg-gray-100",    text: "text-gray-600",    label: "Expirado" },
  refunded:     { bg: "bg-blue-50",     text: "text-blue-700",    label: "Reembolsado" },
  cancelled:    { bg: "bg-gray-100",    text: "text-gray-500",    label: "Cancelado" },
};
const DEFAULT_STATUS = { bg: "bg-gray-100", text: "text-gray-500", label: "Desconocido" };

const SECTION_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  actividades:  { label: "Eventos",      bg: "bg-brand-50",  text: "text-brand-700" },
  colegios:     { label: "Colegios",     bg: "bg-ocean-100", text: "text-ocean-800" },
  campamentos:  { label: "Campamentos",  bg: "bg-copper-50", text: "text-copper-700" },
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatEuros(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return `$$ {n.toFixed(2).replace(".", ",")}`;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filterEvent, setFilterEvent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterProvider, setFilterProvider] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [events, setEvents] = useState<EventOption[]>([]);
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSavedAt, setNotesSavedAt] = useState<number | null>(null);
  const [resending, setResending] = useState(false);
  const [resendResult, setResendResult] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const limit = 25;
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const buildParams = useCallback((withPage = true) => {
    const params = new URLSearchParams();
    if (withPage) {
      params.set("page", String(page));
      params.set("limit", String(limit));
    }
    if (filterEvent) params.set("event_id", filterEvent);
    if (filterStatus) params.set("status", filterStatus);
    if (filterSection) params.set("section", filterSection);
    if (filterProvider) params.set("provider", filterProvider);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (search) params.set("search", search);
    return params;
  }, [page, filterEvent, filterStatus, filterSection, filterProvider, dateFrom, dateTo, search]);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?${buildParams()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch {
      console.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [token, buildParams]);

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/events?limit=500", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEvents(
        (data.events || []).map((e: { id: string; title: string }) => ({ id: e.id, title: e.title }))
      );
    } catch {
      console.error("Failed to fetch events for filter");
    }
  }, [token]);

  useEffect(() => { if (token) fetchEvents(); }, [token, fetchEvents]);
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openOrder = async (order: OrderRow) => {
    setSelected(order);
    setAdminNotes(order.admin_notes || "");
    setNotesSavedAt(null);
    setResendResult(null);
    // Fetch full detail for accurate joined data
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.order) {
        setSelected(data.order);
        setAdminNotes(data.order.admin_notes || "");
      }
    } catch {
      /* ignore */
    }
  };

  const closeOrder = () => {
    setSelected(null);
    setAdminNotes("");
    setResendResult(null);
  };

  const updateStatus = async (newStatus: string) => {
    if (!selected || !token) return;
    const current = selected.payment_status;
    if (newStatus === current) return;
    if (!confirm(`¿Cambiar estado de ${selected.order_number || selected.id.slice(0, 8)} a "${newStatus}"?`)) return;
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${selected.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelected((prev) => (prev ? { ...prev, ...data.order } : prev));
        fetchOrders();
      }
    } finally {
      setSavingStatus(false);
    }
  };

  const saveNotes = async () => {
    if (!selected || !token) return;
    setNotesSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${selected.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: adminNotes }),
      });
      if (res.ok) {
        setNotesSavedAt(Date.now());
        setSelected((prev) => (prev ? { ...prev, admin_notes: adminNotes } : prev));
      }
    } finally {
      setNotesSaving(false);
    }
  };

  const resendEmail = async () => {
    if (!selected || !token) return;
    setResending(true);
    setResendResult(null);
    try {
      const res = await fetch(`/api/admin/orders/${selected.id}/resend-email`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setResendResult("Email enviado ✓");
      } else {
        const data = await res.json().catch(() => ({}));
        setResendResult(`Error: ${data.error || "no se pudo enviar"}`);
      }
    } finally {
      setResending(false);
      setTimeout(() => setResendResult(null), 4000);
    }
  };

  const exportCsv = async () => {
    if (!token) return;
    const params = buildParams(false);
    params.set("format", "csv");
    const res = await fetch(`/api/admin/orders?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pedidos-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (value: string, key: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const totalPages = Math.ceil(total / limit);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  if (!token) return null;

  const selectedStatus = selected ? (STATUS_STYLES[selected.payment_status] || DEFAULT_STATUS) : null;
  const whatsappUrl = selected?.buyer_phone
    ? `https://wa.me/${selected.buyer_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hola ${selected.buyer_name}, te escribimos sobre tu pedido ${selected.order_number || selected.id.slice(0, 8)}.`)}`
    : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "#272E2F" }}>Pedidos</h1>
          <p className="text-[13px] mt-1" style={{ color: "#777777" }}>
            {total} pedido{total !== 1 ? "s" : ""} en total
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-all"
        >
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5 mb-6">
        <input
          type="text"
          placeholder="Buscar por # pedido, nombre o email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 min-w-[240px] rounded-xl border border-gray-200 bg-white px-4 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
        <select value={filterSection} onChange={(e) => { setFilterSection(e.target.value); setPage(1); }} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-200">
          <option value="">Todas las secciones</option>
          <option value="actividades">Eventos</option>
          <option value="colegios">Colegios</option>
          <option value="campamentos">Campamentos</option>
        </select>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-200">
          <option value="">Todos los estados</option>
          <option value="paid">Pagado</option>
          <option value="deposit_paid">Depósito (falta cobrar)</option>
          <option value="pending">Pendiente</option>
          <option value="failed">Fallido</option>
          <option value="expired">Expirado</option>
          <option value="refunded">Reembolsado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <select value={filterProvider} onChange={(e) => { setFilterProvider(e.target.value); setPage(1); }} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-200">
          <option value="">Todos los proveedores</option>
          <option value="stripe">Stripe</option>
        </select>
        <select value={filterEvent} onChange={(e) => { setFilterEvent(e.target.value); setPage(1); }} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-200 max-w-[220px]">
          <option value="">Todos los eventos</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-200" />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-200" />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <ShoppingCart className="w-10 h-10 mb-3" />
          <p className="text-sm font-medium">No hay pedidos</p>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Pedido</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Evento</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Sección</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Fecha</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Comprador</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Cant.</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Total</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Pago</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const status = STATUS_STYLES[order.payment_status] || DEFAULT_STATUS;
                  const sectionCfg = order.event?.section ? SECTION_LABELS[order.event.section] : null;
                  return (
                    <tr
                      key={order.id}
                      onClick={() => openOrder(order)}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 font-semibold">
                        {order.order_number || `#${order.id.slice(0, 8).toUpperCase()}`}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 truncate max-w-[200px]">
                        {order.event?.title}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {sectionCfg ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${sectionCfg.bg} ${sectionCfg.text}`}>
                            {sectionCfg.label}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                        {formatDate(order.occurrence?.occurrence_date)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{order.buyer_name}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{order.quantity}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatEuros(order.total_amount)}</td>
                      <td className="px-4 py-3 text-center text-[11px] text-gray-500 capitalize">{order.payment_provider || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">Página {page} de {totalPages}</p>
          <div className="flex items-center gap-2">
            <button disabled={!hasPrev} onClick={() => setPage((p) => p - 1)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <button disabled={!hasNext} onClick={() => setPage((p) => p + 1)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Side panel ─────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={closeOrder} />
          <div className="relative ml-auto w-full max-w-xl bg-white h-full flex flex-col shadow-2xl overflow-y-auto">
            {/* Panel header */}
            <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <button onClick={() => copyToClipboard(selected.order_number || selected.id, "orderNumber")}
                  className="text-[15px] font-bold font-mono hover:text-brand-500 transition-colors flex items-center gap-1.5"
                  style={{ color: "#272E2F" }}
                  title="Copiar número de pedido"
                >
                  {selected.order_number || `#${selected.id.slice(0, 8).toUpperCase()}`}
                  {copied === "orderNumber" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                </button>
                {selectedStatus && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${selectedStatus.bg} ${selectedStatus.text}`}>
                    {selectedStatus.label}
                  </span>
                )}
              </div>
              <button onClick={closeOrder} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-6">
              {/* Event */}
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Evento</p>
                <div className="flex items-start gap-3">
                  {selected.event?.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selected.event.image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <a
                      href={`/ofertas/${selected.event?.slug || ""}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-gray-900 hover:text-brand-600 inline-flex items-center gap-1"
                    >
                      {selected.event?.title}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                      {formatDate(selected.occurrence?.occurrence_date)}
                      {selected.occurrence?.time_start ? ` · ${selected.occurrence.time_start}` : ""}
                    </p>
                    {selected.occurrence?.location_name && (
                      <p className="text-[13px] text-gray-500">{selected.occurrence.location_name}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Buyer */}
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Comprador</p>
                <p className="font-medium text-gray-900">{selected.buyer_name}</p>
                <div className="mt-2 space-y-1.5">
                  <a href={`mailto:${selected.buyer_email}`} className="flex items-center gap-2 text-[13px] text-gray-700 hover:text-brand-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400" /> {selected.buyer_email}
                  </a>
                  {selected.buyer_phone && (
                    <div className="flex items-center gap-3 text-[13px] text-gray-700">
                      <a href={`tel:${selected.buyer_phone}`} className="flex items-center gap-2 hover:text-brand-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400" /> {selected.buyer_phone}
                      </a>
                      {whatsappUrl && (
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700">
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Attendees + qty */}
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                  Asistentes ({selected.quantity})
                </p>
                <ul className="space-y-1 text-[14px] text-gray-800">
                  {(selected.attendee_names || []).map((name, i) => (
                    <li key={i} className="flex items-baseline gap-2">
                      <span className="text-xs text-gray-400">{i + 1}.</span>
                      <span>{name}</span>
                    </li>
                  ))}
                </ul>
                {selected.notes && (
                  <div className="mt-3 text-[13px] text-gray-600 bg-gray-50 rounded-lg p-3">
                    <span className="font-semibold text-gray-700">Notas del comprador: </span>{selected.notes}
                  </div>
                )}
              </section>

              {/* Payment details */}
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Pago</p>
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <p className="text-gray-400 text-[11px]">Total</p>
                    <p className="font-semibold text-gray-900">{formatEuros(selected.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[11px]">Proveedor</p>
                    <p className="font-semibold text-gray-900 capitalize">{selected.payment_provider || "—"}</p>
                  </div>
                  {selected.paid_at && (
                    <div>
                      <p className="text-gray-400 text-[11px]">Pagado el</p>
                      <p className="text-gray-800">{formatDateTime(selected.paid_at)}</p>
                    </div>
                  )}
                  {selected.refunded_at && (
                    <div>
                      <p className="text-gray-400 text-[11px]">Reembolsado el</p>
                      <p className="text-gray-800">{formatDateTime(selected.refunded_at)}</p>
                    </div>
                  )}
                  {selected.is_deposit && (
                    <div className="col-span-2 mt-1 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                        Reserva con depósito
                      </p>
                      <div className="mt-2 grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-[10px] text-amber-700/70 uppercase tracking-wider">Pagado ({selected.deposit_percent}%)</p>
                          <p className="text-emerald-700 font-bold text-[15px]">$ {Number(selected.deposit_amount || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-amber-700/70 uppercase tracking-wider">Falta cobrar</p>
                          <p className="text-amber-700 font-bold text-[15px]">$ {Number(selected.remaining_amount || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-amber-700/70 uppercase tracking-wider">Total reserva</p>
                          <p className="text-gray-800 font-bold text-[15px]">$ {Number(selected.total_amount || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-[11.5px] text-amber-800/80 leading-snug">
                        Contactar al cliente en 24-48h para gestionar el cobro pendiente.
                      </p>
                    </div>
                  )}
                  {selected.stripe_session_id && (
                    <div className="col-span-2">
                      <p className="text-gray-400 text-[11px]">Stripe session</p>
                      <a href={`https://dashboard.stripe.com/payments/${selected.stripe_payment_intent_id || ""}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-gray-700 break-all hover:text-brand-600">
                        {selected.stripe_session_id}
                      </a>
                    </div>
                  )}
                </div>
              </section>

              {/* Status control */}
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Estado del pedido</p>
                <div className="flex items-center gap-2">
                  <select
                    value={selected.payment_status}
                    onChange={(e) => updateStatus(e.target.value)}
                    disabled={savingStatus}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-200"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="paid">Pagado</option>
                    <option value="failed">Fallido</option>
                    <option value="expired">Expirado</option>
                    <option value="refunded">Reembolsado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                  {savingStatus && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                </div>
                <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                  Para reembolsos reales, primero devuelve el dinero en el panel de Stripe y luego marca aquí como "Reembolsado".
                </p>
              </section>

              {/* Admin notes */}
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Notas internas</p>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                  placeholder="Anota cualquier detalle interno sobre este pedido…"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[11px] text-gray-500">
                    {notesSavedAt ? "Guardado ✓" : "Solo visible para el equipo."}
                  </p>
                  <button
                    onClick={saveNotes}
                    disabled={notesSaving || adminNotes === (selected.admin_notes || "")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {notesSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Guardar
                  </button>
                </div>
              </section>

              {/* Email actions */}
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Email</p>
                <div className="space-y-1 text-[12px] text-gray-500">
                  <p>
                    Confirmación: {selected.confirmation_email_sent_at ? formatDateTime(selected.confirmation_email_sent_at) : "no enviada"}
                  </p>
                  {selected.failure_email_sent_at && (
                    <p>Aviso de fallo: {formatDateTime(selected.failure_email_sent_at)}</p>
                  )}
                </div>
                <button
                  onClick={resendEmail}
                  disabled={resending}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-all"
                >
                  {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  {selected.payment_status === "paid" ? "Reenviar confirmación" : "Reenviar email"}
                </button>
                {resendResult && <p className="text-[12px] text-gray-600 mt-2">{resendResult}</p>}
              </section>

              <div className="pt-2 pb-4 text-[11px] text-gray-400">
                Creado: {formatDateTime(selected.created_at)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

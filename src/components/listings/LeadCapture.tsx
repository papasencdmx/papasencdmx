"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle, Phone, Globe, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── Lead Form Modal ──

interface LeadFormProps {
  listingId: string;
  listingName: string;
  cityId: string;
  onClose: () => void;
}

export function LeadForm({ listingId, listingName, cityId, onClose }: LeadFormProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    parent_name: "",
    parent_email: "",
    parent_phone: "",
    message: "",
    children_ages: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Submit to API route (handles email notification too)
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          city_id: cityId,
          ...form,
          source_page: window.location.pathname,
        }),
      });

      if (res.ok) {
        setSent(true);
      }
    } catch (err) {
      console.error("Lead submission error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
          <CheckCircle className="mx-auto h-12 w-12 text-verified-500" />
          <h3 className="mt-4 font-display text-xl text-warm-900">Solicitud enviada</h3>
          <p className="mt-2 text-warm-600">
            Tu solicitud ha sido enviada a {listingName}. Te contactaran pronto.
          </p>
          <button onClick={onClose} className="btn-primary mt-6">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl text-warm-900">
          Solicitar informacion
        </h3>
        <p className="mt-1 text-sm text-warm-500">
          Contacta con {listingName}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Tu nombre *
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={form.parent_name}
              onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              className="input-field"
              value={form.parent_email}
              onChange={(e) => setForm({ ...form, parent_email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Telefono
            </label>
            <input
              type="tel"
              className="input-field"
              placeholder="+52..."
              value={form.parent_phone}
              onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Edades de tus hijos
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Ej: 4, 7"
              value={form.children_ages}
              onChange={(e) => setForm({ ...form, children_ages: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Mensaje
            </label>
            <textarea
              rows={3}
              className="input-field resize-none"
              placeholder="Cuentanos que necesitas..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" /> Enviar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Click-to-Reveal Phone ──

interface PhoneRevealProps {
  listingId: string;
  cityId: string;
  phone: string;
}

export function PhoneReveal({ listingId, cityId, phone }: PhoneRevealProps) {
  const [revealed, setRevealed] = useState(false);

  async function handleReveal() {
    if (revealed) return;
    setRevealed(true);
    trackClick(listingId, cityId, "phone_reveal");
  }

  return (
    <button
      onClick={handleReveal}
      className="btn-secondary w-full justify-start gap-3"
    >
      <Phone className="h-4 w-4 text-verified-600" />
      {revealed ? (
        <a href={`tel:${phone}`} className="text-brand-600 font-semibold">
          {phone}
        </a>
      ) : (
        <span>Ver telefono</span>
      )}
    </button>
  );
}

// ── Tracked Outbound Links ──

interface TrackedLinkProps {
  listingId: string;
  cityId: string;
  href: string;
  eventType: "website_click" | "whatsapp_click" | "email_reveal" | "directions_click";
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function TrackedLink({ listingId, cityId, href, eventType, children, className, style }: TrackedLinkProps) {
  function handleClick() {
    trackClick(listingId, cityId, eventType);
  }

  // Add UTM params for website clicks
  let trackedHref = href;
  if (eventType === "website_click" && !href.includes("utm_source")) {
    const sep = href.includes("?") ? "&" : "?";
    trackedHref = `${href}${sep}utm_source=papasencdmx&utm_medium=directorio&utm_campaign=listing`;
  }

  return (
    <a
      href={trackedHref}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
      style={style}
    >
      {children}
    </a>
  );
}

// ── Share Buttons ──

interface ShareButtonsProps {
  listingId: string;
  cityId: string;
  url: string;
  title: string;
}

export function ShareButtons({ listingId, cityId, url, title }: ShareButtonsProps) {
  const fullUrl = `https://${process.env.NEXT_PUBLIC_SITE_DOMAIN}${url}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} - ${fullUrl}`)}`;

  function handleShare(type: "share_whatsapp" | "share_facebook" | "share_copy_link") {
    trackClick(listingId, cityId, type);

    if (type === "share_copy_link") {
      navigator.clipboard.writeText(fullUrl);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleShare("share_whatsapp")}
        className="flex items-center gap-2 rounded-lg bg-[#25D366]/10 px-3 py-2 text-sm font-medium text-[#25D366] transition-colors hover:bg-[#25D366]/20"
      >
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </a>
      <button
        onClick={() => handleShare("share_copy_link")}
        className="btn-ghost text-sm"
      >
        Copiar enlace
      </button>
    </div>
  );
}

// ── Click Tracking Utility ──

async function trackClick(
  listingId: string,
  cityId: string,
  eventType: string
) {
  try {
    let sessionId = "";
    try { sessionId = sessionStorage.getItem("pv_session_id") || ""; } catch {}
    await fetch("/api/clicks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listing_id: listingId,
        city_id: cityId,
        event_type: eventType,
        source_page: window.location.pathname,
        session_id: sessionId || undefined,
      }),
    });
  } catch {
    // Silent fail — don't break UX for analytics
  }
}

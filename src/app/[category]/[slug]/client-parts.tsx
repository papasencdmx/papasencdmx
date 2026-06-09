"use client";

import { useState, useEffect, useRef } from "react";
import {
  Phone, Globe, MessageCircle, Mail, Navigation, Share2,
  ChevronDown, X, MapPin, ExternalLink, AlertTriangle, Building2
} from "lucide-react";
import { LeadForm, PhoneReveal, TrackedLink, ShareButtons } from "@/components/listings/LeadCapture";
import type { Listing, Category } from "@/types";

// ── Contact Actions ──

// Color + icon maps for custom buttons
const buttonColorStyles: Record<string, string> = {
  orange: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg",
  dark: "bg-gray-900 hover:bg-gray-800 text-white shadow-md hover:shadow-lg",
  blue: "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg",
  green: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg",
  emerald: "bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700",
  red: "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg",
  gray: "bg-gray-50 hover:bg-orange-50 border border-gray-100 hover:border-orange-200 text-gray-700 hover:text-orange-700",
  white: "bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 shadow-sm",
};

function ButtonIcon({ name, className }: { name: string; className?: string }) {
  const cls = className || "w-4 h-4";
  switch (name) {
    case "globe": return <Globe className={cls} />;
    case "phone": return <Phone className={cls} />;
    case "mail": return <Mail className={cls} />;
    case "map": return <MapPin className={cls} />;
    case "nav": return <Navigation className={cls} />;
    case "link": return <ExternalLink className={cls} />;
    case "chat": return <MessageCircle className={cls} />;
    case "share": return <Share2 className={cls} />;
    default: return null;
  }
}

interface CtaButton {
  title: string;
  url: string;
  color: string;
  icon: string;
  type: "link" | "lead_form" | "phone_reveal";
}

export function ListingActions({
  listing,
  category,
}: {
  listing: Listing;
  category: Category;
}) {
  const [showLeadForm, setShowLeadForm] = useState(false);

  const sc = listing.section_content as Record<string, unknown> | undefined;
  const customButtons = (sc?.cta_buttons || []) as CtaButton[];
  const hasCustomButtons = customButtons.length > 0;

  return (
    <>
      {hasCustomButtons ? (
        /* ── Render custom CTA buttons from admin ── */
        customButtons.map((btn, i) => {
          if (btn.type === "lead_form") {
            const isHexLf = btn.color?.startsWith("#");
            const cls = `flex items-center justify-center gap-2.5 w-full px-5 py-4 rounded-2xl text-[15px] font-bold transition-all ${isHexLf ? "text-white shadow-md hover:shadow-lg hover:opacity-90" : buttonColorStyles[btn.color] || buttonColorStyles.dark}`;
            const style = isHexLf ? { backgroundColor: btn.color } : undefined;
            // If URL provided, link externally instead of opening internal form
            if (btn.url) {
              return (
                <a key={i} href={btn.url} target="_blank" rel="noopener noreferrer" className={cls} style={style}>
                  <ButtonIcon name={btn.icon} className="h-5 w-5" /> {btn.title}
                </a>
              );
            }
            return (
              <button key={i} onClick={() => setShowLeadForm(true)} className={cls} style={style}>
                <ButtonIcon name={btn.icon} className="h-5 w-5" /> {btn.title}
              </button>
            );
          }
          if (btn.type === "phone_reveal" && listing.phone) {
            return (
              <PhoneReveal key={i} listingId={listing.id} cityId={listing.city_id} phone={listing.phone} />
            );
          }
          const isHex = btn.color?.startsWith("#");
          const isPrimary = btn.color === "orange" || btn.color === "dark" || isHex;
          return (
            <TrackedLink key={i}
              listingId={listing.id} cityId={listing.city_id}
              href={btn.url} eventType="website_click"
              className={`flex items-center justify-center gap-2.5 w-full px-5 ${isPrimary ? "py-4 text-[15px]" : "py-3.5 text-[14px]"} rounded-2xl font-bold transition-all ${isHex ? "text-white shadow-md hover:shadow-lg hover:opacity-90" : buttonColorStyles[btn.color] || buttonColorStyles.gray}`}
              style={isHex ? { backgroundColor: btn.color } : undefined}>
              <ButtonIcon name={btn.icon} className={isPrimary ? "h-5 w-5" : "h-4 w-4"} /> {btn.title}
            </TrackedLink>
          );
        })
      ) : (
        /* ── Default auto-generated buttons ── */
        <>
          {listing.website && (
            listing.is_verified ? (
              <TrackedLink listingId={listing.id} cityId={listing.city_id} href={listing.website} eventType="website_click"
                className="flex items-center justify-center gap-2.5 w-full px-5 py-4 rounded-2xl text-[15px] font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg">
                <Globe className="h-5 w-5" /> Visitar web oficial <ExternalLink className="w-4 h-4" />
              </TrackedLink>
            ) : (
              <a href="/colaborar" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full px-5 py-4 rounded-2xl text-[15px] font-bold text-gray-400 bg-gray-100 border border-gray-200 cursor-pointer transition-all hover:bg-gray-200">
                <Globe className="h-5 w-5" /> Visitar web oficial <ExternalLink className="w-4 h-4" />
              </a>
            )
          )}
          <button onClick={() => setShowLeadForm(true)}
            className="flex items-center justify-center gap-2.5 w-full px-5 py-4 rounded-2xl text-[15px] font-bold bg-gray-900 hover:bg-gray-800 text-white transition-all shadow-md hover:shadow-lg">
            <Mail className="h-5 w-5" /> Solicitar informacion
          </button>
          {listing.whatsapp && (
            <TrackedLink listingId={listing.id} cityId={listing.city_id}
              href={`https://wa.me/${listing.whatsapp.replace(/[^0-9]/g, "")}`} eventType="whatsapp_click"
              className="flex items-center justify-center gap-2.5 w-full px-5 py-3.5 rounded-2xl text-[14px] font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 transition-all">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </TrackedLink>
          )}
          {listing.latitude && listing.longitude && (
            <TrackedLink listingId={listing.id} cityId={listing.city_id}
              href={`https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`} eventType="directions_click"
              className="flex items-center justify-center gap-2.5 w-full px-5 py-3.5 rounded-2xl text-[14px] font-semibold bg-gray-50 hover:bg-orange-50 border border-gray-100 hover:border-orange-200 text-gray-700 hover:text-orange-700 transition-all">
              <Navigation className="h-4 w-4" /> Como llegar
            </TrackedLink>
          )}
        </>
      )}

      {/* Lead form modal */}
      {showLeadForm && (
        <LeadForm listingId={listing.id} listingName={listing.name} cityId={listing.city_id}
          onClose={() => setShowLeadForm(false)} />
      )}
    </>
  );
}

export function LeadFormWrapper({ listing }: { listing: Listing }) {
  return (
    <ShareButtons
      listingId={listing.id}
      cityId={listing.city_id}
      url={`/${listing.category?.slug || "listing"}/${listing.slug}`}
      title={listing.name}
    />
  );
}

// ── Sticky Section Navigation ──

export function StickyNavigation({ sections }: { sections: { id: string; label: string }[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id || "");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  // Auto-scroll nav to keep active button visible
  useEffect(() => {
    if (!scrollRef.current || !activeId) return;
    const activeBtn = scrollRef.current.querySelector(`[data-section="${activeId}"]`) as HTMLElement | null;
    if (activeBtn) {
      activeBtn.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
    }
  }, [activeId]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <nav className="sticky top-[60px] z-40 border-b border-gray-100 bg-white shadow-sm">
      <div ref={scrollRef} className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 flex overflow-x-auto scrollbar-hide">
        {sections.map(({ id, label }) => (
          <button
            key={id}
            data-section={id}
            onClick={() => scrollTo(id)}
            className={`whitespace-nowrap shrink-0 px-3 sm:px-4 py-3.5 sm:py-3 text-[13px] font-semibold transition-all duration-200 border-b-2 ${
              activeId === id
                ? "border-blue-700 text-blue-700 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-orange-600 hover:border-orange-400"
            }`}
          >
            {label}
          </button>
        ))}
        <div className="shrink-0 pr-4" />
      </div>
    </nav>
  );
}

// ── FAQ Accordion ──

export function FaqAccordion({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="space-y-2">
      {faqs.map((faq, i) => (
        <div key={i} className="rounded-xl border border-gray-100 bg-gray-50/40 overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 text-left"
          >
            <span className="text-[15px] font-semibold text-gray-800 pr-4">{faq.question}</span>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                openIndex === i ? "rotate-180" : ""
              }`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-200 ${
              openIndex === i ? "max-h-96 pb-4" : "max-h-0"
            }`}
          >
            <div className="px-4 sm:px-5 text-[15px] text-gray-600 leading-relaxed">{faq.answer}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Gallery Grid ──

export function GalleryGrid({ images, alt, hiddenCount }: { images: string[]; alt: string; hiddenCount?: number }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showClaimDialog, setShowClaimDialog] = useState(false);

  if (!images || images.length === 0) return null;

  return (
    <>
    <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      {/* Main display image */}
      <div className="relative bg-gray-50">
        <img
          src={images[activeIndex]}
          alt={`${alt} - ${activeIndex + 1}`}
          className="w-full h-auto max-h-[280px] sm:max-h-[420px] object-cover transition-opacity duration-200"
        />
        {/* Counter badge */}
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 bg-black/60 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
            {activeIndex + 1} / {images.length}
          </span>
        )}
        {/* Prev / Next arrows on main image */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all disabled:opacity-0"
            >
              ‹
            </button>
            <button
              onClick={() => setActiveIndex(Math.min(images.length - 1, activeIndex + 1))}
              disabled={activeIndex === images.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all disabled:opacity-0"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnails row */}
      {images.length > 1 && (
        <div className="flex gap-2 p-3 bg-white border-t border-gray-100 overflow-x-auto scrollbar-hide">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                i === activeIndex
                  ? "border-orange-400 ring-1 ring-orange-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <img
                src={url}
                alt={`${alt} - ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
          {hiddenCount && hiddenCount > 0 && (
            <button
              onClick={() => setShowClaimDialog(true)}
              className="shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-0.5 hover:border-gray-400 hover:bg-gray-100 transition-all cursor-pointer"
            >
              <span className="text-[13px] font-bold text-gray-500">+{hiddenCount}</span>
              <span className="text-[9px] font-medium text-gray-400">fotos</span>
            </button>
          )}
        </div>
      )}
    </div>

    {/* Claim dialog */}
    {showClaimDialog && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ backdropFilter: "blur(4px)" }}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowClaimDialog(false)} />
        <div className="relative bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md z-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">¿Es tu negocio?</h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Reclama tu ficha para mostrar todas las fotos de tu negocio y acceder a funciones premium como estadísticas, reseñas y más.
          </p>
          <div className="flex flex-col gap-2.5 mt-6">
            <a
              href="/colaborar"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-all"
            >
              Reclamar mi ficha
            </a>
            <button
              onClick={() => setShowClaimDialog(false)}
              className="w-full rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ── Contact Sidebar (old project style) ──

export function ContactSidebar({
  listing,
  category,
  socialLinks,
}: {
  listing: Listing;
  category: Category;
  socialLinks?: Record<string, string>;
}) {
  const socialPlatforms = [
    { key: "facebook", label: "Facebook" },
    { key: "instagram", label: "Instagram" },
    { key: "twitter", label: "X" },
    { key: "youtube", label: "YouTube" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "tiktok", label: "TikTok" },
  ];

  const activeSocials = socialPlatforms.filter(
    (p) => socialLinks && socialLinks[p.key]
  );

  return (
    <div className="lg:sticky lg:top-[100px] space-y-4">
      {/* Contact card */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Card header with logo */}
        {listing.logo_url && (
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/40">
            <div className="flex items-center justify-center">
              <div className="w-full h-14 rounded-xl bg-white overflow-hidden flex items-center justify-center">
                <img src={listing.logo_url} alt={listing.name} className="max-h-full max-w-full object-contain" />
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="p-4 sm:p-5 space-y-3">
          <ListingActions listing={listing} category={category} />

          {/* Phone & Email compact row */}
          {(listing.phone || listing.email) && (
            <div className="flex gap-2 pt-1">
              {listing.phone && (
                <a href={`tel:${listing.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-orange-50 border border-gray-100 hover:border-orange-200 transition-colors group">
                  <Phone className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
                  <span className="text-[13px] font-semibold text-gray-600">Llamar</span>
                </a>
              )}
              {listing.email && (
                <a href={`mailto:${listing.email}`}
                  className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-orange-50 border border-gray-100 hover:border-orange-200 transition-colors group">
                  <Mail className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
                  <span className="text-[13px] font-semibold text-gray-600">Email</span>
                </a>
              )}
            </div>
          )}

        </div>

        {/* Social links footer */}
        {activeSocials.length > 0 && (
          <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-gray-100 flex items-center gap-1.5">
            <span className="text-[12px] text-gray-400 mr-1">Siguenos</span>
            {activeSocials.map((p) => {
              const svgMap: Record<string, { fg: string; svg: React.ReactNode }> = {
                youtube: { fg: "text-red-500", svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1C4.5 20.5 12 20.5 12 20.5s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" /></svg> },
                facebook: { fg: "text-blue-600", svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z" /></svg> },
                instagram: { fg: "text-pink-500", svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.2 4.8 1.7 5 5 .1 1.3.1 1.6.1 4.9s0 3.6-.1 4.9c-.2 3.3-1.7 4.8-5 5-1.3.1-1.6.1-4.9.1s-3.6 0-4.9-.1c-3.3-.2-4.8-1.7-5-5C2 16.6 2 16.3 2 12s0-3.6.1-4.9c.2-3.3 1.7-4.8 5-5C8.4 2.2 8.8 2.2 12 2.2zm0-2.2C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.2-4.4-2.6-6.8-7-7C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" /></svg> },
                twitter: { fg: "text-gray-700", svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.2 2h3.4l-7.4 8.5L23 22h-6.8l-5.3-7-6.2 7H1.3l7.9-9-8.3-11h7l4.8 6.4L18.2 2zm-1.2 18h1.9L7.2 4H5.1l11.9 16z" /></svg> },
              };
              const s = svgMap[p.key];
              if (!s) return (
                <a key={p.key} href={socialLinks![p.key]} target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 hover:opacity-70 transition-opacity p-1.5 rounded-lg hover:bg-gray-50 text-[12px] font-medium">
                  {p.label}
                </a>
              );
              return (
                <a key={p.key} href={socialLinks![p.key]} target="_blank" rel="noopener noreferrer"
                  title={p.label}
                  className={`${s.fg} hover:opacity-70 transition-opacity p-1.5 rounded-lg hover:bg-gray-50`}>
                  {s.svg}
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Map */}
      {listing.latitude && listing.longitude && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-gray-50/60 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-[14px] text-gray-900">Ubicacion</span>
          </div>
          <div className="aspect-video">
            <iframe
              src={`https://maps.google.com/maps?q=${listing.latitude},${listing.longitude}&z=15&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Mapa de ${listing.name}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mobile Floating CTA Bar ──
// Shows fixed bottom bar on mobile with key actions so users don't have to scroll to sidebar

export function MobileCtaBar({
  listing,
  category,
}: {
  listing: Listing;
  category: Category;
}) {
  const [showLeadForm, setShowLeadForm] = useState(false);

  const sc = listing.section_content as Record<string, unknown> | undefined;
  const customButtons = (sc?.cta_buttons || []) as CtaButton[];
  const primaryBtn = customButtons.find(b => b.type === "lead_form" || b.color === "orange" || b.color === "dark") || customButtons[0];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3">
        <div className="flex gap-2 max-w-lg mx-auto">
          {listing.phone && (
            <a href={`tel:${listing.phone}`}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[14px] transition-colors shrink-0">
              <Phone className="w-4 h-4" /> Llamar
            </a>
          )}
          <button onClick={() => setShowLeadForm(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-[14px] shadow-md transition-all">
            <Mail className="w-4 h-4" /> {primaryBtn?.title || "Solicitar informacion"}
          </button>
        </div>
      </div>

      {showLeadForm && (
        <LeadForm listingId={listing.id} listingName={listing.name} cityId={listing.city_id}
          onClose={() => setShowLeadForm(false)} />
      )}
    </>
  );
}

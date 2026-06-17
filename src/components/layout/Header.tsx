"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Menu, X } from "lucide-react";
import { getCityConfig } from "@/config/city";

// Routes that render their own standalone chrome and should NOT show the site header.
const STANDALONE_PREFIXES = ["/colaborar", "/admin"];

const config = getCityConfig();

const NAV_ITEMS: { label: string; href: string; highlight?: boolean }[] = [
  { label: "Directorio", href: "/directorio" },
  { label: "OFERTAS", href: "/ofertas", highlight: true },
  { label: "Blog", href: `https://${config.newsletterDomain}` },
  { label: "Zonas", href: "/zonas" },
];

export function Header() {
  const pathname = usePathname() || "";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Hide on routes with their own standalone layout
  if (STANDALONE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-warm-200 bg-white/97 backdrop-blur-xl">
      <div className="container-padres">
        <div className="flex h-[60px] items-center justify-between gap-4">
          {/* Logo — brand lockup, shown across the whole site for consistency */}
          <Link href="/" className="flex items-center shrink-0">
            <img
              src="/logo-hori-transparency.png"
              alt={`Papás en ${config.cityName}`}
              className="h-11 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isExternal = item.href.startsWith("http");
              const Tag = isExternal ? "a" : Link;
              const extraProps = isExternal
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {};
              const className = item.highlight
                ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-500 text-white text-[13px] font-extrabold tracking-wide shadow-sm shadow-brand-500/20 hover:bg-brand-600 transition-all active:scale-[0.97]"
                : "px-3.5 py-1.5 rounded-lg text-sm font-medium text-warm-600 transition-colors hover:bg-warm-100 hover:text-ocean-900";
              return (
                <Tag
                  key={item.label}
                  href={item.href}
                  className={className}
                  {...extraProps}
                >
                  {item.highlight && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse" aria-hidden="true" />}
                  {item.label}
                </Tag>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg text-warm-500 hover:text-warm-700 transition-colors"
              aria-label="Buscar"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>

            <a
              href="/colaborar"
              className="btn-copper text-[13px] py-[7px] px-4 hidden sm:inline-flex"
              target="_blank"
              rel="noopener noreferrer"
            >
              Anunciate
            </a>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-warm-500 hover:text-warm-700 transition-colors lg:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Search bar (expandable) */}
        {searchOpen && (
          <div className="pb-4 animate-slide-up">
            <form action="/buscar" method="GET" className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-warm-400" />
              <input
                type="search"
                name="q"
                placeholder={`Buscar en ${config.cityName}...`}
                autoFocus
                className="input-field pl-12"
              />
            </form>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-warm-100 bg-white lg:hidden animate-fade-in">
          <nav className="container-padres py-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isExternal = item.href.startsWith("http");
              const Tag = isExternal ? "a" : Link;
              const extraProps = isExternal
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {};
              const className = item.highlight
                ? "flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-white font-extrabold transition-colors hover:bg-brand-600"
                : "block rounded-lg px-4 py-3 text-warm-700 transition-colors hover:bg-warm-50";
              return (
                <Tag
                  key={item.label}
                  href={item.href}
                  className={className}
                  onClick={() => setMobileOpen(false)}
                  {...extraProps}
                >
                  {item.highlight && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse" aria-hidden="true" />}
                  {item.label}
                </Tag>
              );
            })}
            <div className="pt-2">
              <a
                href="/colaborar"
                className="btn-copper w-full text-center"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
              >
                Anunciate
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

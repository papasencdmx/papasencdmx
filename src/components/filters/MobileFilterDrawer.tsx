"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";

const LANGUAGE_NAMES: Record<string, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  de: "Deutsch",
  zh: "中文",
  ar: "العربية",
  pt: "Português",
  it: "Italiano",
};

const AGE_GROUPS = [
  { value: "0-3", label: "0–3 años" },
  { value: "3-6", label: "3–6 años" },
  { value: "6-12", label: "6–12 años" },
  { value: "12-18", label: "12–18 años" },
];

export interface MobileFilterDrawerProps {
  zones: { id: string; slug: string; name: string; count: number }[];
  subcategories: { id: string; slug: string; name: string; count: number }[];
  languages: { code: string; count: number }[];
  priceRanges: { value: string; count: number }[];
  totalResults: number;
  categorySlug: string;
  hideSubcategories?: boolean;
}

export function MobileFilterDrawer({
  zones,
  subcategories,
  languages,
  priceRanges,
  totalResults,
  categorySlug,
  hideSubcategories,
}: MobileFilterDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const getParam = useCallback(
    (key: string): string[] => {
      const val = searchParams.get(key);
      return val ? val.split(",") : [];
    },
    [searchParams]
  );

  const activeZones = getParam("zone");
  const activeSubcats = getParam("tipo");
  const activePrices = getParam("precio");
  const activeAges = getParam("edad");
  const activeLangs = getParam("idioma");
  const activeVerified = searchParams.get("verificado") === "1";

  const activeFilterCount =
    activeZones.length +
    activeSubcats.length +
    activePrices.length +
    activeAges.length +
    activeLangs.length +
    (activeVerified ? 1 : 0);

  const updateParams = useCallback(
    (key: string, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (values.length > 0) {
        params.set(key, values.join(","));
      } else {
        params.delete(key);
      }
      params.delete("page");
      const qs = params.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const toggleValue = useCallback(
    (key: string, value: string, current: string[]) => {
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      updateParams(key, next);
    },
    [updateParams]
  );

  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  const toggleVerified = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeVerified) {
      params.delete("verificado");
    } else {
      params.set("verificado", "1");
    }
    params.delete("page");
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [router, pathname, searchParams, activeVerified]);

  return (
    <div className="lg:hidden">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-sm font-medium text-warm-700 hover:bg-warm-50 transition-colors shadow-sm"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filtros
        {activeFilterCount > 0 && (
          <span className="ml-1 w-5 h-5 rounded-full bg-ocean-500 text-white text-xs flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Backdrop + Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="relative mt-auto bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-warm-100">
              <h2 className="font-display text-lg font-semibold text-warm-900">
                Filtros
              </h2>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-sm text-ocean-600 hover:text-ocean-700 font-medium"
                  >
                    Borrar todo
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-warm-100 flex items-center justify-center text-warm-500 hover:bg-warm-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Zone filter */}
              {zones.length > 0 && (
                <MobileFilterGroup title="Zona">
                  {zones.map((zone) => (
                    <MobileCheckbox
                      key={zone.slug}
                      label={zone.name}
                      count={zone.count}
                      checked={activeZones.includes(zone.slug)}
                      onChange={() => toggleValue("zone", zone.slug, activeZones)}
                    />
                  ))}
                </MobileFilterGroup>
              )}

              {/* Subcategory filter */}
              {!hideSubcategories && subcategories.length > 0 && (
                <MobileFilterGroup title="Tipo">
                  {subcategories.map((sub) => (
                    <MobileCheckbox
                      key={sub.slug}
                      label={sub.name}
                      count={sub.count}
                      checked={activeSubcats.includes(sub.slug)}
                      onChange={() => toggleValue("tipo", sub.slug, activeSubcats)}
                    />
                  ))}
                </MobileFilterGroup>
              )}

              {/* Price filter */}
              {priceRanges.length > 0 && (
                <MobileFilterGroup title="Precio">
                  {priceRanges.map((pr) => (
                    <MobileCheckbox
                      key={pr.value}
                      label={pr.value}
                      count={pr.count}
                      checked={activePrices.includes(pr.value)}
                      onChange={() => toggleValue("precio", pr.value, activePrices)}
                    />
                  ))}
                </MobileFilterGroup>
              )}

              {/* Age filter */}
              <MobileFilterGroup title="Edad">
                {AGE_GROUPS.map((ag) => (
                  <MobileCheckbox
                    key={ag.value}
                    label={ag.label}
                    checked={activeAges.includes(ag.value)}
                    onChange={() => toggleValue("edad", ag.value, activeAges)}
                  />
                ))}
              </MobileFilterGroup>

              {/* Language filter */}
              {languages.length > 0 && (
                <MobileFilterGroup title="Idioma">
                  {languages.map((lang) => (
                    <MobileCheckbox
                      key={lang.code}
                      label={LANGUAGE_NAMES[lang.code] || lang.code}
                      count={lang.count}
                      checked={activeLangs.includes(lang.code)}
                      onChange={() => toggleValue("idioma", lang.code, activeLangs)}
                    />
                  ))}
                </MobileFilterGroup>
              )}

              {/* Verified toggle */}
              <div className="border-t border-warm-200 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      activeVerified ? "bg-ocean-500" : "bg-warm-300"
                    }`}
                    onClick={toggleVerified}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        activeVerified ? "translate-x-4" : ""
                      }`}
                    />
                  </div>
                  <span className="text-sm text-warm-700">Solo verificados</span>
                </label>
              </div>
            </div>

            {/* Footer with results button */}
            <div className="px-5 py-4 border-t border-warm-100 bg-white">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 rounded-xl bg-warm-900 text-white font-semibold text-sm hover:bg-warm-800 transition-colors"
              >
                Ver {totalResults} resultado{totalResults !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileFilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open>
      <summary className="flex items-center justify-between cursor-pointer select-none mb-2">
        <h3 className="text-sm font-semibold text-warm-800 uppercase tracking-wide">
          {title}
        </h3>
        <span className="text-warm-400 text-xs">▾</span>
      </summary>
      <div className="space-y-2">{children}</div>
    </details>
  );
}

function MobileCheckbox({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 rounded border-warm-300 text-ocean-500 focus:ring-ocean-500 focus:ring-offset-0"
      />
      <span className="text-sm text-warm-700 flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-warm-400">{count}</span>
      )}
    </label>
  );
}

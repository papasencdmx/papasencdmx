"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { X } from "lucide-react";

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

export interface FilterSidebarProps {
  zones: { id: string; slug: string; name: string; count: number }[];
  subcategories: { id: string; slug: string; name: string; count: number }[];
  languages: { code: string; count: number }[];
  priceRanges: { value: string; count: number }[];
  categorySlug: string;
  hideSubcategories?: boolean;
}

export function FilterSidebar({
  zones,
  subcategories,
  languages,
  priceRanges,
  categorySlug,
  hideSubcategories,
}: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const hasActiveFilters =
    activeZones.length > 0 ||
    activeSubcats.length > 0 ||
    activePrices.length > 0 ||
    activeAges.length > 0 ||
    activeLangs.length > 0 ||
    activeVerified;

  const updateParams = useCallback(
    (key: string, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (values.length > 0) {
        params.set(key, values.join(","));
      } else {
        params.delete(key);
      }
      // Reset to page 1 when filters change
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
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-24 space-y-6">
        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 text-sm font-medium text-ocean-600 hover:text-ocean-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Borrar filtros
          </button>
        )}

        {/* Zone filter */}
        {zones.length > 0 && (
          <FilterGroup title="Zona">
            {zones.map((zone) => (
              <CheckboxItem
                key={zone.slug}
                label={zone.name}
                count={zone.count}
                checked={activeZones.includes(zone.slug)}
                onChange={() => toggleValue("zone", zone.slug, activeZones)}
              />
            ))}
          </FilterGroup>
        )}

        {/* Subcategory filter */}
        {!hideSubcategories && subcategories.length > 0 && (
          <FilterGroup title="Tipo">
            {subcategories.map((sub) => (
              <CheckboxItem
                key={sub.slug}
                label={sub.name}
                count={sub.count}
                checked={activeSubcats.includes(sub.slug)}
                onChange={() => toggleValue("tipo", sub.slug, activeSubcats)}
              />
            ))}
          </FilterGroup>
        )}

        {/* Price filter */}
        {priceRanges.length > 0 && (
          <FilterGroup title="Precio">
            {priceRanges.map((pr) => (
              <CheckboxItem
                key={pr.value}
                label={pr.value}
                count={pr.count}
                checked={activePrices.includes(pr.value)}
                onChange={() => toggleValue("precio", pr.value, activePrices)}
              />
            ))}
          </FilterGroup>
        )}

        {/* Age filter */}
        <FilterGroup title="Edad">
          {AGE_GROUPS.map((ag) => (
            <CheckboxItem
              key={ag.value}
              label={ag.label}
              checked={activeAges.includes(ag.value)}
              onChange={() => toggleValue("edad", ag.value, activeAges)}
            />
          ))}
        </FilterGroup>

        {/* Language filter */}
        {languages.length > 0 && (
          <FilterGroup title="Idioma">
            {languages.map((lang) => (
              <CheckboxItem
                key={lang.code}
                label={LANGUAGE_NAMES[lang.code] || lang.code}
                count={lang.count}
                checked={activeLangs.includes(lang.code)}
                onChange={() => toggleValue("idioma", lang.code, activeLangs)}
              />
            ))}
          </FilterGroup>
        )}

        {/* Verified toggle */}
        <div className="border-t border-warm-200 pt-4">
          <label className="flex items-center gap-3 cursor-pointer group">
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
            <span className="text-sm text-warm-700 group-hover:text-warm-900 transition-colors">
              Solo verificados
            </span>
          </label>
        </div>
      </div>
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="group">
      <summary className="flex items-center justify-between cursor-pointer select-none">
        <h3 className="text-sm font-semibold text-warm-800 uppercase tracking-wide">
          {title}
        </h3>
        <span className="text-warm-400 text-xs transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">{children}</div>
    </details>
  );
}

function CheckboxItem({
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
    <label className="flex items-center gap-2 cursor-pointer group py-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-warm-300 text-ocean-500 focus:ring-ocean-500 focus:ring-offset-0"
      />
      <span className="text-sm text-warm-600 group-hover:text-warm-900 transition-colors flex-1">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs text-warm-400">{count}</span>
      )}
    </label>
  );
}

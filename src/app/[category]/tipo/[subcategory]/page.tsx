import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Search, ShieldCheck, Star, Calendar, CheckCircle2 } from "lucide-react";
import { getCategoryBySlug, getSubcategoryBySlug, getListings, getZones, getZoneCountsForSubcategory, getCategorySubcategoryPairs, getFilterCounts, getCategoryStats } from "@/lib/data";
import { subcategoryMetadata, collectionPageSchema, subcategoryBreadcrumbs } from "@/lib/seo";
import { getCityConfig } from "@/config/city";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ListingCard } from "@/components/listings/ListingCard";
import { FilterSidebar } from "@/components/filters/FilterSidebar";
import { MobileFilterDrawer } from "@/components/filters/MobileFilterDrawer";

const config = getCityConfig();
const PER_PAGE = 25;

export async function generateStaticParams() {
  const pairs = await getCategorySubcategoryPairs();
  return pairs.map((p) => ({ category: p.categorySlug, subcategory: p.subcategorySlug }));
}

export async function generateMetadata({ params }: { params: { category: string; subcategory: string } }) {
  const category = await getCategoryBySlug(params.category);
  if (!category) return {};
  const subcategory = await getSubcategoryBySlug(category.id, params.subcategory);
  if (!subcategory) return {};
  const { count } = await getListings({ categoryId: category.id, subcategoryId: subcategory.id, limit: 1 });
  return subcategoryMetadata(category, subcategory, count);
}

export const revalidate = 3600;

export default async function SubcategoryPage({ params, searchParams }: { params: { category: string; subcategory: string }; searchParams: { page?: string; zone?: string; precio?: string; edad?: string; idioma?: string; verificado?: string } }) {
  const category = await getCategoryBySlug(params.category);
  if (!category) notFound();

  const subcategory = await getSubcategoryBySlug(category.id, params.subcategory);
  if (!subcategory) notFound();

  const currentPage = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const offset = (currentPage - 1) * PER_PAGE;

  // Parse filter params
  const filterZoneSlugs = searchParams.zone?.split(",").filter(Boolean) || [];
  const filterPrices = searchParams.precio?.split(",").filter(Boolean) || [];
  const filterAges = searchParams.edad?.split(",").filter(Boolean) || [];
  const filterLangs = searchParams.idioma?.split(",").filter(Boolean) || [];
  const filterVerified = searchParams.verificado === "1";

  // Fetch base data
  const [zones, zoneCounts, filterCounts, stats] = await Promise.all([
    getZones(),
    getZoneCountsForSubcategory(category.id, subcategory.id),
    getFilterCounts(category.id, subcategory.id),
    getCategoryStats(category.id),
  ]);

  // Resolve zone slugs to IDs
  const filterZoneIds = filterZoneSlugs.length > 0
    ? zones.filter((z) => filterZoneSlugs.includes(z.slug)).map((z) => z.id)
    : undefined;

  // Fetch filtered listings
  const { listings, count } = await getListings({
    categoryId: category.id,
    subcategoryId: subcategory.id,
    zoneIds: filterZoneIds,
    priceRange: filterPrices.length > 0 ? filterPrices : undefined,
    ageGroups: filterAges.length > 0 ? filterAges : undefined,
    languages: filterLangs.length > 0 ? filterLangs : undefined,
    verified: filterVerified || undefined,
    limit: PER_PAGE,
    offset,
  });

  const totalPages = Math.ceil(count / PER_PAGE);

  const hasActiveFilters = filterZoneSlugs.length > 0 || filterPrices.length > 0 || filterAges.length > 0 || filterLangs.length > 0 || filterVerified;

  // Build sidebar data
  const sidebarZones = zones
    .filter((z) => (zoneCounts[z.id] || 0) >= 1)
    .map((z) => ({ id: z.id, slug: z.slug, name: z.name, count: zoneCounts[z.id] || 0 }))
    .sort((a, b) => b.count - a.count);

  const buildHref = (page: number) => {
    const p = new URLSearchParams();
    if (page > 1) p.set("page", String(page));
    if (searchParams.zone) p.set("zone", searchParams.zone);
    if (searchParams.precio) p.set("precio", searchParams.precio);
    if (searchParams.edad) p.set("edad", searchParams.edad);
    if (searchParams.idioma) p.set("idioma", searchParams.idioma);
    if (searchParams.verificado) p.set("verificado", searchParams.verificado);
    const qs = p.toString();
    const base = `/${category.slug}/tipo/${subcategory.slug}`;
    return `${base}${qs ? `?${qs}` : ""}`;
  };

  const currentMonth = new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  return (
    <>
      <JsonLd
        data={[
          collectionPageSchema(
            `${subcategory.name_long} en ${config.cityName}`,
            `/${category.slug}/tipo/${subcategory.slug}`,
            listings
          ),
        ]}
      />

      {/* ══════════ HERO SECTION ══════════ */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1C1917 0%, #292524 25%, #44403C 50%, #78350F 80%, #92400E 100%)" }}>
        {/* Decorative geometric shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-[0.08]" style={{ background: "radial-gradient(circle, #F08C00 0%, transparent 70%)" }} />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, #FFC170 0%, transparent 70%)" }} />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 21px)" }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        </div>

        <div className="relative container-padres pt-6 pb-6 sm:pb-8">
          <Breadcrumbs items={subcategoryBreadcrumbs(category.name, category.slug, subcategory.name, subcategory.slug)} variant="light" />

          <div className="mt-2 sm:mt-4 max-w-3xl">
            <h1 className="font-display text-display-md sm:text-display-lg text-white leading-tight">
              {subcategory.name_long} en {config.cityName}
            </h1>
            <p className="mt-3 text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl">
              {subcategory.description ||
                `Encuentra los mejores ${subcategory.name_long.toLowerCase()} en ${config.cityName}. ${count}+ opciones verificadas por familias reales.`}
            </p>
          </div>

          {/* Stats Cards — glass morphism */}
          <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/10 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-brand-500/20 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4 text-brand-300" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white leading-none">{count}</p>
                  <p className="text-[11px] text-white/50 mt-0.5 uppercase tracking-wider">Opciones</p>
                </div>
              </div>
            </div>
            {count > 0 && stats.verifiedCount / count >= 0.2 && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/10 px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-verified-500/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-verified-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white leading-none">{stats.verifiedCount}</p>
                    <p className="text-[11px] text-white/50 mt-0.5 uppercase tracking-wider">Verificados</p>
                  </div>
                </div>
              </div>
            )}
            {stats.avgRating > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/10 px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-featured-500/20 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 text-featured-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white leading-none">{stats.avgRating}</p>
                    <p className="text-[11px] text-white/50 mt-0.5 uppercase tracking-wider">Media Google</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Trust line */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-white/50">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Actualizado {currentMonth}
            </span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-verified-500" />
              Revisado por familias reales
            </span>
          </div>

          {/* Back link */}
          <Link
            href={`/${category.slug}`}
            className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Ver todos los {category.name.toLowerCase()}
          </Link>
        </div>
      </div>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div className="container-padres py-6 sm:py-8">
        {/* Mobile filter button */}
        <div className="mb-4 lg:hidden">
          <MobileFilterDrawer
            zones={sidebarZones}
            subcategories={[]}
            languages={filterCounts.languages}
            priceRanges={filterCounts.priceRanges}
            totalResults={count}
            categorySlug={category.slug}
            hideSubcategories
          />
        </div>

        {/* 2-column layout: sidebar + listings */}
        <div className="flex gap-8 items-start">
          {/* Sidebar */}
          <FilterSidebar
            zones={sidebarZones}
            subcategories={[]}
            languages={filterCounts.languages}
            priceRanges={filterCounts.priceRanges}
            categorySlug={category.slug}
            hideSubcategories
          />

          {/* Listings column */}
          <div className="flex-1 min-w-0">
            {/* Result bar */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-warm-200">
              <h2 className="font-display text-lg sm:text-xl text-warm-900">
                {hasActiveFilters ? (
                  <>{count} resultado{count !== 1 ? "s" : ""}</>
                ) : (
                  <>Todos los {subcategory.name.toLowerCase()} en {config.cityName} <span className="text-warm-400 font-body text-base">({count})</span></>
                )}
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  categorySlug={category.slug}
                />
              ))}
            </div>

            {listings.length === 0 && (
              <div className="rounded-2xl border border-warm-200 bg-warm-50 p-12 text-center">
                <p className="text-warm-500">
                  {hasActiveFilters
                    ? "No hay resultados con los filtros seleccionados. Prueba a quitar algun filtro."
                    : `Todavia no hay ${subcategory.name.toLowerCase()} publicados. Vuelve pronto.`}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                {currentPage > 1 && (
                  <Link
                    href={buildHref(currentPage - 1)}
                    className="w-10 h-10 rounded-xl border border-warm-200 flex items-center justify-center text-warm-500 hover:bg-warm-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1]) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`dot-${i}`} className="w-10 h-10 flex items-center justify-center text-warm-400 text-sm">...</span>
                    ) : (
                      <Link
                        key={p}
                        href={buildHref(p as number)}
                        className={`w-10 h-10 rounded-xl text-sm font-semibold flex items-center justify-center transition-colors ${
                          p === currentPage
                            ? "bg-warm-900 text-white"
                            : "border border-warm-200 text-warm-600 hover:bg-warm-50"
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  )}
                {currentPage < totalPages && (
                  <Link
                    href={buildHref(currentPage + 1)}
                    className="w-10 h-10 rounded-xl border border-warm-200 flex items-center justify-center text-warm-500 hover:bg-warm-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}
            {totalPages > 1 && (
              <p className="text-center text-sm text-warm-400 mt-3">
                Pagina {currentPage} de {totalPages} — {count} {subcategory.name.toLowerCase()}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, ShieldCheck, Star, Users, CheckCircle2, Calendar } from "lucide-react";
import { getCategoryBySlug, getListings, getZones, getZoneCountsForCategory, getSubcategories, getSubcategoryCountsForCategory, getFilterCounts, getCategoryStats } from "@/lib/data";
import { collectionPageSchema, faqSchema, categoryBreadcrumbs } from "@/lib/seo";
import { getCityConfig } from "@/config/city";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ListingCard } from "@/components/listings/ListingCard";
import { SubcategoryPills } from "@/components/SubcategoryPills";
import { FilterSidebar } from "@/components/filters/FilterSidebar";
import { MobileFilterDrawer } from "@/components/filters/MobileFilterDrawer";

const config = getCityConfig();
const PER_PAGE = 25;

export type CategoryViewSearchParams = {
  page?: string;
  zone?: string;
  tipo?: string;
  precio?: string;
  edad?: string;
  idioma?: string;
  verificado?: string;
};

export async function CategoryView({
  categorySlug,
  searchParams,
  basePath,
}: {
  categorySlug: string;
  searchParams: CategoryViewSearchParams;
  basePath?: string;
}) {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const currentPage = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const offset = (currentPage - 1) * PER_PAGE;

  const filterZoneSlugs = searchParams.zone?.split(",").filter(Boolean) || [];
  const filterSubcatSlugs = searchParams.tipo?.split(",").filter(Boolean) || [];
  const filterPrices = searchParams.precio?.split(",").filter(Boolean) || [];
  const filterAges = searchParams.edad?.split(",").filter(Boolean) || [];
  const filterLangs = searchParams.idioma?.split(",").filter(Boolean) || [];
  const filterVerified = searchParams.verificado === "1";

  const [zones, zoneCounts, subcategories, subcategoryCounts, filterCounts, stats] = await Promise.all([
    getZones(),
    getZoneCountsForCategory(category.id),
    getSubcategories(category.id),
    getSubcategoryCountsForCategory(category.id),
    getFilterCounts(category.id),
    getCategoryStats(category.id),
  ]);

  const filterZoneIds = filterZoneSlugs.length > 0
    ? zones.filter((z) => filterZoneSlugs.includes(z.slug)).map((z) => z.id)
    : undefined;

  const filterSubcatIds = filterSubcatSlugs.length > 0
    ? subcategories.filter((s) => filterSubcatSlugs.includes(s.slug)).map((s) => s.id)
    : undefined;

  const { listings, count } = await getListings({
    categoryId: category.id,
    zoneIds: filterZoneIds,
    subcategoryIds: filterSubcatIds,
    priceRange: filterPrices.length > 0 ? filterPrices : undefined,
    ageGroups: filterAges.length > 0 ? filterAges : undefined,
    languages: filterLangs.length > 0 ? filterLangs : undefined,
    verified: filterVerified || undefined,
    limit: PER_PAGE,
    offset,
  });

  const sidebarZones = zones
    .filter((z) => (zoneCounts[z.id] || 0) >= 1)
    .map((z) => ({ id: z.id, slug: z.slug, name: z.name, count: zoneCounts[z.id] || 0 }))
    .sort((a, b) => b.count - a.count);

  const sidebarSubcategories = subcategories
    .filter((s) => (subcategoryCounts[s.id] || 0) > 0)
    .map((s) => ({ id: s.id, slug: s.slug, name: s.name, count: subcategoryCounts[s.id] || 0 }));

  const subcategoryPills = subcategories
    .filter((s) => (subcategoryCounts[s.id] || 0) > 0)
    .map((s) => ({ slug: s.slug, name: s.name, count: subcategoryCounts[s.id] || 0 }));

  const totalPages = Math.ceil(count / PER_PAGE);
  const hasActiveFilters = filterZoneSlugs.length > 0 || filterSubcatSlugs.length > 0 || filterPrices.length > 0 || filterAges.length > 0 || filterLangs.length > 0 || filterVerified;

  const linkBase = basePath ?? `/${category.slug}`;

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (searchParams.zone) params.set("zone", searchParams.zone);
    if (searchParams.tipo) params.set("tipo", searchParams.tipo);
    if (searchParams.precio) params.set("precio", searchParams.precio);
    if (searchParams.edad) params.set("edad", searchParams.edad);
    if (searchParams.idioma) params.set("idioma", searchParams.idioma);
    if (searchParams.verificado) params.set("verificado", searchParams.verificado);
    const qs = params.toString();
    return `${linkBase}${qs ? `?${qs}` : ""}`;
  };

  const faqs = [
    {
      question: `¿Cuantos ${category.name.toLowerCase()} hay en ${config.cityName}?`,
      answer: `Actualmente tenemos ${count} ${category.name.toLowerCase()} verificados en ${config.cityName} y alrededores.`,
    },
    {
      question: `¿Como verificais los ${category.name.toLowerCase()}?`,
      answer: `Nuestro equipo revisa cada ${category.name.toLowerCase().replace(/s$/, "")} antes de incluirlo en el directorio. Verificamos informacion de contacto, ubicacion y servicios ofrecidos.`,
    },
    {
      question: `¿Es gratis buscar ${category.name.toLowerCase()} en Papás en ${config.cityName}?`,
      answer: `Si, la busqueda y consulta del directorio es completamente gratuita para las familias.`,
    },
  ];

  const currentMonth = new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  const subscriberLabel = config.subscriberCount >= 1000
    ? `${Math.round(config.subscriberCount / 1000)}K+`
    : `${config.subscriberCount}`;

  return (
    <>
      <JsonLd
        data={[
          collectionPageSchema(
            `${category.name_long} en ${config.cityName}`,
            `/${category.slug}`,
            listings
          ),
          faqSchema(faqs),
        ]}
      />

      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1C1917 0%, #292524 25%, #44403C 50%, #78350F 80%, #92400E 100%)" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-[0.08]" style={{ background: "radial-gradient(circle, #F08C00 0%, transparent 70%)" }} />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, #FFC170 0%, transparent 70%)" }} />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 21px)" }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        </div>

        <div className="relative container-padres pt-6 pb-6 sm:pb-8">
          <Breadcrumbs items={categoryBreadcrumbs(category.name, category.slug)} variant="light" />

          <div className="mt-2 sm:mt-4 max-w-3xl">
            <h1 className="font-display text-display-md sm:text-display-lg text-white leading-tight">
              {category.name_long} en {config.cityName}
            </h1>
            <p className="mt-3 text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl">
              {category.description ||
                `Encuentra los mejores ${category.name_long.toLowerCase()} en ${config.cityName}. ${count}+ opciones verificadas por familias reales.`}
            </p>
          </div>

          <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            {/* Verified pill — only show when ≥20% of listings are verified (positive trust signal) */}
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
            {config.subscriberCount > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/10 px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-ocean-500/20 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-ocean-300" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white leading-none">{subscriberLabel}</p>
                    <p className="text-[11px] text-white/50 mt-0.5 uppercase tracking-wider">Familias</p>
                  </div>
                </div>
              </div>
            )}
          </div>

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

          {subcategoryPills.length > 0 && (
            <div className="mt-5">
              <SubcategoryPills
                categorySlug={category.slug}
                subcategories={subcategoryPills}
                totalCount={count}
                variant="hero"
              />
            </div>
          )}
        </div>
      </div>

      <div className="container-padres py-6 sm:py-8">
        <div className="mb-4 lg:hidden">
          <MobileFilterDrawer
            zones={sidebarZones}
            subcategories={sidebarSubcategories}
            languages={filterCounts.languages}
            priceRanges={filterCounts.priceRanges}
            totalResults={count}
            categorySlug={category.slug}
          />
        </div>

        <div className="flex gap-8 items-start">
          <FilterSidebar
            zones={sidebarZones}
            subcategories={sidebarSubcategories}
            languages={filterCounts.languages}
            priceRanges={filterCounts.priceRanges}
            categorySlug={category.slug}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-warm-200">
              <h2 className="font-display text-lg sm:text-xl text-warm-900">
                {hasActiveFilters ? (
                  <>{count} resultado{count !== 1 ? "s" : ""}</>
                ) : (
                  <>Todos los {category.name.toLowerCase()} en {config.cityName} <span className="text-warm-400 font-body text-base">({count})</span></>
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
                    : `Todavia no hay ${category.name.toLowerCase()} publicados. Vuelve pronto.`}
                </p>
              </div>
            )}

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
                Pagina {currentPage} de {totalPages} — {count} {category.name.toLowerCase()}
              </p>
            )}
          </div>
        </div>

        {category.como_elegir && (
          <section className="mt-16 max-w-3xl">
            <h2 className="font-display text-display-sm text-warm-900 mb-4">
              Como elegir {category.name.toLowerCase().replace(/s$/, "")} en {config.cityName}
            </h2>
            <div className="prose prose-warm text-warm-600 leading-relaxed">
              <p>{category.como_elegir}</p>
            </div>
          </section>
        )}

        <section className="mt-16 max-w-3xl">
          <h2 className="font-display text-display-sm text-warm-900 mb-6">
            Preguntas frecuentes
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-warm-200 bg-white"
              >
                <summary className="flex cursor-pointer items-center justify-between p-5 font-body font-semibold text-warm-800">
                  {faq.question}
                  <span className="text-warm-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="px-5 pb-5 text-warm-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Partner acquisition CTA — adapts to category */}
        <section className="mt-16">
          <div className="rounded-3xl bg-gradient-to-r from-ocean-900 to-ocean-800 px-6 py-8 sm:px-10 sm:py-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-display text-xl font-extrabold text-white">
                {partnerCtaCopy(category.slug)}
              </p>
              <p className="text-ocean-200 mt-1 text-sm">
                Únete gratis y llega a miles de familias en {config.cityName}.
              </p>
            </div>
            <a
              href="/colaborar"
              className="shrink-0 inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-600 transition"
            >
              Enviar mi propuesta →
            </a>
          </div>
        </section>
      </div>
    </>
  );
}

function partnerCtaCopy(slug: string): string {
  switch (slug) {
    case "campamentos":
      return "¿Organizas un campamento?";
    case "colegios":
      return "¿Tienes un colegio?";
    case "extraescolares":
      return "¿Ofreces actividades extraescolares?";
    case "ocio-familiar":
      return "¿Organizas planes para familias?";
    case "deportes":
      return "¿Diriges un club o academia deportiva?";
    case "salud":
      return "¿Tienes una consulta familiar?";
    default:
      return "¿Tienes un negocio para familias?";
  }
}

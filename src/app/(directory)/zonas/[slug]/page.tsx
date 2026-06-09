import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getZoneBySlug, getCategories, getListings, getCategoryCountsForZone, getAdjacentZones } from "@/lib/data";
import { zoneMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ListingCard } from "@/components/listings/ListingCard";
import { getCityConfig } from "@/config/city";

const config = getCityConfig();

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const zone = await getZoneBySlug(params.slug);
  if (!zone) return {};
  return zoneMetadata(zone);
}

export const revalidate = 3600;

export default async function ZoneHubPage({ params }: { params: { slug: string } }) {
  const zone = await getZoneBySlug(params.slug);
  if (!zone) notFound();

  const [categories, categoryCounts, adjacentZones] = await Promise.all([
    getCategories(),
    getCategoryCountsForZone(zone.id),
    getAdjacentZones(zone.id),
  ]);

  // Only show categories with listings in this zone
  const catsWithListings = categories.filter((c) => (categoryCounts[c.id] || 0) > 0);

  // Fetch top 3 listings per category
  const categoryListings = await Promise.all(
    catsWithListings.map(async (cat) => {
      const { listings } = await getListings({ categoryId: cat.id, zoneId: zone.id, limit: 3 });
      return { category: cat, listings };
    })
  );

  return (
    <div className="container-padres py-8">
      <Breadcrumbs
        items={[
          { name: "Inicio", href: "/" },
          { name: "Zonas", href: "/zonas" },
          { name: zone.name, href: `/zonas/${zone.slug}` },
        ]}
      />

      <div className="max-w-3xl">
        <h1 className="font-display text-display-md sm:text-display-lg text-warm-900">
          {zone.name} para Familias
        </h1>
        <p className="mt-3 text-lg text-warm-600 leading-relaxed">
          {zone.hub_description ||
            `Descubre los mejores servicios para familias en ${zone.name}, ${config.cityName}.`}
        </p>
      </div>

      {/* Category sections */}
      {categoryListings.map(({ category, listings }) => (
        <section key={category.slug} className="mt-12">
          <div className="flex items-end justify-between mb-6">
            <h2 className="font-display text-display-sm text-warm-900">
              {category.name}
            </h2>
            <Link
              href={`/${category.slug}/${zone.slug}`}
              className="btn-ghost text-brand-600 text-sm"
            >
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} categorySlug={category.slug} />
            ))}
          </div>
        </section>
      ))}

      {/* Adjacent zones */}
      {adjacentZones.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-display-sm text-warm-900 mb-4">
            Zonas cercanas
          </h2>
          <div className="flex flex-wrap gap-3">
            {adjacentZones.map((adj) => (
              <Link key={adj.slug} href={`/zonas/${adj.slug}`} className="btn-secondary text-sm">
                {adj.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

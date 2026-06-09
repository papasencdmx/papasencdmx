import Link from "next/link";
import { MapPin } from "lucide-react";
import { getZones } from "@/lib/data";
import { getCityConfig } from "@/config/city";
import type { Metadata } from "next";

const config = getCityConfig();

export const metadata: Metadata = {
  title: `Zonas para Familias en ${config.cityName} | Papás en ${config.cityName}`,
  description: `Explora el directorio familiar por zonas de ${config.cityName}. Encuentra campamentos, colegios, extraescolares y mas cerca de ti.`,
};

export const revalidate = 3600;

export default async function ZonasPage() {
  const zones = await getZones();
  const grouped = {
    distrito: zones.filter((z) => z.type === "distrito"),
    barrio: zones.filter((z) => z.type === "barrio"),
    municipio: zones.filter((z) => z.type === "municipio"),
  };

  return (
    <div className="container-padres py-8 section-padding">
      <h1 className="font-display text-display-md sm:text-display-lg text-warm-900">
        Zonas de {config.cityName}
      </h1>
      <p className="mt-3 text-lg text-warm-600">
        Encuentra servicios para familias cerca de ti
      </p>

      {Object.entries(grouped).map(([type, zoneList]) =>
        zoneList.length > 0 ? (
          <section key={type} className="mt-12">
            <h2 className="font-display text-display-sm text-warm-900 mb-6 capitalize">
              {type === "distrito" ? "Distritos" : type === "barrio" ? "Barrios" : "Municipios"}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {zoneList.map((zone) => (
                <Link
                  key={zone.slug}
                  href={`/zonas/${zone.slug}`}
                  className="card group flex items-center gap-3 p-4 hover:border-ocean-300"
                >
                  <MapPin className="h-5 w-5 text-ocean-400" />
                  <h3 className="font-body font-semibold text-warm-900 group-hover:text-ocean-600 transition-colors">
                    {zone.name}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        ) : null
      )}
    </div>
  );
}

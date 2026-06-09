import type { Metadata } from "next";
import { SectionListingPage } from "../_shared/SectionListingPage";
import { getCityConfig } from "@/config/city";

const config = getCityConfig();

export const metadata: Metadata = {
  title: `Colegios en ${config.cityName} — Jornadas de puertas abiertas y visitas | Papás en ${config.cityName}`,
  description: `Reserva tu plaza en jornadas de puertas abiertas, visitas guiadas y charlas informativas de colegios en ${config.cityName}.`,
  alternates: { canonical: "/ofertas/colegios" },
};

export const revalidate = 1800;

export default function EventosColegiosPage() {
  return <SectionListingPage section="colegios" />;
}

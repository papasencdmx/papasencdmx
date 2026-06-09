import type { Metadata } from "next";
import { SectionListingPage } from "../_shared/SectionListingPage";
import { getCityConfig } from "@/config/city";

const config = getCityConfig();

export const metadata: Metadata = {
  title: `Campamentos en ${config.cityName} — Reserva directa | Papás en ${config.cityName}`,
  description: `Campamentos urbanos, de naturaleza, deportivos y en inglés en ${config.cityName}. Reserva directamente desde la web.`,
  alternates: { canonical: "/ofertas/campamentos" },
};

export const revalidate = 1800;

export default function EventosCampamentosPage() {
  return <SectionListingPage section="campamentos" />;
}

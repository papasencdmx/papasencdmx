import { actividadesMetadata } from "@/lib/seo";
import { SectionListingPage } from "../_shared/SectionListingPage";

export const metadata = actividadesMetadata();
export const revalidate = 1800;

export default function ActividadesPage() {
  return <SectionListingPage section="actividades" />;
}

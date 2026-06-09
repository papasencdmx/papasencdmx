import { getCategoryBySlug, getListingCount } from "@/lib/data";
import { categoryMetadata } from "@/lib/seo";
import { CATEGORY_SLUGS } from "@/config/city";
import { CategoryView, type CategoryViewSearchParams } from "@/components/directory/CategoryView";

export async function generateStaticParams() {
  return CATEGORY_SLUGS.map((slug) => ({ category: slug }));
}

export async function generateMetadata({ params }: { params: { category: string } }) {
  const category = await getCategoryBySlug(params.category);
  if (!category) return {};
  const count = await getListingCount(category.id);
  return categoryMetadata(category, count);
}

export const revalidate = 3600;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: CategoryViewSearchParams;
}) {
  return <CategoryView categorySlug={params.category} searchParams={searchParams} />;
}

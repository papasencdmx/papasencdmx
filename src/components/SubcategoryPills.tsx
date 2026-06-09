"use client";

import Link from "next/link";

interface SubcategoryPill {
  slug: string;
  name: string;
  count: number;
}

interface SubcategoryPillsProps {
  categorySlug: string;
  subcategories: SubcategoryPill[];
  totalCount: number;
  activeSlug?: string;
  variant?: "default" | "hero";
}

export function SubcategoryPills({ categorySlug, subcategories, totalCount, activeSlug, variant = "default" }: SubcategoryPillsProps) {
  if (subcategories.length === 0) return null;

  const isHero = variant === "hero";

  return (
    <div className="mt-6 -mx-4 px-4 overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 pb-2">
        <Link
          href={`/${categorySlug}`}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            !activeSlug
              ? isHero
                ? "bg-white text-warm-900"
                : "bg-gray-900 text-white"
              : isHero
                ? "bg-white/15 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25"
                : "bg-white border border-[#E0E0E0] text-[#454545] hover:border-gray-400"
          }`}
        >
          Todos ({totalCount})
        </Link>
        {subcategories.map((sub) => (
          <Link
            key={sub.slug}
            href={`/${categorySlug}/tipo/${sub.slug}`}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeSlug === sub.slug
                ? isHero
                  ? "bg-white text-warm-900"
                  : "bg-gray-900 text-white"
                : isHero
                  ? "bg-white/15 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25"
                  : "bg-white border border-[#E0E0E0] text-[#454545] hover:border-gray-400"
            }`}
          >
            {sub.name} ({sub.count})
          </Link>
        ))}
      </div>
    </div>
  );
}

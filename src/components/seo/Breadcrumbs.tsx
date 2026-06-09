import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import type { BreadcrumbItem } from "@/types";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";

export function Breadcrumbs({ items, variant = "default" }: { items: BreadcrumbItem[]; variant?: "default" | "light" }) {
  const isLight = variant === "light";
  return (
    <>
      <JsonLd data={breadcrumbSchema(items)} />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs sm:text-sm ${isLight ? "text-white/70" : "text-warm-500"}`}>
          {items.map((item, i) => (
            <li key={item.href} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className={`h-3.5 w-3.5 ${isLight ? "text-white/40" : "text-warm-300"}`} />}
              {i === 0 ? (
                <Link
                  href={item.href}
                  className={`flex items-center gap-1 transition-colors ${isLight ? "hover:text-white" : "hover:text-brand-500"}`}
                >
                  <Home className="h-3.5 w-3.5" />
                  <span className="sr-only">{item.name}</span>
                </Link>
              ) : i === items.length - 1 ? (
                <span className={`font-medium ${isLight ? "text-white/90" : "text-warm-700"}`}>{item.name}</span>
              ) : (
                <Link
                  href={item.href}
                  className={`transition-colors ${isLight ? "hover:text-white" : "hover:text-brand-500"}`}
                >
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

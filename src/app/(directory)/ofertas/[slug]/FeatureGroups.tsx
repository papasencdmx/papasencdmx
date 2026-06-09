import { Plus, Minus } from "lucide-react";
import { IconPreview } from "@/components/admin/IconPicker";
import type { EventFeature } from "@/types";

interface FeatureGroupsProps {
  features: EventFeature[];
}

export function FeatureGroups({ features }: FeatureGroupsProps) {
  if (!features || features.length === 0) return null;
  return (
    <section className="pt-2">
      <h2 className="font-display text-[28px] sm:text-[32px] font-extrabold text-warm-900 mb-6 leading-tight tracking-tight">
        ¿Qué incluye?
      </h2>
      <div className="divide-y divide-warm-100">
        {features.map((group, i) => (
          <details
            key={group.id}
            className="group py-4 first:pt-0 last:pb-0"
            {...(i === 0 ? { open: true } : {})}
          >
            <summary className="flex items-center gap-4 cursor-pointer list-none select-none py-1">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-warm-200 bg-white">
                <IconPreview name={group.icon_name} className="h-5 w-5 text-warm-800" />
              </div>
              <div className="flex-1 min-w-0 flex items-baseline gap-2 flex-wrap">
                <span className="font-bold text-warm-900 text-base sm:text-lg">
                  {group.group_name}
                </span>
                <span className="text-sm text-warm-500">
                  ({group.items?.length || 0}{" "}
                  {(group.items?.length || 0) === 1 ? "elemento" : "elementos"})
                </span>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-warm-500 transition-transform group-open:hidden">
                <Plus className="h-4 w-4" />
              </div>
              <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-warm-500 group-open:flex">
                <Minus className="h-4 w-4" />
              </div>
            </summary>

            {group.items && group.items.length > 0 && (
              <ul className="mt-3 pl-[60px] space-y-1.5 text-[15px] text-warm-600 leading-relaxed">
                {group.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-warm-300 mt-[9px] shrink-0" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </details>
        ))}
      </div>
    </section>
  );
}

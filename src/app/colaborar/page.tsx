import { Suspense } from "react";
import { ColaborarForm } from "./ColaborarForm";
import { Faq } from "./Faq";
import { ColaborarHero } from "./ColaborarHero";

export default function ColaborarPage() {
    return (
        <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-14 pt-12 sm:pt-20 pb-24">
            <Suspense>
                <ColaborarHero />
            </Suspense>

            <Suspense>
                <ColaborarForm />
            </Suspense>

            <Faq />

            <div className="mt-20 flex items-center gap-4">
                <span className="flex-1 h-px bg-warm-300" aria-hidden="true" />
                <span className="text-[10px] uppercase tracking-[0.28em] font-bold text-warm-500">
                    Hecho a mano en la CDMX
                </span>
                <span className="flex-1 h-px bg-warm-300" aria-hidden="true" />
            </div>
        </div>
    );
}

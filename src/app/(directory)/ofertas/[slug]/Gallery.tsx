"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";

interface GalleryProps {
  title: string;
  images: string[]; // all images (first is the cover)
}

export function Gallery({ title, images }: GalleryProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, images.length]);

  if (images.length === 0) {
    return (
      <div className="aspect-[16/9] sm:aspect-[21/9] rounded-3xl bg-gradient-to-br from-warm-100 to-warm-200" />
    );
  }

  const primary = images[0];
  const rightTop = images[1];
  const rightBot = images[2];

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };

  const Placeholder = () => (
    <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-warm-100 via-warm-50 to-warm-200 border border-dashed border-warm-300 flex items-center justify-center">
      <span className="text-[11px] font-semibold text-warm-400 uppercase tracking-wider">Foto</span>
    </div>
  );

  return (
    <>
      <div className="relative">
        {/* Always render Airbnb 2/3 + stacked layout. Missing slots get placeholders. */}
        <div className="hidden sm:grid grid-cols-3 gap-2 rounded-3xl overflow-hidden">
          <button
            type="button"
            onClick={() => openAt(0)}
            className="col-span-2 relative aspect-[4/3] overflow-hidden rounded-2xl group"
          >
            <Image
              src={primary}
              alt={title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </button>
          <div className="grid grid-rows-2 gap-2">
            {rightTop ? (
              <button
                type="button"
                onClick={() => openAt(1)}
                className="relative overflow-hidden rounded-2xl group"
              >
                <Image
                  src={rightTop}
                  alt=""
                  fill
                  sizes="33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </button>
            ) : (
              <Placeholder />
            )}
            {rightBot ? (
              <button
                type="button"
                onClick={() => openAt(2)}
                className="relative overflow-hidden rounded-2xl group"
              >
                <Image
                  src={rightBot}
                  alt=""
                  fill
                  sizes="33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                {images.length > 3 && (
                  <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center font-semibold text-sm">
                    +{images.length - 3} más
                  </div>
                )}
              </button>
            ) : (
              <Placeholder />
            )}
          </div>
        </div>

        {/* Mobile: single hero only */}
        <div className="sm:hidden">
          <button
            type="button"
            onClick={() => openAt(0)}
            className="block relative aspect-[16/9] w-full overflow-hidden rounded-3xl group"
          >
            <Image
              src={primary}
              alt={title}
              fill
              priority
              sizes="100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </button>
        </div>

        {images.length > 1 && (
          <button
            type="button"
            onClick={() => openAt(0)}
            className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur px-3.5 py-2 text-[12px] font-semibold text-warm-900 shadow-md hover:bg-white transition-colors"
          >
            <Images className="h-3.5 w-3.5" /> Mostrar fotos ({images.length})
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
                className="absolute left-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % images.length)}
                className="absolute right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                aria-label="Siguiente"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div className="relative w-[min(96vw,1200px)] h-[min(92vh,800px)]">
            <Image
              src={images[index]}
              alt={`${title} ${index + 1}`}
              fill
              sizes="90vw"
              className="object-contain"
              priority
            />
          </div>

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-xs">
            {index + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}

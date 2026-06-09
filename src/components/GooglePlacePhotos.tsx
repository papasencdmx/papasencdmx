"use client";

declare global {
  interface Window {
    google?: {
      maps?: {
        importLibrary?: (lib: string) => Promise<unknown>;
      };
    };
  }
}

import { useEffect, useRef, useState } from "react";

interface GooglePlacePhotosProps {
  placeId: string;
  alt?: string;
  singlePhoto?: boolean;
}

/* Fixed height so skeleton and loaded widget are the same size */
const WIDGET_HEIGHT = 420;

export function GooglePlacePhotos({ placeId, alt, singlePhoto }: GooglePlacePhotosProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !placeId) {
      setStatus("error");
      return;
    }

    const loadScript = (): Promise<void> => {
      if (window.google?.maps?.importLibrary) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
          const check = setInterval(() => {
            if (window.google?.maps?.importLibrary) {
              clearInterval(check);
              resolve();
            }
          }, 100);
          setTimeout(() => { clearInterval(check); reject(new Error("Timeout")); }, 10000);
          return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Google Maps"));
        document.head.appendChild(script);
      });
    };

    let mounted = true;

    loadScript()
      .then(() => window.google!.maps!.importLibrary!("places"))
      .then(() => {
        if (!mounted || !containerRef.current) return;

        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }

        const details = document.createElement("gmp-place-details");
        details.setAttribute("size", "x-large");

        const request = document.createElement("gmp-place-details-place-request");
        request.setAttribute("place", placeId);
        details.appendChild(request);

        const config = document.createElement("gmp-place-content-config");
        const media = document.createElement("gmp-place-media");
        media.setAttribute("lightbox-preferred", "");
        config.appendChild(media);
        const attribution = document.createElement("gmp-place-attribution");
        attribution.setAttribute("light-scheme-color", "gray");
        config.appendChild(attribution);
        details.appendChild(config);

        details.addEventListener("gmp-requesterror", () => {
          if (mounted) setStatus("error");
        });

        details.addEventListener("gmp-load", () => {
          if (mounted) setStatus("ready");
        });

        containerRef.current.appendChild(details);

        // Fallback: if no event fires after 4s, show it anyway
        setTimeout(() => {
          if (mounted) setStatus((s) => s === "loading" ? "ready" : s);
        }, 4000);
      })
      .catch(() => {
        if (mounted) setStatus("error");
      });

    return () => { mounted = false; };
  }, [placeId]);

  if (status === "error") return null;

  return (
    <div
      className={`gmp-photos-wrapper relative rounded-2xl overflow-hidden${singlePhoto ? " gmp-single-photo" : ""}`}
      style={{ height: singlePhoto ? 280 : WIDGET_HEIGHT }}
      aria-label={alt ? `Fotos de ${alt}` : "Fotos de Google Maps"}
    >
      {/* Shimmer skeleton — same size as widget */}
      <div
        className={`absolute inset-0 rounded-2xl transition-opacity duration-700 ease-out ${
          status === "ready" ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="h-full w-full rounded-2xl bg-gray-100 overflow-hidden">
          {/* Main photo skeleton */}
          <div className="flex gap-2 h-full p-0">
            <div className="flex-[2] gmp-shimmer rounded-2xl" />
            {!singlePhoto && (
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex-1 gmp-shimmer rounded-tr-2xl" />
                <div className="flex-1 gmp-shimmer rounded-br-2xl" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actual widget — fades in */}
      <div
        ref={containerRef}
        className={`absolute inset-0 transition-opacity duration-700 ease-out ${
          status === "ready" ? "opacity-100" : "opacity-0"
        }`}
      />

      <style jsx global>{`
        .gmp-photos-wrapper {
          overflow: hidden;
        }
        .gmp-photos-wrapper gmp-place-details {
          --gmp-mat-color-surface: transparent;
          max-width: 100%;
          display: block;
          margin-top: -160px;
          border-radius: 0;
        }

        /* Single photo mode — show only main photo, grayscale */
        .gmp-single-photo {
          filter: grayscale(100%);
          opacity: 0.8;
        }
        .gmp-single-photo > div:last-of-type {
          transform: scaleX(1.55);
          transform-origin: left center;
        }

        /* Shimmer animation */
        .gmp-shimmer {
          background: linear-gradient(
            90deg,
            #e5e7eb 0%,
            #f3f4f6 40%,
            #e5e7eb 80%
          );
          background-size: 200% 100%;
          animation: gmp-shimmer 2s ease-in-out infinite;
        }

        @keyframes gmp-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

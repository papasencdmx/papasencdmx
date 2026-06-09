import Link from "next/link";
import { getCityConfig, CATEGORIES } from "@/config/city";

const config = getCityConfig();

const MORE_LINKS = [
  { label: "Eventos", href: "/ofertas" },
  { label: "Blog", href: `https://${config.newsletterDomain}`, external: true },
  { label: "Quienes somos", href: "/quienes-somos" },
  { label: "Contacto", href: "/contacto" },
  { label: "Anunciate", href: "/colaborar", external: true },
];

export function Footer() {
  return (
    <footer className="border-t border-warm-200 bg-ocean-900">
      <div className="container-padres py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <img
              src="/icons/papas_en_cdmx.svg"
              alt={`Papás en ${config.cityName}`}
              className="h-12 w-auto object-contain brightness-0 invert mb-4"
            />
            <p className="text-[13px] leading-relaxed text-white/40 max-w-[240px]">
              Tu guia familiar para vivir en {config.cityName}. Newsletter + directorio verificado.
            </p>
          </div>

          {/* Directorio */}
          <div>
            <h4 className="mb-3 text-[11px] font-bold text-white/55 uppercase tracking-widest">
              Directorio
            </h4>
            <ul className="space-y-2">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/${cat.slug}`}
                    className="text-[13px] text-white/35 transition-colors hover:text-white/70"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Mas */}
          <div>
            <h4 className="mb-3 text-[11px] font-bold text-white/55 uppercase tracking-widest">
              Mas
            </h4>
            <ul className="space-y-2">
              {MORE_LINKS.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.href}
                      className="text-[13px] text-white/35 transition-colors hover:text-white/70"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-[13px] text-white/35 transition-colors hover:text-white/70"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-3 text-[11px] font-bold text-white/55 uppercase tracking-widest">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/aviso-legal" className="text-[13px] text-white/35 transition-colors hover:text-white/70">
                  Aviso Legal
                </Link>
              </li>
              <li>
                <Link href="/politica-privacidad" className="text-[13px] text-white/35 transition-colors hover:text-white/70">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos-uso" className="text-[13px] text-white/35 transition-colors hover:text-white/70">
                  Términos de Uso
                </Link>
              </li>
              <li>
                <Link href="/terminos-compra" className="text-[13px] text-white/35 transition-colors hover:text-white/70">
                  Términos de Compra
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="mb-3 text-[11px] font-bold text-white/55 uppercase tracking-widest">
              Newsletter
            </h4>
            <p className="text-[13px] text-white/35 leading-relaxed mb-3">
              Miércoles y domingos. Los mejores planes para familias.
            </p>
            <a
              href={`https://${config.newsletterDomain}`}
              className="btn-copper text-[13px] py-2 px-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              Suscribete gratis
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-5 border-t border-white/[0.06] text-center space-y-1">
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} Papás en {config.cityName}. Todos los derechos reservados.
          </p>
          <p className="text-[11px] text-white/15">
            Operado por Local Family Network LTD
          </p>
        </div>
      </div>
    </footer>
  );
}

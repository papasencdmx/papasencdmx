import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-padres flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-display text-warm-200">404</p>
      <h1 className="mt-4 font-display text-display-sm text-warm-900">
        Pagina no encontrada
      </h1>
      <p className="mt-2 text-warm-500 max-w-md">
        Lo sentimos, esta pagina no existe o ha sido movida.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-primary">
          <Home className="h-4 w-4" /> Volver al inicio
        </Link>
        <Link href="/campamentos" className="btn-secondary">
          <Search className="h-4 w-4" /> Explorar directorio
        </Link>
      </div>
    </div>
  );
}

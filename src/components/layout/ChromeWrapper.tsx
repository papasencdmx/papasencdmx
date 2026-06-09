"use client";

import { usePathname } from "next/navigation";

const STANDALONE_PREFIXES = ["/colaborar", "/admin"];

/**
 * Hides children (typically the site Footer) on routes that render their own
 * standalone layout chrome. Keeps the root layout simple.
 */
export function ChromeWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || "";
    if (STANDALONE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
        return null;
    }
    return <>{children}</>;
}

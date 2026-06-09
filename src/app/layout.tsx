import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChromeWrapper } from "@/components/layout/ChromeWrapper";
import { CookieBanner } from "@/components/CookieBanner";
import { NewsletterPopup } from "@/components/NewsletterPopup";
import { getCityConfig } from "@/config/city";
import "./globals.css";

const config = getCityConfig();

export const metadata: Metadata = {
  metadataBase: new URL(`https://${config.domain}`),
  title: {
    default: `Papás en ${config.cityName} — Directorio Familiar Verificado`,
    template: `%s | Papás en ${config.cityName}`,
  },
  description: `El directorio de confianza para familias en ${config.cityName}`,
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col overflow-x-hidden">
        <Header />
        <main className="flex-1">{children}</main>
        <ChromeWrapper>
          <Footer />
        </ChromeWrapper>
        <CookieBanner />
        <NewsletterPopup />
      </body>
    </html>
  );
}

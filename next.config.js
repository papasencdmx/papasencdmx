/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Admins paste arbitrary image URLs in the admin panel, so we allow any
    // https image source rather than maintaining an allowlist.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  // ── Beehiiv migration redirects ──
  // All old newsletter URLs redirect to the new subdomain
  async redirects() {
    const newsletterDomain =
      process.env.NEXT_PUBLIC_NEWSLETTER_DOMAIN || "newsletter.padresenmadrid.com";

    return [
      // Redirect all /p/* newsletter posts to subdomain
      {
        source: "/p/:slug*",
        destination: `https://${newsletterDomain}/p/:slug*`,
        permanent: true, // 301 — transfers SEO authority
      },
      // Redirect /subscribe to newsletter
      {
        source: "/subscribe",
        destination: `https://${newsletterDomain}/subscribe`,
        permanent: true,
      },
      // Legacy /eventos* → /ofertas* (rename April 2026, preserves SEO + old email links)
      {
        source: "/eventos",
        destination: "/ofertas",
        permanent: true,
      },
      {
        source: "/eventos/:path*",
        destination: "/ofertas/:path*",
        permanent: true,
      },
    ];
  },

  // ── Headers for SEO and security ──
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

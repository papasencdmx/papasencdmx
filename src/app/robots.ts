import { MetadataRoute } from "next";

const domain = process.env.NEXT_PUBLIC_SITE_DOMAIN || "papasencdmx.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/"],
    },
    sitemap: `https://${domain}/sitemap.xml`,
  };
}

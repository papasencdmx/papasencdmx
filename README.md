<<<<<<< HEAD
# Padres en Madrid — Family Directory

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.local.example .env.local
# Fill in your Supabase URL, keys, and domain
```

### 3. Set up Supabase
Run the SQL schema from `product-scope.md` in your Supabase SQL editor.
Then run the data pipeline to populate listings.

### 4. Run locally
```bash
npm run dev
```
Open http://localhost:3000

### 5. Deploy to Vercel
```bash
# Push to GitHub, then:
# 1. Go to vercel.com
# 2. Import your repo
# 3. Set environment variables
# 4. Deploy
```

## Project Structure

```
src/
  app/
    page.tsx                    — Homepage
    layout.tsx                  — Root layout (header + footer)
    sitemap.ts                  — Dynamic XML sitemap
    robots.ts                   — robots.txt
    not-found.tsx               — 404 page
    [category]/
      page.tsx                  — Category hub (/campamentos/)
      [slug]/
        page.tsx                — Category×Zone OR Listing page
        client-parts.tsx        — Interactive components
    (directory)/
      zonas/
        page.tsx                — Zone index
        [slug]/page.tsx         — Zone hub
      eventos/
        page.tsx                — Events page
    api/
      leads/route.ts            — Lead submission endpoint
      clicks/route.ts           — Click tracking endpoint
  components/
    layout/
      Header.tsx                — Navigation + search
      Footer.tsx                — Footer with links + newsletter CTA
    listings/
      ListingCard.tsx           — Listing card for grids
      LeadCapture.tsx           — Lead form, phone reveal, click tracking
    seo/
      JsonLd.tsx                — Schema markup injection
      Breadcrumbs.tsx           — Visual + schema breadcrumbs
  lib/
    supabase.ts                 — Supabase client
    data.ts                     — All data fetching functions
    seo.ts                      — Meta tag + schema generators
  config/
    city.ts                     — City config (change per deployment)
  types/
    index.ts                    — TypeScript types
```

## Deploying a New City

1. Register the domain (e.g., padresenbarcelona.com)
2. In Vercel, create a new project from the same repo
3. Set environment variables:
   - `NEXT_PUBLIC_CITY_SLUG=barcelona`
   - `NEXT_PUBLIC_SITE_DOMAIN=padresenbarcelona.com`
   - `NEXT_PUBLIC_NEWSLETTER_DOMAIN=newsletter.padresenbarcelona.com`
4. Add zones for Barcelona in Supabase
5. Run the data pipeline for Barcelona
6. Deploy

Same codebase, different config. That's it.
=======
# Padres-En-Madrid-Vercel
Padres en Madrid Build by Vercel
>>>>>>> 19ab39a69a3ee5d1ac31c460f1588f373453ff93

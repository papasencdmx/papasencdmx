# OLD → NEW Project Migration Analysis

> **Old project**: `/Users/sido/padresenespanacom` — Vite + React SPA (client-side rendering)
> **New project**: `/Users/sido/Documents/padres-directory` — Next.js 14 SSR (server-side rendering)

---

## Summary

| Area | Old Project | New Project | Status |
|------|------------|-------------|--------|
| **Framework** | Vite + React (SPA) | Next.js 14 (SSR) | ✅ Migrated |
| **Styling** | Tailwind + shadcn/ui | Tailwind (custom design system) | ✅ Migrated |
| **Database** | Supabase | Supabase | ✅ Same |
| **Newsletter** | External link only | Beehiiv API (live subscribe + posts) | ✅ Improved |
| **SEO** | ❌ None (SPA) | ✅ robots.ts, sitemap.ts, JsonLd | ✅ Improved |
| **Admin / Data Import** | ✅ Full CSV import tool | ❌ Missing | 🔴 Needs migration |
| **Contact Form** | ✅ Full form | ❌ Missing | 🔴 Needs migration |
| **Advertiser Form** | ✅ Full form | ❌ Missing (redirects to external) | 🟡 Evaluate |
| **Static Pages** | ✅ 8 pages | ❌ Missing | 🔴 Needs migration |
| **City Pages** | ✅ CityPage + 6 Anunciate cities | ❌ Missing | 🟡 Evaluate |
| **Zone Pages** | ✅ ZonePage | ✅ /zonas route exists | 🟡 Partial |
| **Standalone Scripts** | ✅ 12+ .mjs scripts | ❌ Missing | 🟡 Evaluate |
| **SQL Migrations** | ✅ 10 migration files | ❌ Missing (schema exists in Supabase) | ⚪ Already applied |

---

## 🔴 MISSING — High Priority

### 1. Admin Panel & CSV Data Import
The old project has a full admin system for importing listings from CSV files.

**Old files:**
- `src/pages/admin/AdminLogin.tsx` — Login with password authentication
- `src/pages/admin/DataImportPage.tsx` (506 lines) — Full CSV import UI with:
  - Drag & drop file upload
  - CSV parsing and preview
  - Duplicate detection (check existing listings by slug)
  - Select all / select new only / select existing only
  - Batch import with progress indicators
  - Replace existing listings option
- `src/hooks/useDataImport.ts` (345 lines) — Import logic:
  - `useImportZones()` — Batch upsert zones
  - `useImportListings()` — Batch import with chunking
  - `useCheckExistingListings()` — Duplicate detection
  - `useCategoryBySlug()`, `useCityBySlug()`, `useZoneBySlug()`
- `src/hooks/useAdminAuth.ts` — Simple password-based admin auth
- `src/lib/importUtils.ts` — CSV parsing utilities
- `src/lib/security.ts` — Admin password validation
- `src/types/import.ts` — TypeScript types for import data

**Action**: Rebuild the admin import tool as `/admin` route in Next.js with the same features.

---

### 2. Contact Page & Form
**Old files:**
- `src/pages/Contacto.tsx` — Contact page with form
- `src/components/forms/ContactForm.tsx` (8.5KB) — Full contact form component

**Action**: Create `/contacto` route with a contact form (probably sending to Supabase or email).

---

### 3. Static / Legal Pages
The old project has several important static pages that don't exist in the new project:

| Page | Old File | New Route | Status |
|------|----------|-----------|--------|
| Sobre Nosotros | `SobreNosotros.tsx` (6.9KB) | `/quienes-somos` | Route dir exists but empty |
| Política de Privacidad | `PoliticaPrivacidad.tsx` (5.6KB) | — | ❌ Missing |
| Términos de Uso | `TerminosUso.tsx` (5.9KB) | — | ❌ Missing |
| Aviso Legal | `Legal.tsx` (3.6KB) | — | ❌ Missing |
| Gracias | `Gracias.tsx` (2.7KB) | — | ❌ Missing |

**Action**: Create these pages in the new project. Legal pages are **required by Spanish law (LSSI-CE)** for any commercial website.

---

### 4. Newsletter Page
**Old file:** `src/pages/Newsletter.tsx` (10.3KB) — Dedicated newsletter landing page

**Action**: Consider creating a dedicated `/newsletter` landing page (the new project only has the hero CTA and bottom CTA).

---

## 🟡 EVALUATE — Medium Priority

### 5. Anunciate / SoyEmpresa (Advertiser Pages)
**Old files:**
- `src/pages/Anunciate.tsx` (7.5KB) — Main advertiser page
- `src/pages/SoyEmpresa.tsx` (19.7KB) — Detailed business offering page
- `src/pages/anunciate-cities/` — 6 city-specific pages (Barcelona, Bilbao, Madrid, Malaga, Sevilla, Valencia)
- `src/components/forms/AdvertiserForm.tsx` (9.4KB) — Form for advertisers

**Current new project**: These links redirect to `https://partners.padresenespana.com/directorio`

**Action**: Decide if you want to keep using the external partners site or bring these pages back.

---

### 6. MediaKit Page
**Old file:** `src/pages/MediaKit.tsx` (9.6KB) — Media kit with stats, audience info, pricing

**Action**: Consider if this is needed for the new project or handled by the external partners site.

---

### 7. City Pages
**Old file:** `src/pages/directory/CityPage.tsx` (22.7KB) — City-specific directory landing

**Action**: The new project is currently single-city (Madrid). If expanding to multiple cities, this will be needed.

---

### 8. Zone Pages
**Old file:** `src/pages/directory/ZonePage.tsx` (7.3KB) — Zone-specific listings (e.g., Sanchinarro, Pozuelo)

**New project**: Has `/zonas` directory but needs verification of full functionality.

---

### 9. Standalone Management Scripts
The old project has many `.mjs` scripts for one-off data operations:

| Script | Purpose |
|--------|---------|
| `create-sek-listing.mjs` | Create SEK school listing |
| `create-sek-el-castillo.mjs` | Create SEK El Castillo listing |
| `create-sek-santa-isabel.mjs` | Create SEK Santa Isabel listing |
| `update-sek-ciudalcampo.mjs` | Update SEK Ciudalcampo data |
| `update-sek-full-content.mjs` | Full content update for SEK (17.7KB) |
| `update-sek-rich-data.mjs` | Rich data updates |
| `set-sek-premium.mjs` | Set SEK listings to premium tier |
| `set-sek-basic.mjs` | Set SEK listings to basic tier |
| `update-logo.mjs` | Update listing logos |
| `fix-sek-logo.mjs` | Fix SEK logo issues |
| `cleanup-demo-listings.mjs` | Remove demo data |
| `hide-demo-listings.mjs` | Hide demo listings |
| `verify-listings.mjs` | Verify listing data |
| `insert-colegios-publicos.mjs` | Insert public school data |
| `test-supabase.mjs` | Test Supabase connection |

**Action**: Most are one-off scripts. The import tool (priority #1) replaces most of these for ongoing data management. Keep as reference.

---

### 10. SQL Migrations
The old project has 10 SQL migration files in `supabase/migrations/`:

| Migration | Purpose |
|-----------|---------|
| `20260129_*` (4 files) | Initial schema setup |
| `20260202_add_csv_import_columns.sql` | CSV import fields |
| `20260202_add_import_rls_policies.sql` | RLS policies for import |
| `20260205_add_colegios_publicos_category.sql` | Public schools category |
| `20260218_add_price_range.sql` | Price range field |
| `20260219_add_filter_fields.sql` | Filter/search fields |
| `add_section_content_open_days.sql` | Open days content |
| `FIX_SUPABASE_FOR_IMPORT.sql` | Import fix patches |

Also at root level:
- `add-all-cities.sql` — Multi-city data
- `add-gallery-price-fields.sql` — Gallery and price fields
- `delete-demo-listings.sql` — Cleanup SQL

**Action**: These are likely already applied to Supabase. Keep as documentation/reference.

---

## ✅ ALREADY IN NEW PROJECT (Same or Better)

| Feature | Notes |
|---------|-------|
| Homepage | Redesigned with Beehiiv integration, custom icons, Lottie animations |
| Category pages | `/[category]` route with SSR |
| Listing pages | `/[category]/[slug]` route with SSR |
| Header / Navbar | Redesigned layout |
| Footer | Redesigned layout |
| Newsletter subscribe | ✅ Beehiiv API (hero + bottom CTA) — **better than old** |
| Newsletter posts | ✅ Live from Beehiiv API — **better than old** |
| SEO | ✅ robots.ts, sitemap.ts, JsonLd schemas — **better than old** |
| Not Found page | ✅ Custom 404 |
| API routes | subscribe, clicks, leads, search, events, directory |
| ListingCard component | ✅ Exists |
| Pagination | ✅ Exists |

---

## 📋 Recommended Migration Order

1. **🔴 Legal pages** (Privacy, Terms, Legal) — Required by law
2. **🔴 Contact page** — Essential for user communication
3. **🔴 Sobre Nosotros** — Brand trust page
4. **🔴 Admin CSV Import** — Essential for data management
5. **🟡 Newsletter landing page** — Nice to have for marketing
6. **🟡 Zone pages** — Verify existing functionality
7. **🟡 Anunciate/SoyEmpresa** — Only if moving away from external partners site
8. **🟡 MediaKit** — Only if needed for advertiser acquisition
9. **⚪ Multi-city support** — Future expansion

---

## Old Project File Map (Reference)

```
padresenespanacom/
├── src/
│   ├── pages/
│   │   ├── Index.tsx                    # Homepage
│   │   ├── Newsletter.tsx               # Newsletter landing
│   │   ├── Anunciate.tsx                # Advertiser page
│   │   ├── SoyEmpresa.tsx               # Business page (19.7KB)
│   │   ├── MediaKit.tsx                 # Media kit
│   │   ├── SobreNosotros.tsx            # About us
│   │   ├── Contacto.tsx                 # Contact
│   │   ├── Gracias.tsx                  # Thank you
│   │   ├── Legal.tsx                    # Legal notice
│   │   ├── PoliticaPrivacidad.tsx       # Privacy policy
│   │   ├── TerminosUso.tsx              # Terms of use
│   │   ├── NotFound.tsx                 # 404
│   │   ├── admin/
│   │   │   ├── AdminLogin.tsx           # Admin login
│   │   │   └── DataImportPage.tsx       # CSV import (506 lines)
│   │   ├── directory/
│   │   │   ├── CategoryPage.tsx         # Category listing (40.7KB)
│   │   │   ├── CityPage.tsx             # City landing (22.7KB)
│   │   │   ├── ListingPage.tsx          # Single listing (47.7KB)
│   │   │   └── ZonePage.tsx             # Zone listing (7.3KB)
│   │   └── anunciate-cities/            # 6 city-specific advertiser pages
│   ├── components/
│   │   ├── forms/
│   │   │   ├── AdvertiserForm.tsx       # Advertiser form
│   │   │   └── ContactForm.tsx          # Contact form
│   │   ├── directory/
│   │   │   ├── ListingCard.tsx          # Listing card
│   │   │   └── Pagination.tsx           # Pagination
│   │   ├── home/
│   │   │   ├── CityGrid.tsx             # Multi-city grid
│   │   │   ├── HeroSearch.tsx           # Hero with search
│   │   │   ├── SpainMap.tsx             # Spain map
│   │   │   └── NetworkGrid.tsx          # Network display
│   │   └── layout/
│   │       ├── Navbar.tsx (13.3KB)
│   │       └── Footer.tsx (13.4KB)
│   ├── hooks/
│   │   ├── useAdminAuth.ts              # Admin authentication
│   │   ├── useDataImport.ts (345 lines) # Import logic
│   │   └── useDirectory.ts              # Directory data hooks
│   ├── lib/
│   │   ├── importUtils.ts               # CSV parsing
│   │   └── security.ts                  # Admin security
│   └── types/
│       ├── directory.ts                 # Directory types
│       └── import.ts                    # Import types
├── supabase/migrations/                 # 10 SQL migration files
└── *.mjs                               # 12+ standalone scripts
```

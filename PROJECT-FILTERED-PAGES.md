# Filtered Pages + Partner Submission System

**Project owner:** Sido
**Spec source:** `sido-spec.md.docx`
**Date:** 2026-05-07
**Stack:** Next.js / Supabase / Vercel (existing — no new services)

---

## TLDR

Three connected pieces, all inside the existing `padresenmadrid.com` app:

1. **Page Builder** (admin) — create/manage filtered listing pages
2. **Submission Form** (`/colaborar`) — public form for partners to submit listings
3. **Filtered Page Template** (public) — `/[slug]` dynamic route with sticky filters and a unified card

Loop: Partner submits → Admin approves → Listing appears on the right filtered page(s).

---

## Critical decisions to make BEFORE coding

These block Phase 1. Answer each in writing before starting.

| # | Decision | Options | Recommendation |
|---|---|---|---|
| 1 | Listings vs. events relationship | A) Listings = directory profile, Events = bookable. Two separate things. <br>B) Listings replace events. <br>C) Both appear on filtered pages. | **A** — keep events booking system intact, add filtered pages on listings only |
| 2 | Route namespacing | Top-level `/[slug]` (collides with `/ofertas`) <br>Or `/p/[slug]` <br>Or replace `/ofertas/*` | **`/p/[slug]`** for v1 — zero conflicts, easy to swap later |
| 3 | Categorization model | Keep FK (`category_id`) only <br>Switch to `tags[]` only <br>Keep both (FK = primary, tags = filtered-page membership) | **Keep both** — `tags[]` already exists, FK already exists |
| 4 | Spam protection | Honeypot only <br>Honeypot + rate limit <br>Honeypot + rate limit + hCaptcha | **Honeypot + rate limit by IP** for v1 (cheap, effective) |

---

## Effort estimate by phase

Total: **~5 working days** (40 hours) for v1, single developer.

### Phase 1 — Database + types (3 hours)

| Task | Type | Time | Notes |
|---|---|---|---|
| Migration: add `pages` table | 🆕 New | 30m | title, slug, hero_*, meta_*, filter_config jsonb, featured_listing_ids[], status enum |
| Migration: add missing columns on `listings` | ⚠️ Extend | 30m | age_max, activity_types[], price_original, price_discounted, discount_percent, dates_start, dates_end, description_short, description_full, booking_url, contact_*, approved_at, approved_by |
| Migration: RLS policies for `pages` + public submission INSERT on `listings` | 🆕 New | 30m | Service role full access; anon INSERT with status=pending, source=submission |
| Update `src/types/index.ts` with new types | ⚠️ Extend | 30m | Page, PageFilterConfig, ListingSubmission |
| Update `src/lib/data.ts` with `getPageBySlug()`, `getListingsByPage()` | 🆕 New | 1h | Array overlap query for listings |

---

### Phase 2 — Universal Listing Card (1 day)

| Task | Type | Time | Notes |
|---|---|---|---|
| Build `<ListingCardUnified />` | 🆕 New | 3h | Single component used everywhere; supports listings AND events; variants: default vs featured (copper left border) |
| WhatsApp share button | 🆕 New | 1h | Uses existing `buildWhatsAppUrl()` helper |
| Save/favorite (localStorage) | 🆕 New | 1h | Heart icon, no auth, optimistic UI |
| Discount badge + age badge overlays | ⚠️ Reuse | 30m | Pattern already in `CampamentoCard` |
| Replace usages in existing pages (`/ofertas/*`, `/[category]/[slug]`, etc.) | ⚠️ Refactor | 1.5h | Only if we choose unification; deferrable |

> ⚠️ **Decision point:** keep the 3 existing cards (`ListingCard`, `CampamentoCard`, `EventCard`) and just add a 4th universal one for `/p/[slug]`? Or unify? My rec: build new, leave existing 3 alone for v1, refactor in v2.

---

### Phase 3 — Filtered Page Template (1.5 days)

| Task | Type | Time | Notes |
|---|---|---|---|
| `/p/[slug]` dynamic route | 🆕 New | 1h | Reads `pages` table, 404 if not found, generateMetadata for SEO |
| Hero section component | 🆕 New | 30m | Compact (200px mobile), brand styling, stats pills |
| Sticky horizontal filter bar (desktop) | 🆕 New | 2h | Pills for Tipo, dropdowns for Zona/Edad/Precio, instant filtering |
| Mobile bottom-sheet filter drawer | 🆕 New | 2h | "Filtros" button with active count badge → bottom sheet → "Ver X resultados" |
| Results count + sort dropdown | 🆕 New | 45m | Live update on filter change |
| Featured listings section (copper left border) | 🆕 New | 30m | Only shown if featured_listing_ids non-empty |
| Organic listings grid + "Cargar más" pagination | 🆕 New | 1h | 12 per batch, button not infinite scroll |
| Empty state | 🆕 New | 30m | Illustration, "Borrar filtros", CTA to /colaborar |
| Footer CTA bar | 🆕 New | 30m | "¿Organizas un campamento? Únete gratis →" |
| SEO: meta tags, JSON-LD CollectionPage, OG | 🆕 New | 1h | Pulls from `pages` table |
| Hook into existing `page_views` analytics | ⚠️ Reuse | 30m | Pass `page_type=other` for now |

---

### Phase 4 — Submission Form `/colaborar` (1 day)

| Task | Type | Time | Notes |
|---|---|---|---|
| Public form route + layout | 🆕 New | 1h | No header/footer clutter, just logo + form |
| Form fields (Sections 1–5) | 🆕 New | 2h | Validation, character counters, mobile-first |
| Activity types multi-select pills | 🆕 New | 1h | Reusable component |
| Image upload + client-side compression | 🆕 New | 2h | Browser-image-compression lib, max 1200px, JPEG q80, EXIF strip |
| Honeypot + rate limit (IP-based) | 🆕 New | 1h | Hidden field + Upstash KV or in-memory map |
| `/api/submissions` POST endpoint | 🆕 New | 1h | Validation, RLS insert, return success |

---

### Phase 5 — Admin Page Manager (4 hours)

| Task | Type | Time | Notes |
|---|---|---|---|
| Add "Páginas" link to admin sidebar | ⚠️ Extend | 15m | `src/app/admin/layout.tsx` |
| `/admin/paginas` list view | 🆕 New | 1.5h | Title, slug, type, status, listings count, actions |
| `/admin/paginas/[id]` create/edit form | 🆕 New | 2h | All fields + filter_config JSON editor |
| Featured listings autocomplete-and-reorder | 🆕 New | 1.5h | Search → click to add → drag to reorder |

---

### Phase 6 — Admin Submission Queue (4 hours)

| Task | Type | Time | Notes |
|---|---|---|---|
| Add "Propuestas" link to sidebar | ⚠️ Extend | 15m | |
| `/admin/propuestas` list with status tabs | 🆕 New | 1h | Pendientes \| Aprobados \| Rechazados |
| Review/edit form (full submission) | 🆕 New | 2h | Edit fields, swap image, set tags, set commission rate |
| Aprobar/Rechazar actions + tag-assignment checkboxes | 🆕 New | 1h | On approve: status=approved, approved_at, approved_by |
| Auto-create `/go/` tracked link on approval | ⚠️ Integrate | 30m | Hook into existing Track Enlaces system |

---

### Phase 7 — Listings page enhancements (2 hours)

| Task | Type | Time | Notes |
|---|---|---|---|
| Filter by status (All/Pending/Approved/Rejected/Archived) | ⚠️ Extend | 30m | Add chips to existing `/admin/listings` |
| Filter by source (All/Manual/Submission) | ⚠️ Extend | 30m | |
| Manual "Add listing" button matching submission form fields | ⚠️ Extend | 1h | Reuse form components from `/colaborar` |

---

### Phase 8 — Polish + QA (3 hours)

| Task | Type | Time | Notes |
|---|---|---|---|
| End-to-end test: partner submits → admin approves → appears on page | 🧪 QA | 1h | |
| Mobile responsive QA on all new pages | 🧪 QA | 1h | iPhone SE, iPhone 14, Android, iPad |
| Lighthouse / SEO audit on `/p/[slug]` pages | 🧪 QA | 30m | Target 90+ Performance, 100 SEO |
| Accessibility quick-pass (focus rings, alt text, aria labels) | 🧪 QA | 30m | |

---

## Total time

| Phase | Time |
|---|---|
| 1. Database + types | 3h |
| 2. Universal Listing Card | 6h |
| 3. Filtered Page Template | 10h |
| 4. Submission Form | 8h |
| 5. Admin Page Manager | 4h |
| 6. Admin Submission Queue | 4h |
| 7. Listings page enhancements | 2h |
| 8. Polish + QA | 3h |
| **TOTAL** | **~40 hours (5 working days)** |

---

## Out of scope (explicitly deferred)

- Partner login / dashboard
- Email notifications on submission/approval
- Map view toggle on filtered pages
- Partner editing their own listing
- Multi-image gallery on cards
- Review/rating system
- Stripe/Mollie payment integration for paid tiers (separate system)
- Refactoring existing 3 card components into the unified one (v2)
- Replacing `/ofertas/*` with the new template (v2)

---

## Dependencies / blockers

- **Decision #1–4 above** must be answered before Phase 1 starts.
- **Image upload bucket** must exist on Supabase Storage (`listings/`) — create if missing.
- **Beehiiv integration**, **Revolut**, **Track Enlaces** — already live, no action.
- **No env var changes** — uses existing `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CITY_SLUG`, Supabase keys.

---

## Build schedule — 6h kickoff + 2h/day

> **Day 1 = 6 hours** (foundation kickoff so everything else has DB + card to build on)
> **Day 2 onwards = 2 hours per day**, each day a self-contained chunk that ships a visible piece.

| Day | Hours | Phase | Work | Visible outcome at end of day |
|---|---|---|---|---|
| **Day 1** | **6h** | 1 + 2a | Database migration (`pages` + `listings` columns + RLS) + types + data layer + universal `<ListingCardUnified />` core | DB ready · `<ListingCardUnified />` renders for any listing |
| **Day 2** | 2h | 2b | WhatsApp share button + save/favorite (localStorage heart) | Cards now have share + save actions |
| **Day 3** | 2h | 3a | `/p/[slug]` dynamic route + 404 + hero section + analytics hook | First page renders at `/p/test-slug` with correct hero |
| **Day 4** | 2h | 3b | Sticky horizontal filter bar (desktop): pills + dropdowns + instant filtering | Desktop filtering works live |
| **Day 5** | 2h | 3c | Mobile bottom-sheet filter drawer with active count badge | Filter UX complete on mobile |
| **Day 6** | 2h | 3d | Results grid + sort dropdown + "Cargar más" + featured section (copper border) | Listings render and paginate |
| **Day 7** | 2h | 3e | Empty state + footer CTA + SEO (JSON-LD CollectionPage + OG + canonical) | Page is fully shippable |
| **Day 8** | 2h | 4a | `/colaborar` route + layout + Sections 1–2 (business + listing) | Form half-built, basic submit possible |
| **Day 9** | 2h | 4b | Sections 3–5 (price, image, booking) + activity types multi-select pills | Form complete (no submit yet) |
| **Day 10** | 2h | 4c | Image upload + client-side compression + Supabase Storage bucket | Images upload and compress |
| **Day 11** | 2h | 4d | `/api/submissions` POST + honeypot + IP rate limit + success state | `/colaborar` fully working end-to-end |
| **Day 12** | 2h | 5a | `/admin/paginas` sidebar link + list view | Admin can see all pages |
| **Day 13** | 2h | 5b | `/admin/paginas/[id]` create/edit form + featured listings autocomplete-and-reorder | Admin can build pages |
| **Day 14** | 2h | 6a | `/admin/propuestas` sidebar link + list view + status tabs | Admin sees submission queue |
| **Day 15** | 2h | 6b | Review form + edit + approve/reject + tag assignment + auto-`/go/` link | Full submission → approval loop closed |
| **Day 16** | 2h | 7 | `/admin/listings` status/source filter chips + "Add listing" manual form (reuse `/colaborar` components) | Admin parity with submission form |
| **Day 17** | 2h | 8a | E2E test (partner submits → approval → live page) + mobile QA across devices | Bug list compiled |
| **Day 18** | 1–2h | 8b | Lighthouse audit + a11y pass + bug fixes | Ready for production |

### At-a-glance

| | |
|---|---|
| **Day 1 (kickoff)** | 6 hours |
| **Days 2–17** | 2 hours × 16 = 32 hours |
| **Day 18 (wrap)** | 1–2 hours |
| **Total** | **~40 hours over ~3.5 calendar weeks** (5 working days/week) |
| **First public deploy possible** | End of Day 7 (filtered page template live, no submission yet) |
| **Full system live** | End of Day 11 (submission form working, admin tools coming next) |
| **Project complete** | End of Day 18 |

### Recommended Day 1 plan (the 6h kickoff)

| Block | Time | Task |
|---|---|---|
| Morning | 1h | Decisions doc — get answers to the 4 critical questions at top of file |
| Morning | 1.5h | Migration: `pages` table + `listings` columns + RLS policies |
| Morning | 30m | Update `src/types/index.ts` with `Page`, `PageFilterConfig` |
| Lunch | — | — |
| Afternoon | 1h | `src/lib/data.ts` helpers: `getPageBySlug()`, `getListingsByPage()` |
| Afternoon | 2h | Build `<ListingCardUnified />` — the reusable card with discount/age badges, price block, CTA |

By end of Day 1: DB ready, types ready, card component renders. Everything else stacks on this.

---

## Status tracker

> Update this table as work progresses.

| Phase | Status | Started | Completed | Notes |
|---|---|---|---|---|
| 0. Decisions answered | ✅ Done | 2026-05-07 | 2026-05-07 | Recommended answers (A, /p/[slug], FK+tags, honeypot+rate-limit) |
| 1. Database + types | ✅ Done | 2026-05-07 | 2026-05-07 | Safe migration: `pages` table + 7 new listings columns. Reuses existing fields. |
| 2. Universal Listing Card | ✅ Done | 2026-05-07 | 2026-05-07 | Card + skeleton + ListingCardActions client island (heart + WhatsApp share) |
| 3a. Filtered page route + hero | ✅ Done | 2026-05-07 | 2026-05-07 | `/p/[slug]` route + hero + featured/organic split + analytics (`PageViewTracker`) + footer CTA |
| 3b. Sticky desktop filter bar | ✅ Done | 2026-05-07 | 2026-05-07 | Tipo pills + Zona/Edad/Precio dropdowns + instant filtering + result count + Borrar filtros |
| 3c. Mobile bottom-sheet drawer | ✅ Done | 2026-05-07 | 2026-05-07 | "Filtros" button with badge → bottom sheet with all filters → "Ver X resultados" close |
| 3d. Sort + Cargar más | ✅ Done | 2026-05-08 | 2026-05-08 | Sort dropdown (4 options) + paginated grid (12 per batch) + auto-reset on filter change |
| 3e. JSON-LD + OG + empty state | ✅ Done | 2026-05-08 | 2026-05-08 | CollectionPage + Breadcrumb schemas + dynamic OG image route at /api/og + improved empty state with dual CTAs |
| 4a. /colaborar form (Sections 1–2) | ✅ Done | 2026-05-08 | 2026-05-08 | Standalone layout + minimal hero + business + listing sections + honeypot scaffold + ?tipo= pre-fill |
| 4b. Sections 3–5 + activity types | ✅ Done | 2026-05-08 | 2026-05-08 | Activity types multi-select pills (9 options) + price + image + booking URL sections + price-discount validation |
| 4c. Image upload + compression | ✅ Done | 2026-05-08 | 2026-05-08 | `<ImagePicker />` (Canvas compression to 1200px / JPEG q80 / EXIF strip) + drag-drop + progress bar + `/api/uploads/listings` endpoint (Supabase Storage) |
| 4d. /api/submissions + honeypot + rate limit | ✅ Done | 2026-05-10 | 2026-05-10 | Server validation, honeypot silent-success, IP rate limit (5/h), forces status/source/is_active, slug + listing_tags inserts |
| 5a. /admin/paginas list | ✅ Done | 2026-05-10 | 2026-05-10 | Sidebar links + table + status badges + delete + "Ver" external link |
| 5b. /admin/paginas edit form | ✅ Done | 2026-05-10 | 2026-05-10 | Reusable `<PageForm />` for create/edit, basic+hero+SEO+filter config+featured listings autocomplete-and-reorder |
| 6a. /admin/propuestas list | ✅ Done | 2026-05-10 | 2026-05-10 | Status tabs (Pendientes/Aprobadas/Rechazadas) + table + Revisar drawer |
| 6b. Review form + approve/reject + auto /go/ | ✅ Done | 2026-05-10 | 2026-05-10 | Edit fields, page_category tag chips, approve creates tracked link, reject sets status |
| 7. Listings status/source filters | 🚧 API only | 2026-05-10 | — | API params added; UI chips deferred (existing /admin/listings page is 2000+ lines, low priority polish) |
| 8. Polish + QA | ⏳ Pending | — | — | Manual E2E, mobile QA, Lighthouse, a11y |
| 3. Filtered Page Template | ⏳ Pending | — | — | |
| 4. Submission Form | ⏳ Pending | — | — | |
| 5. Admin Page Manager | ⏳ Pending | — | — | |
| 6. Admin Submission Queue | ⏳ Pending | — | — | |
| 7. Listings page enhancements | ⏳ Pending | — | — | |
| 8. Polish + QA | ⏳ Pending | — | — | |

Legend: ⏳ Pending · 🚧 In progress · ✅ Done · 🚫 Blocked

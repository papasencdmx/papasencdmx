import { createServerClient } from "./supabase";
import type { Listing, Zone, Category, Subcategory, Event as EventType, EventCategory, EventSection, Guide, ListingSection, Page, PageFilterConfig } from "@/types";

const citySlug = process.env.NEXT_PUBLIC_CITY_SLUG || "madrid";

const SUPABASE_MAX_FETCH = 5000;

// ── City ──

export async function getCityId(): Promise<string | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("cities")
    .select("id")
    .eq("slug", citySlug)
    .single();
  return data?.id || null;
}

// ── Categories ──

export async function getCategories(): Promise<Category[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data || [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data;
}

// ── Subcategories ──

export async function getSubcategories(categoryId: string): Promise<Subcategory[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("subcategories")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("sort_order");
  return data || [];
}

export async function getSubcategoryBySlug(categoryId: string, slug: string): Promise<Subcategory | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("subcategories")
    .select("*")
    .eq("category_id", categoryId)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data;
}

export async function getSubcategoryCountsForCategory(categoryId: string): Promise<Record<string, number>> {
  const cityId = await getCityId();
  if (!cityId) return {};

  const supabase = createServerClient();
  const { data } = await supabase
    .from("listings")
    .select("subcategory_id")
    .eq("city_id", cityId)
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .not("subcategory_id", "is", null)
    .limit(SUPABASE_MAX_FETCH);

  if (!data) return {};

  const counts: Record<string, number> = {};
  for (const row of data) {
    if (row.subcategory_id) {
      counts[row.subcategory_id] = (counts[row.subcategory_id] || 0) + 1;
    }
  }
  return counts;
}

export async function getZoneCountsForSubcategory(categoryId: string, subcategoryId: string): Promise<Record<string, number>> {
  const cityId = await getCityId();
  if (!cityId) return {};

  const supabase = createServerClient();
  const { data } = await supabase
    .from("listings")
    .select("zone_id")
    .eq("city_id", cityId)
    .eq("category_id", categoryId)
    .eq("subcategory_id", subcategoryId)
    .eq("is_active", true)
    .limit(SUPABASE_MAX_FETCH);

  if (!data) return {};

  const counts: Record<string, number> = {};
  for (const row of data) {
    if (row.zone_id) {
      counts[row.zone_id] = (counts[row.zone_id] || 0) + 1;
    }
  }
  return counts;
}

export async function getCategorySubcategoryPairs(): Promise<{ categorySlug: string; subcategorySlug: string }[]> {
  const cityId = await getCityId();
  if (!cityId) return [];

  const supabase = createServerClient();
  const { data } = await supabase
    .from("listings")
    .select("category:categories(slug), subcategory:subcategories(slug)")
    .eq("city_id", cityId)
    .eq("is_active", true)
    .not("subcategory_id", "is", null)
    .limit(SUPABASE_MAX_FETCH);

  if (!data) return [];

  const pairCounts: Record<string, number> = {};
  for (const d of data as any[]) {
    if (d.category?.slug && d.subcategory?.slug) {
      const key = `${d.category.slug}|${d.subcategory.slug}`;
      pairCounts[key] = (pairCounts[key] || 0) + 1;
    }
  }

  return Object.entries(pairCounts)
    .filter(([, count]) => count >= 2)
    .map(([key]) => {
      const [categorySlug, subcategorySlug] = key.split("|");
      return { categorySlug, subcategorySlug };
    });
}

// ── Zones ──

export async function getZones(): Promise<Zone[]> {
  const cityId = await getCityId();
  if (!cityId) return [];

  const supabase = createServerClient();
  const { data } = await supabase
    .from("zones")
    .select("*")
    .eq("city_id", cityId)
    .eq("is_active", true)
    .order("priority")
    .order("name");
  return data || [];
}

export async function getZoneBySlug(slug: string): Promise<Zone | null> {
  const cityId = await getCityId();
  if (!cityId) return null;

  const supabase = createServerClient();
  const { data } = await supabase
    .from("zones")
    .select("*")
    .eq("city_id", cityId)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data;
}

export async function getAdjacentZones(zoneId: string): Promise<Zone[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("zone_adjacency")
    .select("adjacent_zone_id")
    .eq("zone_id", zoneId);

  if (!data || data.length === 0) return [];

  const adjacentIds = data.map((d) => d.adjacent_zone_id);
  const { data: zones } = await supabase
    .from("zones")
    .select("*")
    .in("id", adjacentIds)
    .eq("is_active", true);

  return zones || [];
}

// ── Listings ──

export async function getListings(opts?: {
  categoryId?: string;
  zoneId?: string;
  zoneIds?: string[];
  subcategoryId?: string;
  subcategoryIds?: string[];
  featured?: boolean;
  priceRange?: string[];
  languages?: string[];
  ageGroups?: string[];
  verified?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
}): Promise<{ listings: Listing[]; count: number }> {
  const cityId = await getCityId();
  if (!cityId) return { listings: [], count: 0 };

  const supabase = createServerClient();
  let query = supabase
    .from("listings")
    .select("*, zone:zones(*), category:categories(*)", { count: "exact" })
    .eq("city_id", cityId)
    .eq("is_active", true);

  if (opts?.categoryId) query = query.eq("category_id", opts.categoryId);
  if (opts?.zoneId) query = query.eq("zone_id", opts.zoneId);
  if (opts?.zoneIds?.length) query = query.in("zone_id", opts.zoneIds);
  if (opts?.subcategoryId) query = query.eq("subcategory_id", opts.subcategoryId);
  if (opts?.subcategoryIds?.length) query = query.in("subcategory_id", opts.subcategoryIds);
  if (opts?.featured) query = query.eq("is_featured", true);
  if (opts?.priceRange?.length) query = query.in("price_range", opts.priceRange);
  if (opts?.verified) query = query.eq("is_verified", true);

  // Language filter: match listings that contain any of the specified languages
  if (opts?.languages?.length) {
    query = query.overlaps("languages", opts.languages);
  }

  // Age group filter: match listings whose age range overlaps with any selected group
  if (opts?.ageGroups?.length) {
    const ageConditions = opts.ageGroups.map((group) => {
      const [min, max] = group.split("-").map(Number);
      // A listing overlaps if its age_min <= group max AND age_max >= group min
      return `and(or(age_min.is.null,age_min.lte.${max}),or(age_max.is.null,age_max.gte.${min}))`;
    });
    query = query.or(ageConditions.join(","));
  }

  // Featured first, then by name
  query = query
    .order("is_featured", { ascending: false })
    .order("is_verified", { ascending: false })
    .order("name");

  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset) query = query.range(opts.offset, opts.offset + (opts?.limit || 20) - 1);

  const { data, count } = await query;
  return { listings: (data as Listing[]) || [], count: count || 0 };
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const cityId = await getCityId();
  if (!cityId) return null;

  const supabase = createServerClient();
  const { data } = await supabase
    .from("listings")
    .select("*, zone:zones(*), category:categories(*), subcategory:subcategories(*)")
    .eq("city_id", cityId)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  return data as Listing | null;
}

export async function getRelatedListings(listing: Listing, limit = 4): Promise<Listing[]> {
  const supabase = createServerClient();
  let query = supabase
    .from("listings")
    .select("*, zone:zones(*), category:categories(*)")
    .eq("city_id", listing.city_id)
    .eq("category_id", listing.category_id)
    .eq("is_active", true)
    .neq("id", listing.id)
    .limit(limit);

  // Prefer same zone
  if (listing.zone_id) {
    query = query.order("zone_id", { ascending: false }); // Crude but pushes same zone_id up
  }

  const { data } = await query;
  return (data as Listing[]) || [];
}

export async function getListingCount(categoryId?: string, zoneId?: string, subcategoryId?: string): Promise<number> {
  const cityId = await getCityId();
  if (!cityId) return 0;

  const supabase = createServerClient();
  let query = supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("city_id", cityId)
    .eq("is_active", true);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (zoneId) query = query.eq("zone_id", zoneId);
  if (subcategoryId) query = query.eq("subcategory_id", subcategoryId);

  const { count } = await query;
  return count || 0;
}

// Get counts per zone for a category (for zone grid)
export async function getZoneCountsForCategory(categoryId: string): Promise<Record<string, number>> {
  const cityId = await getCityId();
  if (!cityId) return {};

  const supabase = createServerClient();
  const { data } = await supabase
    .from("listings")
    .select("zone_id")
    .eq("city_id", cityId)
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .limit(SUPABASE_MAX_FETCH);

  if (!data) return {};

  const counts: Record<string, number> = {};
  for (const row of data) {
    if (row.zone_id) {
      counts[row.zone_id] = (counts[row.zone_id] || 0) + 1;
    }
  }
  return counts;
}

// Get counts per category for a zone (for zone hub)
export async function getCategoryCountsForZone(zoneId: string): Promise<Record<string, number>> {
  const cityId = await getCityId();
  if (!cityId) return {};

  const supabase = createServerClient();
  const { data } = await supabase
    .from("listings")
    .select("category_id")
    .eq("city_id", cityId)
    .eq("zone_id", zoneId)
    .eq("is_active", true)
    .limit(SUPABASE_MAX_FETCH);

  if (!data) return {};

  const counts: Record<string, number> = {};
  for (const row of data) {
    if (row.category_id) {
      counts[row.category_id] = (counts[row.category_id] || 0) + 1;
    }
  }
  return counts;
}

// ── Event Categories ──

export async function getEventCategories(section?: EventSection): Promise<EventCategory[]> {
  const supabase = createServerClient();
  let query = supabase
    .from("event_categories")
    .select("*")
    .eq("is_active", true);
  if (section) query = query.eq("section", section);
  const { data } = await query.order("sort_order");
  return (data as EventCategory[]) || [];
}

// ── Events ──

export async function getUpcomingEvents(opts?: {
  eventCategoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  isFree?: boolean;
  section?: EventSection;
  limit?: number;
  offset?: number;
}): Promise<EventType[]> {
  const cityId = await getCityId();
  if (!cityId) return [];

  const supabase = createServerClient();
  const today = new Date().toISOString().split("T")[0];

  // Fetch approved events that have future occurrences
  let query = supabase
    .from("events")
    .select("*, event_category:event_categories(*), listing:listings(name, slug, category:categories(slug)), occurrences:event_occurrences(*)")
    .eq("city_id", cityId)
    .eq("status", "approved");

  if (opts?.eventCategoryId) query = query.eq("event_category_id", opts.eventCategoryId);
  if (opts?.isFree === true) query = query.eq("is_free", true);
  if (opts?.isFree === false) query = query.eq("is_free", false);
  if (opts?.section) query = query.eq("section", opts.section);

  const { data } = await query;
  if (!data) return [];

  // Filter to events with future occurrences and compute next_occurrence_date
  const dateFrom = opts?.dateFrom || today;
  const dateTo = opts?.dateTo;

  const eventsWithFuture = (data as EventType[])
    .map((event) => {
      const futureOccurrences = (event.occurrences || []).filter((occ) => {
        if (occ.occurrence_date < dateFrom) return false;
        if (dateTo && occ.occurrence_date > dateTo) return false;
        if (occ.availability === "cancelled") return false;
        if (occ.is_visible === false) return false;
        return true;
      });

      if (futureOccurrences.length === 0) return null;

      // Sort occurrences by date
      futureOccurrences.sort((a, b) => a.occurrence_date.localeCompare(b.occurrence_date));

      return {
        ...event,
        occurrences: futureOccurrences,
        next_occurrence_date: futureOccurrences[0].occurrence_date,
        occurrence_count: futureOccurrences.length,
      };
    })
    .filter(Boolean) as EventType[];

  // Sort by next occurrence date
  eventsWithFuture.sort((a, b) =>
    (a.next_occurrence_date || "").localeCompare(b.next_occurrence_date || "")
  );

  // Apply pagination
  const offset = opts?.offset || 0;
  const limit = opts?.limit || eventsWithFuture.length;
  return eventsWithFuture.slice(offset, offset + limit);
}

export async function getEventBySlug(slug: string): Promise<EventType | null> {
  const cityId = await getCityId();
  if (!cityId) return null;

  const supabase = createServerClient();
  const { data } = await supabase
    .from("events")
    .select("*, event_category:event_categories(*), listing:listings(name, slug, category:categories(slug)), occurrences:event_occurrences(*), features:event_features(*)")
    .eq("city_id", cityId)
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!data) return null;

  const event = data as EventType;
  if (event.occurrences) {
    event.occurrences = event.occurrences
      .filter((occ) => occ.is_visible !== false)
      .sort((a, b) => a.occurrence_date.localeCompare(b.occurrence_date));
  }
  if (event.features) {
    event.features = event.features.sort((a, b) => a.sort_order - b.sort_order);
  }

  return event;
}

export async function getRelatedEvents(eventId: string, categoryId: string | null, limit = 4, section?: EventSection): Promise<EventType[]> {
  const cityId = await getCityId();
  if (!cityId) return [];

  const supabase = createServerClient();
  const today = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("events")
    .select("*, event_category:event_categories(*), occurrences:event_occurrences(*)")
    .eq("city_id", cityId)
    .eq("status", "approved")
    .neq("id", eventId);

  if (categoryId) query = query.eq("event_category_id", categoryId);
  if (section) query = query.eq("section", section);

  const { data } = await query;
  if (!data) return [];

  // Filter to events with future occurrences
  const eventsWithFuture = (data as EventType[])
    .map((event) => {
      const futureOcc = (event.occurrences || []).filter(
        (occ) => occ.occurrence_date >= today && occ.availability !== "cancelled"
      );
      if (futureOcc.length === 0) return null;
      futureOcc.sort((a, b) => a.occurrence_date.localeCompare(b.occurrence_date));
      return {
        ...event,
        occurrences: futureOcc,
        next_occurrence_date: futureOcc[0].occurrence_date,
        occurrence_count: futureOcc.length,
      };
    })
    .filter(Boolean) as EventType[];

  eventsWithFuture.sort((a, b) =>
    (a.next_occurrence_date || "").localeCompare(b.next_occurrence_date || "")
  );

  return eventsWithFuture.slice(0, limit);
}

export async function getOccurrenceStock(eventId: string): Promise<Record<string, number>> {
  const supabase = createServerClient();

  // Count all paid orders
  const { data: paidData } = await supabase
    .from("orders")
    .select("occurrence_id, quantity")
    .eq("event_id", eventId)
    .eq("payment_status", "paid");

  // Only count pending orders from the last 30 min (older ones are likely abandoned)
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data: pendingData } = await supabase
    .from("orders")
    .select("occurrence_id, quantity")
    .eq("event_id", eventId)
    .eq("payment_status", "pending")
    .gte("created_at", thirtyMinAgo);

  const sold: Record<string, number> = {};
  for (const order of [...(paidData || []), ...(pendingData || [])]) {
    sold[order.occurrence_id] = (sold[order.occurrence_id] || 0) + order.quantity;
  }
  return sold;
}

export async function getEventCount(opts?: {
  eventCategoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  isFree?: boolean;
  section?: EventSection;
}): Promise<number> {
  const events = await getUpcomingEvents({ ...opts, limit: 10000 });
  return events.length;
}

export async function getAllEventSlugs(): Promise<{ slug: string; section: EventSection }[]> {
  const cityId = await getCityId();
  if (!cityId) return [];

  const supabase = createServerClient();
  const { data } = await supabase
    .from("events")
    .select("slug, section")
    .eq("city_id", cityId)
    .eq("status", "approved");

  return (data || []) as { slug: string; section: EventSection }[];
}

// ── Guides ──

export async function getActiveGuide(slug: string): Promise<Guide | null> {
  const cityId = await getCityId();
  if (!cityId) return null;

  const supabase = createServerClient();
  const { data } = await supabase
    .from("guides")
    .select(`
      *,
      guide_listings(
        *,
        listing:listings(*, zone:zones(*), category:categories(*))
      )
    `)
    .eq("city_id", cityId)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  return data as Guide | null;
}

// ── Listing Sections ──

export async function getListingSections(listingId: string): Promise<ListingSection[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("listing_sections")
    .select("*")
    .eq("listing_id", listingId)
    .eq("is_active", true)
    .order("sort_order");
  return (data as ListingSection[]) || [];
}

// ── Search ──

export async function searchListings(query: string, limit = 10): Promise<Listing[]> {
  const cityId = await getCityId();
  if (!cityId) return [];

  const supabase = createServerClient();
  const { data } = await supabase
    .from("listings")
    .select("*, zone:zones(*), category:categories(*)")
    .eq("city_id", cityId)
    .eq("is_active", true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,short_description.ilike.%${query}%`)
    .order("is_featured", { ascending: false })
    .limit(limit);

  return (data as Listing[]) || [];
}

// ── Filter Counts ──

export async function getFilterCounts(categoryId: string, subcategoryId?: string): Promise<{
  languages: { code: string; count: number }[];
  priceRanges: { value: string; count: number }[];
}> {
  const cityId = await getCityId();
  if (!cityId) return { languages: [], priceRanges: [] };

  const supabase = createServerClient();
  let query = supabase
    .from("listings")
    .select("languages, price_range")
    .eq("city_id", cityId)
    .eq("category_id", categoryId)
    .eq("is_active", true);

  if (subcategoryId) query = query.eq("subcategory_id", subcategoryId);

  query = query.limit(SUPABASE_MAX_FETCH);
  const { data } = await query;
  if (!data) return { languages: [], priceRanges: [] };

  // Count languages
  const langCounts: Record<string, number> = {};
  for (const row of data) {
    if (row.languages && Array.isArray(row.languages)) {
      for (const lang of row.languages) {
        langCounts[lang] = (langCounts[lang] || 0) + 1;
      }
    }
  }

  // Count price ranges
  const priceCounts: Record<string, number> = {};
  for (const row of data) {
    if (row.price_range) {
      priceCounts[row.price_range] = (priceCounts[row.price_range] || 0) + 1;
    }
  }

  return {
    languages: Object.entries(langCounts)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count),
    priceRanges: Object.entries(priceCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => {
        const order = ["$", "$$", "$$$"];
        return order.indexOf(a.value) - order.indexOf(b.value);
      }),
  };
}

// ── Category Stats (hero section) ──

export async function getCategoryStats(categoryId: string): Promise<{
  verifiedCount: number;
  avgRating: number;
  ratingCount: number;
}> {
  const cityId = await getCityId();
  if (!cityId) return { verifiedCount: 0, avgRating: 0, ratingCount: 0 };

  const supabase = createServerClient();
  const { data } = await supabase
    .from("listings")
    .select("is_verified, google_rating")
    .eq("city_id", cityId)
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .limit(SUPABASE_MAX_FETCH);

  if (!data) return { verifiedCount: 0, avgRating: 0, ratingCount: 0 };

  let verifiedCount = 0;
  let ratingSum = 0;
  let ratingCount = 0;

  for (const row of data) {
    if (row.is_verified) verifiedCount++;
    if (row.google_rating) {
      ratingSum += row.google_rating;
      ratingCount++;
    }
  }

  return {
    verifiedCount,
    avgRating: ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0,
    ratingCount,
  };
}

// ── Sitemap Data ──

export async function getAllListingSlugs(): Promise<{ categorySlug: string; listingSlug: string }[]> {
  const cityId = await getCityId();
  if (!cityId) return [];

  const supabase = createServerClient();
  const { data } = await supabase
    .from("listings")
    .select("slug, category:categories(slug)")
    .eq("city_id", cityId)
    .eq("is_active", true)
    .limit(SUPABASE_MAX_FETCH);

  if (!data) return [];

  return data.map((d: any) => ({
    categorySlug: d.category?.slug || "",
    listingSlug: d.slug,
  }));
}

export async function getCategoryZonePairs(): Promise<{ categorySlug: string; zoneSlug: string }[]> {
  const cityId = await getCityId();
  if (!cityId) return [];

  const supabase = createServerClient();
  const { data } = await supabase
    .from("listings")
    .select("category:categories(slug), zone:zones(slug)")
    .eq("city_id", cityId)
    .eq("is_active", true)
    .limit(SUPABASE_MAX_FETCH);

  if (!data) return [];

  // Get unique category-zone pairs with 2+ listings
  const pairCounts: Record<string, number> = {};
  for (const d of data as any[]) {
    if (d.category?.slug && d.zone?.slug) {
      const key = `${d.category.slug}|${d.zone.slug}`;
      pairCounts[key] = (pairCounts[key] || 0) + 1;
    }
  }

  return Object.entries(pairCounts)
    .filter(([, count]) => count >= 2)
    .map(([key]) => {
      const [categorySlug, zoneSlug] = key.split("|");
      return { categorySlug, zoneSlug };
    });
}

// ── Filtered listing pages (/p/[slug]) ──

/**
 * Fetch a published page by slug for the current city.
 * Returns null if not found or not published.
 */
export async function getPageBySlug(slug: string): Promise<Page | null> {
  const cityId = await getCityId();
  if (!cityId) return null;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("city_id", cityId)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return data as Page;
}

/**
 * Fetch listings that belong on a given page.
 * Membership rule: a listing appears on the page if it has at least one
 * `listing_tags` row whose tag_value matches `filter_config.tag_values`
 * (and optionally tag_type matches `filter_config.tag_types`).
 *
 * Featured listings (page.featured_listing_ids) are returned first, in array order.
 */
export async function getListingsByPage(page: Page): Promise<Listing[]> {
  const cityId = page.city_id;
  const cfg: PageFilterConfig = page.filter_config || {};
  const tagValues = cfg.tag_values || [];
  const tagTypes = cfg.tag_types || [];

  const supabase = createServerClient();

  // 1) If we have tag_values, find listing_ids that have at least one matching tag
  let listingIds: string[] | null = null;
  if (tagValues.length > 0) {
    let q = supabase
      .from("listing_tags")
      .select("listing_id")
      .in("tag_value", tagValues);
    if (tagTypes.length > 0) {
      q = q.in("tag_type", tagTypes);
    }
    const { data: tagRows, error: tagErr } = await q;
    if (tagErr) {
      console.error("[getListingsByPage] tag query error:", tagErr);
      return [];
    }
    listingIds = Array.from(
      new Set(((tagRows || []) as { listing_id: string }[]).map((r) => r.listing_id))
    );
    if (listingIds.length === 0) {
      // No matching listings — but featured pins might still apply
      listingIds = page.featured_listing_ids.length > 0 ? [] : null;
      if (listingIds === null) return [];
    }
  }

  // 2) Always include featured pins, even if they wouldn't match by tag
  const allIds =
    listingIds === null
      ? null
      : Array.from(new Set([...listingIds, ...page.featured_listing_ids]));

  // 3) Fetch listings (active + correct city)
  let listingsQuery = supabase
    .from("listings")
    .select(
      "*, zone:zones(*), category:categories(*), subcategory:subcategories(*)"
    )
    .eq("city_id", cityId)
    .eq("is_active", true);

  if (allIds !== null) {
    if (allIds.length === 0) return [];
    listingsQuery = listingsQuery.in("id", allIds);
  }

  const { data, error } = await listingsQuery.limit(SUPABASE_MAX_FETCH);
  if (error || !data) {
    if (error) console.error("[getListingsByPage] listings query error:", error);
    return [];
  }

  const listings = data as Listing[];

  // 4) Sort: featured pins first (in pin order), then by default_sort
  const featuredOrder = new Map(
    page.featured_listing_ids.map((id, idx) => [id, idx])
  );
  const sortBy = cfg.default_sort || "featured_first";

  return listings.sort((a, b) => {
    const aFeat = featuredOrder.get(a.id);
    const bFeat = featuredOrder.get(b.id);
    if (aFeat != null && bFeat != null) return aFeat - bFeat;
    if (aFeat != null) return -1;
    if (bFeat != null) return 1;
    if (sortBy === "price_asc") {
      return (a.price_min ?? Infinity) - (b.price_min ?? Infinity);
    }
    if (sortBy === "price_desc") {
      return (b.price_min ?? -Infinity) - (a.price_min ?? -Infinity);
    }
    if (sortBy === "recent") {
      return (b.created_at || "").localeCompare(a.created_at || "");
    }
    // featured_first / fallback: most-recent first among non-featured
    return (b.created_at || "").localeCompare(a.created_at || "");
  });
}

/**
 * List all pages (admin convenience). Includes drafts/archived.
 */
export async function getAllPages(): Promise<Page[]> {
  const cityId = await getCityId();
  if (!cityId) return [];
  const supabase = createServerClient();
  const { data } = await supabase
    .from("pages")
    .select("*")
    .eq("city_id", cityId)
    .order("updated_at", { ascending: false });
  return (data || []) as Page[];
}

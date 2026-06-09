import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync } from "fs";
import Papa from "papaparse";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse CSV properly with papaparse
const csvContent = readFileSync("data/clinicas_dentales_madrid_premium.csv", "utf-8");
const { data: allRows } = Papa.parse(csvContent, { header: true, skipEmptyLines: true });

// Find a row with most fields filled (photos, reviews, place_id, etc.)
function fieldScore(row) {
  let score = 0;
  if (row.photo_1) score += 2;
  if (row.photo_2) score++;
  if (row.photo_3) score++;
  if (row.photo_4) score++;
  if (row.photo_5) score++;
  if (row.place_id) score += 2;
  if (row.review_1_text) score++;
  if (row.review_2_text) score++;
  if (row.review_3_text) score++;
  if (row.rating) score++;
  if (row.opening_hours) score++;
  if (row.payment_options) score++;
  if (row.accessibility) score++;
  if (row.emails_found) score++;
  if (row.website) score++;
  if (row.description) score++;
  return score;
}

// Sort by score descending and pick the best
// Check which slugs already exist
const existingSlugs = new Set();
{
  const { data: city } = await supabase.from("cities").select("id").eq("slug", "madrid").single();
  const allSlugs = allRows.map(r => generateSlugSimple(r.business_name || ""));
  const { data: existing } = await supabase.from("listings").select("slug").eq("city_id", city.id).in("slug", allSlugs);
  (existing || []).forEach(l => existingSlugs.add(l.slug));
}

function generateSlugSimple(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

const scored = allRows
  .map((r, i) => ({ row: r, score: fieldScore(r), idx: i, slug: generateSlugSimple(r.business_name || "") }))
  .filter(r => !existingSlugs.has(r.slug));
scored.sort((a, b) => b.score - a.score);

if (scored.length === 0) { console.log("All rows already inserted!"); process.exit(0); }
const best = scored[0];
const row = best.row;

console.log(`Best row (#${best.idx + 1}), score: ${best.score}/${17}`);
console.log("Name:", row.business_name);
console.log("Fields present:");
console.log("  photos:", [row.photo_1, row.photo_2, row.photo_3, row.photo_4, row.photo_5].filter(Boolean).length);
console.log("  reviews:", [row.review_1_text, row.review_2_text, row.review_3_text].filter(Boolean).length);
console.log("  place_id:", row.place_id ? "yes" : "no");
console.log("  opening_hours:", row.opening_hours ? "yes" : "no");
console.log("  payment_options:", row.payment_options ? "yes" : "no");
console.log("  accessibility:", row.accessibility ? "yes" : "no");
console.log("  email:", row.emails_found ? "yes" : "no");
console.log("  website:", row.website ? "yes" : "no");
console.log("  description:", row.description ? "yes" : "no");
console.log("");

// Get city ID
const { data: city } = await supabase.from("cities").select("id").eq("slug", "madrid").single();

// Get salud category
const { data: category } = await supabase.from("categories").select("id, slug").eq("slug", "salud").single();

// Get zone
const zoneName = row.zone || "";
let zone = null;
if (zoneName) {
  const { data: zones } = await supabase.from("zones").select("id, name, slug").eq("city_id", city.id).ilike("name", `%${zoneName}%`);
  zone = zones?.[0];
}

// Helpers
function toTitleCase(text) {
  const small = ["de", "del", "la", "las", "los", "el", "y", "en"];
  return text.toLowerCase().split(" ").map((w, i) =>
    i === 0 || !small.includes(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w
  ).join(" ");
}

function generateSlug(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

// Collect gallery
const gallery = [];
for (let i = 2; i <= 5; i++) {
  const url = row[`photo_${i}`];
  if (url && url.trim()) gallery.push(url.trim());
}

// Build section_content
const sectionContent = {};
if (row.payment_options) sectionContent.payment_options = row.payment_options;
if (row.accessibility) sectionContent.accessibility = row.accessibility;

const googleReviews = [];
for (let i = 1; i <= 3; i++) {
  const author = row[`review_${i}_author`];
  const text = row[`review_${i}_text`];
  const rating = row[`review_${i}_rating`];
  if (author || text) {
    googleReviews.push({ author: author || "", text: text || "", rating: rating || "" });
  }
}
if (googleReviews.length > 0) sectionContent.google_reviews = googleReviews;

// Parse tier
function parseTier(raw) {
  if (!raw) return "free";
  const lower = raw.toLowerCase();
  if (lower.includes("tier 1") || lower.includes("premium")) return "presencia_total";
  if (lower.includes("tier 2")) return "presencia_anual";
  if (lower.includes("tier 3")) return "standard";
  return "free";
}

const name = toTitleCase(row.business_name);
const listing = {
  name,
  slug: generateSlug(row.business_name),
  city_id: city.id,
  category_id: category.id,
  zone_id: zone?.id || null,
  description: row.description || `${name} es una clínica dental ubicada en ${zoneName || "Madrid"}. Ofrece servicios de odontología general, ortodoncia, implantes y estética dental para toda la familia.`,
  phone: row.international_phone || null,
  email: row.emails_found || null,
  website: row.website ? (row.website.startsWith("http") ? row.website : `https://${row.website}`) : null,
  street_address: row.address || null,
  latitude: row.latitude ? parseFloat(row.latitude) : null,
  longitude: row.longitude ? parseFloat(row.longitude) : null,
  schedule: row.opening_hours || null,
  cover_image_url: row.photo_1 || null,
  gallery_urls: gallery.length > 0 ? gallery : null,
  google_rating: row.rating ? parseFloat(row.rating) : null,
  google_review_count: row.review_count ? parseInt(row.review_count) : null,
  google_place_id: row.place_id || null,
  is_active: true,
  is_verified: false,
  is_featured: false,
  tier: parseTier(row.tier),
  section_content: Object.keys(sectionContent).length > 0 ? sectionContent : null,
  languages: ["es"],
};

console.log("Inserting:", listing.name);
console.log("  slug:", listing.slug);
console.log("  zone:", zone?.name || "none");
console.log("  rating:", listing.google_rating, "| reviews:", listing.google_review_count);
console.log("  place_id:", listing.google_place_id);
console.log("  cover:", listing.cover_image_url ? listing.cover_image_url.substring(0, 60) + "..." : "none");
console.log("  gallery:", gallery.length, "photos");
console.log("  schedule:", listing.schedule ? listing.schedule.substring(0, 60) + "..." : "none");
console.log("  section_content keys:", Object.keys(sectionContent));
console.log("  google_reviews:", googleReviews.length);
console.log("");

const { data, error } = await supabase
  .from("listings")
  .insert(listing)
  .select("id, slug, name")
  .single();

if (error) {
  console.error("Error:", error.message);
  if (error.message.includes("google_place_id")) {
    console.log("Retrying without google_place_id (migration not run yet)...");
    delete listing.google_place_id;
    const { data: d2, error: e2 } = await supabase.from("listings").insert(listing).select("id, slug, name").single();
    if (e2) console.error("Error:", e2.message);
    else console.log("Inserted:", d2);
  }
} else {
  console.log("Inserted:", data);
}

console.log("\nView at: /salud/" + listing.slug);

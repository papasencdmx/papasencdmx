/**
 * Migrate section data from old DB (top-level columns) into new DB (section_content JSONB)
 *
 * Old DB: cwbtieryvnxrbxqctyrv.supabase.co — has etapas_educativas, extraescolares, etc. as columns
 * New DB: wlxwjthjoasjgzeigqxl.supabase.co — stores them inside section_content JSON
 *
 * Matches listings by slug.
 */

const OLD_URL = "https://cwbtieryvnxrbxqctyrv.supabase.co";
const OLD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3YnRpZXJ5dm54cmJ4cWN0eXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODU5NTMsImV4cCI6MjA4NTI2MTk1M30.7n14Amqm1mbkr54CJMZk1xdNmo0SBwENL7a5evpXFnY";

const NEW_URL = "https://wlxwjthjoasjgzeigqxl.supabase.co";
const NEW_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndseHdqdGhqb2Fzamd6ZWlncXhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE0NjU5NCwiZXhwIjoyMDg3NzIyNTk0fQ.oOi5AOHWWlU__grrp399OEdvz4B7AEfgKC90tN5Yzfk";

const FIELD_MAP = {
  etapas_educativas: "etapas",
  extraescolares: "extraescolares",
  servicios: "servicios",
  instalaciones: "instalaciones",
  idiomas: "idiomas_ensenanza",
  modelo_educativo: "modelo_educativo",
  atencion_diversidad: "atencion_diversidad",
  titulos_programas: "titulos_programas",
};

async function fetchAll(url, key, table, select, filters = "") {
  let all = [];
  let offset = 0;
  const limit = 500;
  while (true) {
    const res = await fetch(
      `${url}/rest/v1/${table}?select=${select}${filters}&limit=${limit}&offset=${offset}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    all = all.concat(data);
    if (data.length < limit) break;
    offset += limit;
  }
  return all;
}

async function main() {
  console.log("Fetching listings from OLD database...");
  const oldListings = await fetchAll(
    OLD_URL, OLD_KEY, "listings",
    "slug,etapas_educativas,extraescolares,servicios,instalaciones,idiomas,modelo_educativo,atencion_diversidad,titulos_programas,section_content"
  );
  console.log(`Found ${oldListings.length} listings in old DB`);

  // Filter to listings that have at least one field with data
  const withData = oldListings.filter(l =>
    Object.keys(FIELD_MAP).some(k => {
      const v = l[k];
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "string") return v.trim().length > 0;
      return false;
    })
  );
  console.log(`${withData.length} listings have section data to migrate`);

  // Fetch new DB listings to get IDs by slug
  console.log("Fetching listings from NEW database...");
  const newListings = await fetchAll(NEW_URL, NEW_KEY, "listings", "id,slug,section_content");
  const newBySlug = Object.fromEntries(newListings.map(l => [l.slug, l]));
  console.log(`Found ${newListings.length} listings in new DB`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const old of withData) {
    const target = newBySlug[old.slug];
    if (!target) {
      console.log(`  SKIP: "${old.slug}" not found in new DB`);
      notFound++;
      continue;
    }

    // Merge into existing section_content
    const existing = target.section_content || {};
    const merged = { ...existing };
    let changed = false;

    for (const [oldKey, newKey] of Object.entries(FIELD_MAP)) {
      const val = old[oldKey];
      // Also check old section_content for the field
      const scVal = old.section_content?.[newKey];
      const finalVal = val || scVal;

      if (!finalVal) continue;
      if (Array.isArray(finalVal) && finalVal.length === 0) continue;
      if (typeof finalVal === "string" && finalVal.trim() === "") continue;

      // Don't overwrite if already exists in new
      if (merged[newKey] !== undefined && merged[newKey] !== null) {
        if (Array.isArray(merged[newKey]) && merged[newKey].length > 0) continue;
        if (typeof merged[newKey] === "string" && merged[newKey].trim() !== "") continue;
      }

      merged[newKey] = finalVal;
      changed = true;
    }

    // Also copy FAQs from old section_content if they exist and new doesn't have them
    if (old.section_content?.faqs?.length > 0 && !merged.faqs?.length) {
      merged.faqs = old.section_content.faqs;
      changed = true;
    }

    if (!changed) {
      skipped++;
      continue;
    }

    // Update new DB
    const res = await fetch(`${NEW_URL}/rest/v1/listings?id=eq.${target.id}`, {
      method: "PATCH",
      headers: {
        apikey: NEW_KEY,
        Authorization: `Bearer ${NEW_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ section_content: merged }),
    });

    if (res.ok) {
      console.log(`  OK: "${old.slug}" — merged ${Object.keys(FIELD_MAP).filter(k => old[k] && (Array.isArray(old[k]) ? old[k].length > 0 : true)).map(k => FIELD_MAP[k]).join(", ")}`);
      updated++;
    } else {
      const err = await res.text();
      console.log(`  ERROR: "${old.slug}" — ${res.status} ${err}`);
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped (no changes): ${skipped}, Not in new DB: ${notFound}`);
}

main().catch(console.error);

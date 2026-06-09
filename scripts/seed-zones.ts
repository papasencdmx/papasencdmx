import { createClient } from "@supabase/supabase-js";
// @ts-ignore
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Madrid zones: districts, municipalities, and key areas
const zones: Array<{ name: string; slug: string; type: "distrito" | "municipio" | "barrio"; priority: number }> = [
    // ── Central districts ──
    { name: "Centro", slug: "centro", type: "distrito", priority: 1 },
    { name: "Salamanca", slug: "salamanca", type: "distrito", priority: 1 },
    { name: "Chamberi", slug: "chamberi", type: "distrito", priority: 1 },
    { name: "Retiro", slug: "retiro", type: "distrito", priority: 1 },
    { name: "Chamartin", slug: "chamartin", type: "distrito", priority: 1 },
    { name: "Moncloa-Aravaca", slug: "moncloa-aravaca", type: "distrito", priority: 2 },
    { name: "Tetuan", slug: "tetuan", type: "distrito", priority: 2 },
    { name: "Arganzuela", slug: "arganzuela", type: "distrito", priority: 2 },
    { name: "Fuencarral-El Pardo", slug: "fuencarral-el-pardo", type: "distrito", priority: 2 },
    { name: "Hortaleza", slug: "hortaleza", type: "distrito", priority: 2 },
    { name: "Ciudad Lineal", slug: "ciudad-lineal", type: "distrito", priority: 2 },
    { name: "Barajas", slug: "barajas", type: "distrito", priority: 3 },
    { name: "San Blas-Canillejas", slug: "san-blas-canillejas", type: "distrito", priority: 3 },
    { name: "Moratalaz", slug: "moratalaz", type: "distrito", priority: 3 },
    { name: "Puente de Vallecas", slug: "puente-de-vallecas", type: "distrito", priority: 3 },
    { name: "Villa de Vallecas", slug: "villa-de-vallecas", type: "distrito", priority: 3 },
    { name: "Usera", slug: "usera", type: "distrito", priority: 3 },
    { name: "Carabanchel", slug: "carabanchel", type: "distrito", priority: 3 },
    { name: "Latina", slug: "latina", type: "distrito", priority: 3 },
    { name: "Villaverde", slug: "villaverde", type: "distrito", priority: 3 },
    { name: "Vicalvaro", slug: "vicalvaro", type: "distrito", priority: 3 },

    // ── Key municipalities (corona metropolitana) ──
    { name: "Pozuelo de Alarcon", slug: "pozuelo-de-alarcon", type: "municipio", priority: 1 },
    { name: "Las Rozas", slug: "las-rozas", type: "municipio", priority: 1 },
    { name: "Majadahonda", slug: "majadahonda", type: "municipio", priority: 1 },
    { name: "Boadilla del Monte", slug: "boadilla-del-monte", type: "municipio", priority: 1 },
    { name: "San Sebastian de los Reyes", slug: "san-sebastian-de-los-reyes", type: "municipio", priority: 1 },
    { name: "Alcobendas", slug: "alcobendas", type: "municipio", priority: 1 },
    { name: "Tres Cantos", slug: "tres-cantos", type: "municipio", priority: 2 },
    { name: "Alcorcon", slug: "alcorcon", type: "municipio", priority: 2 },
    { name: "Getafe", slug: "getafe", type: "municipio", priority: 2 },
    { name: "Leganes", slug: "leganes", type: "municipio", priority: 2 },
    { name: "Mostoles", slug: "mostoles", type: "municipio", priority: 2 },
    { name: "Fuenlabrada", slug: "fuenlabrada", type: "municipio", priority: 3 },
    { name: "Torrejon de Ardoz", slug: "torrejon-de-ardoz", type: "municipio", priority: 2 },
    { name: "Alcala de Henares", slug: "alcala-de-henares", type: "municipio", priority: 2 },
    { name: "San Fernando de Henares", slug: "san-fernando-de-henares", type: "municipio", priority: 3 },
    { name: "Coslada", slug: "coslada", type: "municipio", priority: 3 },
    { name: "Rivas-Vaciamadrid", slug: "rivas-vaciamadrid", type: "municipio", priority: 2 },
    { name: "Villanueva de la Canada", slug: "villanueva-de-la-canada", type: "municipio", priority: 3 },
    { name: "Villanueva del Pardillo", slug: "villanueva-del-pardillo", type: "municipio", priority: 3 },
    { name: "Torrelodones", slug: "torrelodones", type: "municipio", priority: 2 },
    { name: "Galapagar", slug: "galapagar", type: "municipio", priority: 3 },
    { name: "Colmenar Viejo", slug: "colmenar-viejo", type: "municipio", priority: 3 },
    { name: "Valdemoro", slug: "valdemoro", type: "municipio", priority: 3 },
    { name: "Parla", slug: "parla", type: "municipio", priority: 3 },
    { name: "Pinto", slug: "pinto", type: "municipio", priority: 3 },
    { name: "Aranjuez", slug: "aranjuez", type: "municipio", priority: 3 },
    { name: "El Escorial", slug: "el-escorial", type: "municipio", priority: 3 },
    { name: "San Lorenzo de El Escorial", slug: "san-lorenzo-de-el-escorial", type: "municipio", priority: 3 },
    { name: "Collado Villalba", slug: "collado-villalba", type: "municipio", priority: 3 },
    { name: "Algete", slug: "algete", type: "municipio", priority: 3 },
];

async function main() {
    // Get Madrid city
    const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", "madrid")
        .single();

    if (!city) {
        console.error("City 'madrid' not found!");
        process.exit(1);
    }

    console.log(`Seeding ${zones.length} zones for Madrid (${city.id})...`);

    let created = 0;
    let skipped = 0;

    for (const zone of zones) {
        const { error } = await supabase.from("zones").upsert(
            {
                city_id: city.id,
                name: zone.name,
                slug: zone.slug,
                type: zone.type,
                priority: zone.priority,
                is_active: true,
            },
            { onConflict: "city_id,slug" }
        );

        if (error) {
            // Try insert if upsert fails (no unique constraint on city_id,slug)
            const { data: existing } = await supabase
                .from("zones")
                .select("id")
                .eq("city_id", city.id)
                .eq("slug", zone.slug)
                .single();

            if (existing) {
                skipped++;
            } else {
                const { error: insertError } = await supabase.from("zones").insert({
                    city_id: city.id,
                    name: zone.name,
                    slug: zone.slug,
                    type: zone.type,
                    priority: zone.priority,
                    is_active: true,
                });
                if (insertError) {
                    console.error(`  Error: ${zone.name}: ${insertError.message}`);
                } else {
                    created++;
                }
            }
        } else {
            created++;
        }
    }

    console.log(`Done! Created: ${created}, Skipped: ${skipped}`);
}

main().catch(console.error);

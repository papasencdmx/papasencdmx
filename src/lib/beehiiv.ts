// Beehiiv API helpers — server-side only

interface BeehiivPost {
    id: string;
    title: string;
    subtitle: string | null;
    slug: string;
    status: string;
    web_url: string;
    publish_date: number; // unix timestamp
    displayed_date: string | null;
    content_tags: string[];
    thumbnail_url: string | null;
    // We only use the fields above, but the API returns more
}

interface BeehiivPostsResponse {
    data: BeehiivPost[];
    total_results: number;
}

/**
 * Fetch the latest published posts from Beehiiv.
 * Returns up to `limit` posts, sorted by most recent.
 */
export async function getBeehiivPosts(limit = 4): Promise<BeehiivPost[]> {
    const pubId = process.env.BEEHIIV_PUB_ID;
    const apiKey = process.env.BEEHIIV_API_KEY;

    if (!pubId || !apiKey) {
        console.warn("Beehiiv env vars missing, using fallback posts");
        return [];
    }

    try {
        const res = await fetch(
            `https://api.beehiiv.com/v2/publications/${pubId}/posts?status=confirmed&limit=${limit}&order_by=publish_date&direction=desc&expand=stats`,
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                next: { revalidate: 3600 }, // cache for 1 hour
            }
        );

        if (!res.ok) {
            console.error("Beehiiv posts fetch failed:", res.status);
            return [];
        }

        const json: BeehiivPostsResponse = await res.json();
        return json.data || [];
    } catch (err) {
        console.error("Beehiiv posts error:", err);
        return [];
    }
}

/**
 * Jikan API Client (v4)
 * Fetches anime data from MyAnimeList via Jikan API
 * https://docs.api.jikan.moe/
 */

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

// Rate limiting: Jikan has a limit of 3 requests per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 350; // 350ms between requests (~2.8 req/sec to be safe)
const MAX_RETRIES = 3;

async function rateLimitedFetch<T>(url: string, retryCount = 0): Promise<T> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    // Rate limiting: ensure minimum interval between requests
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise(resolve =>
            setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
        );
    }

    lastRequestTime = Date.now();

    try {
        const response = await fetch(url, {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!response.ok) {
            if (response.status === 429) {
                // Rate limited - exponential backoff
                const waitTime = Math.min(1000 * Math.pow(2, retryCount), 8000);
                console.warn(`⏱️ Jikan Rate limit! ${waitTime}ms bekleniyor... (Deneme ${retryCount + 1}/${MAX_RETRIES})`);

                if (retryCount < MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    return rateLimitedFetch(url, retryCount + 1);
                }
                throw new Error(`Jikan API rate limit aşıldı (${MAX_RETRIES} deneme)`);
            }
            throw new Error(`Jikan API error: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        if (retryCount < MAX_RETRIES && error instanceof Error && error.message.includes('fetch')) {
            // Network error - retry
            const waitTime = 1000 * (retryCount + 1);
            console.warn(`🔄 Jikan network error, ${waitTime}ms sonra yeniden deneniyor...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return rateLimitedFetch(url, retryCount + 1);
        }
        throw error;
    }
}

// ============================================
// Types
// ============================================

export interface JikanImage {
    jpg: {
        image_url: string;
        small_image_url: string;
        large_image_url: string;
    };
    webp: {
        image_url: string;
        small_image_url: string;
        large_image_url: string;
    };
}

export interface JikanAnime {
    mal_id: number;
    url: string;
    images: JikanImage;
    trailer?: {
        youtube_id: string | null;
        url: string | null;
        embed_url: string | null;
    };
    approved: boolean;
    titles: Array<{
        type: string;
        title: string;
    }>;
    title: string;
    title_english: string | null;
    title_japanese: string | null;
    title_synonyms: string[];
    type: "TV" | "Movie" | "OVA" | "ONA" | "Special" | "Music" | null;
    source: string;
    episodes: number | null;
    status: "Finished Airing" | "Currently Airing" | "Not yet aired";
    airing: boolean;
    aired: {
        from: string | null;
        to: string | null;
        prop: {
            from: { day: number; month: number; year: number };
            to: { day: number; month: number; year: number };
        };
        string: string;
    };
    duration: string;
    rating: string | null;
    score: number | null;
    scored_by: number | null;
    rank: number | null;
    popularity: number | null;
    members: number;
    favorites: number;
    synopsis: string | null;
    background: string | null;
    season: "winter" | "spring" | "summer" | "fall" | null;
    year: number | null;
    broadcast?: {
        day: string | null;
        time: string | null;
        timezone: string | null;
        string: string | null;
    };
    producers: Array<{ mal_id: number; name: string; url: string }>;
    licensors: Array<{ mal_id: number; name: string; url: string }>;
    studios: Array<{ mal_id: number; name: string; url: string }>;
    genres: Array<{ mal_id: number; type: string; name: string; url: string }>;
    explicit_genres: Array<{ mal_id: number; type: string; name: string; url: string }>;
    themes: Array<{ mal_id: number; type: string; name: string; url: string }>;
    demographics: Array<{ mal_id: number; type: string; name: string; url: string }>;
}

export interface JikanPagination {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: {
        count: number;
        total: number;
        per_page: number;
    };
}

export interface JikanSearchResponse {
    pagination: JikanPagination;
    data: JikanAnime[];
}

export interface JikanAnimeFullResponse {
    data: JikanAnime;
}

export interface JikanCharacter {
    character: {
        mal_id: number;
        url: string;
        images: JikanImage;
        name: string;
    };
    role: "Main" | "Supporting";
    voice_actors: Array<{
        person: {
            mal_id: number;
            url: string;
            images: JikanImage;
            name: string;
        };
        language: string;
    }>;
}

// ============================================
// API Functions
// ============================================

/**
 * Search anime by query
 */
export async function searchAnime(
    query: string,
    page = 1,
    limit = 25
): Promise<JikanSearchResponse> {
    const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        limit: limit.toString(),
        sfw: "true", // Safe for work filter
    });

    return rateLimitedFetch<JikanSearchResponse>(
        `${JIKAN_BASE_URL}/anime?${params}`
    );
}

/**
 * Get top anime by various filters
 */
export async function getAnimeTop(
    filter:
        | "airing"
        | "upcoming"
        | "bypopularity"
        | "favorite"
        | ""
        = "",
    page = 1,
    limit = 25
): Promise<JikanSearchResponse> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sfw: "true",
    });

    if (filter) {
        params.set("filter", filter);
    }

    return rateLimitedFetch<JikanSearchResponse>(
        `${JIKAN_BASE_URL}/top/anime?${params}`
    );
}

/**
 * Get anime details by MAL ID
 */
export async function getAnimeDetails(malId: number): Promise<JikanAnime | null> {
    try {
        const response = await rateLimitedFetch<JikanAnimeFullResponse>(
            `${JIKAN_BASE_URL}/anime/${malId}/full`
        );
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch anime ${malId}:`, error);
        return null;
    }
}

/**
 * Get anime by season
 */
export async function getAnimeBySeason(
    year: number,
    season: "winter" | "spring" | "summer" | "fall",
    page = 1,
    limit = 25
): Promise<JikanSearchResponse> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sfw: "true",
    });

    return rateLimitedFetch<JikanSearchResponse>(
        `${JIKAN_BASE_URL}/seasons/${year}/${season}?${params}`
    );
}

/**
 * Get currently airing anime this season
 */
export async function getSeasonNow(page = 1, limit = 25): Promise<JikanSearchResponse> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sfw: "true",
    });

    return rateLimitedFetch<JikanSearchResponse>(
        `${JIKAN_BASE_URL}/seasons/now?${params}`
    );
}

/**
 * Get upcoming anime
 */
export async function getSeasonUpcoming(page = 1, limit = 25): Promise<JikanSearchResponse> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sfw: "true",
    });

    return rateLimitedFetch<JikanSearchResponse>(
        `${JIKAN_BASE_URL}/seasons/upcoming?${params}`
    );
}

/**
 * Get anime characters
 */
export async function getAnimeCharacters(
    malId: number
): Promise<JikanCharacter[]> {
    try {
        const response = await rateLimitedFetch<{ data: JikanCharacter[] }>(
            `${JIKAN_BASE_URL}/anime/${malId}/characters`
        );
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch characters for anime ${malId}:`, error);
        return [];
    }
}

/**
 * Get anime recommendations
 */
export async function getAnimeRecommendations(
    malId: number
): Promise<Array<{ entry: JikanAnime; votes: number }>> {
    try {
        const response = await rateLimitedFetch<{
            data: Array<{ entry: JikanAnime; votes: number }>;
        }>(`${JIKAN_BASE_URL}/anime/${malId}/recommendations`);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch recommendations for anime ${malId}:`, error);
        return [];
    }
}

/**
 * Get anime by genre
 */
export async function getAnimeByGenre(
    genreId: number,
    page = 1,
    limit = 25
): Promise<JikanSearchResponse> {
    const params = new URLSearchParams({
        genres: genreId.toString(),
        page: page.toString(),
        limit: limit.toString(),
        sfw: "true",
        order_by: "score",
        sort: "desc",
    });

    return rateLimitedFetch<JikanSearchResponse>(
        `${JIKAN_BASE_URL}/anime?${params}`
    );
}

/**
 * Get all anime genres
 */
export async function getAnimeGenres(): Promise<
    Array<{ mal_id: number; name: string; count: number }>
> {
    try {
        const response = await rateLimitedFetch<{
            data: Array<{ mal_id: number; name: string; count: number }>;
        }>(`${JIKAN_BASE_URL}/genres/anime`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch anime genres:", error);
        return [];
    }
}

// Common anime genre IDs
export const ANIME_GENRES = {
    ACTION: 1,
    ADVENTURE: 2,
    COMEDY: 4,
    DRAMA: 8,
    FANTASY: 10,
    HORROR: 14,
    MYSTERY: 7,
    PSYCHOLOGICAL: 40,
    ROMANCE: 22,
    SCI_FI: 24,
    SLICE_OF_LIFE: 36,
    SPORTS: 30,
    SUPERNATURAL: 37,
    THRILLER: 41,
} as const;

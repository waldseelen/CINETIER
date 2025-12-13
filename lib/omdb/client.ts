/**
 * OMDb API Client
 * Fetches external ratings (IMDb, Rotten Tomatoes, Metascore) for movies/TV shows
 */

const OMDB_BASE_URL = "https://www.omdbapi.com";
const OMDB_API_KEY = process.env.OMDB_API_KEY || "775dc7e5";

export interface OMDbRatings {
    imdbRating: number | null;
    imdbVotes: string | null;
    rtRating: number | null;
    metascore: number | null;
}

export interface OMDbResponse {
    Title: string;
    Year: string;
    Rated: string;
    Released: string;
    Runtime: string;
    Genre: string;
    Director: string;
    Writer: string;
    Actors: string;
    Plot: string;
    Language: string;
    Country: string;
    Awards: string;
    Poster: string;
    Ratings: Array<{
        Source: string;
        Value: string;
    }>;
    Metascore: string;
    imdbRating: string;
    imdbVotes: string;
    imdbID: string;
    Type: string;
    totalSeasons?: string;
    Response: "True" | "False";
    Error?: string;
}

/**
 * Parse rating value from OMDb format to number
 */
function parseRating(value: string | undefined, type: "imdb" | "rt" | "meta"): number | null {
    if (!value || value === "N/A") return null;

    switch (type) {
        case "imdb":
            // IMDb: "8.5" -> 8.5
            const imdbNum = parseFloat(value);
            return isNaN(imdbNum) ? null : imdbNum;

        case "rt":
            // Rotten Tomatoes: "92%" -> 92
            const rtMatch = value.match(/(\d+)%/);
            return rtMatch ? parseInt(rtMatch[1], 10) : null;

        case "meta":
            // Metascore: "85" or "85/100" -> 85
            const metaNum = parseInt(value, 10);
            return isNaN(metaNum) ? null : metaNum;

        default:
            return null;
    }
}

/**
 * Fetch ratings from OMDb API by IMDb ID
 */
export async function fetchOMDbRatings(imdbId: string): Promise<OMDbRatings | null> {
    if (!imdbId || !imdbId.startsWith("tt")) {
        console.warn("Invalid IMDb ID:", imdbId);
        return null;
    }

    try {
        const url = `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&i=${imdbId}`;
        const response = await fetch(url, {
            next: { revalidate: 86400 }, // Cache for 24 hours on server
        });

        if (!response.ok) {
            throw new Error(`OMDb API error: ${response.status}`);
        }

        const data: OMDbResponse = await response.json();

        if (data.Response === "False") {
            console.warn("OMDb API returned error:", data.Error);
            return null;
        }

        // Parse Rotten Tomatoes from Ratings array
        const rtRating = data.Ratings?.find(r => r.Source === "Rotten Tomatoes");

        return {
            imdbRating: parseRating(data.imdbRating, "imdb"),
            imdbVotes: data.imdbVotes !== "N/A" ? data.imdbVotes : null,
            rtRating: rtRating ? parseRating(rtRating.Value, "rt") : null,
            metascore: parseRating(data.Metascore, "meta"),
        };
    } catch (error) {
        console.error("Failed to fetch OMDb ratings:", error);
        return null;
    }
}

/**
 * Fetch ratings from OMDb API by title and year
 */
export async function fetchOMDbRatingsByTitle(
    title: string,
    year?: number,
    type?: "movie" | "series"
): Promise<OMDbRatings | null> {
    try {
        const params = new URLSearchParams({
            apikey: OMDB_API_KEY,
            t: title,
        });

        if (year) params.set("y", year.toString());
        if (type) params.set("type", type);

        const url = `${OMDB_BASE_URL}/?${params}`;
        const response = await fetch(url, {
            next: { revalidate: 86400 },
        });

        if (!response.ok) {
            throw new Error(`OMDb API error: ${response.status}`);
        }

        const data: OMDbResponse = await response.json();

        if (data.Response === "False") {
            return null;
        }

        const rtRating = data.Ratings?.find(r => r.Source === "Rotten Tomatoes");

        return {
            imdbRating: parseRating(data.imdbRating, "imdb"),
            imdbVotes: data.imdbVotes !== "N/A" ? data.imdbVotes : null,
            rtRating: rtRating ? parseRating(rtRating.Value, "rt") : null,
            metascore: parseRating(data.Metascore, "meta"),
        };
    } catch (error) {
        console.error("Failed to fetch OMDb ratings by title:", error);
        return null;
    }
}

/**
 * Search OMDb by title (returns basic info)
 */
export async function searchOMDb(
    query: string,
    type?: "movie" | "series",
    year?: number
): Promise<OMDbResponse[]> {
    try {
        const params = new URLSearchParams({
            apikey: OMDB_API_KEY,
            s: query,
        });

        if (type) params.set("type", type);
        if (year) params.set("y", year.toString());

        const url = `${OMDB_BASE_URL}/?${params}`;
        const response = await fetch(url, {
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            throw new Error(`OMDb API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.Response === "False") {
            return [];
        }

        return data.Search || [];
    } catch (error) {
        console.error("Failed to search OMDb:", error);
        return [];
    }
}

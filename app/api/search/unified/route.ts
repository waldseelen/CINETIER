import { mapJikanToSearchResult, searchAnime } from "@/lib/jikan";
import { tmdb } from "@/lib/tmdb/client";
import { NextRequest, NextResponse } from "next/server";

interface UnifiedSearchResult {
    id: number;
    title: string;
    posterUrl: string | null;
    releaseDate: string | null;
    voteAverage: number | null;
    overview: string | null;
    mediaType: "movie" | "tv" | "anime" | "person";
    source: "tmdb" | "jikan";
    // Additional fields for anime
    episodes?: number | null;
    status?: string;
}

/**
 * GET /api/search/unified
 * Unified search across TMDB and Jikan (anime)
 * Query params:
 * - q: search query (required)
 * - types: comma-separated list of types to search (movie,tv,anime) - defaults to all
 * - page: page number
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const typesParam = searchParams.get("types") || "movie,tv,anime";
    const page = parseInt(searchParams.get("page") || "1");

    if (!query || query.trim().length < 2) {
        return NextResponse.json(
            { error: "Query parameter 'q' is required and must be at least 2 characters" },
            { status: 400 }
        );
    }

    // Normalize query: lowercase, trim
    const normalizedQuery = query.toLowerCase().trim();
    const types = typesParam.split(",").map(t => t.trim().toLowerCase());

    const searchMoviesTV = types.includes("movie") || types.includes("tv");
    const searchAnimeContent = types.includes("anime");

    try {
        const results: UnifiedSearchResult[] = [];

        // Parallel fetch from both sources
        const [tmdbResult, animeResult] = await Promise.all([
            searchMoviesTV
                ? tmdb.searchMulti(normalizedQuery, page)
                : Promise.resolve({ results: [], page: 1, total_pages: 0, total_results: 0 }),
            searchAnimeContent
                ? searchAnime(normalizedQuery, page, 15)
                : Promise.resolve({ data: [], pagination: { current_page: 1, has_next_page: false, last_visible_page: 1, items: { count: 0, total: 0, per_page: 25 } } }),
        ]);

        // Map TMDB results
        if (searchMoviesTV) {
            for (const item of tmdbResult.results) {
                // Skip person results unless specifically requested
                if ("media_type" in item && item.media_type === "person") {
                    continue;
                }

                const mediaType = "title" in item ? "movie" : "tv";
                const title = "title" in item ? item.title : (item as any).name;
                const releaseDate = "release_date" in item
                    ? item.release_date
                    : (item as any).first_air_date;

                // Filter by requested types
                if (!types.includes(mediaType)) continue;

                results.push({
                    id: item.id,
                    title,
                    posterUrl: item.poster_path
                        ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                        : null,
                    releaseDate,
                    voteAverage: item.vote_average,
                    overview: item.overview,
                    mediaType,
                    source: "tmdb",
                });
            }
        }

        // Map Jikan results
        if (searchAnimeContent) {
            for (const anime of animeResult.data) {
                const mapped = mapJikanToSearchResult(anime);
                results.push({
                    id: mapped.malId,
                    title: mapped.title,
                    posterUrl: mapped.posterUrl,
                    releaseDate: mapped.year ? `${mapped.year}` : null,
                    voteAverage: mapped.score,
                    overview: mapped.synopsis,
                    mediaType: "anime",
                    source: "jikan",
                    episodes: mapped.episodes,
                    status: mapped.status,
                });
            }
        }

        // Sort by relevance (items with higher vote averages first, then by title match)
        results.sort((a, b) => {
            // Prioritize exact title matches
            const aExact = a.title.toLowerCase() === normalizedQuery ? 1 : 0;
            const bExact = b.title.toLowerCase() === normalizedQuery ? 1 : 0;
            if (aExact !== bExact) return bExact - aExact;

            // Then by vote average
            const aScore = a.voteAverage || 0;
            const bScore = b.voteAverage || 0;
            return bScore - aScore;
        });

        return NextResponse.json({
            success: true,
            query: normalizedQuery,
            data: results,
            pagination: {
                page,
                totalPages: Math.max(tmdbResult.total_pages, animeResult.pagination.last_visible_page),
                hasMore: tmdbResult.total_pages > page || animeResult.pagination.has_next_page,
            },
        });
    } catch (error) {
        console.error("Unified search error:", error);
        return NextResponse.json(
            { error: "Search failed" },
            { status: 500 }
        );
    }
}

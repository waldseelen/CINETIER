import {
    getAnimeByGenre,
    getAnimeDetails,
    getAnimeGenres,
    getAnimeTop,
    getSeasonNow,
    getSeasonUpcoming,
    searchAnime,
} from "@/lib/jikan";
import { mapJikanToSearchResult } from "@/lib/jikan/mapper";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/anime
 * Query params:
 * - action: search | top | season | upcoming | details | genre | genres
 * - q: search query (for search action)
 * - filter: airing | upcoming | bypopularity | favorite (for top action)
 * - id: MAL ID (for details action)
 * - genreId: genre MAL ID (for genre action)
 * - page: page number
 * - limit: results per page
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action") || "top";
    const query = searchParams.get("q");
    const filter = searchParams.get("filter") as "airing" | "upcoming" | "bypopularity" | "favorite" | "";
    const id = searchParams.get("id");
    const genreId = searchParams.get("genreId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");

    try {
        switch (action) {
            case "search": {
                if (!query) {
                    return NextResponse.json(
                        { error: "Query parameter 'q' is required for search" },
                        { status: 400 }
                    );
                }

                const results = await searchAnime(query, page, limit);
                return NextResponse.json({
                    success: true,
                    data: results.data.map(mapJikanToSearchResult),
                    pagination: results.pagination,
                });
            }

            case "top": {
                const results = await getAnimeTop(filter || "", page, limit);
                return NextResponse.json({
                    success: true,
                    data: results.data.map(mapJikanToSearchResult),
                    pagination: results.pagination,
                });
            }

            case "season": {
                const results = await getSeasonNow(page, limit);
                return NextResponse.json({
                    success: true,
                    data: results.data.map(mapJikanToSearchResult),
                    pagination: results.pagination,
                });
            }

            case "upcoming": {
                const results = await getSeasonUpcoming(page, limit);
                return NextResponse.json({
                    success: true,
                    data: results.data.map(mapJikanToSearchResult),
                    pagination: results.pagination,
                });
            }

            case "details": {
                if (!id) {
                    return NextResponse.json(
                        { error: "Parameter 'id' is required for details" },
                        { status: 400 }
                    );
                }

                const anime = await getAnimeDetails(parseInt(id));
                if (!anime) {
                    return NextResponse.json(
                        { error: "Anime not found" },
                        { status: 404 }
                    );
                }

                return NextResponse.json({
                    success: true,
                    data: anime,
                });
            }

            case "genre": {
                if (!genreId) {
                    return NextResponse.json(
                        { error: "Parameter 'genreId' is required for genre action" },
                        { status: 400 }
                    );
                }

                const results = await getAnimeByGenre(parseInt(genreId), page, limit);
                return NextResponse.json({
                    success: true,
                    data: results.data.map(mapJikanToSearchResult),
                    pagination: results.pagination,
                });
            }

            case "genres": {
                const genres = await getAnimeGenres();
                return NextResponse.json({
                    success: true,
                    data: genres,
                });
            }

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}` },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error("Anime API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch anime data" },
            { status: 500 }
        );
    }
}

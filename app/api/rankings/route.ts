import { createClient } from "@/lib/supabase/server";
import { tmdb } from "@/lib/tmdb/client";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/rankings
 * Get top rated movies/TV shows with external ratings
 * Query params:
 * - type: movie | tv (defaults to movie)
 * - genre: genre ID for filtering
 * - page: page number
 * - limit: results per page (max 50)
 * - sortBy: imdb | tmdb | rt | metascore (defaults to imdb)
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const type = (searchParams.get("type") || "movie") as "movie" | "tv";
    const genreId = searchParams.get("genre");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "25"), 50);
    const sortBy = searchParams.get("sortBy") || "imdb";

    try {
        const supabase = await createClient();

        // Build query for cached media with ratings
        let query = supabase
            .from("media")
            .select("*")
            .eq("media_type", type)
            .not("imdb_rating", "is", null);

        // Apply sorting
        switch (sortBy) {
            case "imdb":
                query = query.order("imdb_rating", { ascending: false, nullsFirst: false });
                break;
            case "rt":
                query = query.order("rt_rating", { ascending: false, nullsFirst: false });
                break;
            case "metascore":
                query = query.order("metascore", { ascending: false, nullsFirst: false });
                break;
            case "tmdb":
            default:
                query = query.order("vote_average", { ascending: false });
        }

        // Pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data: cachedMedia, error: cacheError } = await query;

        // If we have enough cached results, return them
        if (cachedMedia && cachedMedia.length >= limit) {
            return NextResponse.json({
                success: true,
                data: cachedMedia.map(mapDbMediaToResponse),
                pagination: {
                    page,
                    limit,
                    hasMore: cachedMedia.length === limit,
                },
                source: "cache",
            });
        }

        // Otherwise, fetch from TMDB and return
        const discoverParams = {
            page,
            sortBy: "vote_average.desc",
            ...(genreId && { genres: [parseInt(genreId)] }),
        };

        const tmdbResults = type === "movie"
            ? await tmdb.discoverMovies(discoverParams)
            : await tmdb.discoverTV(discoverParams);

        const results = tmdbResults.results.slice(0, limit).map((item: any) => ({
            id: null, // Not in our DB yet
            tmdbId: item.id,
            mediaType: type,
            title: type === "movie" ? item.title : item.name,
            originalTitle: type === "movie" ? item.original_title : item.original_name,
            posterPath: item.poster_path,
            backdropPath: item.backdrop_path,
            releaseDate: type === "movie" ? item.release_date : item.first_air_date,
            overview: item.overview,
            voteAverage: item.vote_average,
            genres: item.genre_ids?.map((id: number) => ({ id, name: "" })) || [],
            // External ratings will be fetched separately
            imdbRating: null,
            rtRating: null,
            metascore: null,
        }));

        return NextResponse.json({
            success: true,
            data: results,
            pagination: {
                page,
                limit,
                totalPages: tmdbResults.total_pages,
                totalResults: tmdbResults.total_results,
                hasMore: page < tmdbResults.total_pages,
            },
            source: "tmdb",
        });
    } catch (error) {
        console.error("Rankings API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch rankings" },
            { status: 500 }
        );
    }
}

function mapDbMediaToResponse(media: any) {
    return {
        id: media.id,
        tmdbId: media.tmdb_id,
        mediaType: media.media_type,
        title: media.title,
        originalTitle: media.original_title,
        posterPath: media.poster_path,
        backdropPath: media.backdrop_path,
        releaseDate: media.release_date,
        overview: media.overview,
        voteAverage: media.vote_average,
        genres: media.genres || [],
        globalElo: media.global_elo,
        imdbRating: media.imdb_rating,
        rtRating: media.rt_rating,
        metascore: media.metascore,
        imdbId: media.imdb_id,
    };
}

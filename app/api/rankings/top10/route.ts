import { tmdb } from "@/lib/tmdb/client";
import { NextRequest, NextResponse } from "next/server";

// Popular genres with their TMDB IDs
const MOVIE_GENRES = [
    { id: 28, name: "Aksiyon", slug: "action" },
    { id: 12, name: "Macera", slug: "adventure" },
    { id: 16, name: "Animasyon", slug: "animation" },
    { id: 35, name: "Komedi", slug: "comedy" },
    { id: 80, name: "Suç", slug: "crime" },
    { id: 99, name: "Belgesel", slug: "documentary" },
    { id: 18, name: "Drama", slug: "drama" },
    { id: 10751, name: "Aile", slug: "family" },
    { id: 14, name: "Fantastik", slug: "fantasy" },
    { id: 36, name: "Tarih", slug: "history" },
    { id: 27, name: "Korku", slug: "horror" },
    { id: 10402, name: "Müzik", slug: "music" },
    { id: 9648, name: "Gizem", slug: "mystery" },
    { id: 10749, name: "Romantik", slug: "romance" },
    { id: 878, name: "Bilim Kurgu", slug: "sci-fi" },
    { id: 53, name: "Gerilim", slug: "thriller" },
    { id: 10752, name: "Savaş", slug: "war" },
    { id: 37, name: "Western", slug: "western" },
];

const TV_GENRES = [
    { id: 10759, name: "Aksiyon & Macera", slug: "action-adventure" },
    { id: 16, name: "Animasyon", slug: "animation" },
    { id: 35, name: "Komedi", slug: "comedy" },
    { id: 80, name: "Suç", slug: "crime" },
    { id: 99, name: "Belgesel", slug: "documentary" },
    { id: 18, name: "Drama", slug: "drama" },
    { id: 10751, name: "Aile", slug: "family" },
    { id: 10762, name: "Çocuk", slug: "kids" },
    { id: 9648, name: "Gizem", slug: "mystery" },
    { id: 10763, name: "Haber", slug: "news" },
    { id: 10764, name: "Reality", slug: "reality" },
    { id: 10765, name: "Bilim Kurgu & Fantastik", slug: "sci-fi-fantasy" },
    { id: 10766, name: "Pembe Dizi", slug: "soap" },
    { id: 10767, name: "Talk Show", slug: "talk" },
    { id: 10768, name: "Savaş & Politik", slug: "war-politics" },
    { id: 37, name: "Western", slug: "western" },
];

/**
 * GET /api/rankings/top10
 * Get top 10 media by genre
 * Query params:
 * - type: movie | tv
 * - genre: genre slug (e.g., "action", "drama")
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const type = (searchParams.get("type") || "movie") as "movie" | "tv";
    const genreSlug = searchParams.get("genre");

    try {
        const genreList = type === "movie" ? MOVIE_GENRES : TV_GENRES;

        // If no genre specified, return available genres
        if (!genreSlug) {
            return NextResponse.json({
                success: true,
                genres: genreList,
            });
        }

        // Find genre by slug
        const genre = genreList.find(g => g.slug === genreSlug);
        if (!genre) {
            return NextResponse.json(
                { error: `Unknown genre: ${genreSlug}` },
                { status: 400 }
            );
        }

        // Fetch top rated for this genre
        const discoverParams = {
            page: 1,
            sortBy: "vote_average.desc",
            genres: [genre.id],
        };

        const results = type === "movie"
            ? await tmdb.discoverMovies(discoverParams)
            : await tmdb.discoverTV(discoverParams);

        // Take top 10 with vote_count > 1000 for quality
        const top10 = results.results
            .filter((item: any) => item.vote_count > 1000)
            .slice(0, 10)
            .map((item: any, index: number) => ({
                rank: index + 1,
                id: item.id,
                tmdbId: item.id,
                mediaType: type,
                title: type === "movie" ? item.title : item.name,
                originalTitle: type === "movie" ? item.original_title : item.original_name,
                posterPath: item.poster_path,
                backdropPath: item.backdrop_path,
                releaseDate: type === "movie" ? item.release_date : item.first_air_date,
                overview: item.overview,
                voteAverage: item.vote_average,
                voteCount: item.vote_count,
            }));

        return NextResponse.json({
            success: true,
            genre,
            data: top10,
        });
    } catch (error) {
        console.error("Top 10 API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch top 10" },
            { status: 500 }
        );
    }
}

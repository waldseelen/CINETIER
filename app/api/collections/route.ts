import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/collections
 * Search for movie collections (e.g., Harry Potter, Marvel, etc.)
 * Query params:
 * - q: search query
 * - id: collection ID (to get collection details)
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const collectionId = searchParams.get("id");

    try {
        // If collection ID is provided, get collection details
        if (collectionId) {
            const response = await fetch(
                `https://api.themoviedb.org/3/collection/${collectionId}?language=tr-TR`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                    next: { revalidate: 86400 }, // Cache for 1 day
                }
            );

            if (!response.ok) {
                return NextResponse.json(
                    { error: "Collection not found" },
                    { status: 404 }
                );
            }

            const collection = await response.json();

            // Sort parts by release date
            const sortedParts = collection.parts?.sort(
                (a: any, b: any) =>
                    new Date(a.release_date || "9999").getTime() -
                    new Date(b.release_date || "9999").getTime()
            );

            return NextResponse.json({
                success: true,
                data: {
                    id: collection.id,
                    name: collection.name,
                    overview: collection.overview,
                    posterPath: collection.poster_path,
                    backdropPath: collection.backdrop_path,
                    parts: sortedParts?.map((part: any) => ({
                        id: part.id,
                        tmdbId: part.id,
                        title: part.title,
                        posterPath: part.poster_path,
                        releaseDate: part.release_date,
                        voteAverage: part.vote_average,
                        mediaType: "movie",
                    })),
                },
            });
        }

        // Search collections
        if (!query) {
            return NextResponse.json(
                { error: "Query parameter 'q' or 'id' is required" },
                { status: 400 }
            );
        }

        const response = await fetch(
            `https://api.themoviedb.org/3/search/collection?query=${encodeURIComponent(
                query
            )}&language=tr-TR`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                },
                next: { revalidate: 3600 },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to search collections");
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            data: data.results?.map((collection: any) => ({
                id: collection.id,
                name: collection.name,
                posterPath: collection.poster_path,
                backdropPath: collection.backdrop_path,
            })),
            pagination: {
                page: data.page,
                totalPages: data.total_pages,
                totalResults: data.total_results,
            },
        });
    } catch (error) {
        console.error("Collections API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch collections" },
            { status: 500 }
        );
    }
}

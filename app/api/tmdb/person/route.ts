import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const personId = searchParams.get("id");

    if (!TMDB_API_KEY) {
        return NextResponse.json({ error: "TMDB API key not configured" }, { status: 500 });
    }

    try {
        // Get person by ID
        if (personId) {
            const response = await fetch(
                `${TMDB_BASE_URL}/person/${personId}?api_key=${TMDB_API_KEY}&language=tr-TR&append_to_response=combined_credits`,
                { next: { revalidate: 3600 } }
            );

            if (!response.ok) {
                return NextResponse.json({ error: "Person not found" }, { status: 404 });
            }

            const data = await response.json();
            return NextResponse.json({
                id: data.id,
                name: data.name,
                profile_path: data.profile_path,
                known_for_department: data.known_for_department,
                popularity: data.popularity,
                biography: data.biography,
                birthday: data.birthday,
                place_of_birth: data.place_of_birth,
                credits: {
                    cast: data.combined_credits?.cast?.slice(0, 20) || [],
                    crew: data.combined_credits?.crew?.slice(0, 10) || [],
                },
            });
        }

        // Search persons
        if (query) {
            const response = await fetch(
                `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&language=tr-TR&query=${encodeURIComponent(query)}&page=1`,
                { next: { revalidate: 3600 } }
            );

            if (!response.ok) {
                return NextResponse.json({ error: "Search failed" }, { status: 500 });
            }

            const data = await response.json();
            return NextResponse.json({
                results: data.results.map((person: any) => ({
                    id: person.id,
                    name: person.name,
                    profile_path: person.profile_path,
                    known_for_department: person.known_for_department,
                    popularity: person.popularity,
                    known_for: person.known_for?.slice(0, 3) || [],
                })),
                total_results: data.total_results,
            });
        }

        // Get popular persons
        const response = await fetch(
            `${TMDB_BASE_URL}/person/popular?api_key=${TMDB_API_KEY}&language=tr-TR&page=1`,
            { next: { revalidate: 3600 } }
        );

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch popular persons" }, { status: 500 });
        }

        const data = await response.json();
        return NextResponse.json({
            results: data.results.map((person: any) => ({
                id: person.id,
                name: person.name,
                profile_path: person.profile_path,
                known_for_department: person.known_for_department,
                popularity: person.popularity,
                known_for: person.known_for?.slice(0, 3) || [],
            })),
        });
    } catch (error) {
        console.error("Person API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

import { tmdb } from "@/lib/tmdb/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const type = searchParams.get("type"); // movie, tv, or multi
    const page = parseInt(searchParams.get("page") || "1");

    if (!query) {
        return NextResponse.json(
            { error: "Query parameter 'q' is required" },
            { status: 400 }
        );
    }

    try {
        let results;

        switch (type) {
            case "movie":
                results = await tmdb.searchMovies(query, page);
                break;
            case "tv":
                results = await tmdb.searchTV(query, page);
                break;
            default:
                results = await tmdb.searchMulti(query, page);
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error("TMDB search error:", error);
        return NextResponse.json(
            { error: "Failed to search TMDB" },
            { status: 500 }
        );
    }
}

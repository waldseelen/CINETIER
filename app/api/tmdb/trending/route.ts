import { tmdb } from "@/lib/tmdb/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type"); // movie, tv, or all
    const timeWindow = (searchParams.get("time") as "day" | "week") || "week";
    const page = parseInt(searchParams.get("page") || "1");

    try {
        let results;

        switch (type) {
            case "movie":
                results = await tmdb.getTrendingMovies(timeWindow, page);
                break;
            case "tv":
                results = await tmdb.getTrendingTV(timeWindow, page);
                break;
            default:
                results = await tmdb.getTrendingAll(timeWindow, page);
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error("TMDB trending error:", error);
        return NextResponse.json(
            { error: "Failed to fetch trending" },
            { status: 500 }
        );
    }
}

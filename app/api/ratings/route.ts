import { fetchExternalRatings } from "@/lib/omdb";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/ratings?mediaId=xxx&imdbId=xxx
 * Fetch external ratings (IMDb, RT, Metascore) for a media item
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mediaId = searchParams.get("mediaId");
    const imdbId = searchParams.get("imdbId");

    if (!mediaId) {
        return NextResponse.json(
            { error: "mediaId parameter is required" },
            { status: 400 }
        );
    }

    try {
        const ratings = await fetchExternalRatings(mediaId, imdbId);

        return NextResponse.json({
            success: true,
            data: ratings,
        });
    } catch (error) {
        console.error("Failed to fetch ratings:", error);
        return NextResponse.json(
            { error: "Failed to fetch external ratings" },
            { status: 500 }
        );
    }
}

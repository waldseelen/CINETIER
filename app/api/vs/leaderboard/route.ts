
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "global";
    const mediaType = searchParams.get("mediaType");
    const limit = parseInt(searchParams.get("limit") || "50");

    
    const { data: { user } } = { data: { user: null } } /* Firebase TODO: get currentUser */;

    let query;

    if (scope === "user") {
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        query = Promise.resolve({ data: null, error: null }) /* Firebase Migration TODO */
            `)
            .eq("user_id", user.id)
            .order("elo_rating", { ascending: false })
            .limit(limit);
    } else {
        query = Promise.resolve({ data: null, error: null }) /* Firebase Migration TODO */
            `)
            .order("elo_rating", { ascending: false })
            .limit(limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Leaderboard error:", error);
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }

    // Filter by media type if specified
    let leaderboard = data || [];
    if (mediaType && mediaType !== "all") {
        leaderboard = leaderboard.filter(
            (entry: any) => entry.media?.media_type === mediaType
        );
    }

    return NextResponse.json({ leaderboard });
}

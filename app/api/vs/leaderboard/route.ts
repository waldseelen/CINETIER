import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "global";
    const mediaType = searchParams.get("mediaType");
    const limit = parseInt(searchParams.get("limit") || "50");

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let query;

    if (scope === "user") {
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        query = supabase
            .from("user_elo_ratings")
            .select(`
                media_id,
                elo_rating,
                match_count,
                win_count,
                media:media_id (
                    tmdb_id,
                    media_type,
                    title,
                    poster_path,
                    year
                )
            `)
            .eq("user_id", user.id)
            .order("elo_rating", { ascending: false })
            .limit(limit);
    } else {
        query = supabase
            .from("global_elo_ratings")
            .select(`
                media_id,
                elo_rating,
                match_count,
                win_count,
                media:media_id (
                    tmdb_id,
                    media_type,
                    title,
                    poster_path,
                    year
                )
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

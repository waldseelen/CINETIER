import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Elo calculation constants
const K_FACTOR = 32;
const DEFAULT_ELO = 1500;

function calculateElo(winnerElo: number, loserElo: number): { newWinnerElo: number; newLoserElo: number } {
    const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

    const newWinnerElo = Math.round(winnerElo + K_FACTOR * (1 - expectedWinner));
    const newLoserElo = Math.round(loserElo + K_FACTOR * (0 - expectedLoser));

    return { newWinnerElo, newLoserElo };
}

// GET /api/vs - Get random matchup
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const scope = searchParams.get("scope") || "global";
    const mediaType = searchParams.get("mediaType") || "movie";

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    try {
        if (scope === "user" && user) {
            // Get from user's watched list
            const { data: watchedMedia } = await supabase
                .from("user_media_entries")
                .select(`
                    media:media_id (
                        id,
                        tmdb_id,
                        media_type,
                        title,
                        poster_path
                    )
                `)
                .eq("user_id", user.id)
                .eq("watched", true)
                .limit(50);

            if (!watchedMedia || watchedMedia.length < 2) {
                return NextResponse.json({
                    error: "Not enough watched media",
                    message: "En az 2 film/dizi izlemiş olmalısın",
                }, { status: 400 });
            }

            // Get user's elo ratings
            const mediaIds = watchedMedia.map((w: any) => w.media.id);
            const { data: eloData } = await supabase
                .from("user_elo_ratings")
                .select("*")
                .eq("user_id", user.id)
                .in("media_id", mediaIds);

            const eloMap = new Map(eloData?.map((e: any) => [e.media_id, e.elo_rating]) || []);

            // Select two random media with priority to lower match count
            const shuffled = [...(watchedMedia as any[])].sort(() => Math.random() - 0.5);
            const media1 = shuffled[0].media;
            const media2 = shuffled[1].media;

            return NextResponse.json({
                matchup: {
                    left: {
                        ...media1,
                        elo: eloMap.get(media1.id) || DEFAULT_ELO,
                    },
                    right: {
                        ...media2,
                        elo: eloMap.get(media2.id) || DEFAULT_ELO,
                    },
                },
                scope: "user",
            });
        } else {
            // Global matchup - get from popular media
            const { data: media } = await supabase
                .from("media")
                .select("id, tmdb_id, media_type, title, poster_path")
                .eq("media_type", mediaType)
                .order("popularity", { ascending: false })
                .limit(100);

            if (!media || media.length < 2) {
                return NextResponse.json({
                    error: "Not enough media",
                    message: "Veritabanında yeterli içerik yok",
                }, { status: 400 });
            }

            // Get global elo ratings
            const mediaIds = (media as any[]).map(m => m.id);
            const { data: eloData } = await supabase
                .from("global_elo_ratings")
                .select("*")
                .in("media_id", mediaIds);

            const eloMap = new Map((eloData as any[])?.map(e => [e.media_id, e.elo_rating]) || []);

            // Select two random media
            const shuffled = [...(media as any[])].sort(() => Math.random() - 0.5);
            const media1 = shuffled[0];
            const media2 = shuffled[1];

            return NextResponse.json({
                matchup: {
                    left: {
                        ...media1,
                        elo: eloMap.get(media1.id) || DEFAULT_ELO,
                    },
                    right: {
                        ...media2,
                        elo: eloMap.get(media2.id) || DEFAULT_ELO,
                    },
                },
                scope: "global",
            });
        }
    } catch (error) {
        console.error("Error getting matchup:", error);
        return NextResponse.json(
            { error: "Failed to get matchup" },
            { status: 500 }
        );
    }
}

// POST /api/vs - Record match result
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { winnerId, loserId, scope } = body;

        if (!winnerId || !loserId) {
            return NextResponse.json(
                { error: "winnerId and loserId are required" },
                { status: 400 }
            );
        }

        if (scope === "user") {
            // User scope - update user_elo_ratings
            const { data: existingElos } = await supabase
                .from("user_elo_ratings")
                .select("*")
                .eq("user_id", user.id)
                .in("media_id", [winnerId, loserId]);

            const existingElosArr = existingElos as any[] || [];
            const winnerElo = existingElosArr.find(e => e.media_id === winnerId)?.elo_rating || DEFAULT_ELO;
            const loserElo = existingElosArr.find(e => e.media_id === loserId)?.elo_rating || DEFAULT_ELO;

            const { newWinnerElo, newLoserElo } = calculateElo(winnerElo, loserElo);

            // Upsert winner elo
            await supabase
                .from("user_elo_ratings")
                .upsert({
                    user_id: user.id,
                    media_id: winnerId,
                    elo_rating: newWinnerElo,
                    match_count: (existingElosArr.find(e => e.media_id === winnerId)?.match_count || 0) + 1,
                    win_count: (existingElosArr.find(e => e.media_id === winnerId)?.win_count || 0) + 1,
                } as any, { onConflict: "user_id,media_id" });

            // Upsert loser elo
            await supabase
                .from("user_elo_ratings")
                .upsert({
                    user_id: user.id,
                    media_id: loserId,
                    elo_rating: newLoserElo,
                    match_count: (existingElosArr.find(e => e.media_id === loserId)?.match_count || 0) + 1,
                    win_count: existingElosArr.find(e => e.media_id === loserId)?.win_count || 0,
                } as any, { onConflict: "user_id,media_id" });

            // Record match
            await supabase
                .from("vs_matches")
                .insert({
                    user_id: user.id,
                    winner_media_id: winnerId,
                    loser_media_id: loserId,
                    scope: "user",
                    winner_elo_before: winnerElo,
                    loser_elo_before: loserElo,
                    winner_elo_after: newWinnerElo,
                    loser_elo_after: newLoserElo,
                } as any);

            return NextResponse.json({
                success: true,
                winnerElo: newWinnerElo,
                loserElo: newLoserElo,
            });
        } else {
            // Global scope
            const { data: existingElos } = await supabase
                .from("global_elo_ratings")
                .select("*")
                .in("media_id", [winnerId, loserId]);

            const existingElosArr = existingElos as any[] || [];
            const winnerElo = existingElosArr.find(e => e.media_id === winnerId)?.elo_rating || DEFAULT_ELO;
            const loserElo = existingElosArr.find(e => e.media_id === loserId)?.elo_rating || DEFAULT_ELO;

            const { newWinnerElo, newLoserElo } = calculateElo(winnerElo, loserElo);

            // Upsert winner elo
            await supabase
                .from("global_elo_ratings")
                .upsert({
                    media_id: winnerId,
                    elo_rating: newWinnerElo,
                    match_count: (existingElosArr.find(e => e.media_id === winnerId)?.match_count || 0) + 1,
                    win_count: (existingElosArr.find(e => e.media_id === winnerId)?.win_count || 0) + 1,
                } as any, { onConflict: "media_id" });

            // Upsert loser elo
            await supabase
                .from("global_elo_ratings")
                .upsert({
                    media_id: loserId,
                    elo_rating: newLoserElo,
                    match_count: (existingElosArr.find(e => e.media_id === loserId)?.match_count || 0) + 1,
                    win_count: existingElosArr.find(e => e.media_id === loserId)?.win_count || 0,
                } as any, { onConflict: "media_id" });

            // Record match
            await supabase
                .from("vs_matches")
                .insert({
                    user_id: user.id,
                    winner_media_id: winnerId,
                    loser_media_id: loserId,
                    scope: "global",
                    winner_elo_before: winnerElo,
                    loser_elo_before: loserElo,
                    winner_elo_after: newWinnerElo,
                    loser_elo_after: newLoserElo,
                } as any);

            return NextResponse.json({
                success: true,
                winnerElo: newWinnerElo,
                loserElo: newLoserElo,
            });
        }
    } catch (error) {
        console.error("Error recording match:", error);
        return NextResponse.json(
            { error: "Failed to record match" },
            { status: 500 }
        );
    }
}

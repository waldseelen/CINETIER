
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

    
    const { data: { user } } = { data: { user: null } } /* Firebase TODO: get currentUser */;

    try {
        if (scope === "user" && user) {
            // Get from user's watched list
            const { data: watchedMedia } = { data: null, error: null } /* Firebase Migration TODO */
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
            const { data: eloData } = { data: null, error: null } /* Firebase Migration TODO */;

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
            const { data: media } = { data: null, error: null } /* Firebase Migration TODO */;

            if (!media || media.length < 2) {
                return NextResponse.json({
                    error: "Not enough media",
                    message: "Veritabanında yeterli içerik yok",
                }, { status: 400 });
            }

            // Get global elo ratings
            const mediaIds = (media as any[]).map(m => m.id);
            const { data: eloData } = { data: null, error: null } /* Firebase Migration TODO */;

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
    
    const { data: { user } } = { data: { user: null } } /* Firebase TODO: get currentUser */;

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
            const { data: existingElos } = { data: null, error: null } /* Firebase Migration TODO */;

            const existingElosArr = existingElos as any[] || [];
            const winnerElo = existingElosArr.find(e => e.media_id === winnerId)?.elo_rating || DEFAULT_ELO;
            const loserElo = existingElosArr.find(e => e.media_id === loserId)?.elo_rating || DEFAULT_ELO;

            const { newWinnerElo, newLoserElo } = calculateElo(winnerElo, loserElo);

            // Upsert winner elo
            { data: null, error: null } /* Firebase Migration TODO */?.match_count || 0) + 1,
                    win_count: (existingElosArr.find(e => e.media_id === winnerId)?.win_count || 0) + 1,
                } as any, { onConflict: "user_id,media_id" });

            // Upsert loser elo
            { data: null, error: null } /* Firebase Migration TODO */?.match_count || 0) + 1,
                    win_count: existingElosArr.find(e => e.media_id === loserId)?.win_count || 0,
                } as any, { onConflict: "user_id,media_id" });

            // Record match
            { data: null, error: null } /* Firebase Migration TODO */;

            return NextResponse.json({
                success: true,
                winnerElo: newWinnerElo,
                loserElo: newLoserElo,
            });
        } else {
            // Global scope
            const { data: existingElos } = { data: null, error: null } /* Firebase Migration TODO */;

            const existingElosArr = existingElos as any[] || [];
            const winnerElo = existingElosArr.find(e => e.media_id === winnerId)?.elo_rating || DEFAULT_ELO;
            const loserElo = existingElosArr.find(e => e.media_id === loserId)?.elo_rating || DEFAULT_ELO;

            const { newWinnerElo, newLoserElo } = calculateElo(winnerElo, loserElo);

            // Upsert winner elo
            { data: null, error: null } /* Firebase Migration TODO */?.match_count || 0) + 1,
                    win_count: (existingElosArr.find(e => e.media_id === winnerId)?.win_count || 0) + 1,
                } as any, { onConflict: "media_id" });

            // Upsert loser elo
            { data: null, error: null } /* Firebase Migration TODO */?.match_count || 0) + 1,
                    win_count: existingElosArr.find(e => e.media_id === loserId)?.win_count || 0,
                } as any, { onConflict: "media_id" });

            // Record match
            { data: null, error: null } /* Firebase Migration TODO */;

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

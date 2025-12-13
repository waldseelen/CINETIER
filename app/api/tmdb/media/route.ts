import { createAdminClient } from "@/lib/supabase/server";
import { tmdb } from "@/lib/tmdb/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const type = searchParams.get("type"); // movie or tv

    if (!id || !type) {
        return NextResponse.json(
            { error: "Parameters 'id' and 'type' are required" },
            { status: 400 }
        );
    }

    const mediaId = parseInt(id);
    if (isNaN(mediaId)) {
        return NextResponse.json(
            { error: "Invalid media ID" },
            { status: 400 }
        );
    }

    try {
        let details;

        if (type === "movie") {
            details = await tmdb.getMovie(mediaId);
        } else if (type === "tv") {
            details = await tmdb.getTV(mediaId);
        } else {
            return NextResponse.json(
                { error: "Type must be 'movie' or 'tv'" },
                { status: 400 }
            );
        }

        // Cache media to database (upsert)
        if (details && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const supabase = createAdminClient();

            const mediaData = {
                tmdb_id: details.id,
                media_type: type as "movie" | "tv",
                title: type === "movie" ? (details as any).title : (details as any).name,
                original_title: type === "movie" ? (details as any).original_title : (details as any).original_name,
                poster_path: details.poster_path,
                backdrop_path: details.backdrop_path,
                release_date: type === "movie"
                    ? (details as any).release_date || null
                    : (details as any).first_air_date || null,
                overview: details.overview,
                vote_average: details.vote_average || 0,
                genres: details.genres || [],
                updated_at: new Date().toISOString(),
            };

            await supabase
                .from("media")
                .upsert(mediaData as any, {
                    onConflict: "tmdb_id,media_type",
                    ignoreDuplicates: false
                });
        }

        return NextResponse.json(details);
    } catch (error) {
        console.error("TMDB media error:", error);
        return NextResponse.json(
            { error: "Failed to fetch media details" },
            { status: 500 }
        );
    }
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const personId = searchParams.get("personId");

    if (!personId) {
        return NextResponse.json({ error: "personId required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Get aggregate ratings
    const { data: aggregate } = await supabase
        .from("person_aggregate_ratings")
        .select("*")
        .eq("person_id", personId)
        .single();

    // Get current user's rating
    const { data: { user } } = await supabase.auth.getUser();
    let userRating = null;

    if (user) {
        const { data } = await supabase
            .from("person_ratings")
            .select("*")
            .eq("person_id", personId)
            .eq("user_id", user.id)
            .single();
        userRating = data;
    }

    return NextResponse.json({
        aggregate: aggregate || {
            rating_count: 0,
            avg_acting: null,
            avg_charisma: null,
            avg_voice: null,
            avg_range: null,
            avg_overall: null,
        },
        userRating,
    });
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { personId, tmdbId, name, profilePath, acting, charisma, voice, rangeScore, comment } = body;

    // First ensure person exists in our DB
    let dbPersonId = personId;
    if (tmdbId && !personId) {
        // Upsert person
        const { data: person, error: personError } = await (supabase
            .from("persons") as any)
            .upsert({
                tmdb_id: tmdbId,
                name: name,
                profile_path: profilePath,
            }, { onConflict: "tmdb_id" })
            .select("id")
            .single();

        if (personError) {
            return NextResponse.json({ error: "Failed to save person" }, { status: 500 });
        }
        dbPersonId = person.id;
    }

    // Upsert rating
    const { data, error } = await (supabase
        .from("person_ratings") as any)
        .upsert({
            user_id: user.id,
            person_id: dbPersonId,
            acting,
            charisma,
            voice,
            range_score: rangeScore,
            overall_comment: comment,
        }, { onConflict: "user_id,person_id" })
        .select()
        .single();

    if (error) {
        console.error("Person rating error:", error);
        return NextResponse.json({ error: "Failed to save rating" }, { status: 500 });
    }

    return NextResponse.json({ success: true, rating: data });
}

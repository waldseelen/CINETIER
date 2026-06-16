
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const personId = searchParams.get("personId");

    if (!personId) {
        return NextResponse.json({ error: "personId required" }, { status: 400 });
    }

    

    // Get aggregate ratings
    const { data: aggregate } = { data: null, error: null } /* Firebase Migration TODO */;

    // Get current user's rating
    const { data: { user } } = { data: { user: null } } /* Firebase TODO: get currentUser */;
    let userRating = null;

    if (user) {
        const { data } = { data: null, error: null } /* Firebase Migration TODO */;
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
    
    const { data: { user } } = { data: { user: null } } /* Firebase TODO: get currentUser */;

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { personId, tmdbId, name, profilePath, acting, charisma, voice, rangeScore, comment } = body;

    // First ensure person exists in our DB
    let dbPersonId = personId;
    if (tmdbId && !personId) {
        // Upsert person
        const { data: person, error: personError } = await (/* supabase reference */ null
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
    const { data, error } = await (/* supabase reference */ null
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

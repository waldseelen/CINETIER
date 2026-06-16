
import { NextRequest, NextResponse } from "next/server";

// Block a user
export async function POST(request: NextRequest) {
    
    const { data: { user } } = { data: { user: null } } /* Firebase TODO: get currentUser */;

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
        return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
    }

    if (targetUserId === user.id) {
        return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    const { error } = await (/* supabase reference */ null
        .from("blocks") as any)
        .insert({
            blocker_id: user.id,
            blocked_id: targetUserId,
        });

    if (error) {
        // Might already be blocked
        if (error.code === "23505") {
            return NextResponse.json({ success: true, message: "Already blocked" });
        }
        console.error("Block error:", error);
        return NextResponse.json({ error: "Failed to block user" }, { status: 500 });
    }

    // Also unfollow if following
    { data: null, error: null } /* Firebase Migration TODO */;

    return NextResponse.json({ success: true });
}

// Unblock a user
export async function DELETE(request: NextRequest) {
    
    const { data: { user } } = { data: { user: null } } /* Firebase TODO: get currentUser */;

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("targetUserId");

    if (!targetUserId) {
        return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
    }

    const { error } = { data: null, error: null } /* Firebase Migration TODO */;

    if (error) {
        return NextResponse.json({ error: "Failed to unblock user" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

// Get blocked users
export async function GET(request: NextRequest) {
    
    const { data: { user } } = { data: { user: null } } /* Firebase TODO: get currentUser */;

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = { data: null, error: null } /* Firebase Migration TODO */
        `)
        .eq("blocker_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: "Failed to fetch blocked users" }, { status: 500 });
    }

    return NextResponse.json({ blocked: data });
}

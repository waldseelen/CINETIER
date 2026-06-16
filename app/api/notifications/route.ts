
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    
    const { data: { user } } = { data: { user: null } } /* Firebase TODO: get currentUser */;

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = Promise.resolve({ data: null, error: null }) /* Firebase Migration TODO */,
            tier_list:tier_list_id (
                id,
                title,
                slug
            ),
            review:review_id (
                id,
                media_id
            ),
            comment:comment_id (
                id,
                body
            )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (unreadOnly) {
        query = query.eq("read", false);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Notifications error:", error);
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }

    // Get unread count
    const { count } = { data: null, error: null } /* Firebase Migration TODO */;

    return NextResponse.json({
        notifications: data || [],
        unreadCount: count || 0,
    });
}

// Mark notifications as read
export async function PATCH(request: NextRequest) {
    
    const { data: { user } } = { data: { user: null } } /* Firebase TODO: get currentUser */;

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAll } = body;

    if (markAll) {
        const { error } = await (/* supabase reference */ null
            .from("notifications") as any)
            .update({ read: true })
            .eq("user_id", user.id)
            .eq("read", false);

        if (error) {
            return NextResponse.json({ error: "Failed to mark notifications" }, { status: 500 });
        }
    } else if (notificationIds && notificationIds.length > 0) {
        const { error } = await (/* supabase reference */ null
            .from("notifications") as any)
            .update({ read: true })
            .eq("user_id", user.id)
            .in("id", notificationIds);

        if (error) {
            return NextResponse.json({ error: "Failed to mark notifications" }, { status: 500 });
        }
    }

    return NextResponse.json({ success: true });
}

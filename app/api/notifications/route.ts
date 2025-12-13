import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = supabase
        .from("notifications")
        .select(`
            id,
            type,
            read,
            created_at,
            message,
            actor:actor_id (
                username,
                display_name,
                avatar_url
            ),
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
    const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);

    return NextResponse.json({
        notifications: data || [],
        unreadCount: count || 0,
    });
}

// Mark notifications as read
export async function PATCH(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAll } = body;

    if (markAll) {
        const { error } = await (supabase
            .from("notifications") as any)
            .update({ read: true })
            .eq("user_id", user.id)
            .eq("read", false);

        if (error) {
            return NextResponse.json({ error: "Failed to mark notifications" }, { status: 500 });
        }
    } else if (notificationIds && notificationIds.length > 0) {
        const { error } = await (supabase
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

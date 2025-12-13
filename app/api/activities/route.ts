import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/activities - Get activity feed for current user
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type"); // all, watched, lists, reviews
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const forUser = searchParams.get("forUser"); // if provided, only activities for this user

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Get followed user IDs
        const { data: following } = await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", user.id);

        const followedIds = following?.map((f: any) => f.following_id) || [];

        // Include self in feed
        const feedUserIds = [user.id, ...followedIds];

        // If forUser is provided, only show that user's activities
        const targetUserIds = forUser ? [forUser] : feedUserIds;

        // Build activities query based on type
        const activities: Activity[] = [];

        if (!type || type === "all" || type === "watched") {
            // Get watched activities
            const { data: watchedActivities } = await supabase
                .from("user_media_entries")
                .select(`
                    id,
                    user_id,
                    watched,
                    rating,
                    updated_at,
                    media:media_id (
                        id,
                        tmdb_id,
                        media_type,
                        title,
                        poster_path
                    ),
                    profiles:user_id (
                        username,
                        display_name,
                        avatar_url
                    )
                `)
                .in("user_id", targetUserIds)
                .eq("watched", true)
                .order("updated_at", { ascending: false })
                .limit(type === "watched" ? limit : Math.floor(limit / 3));

            if (watchedActivities) {
                activities.push(
                    ...watchedActivities.map((w: any) => ({
                        id: `watched-${w.id}`,
                        type: "watched" as const,
                        user: {
                            id: w.user_id,
                            username: w.profiles?.username,
                            displayName: w.profiles?.display_name,
                            avatarUrl: w.profiles?.avatar_url,
                        },
                        content: {
                            mediaId: w.media?.id,
                            tmdbId: w.media?.tmdb_id,
                            mediaType: w.media?.media_type,
                            title: w.media?.title,
                            posterPath: w.media?.poster_path,
                            rating: w.rating,
                        },
                        createdAt: w.updated_at,
                    }))
                );
            }
        }

        if (!type || type === "all" || type === "lists") {
            // Get tier list activities
            const { data: listActivities } = await supabase
                .from("tier_lists")
                .select(`
                    id,
                    title,
                    slug,
                    media_type,
                    created_at,
                    user_id,
                    profiles:user_id (
                        username,
                        display_name,
                        avatar_url
                    )
                `)
                .in("user_id", targetUserIds)
                .eq("visibility", "public")
                .order("created_at", { ascending: false })
                .limit(type === "lists" ? limit : Math.floor(limit / 3));

            if (listActivities) {
                activities.push(
                    ...listActivities.map((l: any) => ({
                        id: `list-${l.id}`,
                        type: "list" as const,
                        user: {
                            id: l.user_id,
                            username: l.profiles?.username,
                            displayName: l.profiles?.display_name,
                            avatarUrl: l.profiles?.avatar_url,
                        },
                        content: {
                            listId: l.id,
                            title: l.title,
                            slug: l.slug,
                            mediaType: l.media_type,
                        },
                        createdAt: l.created_at,
                    }))
                );
            }
        }

        if (!type || type === "all" || type === "reviews") {
            // Get review activities
            const { data: reviewActivities } = await supabase
                .from("reviews")
                .select(`
                    id,
                    content,
                    rating,
                    created_at,
                    user_id,
                    media:media_id (
                        id,
                        tmdb_id,
                        media_type,
                        title,
                        poster_path
                    ),
                    profiles:user_id (
                        username,
                        display_name,
                        avatar_url
                    )
                `)
                .in("user_id", targetUserIds)
                .order("created_at", { ascending: false })
                .limit(type === "reviews" ? limit : Math.floor(limit / 3));

            if (reviewActivities) {
                activities.push(
                    ...reviewActivities.map((r: any) => ({
                        id: `review-${r.id}`,
                        type: "review" as const,
                        user: {
                            id: r.user_id,
                            username: r.profiles?.username,
                            displayName: r.profiles?.display_name,
                            avatarUrl: r.profiles?.avatar_url,
                        },
                        content: {
                            reviewId: r.id,
                            mediaId: r.media?.id,
                            tmdbId: r.media?.tmdb_id,
                            mediaType: r.media?.media_type,
                            title: r.media?.title,
                            posterPath: r.media?.poster_path,
                            excerpt: r.content?.substring(0, 200),
                            rating: r.rating,
                        },
                        createdAt: r.created_at,
                    }))
                );
            }
        }

        // Sort all activities by date
        activities.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Apply pagination
        const paginatedActivities = activities.slice(offset, offset + limit);

        return NextResponse.json({
            activities: paginatedActivities,
            hasMore: activities.length > offset + limit,
        });
    } catch (error) {
        console.error("Error fetching activities:", error);
        return NextResponse.json(
            { error: "Failed to fetch activities" },
            { status: 500 }
        );
    }
}

interface Activity {
    id: string;
    type: "watched" | "list" | "review" | "follow";
    user: {
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
    };
    content: Record<string, any>;
    createdAt: string;
}

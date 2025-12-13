"use client";

import { createClient } from "@/lib/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ============================================
// TMDB API Hooks
// ============================================

interface TMDBSearchResult {
    id: number;
    title?: string;
    name?: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    vote_average: number;
    release_date?: string;
    first_air_date?: string;
    media_type?: "movie" | "tv";
}

interface TMDBSearchResponse {
    results: TMDBSearchResult[];
    page: number;
    total_pages: number;
    total_results: number;
}

export function useTMDBSearch(query: string, type: "movie" | "tv" | "multi" = "multi") {
    return useQuery<TMDBSearchResponse>({
        queryKey: ["tmdb", "search", query, type],
        queryFn: async () => {
            if (!query.trim()) return { results: [], page: 1, total_pages: 0, total_results: 0 };
            const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}&type=${type}`);
            if (!res.ok) throw new Error("Search failed");
            return res.json();
        },
        enabled: query.length > 0,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useTMDBMedia(id: number | null, type: "movie" | "tv") {
    return useQuery({
        queryKey: ["tmdb", "media", id, type],
        queryFn: async () => {
            const res = await fetch(`/api/tmdb/media?id=${id}&type=${type}`);
            if (!res.ok) throw new Error("Failed to fetch media");
            return res.json();
        },
        enabled: id !== null,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

export function useTMDBTrending(type: "movie" | "tv" | "all" = "all", timeWindow: "day" | "week" = "week") {
    return useQuery({
        queryKey: ["tmdb", "trending", type, timeWindow],
        queryFn: async () => {
            const res = await fetch(`/api/tmdb/trending?type=${type}&time_window=${timeWindow}`);
            if (!res.ok) throw new Error("Failed to fetch trending");
            return res.json();
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
}

// ============================================
// User Media Hooks (Watched, Watchlist, Rating)
// ============================================

interface UserMediaEntry {
    id: string;
    user_id: string;
    media_id: string;
    watched: boolean;
    watchlist: boolean;
    rating: number | null;
    short_note: string | null;
    user_elo: number;
    user_match_count: number;
    created_at: string;
    updated_at: string;
    media?: {
        id: string;
        tmdb_id: number;
        media_type: "movie" | "tv";
        title: string;
        poster_path: string | null;
        vote_average: number;
    };
}

export function useUserMedia(mediaId: string | null) {
    const supabase = createClient();

    return useQuery<UserMediaEntry | null>({
        queryKey: ["user-media", mediaId],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !mediaId) return null;

            const { data, error } = await supabase
                .from("user_media")
                .select("*")
                .eq("user_id", user.id)
                .eq("media_id", mediaId)
                .single();

            if (error && error.code !== "PGRST116") throw error;
            return data;
        },
        enabled: !!mediaId,
    });
}

export function useUserWatched(userId?: string) {
    const supabase = createClient();

    return useQuery<UserMediaEntry[]>({
        queryKey: ["user-watched", userId],
        queryFn: async () => {
            let targetUserId = userId;

            if (!targetUserId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return [];
                targetUserId = user.id;
            }

            const { data, error } = await supabase
                .from("user_media")
                .select(`
          *,
          media (
            id,
            tmdb_id,
            media_type,
            title,
            poster_path,
            vote_average
          )
        `)
                .eq("user_id", targetUserId)
                .eq("watched", true)
                .order("updated_at", { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: true,
    });
}

export function useUserWatchlist(userId?: string) {
    const supabase = createClient();

    return useQuery<UserMediaEntry[]>({
        queryKey: ["user-watchlist", userId],
        queryFn: async () => {
            let targetUserId = userId;

            if (!targetUserId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return [];
                targetUserId = user.id;
            }

            const { data, error } = await supabase
                .from("user_media")
                .select(`
          *,
          media (
            id,
            tmdb_id,
            media_type,
            title,
            poster_path,
            vote_average
          )
        `)
                .eq("user_id", targetUserId)
                .eq("watchlist", true)
                .order("updated_at", { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: true,
    });
}

// Mutation: Toggle watched
export function useToggleWatched() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation<any, Error, { mediaId: string; watched: boolean }>({
        mutationFn: async ({ mediaId, watched }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from("user_media")
                .upsert({
                    user_id: user.id,
                    media_id: mediaId,
                    watched,
                    updated_at: new Date().toISOString(),
                } as any, {
                    onConflict: "user_id,media_id",
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_: any, { mediaId }: { mediaId: string }) => {
            queryClient.invalidateQueries({ queryKey: ["user-media", mediaId] });
            queryClient.invalidateQueries({ queryKey: ["user-watched"] });
        },
    });
}

// Mutation: Toggle watchlist
export function useToggleWatchlist() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation<any, Error, { mediaId: string; watchlist: boolean }>({
        mutationFn: async ({ mediaId, watchlist }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from("user_media")
                .upsert({
                    user_id: user.id,
                    media_id: mediaId,
                    watchlist,
                    updated_at: new Date().toISOString(),
                } as any, {
                    onConflict: "user_id,media_id",
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_: any, { mediaId }: { mediaId: string }) => {
            queryClient.invalidateQueries({ queryKey: ["user-media", mediaId] });
            queryClient.invalidateQueries({ queryKey: ["user-watchlist"] });
        },
    });
}

// Mutation: Update rating
export function useUpdateRating() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation<any, Error, { mediaId: string; rating: number | null; shortNote?: string }>({
        mutationFn: async ({
            mediaId,
            rating,
            shortNote
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from("user_media")
                .upsert({
                    user_id: user.id,
                    media_id: mediaId,
                    rating,
                    short_note: shortNote,
                    watched: true, // If rating, it's watched
                    updated_at: new Date().toISOString(),
                } as any, {
                    onConflict: "user_id,media_id",
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_: any, { mediaId }: { mediaId: string }) => {
            queryClient.invalidateQueries({ queryKey: ["user-media", mediaId] });
            queryClient.invalidateQueries({ queryKey: ["user-watched"] });
        },
    });
}

// ============================================
// Auth Hooks
// ============================================

export function useUser() {
    const supabase = createClient();

    return useQuery({
        queryKey: ["user"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            return user;
        },
        staleTime: 1000 * 60 * 5,
    });
}

export function useProfile(userId?: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: ["profile", userId],
        queryFn: async () => {
            let targetId = userId;

            if (!targetId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return null;
                targetId = user.id;
            }

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", targetId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: true,
    });
}

interface ProfileData {
    id: string;
    user_id?: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    created_at: string;
    updated_at?: string;
}

export function useProfileByUsername(username: string) {
    const supabase = createClient();

    return useQuery<ProfileData | null>({
        queryKey: ["profile", "username", username],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("username", username.toLowerCase())
                .single();

            if (error) throw error;
            return data as ProfileData;
        },
        enabled: !!username,
    });
}

// ============================================
// Tier List Hooks
// ============================================

interface TierList {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    slug: string;
    visibility: "public" | "unlisted" | "private";
    media_type: "movie" | "tv" | "mixed";
    tiers: {
        key: string;
        label: string;
        color: string;
        items: {
            mediaId: string;
            tmdbId: number;
            title: string;
            posterPath: string | null;
        }[];
    }[];
    like_count: number;
    comment_count: number;
    created_at: string;
    updated_at: string;
    profiles?: {
        username: string;
        display_name: string;
        avatar_url: string | null;
    };
}

export function useTierLists(userId?: string) {
    const supabase = createClient();

    return useQuery<TierList[]>({
        queryKey: ["tier-lists", userId],
        queryFn: async () => {
            let query = supabase
                .from("tier_lists")
                .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
                .order("created_at", { ascending: false });

            if (userId) {
                query = query.eq("user_id", userId);
            } else {
                query = query.eq("visibility", "public");
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
    });
}

export function useTierListBySlug(slug: string) {
    const supabase = createClient();

    return useQuery<TierList | null>({
        queryKey: ["tier-list", slug],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("tier_lists")
                .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
                .eq("slug", slug)
                .single();

            if (error && error.code !== "PGRST116") throw error;
            return data;
        },
        enabled: !!slug,
    });
}

export function useCreateTierList() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (tierList: {
            title: string;
            description?: string;
            visibility: "public" | "unlisted" | "private";
            mediaType: "movie" | "tv" | "mixed";
            tiers: TierList["tiers"];
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Generate slug
            const slug = `${tierList.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;

            const { data, error } = await supabase
                .from("tier_lists")
                .insert({
                    user_id: user.id,
                    title: tierList.title,
                    description: tierList.description,
                    visibility: tierList.visibility,
                    media_type: tierList.mediaType,
                    tiers: tierList.tiers,
                    slug,
                } as any)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tier-lists"] });
        },
    });
}

export function useUpdateTierList() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            ...updates
        }: {
            id: string;
            title?: string;
            description?: string;
            visibility?: "public" | "unlisted" | "private";
            tiers?: TierList["tiers"];
        }) => {
            const updatePayload = {
                ...updates,
                updated_at: new Date().toISOString(),
            };
            const { data, error } = await (supabase
                .from("tier_lists") as any)
                .update(updatePayload)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["tier-lists"] });
            queryClient.invalidateQueries({ queryKey: ["tier-list", data?.slug] });
        },
    });
}

// ============================================
// Social Hooks (Follow, Like)
// ============================================

export function useIsFollowing(targetUserId: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: ["is-following", targetUserId],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { data } = await supabase
                .from("follows")
                .select("follower_id")
                .eq("follower_id", user.id)
                .eq("following_id", targetUserId)
                .single();

            return !!data;
        },
        enabled: !!targetUserId,
    });
}

export function useToggleFollow() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation<void, Error, { targetUserId: string; follow: boolean }>({
        mutationFn: async ({ targetUserId, follow }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            if (follow) {
                const { error } = await supabase
                    .from("follows")
                    .insert({ follower_id: user.id, following_id: targetUserId } as any);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("follows")
                    .delete()
                    .eq("follower_id", user.id)
                    .eq("following_id", targetUserId);
                if (error) throw error;
            }
        },
        onSuccess: (_: any, { targetUserId }: { targetUserId: string }) => {
            queryClient.invalidateQueries({ queryKey: ["is-following", targetUserId] });
            queryClient.invalidateQueries({ queryKey: ["profile", targetUserId] });
        },
    });
}

export function useLikeTierList() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ tierListId, like }: { tierListId: string; like: boolean }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            if (like) {
                const { error } = await supabase
                    .from("likes")
                    .insert({ user_id: user.id, tier_list_id: tierListId } as any);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("likes")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("tier_list_id", tierListId);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tier-lists"] });
        },
    });
}

// ============================================
// Reviews Hooks
// ============================================

interface Review {
    id: string;
    user_id: string;
    media_id: string;
    content: string;
    contains_spoiler: boolean;
    like_count: number;
    comment_count: number;
    created_at: string;
    updated_at: string;
    profiles?: {
        username: string;
        display_name: string;
        avatar_url: string | null;
    };
}

export function useReviews(mediaId: string) {
    const supabase = createClient();

    return useQuery<Review[]>({
        queryKey: ["reviews", mediaId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("reviews")
                .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
                .eq("media_id", mediaId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!mediaId,
    });
}

export function useCreateReview() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation<any, Error, { mediaId: string; content: string; containsSpoiler?: boolean }>({
        mutationFn: async ({
            mediaId,
            content,
            containsSpoiler = false,
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from("reviews")
                .upsert({
                    user_id: user.id,
                    media_id: mediaId,
                    content,
                    contains_spoiler: containsSpoiler,
                } as any, {
                    onConflict: "user_id,media_id",
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_: any, { mediaId }: { mediaId: string }) => {
            queryClient.invalidateQueries({ queryKey: ["reviews", mediaId] });
        },
    });
}

// ============================================
// Activity Feed Hooks
// ============================================

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

interface ActivitiesResponse {
    activities: Activity[];
    hasMore: boolean;
}

export function useActivities(type?: "all" | "watched" | "lists" | "reviews", forUser?: string) {
    return useQuery<ActivitiesResponse>({
        queryKey: ["activities", type || "all", forUser],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (type && type !== "all") params.set("type", type);
            if (forUser) params.set("forUser", forUser);

            const res = await fetch(`/api/activities?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch activities");
            return res.json();
        },
        staleTime: 1000 * 60, // 1 minute
    });
}

// ============================================
// Follow Hooks
// ============================================

export function useFollowers(userId: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: ["followers", userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("follows")
                .select(`
                    follower:follower_id (
                        id,
                        username,
                        display_name,
                        avatar_url
                    )
                `)
                .eq("following_id", userId);

            if (error) throw error;
            return data?.map((f: any) => f.follower) || [];
        },
        enabled: !!userId,
    });
}

export function useFollowing(userId: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: ["following", userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("follows")
                .select(`
                    following:following_id (
                        id,
                        username,
                        display_name,
                        avatar_url
                    )
                `)
                .eq("follower_id", userId);

            if (error) throw error;
            return data?.map((f: any) => f.following) || [];
        },
        enabled: !!userId,
    });
}

export function useFollowStats(userId: string) {
    const supabase = createClient();

    return useQuery<{ followers: number; following: number }>({
        queryKey: ["follow-stats", userId],
        queryFn: async () => {
            const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
                supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
                supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
            ]);

            return {
                followers: followersCount || 0,
                following: followingCount || 0,
            };
        },
        enabled: !!userId,
    });
}

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string
                    display_name: string
                    bio: string | null
                    avatar_url: string | null
                    watchlist_privacy: 'public' | 'followers' | 'private'
                    watched_privacy: 'public' | 'followers' | 'private'
                    show_elo_stats: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    username: string
                    display_name: string
                    bio?: string | null
                    avatar_url?: string | null
                    watchlist_privacy?: 'public' | 'followers' | 'private'
                    watched_privacy?: 'public' | 'followers' | 'private'
                    show_elo_stats?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    username?: string
                    display_name?: string
                    bio?: string | null
                    avatar_url?: string | null
                    watchlist_privacy?: 'public' | 'followers' | 'private'
                    watched_privacy?: 'public' | 'followers' | 'private'
                    show_elo_stats?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            media: {
                Row: {
                    id: string
                    tmdb_id: number
                    media_type: 'movie' | 'tv'
                    title: string
                    original_title: string
                    poster_path: string | null
                    backdrop_path: string | null
                    release_date: string | null
                    overview: string | null
                    vote_average: number
                    genres: Json
                    global_elo: number
                    global_match_count: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tmdb_id: number
                    media_type: 'movie' | 'tv'
                    title: string
                    original_title: string
                    poster_path?: string | null
                    backdrop_path?: string | null
                    release_date?: string | null
                    overview?: string | null
                    vote_average?: number
                    genres?: Json
                    global_elo?: number
                    global_match_count?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tmdb_id?: number
                    media_type?: 'movie' | 'tv'
                    title?: string
                    original_title?: string
                    poster_path?: string | null
                    backdrop_path?: string | null
                    release_date?: string | null
                    overview?: string | null
                    vote_average?: number
                    genres?: Json
                    global_elo?: number
                    global_match_count?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            user_media: {
                Row: {
                    id: string
                    user_id: string
                    media_id: string
                    watched: boolean
                    watchlist: boolean
                    rating: number | null
                    short_note: string | null
                    user_elo: number
                    user_match_count: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    media_id: string
                    watched?: boolean
                    watchlist?: boolean
                    rating?: number | null
                    short_note?: string | null
                    user_elo?: number
                    user_match_count?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    media_id?: string
                    watched?: boolean
                    watchlist?: boolean
                    rating?: number | null
                    short_note?: string | null
                    user_elo?: number
                    user_match_count?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            tier_lists: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    description: string | null
                    slug: string
                    visibility: 'public' | 'unlisted' | 'private'
                    media_type: 'movie' | 'tv' | 'mixed'
                    tiers: Json
                    like_count: number
                    comment_count: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    description?: string | null
                    slug: string
                    visibility?: 'public' | 'unlisted' | 'private'
                    media_type?: 'movie' | 'tv' | 'mixed'
                    tiers: Json
                    like_count?: number
                    comment_count?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    description?: string | null
                    slug?: string
                    visibility?: 'public' | 'unlisted' | 'private'
                    media_type?: 'movie' | 'tv' | 'mixed'
                    tiers?: Json
                    like_count?: number
                    comment_count?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            reviews: {
                Row: {
                    id: string
                    user_id: string
                    media_id: string
                    content: string
                    has_spoilers: boolean
                    rating: number | null
                    like_count: number
                    comment_count: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    media_id: string
                    content: string
                    has_spoilers?: boolean
                    rating?: number | null
                    like_count?: number
                    comment_count?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    media_id?: string
                    content?: string
                    has_spoilers?: boolean
                    rating?: number | null
                    like_count?: number
                    comment_count?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            comments: {
                Row: {
                    id: string
                    user_id: string
                    target_type: 'tier_list' | 'media' | 'review'
                    target_id: string
                    parent_id: string | null
                    content: string
                    like_count: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    target_type: 'tier_list' | 'media' | 'review'
                    target_id: string
                    parent_id?: string | null
                    content: string
                    like_count?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    target_type?: 'tier_list' | 'media' | 'review'
                    target_id?: string
                    parent_id?: string | null
                    content?: string
                    like_count?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            likes: {
                Row: {
                    id: string
                    user_id: string
                    target_type: 'tier_list' | 'review' | 'comment'
                    target_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    target_type: 'tier_list' | 'review' | 'comment'
                    target_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    target_type?: 'tier_list' | 'review' | 'comment'
                    target_id?: string
                    created_at?: string
                }
            }
            follows: {
                Row: {
                    id: string
                    follower_id: string
                    following_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    follower_id: string
                    following_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    follower_id?: string
                    following_id?: string
                    created_at?: string
                }
            }
            vs_matches: {
                Row: {
                    id: string
                    user_id: string | null
                    winner_media_id: string
                    loser_media_id: string
                    scope: 'global' | 'user'
                    tier_list_id: string | null
                    winner_rating_before: number
                    loser_rating_before: number
                    winner_rating_after: number
                    loser_rating_after: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    winner_media_id: string
                    loser_media_id: string
                    scope?: 'global' | 'user'
                    tier_list_id?: string | null
                    winner_rating_before: number
                    loser_rating_before: number
                    winner_rating_after: number
                    loser_rating_after: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    winner_media_id?: string
                    loser_media_id?: string
                    scope?: 'global' | 'user'
                    tier_list_id?: string | null
                    winner_rating_before?: number
                    loser_rating_before?: number
                    winner_rating_after?: number
                    loser_rating_after?: number
                    created_at?: string
                }
            }
            reports: {
                Row: {
                    id: string
                    reporter_id: string
                    target_type: 'tier_list' | 'review' | 'comment' | 'user'
                    target_id: string
                    reason: string
                    details: string | null
                    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    reporter_id: string
                    target_type: 'tier_list' | 'review' | 'comment' | 'user'
                    target_id: string
                    reason: string
                    details?: string | null
                    status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    reporter_id?: string
                    target_type?: 'tier_list' | 'review' | 'comment' | 'user'
                    target_id?: string
                    reason?: string
                    details?: string | null
                    status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
                    created_at?: string
                    updated_at?: string
                }
            }
            blocks: {
                Row: {
                    id: string
                    blocker_id: string
                    blocked_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    blocker_id: string
                    blocked_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    blocker_id?: string
                    blocked_id?: string
                    created_at?: string
                }
            }
            activities: {
                Row: {
                    id: string
                    user_id: string
                    action_type: 'watched' | 'watchlist' | 'rating' | 'review' | 'tier_list' | 'like' | 'follow'
                    target_type: string
                    target_id: string
                    metadata: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    action_type: 'watched' | 'watchlist' | 'rating' | 'review' | 'tier_list' | 'like' | 'follow'
                    target_type: string
                    target_id: string
                    metadata?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    action_type?: 'watched' | 'watchlist' | 'rating' | 'review' | 'tier_list' | 'like' | 'follow'
                    target_type?: string
                    target_id?: string
                    metadata?: Json | null
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

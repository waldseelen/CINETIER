import type { TMDBMovie, TMDBMovieDetails, TMDBTV, TMDBTVDetails } from "@/lib/tmdb/client";

// Media types - now includes anime
export type MediaType = "movie" | "tv" | "anime";

// Media source - where the data originated
export type MediaSource = "tmdb" | "jikan";

// External ratings from OMDb API
export interface ExternalRatings {
    imdbId: string | null;
    imdbRating: number | null; // 1-10 scale
    rtRating: number | null; // 0-100 percent (Rotten Tomatoes)
    metascore: number | null; // 0-100
    ratingsUpdatedAt: string | null;
}

export interface MediaItem {
    id: string;
    mediaId?: string; // For tier list items
    tmdbId: number;
    mediaType: MediaType;
    mediaSource?: MediaSource;
    title: string;
    originalTitle: string;
    posterPath: string | null;
    backdropPath: string | null;
    releaseDate: string | null;
    overview: string | null;
    voteAverage: number;
    genres: { id: number; name: string }[];
    globalElo: number;
    globalMatchCount: number;
    // External ratings (optional, loaded separately)
    externalRatings?: ExternalRatings;
}

// Anime-specific media item extension
export interface AnimeItem extends Omit<MediaItem, "mediaType"> {
    mediaType: "anime";
    malId: number;
    malScore: number | null;
    malRank: number | null;
    malPopularity: number | null;
    episodes: number | null;
    status: string;
    airing: boolean;
    duration: string | null;
    rating: string | null; // Age rating
    season: string | null;
    year: number | null;
    studios: Array<{ id: number; name: string }>;
    themes: Array<{ id: number; name: string }>;
    trailerUrl: string | null;
}

// TierItem type for tier list items
export interface TierItem {
    id: string;
    mediaId: string;
    tmdbId: number;
    title: string;
    posterPath: string | null;
    mediaType?: MediaType;
}

export interface UserMediaItem extends MediaItem {
    watched: boolean;
    watchlist: boolean;
    rating: number | null;
    shortNote: string | null;
    userElo: number;
    userMatchCount: number;
}

// Tier types
export interface Tier {
    id: string;
    name: string;
    color: string;
    items: TierItem[];
}

export interface TierList {
    id: string;
    userId: string;
    title: string;
    description: string | null;
    slug: string;
    visibility: "public" | "unlisted" | "private";
    mediaType: MediaType | "mixed";
    tiers: Tier[];
    likeCount: number;
    commentCount: number;
    createdAt: string;
    updatedAt: string;
    user?: {
        username: string;
        displayName: string;
        avatarUrl: string | null;
    };
}

// Default tier template
export const DEFAULT_TIERS: Omit<Tier, "items">[] = [
    { id: "s", name: "S", color: "#FF7F7F" },
    { id: "a", name: "A", color: "#FFBF7F" },
    { id: "b", name: "B", color: "#FFDF7F" },
    { id: "c", name: "C", color: "#FFFF7F" },
    { id: "d", name: "D", color: "#BFFF7F" },
];

// VS types
export interface VSMatch {
    id: string;
    userId: string | null;
    winnerMediaId: string;
    loserMediaId: string;
    scope: "global" | "user";
    tierListId: string | null;
    winnerRatingBefore: number;
    loserRatingBefore: number;
    winnerRatingAfter: number;
    loserRatingAfter: number;
    createdAt: string;
}

export interface VSPair {
    mediaA: MediaItem;
    mediaB: MediaItem;
}

// Social types
export interface Profile {
    id: string;
    username: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    watchlistPrivacy: "public" | "followers" | "private";
    watchedPrivacy: "public" | "followers" | "private";
    showEloStats: boolean;
    createdAt: string;
    followerCount?: number;
    followingCount?: number;
    isFollowing?: boolean;
}

export interface Review {
    id: string;
    userId: string;
    mediaId: string;
    content: string;
    hasSpoilers: boolean;
    rating: number | null;
    likeCount: number;
    commentCount: number;
    createdAt: string;
    updatedAt: string;
    user?: Pick<Profile, "username" | "displayName" | "avatarUrl">;
    media?: Pick<MediaItem, "title" | "posterPath" | "tmdbId" | "mediaType">;
}

export interface Comment {
    id: string;
    userId: string;
    targetType: "tier_list" | "media" | "review";
    targetId: string;
    parentId: string | null;
    content: string;
    likeCount: number;
    createdAt: string;
    updatedAt: string;
    user?: Pick<Profile, "username" | "displayName" | "avatarUrl">;
    replies?: Comment[];
}

// Activity/Feed types
export type ActivityType = "watched" | "watchlist" | "rating" | "review" | "tier_list" | "like" | "follow";

export interface Activity {
    id: string;
    userId: string;
    actionType: ActivityType;
    targetType: string;
    targetId: string;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    user?: Pick<Profile, "username" | "displayName" | "avatarUrl">;
    // Populated based on targetType
    media?: Pick<MediaItem, "title" | "posterPath" | "tmdbId" | "mediaType">;
    tierList?: Pick<TierList, "title" | "slug">;
    targetUser?: Pick<Profile, "username" | "displayName">;
}

// Helper to map TMDB response to MediaItem
export function mapTMDBToMedia(tmdb: TMDBMovie | TMDBTV, mediaType: MediaType): Omit<MediaItem, "id" | "globalElo" | "globalMatchCount"> {
    const isMovie = mediaType === "movie";
    const movie = tmdb as TMDBMovie;
    const tv = tmdb as TMDBTV;

    return {
        tmdbId: tmdb.id,
        mediaType,
        title: isMovie ? movie.title : tv.name,
        originalTitle: isMovie ? movie.original_title : tv.original_name,
        posterPath: tmdb.poster_path,
        backdropPath: tmdb.backdrop_path,
        releaseDate: isMovie ? movie.release_date : tv.first_air_date,
        overview: tmdb.overview,
        voteAverage: tmdb.vote_average,
        genres: tmdb.genre_ids?.map(id => ({ id, name: "" })) || [],
    };
}

export function mapTMDBDetailsToMedia(
    tmdb: TMDBMovieDetails | TMDBTVDetails,
    mediaType: MediaType
): Omit<MediaItem, "id" | "globalElo" | "globalMatchCount"> {
    const isMovie = mediaType === "movie";
    const movie = tmdb as TMDBMovieDetails;
    const tv = tmdb as TMDBTVDetails;

    return {
        tmdbId: tmdb.id,
        mediaType,
        title: isMovie ? movie.title : tv.name,
        originalTitle: isMovie ? movie.original_title : tv.original_name,
        posterPath: tmdb.poster_path,
        backdropPath: tmdb.backdrop_path,
        releaseDate: isMovie ? movie.release_date : tv.first_air_date,
        overview: tmdb.overview,
        voteAverage: tmdb.vote_average,
        genres: tmdb.genres,
    };
}

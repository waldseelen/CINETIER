/**
 * Jikan Mapper - Maps Jikan API data to project's MediaItem interface
 */

import type { MediaItem } from "@/types";
import type { JikanAnime } from "./client";

/**
 * Map Jikan anime to MediaItem interface
 */
export function mapJikanToMedia(anime: JikanAnime): Omit<MediaItem, "id" | "globalElo" | "globalMatchCount"> {
    // Get the best title (prefer English, fallback to default)
    const title = anime.title_english || anime.title;
    const originalTitle = anime.title_japanese || anime.title;

    // Get poster image URL
    const posterPath = anime.images?.jpg?.large_image_url ||
        anime.images?.jpg?.image_url ||
        anime.images?.webp?.large_image_url ||
        null;

    // Map genres
    const genres = anime.genres?.map(g => ({
        id: g.mal_id,
        name: g.name,
    })) || [];

    // Get release date from aired
    const releaseDate = anime.aired?.from?.split("T")[0] || null;

    return {
        tmdbId: anime.mal_id, // Using mal_id as identifier for anime
        mediaType: "anime" as any, // Will be "anime" type
        title,
        originalTitle,
        posterPath,
        backdropPath: null, // Jikan doesn't provide backdrop images typically
        releaseDate,
        overview: anime.synopsis,
        voteAverage: anime.score || 0,
        genres,
    };
}

/**
 * Map Jikan anime to full MediaItem with additional fields
 */
export function mapJikanToFullMedia(anime: JikanAnime): Omit<MediaItem, "id" | "globalElo" | "globalMatchCount"> & {
    malId: number;
    malScore: number | null;
    malRank: number | null;
    malPopularity: number | null;
    episodes: number | null;
    status: string;
    airing: boolean;
    duration: string;
    rating: string | null;
    season: string | null;
    year: number | null;
    studios: Array<{ id: number; name: string }>;
    themes: Array<{ id: number; name: string }>;
    trailerUrl: string | null;
} {
    const base = mapJikanToMedia(anime);

    return {
        ...base,
        malId: anime.mal_id,
        malScore: anime.score,
        malRank: anime.rank,
        malPopularity: anime.popularity,
        episodes: anime.episodes,
        status: anime.status,
        airing: anime.airing,
        duration: anime.duration,
        rating: anime.rating,
        season: anime.season,
        year: anime.year,
        studios: anime.studios?.map(s => ({ id: s.mal_id, name: s.name })) || [],
        themes: anime.themes?.map(t => ({ id: t.mal_id, name: t.name })) || [],
        trailerUrl: anime.trailer?.url || null,
    };
}

/**
 * Create anime search result item
 */
export interface AnimeSearchResult {
    id: number;
    malId: number;
    title: string;
    titleEnglish: string | null;
    titleJapanese: string | null;
    posterUrl: string | null;
    score: number | null;
    episodes: number | null;
    status: string;
    year: number | null;
    season: string | null;
    synopsis: string | null;
    genres: string[];
    type: string | null;
    mediaType: "anime";
}

export function mapJikanToSearchResult(anime: JikanAnime): AnimeSearchResult {
    return {
        id: anime.mal_id,
        malId: anime.mal_id,
        title: anime.title_english || anime.title,
        titleEnglish: anime.title_english,
        titleJapanese: anime.title_japanese,
        posterUrl: anime.images?.jpg?.image_url || null,
        score: anime.score,
        episodes: anime.episodes,
        status: anime.status,
        year: anime.year,
        season: anime.season,
        synopsis: anime.synopsis,
        genres: anime.genres?.map(g => g.name) || [],
        type: anime.type,
        mediaType: "anime",
    };
}

/**
 * Map anime type to display text
 */
export function getAnimeTypeDisplay(type: string | null): string {
    const types: Record<string, string> = {
        TV: "TV Serisi",
        Movie: "Film",
        OVA: "OVA",
        ONA: "ONA",
        Special: "Özel",
        Music: "Müzik",
    };
    return type ? types[type] || type : "Bilinmiyor";
}

/**
 * Map anime status to display text
 */
export function getAnimeStatusDisplay(status: string): string {
    const statuses: Record<string, string> = {
        "Finished Airing": "Tamamlandı",
        "Currently Airing": "Yayında",
        "Not yet aired": "Henüz Yayınlanmadı",
    };
    return statuses[status] || status;
}

/**
 * Map anime rating to display text
 */
export function getAnimeRatingDisplay(rating: string | null): string {
    if (!rating) return "Belirtilmemiş";

    const ratings: Record<string, string> = {
        "G - All Ages": "Tüm Yaşlar",
        "PG - Children": "Çocuklar",
        "PG-13 - Teens 13 or older": "13+",
        "R - 17+ (violence & profanity)": "17+",
        "R+ - Mild Nudity": "17+ (Hafif)",
        "Rx - Hentai": "Yetişkin",
    };

    return ratings[rating] || rating;
}

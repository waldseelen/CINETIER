/**
 * OMDb Service - External Ratings with Supabase Caching
 */

import { createClient } from "@/lib/supabase/server";
import { fetchOMDbRatings } from "./client";

const CACHE_DURATION_DAYS = 7;

export interface ExternalRatings {
    imdbId: string | null;
    imdbRating: number | null;
    rtRating: number | null;
    metascore: number | null;
    needsRefresh: boolean;
}

/**
 * Check if cached ratings are still valid (within 7 days)
 */
function isCacheValid(ratingsUpdatedAt: string | null): boolean {
    if (!ratingsUpdatedAt) return false;

    const updatedAt = new Date(ratingsUpdatedAt);
    const now = new Date();
    const diffDays = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);

    return diffDays < CACHE_DURATION_DAYS;
}

/**
 * Fetch external ratings for a media item
 * Uses Supabase cache first, falls back to OMDb API
 */
export async function fetchExternalRatings(
    mediaId: string,
    imdbId: string | null
): Promise<ExternalRatings> {
    const supabase = await createClient();

    // Check existing cache in database
    const { data: mediaData, error } = await supabase
        .from("media")
        .select("imdb_id, imdb_rating, rt_rating, metascore, ratings_updated_at")
        .eq("id", mediaId)
        .single() as any;

    if (error) {
        console.error("Error fetching media for ratings:", error);
        return {
            imdbId: imdbId,
            imdbRating: null,
            rtRating: null,
            metascore: null,
            needsRefresh: true,
        };
    }

    // If cache is valid, return cached data
    if (isCacheValid(mediaData?.ratings_updated_at)) {
        return {
            imdbId: mediaData.imdb_id,
            imdbRating: mediaData.imdb_rating,
            rtRating: mediaData.rt_rating,
            metascore: mediaData.metascore,
            needsRefresh: false,
        };
    }

    // Use stored imdb_id or provided one
    const effectiveImdbId = mediaData?.imdb_id || imdbId;

    if (!effectiveImdbId) {
        return {
            imdbId: null,
            imdbRating: null,
            rtRating: null,
            metascore: null,
            needsRefresh: false, // Can't refresh without IMDb ID
        };
    }

    // Fetch fresh ratings from OMDb
    const omdbRatings = await fetchOMDbRatings(effectiveImdbId);

    if (omdbRatings) {
        // Update cache in database
        try {
            const updateData = {
                imdb_id: effectiveImdbId,
                imdb_rating: omdbRatings.imdbRating,
                rt_rating: omdbRatings.rtRating,
                metascore: omdbRatings.metascore,
                ratings_updated_at: new Date().toISOString(),
            };
            await (supabase as any).from("media").update(updateData).eq("id", mediaId);
        } catch (err) {
            console.error("Error updating ratings:", err);
        }

        return {
            imdbId: effectiveImdbId,
            imdbRating: omdbRatings.imdbRating,
            rtRating: omdbRatings.rtRating,
            metascore: omdbRatings.metascore,
            needsRefresh: false,
        };
    }

    // Return cached data even if stale, if OMDb fails
    return {
        imdbId: effectiveImdbId,
        imdbRating: mediaData?.imdb_rating || null,
        rtRating: mediaData?.rt_rating || null,
        metascore: mediaData?.metascore || null,
        needsRefresh: true,
    };
}

/**
 * Batch fetch ratings for multiple media items
 * Useful for lists and rankings pages
 */
export async function batchFetchExternalRatings(
    mediaItems: Array<{ id: string; imdbId: string | null }>
): Promise<Map<string, ExternalRatings>> {
    const results = new Map<string, ExternalRatings>();

    // Fetch all in parallel with rate limiting
    const batchSize = 5;
    for (let i = 0; i < mediaItems.length; i += batchSize) {
        const batch = mediaItems.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(item => fetchExternalRatings(item.id, item.imdbId))
        );

        batch.forEach((item, index) => {
            results.set(item.id, batchResults[index]);
        });

        // Small delay between batches to respect rate limits
        if (i + batchSize < mediaItems.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return results;
}

/**
 * Get media items that need ratings refresh
 */
export async function getMediaNeedingRatingsRefresh(
    limit = 50
): Promise<Array<{ id: string; imdbId: string | null }>> {
    const supabase = await createClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CACHE_DURATION_DAYS);

    const { data, error } = await supabase
        .from("media")
        .select("id, imdb_id")
        .not("imdb_id", "is", null)
        .or(`ratings_updated_at.is.null,ratings_updated_at.lt.${cutoffDate.toISOString()}`)
        .limit(limit) as any;

    if (error) {
        console.error("Error fetching media needing refresh:", error);
        return [];
    }

    return data?.map((m: any) => ({ id: m.id, imdbId: m.imdb_id })) || [];
}

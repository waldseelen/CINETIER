/**
 * Elo Rating System for CineTier VS Mode
 *
 * K-factor: 40 for first 20 matches, then 20
 * Starting rating: 1200
 */

const INITIAL_RATING = 1200;
const K_FACTOR_NEW = 40;
const K_FACTOR_ESTABLISHED = 20;
const MATCHES_THRESHOLD = 20;

export interface EloResult {
    winnerNewRating: number;
    loserNewRating: number;
    winnerDelta: number;
    loserDelta: number;
}

/**
 * Calculate expected score (probability of winning)
 */
function expectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Get K-factor based on number of matches
 */
export function getKFactor(matchCount: number): number {
    return matchCount < MATCHES_THRESHOLD ? K_FACTOR_NEW : K_FACTOR_ESTABLISHED;
}

/**
 * Calculate new ratings after a match
 */
export function calculateElo(
    winnerRating: number,
    loserRating: number,
    winnerMatchCount: number,
    loserMatchCount: number
): EloResult {
    const winnerK = getKFactor(winnerMatchCount);
    const loserK = getKFactor(loserMatchCount);

    const winnerExpected = expectedScore(winnerRating, loserRating);
    const loserExpected = expectedScore(loserRating, winnerRating);

    // Winner gets actual score of 1, loser gets 0
    const winnerDelta = Math.round(winnerK * (1 - winnerExpected));
    const loserDelta = Math.round(loserK * (0 - loserExpected));

    return {
        winnerNewRating: winnerRating + winnerDelta,
        loserNewRating: loserRating + loserDelta,
        winnerDelta,
        loserDelta,
    };
}

/**
 * Calculate new ratings for a skip (both slightly penalized or no change)
 */
export function calculateSkipPenalty(
    rating1: number,
    rating2: number,
    applyPenalty = false
): { newRating1: number; newRating2: number } {
    if (!applyPenalty) {
        return { newRating1: rating1, newRating2: rating2 };
    }

    // Small penalty for skipping (optional)
    const penalty = 2;
    return {
        newRating1: Math.max(rating1 - penalty, 100),
        newRating2: Math.max(rating2 - penalty, 100),
    };
}

/**
 * Get initial rating for new media
 */
export function getInitialRating(): number {
    return INITIAL_RATING;
}

/**
 * Calculate win probability percentage
 */
export function getWinProbability(ratingA: number, ratingB: number): number {
    return Math.round(expectedScore(ratingA, ratingB) * 100);
}

/**
 * Get rating tier based on Elo
 */
export function getRatingTier(rating: number): {
    tier: string;
    color: string;
} {
    if (rating >= 1800) return { tier: "S", color: "#FFD700" };
    if (rating >= 1600) return { tier: "A", color: "#C0C0C0" };
    if (rating >= 1400) return { tier: "B", color: "#CD7F32" };
    if (rating >= 1200) return { tier: "C", color: "#00F5D4" };
    if (rating >= 1000) return { tier: "D", color: "#B8FF4A" };
    return { tier: "F", color: "#FF4D6D" };
}

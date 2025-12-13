"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ExternalRatings {
    imdbRating: number | null;
    rtRating: number | null;
    metascore: number | null;
}

interface RatingBadgesProps {
    ratings: ExternalRatings;
    showLabels?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 gap-0.5",
    md: "text-sm px-2 py-1 gap-1",
    lg: "text-base px-3 py-1.5 gap-1.5",
};

const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
};

// IMDb Icon (Yellow Star)
function IMDbIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
    );
}

// Rotten Tomatoes Icon (Tomato)
function RTIcon({ className, fresh }: { className?: string; fresh: boolean }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
        >
            {fresh ? (
                // Fresh tomato
                <path d="M12 2C11.5 2 11 2.19 10.59 2.59L8.59 4.59C8.21 4.21 7.7 4 7.17 4C6.63 4 6.12 4.21 5.75 4.59L4.59 5.75C4.21 6.12 4 6.63 4 7.17C4 7.7 4.21 8.21 4.59 8.59L6.59 10.59C6.19 11 6 11.5 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6C11.5 6 11 6.19 10.59 6.59L8.59 4.59C9 4.19 9.5 4 10 4H12C12.55 4 13 3.55 13 3C13 2.45 12.55 2 12 2M12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8Z" />
            ) : (
                // Splat tomato (rotten)
                <path d="M12 2C11.5 2 11 2.19 10.59 2.59L8.59 4.59C8.21 4.21 7.7 4 7.17 4C6.63 4 6.12 4.21 5.75 4.59L4.59 5.75C4.21 6.12 4 6.63 4 7.17C4 7.7 4.21 8.21 4.59 8.59L6.59 10.59C6.19 11 6 11.5 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6C11.5 6 11 6.19 10.59 6.59L8.59 4.59M12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8Z" />
            )}
        </svg>
    );
}

// Metacritic Icon (M)
function MetacriticIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
        >
            <text x="6" y="18" fontSize="16" fontWeight="bold">M</text>
        </svg>
    );
}

/**
 * Rating badges for external ratings (IMDb, RT, Metascore)
 */
export function RatingBadges({
    ratings,
    showLabels = false,
    size = "md",
    className,
}: RatingBadgesProps) {
    const { imdbRating, rtRating, metascore } = ratings;

    // If no ratings available, don't render anything
    if (!imdbRating && !rtRating && !metascore) {
        return null;
    }

    const rtFresh = rtRating !== null && rtRating >= 60;
    const metascoreColor = metascore
        ? metascore >= 61
            ? "bg-green-600"
            : metascore >= 40
                ? "bg-yellow-600"
                : "bg-red-600"
        : "";

    return (
        <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
            {/* IMDb Rating */}
            {imdbRating !== null && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={cn(
                                "flex items-center rounded-md bg-amber-500/90 text-black font-semibold",
                                sizeClasses[size]
                            )}
                        >
                            <IMDbIcon className={iconSizes[size]} />
                            <span>{imdbRating.toFixed(1)}</span>
                            {showLabels && <span className="ml-0.5 opacity-75">/10</span>}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>IMDb: {imdbRating.toFixed(1)}/10</p>
                    </TooltipContent>
                </Tooltip>
            )}

            {/* Rotten Tomatoes */}
            {rtRating !== null && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={cn(
                                "flex items-center rounded-md font-semibold",
                                rtFresh
                                    ? "bg-red-500/90 text-white"
                                    : "bg-green-700/90 text-white",
                                sizeClasses[size]
                            )}
                        >
                            <RTIcon className={iconSizes[size]} fresh={rtFresh} />
                            <span>{rtRating}%</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            Rotten Tomatoes: {rtRating}%
                            <span className="ml-1 text-muted-foreground">
                                ({rtFresh ? "Fresh" : "Rotten"})
                            </span>
                        </p>
                    </TooltipContent>
                </Tooltip>
            )}

            {/* Metascore */}
            {metascore !== null && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={cn(
                                "flex items-center rounded-md font-bold text-white",
                                metascoreColor,
                                sizeClasses[size]
                            )}
                        >
                            <span>{metascore}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Metascore: {metascore}/100</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}

/**
 * Loading skeleton for rating badges
 */
export function RatingBadgesSkeleton({
    size = "md",
    className,
}: {
    size?: "sm" | "md" | "lg";
    className?: string;
}) {
    const skeletonSizes = {
        sm: "h-5 w-12",
        md: "h-6 w-14",
        lg: "h-7 w-16",
    };

    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            <Skeleton className={cn("rounded-md", skeletonSizes[size])} />
            <Skeleton className={cn("rounded-md", skeletonSizes[size])} />
            <Skeleton className={cn("rounded-md", skeletonSizes[size])} />
        </div>
    );
}

/**
 * Compact inline rating display (for cards)
 */
export function CompactRatings({
    imdbRating,
    rtRating,
    className,
}: {
    imdbRating: number | null;
    rtRating: number | null;
    className?: string;
}) {
    if (!imdbRating && !rtRating) return null;

    return (
        <div className={cn("flex items-center gap-2 text-xs", className)}>
            {imdbRating && (
                <span className="flex items-center gap-0.5 text-amber-500">
                    <IMDbIcon className="w-3 h-3" />
                    {imdbRating.toFixed(1)}
                </span>
            )}
            {rtRating && (
                <span
                    className={cn(
                        "flex items-center gap-0.5",
                        rtRating >= 60 ? "text-red-500" : "text-green-600"
                    )}
                >
                    <RTIcon className="w-3 h-3" fresh={rtRating >= 60} />
                    {rtRating}%
                </span>
            )}
        </div>
    );
}

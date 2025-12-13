"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { getPosterUrl } from "@/lib/tmdb/client";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/types";
import { motion } from "framer-motion";
import { Eye, Plus, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

interface PosterCardProps {
    media: MediaItem;
    size?: "sm" | "md" | "lg";
    showActions?: boolean;
    showRating?: boolean;
    isWatched?: boolean;
    isInWatchlist?: boolean;
    userRating?: number | null;
    onWatchedClick?: () => void;
    onWatchlistClick?: () => void;
    className?: string;
}

const sizeClasses = {
    sm: "w-24 h-36",
    md: "w-32 h-48",
    lg: "w-40 h-60",
};

export function PosterCard({
    media,
    size = "md",
    showActions = false,
    showRating = true,
    isWatched = false,
    isInWatchlist = false,
    userRating,
    onWatchedClick,
    onWatchlistClick,
    className,
}: PosterCardProps) {
    const posterUrl = getPosterUrl(media.posterPath, "medium");

    return (
        <motion.div
            className={cn(
                "group relative overflow-hidden rounded-poster",
                "transition-all duration-normal ease-snappy",
                "hover:-translate-y-1 hover:shadow-glow-md",
                sizeClasses[size],
                className
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <Link
                href={`/media/${media.mediaType}/${media.tmdbId}`}
                className="block h-full w-full"
            >
                {posterUrl ? (
                    <Image
                        src={posterUrl}
                        alt={media.title}
                        fill
                        className="object-cover transition-transform duration-slow group-hover:scale-105"
                        sizes={size === "sm" ? "96px" : size === "md" ? "128px" : "160px"}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface-1">
                        <span className="text-xs text-muted-foreground">Poster yok</span>
                    </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-normal group-hover:opacity-100" />

                {/* Title on hover */}
                <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 transition-opacity duration-normal group-hover:opacity-100">
                    <p className="line-clamp-2 text-xs font-medium text-white">
                        {media.title}
                    </p>
                </div>

                {/* Rating badge */}
                {showRating && media.voteAverage > 0 && (
                    <div className="absolute right-1 top-1 flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                        <Star className="h-3 w-3 fill-neon text-neon" />
                        {media.voteAverage.toFixed(1)}
                    </div>
                )}

                {/* User rating */}
                {userRating && (
                    <div className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-turquoise/90 px-1.5 py-0.5 text-xs font-bold text-cinetier-bg-0">
                        {userRating}
                    </div>
                )}

                {/* Watched indicator */}
                {isWatched && (
                    <div className="absolute bottom-1 right-1 rounded-full bg-neon p-0.5">
                        <Eye className="h-3 w-3 text-cinetier-bg-0" />
                    </div>
                )}
            </Link>

            {/* Quick action buttons */}
            {showActions && (
                <div className="absolute right-1 top-1/2 flex -translate-y-1/2 flex-col gap-1 opacity-0 transition-opacity duration-normal group-hover:opacity-100">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onWatchedClick?.();
                                }}
                                className={cn(
                                    "rounded-full p-1.5 backdrop-blur-sm transition-colors",
                                    isWatched
                                        ? "bg-neon text-cinetier-bg-0"
                                        : "bg-black/60 text-white hover:bg-neon hover:text-cinetier-bg-0"
                                )}
                            >
                                <Eye className="h-3.5 w-3.5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                            {isWatched ? "İzlendi" : "İzledim olarak işaretle"}
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onWatchlistClick?.();
                                }}
                                className={cn(
                                    "rounded-full p-1.5 backdrop-blur-sm transition-colors",
                                    isInWatchlist
                                        ? "bg-turquoise text-cinetier-bg-0"
                                        : "bg-black/60 text-white hover:bg-turquoise hover:text-cinetier-bg-0"
                                )}
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                            {isInWatchlist ? "Listede" : "İzleme listesine ekle"}
                        </TooltipContent>
                    </Tooltip>
                </div>
            )}
        </motion.div>
    );
}

// Skeleton loader for PosterCard
export function PosterCardSkeleton({
    size = "md",
    className,
}: {
    size?: "sm" | "md" | "lg";
    className?: string;
}) {
    return (
        <Skeleton
            className={cn("rounded-poster", sizeClasses[size], className)}
        />
    );
}

// Grid of posters
export function PosterGrid({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7",
                className
            )}
        >
            {children}
        </div>
    );
}

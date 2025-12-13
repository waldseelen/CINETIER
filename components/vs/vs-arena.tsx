"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { getRatingTier, getWinProbability } from "@/lib/elo/elo";
import { getPosterUrl } from "@/lib/tmdb/client";
import { cn } from "@/lib/utils";
import type { MediaItem, VSPair } from "@/types";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Keyboard, SkipForward } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useState } from "react";

interface VSArenaProps {
    pair: VSPair;
    scope: "global" | "user";
    onSelect: (winnerId: string, loserId: string) => void;
    onSkip: () => void;
    isLoading?: boolean;
    showElo?: boolean;
}

export function VSArena({
    pair,
    scope,
    onSelect,
    onSkip,
    isLoading = false,
    showElo = true,
}: VSArenaProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleSelect = async (winner: MediaItem, loser: MediaItem) => {
        if (isLoading || isAnimating) return;

        setSelectedId(winner.id);
        setIsAnimating(true);

        // Wait for animation
        await new Promise((resolve) => setTimeout(resolve, 300));

        onSelect(winner.id, loser.id);
        setSelectedId(null);
        setIsAnimating(false);
    };

    // Keyboard support
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isLoading || isAnimating) return;

            if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
                handleSelect(pair.mediaA, pair.mediaB);
            } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
                handleSelect(pair.mediaB, pair.mediaA);
            } else if (e.key === " " || e.key === "s" || e.key === "S") {
                e.preventDefault();
                onSkip();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [pair, isLoading, isAnimating, onSkip]);

    const eloA = scope === "global" ? pair.mediaA.globalElo : 1200;
    const eloB = scope === "global" ? pair.mediaB.globalElo : 1200;
    const probA = getWinProbability(eloA, eloB);
    const tierA = getRatingTier(eloA);
    const tierB = getRatingTier(eloB);

    return (
        <div className="flex flex-col items-center gap-6 py-8">
            {/* Scope indicator */}
            <div className="flex items-center gap-2">
                <Badge variant={scope === "global" ? "neon" : "turquoise"}>
                    {scope === "global" ? "Global Sıralama" : "Senin Sıralaman"}
                </Badge>
            </div>

            {/* VS Cards */}
            <div className="flex items-center gap-4 md:gap-8">
                {/* Left card (A) */}
                <VSCard
                    media={pair.mediaA}
                    elo={eloA}
                    tier={tierA}
                    winProbability={probA}
                    isSelected={selectedId === pair.mediaA.id}
                    isLoser={selectedId === pair.mediaB.id}
                    onClick={() => handleSelect(pair.mediaA, pair.mediaB)}
                    showElo={showElo}
                    direction="left"
                    disabled={isLoading || isAnimating}
                />

                {/* VS divider */}
                <div className="flex flex-col items-center gap-2">
                    <motion.div
                        className="font-display text-3xl font-bold text-gradient-neon"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        VS
                    </motion.div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onSkip}
                        disabled={isLoading || isAnimating}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <SkipForward className="mr-1 h-4 w-4" />
                        Geç
                    </Button>
                </div>

                {/* Right card (B) */}
                <VSCard
                    media={pair.mediaB}
                    elo={eloB}
                    tier={tierB}
                    winProbability={100 - probA}
                    isSelected={selectedId === pair.mediaB.id}
                    isLoser={selectedId === pair.mediaA.id}
                    onClick={() => handleSelect(pair.mediaB, pair.mediaA)}
                    showElo={showElo}
                    direction="right"
                    disabled={isLoading || isAnimating}
                />
            </div>

            {/* Keyboard hints */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                            <Keyboard className="h-3 w-3" />
                            <span>Klavye kısayolları</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <div className="space-y-1 text-xs">
                            <p>
                                <kbd className="rounded bg-surface-2 px-1">←</kbd> veya{" "}
                                <kbd className="rounded bg-surface-2 px-1">A</kbd> = Sol seç
                            </p>
                            <p>
                                <kbd className="rounded bg-surface-2 px-1">→</kbd> veya{" "}
                                <kbd className="rounded bg-surface-2 px-1">D</kbd> = Sağ seç
                            </p>
                            <p>
                                <kbd className="rounded bg-surface-2 px-1">Space</kbd> veya{" "}
                                <kbd className="rounded bg-surface-2 px-1">S</kbd> = Geç
                            </p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}

interface VSCardProps {
    media: MediaItem;
    elo: number;
    tier: { tier: string; color: string };
    winProbability: number;
    isSelected: boolean;
    isLoser: boolean;
    onClick: () => void;
    showElo: boolean;
    direction: "left" | "right";
    disabled: boolean;
}

function VSCard({
    media,
    elo,
    tier,
    winProbability,
    isSelected,
    isLoser,
    onClick,
    showElo,
    direction,
    disabled,
}: VSCardProps) {
    const posterUrl = getPosterUrl(media.posterPath, "large");

    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "group relative h-80 w-52 overflow-hidden rounded-card transition-all duration-normal md:h-96 md:w-64",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turquoise focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isSelected && "vs-card-selected",
                isLoser && "opacity-50 blur-[2px]",
                !disabled && "cursor-pointer hover:shadow-glow-md"
            )}
            animate={
                isSelected
                    ? { scale: 1.05, y: -10 }
                    : isLoser
                        ? { scale: 0.95 }
                        : { scale: 1, y: 0 }
            }
            whileHover={!disabled ? { scale: 1.02 } : undefined}
            whileTap={!disabled ? { scale: 0.98 } : undefined}
        >
            {/* Poster */}
            {posterUrl ? (
                <Image
                    src={posterUrl}
                    alt={media.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 208px, 256px"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-1">
                    <span className="text-muted-foreground">Poster yok</span>
                </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="mb-2 font-display text-lg font-bold text-white line-clamp-2">
                    {media.title}
                </h3>

                {showElo && (
                    <div className="flex items-center gap-2">
                        <span
                            className="rounded-full px-2 py-0.5 text-sm font-bold"
                            style={{ backgroundColor: tier.color, color: "#050B08" }}
                        >
                            {tier.tier}
                        </span>
                        <span className="text-sm text-white/80">{elo} Elo</span>
                        <span className="text-xs text-white/60">(%{winProbability})</span>
                    </div>
                )}
            </div>

            {/* Direction hint on hover */}
            <div
                className={cn(
                    "absolute top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100",
                    direction === "left" ? "left-2" : "right-2"
                )}
            >
                {direction === "left" ? (
                    <ChevronLeft className="h-8 w-8 text-white" />
                ) : (
                    <ChevronRight className="h-8 w-8 text-white" />
                )}
            </div>
        </motion.button>
    );
}

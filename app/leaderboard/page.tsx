"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getPosterUrl } from "@/lib/tmdb";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Film, Loader2, Medal, Trophy, Tv } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface EloEntry {
    media_id: string;
    elo_rating: number;
    match_count: number;
    win_count: number;
    media: {
        tmdb_id: number;
        media_type: "movie" | "tv";
        title: string;
        poster_path: string | null;
        year: number | null;
    };
}

export default function LeaderboardPage() {
    const [scope, setScope] = useState<"global" | "user">("global");
    const [mediaType, setMediaType] = useState<"all" | "movie" | "tv">("all");

    const { data, isLoading, error } = useQuery<EloEntry[]>({
        queryKey: ["leaderboard", scope, mediaType],
        queryFn: async () => {
            const params = new URLSearchParams({ scope });
            if (mediaType !== "all") params.append("mediaType", mediaType);
            const res = await fetch(`/api/vs/leaderboard?${params}`);
            if (!res.ok) throw new Error("Failed to fetch leaderboard");
            const data = await res.json();
            return data.leaderboard;
        },
    });

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="h-6 w-6 text-yellow-400" />;
            case 2:
                return <Medal className="h-6 w-6 text-gray-300" />;
            case 3:
                return <Medal className="h-6 w-6 text-amber-600" />;
            default:
                return (
                    <span className="flex h-6 w-6 items-center justify-center text-sm font-bold text-muted-foreground">
                        {rank}
                    </span>
                );
        }
    };

    const getRankBg = (rank: number) => {
        switch (rank) {
            case 1:
                return "bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/30";
            case 2:
                return "bg-gradient-to-r from-gray-400/20 to-transparent border-gray-400/30";
            case 3:
                return "bg-gradient-to-r from-amber-600/20 to-transparent border-amber-600/30";
            default:
                return "bg-surface-1 border-border";
        }
    };

    return (
        <div className="container py-8 pb-20 md:pb-8">
            <Link
                href="/vs"
                className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-neon"
            >
                <ArrowLeft className="h-4 w-4" />
                VS Arena&apos;ya Dön
            </Link>

            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <div className="text-center">
                    <h1 className="font-display text-4xl font-bold">
                        <Trophy className="mr-3 inline-block h-10 w-10 text-neon" />
                        Elo Sıralaması
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        VS Arena&apos;da en yüksek Elo&apos;ya sahip filmler ve diziler
                    </p>
                </div>

                {/* Filters */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-1 p-1">
                        <button
                            onClick={() => setScope("global")}
                            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${scope === "global"
                                    ? "bg-neon text-cinetier-bg-0"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Global
                        </button>
                        <button
                            onClick={() => setScope("user")}
                            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${scope === "user"
                                    ? "bg-turquoise text-cinetier-bg-0"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Senin Sıralaman
                        </button>
                    </div>

                    <Select value={mediaType} onValueChange={(v) => setMediaType(v as any)}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tümü</SelectItem>
                            <SelectItem value="movie">Filmler</SelectItem>
                            <SelectItem value="tv">Diziler</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Leaderboard */}
                <div className="mt-8 space-y-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-neon" />
                        </div>
                    ) : error ? (
                        <div className="rounded-card border border-border bg-surface-1 p-8 text-center">
                            <p className="text-muted-foreground">Sıralama yüklenemedi</p>
                        </div>
                    ) : !data || data.length === 0 ? (
                        <div className="rounded-card border border-border bg-surface-1 p-8 text-center">
                            <p className="text-muted-foreground">
                                Henüz sıralama oluşmadı. VS Arena&apos;da maç yaparak başlayın!
                            </p>
                            <Button asChild className="mt-4">
                                <Link href="/vs">VS Arena&apos;ya Git</Link>
                            </Button>
                        </div>
                    ) : (
                        data.map((entry, index) => (
                            <motion.div
                                key={entry.media_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link href={`/media/${entry.media.media_type}/${entry.media.tmdb_id}`}>
                                    <div
                                        className={`flex items-center gap-4 rounded-card border p-4 transition-all hover:scale-[1.02] ${getRankBg(
                                            index + 1
                                        )}`}
                                    >
                                        {/* Rank */}
                                        <div className="flex h-10 w-10 items-center justify-center">
                                            {getRankIcon(index + 1)}
                                        </div>

                                        {/* Poster */}
                                        <div className="relative h-16 w-11 overflow-hidden rounded-md bg-surface-2">
                                            {entry.media.poster_path ? (
                                                <Image
                                                    src={getPosterUrl(entry.media.poster_path, "small") || ""}
                                                    alt={entry.media.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center">
                                                    {entry.media.media_type === "movie" ? (
                                                        <Film className="h-5 w-5 text-muted-foreground" />
                                                    ) : (
                                                        <Tv className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate font-medium">{entry.media.title}</h3>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    {entry.media.media_type === "movie" ? "Film" : "Dizi"}
                                                </Badge>
                                                {entry.media.year && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {entry.media.year}
                                                    </span>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {entry.match_count} maç • %
                                                    {entry.match_count > 0
                                                        ? Math.round((entry.win_count / entry.match_count) * 100)
                                                        : 0}{" "}
                                                    kazanma
                                                </span>
                                            </div>
                                        </div>

                                        {/* Elo */}
                                        <div className="text-right">
                                            <p className="font-display text-2xl font-bold text-neon">
                                                {entry.elo_rating}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Elo</p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

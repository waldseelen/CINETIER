"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    Flame,
    PlayCircle,
    Sparkles,
    Star,
    Trophy,
    Tv
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface AnimeSearchResult {
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

interface AnimeResponse {
    success: boolean;
    data: AnimeSearchResult[];
    pagination: {
        current_page: number;
        last_visible_page: number;
        has_next_page: boolean;
        items: {
            count: number;
            total: number;
            per_page: number;
        };
    };
}

function useAnimeList(
    action: "top" | "season" | "upcoming",
    filter: string,
    page: number
) {
    return useQuery<AnimeResponse>({
        queryKey: ["anime", action, filter, page],
        queryFn: async () => {
            const params = new URLSearchParams({
                action,
                page: page.toString(),
                limit: "24",
            });
            if (filter) params.set("filter", filter);

            const res = await fetch(`/api/anime?${params}`);
            if (!res.ok) throw new Error("Failed to fetch anime");
            return res.json();
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

// Anime Card Component
function AnimeCard({ anime }: { anime: AnimeSearchResult }) {
    const statusColors: Record<string, string> = {
        "Finished Airing": "bg-green-600/80",
        "Currently Airing": "bg-red-500/80",
        "Not yet aired": "bg-blue-500/80",
    };

    const typeColors: Record<string, string> = {
        TV: "bg-purple-600",
        Movie: "bg-amber-600",
        OVA: "bg-cyan-600",
        ONA: "bg-pink-600",
        Special: "bg-indigo-600",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="group"
        >
            <Link href={`/anime/${anime.malId}`}>
                <Card className="overflow-hidden bg-surface-1 transition-all duration-300 hover:shadow-glow-md hover:border-primary">
                    <div className="relative aspect-[2/3] overflow-hidden">
                        {anime.posterUrl ? (
                            <Image
                                src={anime.posterUrl}
                                alt={anime.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-surface-2">
                                <Tv className="h-12 w-12 text-muted-foreground" />
                            </div>
                        )}

                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                        {/* Type badge */}
                        {anime.type && (
                            <div
                                className={cn(
                                    "absolute left-2 top-2 rounded-md px-2 py-0.5 text-xs font-bold text-white",
                                    typeColors[anime.type] || "bg-gray-600"
                                )}
                            >
                                {anime.type}
                            </div>
                        )}

                        {/* Score badge */}
                        {anime.score && (
                            <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-xs font-bold text-black">
                                <Star className="h-3 w-3 fill-current" />
                                {anime.score.toFixed(1)}
                            </div>
                        )}

                        {/* Status badge */}
                        {anime.status && (
                            <div
                                className={cn(
                                    "absolute bottom-12 left-2 rounded-md px-2 py-0.5 text-xs font-medium text-white",
                                    statusColors[anime.status] || "bg-gray-600/80"
                                )}
                            >
                                {anime.status === "Currently Airing"
                                    ? "Yayında"
                                    : anime.status === "Finished Airing"
                                        ? "Tamamlandı"
                                        : "Yakında"}
                            </div>
                        )}

                        {/* Title */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h3 className="line-clamp-2 text-sm font-semibold text-white">
                                {anime.title}
                            </h3>
                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-300">
                                {anime.year && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {anime.year}
                                    </span>
                                )}
                                {anime.episodes && (
                                    <span className="flex items-center gap-1">
                                        <PlayCircle className="h-3 w-3" />
                                        {anime.episodes} bölüm
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </Link>
        </motion.div>
    );
}

// Loading skeleton
function AnimeCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <Skeleton className="aspect-[2/3] w-full" />
        </Card>
    );
}

// Section header
function SectionHeader({
    icon: Icon,
    title,
    subtitle,
}: {
    icon: React.ElementType;
    title: string;
    subtitle?: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
                <h2 className="font-display text-xl font-bold">{title}</h2>
                {subtitle && (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
            </div>
        </div>
    );
}

export default function AnimePage() {
    const [activeTab, setActiveTab] = useState<"top" | "season" | "upcoming">(
        "top"
    );
    const [topFilter, setTopFilter] = useState<
        "" | "airing" | "upcoming" | "bypopularity" | "favorite"
    >("");
    const [page, setPage] = useState(1);

    const { data, isLoading } = useAnimeList(activeTab, topFilter, page);

    const filterOptions = [
        { value: "", label: "Varsayılan (Puan)" },
        { value: "airing", label: "Şu An Yayında" },
        { value: "upcoming", label: "Yaklaşan" },
        { value: "bypopularity", label: "Popülerlik" },
        { value: "favorite", label: "En Favori" },
    ];

    return (
        <div className="container py-8">
            <div className="flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="flex items-center gap-3 font-display text-3xl font-bold">
                            <Sparkles className="h-8 w-8 text-pink-500" />
                            Anime
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            En popüler ve en iyi animeleri keşfet
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs
                    value={activeTab}
                    onValueChange={(v) => {
                        setActiveTab(v as typeof activeTab);
                        setPage(1);
                    }}
                >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <TabsList>
                            <TabsTrigger value="top" className="gap-2">
                                <Trophy className="h-4 w-4" />
                                En İyiler
                            </TabsTrigger>
                            <TabsTrigger value="season" className="gap-2">
                                <Flame className="h-4 w-4" />
                                Bu Sezon
                            </TabsTrigger>
                            <TabsTrigger value="upcoming" className="gap-2">
                                <Clock className="h-4 w-4" />
                                Yaklaşan
                            </TabsTrigger>
                        </TabsList>

                        {activeTab === "top" && (
                            <Select
                                value={topFilter}
                                onValueChange={(v) => {
                                    setTopFilter(v as typeof topFilter);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Filtrele..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {filterOptions.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <TabsContent value="top" className="mt-6">
                        <SectionHeader
                            icon={Trophy}
                            title="En İyi Animeler"
                            subtitle="MyAnimeList puanlarına göre sıralanmış"
                        />
                    </TabsContent>
                    <TabsContent value="season" className="mt-6">
                        <SectionHeader
                            icon={Flame}
                            title="Bu Sezon Yayında"
                            subtitle="Şu an aktif olarak yayınlanan animeler"
                        />
                    </TabsContent>
                    <TabsContent value="upcoming" className="mt-6">
                        <SectionHeader
                            icon={Clock}
                            title="Yaklaşan Animeler"
                            subtitle="Henüz yayınlanmamış, merakla beklenen animeler"
                        />
                    </TabsContent>
                </Tabs>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {isLoading
                        ? Array.from({ length: 24 }).map((_, i) => (
                            <AnimeCardSkeleton key={i} />
                        ))
                        : data?.data.map((anime) => (
                            <AnimeCard key={anime.malId} anime={anime} />
                        ))}
                </div>

                {/* Empty state */}
                {!isLoading && !data?.data.length && (
                    <div className="py-12 text-center">
                        <Sparkles className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                        <p className="mt-4 text-muted-foreground">
                            Anime bulunamadı
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {data?.pagination && (
                    <div className="flex items-center justify-center gap-4 pt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Önceki
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Sayfa {page} / {data.pagination.last_visible_page}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={!data.pagination.has_next_page}
                        >
                            Sonraki
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import { RatingBadges, RatingBadgesSkeleton } from "@/components/media/rating-badges";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPosterUrl } from "@/lib/tmdb/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Crown,
    Film,
    Medal,
    Star,
    Trophy,
    Tv
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// Genre lists
const MOVIE_GENRES = [
    { id: 28, name: "Aksiyon", slug: "action" },
    { id: 12, name: "Macera", slug: "adventure" },
    { id: 16, name: "Animasyon", slug: "animation" },
    { id: 35, name: "Komedi", slug: "comedy" },
    { id: 80, name: "Suç", slug: "crime" },
    { id: 99, name: "Belgesel", slug: "documentary" },
    { id: 18, name: "Drama", slug: "drama" },
    { id: 14, name: "Fantastik", slug: "fantasy" },
    { id: 27, name: "Korku", slug: "horror" },
    { id: 9648, name: "Gizem", slug: "mystery" },
    { id: 10749, name: "Romantik", slug: "romance" },
    { id: 878, name: "Bilim Kurgu", slug: "sci-fi" },
    { id: 53, name: "Gerilim", slug: "thriller" },
    { id: 10752, name: "Savaş", slug: "war" },
];

const TV_GENRES = [
    { id: 10759, name: "Aksiyon & Macera", slug: "action-adventure" },
    { id: 16, name: "Animasyon", slug: "animation" },
    { id: 35, name: "Komedi", slug: "comedy" },
    { id: 80, name: "Suç", slug: "crime" },
    { id: 18, name: "Drama", slug: "drama" },
    { id: 9648, name: "Gizem", slug: "mystery" },
    { id: 10765, name: "Bilim Kurgu & Fantastik", slug: "sci-fi-fantasy" },
];

interface RankedMedia {
    id: string | null;
    tmdbId: number;
    mediaType: string;
    title: string;
    originalTitle: string;
    posterPath: string | null;
    releaseDate: string | null;
    voteAverage: number;
    imdbRating: number | null;
    rtRating: number | null;
    metascore: number | null;
}

interface RankingsResponse {
    success: boolean;
    data: RankedMedia[];
    pagination: {
        page: number;
        limit: number;
        hasMore: boolean;
        totalPages?: number;
        totalResults?: number;
    };
    source: string;
}

interface Top10Response {
    success: boolean;
    genre: { id: number; name: string; slug: string };
    data: Array<RankedMedia & { rank: number }>;
}

function useRankings(
    type: "movie" | "tv",
    sortBy: string,
    page: number
) {
    return useQuery<RankingsResponse>({
        queryKey: ["rankings", type, sortBy, page],
        queryFn: async () => {
            const res = await fetch(
                `/api/rankings?type=${type}&sortBy=${sortBy}&page=${page}&limit=25`
            );
            if (!res.ok) throw new Error("Failed to fetch rankings");
            return res.json();
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

function useTop10(type: "movie" | "tv", genre: string | null) {
    return useQuery<Top10Response>({
        queryKey: ["top10", type, genre],
        queryFn: async () => {
            const res = await fetch(
                `/api/rankings/top10?type=${type}&genre=${genre}`
            );
            if (!res.ok) throw new Error("Failed to fetch top 10");
            return res.json();
        },
        enabled: !!genre,
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
}

// Rank badge component
function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) {
        return (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 shadow-lg">
                <Crown className="h-5 w-5 text-white" />
            </div>
        );
    }
    if (rank === 2) {
        return (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-lg">
                <Medal className="h-5 w-5 text-white" />
            </div>
        );
    }
    if (rank === 3) {
        return (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-800 shadow-lg">
                <Medal className="h-5 w-5 text-white" />
            </div>
        );
    }
    return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-lg font-bold text-muted-foreground">
            {rank}
        </div>
    );
}

// Media row component
function MediaRow({
    media,
    rank,
    type,
}: {
    media: RankedMedia;
    rank: number;
    type: "movie" | "tv";
}) {
    const posterUrl = getPosterUrl(media.posterPath, "small");
    const year = media.releaseDate
        ? new Date(media.releaseDate).getFullYear()
        : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.03 }}
        >
            <Link
                href={`/media/${type}/${media.tmdbId}`}
                className="group flex items-center gap-4 rounded-lg border border-border bg-surface-1 p-3 transition-all hover:border-primary hover:bg-surface-2"
            >
                <RankBadge rank={rank} />

                <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-surface-2">
                    {posterUrl ? (
                        <Image
                            src={posterUrl}
                            alt={media.title}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                            N/A
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {media.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        {year && <span>{year}</span>}
                        {media.originalTitle !== media.title && (
                            <span className="truncate text-xs">
                                ({media.originalTitle})
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* TMDB Rating */}
                    <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-neon text-neon" />
                        <span className="font-medium">
                            {media.voteAverage?.toFixed(1)}
                        </span>
                    </div>

                    {/* External Ratings */}
                    <RatingBadges
                        ratings={{
                            imdbRating: media.imdbRating,
                            rtRating: media.rtRating,
                            metascore: media.metascore,
                        }}
                        size="sm"
                    />
                </div>
            </Link>
        </motion.div>
    );
}

// Loading skeleton
function RankingsRowSkeleton() {
    return (
        <div className="flex items-center gap-4 rounded-lg border border-border bg-surface-1 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-20 w-14 rounded-md" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
            </div>
            <RatingBadgesSkeleton size="sm" />
        </div>
    );
}

export default function RankingsPage() {
    const [type, setType] = useState<"movie" | "tv">("movie");
    const [sortBy, setSortBy] = useState("imdb");
    const [page, setPage] = useState(1);
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

    const { data: rankings, isLoading: rankingsLoading } = useRankings(
        type,
        sortBy,
        page
    );
    const { data: top10, isLoading: top10Loading } = useTop10(
        type,
        selectedGenre
    );

    const genres = type === "movie" ? MOVIE_GENRES : TV_GENRES;

    return (
        <div className="container py-8">
            <div className="flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="flex items-center gap-3 font-display text-3xl font-bold">
                            <Trophy className="h-8 w-8 text-neon" />
                            En İyi Sıralamalar
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            IMDb, Rotten Tomatoes ve Metascore puanlarına göre en
                            iyi filmler ve diziler
                        </p>
                    </div>

                    <Tabs
                        value={type}
                        onValueChange={(v) => {
                            setType(v as "movie" | "tv");
                            setPage(1);
                            setSelectedGenre(null);
                        }}
                    >
                        <TabsList>
                            <TabsTrigger value="movie" className="gap-2">
                                <Film className="h-4 w-4" />
                                Filmler
                            </TabsTrigger>
                            <TabsTrigger value="tv" className="gap-2">
                                <Tv className="h-4 w-4" />
                                Diziler
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
                    {/* Sidebar - Genre Top 10 */}
                    <div className="space-y-4">
                        <Card className="p-4">
                            <h2 className="mb-4 font-semibold">
                                Kategori Bazlı En İyi 10
                            </h2>
                            <Select
                                value={selectedGenre || ""}
                                onValueChange={(v) => setSelectedGenre(v || null)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Kategori seç..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {genres.map((genre) => (
                                        <SelectItem
                                            key={genre.slug}
                                            value={genre.slug}
                                        >
                                            {genre.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Top 10 Results */}
                            {selectedGenre && (
                                <div className="mt-4 space-y-2">
                                    {top10Loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <Skeleton
                                                key={i}
                                                className="h-12 w-full rounded-md"
                                            />
                                        ))
                                    ) : top10?.data ? (
                                        <>
                                            <h3 className="text-sm font-medium text-muted-foreground">
                                                {top10.genre.name} - En İyi 10
                                            </h3>
                                            {top10.data.map((item) => (
                                                <Link
                                                    key={item.tmdbId}
                                                    href={`/media/${type}/${item.tmdbId}`}
                                                    className="flex items-center gap-2 rounded-md p-2 hover:bg-surface-2 transition-colors"
                                                >
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                                                        {item.rank}
                                                    </span>
                                                    <span className="flex-1 truncate text-sm">
                                                        {item.title}
                                                    </span>
                                                    <span className="text-xs text-amber-500 font-medium">
                                                        {item.voteAverage?.toFixed(1)}
                                                    </span>
                                                </Link>
                                            ))}
                                        </>
                                    ) : null}
                                </div>
                            )}
                        </Card>

                        {/* Quick Filters */}
                        <Card className="p-4">
                            <h2 className="mb-4 font-semibold">Hızlı Erişim</h2>
                            <div className="flex flex-wrap gap-2">
                                <Badge
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                    onClick={() => setSelectedGenre("action")}
                                >
                                    🎬 Aksiyon
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                    onClick={() => setSelectedGenre("drama")}
                                >
                                    🎭 Drama
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                    onClick={() => setSelectedGenre("comedy")}
                                >
                                    😂 Komedi
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                    onClick={() => setSelectedGenre("horror")}
                                >
                                    👻 Korku
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                    onClick={() => setSelectedGenre("sci-fi")}
                                >
                                    🚀 Bilim Kurgu
                                </Badge>
                            </div>
                        </Card>
                    </div>

                    {/* Main Content - Rankings List */}
                    <div className="space-y-4">
                        {/* Sort Options */}
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Sayfa {page}
                                {rankings?.pagination.totalResults &&
                                    ` - Toplam ${rankings.pagination.totalResults.toLocaleString()} sonuç`}
                            </p>
                            <Select
                                value={sortBy}
                                onValueChange={(v) => {
                                    setSortBy(v);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="imdb">
                                        IMDb Puanı
                                    </SelectItem>
                                    <SelectItem value="tmdb">
                                        TMDB Puanı
                                    </SelectItem>
                                    <SelectItem value="rt">
                                        Rotten Tomatoes
                                    </SelectItem>
                                    <SelectItem value="metascore">
                                        Metascore
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Rankings List */}
                        <div className="space-y-2">
                            {rankingsLoading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <RankingsRowSkeleton key={i} />
                                ))
                            ) : rankings?.data.length ? (
                                rankings.data.map((media, index) => (
                                    <MediaRow
                                        key={media.tmdbId}
                                        media={media}
                                        rank={(page - 1) * 25 + index + 1}
                                        type={type}
                                    />
                                ))
                            ) : (
                                <div className="py-12 text-center text-muted-foreground">
                                    <Trophy className="mx-auto h-12 w-12 opacity-50" />
                                    <p className="mt-4">Sonuç bulunamadı</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {rankings && (
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
                                    Sayfa {page}
                                    {rankings.pagination.totalPages &&
                                        ` / ${rankings.pagination.totalPages}`}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={!rankings.pagination.hasMore}
                                >
                                    Sonraki
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    getAnimeRatingDisplay,
    getAnimeStatusDisplay,
    getAnimeTypeDisplay,
} from "@/lib/jikan/mapper";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    Bookmark,
    Calendar,
    Clock,
    ExternalLink,
    Eye,
    Film,
    Heart,
    Info,
    Layers,
    MessageSquare,
    PlayCircle,
    Star,
    Trophy,
    Tv,
    Users
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

interface AnimeDetails {
    mal_id: number;
    title: string;
    title_english: string | null;
    title_japanese: string | null;
    images: {
        jpg: {
            large_image_url: string;
        };
    };
    trailer?: {
        youtube_id: string | null;
        url: string | null;
    };
    synopsis: string | null;
    background: string | null;
    score: number | null;
    scored_by: number | null;
    rank: number | null;
    popularity: number | null;
    members: number;
    favorites: number;
    type: string | null;
    episodes: number | null;
    status: string;
    airing: boolean;
    aired: {
        from: string | null;
        to: string | null;
        string: string;
    };
    duration: string;
    rating: string | null;
    source: string;
    season: string | null;
    year: number | null;
    studios: Array<{ mal_id: number; name: string }>;
    genres: Array<{ mal_id: number; name: string }>;
    themes: Array<{ mal_id: number; name: string }>;
    demographics: Array<{ mal_id: number; name: string }>;
}

function useAnimeDetails(malId: number) {
    return useQuery<{ success: boolean; data: AnimeDetails }>({
        queryKey: ["anime", "details", malId],
        queryFn: async () => {
            const res = await fetch(`/api/anime?action=details&id=${malId}`);
            if (!res.ok) throw new Error("Failed to fetch anime details");
            return res.json();
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

// Info row component
function InfoRow({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: string | number | null;
    icon?: React.ElementType;
}) {
    if (!value) return null;

    return (
        <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
                {Icon && <Icon className="h-4 w-4" />}
                {label}
            </span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}

// Stat card component
function StatCard({
    icon: Icon,
    label,
    value,
    color = "primary",
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color?: "primary" | "amber" | "red" | "pink";
}) {
    const colorClasses = {
        primary: "bg-primary/20 text-primary",
        amber: "bg-amber-500/20 text-amber-500",
        red: "bg-red-500/20 text-red-500",
        pink: "bg-pink-500/20 text-pink-500",
    };

    return (
        <Card className="p-4">
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        colorClasses[color]
                    )}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </div>
        </Card>
    );
}

export default function AnimeDetailPage() {
    const params = useParams();
    const malId = parseInt(params.malId as string);

    const { data, isLoading, error } = useAnimeDetails(malId);
    const anime = data?.data;

    if (isLoading) {
        return <AnimeDetailSkeleton />;
    }

    if (error || !anime) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-2xl font-bold text-foreground">
                    Anime bulunamadı
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Bu anime bulunamadı veya kaldırılmış olabilir.
                </p>
                <Button asChild className="mt-4">
                    <Link href="/anime">Anime Listesine Dön</Link>
                </Button>
            </div>
        );
    }

    const title = anime.title_english || anime.title;
    const posterUrl = anime.images?.jpg?.large_image_url;

    return (
        <div className="pb-20 md:pb-8">
            {/* Hero Section */}
            <div className="relative h-64 w-full bg-gradient-to-b from-pink-900/30 to-background md:h-80">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            </div>

            <div className="container -mt-32 relative">
                <div className="flex flex-col gap-8 md:flex-row">
                    {/* Poster */}
                    <div className="shrink-0">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mx-auto w-48 md:mx-0 md:w-64"
                        >
                            <div className="aspect-[2/3] rounded-lg bg-surface-1 shadow-glow-sm overflow-hidden">
                                {posterUrl ? (
                                    <Image
                                        src={posterUrl}
                                        alt={title}
                                        width={256}
                                        height={384}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                        <Tv className="h-16 w-16" />
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Action buttons */}
                        <div className="mt-4 flex flex-col gap-2">
                            <Button variant="neon" className="w-full gap-2">
                                <Eye className="h-4 w-4" />
                                İzledim
                            </Button>
                            <Button variant="outline" className="w-full gap-2">
                                <Bookmark className="h-4 w-4" />
                                İzleneceklere Ekle
                            </Button>
                            {anime.trailer?.url && (
                                <Button
                                    variant="secondary"
                                    className="w-full gap-2"
                                    asChild
                                >
                                    <a
                                        href={anime.trailer.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <PlayCircle className="h-4 w-4" />
                                        Fragman İzle
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex-1"
                    >
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="bg-pink-500/20 text-pink-500">
                                Anime
                            </Badge>
                            {anime.type && (
                                <Badge variant="outline">
                                    {getAnimeTypeDisplay(anime.type)}
                                </Badge>
                            )}
                            {anime.year && (
                                <Badge variant="outline">{anime.year}</Badge>
                            )}
                            {anime.season && (
                                <Badge variant="outline" className="capitalize">
                                    {anime.season}
                                </Badge>
                            )}
                            {anime.rating && (
                                <Badge variant="outline">
                                    {getAnimeRatingDisplay(anime.rating)}
                                </Badge>
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">
                            {title}
                        </h1>
                        {anime.title_japanese && anime.title_japanese !== title && (
                            <p className="mt-1 text-muted-foreground">
                                {anime.title_japanese}
                            </p>
                        )}

                        {/* Stats row */}
                        <div className="mt-4 flex flex-wrap gap-4 text-sm">
                            {anime.score && (
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                    <span className="font-bold text-amber-500">
                                        {anime.score.toFixed(2)}
                                    </span>
                                    <span className="text-muted-foreground">/10</span>
                                    {anime.scored_by && (
                                        <span className="text-muted-foreground">
                                            ({anime.scored_by.toLocaleString()} oy)
                                        </span>
                                    )}
                                </div>
                            )}
                            {anime.rank && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Trophy className="h-4 w-4" />
                                    <span>Sıralama #{anime.rank}</span>
                                </div>
                            )}
                            {anime.popularity && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>Popülerlik #{anime.popularity}</span>
                                </div>
                            )}
                        </div>

                        {/* Stats cards */}
                        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                            {anime.episodes && (
                                <StatCard
                                    icon={PlayCircle}
                                    label="Bölüm"
                                    value={anime.episodes}
                                    color="primary"
                                />
                            )}
                            <StatCard
                                icon={Users}
                                label="Üye"
                                value={anime.members.toLocaleString()}
                                color="primary"
                            />
                            <StatCard
                                icon={Heart}
                                label="Favori"
                                value={anime.favorites.toLocaleString()}
                                color="pink"
                            />
                            {anime.rank && (
                                <StatCard
                                    icon={Trophy}
                                    label="Sıralama"
                                    value={`#${anime.rank}`}
                                    color="amber"
                                />
                            )}
                        </div>

                        {/* Synopsis */}
                        {anime.synopsis && (
                            <div className="mt-6">
                                <h3 className="mb-2 font-semibold">Özet</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {anime.synopsis}
                                </p>
                            </div>
                        )}

                        {/* Genres */}
                        {anime.genres.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {anime.genres.map((genre) => (
                                    <Badge key={genre.mal_id} variant="secondary">
                                        {genre.name}
                                    </Badge>
                                ))}
                                {anime.themes.map((theme) => (
                                    <Badge key={theme.mal_id} variant="outline">
                                        {theme.name}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Additional Info Tabs */}
                <Tabs defaultValue="info" className="mt-8">
                    <TabsList>
                        <TabsTrigger value="info" className="gap-2">
                            <Info className="h-4 w-4" />
                            Bilgiler
                        </TabsTrigger>
                        <TabsTrigger value="comments" className="gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Yorumlar
                        </TabsTrigger>
                        <TabsTrigger value="lists" className="gap-2">
                            <Layers className="h-4 w-4" />
                            Tier Listelerde
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="mt-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="p-4">
                                <h3 className="mb-4 font-semibold">Genel Bilgiler</h3>
                                <InfoRow
                                    label="Tür"
                                    value={getAnimeTypeDisplay(anime.type)}
                                    icon={Film}
                                />
                                <InfoRow
                                    label="Bölüm Sayısı"
                                    value={anime.episodes}
                                    icon={PlayCircle}
                                />
                                <InfoRow
                                    label="Durum"
                                    value={getAnimeStatusDisplay(anime.status)}
                                    icon={Clock}
                                />
                                <InfoRow
                                    label="Yayın Tarihi"
                                    value={anime.aired?.string}
                                    icon={Calendar}
                                />
                                <InfoRow
                                    label="Süre"
                                    value={anime.duration}
                                    icon={Clock}
                                />
                                <InfoRow
                                    label="Kaynak"
                                    value={anime.source}
                                    icon={Film}
                                />
                            </Card>

                            <Card className="p-4">
                                <h3 className="mb-4 font-semibold">Yapım</h3>
                                {anime.studios.length > 0 && (
                                    <div className="py-2 border-b border-border/50">
                                        <span className="text-sm text-muted-foreground">
                                            Stüdyo
                                        </span>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            {anime.studios.map((studio) => (
                                                <Badge
                                                    key={studio.mal_id}
                                                    variant="secondary"
                                                >
                                                    {studio.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {anime.demographics.length > 0 && (
                                    <div className="py-2">
                                        <span className="text-sm text-muted-foreground">
                                            Demografik
                                        </span>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            {anime.demographics.map((demo) => (
                                                <Badge
                                                    key={demo.mal_id}
                                                    variant="outline"
                                                >
                                                    {demo.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="mt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        asChild
                                    >
                                        <a
                                            href={`https://myanimelist.net/anime/${anime.mal_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            MyAnimeList'te Görüntüle
                                        </a>
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        {anime.background && (
                            <Card className="mt-6 p-4">
                                <h3 className="mb-2 font-semibold">Arka Plan</h3>
                                <p className="text-sm text-muted-foreground">
                                    {anime.background}
                                </p>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="comments" className="mt-6">
                        <div className="text-center py-12 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Henüz yorum yok</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="lists" className="mt-6">
                        <div className="text-center py-12 text-muted-foreground">
                            <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Bu anime henüz hiçbir tier listede yok</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function AnimeDetailSkeleton() {
    return (
        <div className="pb-20 md:pb-8">
            <div className="relative h-64 w-full bg-surface-1 md:h-80" />
            <div className="container -mt-32 relative">
                <div className="flex flex-col gap-8 md:flex-row">
                    <div className="shrink-0">
                        <div className="mx-auto w-48 md:mx-0 md:w-64">
                            <Skeleton className="aspect-[2/3] rounded-lg" />
                        </div>
                        <div className="mt-4 space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                    <div className="flex-1 space-y-4">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-5 w-1/2" />
                        <div className="flex gap-4">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-20" />
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-20 rounded-lg" />
                            ))}
                        </div>
                        <Skeleton className="h-24 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

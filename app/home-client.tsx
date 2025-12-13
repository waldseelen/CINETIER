"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTMDBTrending } from "@/lib/hooks/use-queries";
import { createClient } from "@/lib/supabase/client";
import { getPosterUrl } from "@/lib/tmdb";
import { ArrowRight, Layers, Star, Swords, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface TierList {
    id: string;
    title: string;
    slug: string;
    media_type: string;
    like_count: number;
    profiles: {
        username: string;
    };
}

interface TMDBMovie {
    id: number;
    title: string;
    poster_path: string | null;
    vote_average: number;
}

export function HomeClient() {
    const { data: trendingMovies, isLoading: loadingTrending } = useTMDBTrending("movie");
    const [tierLists, setTierLists] = useState<TierList[]>([]);
    const [loadingLists, setLoadingLists] = useState(true);

    useEffect(() => {
        const fetchTierLists = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from("tier_lists")
                .select(`
                    id,
                    title,
                    slug,
                    media_type,
                    like_count,
                    profiles:user_id (
                        username
                    )
                `)
                .eq("visibility", "public")
                .order("created_at", { ascending: false })
                .limit(3);

            setTierLists((data as TierList[]) || []);
            setLoadingLists(false);
        };

        fetchTierLists();
    }, []);

    return (
        <div className="container pb-20 md:pb-8">
            {/* Hero Section */}
            <section className="relative py-16 md:py-24">
                {/* Background glow */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-turquoise/10 blur-3xl" />
                    <div className="absolute right-1/4 top-1/2 h-64 w-64 rounded-full bg-neon/10 blur-3xl" />
                </div>

                <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
                    <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
                        Zevkini{" "}
                        <span className="text-gradient-neon">Görselleştir</span>,{" "}
                        <br className="hidden sm:inline" />
                        Yarıştır, Paylaş
                    </h1>
                    <p className="mt-6 text-lg text-muted-foreground md:text-xl">
                        Film ve dizi tier listeleri oluştur, VS modunda favorilerini
                        karşılaştır, topluluğun zevkini keşfet.
                    </p>

                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <Link href="/create">
                            <Button variant="neon" size="xl" className="gap-2">
                                <Layers className="h-5 w-5" />
                                Tier List Oluştur
                            </Button>
                        </Link>
                        <Link href="/vs">
                            <Button variant="turquoise" size="xl" className="gap-2">
                                <Swords className="h-5 w-5" />
                                VS Moduna Gir
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-12">
                <div className="grid gap-6 md:grid-cols-3">
                    <FeatureCard
                        icon={Layers}
                        title="Tier Builder"
                        description="Sürükle & bırak ile kolayca tier listeleri oluştur. S'den F'e kadar filmlerini sırala."
                        color="neon"
                    />
                    <FeatureCard
                        icon={Swords}
                        title="VS Modu"
                        description="İki film arasında seçim yap, Elo puanlarıyla gerçek sıralamayı bul."
                        color="turquoise"
                    />
                    <FeatureCard
                        icon={TrendingUp}
                        title="Sosyal Keşif"
                        description="Başkalarının listelerini keşfet, takip et, yorum yap ve beğen."
                        color="neon"
                    />
                </div>
            </section>

            {/* Trending Section */}
            <section className="py-12">
                <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl font-bold">Trend Filmler</h2>
                    <Link href="/explore">
                        <Button variant="ghost" size="sm" className="gap-1">
                            Tümünü Gör
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7">
                    {loadingTrending ? (
                        Array.from({ length: 7 }).map((_, i) => (
                            <div
                                key={i}
                                className="aspect-[2/3] animate-pulse rounded-poster bg-surface-1"
                            />
                        ))
                    ) : (
                        trendingMovies?.results?.slice(0, 7).map((movie: TMDBMovie, i: number) => (
                            <div
                                key={movie.id}
                                className="animate-fade-in-up"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <Link href={`/media/movie/${movie.id}`}>
                                    <div className="group relative aspect-[2/3] overflow-hidden rounded-poster bg-surface-1 transition-transform duration-200 hover:scale-105">
                                        {movie.poster_path && (
                                            <Image
                                                src={getPosterUrl(movie.poster_path, "medium") || ""}
                                                alt={movie.title || ""}
                                                fill
                                                className="object-cover"
                                            />
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                                            <h3 className="line-clamp-2 text-xs font-semibold text-white">
                                                {movie.title}
                                            </h3>
                                            {movie.vote_average > 0 && (
                                                <div className="mt-1 flex items-center gap-1 text-[10px] text-white/70">
                                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                    {movie.vote_average.toFixed(1)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Recent Tier Lists */}
            <section className="py-12">
                <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl font-bold">Son Tier Listeler</h2>
                    <Link href="/explore?tab=lists">
                        <Button variant="ghost" size="sm" className="gap-1">
                            Tümünü Gör
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {loadingLists ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-4">
                                    <div className="h-4 w-3/4 rounded bg-surface-1" />
                                    <div className="mt-2 h-3 w-1/2 rounded bg-surface-1" />
                                    <div className="mt-4 flex gap-1">
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <div
                                                key={j}
                                                className="h-12 w-8 rounded bg-surface-1"
                                            />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : tierLists.length === 0 ? (
                        <div className="col-span-full rounded-card border border-border bg-surface-1 p-8 text-center">
                            <Layers className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-muted-foreground">
                                Henüz tier list yok
                            </p>
                            <Button asChild className="mt-4">
                                <Link href="/create">İlk Listeni Oluştur</Link>
                            </Button>
                        </div>
                    ) : (
                        tierLists.map((list, i) => (
                            <div
                                key={list.id}
                                className="animate-fade-in-up"
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <Link href={`/list/${list.slug}`}>
                                    <Card className="group card-hover">
                                        <CardContent className="p-4">
                                            <h3 className="font-semibold transition-colors group-hover:text-neon">
                                                {list.title}
                                            </h3>
                                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                                <span>@{list.profiles?.username}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="capitalize">
                                                        {list.media_type === "movie" ? "Film" : "Dizi"}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Star className="h-3 w-3 fill-neon text-neon" />
                                                        {list.like_count || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}

function FeatureCard({
    icon: Icon,
    title,
    description,
    color,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    color: "neon" | "turquoise";
}) {
    return (
        <Card className="group card-hover border-transparent bg-surface-1/50">
            <CardContent className="p-6">
                <div
                    className={`inline-flex rounded-lg p-2 ${color === "neon"
                        ? "bg-neon/10 text-neon"
                        : "bg-turquoise/10 text-turquoise"
                        }`}
                >
                    <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

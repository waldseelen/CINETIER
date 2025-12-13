"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTMDBTrending } from "@/lib/hooks/use-queries";
import { createClient } from "@/lib/supabase/client";
import { getPosterUrl } from "@/lib/tmdb";
import { AnimatePresence, motion } from "framer-motion";
import { Film, Filter, Layers, Loader2, Search, Star, Tv } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface TierList {
    id: string;
    title: string;
    description: string | null;
    slug: string;
    media_type: string;
    like_count: number;
    created_at: string;
    profiles: {
        username: string;
        display_name: string;
    };
}

export default function ExplorePage() {
    const [activeTab, setActiveTab] = useState<"movies" | "tv" | "lists">("movies");
    const { data: trendingMovies, isLoading: loadingMovies } = useTMDBTrending("movie");
    const { data: trendingTv, isLoading: loadingTv } = useTMDBTrending("tv");
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
                    description,
                    slug,
                    media_type,
                    like_count,
                    created_at,
                    profiles:user_id (
                        username,
                        display_name
                    )
                `)
                .eq("visibility", "public")
                .order("like_count", { ascending: false })
                .limit(12);

            setTierLists((data as any) || []);
            setLoadingLists(false);
        };

        fetchTierLists();
    }, []);

    return (
        <div className="container py-8 pb-20 md:pb-8">
            <div className="mb-8">
                <h1 className="font-display text-3xl font-bold">Keşfet</h1>
                <p className="mt-2 text-muted-foreground">
                    Film, dizi ve tier listelerini keşfet
                </p>
            </div>

            {/* Search link */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                <Link href="/search" className="relative flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Film, dizi veya liste ara..."
                            className="cursor-pointer pl-10"
                            readOnly
                        />
                    </div>
                </Link>
                <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filtreler
                </Button>
            </div>

            {/* Tabs */}
            <Tabs
                defaultValue="movies"
                className="space-y-6"
                onValueChange={(v: string) => setActiveTab(v as typeof activeTab)}
            >
                <TabsList>
                    <TabsTrigger value="movies" className="gap-2">
                        <Film className="h-4 w-4" />
                        Filmler
                    </TabsTrigger>
                    <TabsTrigger value="tv" className="gap-2">
                        <Tv className="h-4 w-4" />
                        Diziler
                    </TabsTrigger>
                    <TabsTrigger value="lists" className="gap-2">
                        <Layers className="h-4 w-4" />
                        Tier Listeler
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="movies">
                    {loadingMovies ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-neon" />
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                                {trendingMovies?.results?.map((movie: any, i: number) => (
                                    <motion.div
                                        key={movie.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                    >
                                        <Link href={`/media/movie/${movie.id}`}>
                                            <motion.div
                                                whileHover={{ scale: 1.05 }}
                                                className="group relative aspect-[2/3] overflow-hidden rounded-poster bg-surface-1"
                                            >
                                                {movie.poster_path ? (
                                                    <Image
                                                        src={getPosterUrl(movie.poster_path, "medium") || ""}
                                                        alt={movie.title || ""}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center">
                                                        <Film className="h-8 w-8 text-muted-foreground/50" />
                                                    </div>
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
                                            </motion.div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </AnimatePresence>
                    )}
                </TabsContent>

                <TabsContent value="tv">
                    {loadingTv ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-neon" />
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                                {trendingTv?.results?.map((show: any, i: number) => (
                                    <motion.div
                                        key={show.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                    >
                                        <Link href={`/media/tv/${show.id}`}>
                                            <motion.div
                                                whileHover={{ scale: 1.05 }}
                                                className="group relative aspect-[2/3] overflow-hidden rounded-poster bg-surface-1"
                                            >
                                                {show.poster_path ? (
                                                    <Image
                                                        src={getPosterUrl(show.poster_path, "medium") || ""}
                                                        alt={show.name || ""}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center">
                                                        <Tv className="h-8 w-8 text-muted-foreground/50" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <h3 className="line-clamp-2 text-xs font-semibold text-white">
                                                        {show.name}
                                                    </h3>
                                                    {show.vote_average > 0 && (
                                                        <div className="mt-1 flex items-center gap-1 text-[10px] text-white/70">
                                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                            {show.vote_average.toFixed(1)}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </AnimatePresence>
                    )}
                </TabsContent>

                <TabsContent value="lists">
                    {loadingLists ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-48 animate-pulse rounded-card bg-surface-1"
                                />
                            ))}
                        </div>
                    ) : tierLists.length === 0 ? (
                        <div className="rounded-card border border-border bg-surface-1 p-8 text-center">
                            <Layers className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-muted-foreground">
                                Henüz tier list yok
                            </p>
                            <Button asChild className="mt-4">
                                <Link href="/create">İlk Listeni Oluştur</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {tierLists.map((list, i) => (
                                <motion.div
                                    key={list.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Link href={`/list/${list.slug}`}>
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            className="rounded-card border border-border bg-surface-1 p-4 transition-colors hover:border-neon/50"
                                        >
                                            <h3 className="font-semibold">{list.title}</h3>
                                            {list.description && (
                                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                    {list.description}
                                                </p>
                                            )}
                                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                                <span>
                                                    @{list.profiles?.username}
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <span className="capitalize">
                                                        {list.media_type === "movie" ? "Film" : "Dizi"}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Star className="h-3 w-3 fill-neon text-neon" />
                                                        {list.like_count || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

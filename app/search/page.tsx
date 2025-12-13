"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useTMDBSearch } from "@/lib/hooks/use-queries";
import { getPosterUrl } from "@/lib/tmdb";
import { AnimatePresence, motion } from "framer-motion";
import { Film, Loader2, Search, Star, Tv } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function SearchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = searchParams.get("q") || "";
    const initialType = (searchParams.get("type") as "movie" | "tv" | "multi") || "multi";

    const [query, setQuery] = useState(initialQuery);
    const [type, setType] = useState<"movie" | "tv" | "multi">(initialType);
    const debouncedQuery = useDebounce(query, 300);

    const { data, isLoading, isFetching } = useTMDBSearch(debouncedQuery, type);

    // Update URL when search changes
    useEffect(() => {
        if (debouncedQuery) {
            router.replace(`/search?q=${encodeURIComponent(debouncedQuery)}&type=${type}`, { scroll: false });
        }
    }, [debouncedQuery, type, router]);

    return (
        <div className="container py-8 pb-20 md:pb-8">
            <div className="mx-auto max-w-4xl">
                {/* Search header */}
                <div className="text-center">
                    <h1 className="font-display text-3xl font-bold">Ara</h1>
                    <p className="mt-2 text-muted-foreground">
                        Film, dizi veya kişi ara
                    </p>
                </div>

                {/* Search input */}
                <div className="mt-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Film veya dizi ara..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="h-14 pl-12 pr-4 text-lg"
                            autoFocus
                        />
                        {(isLoading || isFetching) && (
                            <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-neon" />
                        )}
                    </div>
                </div>

                {/* Type filter */}
                <div className="mt-4 flex justify-center">
                    <Tabs value={type} onValueChange={(v) => setType(v as typeof type)}>
                        <TabsList>
                            <TabsTrigger value="multi" className="gap-2">
                                Tümü
                            </TabsTrigger>
                            <TabsTrigger value="movie" className="gap-2">
                                <Film className="h-4 w-4" />
                                Film
                            </TabsTrigger>
                            <TabsTrigger value="tv" className="gap-2">
                                <Tv className="h-4 w-4" />
                                Dizi
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Results */}
                <div className="mt-8">
                    {!debouncedQuery ? (
                        <div className="rounded-card border border-border bg-surface-1 p-8 text-center">
                            <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-muted-foreground">
                                Film veya dizi aramaya başla
                            </p>
                        </div>
                    ) : isLoading ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="aspect-[2/3] animate-pulse rounded-poster bg-surface-1"
                                />
                            ))}
                        </div>
                    ) : !data?.results?.length ? (
                        <div className="rounded-card border border-border bg-surface-1 p-8 text-center">
                            <p className="text-muted-foreground">
                                &quot;{debouncedQuery}&quot; için sonuç bulunamadı
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Farklı bir arama terimi deneyin
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="mb-4 text-sm text-muted-foreground">
                                {data.total_results} sonuç bulundu
                            </p>
                            <AnimatePresence mode="popLayout">
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                    {data.results.map((item, i) => {
                                        const mediaType = item.media_type || type;
                                        if (mediaType !== "movie" && mediaType !== "tv") return null;

                                        const title = item.title || item.name || "";
                                        const releaseDate = item.release_date || item.first_air_date;
                                        const year = releaseDate ? new Date(releaseDate).getFullYear() : null;

                                        return (
                                            <motion.div
                                                key={`${item.id}-${mediaType}`}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ delay: i * 0.05 }}
                                            >
                                                <Link href={`/media/${mediaType}/${item.id}`}>
                                                    <motion.div
                                                        whileHover={{ scale: 1.05 }}
                                                        className="group relative aspect-[2/3] overflow-hidden rounded-poster bg-surface-1"
                                                    >
                                                        {item.poster_path ? (
                                                            <Image
                                                                src={getPosterUrl(item.poster_path, "medium") || ""}
                                                                alt={title}
                                                                fill
                                                                className="object-cover transition-transform group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                                                                {mediaType === "movie" ? (
                                                                    <Film className="h-8 w-8 text-muted-foreground/50" />
                                                                ) : (
                                                                    <Tv className="h-8 w-8 text-muted-foreground/50" />
                                                                )}
                                                                <span className="mt-2 text-xs text-muted-foreground">
                                                                    {title}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Overlay */}
                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                                                            <h3 className="line-clamp-2 text-sm font-semibold text-white">
                                                                {title}
                                                            </h3>
                                                            <div className="mt-1 flex items-center gap-2">
                                                                {year && (
                                                                    <span className="text-xs text-white/70">{year}</span>
                                                                )}
                                                                {item.vote_average > 0 && (
                                                                    <div className="flex items-center gap-1 text-xs text-white/70">
                                                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                                        {item.vote_average.toFixed(1)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Media type badge */}
                                                        {type === "multi" && (
                                                            <Badge
                                                                variant={mediaType === "movie" ? "neon" : "turquoise"}
                                                                className="absolute right-2 top-2 text-[10px]"
                                                            >
                                                                {mediaType === "movie" ? "Film" : "Dizi"}
                                                            </Badge>
                                                        )}
                                                    </motion.div>
                                                </Link>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </AnimatePresence>

                            {/* Pagination hint */}
                            {data.total_pages > 1 && (
                                <div className="mt-8 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        Sayfa 1 / {data.total_pages}
                                    </p>
                                    <Button variant="outline" className="mt-2" disabled>
                                        Daha fazla yükle (yakında)
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="container flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-neon" />
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}

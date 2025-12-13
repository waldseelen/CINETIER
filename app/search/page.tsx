"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Film, Loader2, Search, Sparkles, Star, Tv } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface UnifiedSearchResult {
    id: number;
    title: string;
    posterUrl: string | null;
    releaseDate: string | null;
    voteAverage: number | null;
    overview: string | null;
    mediaType: "movie" | "tv" | "anime";
    source: "tmdb" | "jikan";
    episodes?: number | null;
    status?: string;
}

interface UnifiedSearchResponse {
    success: boolean;
    query: string;
    data: UnifiedSearchResult[];
    pagination: {
        page: number;
        totalPages: number;
        hasMore: boolean;
    };
}

// Unified search hook that searches both TMDB and Jikan
function useUnifiedSearch(query: string, types: string[]) {
    return useQuery<UnifiedSearchResponse>({
        queryKey: ["unified-search", query, types.join(",")],
        queryFn: async () => {
            // Normalize: lowercase, trim
            const normalizedQuery = query.toLowerCase().trim();
            if (normalizedQuery.length < 2) {
                return { success: true, query: normalizedQuery, data: [], pagination: { page: 1, totalPages: 0, hasMore: false } };
            }

            const res = await fetch(
                `/api/search/unified?q=${encodeURIComponent(normalizedQuery)}&types=${types.join(",")}`
            );
            if (!res.ok) throw new Error("Search failed");
            return res.json();
        },
        enabled: query.length >= 2,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

function SearchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = searchParams.get("q") || "";
    const initialTypes = searchParams.get("types")?.split(",") || ["movie", "tv", "anime"];

    const [query, setQuery] = useState(initialQuery);
    const [selectedTypes, setSelectedTypes] = useState<string[]>(initialTypes);
    const debouncedQuery = useDebounce(query, 400); // 400ms debounce

    const { data, isLoading, isFetching } = useUnifiedSearch(debouncedQuery, selectedTypes);

    // Update URL when search changes
    useEffect(() => {
        if (debouncedQuery) {
            router.replace(
                `/search?q=${encodeURIComponent(debouncedQuery)}&types=${selectedTypes.join(",")}`,
                { scroll: false }
            );
        }
    }, [debouncedQuery, selectedTypes, router]);

    const handleTypeToggle = (value: string[]) => {
        if (value.length > 0) {
            setSelectedTypes(value);
        }
    };

    const getMediaLink = (item: UnifiedSearchResult) => {
        if (item.mediaType === "anime") {
            return `/anime/${item.id}`;
        }
        return `/media/${item.mediaType}/${item.id}`;
    };

    const getMediaIcon = (type: string) => {
        switch (type) {
            case "movie":
                return <Film className="h-4 w-4" />;
            case "tv":
                return <Tv className="h-4 w-4" />;
            case "anime":
                return <Sparkles className="h-4 w-4" />;
            default:
                return null;
        }
    };

    const getMediaBadgeVariant = (type: string) => {
        switch (type) {
            case "movie":
                return "neon";
            case "tv":
                return "turquoise";
            case "anime":
                return "secondary";
            default:
                return "outline";
        }
    };

    return (
        <div className="container py-8 pb-20 md:pb-8">
            <div className="mx-auto max-w-4xl">
                {/* Search header */}
                <div className="text-center">
                    <h1 className="font-display text-3xl font-bold">Ara</h1>
                    <p className="mt-2 text-muted-foreground">
                        Film, dizi veya anime ara
                    </p>
                </div>

                {/* Search input */}
                <div className="mt-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Film, dizi veya anime ara..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="h-14 pl-12 pr-4 text-lg"
                            autoFocus
                        />
                        {(isLoading || isFetching) && (
                            <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-neon" />
                        )}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground text-center">
                        💡 İpucu: Büyük/küçük harf fark etmez, doğal isimlerle arama yapabilirsin
                    </p>
                </div>

                {/* Type filter - Toggle buttons */}
                <div className="mt-6 flex justify-center">
                    <ToggleGroup
                        type="multiple"
                        value={selectedTypes}
                        onValueChange={handleTypeToggle}
                        className="gap-2"
                    >
                        <ToggleGroupItem value="movie" className="gap-2 px-4">
                            <Film className="h-4 w-4" />
                            Film
                        </ToggleGroupItem>
                        <ToggleGroupItem value="tv" className="gap-2 px-4">
                            <Tv className="h-4 w-4" />
                            Dizi
                        </ToggleGroupItem>
                        <ToggleGroupItem value="anime" className="gap-2 px-4">
                            <Sparkles className="h-4 w-4" />
                            Anime
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                {/* Results */}
                <div className="mt-8">
                    {!debouncedQuery || debouncedQuery.length < 2 ? (
                        <div className="rounded-card border border-border bg-surface-1 p-8 text-center">
                            <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-muted-foreground">
                                Film, dizi veya anime aramaya başla
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                En az 2 karakter girmelisin
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
                    ) : !data?.data?.length ? (
                        <div className="rounded-card border border-border bg-surface-1 p-8 text-center">
                            <p className="text-muted-foreground">
                                &quot;{debouncedQuery}&quot; için sonuç bulunamadı
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Farklı bir arama terimi veya filtre deneyin
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="mb-4 text-sm text-muted-foreground">
                                {data.data.length} sonuç bulundu
                            </p>
                            <AnimatePresence mode="popLayout">
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                    {data.data.map((item, i) => {
                                        const year = item.releaseDate
                                            ? item.releaseDate.substring(0, 4)
                                            : null;

                                        // For anime (Jikan), posterUrl is already full URL from MyAnimeList
                                        // For TMDB, posterUrl is already full URL from TMDB API
                                        const posterUrl = item.posterUrl;

                                        return (
                                            <motion.div
                                                key={`${item.source}-${item.id}-${item.mediaType}`}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ delay: i * 0.03 }}
                                            >
                                                <Link href={getMediaLink(item)}>
                                                    <motion.div
                                                        whileHover={{ scale: 1.05 }}
                                                        className="group relative aspect-[2/3] overflow-hidden rounded-poster bg-surface-1"
                                                    >
                                                        {posterUrl ? (
                                                            <Image
                                                                src={posterUrl}
                                                                alt={item.title}
                                                                fill
                                                                className="object-cover transition-transform group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                                                                {getMediaIcon(item.mediaType)}
                                                                <span className="mt-2 text-xs text-muted-foreground">
                                                                    {item.title}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Overlay */}
                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                                                            <h3 className="line-clamp-2 text-sm font-semibold text-white">
                                                                {item.title}
                                                            </h3>
                                                            <div className="mt-1 flex items-center gap-2">
                                                                {year && (
                                                                    <span className="text-xs text-white/70">
                                                                        {year}
                                                                    </span>
                                                                )}
                                                                {item.voteAverage && item.voteAverage > 0 && (
                                                                    <div className="flex items-center gap-1 text-xs text-white/70">
                                                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                                        {item.voteAverage.toFixed(1)}
                                                                    </div>
                                                                )}
                                                                {item.mediaType === "anime" && item.episodes && (
                                                                    <span className="text-xs text-white/70">
                                                                        {item.episodes} bölüm
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Media type badge */}
                                                        <Badge
                                                            variant={getMediaBadgeVariant(item.mediaType) as any}
                                                            className={cn(
                                                                "absolute right-2 top-2 text-[10px]",
                                                                item.mediaType === "anime" && "bg-pink-500/80 text-white"
                                                            )}
                                                        >
                                                            {item.mediaType === "movie"
                                                                ? "Film"
                                                                : item.mediaType === "tv"
                                                                    ? "Dizi"
                                                                    : "Anime"}
                                                        </Badge>

                                                        {/* Source indicator */}
                                                        {item.source === "jikan" && (
                                                            <div className="absolute left-2 top-2">
                                                                <div className="rounded-full bg-blue-500/80 px-1.5 py-0.5 text-[9px] font-medium text-white">
                                                                    MAL
                                                                </div>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                </Link>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </AnimatePresence>

                            {/* Pagination hint */}
                            {data.pagination.hasMore && (
                                <div className="mt-8 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        Sayfa 1 / {data.pagination.totalPages}
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

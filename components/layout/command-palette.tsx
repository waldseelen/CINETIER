"use client";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { useDebounce } from "@/lib/hooks/use-debounce";
import {
    Activity,
    Compass,
    Film,
    Home,
    Plus,
    Search,
    Settings,
    Swords,
    Tv,
    User
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";

interface SearchResult {
    id: number;
    title?: string;
    name?: string;
    media_type: "movie" | "tv" | "person";
    poster_path?: string;
    profile_path?: string;
    release_date?: string;
    first_air_date?: string;
}

export function CommandPalette() {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [loading, setLoading] = React.useState(false);
    const router = useRouter();
    const debouncedQuery = useDebounce(query, 300);

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    React.useEffect(() => {
        if (!debouncedQuery || debouncedQuery.length < 2) {
            setResults([]);
            return;
        }

        const search = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/tmdb/search?query=${encodeURIComponent(debouncedQuery)}&type=multi`
                );
                if (res.ok) {
                    const data = await res.json();
                    setResults(data.results?.slice(0, 8) || []);
                }
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        };

        search();
    }, [debouncedQuery]);

    const navigate = (path: string) => {
        setOpen(false);
        setQuery("");
        router.push(path);
    };

    const getImageUrl = (result: SearchResult) => {
        if (result.media_type === "person" && result.profile_path) {
            return `https://image.tmdb.org/t/p/w92${result.profile_path}`;
        }
        if (result.poster_path) {
            return `https://image.tmdb.org/t/p/w92${result.poster_path}`;
        }
        return null;
    };

    const getYear = (result: SearchResult) => {
        const date = result.release_date || result.first_air_date;
        return date ? new Date(date).getFullYear() : null;
    };

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder="Film, dizi veya kişi ara..."
                value={query}
                onValueChange={setQuery}
            />
            <CommandList>
                {loading && (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                        Aranıyor...
                    </div>
                )}

                {!loading && query.length >= 2 && results.length === 0 && (
                    <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
                )}

                {/* Quick Actions */}
                {!query && (
                    <>
                        <CommandGroup heading="Hızlı Erişim">
                            <CommandItem onSelect={() => navigate("/")}>
                                <Home className="mr-2 h-4 w-4" />
                                Ana Sayfa
                            </CommandItem>
                            <CommandItem onSelect={() => navigate("/explore")}>
                                <Compass className="mr-2 h-4 w-4" />
                                Keşfet
                            </CommandItem>
                            <CommandItem onSelect={() => navigate("/feed")}>
                                <Activity className="mr-2 h-4 w-4" />
                                Feed
                            </CommandItem>
                            <CommandItem onSelect={() => navigate("/vs")}>
                                <Swords className="mr-2 h-4 w-4" />
                                VS Modu
                            </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading="Oluştur">
                            <CommandItem onSelect={() => navigate("/create")}>
                                <Plus className="mr-2 h-4 w-4" />
                                Yeni Tier List
                            </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading="Ayarlar">
                            <CommandItem onSelect={() => navigate("/settings")}>
                                <Settings className="mr-2 h-4 w-4" />
                                Ayarlar
                            </CommandItem>
                        </CommandGroup>
                    </>
                )}

                {/* Search Results */}
                {results.length > 0 && (
                    <>
                        {/* Movies */}
                        {results.filter((r) => r.media_type === "movie").length > 0 && (
                            <CommandGroup heading="Filmler">
                                {results
                                    .filter((r) => r.media_type === "movie")
                                    .map((result) => (
                                        <CommandItem
                                            key={`movie-${result.id}`}
                                            onSelect={() => navigate(`/media/movie/${result.id}`)}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="relative h-12 w-8 overflow-hidden rounded bg-surface-2">
                                                {getImageUrl(result) ? (
                                                    <Image
                                                        src={getImageUrl(result)!}
                                                        alt={result.title || ""}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center">
                                                        <Film className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{result.title}</p>
                                                {getYear(result) && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {getYear(result)}
                                                    </p>
                                                )}
                                            </div>
                                            <Film className="h-4 w-4 text-muted-foreground" />
                                        </CommandItem>
                                    ))}
                            </CommandGroup>
                        )}

                        {/* TV Shows */}
                        {results.filter((r) => r.media_type === "tv").length > 0 && (
                            <CommandGroup heading="Diziler">
                                {results
                                    .filter((r) => r.media_type === "tv")
                                    .map((result) => (
                                        <CommandItem
                                            key={`tv-${result.id}`}
                                            onSelect={() => navigate(`/media/tv/${result.id}`)}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="relative h-12 w-8 overflow-hidden rounded bg-surface-2">
                                                {getImageUrl(result) ? (
                                                    <Image
                                                        src={getImageUrl(result)!}
                                                        alt={result.name || ""}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center">
                                                        <Tv className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{result.name}</p>
                                                {getYear(result) && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {getYear(result)}
                                                    </p>
                                                )}
                                            </div>
                                            <Tv className="h-4 w-4 text-muted-foreground" />
                                        </CommandItem>
                                    ))}
                            </CommandGroup>
                        )}

                        {/* Persons */}
                        {results.filter((r) => r.media_type === "person").length > 0 && (
                            <CommandGroup heading="Kişiler">
                                {results
                                    .filter((r) => r.media_type === "person")
                                    .map((result) => (
                                        <CommandItem
                                            key={`person-${result.id}`}
                                            onSelect={() => navigate(`/person/${result.id}`)}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="relative h-10 w-10 overflow-hidden rounded-full bg-surface-2">
                                                {getImageUrl(result) ? (
                                                    <Image
                                                        src={getImageUrl(result)!}
                                                        alt={result.name || ""}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{result.name}</p>
                                            </div>
                                            <User className="h-4 w-4 text-muted-foreground" />
                                        </CommandItem>
                                    ))}
                            </CommandGroup>
                        )}

                        <CommandSeparator />
                        <CommandGroup>
                            <CommandItem
                                onSelect={() => navigate(`/search?q=${encodeURIComponent(query)}`)}
                            >
                                <Search className="mr-2 h-4 w-4" />
                                &quot;{query}&quot; için tüm sonuçları gör
                            </CommandItem>
                        </CommandGroup>
                    </>
                )}
            </CommandList>
        </CommandDialog>
    );
}

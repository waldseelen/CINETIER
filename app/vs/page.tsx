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
import { AnimatePresence, motion } from "framer-motion";
import {
    Calendar,
    Filter,
    Globe,
    Info,
    ListOrdered,
    Loader2,
    SkipForward,
    Sparkles,
    Swords,
    Trophy,
    User,
    X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

interface Media {
    id: string;
    tmdb_id: number;
    media_type: "movie" | "tv" | "anime";
    title: string;
    poster_path: string | null;
    elo: number;
}

interface Matchup {
    left: Media;
    right: Media;
}

interface TierListInfo {
    id: string;
    title: string;
    slug: string;
}

// Genre options for filtering
const GENRE_OPTIONS = [
    { value: "all", label: "Tüm Türler" },
    { value: "28", label: "Aksiyon" },
    { value: "35", label: "Komedi" },
    { value: "18", label: "Drama" },
    { value: "27", label: "Korku" },
    { value: "878", label: "Bilim Kurgu" },
    { value: "10749", label: "Romantik" },
    { value: "53", label: "Gerilim" },
    { value: "16", label: "Animasyon" },
    { value: "99", label: "Belgesel" },
    { value: "14", label: "Fantastik" },
];

// Year options
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
    { value: "all", label: "Tüm Yıllar" },
    { value: `${currentYear}`, label: `${currentYear}` },
    { value: `${currentYear - 1}`, label: `${currentYear - 1}` },
    { value: `${currentYear - 2}`, label: `${currentYear - 2}` },
    { value: "2020s", label: "2020'ler" },
    { value: "2010s", label: "2010'lar" },
    { value: "2000s", label: "2000'ler" },
    { value: "1990s", label: "1990'lar" },
    { value: "classic", label: "Klasikler (1990 öncesi)" },
];

// Media type options
const MEDIA_TYPE_OPTIONS = [
    { value: "movie", label: "Filmler" },
    { value: "tv", label: "Diziler" },
    { value: "anime", label: "Animeler" },
    { value: "all", label: "Hepsi" },
];

interface VSFilters {
    mediaType: string;
    genre: string;
    year: string;
}

function VSContent() {
    const searchParams = useSearchParams();
    const listSlug = searchParams.get("list");

    const [scope, setScope] = useState<"global" | "user">("global");
    const [matchup, setMatchup] = useState<Matchup | null>(null);
    const [loading, setLoading] = useState(true);
    const [selecting, setSelecting] = useState<"left" | "right" | null>(null);
    const [stats, setStats] = useState({ totalMatches: 0, highestElo: "-", todayMatches: 0 });
    const [error, setError] = useState<string | null>(null);
    const [tierListInfo, setTierListInfo] = useState<TierListInfo | null>(null);

    // Filter state
    const [filters, setFilters] = useState<VSFilters>({
        mediaType: "movie",
        genre: "all",
        year: "all",
    });
    const [showFilters, setShowFilters] = useState(false);

    const activeFilterCount = [
        filters.mediaType !== "all" && filters.mediaType !== "movie",
        filters.genre !== "all",
        filters.year !== "all",
    ].filter(Boolean).length;

    const fetchMatchup = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                scope,
                mediaType: filters.mediaType === "all" ? "movie" : filters.mediaType,
            });

            if (listSlug) params.set("list", listSlug);
            if (filters.genre) params.set("genre", filters.genre);
            if (filters.year) params.set("year", filters.year);

            const url = `/api/vs?${params}`;
            const res = await fetch(url);
            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Eşleşme yüklenemedi");
                setMatchup(null);
            } else {
                setMatchup(data.matchup);
                if (data.tierList) {
                    setTierListInfo(data.tierList);
                }
            }
        } catch {
            setError("Bir hata oluştu");
        } finally {
            setLoading(false);
        }
    }, [scope, listSlug, filters]);

    useEffect(() => {
        fetchMatchup();
    }, [fetchMatchup]);

    const handleSelect = async (winner: "left" | "right") => {
        if (!matchup || selecting) return;

        setSelecting(winner);
        const winnerId = winner === "left" ? matchup.left.id : matchup.right.id;
        const loserId = winner === "left" ? matchup.right.id : matchup.left.id;

        try {
            const res = await fetch("/api/vs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ winnerId, loserId, scope }),
            });

            if (res.ok) {
                setStats(prev => ({
                    ...prev,
                    totalMatches: prev.totalMatches + 1,
                    todayMatches: prev.todayMatches + 1,
                }));
            }
        } catch {
            // Silent fail, still load next matchup
        }

        // Short delay for visual feedback
        setTimeout(() => {
            setSelecting(null);
            fetchMatchup();
        }, 500);
    };

    const handleSkip = () => {
        if (!selecting) {
            fetchMatchup();
        }
    };

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (loading || selecting) return;

            if (e.key === "ArrowLeft") {
                handleSelect("left");
            } else if (e.key === "ArrowRight") {
                handleSelect("right");
            } else if (e.key === " ") {
                e.preventDefault();
                handleSkip();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [loading, selecting, matchup]);

    return (
        <div className="container py-8 pb-20 md:pb-8">
            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <div className="text-center">
                    <h1 className="font-display text-4xl font-bold">
                        <span className="text-gradient-neon">VS</span> Arena
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        İki içerik arasında seç, zevkinin gerçek sıralamasını bul
                    </p>
                </div>

                {/* Filters Section */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    {/* Media Type Select */}
                    <Select
                        value={filters.mediaType}
                        onValueChange={(v) => setFilters({ ...filters, mediaType: v })}
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {MEDIA_TYPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Genre Filter */}
                    <Select
                        value={filters.genre}
                        onValueChange={(v) => setFilters({ ...filters, genre: v })}
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="Tür" />
                        </SelectTrigger>
                        <SelectContent>
                            {GENRE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Year Filter */}
                    <Select
                        value={filters.year}
                        onValueChange={(v) => setFilters({ ...filters, year: v })}
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="Yıl" />
                        </SelectTrigger>
                        <SelectContent>
                            {YEAR_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Clear Filters */}
                    {activeFilterCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                setFilters({ mediaType: "movie", genre: "all", year: "all" })
                            }
                        >
                            <X className="h-4 w-4 mr-1" />
                            Temizle
                        </Button>
                    )}
                </div>

                {/* Active Filter Badges */}
                {activeFilterCount > 0 && (
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {filters.mediaType === "anime" && (
                            <Badge variant="secondary" className="bg-pink-500/20 text-pink-500">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Sadece Animeler
                            </Badge>
                        )}
                        {filters.genre && (
                            <Badge variant="secondary">
                                <Filter className="h-3 w-3 mr-1" />
                                {GENRE_OPTIONS.find((g) => g.value === filters.genre)?.label}
                            </Badge>
                        )}
                        {filters.year && (
                            <Badge variant="secondary">
                                <Calendar className="h-3 w-3 mr-1" />
                                {YEAR_OPTIONS.find((y) => y.value === filters.year)?.label}
                            </Badge>
                        )}
                    </div>
                )}

                {/* List-based mode banner */}
                {tierListInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 flex items-center justify-between rounded-lg border border-turquoise/30 bg-turquoise/10 px-4 py-3"
                    >
                        <div className="flex items-center gap-3">
                            <ListOrdered className="h-5 w-5 text-turquoise" />
                            <div>
                                <p className="text-sm font-medium">Liste Modu</p>
                                <p className="text-xs text-muted-foreground">
                                    &quot;{tierListInfo.title}&quot; listesindeki filmler
                                </p>
                            </div>
                        </div>
                        <Link href="/vs">
                            <Button variant="ghost" size="sm">
                                <X className="h-4 w-4" />
                            </Button>
                        </Link>
                    </motion.div>
                )}

                {/* Scope toggle */}
                <div className="mt-8 flex justify-center">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-1 p-1">
                        <button
                            onClick={() => setScope("global")}
                            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${scope === "global"
                                ? "bg-neon text-cinetier-bg-0"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Globe className="h-4 w-4" />
                            Global Sıralama
                        </button>
                        <button
                            onClick={() => setScope("user")}
                            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${scope === "user"
                                ? "bg-turquoise text-cinetier-bg-0"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <User className="h-4 w-4" />
                            Senin Sıralaman
                        </button>
                    </div>
                </div>

                {/* VS Arena */}
                <div className="mt-12">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-neon" />
                        </div>
                    ) : error ? (
                        <div className="rounded-card border border-border bg-surface-1 p-8 text-center">
                            <p className="text-muted-foreground">{error}</p>
                            <Button onClick={fetchMatchup} className="mt-4">
                                Tekrar Dene
                            </Button>
                        </div>
                    ) : matchup ? (
                        <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
                            {/* Left card */}
                            <VSCard
                                media={matchup.left}
                                onClick={() => handleSelect("left")}
                                selected={selecting === "left"}
                                disabled={selecting !== null}
                            />

                            {/* VS */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="font-display text-4xl font-bold text-gradient-neon">
                                    VS
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground"
                                    onClick={handleSkip}
                                    disabled={selecting !== null}
                                >
                                    <SkipForward className="mr-1 h-4 w-4" />
                                    Geç
                                </Button>
                            </div>

                            {/* Right card */}
                            <VSCard
                                media={matchup.right}
                                onClick={() => handleSelect("right")}
                                selected={selecting === "right"}
                                disabled={selecting !== null}
                            />
                        </div>
                    ) : null}
                </div>

                {/* Keyboard hints */}
                <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-4 rounded-lg border border-border bg-surface-1 px-4 py-2 text-xs text-muted-foreground">
                        <span>
                            <kbd className="rounded bg-surface-2 px-1.5 py-0.5">←</kbd> Sol seç
                        </span>
                        <span>
                            <kbd className="rounded bg-surface-2 px-1.5 py-0.5">→</kbd> Sağ seç
                        </span>
                        <span>
                            <kbd className="rounded bg-surface-2 px-1.5 py-0.5">Space</kbd> Geç
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-12 grid gap-4 md:grid-cols-3">
                    <StatCard
                        icon={Swords}
                        label="Toplam Maç"
                        value={stats.totalMatches.toString()}
                        color="neon"
                    />
                    <StatCard
                        icon={Trophy}
                        label="En Yüksek Elo"
                        value={stats.highestElo}
                        color="turquoise"
                    />
                    <StatCard
                        icon={Info}
                        label="Bugünkü Maçlar"
                        value={stats.todayMatches.toString()}
                        color="neon"
                    />
                </div>
            </div>
        </div>
    );
}

function VSCard({
    media,
    onClick,
    selected,
    disabled,
}: {
    media: Media;
    onClick: () => void;
    selected: boolean;
    disabled: boolean;
}) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            whileHover={disabled ? {} : { scale: 1.05 }}
            whileTap={disabled ? {} : { scale: 0.95 }}
            animate={selected ? { scale: 1.1, boxShadow: "0 0 40px rgba(57, 255, 20, 0.5)" } : {}}
            className={`group relative h-80 w-52 cursor-pointer overflow-hidden rounded-card bg-surface-1 transition-all md:h-96 md:w-64 ${disabled && !selected ? "opacity-50" : ""
                } ${selected ? "ring-4 ring-neon" : "hover:shadow-glow-md"}`}
        >
            {media.poster_path ? (
                <Image
                    src={getPosterUrl(media.poster_path, "large") || ""}
                    alt={media.title}
                    fill
                    className="object-cover"
                />
            ) : (
                <div className="flex h-full items-center justify-center p-4 text-center">
                    <span className="text-muted-foreground">{media.title}</span>
                </div>
            )}

            {/* Overlay with title */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
                <h3 className="font-semibold text-white">{media.title}</h3>
                <p className="mt-1 text-xs text-white/70">Elo: {media.elo}</p>
            </div>

            {/* Selection overlay */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-neon/20"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="rounded-full bg-neon p-4"
                        >
                            <Trophy className="h-8 w-8 text-cinetier-bg-0" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    color: "neon" | "turquoise";
}) {
    return (
        <div className="rounded-card border border-border bg-surface-1 p-4">
            <div className="flex items-center gap-3">
                <div
                    className={`rounded-lg p-2 ${color === "neon"
                        ? "bg-neon/10 text-neon"
                        : "bg-turquoise/10 text-turquoise"
                        }`}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="font-display text-xl font-bold">{value}</p>
                </div>
            </div>
        </div>
    );
}

export default function VSPage() {
    return (
        <Suspense fallback={
            <div className="container flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-neon" />
            </div>
        }>
            <VSContent />
        </Suspense>
    );
}

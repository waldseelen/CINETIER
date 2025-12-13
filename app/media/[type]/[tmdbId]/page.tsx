"use client";

import { RatingBadges, RatingBadgesSkeleton } from "@/components/media/rating-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    useCreateReview,
    useExternalRatings,
    useReviews,
    useTMDBMedia,
    useToggleWatched,
    useToggleWatchlist,
    useUpdateRating,
    useUser,
    useUserMedia
} from "@/lib/hooks/use-queries";
import { getBackdropUrl, getPosterUrl } from "@/lib/tmdb/client";
import { motion } from "framer-motion";
import {
    Bookmark,
    BookmarkCheck,
    Calendar,
    Clock,
    Eye,
    EyeOff,
    Layers,
    Loader2,
    MessageSquare,
    Send,
    Star,
    Users,
} from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function MediaPage() {
    const params = useParams();
    const type = params.type as "movie" | "tv";
    const tmdbId = parseInt(params.tmdbId as string);

    const { data: user } = useUser();
    const { data: tmdbData, isLoading: tmdbLoading } = useTMDBMedia(tmdbId, type);
    const { data: userMedia } = useUserMedia(tmdbData?.db_id);
    const { data: reviews } = useReviews(tmdbData?.db_id);
    const { data: externalRatings, isLoading: ratingsLoading } = useExternalRatings(
        tmdbData?.db_id || null,
        tmdbData?.imdb_id || null
    );

    const toggleWatched = useToggleWatched();
    const toggleWatchlist = useToggleWatchlist();
    const updateRating = useUpdateRating();
    const createReview = useCreateReview();

    const [selectedRating, setSelectedRating] = useState<number | null>(null);
    const [reviewText, setReviewText] = useState("");
    const [containsSpoiler, setContainsSpoiler] = useState(false);

    const isMovie = type === "movie";
    const title = isMovie ? tmdbData?.title : tmdbData?.name;
    const originalTitle = isMovie ? tmdbData?.original_title : tmdbData?.original_name;
    const releaseDate = isMovie ? tmdbData?.release_date : tmdbData?.first_air_date;
    const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : null;
    const runtime = isMovie ? tmdbData?.runtime : tmdbData?.episode_run_time?.[0];

    const isWatched = userMedia?.watched ?? false;
    const isWatchlisted = userMedia?.watchlist ?? false;
    const userRating = userMedia?.rating ?? selectedRating;

    const handleToggleWatched = async () => {
        if (!tmdbData?.db_id || !user) return;
        toggleWatched.mutate({ mediaId: tmdbData.db_id, watched: !isWatched });
    };

    const handleToggleWatchlist = async () => {
        if (!tmdbData?.db_id || !user) return;
        toggleWatchlist.mutate({ mediaId: tmdbData.db_id, watchlist: !isWatchlisted });
    };

    const handleRating = async (rating: number) => {
        if (!tmdbData?.db_id || !user) return;
        setSelectedRating(rating);
        updateRating.mutate({ mediaId: tmdbData.db_id, rating });
    };

    const handleSubmitReview = async () => {
        if (!tmdbData?.db_id || !user || !reviewText.trim()) return;
        await createReview.mutateAsync({
            mediaId: tmdbData.db_id,
            content: reviewText,
            containsSpoiler,
        });
        setReviewText("");
        setContainsSpoiler(false);
    };

    if (tmdbLoading) {
        return <MediaPageSkeleton />;
    }

    if (!tmdbData) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-2xl font-bold text-foreground">İçerik bulunamadı</h1>
                <p className="mt-2 text-muted-foreground">
                    Bu {isMovie ? "film" : "dizi"} bulunamadı veya kaldırılmış olabilir.
                </p>
            </div>
        );
    }

    return (
        <div className="pb-20 md:pb-8">
            <div className="relative h-64 w-full md:h-80">
                {tmdbData.backdrop_path ? (
                    <Image
                        src={getBackdropUrl(tmdbData.backdrop_path, "large") || ""}
                        alt={title || ""}
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-b from-surface-1 to-background" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            </div>

            <div className="container -mt-32 relative">
                <div className="flex flex-col gap-8 md:flex-row">
                    <div className="shrink-0">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mx-auto w-48 md:mx-0 md:w-64"
                        >
                            <div className="aspect-[2/3] rounded-poster bg-surface-1 shadow-glow-sm overflow-hidden">
                                {tmdbData.poster_path ? (
                                    <Image
                                        src={getPosterUrl(tmdbData.poster_path, "large") || ""}
                                        alt={title || ""}
                                        width={256}
                                        height={384}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                        Poster yok
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <div className="mt-4 flex flex-col gap-2">
                            <Button
                                variant={isWatched ? "neon" : "outline"}
                                className="w-full gap-2"
                                onClick={handleToggleWatched}
                                disabled={toggleWatched.isPending || !user}
                            >
                                {toggleWatched.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : isWatched ? (
                                    <Eye className="h-4 w-4" />
                                ) : (
                                    <EyeOff className="h-4 w-4" />
                                )}
                                {isWatched ? "İzledim" : "İzledim olarak işaretle"}
                            </Button>
                            <Button
                                variant={isWatchlisted ? "turquoise" : "outline"}
                                className="w-full gap-2"
                                onClick={handleToggleWatchlist}
                                disabled={toggleWatchlist.isPending || !user}
                            >
                                {toggleWatchlist.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : isWatchlisted ? (
                                    <BookmarkCheck className="h-4 w-4" />
                                ) : (
                                    <Bookmark className="h-4 w-4" />
                                )}
                                {isWatchlisted ? "Listede" : "İzleneceklere Ekle"}
                            </Button>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex-1"
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={isMovie ? "neon" : "turquoise"}>
                                {isMovie ? "Film" : "Dizi"}
                            </Badge>
                            {releaseYear && <Badge variant="outline">{releaseYear}</Badge>}
                            {tmdbData.adult && <Badge variant="destructive">18+</Badge>}
                        </div>

                        <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">
                            {title}
                        </h1>
                        {originalTitle && originalTitle !== title && (
                            <p className="mt-1 text-muted-foreground">{originalTitle}</p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-neon text-neon" />
                                <span className="font-medium">
                                    {tmdbData.vote_average?.toFixed(1)}
                                </span>
                                <span className="text-muted-foreground">/10</span>
                            </div>
                            {releaseDate && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>{releaseDate}</span>
                                </div>
                            )}
                            {runtime && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                        {Math.floor(runtime / 60)}s {runtime % 60}dk
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{tmdbData.vote_count?.toLocaleString()} oy</span>
                            </div>
                        </div>

                        {/* External Ratings (IMDb, RT, Metascore) */}
                        <div className="mt-4">
                            {ratingsLoading ? (
                                <RatingBadgesSkeleton />
                            ) : externalRatings && (
                                <RatingBadges
                                    imdbRating={externalRatings.imdbRating}
                                    rtRating={externalRatings.rtRating}
                                    metascore={externalRatings.metascore}
                                />
                            )}
                        </div>

                        {user && (
                            <div className="mt-6 rounded-lg border border-border bg-surface-1 p-4">
                                <p className="text-sm font-medium">
                                    Puanla {userRating && `• Puanın: ${userRating}/10`}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    {Array.from({ length: 10 }).map((_, i) => {
                                        const rating = i + 1;
                                        const isSelected = userRating && rating <= userRating;
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handleRating(rating)}
                                                disabled={updateRating.isPending}
                                                className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-all ${isSelected
                                                    ? "border-neon bg-neon/20 text-neon"
                                                    : "border-border bg-surface-2 hover:border-neon hover:text-neon"
                                                    }`}
                                            >
                                                {rating}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {tmdbData.overview && (
                            <p className="mt-6 text-muted-foreground leading-relaxed">
                                {tmdbData.overview}
                            </p>
                        )}

                        {tmdbData.genres && tmdbData.genres.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {tmdbData.genres.map((genre: { id: number; name: string }) => (
                                    <Badge key={genre.id} variant="secondary">
                                        {genre.name}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

                <Tabs defaultValue="reviews" className="mt-8">
                    <TabsList>
                        <TabsTrigger value="reviews" className="gap-2">
                            <MessageSquare className="h-4 w-4" />
                            İncelemeler ({reviews?.length || 0})
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

                    <TabsContent value="reviews" className="mt-6">
                        {user && (
                            <div className="mb-6 rounded-lg border border-border bg-surface-1 p-4">
                                <h3 className="font-medium mb-3">İnceleme Yaz</h3>
                                <textarea
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    placeholder="Bu içerik hakkındaki düşüncelerini paylaş..."
                                    className="w-full min-h-[100px] p-3 rounded-md bg-surface-2 border border-border text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <div className="mt-3 flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={containsSpoiler}
                                            onChange={(e) => setContainsSpoiler(e.target.checked)}
                                            className="rounded"
                                        />
                                        Spoiler içeriyor
                                    </label>
                                    <Button
                                        onClick={handleSubmitReview}
                                        disabled={createReview.isPending || !reviewText.trim()}
                                        className="gap-2"
                                    >
                                        {createReview.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                        Paylaş
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {reviews?.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>Henüz inceleme yok</p>
                                    <p className="text-sm">İlk inceleyen sen ol!</p>
                                </div>
                            )}
                            {reviews?.map((review: any) => (
                                <motion.div
                                    key={review.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-card border border-border bg-surface-1 p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 rounded-full bg-surface-2 flex items-center justify-center">
                                            <span className="text-sm font-medium">
                                                {review.profiles?.display_name?.[0]?.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    {review.profiles?.display_name}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    @{review.profiles?.username}
                                                </span>
                                                {review.contains_spoiler && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        Spoiler
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="mt-2 text-muted-foreground">
                                                {review.content}
                                            </p>
                                            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>{new Date(review.created_at).toLocaleDateString("tr-TR")}</span>
                                                <button className="flex items-center gap-1 hover:text-neon transition-colors">
                                                    <Star className="h-4 w-4" />
                                                    {review.like_count}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
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
                            <p>Bu içerik henüz hiçbir tier listede yok</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function MediaPageSkeleton() {
    return (
        <div className="pb-20 md:pb-8">
            <div className="relative h-64 w-full bg-surface-1 md:h-80" />
            <div className="container -mt-32 relative">
                <div className="flex flex-col gap-8 md:flex-row">
                    <div className="shrink-0">
                        <div className="mx-auto w-48 md:mx-0 md:w-64">
                            <Skeleton className="aspect-[2/3] rounded-poster" />
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
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

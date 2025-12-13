"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    useFollowStats,
    useIsFollowing,
    useProfileByUsername,
    useTierLists,
    useToggleFollow,
    useUser
} from "@/lib/hooks/use-queries";
import { createClient } from "@/lib/supabase/client";
import { getPosterUrl } from "@/lib/tmdb";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { motion } from "framer-motion";
import {
    Calendar,
    Eye,
    Layers,
    List,
    Loader2,
    MessageSquare,
    Star,
    UserCheck,
    UserPlus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";

interface ProfilePageProps {
    params: Promise<{
        username: string;
    }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
    const resolvedParams = use(params);
    const { username } = resolvedParams;

    const { data: currentUser } = useUser();
    const { data: profile, isLoading: profileLoading } = useProfileByUsername(username);
    const { data: followStats } = useFollowStats(profile?.id || "");
    const { data: isFollowing, isLoading: followLoading } = useIsFollowing(profile?.id || "");
    const toggleFollow = useToggleFollow();
    const { data: tierLists } = useTierLists(profile?.id);

    const [watched, setWatched] = useState<any[]>([]);
    const [watchlist, setWatchlist] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const isOwnProfile = currentUser?.id === profile?.id;

    useEffect(() => {
        if (!profile?.id) return;

        const fetchUserData = async () => {
            const supabase = createClient();

            const [watchedRes, watchlistRes, reviewsRes] = await Promise.all([
                supabase
                    .from("user_media_entries")
                    .select(`
                        id,
                        rating,
                        media:media_id (
                            id,
                            tmdb_id,
                            media_type,
                            title,
                            poster_path
                        )
                    `)
                    .eq("user_id", profile.id)
                    .eq("watched", true)
                    .order("updated_at", { ascending: false })
                    .limit(21),
                supabase
                    .from("user_media_entries")
                    .select(`
                        id,
                        media:media_id (
                            id,
                            tmdb_id,
                            media_type,
                            title,
                            poster_path
                        )
                    `)
                    .eq("user_id", profile.id)
                    .eq("watchlist", true)
                    .order("updated_at", { ascending: false })
                    .limit(21),
                supabase
                    .from("reviews")
                    .select(`
                        id,
                        content,
                        rating,
                        created_at,
                        media:media_id (
                            id,
                            tmdb_id,
                            media_type,
                            title,
                            poster_path
                        )
                    `)
                    .eq("user_id", profile.id)
                    .order("created_at", { ascending: false })
                    .limit(10),
            ]);

            setWatched(watchedRes.data || []);
            setWatchlist(watchlistRes.data || []);
            setReviews(reviewsRes.data || []);
            setLoading(false);
        };

        fetchUserData();
    }, [profile?.id]);

    const handleFollow = () => {
        if (!profile?.id) return;
        toggleFollow.mutate({ targetUserId: profile.id, follow: !isFollowing });
    };

    if (profileLoading) {
        return (
            <div className="container flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-neon" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="container py-20 text-center">
                <h1 className="font-display text-2xl font-bold">Kullanıcı bulunamadı</h1>
                <p className="mt-2 text-muted-foreground">
                    @{username} adlı kullanıcı mevcut değil.
                </p>
                <Button asChild className="mt-4">
                    <Link href="/">Ana Sayfa</Link>
                </Button>
            </div>
        );
    }

    const joinDate = profile.created_at
        ? format(new Date(profile.created_at), "MMMM yyyy", { locale: tr })
        : "";

    return (
        <div className="container py-8 pb-20 md:pb-8">
            {/* Profile header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-6 md:flex-row md:items-start"
            >
                <Avatar className="h-24 w-24 ring-4 ring-neon/20 md:h-32 md:w-32">
                    {profile.avatar_url && (
                        <AvatarImage src={profile.avatar_url} alt={profile.display_name || username} />
                    )}
                    <AvatarFallback className="text-2xl">
                        {(profile.display_name || username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left">
                    <h1 className="font-display text-2xl font-bold md:text-3xl">
                        {profile.display_name || username}
                    </h1>
                    <p className="mt-1 text-muted-foreground">@{username}</p>

                    {/* Stats */}
                    <div className="mt-4 flex flex-wrap justify-center gap-6 md:justify-start">
                        <div className="text-center">
                            <p className="font-display text-xl font-bold">{watched.length}</p>
                            <p className="text-sm text-muted-foreground">İzlenen</p>
                        </div>
                        <div className="text-center">
                            <p className="font-display text-xl font-bold">{tierLists?.length || 0}</p>
                            <p className="text-sm text-muted-foreground">Liste</p>
                        </div>
                        <div className="text-center">
                            <p className="font-display text-xl font-bold">{followStats?.followers || 0}</p>
                            <p className="text-sm text-muted-foreground">Takipçi</p>
                        </div>
                        <div className="text-center">
                            <p className="font-display text-xl font-bold">{followStats?.following || 0}</p>
                            <p className="text-sm text-muted-foreground">Takip</p>
                        </div>
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                        <p className="mt-4 max-w-md text-sm text-muted-foreground">
                            {profile.bio}
                        </p>
                    )}

                    {/* Join date */}
                    {joinDate && (
                        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground md:justify-start">
                            <Calendar className="h-3 w-3" />
                            <span>{joinDate}&apos;de katıldı</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {!isOwnProfile && currentUser && (
                    <div className="flex gap-2">
                        <Button
                            variant={isFollowing ? "outline" : "neon"}
                            className="gap-2"
                            onClick={handleFollow}
                            disabled={toggleFollow.isPending || followLoading}
                        >
                            {toggleFollow.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isFollowing ? (
                                <>
                                    <UserCheck className="h-4 w-4" />
                                    Takip Ediliyor
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-4 w-4" />
                                    Takip Et
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {isOwnProfile && (
                    <Button variant="outline" asChild>
                        <Link href="/settings">Profili Düzenle</Link>
                    </Button>
                )}
            </motion.div>

            {/* Tabs */}
            <Tabs defaultValue="watched" className="mt-8">
                <TabsList className="grid w-full grid-cols-4 lg:inline-flex lg:w-auto">
                    <TabsTrigger value="watched" className="gap-2">
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">İzlediklerim</span>
                    </TabsTrigger>
                    <TabsTrigger value="watchlist" className="gap-2">
                        <List className="h-4 w-4" />
                        <span className="hidden sm:inline">Liste</span>
                    </TabsTrigger>
                    <TabsTrigger value="lists" className="gap-2">
                        <Layers className="h-4 w-4" />
                        <span className="hidden sm:inline">Tier Listeler</span>
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">İncelemeler</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="watched" className="mt-6">
                    {loading ? (
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                            {Array.from({ length: 14 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="aspect-[2/3] animate-pulse rounded-poster bg-surface-1"
                                />
                            ))}
                        </div>
                    ) : watched.length === 0 ? (
                        <div className="rounded-card border border-border bg-surface-1 p-8 text-center">
                            <p className="text-muted-foreground">Henüz izlenen içerik yok</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                            {watched.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/media/${item.media?.media_type}/${item.media?.tmdb_id}`}
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="group relative aspect-[2/3] overflow-hidden rounded-poster bg-surface-1"
                                    >
                                        {item.media?.poster_path ? (
                                            <Image
                                                src={getPosterUrl(item.media.poster_path, "medium") || ""}
                                                alt={item.media.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center">
                                                <span className="text-xs text-muted-foreground">
                                                    {item.media?.title}
                                                </span>
                                            </div>
                                        )}
                                        {item.rating && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                                <div className="flex items-center gap-1 text-xs text-white">
                                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                    {item.rating}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="watchlist" className="mt-6">
                    {loading ? (
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                            {Array.from({ length: 14 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="aspect-[2/3] animate-pulse rounded-poster bg-surface-1"
                                />
                            ))}
                        </div>
                    ) : watchlist.length === 0 ? (
                        <div className="rounded-card border border-border bg-surface-1 p-8 text-center">
                            <p className="text-muted-foreground">İzleme listesi boş</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                            {watchlist.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/media/${item.media?.media_type}/${item.media?.tmdb_id}`}
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="group relative aspect-[2/3] overflow-hidden rounded-poster bg-surface-1"
                                    >
                                        {item.media?.poster_path ? (
                                            <Image
                                                src={getPosterUrl(item.media.poster_path, "medium") || ""}
                                                alt={item.media.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center">
                                                <span className="text-xs text-muted-foreground">
                                                    {item.media?.title}
                                                </span>
                                            </div>
                                        )}
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="lists" className="mt-6">
                    {!tierLists ? (
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
                            <p className="text-muted-foreground">Henüz tier list yok</p>
                            {isOwnProfile && (
                                <Button asChild className="mt-4">
                                    <Link href="/create">İlk Listeni Oluştur</Link>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {tierLists.map((list: any) => (
                                <Link key={list.id} href={`/list/${list.slug}`}>
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
                                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="capitalize">{list.media_type}</span>
                                            <span>{list.like_count || 0} beğeni</span>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="reviews" className="mt-6">
                    {loading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-32 animate-pulse rounded-card bg-surface-1"
                                />
                            ))}
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="rounded-card border border-border bg-surface-1 p-8 text-center">
                            <p className="text-muted-foreground">Henüz inceleme yok</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review: any) => (
                                <Link
                                    key={review.id}
                                    href={`/media/${review.media?.media_type}/${review.media?.tmdb_id}`}
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.01 }}
                                        className="rounded-card border border-border bg-surface-1 p-4 transition-colors hover:border-neon/30"
                                    >
                                        <div className="flex gap-4">
                                            {review.media?.poster_path && (
                                                <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-md">
                                                    <Image
                                                        src={getPosterUrl(review.media.poster_path, "small") || ""}
                                                        alt={review.media.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h3 className="font-semibold">{review.media?.title}</h3>
                                                {review.rating && (
                                                    <div className="mt-1 flex items-center gap-1 text-sm">
                                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                        <span>{review.rating}/10</span>
                                                    </div>
                                                )}
                                                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                                                    {review.content}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

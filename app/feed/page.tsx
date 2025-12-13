"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActivities } from "@/lib/hooks/use-queries";
import { getPosterUrl } from "@/lib/tmdb";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import {
    Eye,
    Filter,
    Layers,
    Loader2,
    MessageSquare,
    Star,
    UserPlus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type ActivityType = "all" | "watched" | "lists" | "reviews";

export default function FeedPage() {
    const [activeTab, setActiveTab] = useState<ActivityType>("all");
    const { data, isLoading, error } = useActivities(activeTab);

    return (
        <div className="container py-8 pb-20 md:pb-8">
            <div className="mx-auto max-w-2xl">
                <div className="flex items-center justify-between">
                    <h1 className="font-display text-3xl font-bold">Akış</h1>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filtrele
                    </Button>
                </div>

                <Tabs
                    defaultValue="all"
                    className="mt-6"
                    onValueChange={(v: string) => setActiveTab(v as ActivityType)}
                >
                    <TabsList>
                        <TabsTrigger value="all">Tümü</TabsTrigger>
                        <TabsTrigger value="watched">İzlenenler</TabsTrigger>
                        <TabsTrigger value="lists">Listeler</TabsTrigger>
                        <TabsTrigger value="reviews">İncelemeler</TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-neon" />
                            </div>
                        ) : error ? (
                            <div className="rounded-card border border-border bg-surface-1 p-8 text-center">
                                <p className="text-muted-foreground">
                                    Aktiviteler yüklenirken bir hata oluştu.
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => window.location.reload()}
                                >
                                    Tekrar Dene
                                </Button>
                            </div>
                        ) : !data?.activities?.length ? (
                            <div className="rounded-card border border-border bg-surface-1 p-8 text-center">
                                <p className="text-muted-foreground">
                                    Henüz aktivite yok. Birilerini takip etmeye başla!
                                </p>
                                <div className="mt-4 flex justify-center gap-3">
                                    <Button variant="outline" asChild>
                                        <Link href="/search">Keşfet</Link>
                                    </Button>
                                    <Button asChild>
                                        <Link href="/trending">Trendler</Link>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                <div className="space-y-4">
                                    {data.activities.map((activity: Activity, i: number) => (
                                        <motion.div
                                            key={activity.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <ActivityCard activity={activity} />
                                        </motion.div>
                                    ))}
                                </div>
                            </AnimatePresence>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

interface Activity {
    id: string;
    type: "watched" | "list" | "review" | "follow";
    user: {
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
    };
    content: Record<string, unknown>;
    createdAt: string;
}

function ActivityCard({ activity }: { activity: Activity }) {
    const { type, user, content, createdAt } = activity;

    const getActivityIcon = () => {
        switch (type) {
            case "watched":
                return <Eye className="h-4 w-4 text-neon" />;
            case "list":
                return <Layers className="h-4 w-4 text-turquoise" />;
            case "review":
                return <MessageSquare className="h-4 w-4 text-neon" />;
            case "follow":
                return <UserPlus className="h-4 w-4 text-turquoise" />;
        }
    };

    const getActivityText = () => {
        switch (type) {
            case "watched":
                return (
                    <>
                        <Link
                            href={`/media/${content.mediaType}/${content.tmdbId}`}
                            className="font-medium transition-colors hover:text-neon"
                        >
                            {content.title as string}
                        </Link>{" "}
                        izledi
                        {content.rating && (
                            <Badge variant="neon" className="ml-2">
                                <Star className="mr-1 h-3 w-3 fill-current" />
                                {content.rating as number}
                            </Badge>
                        )}
                    </>
                );
            case "list":
                return (
                    <>
                        yeni bir tier list oluşturdu:{" "}
                        <Link
                            href={`/list/${content.slug}`}
                            className="font-medium transition-colors hover:text-neon"
                        >
                            {content.title as string}
                        </Link>
                    </>
                );
            case "review":
                return (
                    <>
                        <Link
                            href={`/media/${content.mediaType}/${content.tmdbId}`}
                            className="font-medium transition-colors hover:text-neon"
                        >
                            {content.title as string}
                        </Link>{" "}
                        için inceleme yazdı
                    </>
                );
            case "follow":
                return (
                    <>
                        <Link
                            href={`/u/${content.targetUser}`}
                            className="font-medium transition-colors hover:text-neon"
                        >
                            @{content.targetUser as string}
                        </Link>{" "}
                        takip etmeye başladı
                    </>
                );
            default:
                return null;
        }
    };

    const timeAgo = formatDistanceToNow(new Date(createdAt), {
        addSuffix: true,
        locale: tr,
    });

    return (
        <div className="rounded-card border border-border bg-surface-1 p-4 transition-colors hover:border-neon/30">
            <div className="flex items-start gap-3">
                <Link href={`/u/${user.username}`}>
                    <Avatar className="h-10 w-10 ring-2 ring-transparent transition-all hover:ring-neon/50">
                        {user.avatarUrl && (
                            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                        )}
                        <AvatarFallback>
                            {(user.displayName || user.username)?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </Link>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        {getActivityIcon()}
                        <Link
                            href={`/u/${user.username}`}
                            className="font-medium transition-colors hover:text-neon"
                        >
                            {user.displayName || user.username}
                        </Link>
                        <span className="text-muted-foreground">{getActivityText()}</span>
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">{timeAgo}</p>

                    {type === "review" && (content as any).excerpt ? (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            &quot;{String((content as any).excerpt)}&quot;
                        </p>
                    ) : null}

                    {(type === "watched" || type === "review") && (content as any).posterPath ? (
                        <Link href={`/media/${content.mediaType}/${content.tmdbId}`}>
                            <div className="group relative mt-2 h-20 w-14 overflow-hidden rounded-md bg-surface-2">
                                <Image
                                    src={getPosterUrl(content.posterPath as string, "small") || ""}
                                    alt={String(content.title)}
                                    fill
                                    className="object-cover transition-transform group-hover:scale-105"
                                />
                            </div>
                        </Link>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

"use client";

import { ShareDialog } from "@/components/tier/share-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLikeTierList, useTierListBySlug, useUser } from "@/lib/hooks/use-queries";
import { createClient } from "@/lib/supabase/client";
import { getPosterUrl } from "@/lib/tmdb";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { motion } from "framer-motion";
import {
    Globe,
    Heart,
    Link as LinkIcon,
    Loader2,
    Lock,
    MessageSquare,
    Swords
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";

interface TierListPageProps {
    params: Promise<{
        slug: string;
    }>;
}

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
        username: string;
        display_name: string;
        avatar_url: string | null;
    };
}

export default function TierListPage({ params }: TierListPageProps) {
    const resolvedParams = use(params);
    const { slug } = resolvedParams;

    const { data: currentUser } = useUser();
    const { data: tierList, isLoading, error } = useTierListBySlug(slug);
    const likeMutation = useLikeTierList();

    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        if (!tierList?.id) return;

        const fetchComments = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from("comments")
                .select(`
                    id,
                    content,
                    created_at,
                    user_id,
                    profiles:user_id (
                        username,
                        display_name,
                        avatar_url
                    )
                `)
                .eq("target_type", "tier_list")
                .eq("target_id", tierList.id)
                .order("created_at", { ascending: false })
                .limit(20);

            setComments((data as any) || []);
        };

        const checkLiked = async () => {
            if (!currentUser) return;
            const supabase = createClient();
            const { data } = await supabase
                .from("tier_list_likes")
                .select("id")
                .eq("tier_list_id", tierList.id)
                .eq("user_id", currentUser.id)
                .single();
            setIsLiked(!!data);
        };

        fetchComments();
        checkLiked();
    }, [tierList?.id, currentUser]);

    const handleLike = () => {
        if (!tierList?.id) return;
        likeMutation.mutate({ tierListId: tierList.id, like: !isLiked }, {
            onSuccess: () => setIsLiked(!isLiked),
        });
    };

    const handleComment = async () => {
        if (!newComment.trim() || !tierList?.id || !currentUser) return;

        setSubmittingComment(true);
        const supabase = createClient();

        const { data, error } = await supabase
            .from("comments")
            .insert({
                user_id: currentUser.id,
                target_type: "tier_list",
                tier_list_id: tierList.id,
                body: newComment.trim(),
            } as any)
            .select(`
                id,
                body,
                created_at,
                user_id,
                profiles:user_id (
                    username,
                    display_name,
                    avatar_url
                )
            `)
            .single();

        if (!error && data) {
            setComments([data as any, ...comments]);
            setNewComment("");
        }
        setSubmittingComment(false);
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            await navigator.share({ title: tierList?.title, url });
        } else {
            await navigator.clipboard.writeText(url);
            alert("Link kopyalandı!");
        }
    };

    if (isLoading) {
        return (
            <div className="container flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-neon" />
            </div>
        );
    }

    if (error || !tierList) {
        return (
            <div className="container py-20 text-center">
                <h1 className="font-display text-2xl font-bold">Liste bulunamadı</h1>
                <p className="mt-2 text-muted-foreground">
                    Bu liste mevcut değil veya gizli.
                </p>
                <Button asChild className="mt-4">
                    <Link href="/">Ana Sayfa</Link>
                </Button>
            </div>
        );
    }

    const tiers = (tierList as any).tiers_data || (tierList as any).tiers || [];
    const author = tierList.profiles;
    const timeAgo = formatDistanceToNow(new Date(tierList.created_at), {
        addSuffix: true,
        locale: tr,
    });

    const getVisibilityIcon = () => {
        switch (tierList.visibility) {
            case "public":
                return <Globe className="mr-1 h-3 w-3" />;
            case "unlisted":
                return <LinkIcon className="mr-1 h-3 w-3" />;
            case "private":
                return <Lock className="mr-1 h-3 w-3" />;
        }
    };

    const getVisibilityText = () => {
        switch (tierList.visibility) {
            case "public":
                return "Herkese Açık";
            case "unlisted":
                return "Bağlantı ile";
            case "private":
                return "Gizli";
        }
    };

    return (
        <div className="container py-8 pb-20 md:pb-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
            >
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant={tierList.visibility === "public" ? "public" : "secondary"}>
                            {getVisibilityIcon()}
                            {getVisibilityText()}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                            {tierList.media_type === "movie" ? "Film" : "Dizi"}
                        </Badge>
                    </div>
                    <h1 className="mt-2 font-display text-3xl font-bold">
                        {tierList.title}
                    </h1>
                    {tierList.description && (
                        <p className="mt-1 text-muted-foreground">
                            {tierList.description}
                        </p>
                    )}

                    {/* Author */}
                    <Link href={`/u/${author?.username}`}>
                        <div className="mt-4 flex items-center gap-2 transition-colors hover:text-neon">
                            <Avatar className="h-8 w-8">
                                {author?.avatar_url && (
                                    <AvatarImage src={author.avatar_url} />
                                )}
                                <AvatarFallback>
                                    {(author?.display_name || author?.username || "?").slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium">
                                    {author?.display_name || author?.username}
                                </p>
                                <p className="text-xs text-muted-foreground">{timeAgo}</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={isLiked ? "neon" : "outline"}
                        size="sm"
                        className="gap-2"
                        onClick={handleLike}
                        disabled={!currentUser || likeMutation.isPending}
                    >
                        <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                        <span>{tierList.like_count || 0}</span>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>{comments.length}</span>
                    </Button>
                    <ShareDialog
                        tierListId={tierList.id}
                        tierListSlug={slug}
                        tierListTitle={tierList.title}
                    />
                    <Button variant="turquoise" size="sm" className="gap-2" asChild>
                        <Link href={`/vs?list=${slug}`}>
                            <Swords className="h-4 w-4" />
                            Bu Liste ile VS
                        </Link>
                    </Button>
                </div>
            </motion.div>

            {/* Tier Board */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-8 space-y-2"
            >
                {tiers.map((tier: any, tierIndex: number) => (
                    <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: tierIndex * 0.1 }}
                        className="flex min-h-[80px] overflow-hidden rounded-lg border border-border"
                    >
                        {/* Tier label */}
                        <div
                            className="flex w-16 shrink-0 items-center justify-center font-display text-xl font-bold text-cinetier-bg-0"
                            style={{ backgroundColor: tier.color }}
                        >
                            {tier.name}
                        </div>

                        {/* Items */}
                        <div className="flex flex-1 flex-wrap gap-1 bg-surface-1 p-2">
                            {tier.items?.map((item: any, itemIndex: number) => (
                                <Link
                                    key={item.id || itemIndex}
                                    href={`/media/${item.media_type || tierList.media_type}/${item.tmdb_id}`}
                                >
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: tierIndex * 0.1 + itemIndex * 0.05 }}
                                        whileHover={{ scale: 1.1, zIndex: 10 }}
                                        className="relative h-16 w-11 overflow-hidden rounded-md bg-surface-2"
                                    >
                                        {item.poster_path ? (
                                            <Image
                                                src={getPosterUrl(item.poster_path, "small") || ""}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-[8px] text-muted-foreground">
                                                {item.title?.slice(0, 10)}
                                            </div>
                                        )}
                                    </motion.div>
                                </Link>
                            ))}
                            {(!tier.items || tier.items.length === 0) && (
                                <div className="flex h-16 items-center px-4 text-sm text-muted-foreground">
                                    Bu tier&apos;da içerik yok
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Comments section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-12"
            >
                <h2 className="font-display text-xl font-bold">
                    Yorumlar <span className="text-muted-foreground">({comments.length})</span>
                </h2>

                {/* Add comment */}
                {currentUser && (
                    <div className="mt-4 rounded-lg border border-border bg-surface-1 p-4">
                        <Textarea
                            placeholder="Yorum yaz..."
                            value={newComment}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
                            className="min-h-[80px]"
                        />
                        <div className="mt-2 flex justify-end">
                            <Button
                                onClick={handleComment}
                                disabled={!newComment.trim() || submittingComment}
                            >
                                {submittingComment ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Gönder
                            </Button>
                        </div>
                    </div>
                )}

                <div className="mt-4 space-y-4">
                    {comments.length === 0 ? (
                        <div className="rounded-lg border border-border bg-surface-1 p-8 text-center">
                            <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50" />
                            <p className="mt-2 text-muted-foreground">Henüz yorum yok</p>
                            <p className="text-sm text-muted-foreground">İlk yorumu sen yap!</p>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div
                                key={comment.id}
                                className="rounded-lg border border-border bg-surface-1 p-4"
                            >
                                <div className="flex items-start gap-3">
                                    <Link href={`/u/${comment.profiles?.username}`}>
                                        <Avatar className="h-8 w-8">
                                            {comment.profiles?.avatar_url && (
                                                <AvatarImage src={comment.profiles.avatar_url} />
                                            )}
                                            <AvatarFallback>
                                                {(comment.profiles?.display_name || comment.profiles?.username || "?")
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/u/${comment.profiles?.username}`}
                                                className="text-sm font-medium hover:text-neon"
                                            >
                                                {comment.profiles?.display_name || comment.profiles?.username}
                                            </Link>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(comment.created_at), {
                                                    addSuffix: true,
                                                    locale: tr,
                                                })}
                                            </p>
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
}

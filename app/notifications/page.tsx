"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { motion } from "framer-motion";
import { Bell, Check, Heart, Loader2, MessageSquare, UserPlus } from "lucide-react";
import Link from "next/link";

interface Notification {
    id: string;
    type: string;
    read: boolean;
    created_at: string;
    message: string | null;
    actor: {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
    } | null;
    tier_list: {
        id: string;
        title: string;
        slug: string;
    } | null;
    review: {
        id: string;
        media_id: string;
    } | null;
    comment: {
        id: string;
        body: string;
    } | null;
}

export default function NotificationsPage() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery<{ notifications: Notification[]; unreadCount: number }>({
        queryKey: ["notifications", "all"],
        queryFn: async () => {
            const res = await fetch("/api/notifications?limit=50");
            if (!res.ok) return { notifications: [], unreadCount: 0 };
            return res.json();
        },
    });

    const markAsRead = useMutation({
        mutationFn: async (ids?: string[]) => {
            const res = await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(ids ? { notificationIds: ids } : { markAll: true }),
            });
            if (!res.ok) throw new Error("Failed to mark");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "follow":
                return <UserPlus className="h-5 w-5 text-turquoise" />;
            case "like_tier_list":
            case "like_review":
                return <Heart className="h-5 w-5 text-red-500" />;
            case "comment":
            case "reply":
                return <MessageSquare className="h-5 w-5 text-neon" />;
            default:
                return <Bell className="h-5 w-5" />;
        }
    };

    const getNotificationText = (notification: Notification) => {
        const actorName = notification.actor?.display_name || notification.actor?.username || "Birisi";

        switch (notification.type) {
            case "follow":
                return `${actorName} seni takip etmeye başladı`;
            case "like_tier_list":
                return `${actorName} "${notification.tier_list?.title || "bir liste"}" listeni beğendi`;
            case "like_review":
                return `${actorName} incelemeni beğendi`;
            case "comment":
                return `${actorName} "${notification.tier_list?.title || "bir içeriğine"}" yorum yaptı`;
            case "reply":
                return `${actorName} yorumuna cevap verdi`;
            default:
                return notification.message || "Yeni bildirim";
        }
    };

    const getNotificationLink = (notification: Notification) => {
        switch (notification.type) {
            case "follow":
                return `/u/${notification.actor?.username}`;
            case "like_tier_list":
            case "comment":
                return notification.tier_list ? `/list/${notification.tier_list.slug}` : "#";
            case "like_review":
                return notification.review ? `/media/${notification.review.media_id}` : "#";
            case "reply":
                return notification.tier_list ? `/list/${notification.tier_list.slug}` : "#";
            default:
                return "#";
        }
    };

    const notifications = data?.notifications || [];
    const unreadCount = data?.unreadCount || 0;

    return (
        <div className="container py-8 pb-20 md:pb-8">
            <div className="mx-auto max-w-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-3xl font-bold">Bildirimler</h1>
                        {unreadCount > 0 && (
                            <p className="mt-1 text-sm text-muted-foreground">
                                {unreadCount} okunmamış bildirim
                            </p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsRead.mutate(undefined)}
                            disabled={markAsRead.isPending}
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Tümünü okundu işaretle
                        </Button>
                    )}
                </div>

                <div className="mt-8 space-y-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-neon" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="rounded-card border border-border bg-surface-1 p-8 text-center">
                            <Bell className="mx-auto h-12 w-12 text-muted-foreground/30" />
                            <p className="mt-4 text-muted-foreground">Henüz bildirim yok</p>
                        </div>
                    ) : (
                        notifications.map((notification, index) => (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <Link
                                    href={getNotificationLink(notification)}
                                    onClick={() => {
                                        if (!notification.read) {
                                            markAsRead.mutate([notification.id]);
                                        }
                                    }}
                                >
                                    <div
                                        className={`flex items-start gap-4 rounded-card border p-4 transition-all hover:border-neon/30 ${!notification.read
                                            ? "border-neon/20 bg-surface-2"
                                            : "border-border bg-surface-1"
                                            }`}
                                    >
                                        <Avatar className="h-10 w-10">
                                            {notification.actor?.avatar_url && (
                                                <AvatarImage src={notification.actor.avatar_url} />
                                            )}
                                            <AvatarFallback>
                                                {(notification.actor?.username || "?").slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                {getNotificationIcon(notification.type)}
                                                <p className="text-sm">{getNotificationText(notification)}</p>
                                            </div>
                                            {notification.comment?.body && (
                                                <p className="mt-2 line-clamp-2 rounded bg-surface-1 p-2 text-sm text-muted-foreground">
                                                    &quot;{notification.comment.body}&quot;
                                                </p>
                                            )}
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(notification.created_at), {
                                                    addSuffix: true,
                                                    locale: tr,
                                                })}
                                            </p>
                                        </div>

                                        {!notification.read && (
                                            <div className="h-2 w-2 rounded-full bg-neon" />
                                        )}
                                    </div>
                                </Link>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

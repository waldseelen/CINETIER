"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/lib/hooks/use-queries";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Bell, Check, Heart, MessageSquare, UserPlus } from "lucide-react";
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

export function NotificationBell() {
    const queryClient = useQueryClient();
    const { data: user } = useCurrentUser();

    const { data } = useQuery<{ notifications: Notification[]; unreadCount: number }>({
        queryKey: ["notifications"],
        queryFn: async () => {
            const res = await fetch("/api/notifications?limit=10");
            if (!res.ok) return { notifications: [], unreadCount: 0 };
            return res.json();
        },
        refetchInterval: user ? 30000 : false, // Sadece giriş yapmışsa poll yap
        enabled: !!user, // Kullanıcı yoksa fetch yapma
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
                return <UserPlus className="h-4 w-4 text-turquoise" />;
            case "like_tier_list":
            case "like_review":
                return <Heart className="h-4 w-4 text-red-500" />;
            case "comment":
            case "reply":
                return <MessageSquare className="h-4 w-4 text-neon" />;
            default:
                return <Bell className="h-4 w-4" />;
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

    const unreadCount = data?.unreadCount || 0;
    const notifications = data?.notifications || [];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-neon text-xs font-bold text-cinetier-bg-0">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-3 py-2">
                    <h3 className="font-semibold">Bildirimler</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto py-1 text-xs"
                            onClick={() => markAsRead.mutate(undefined)}
                        >
                            <Check className="mr-1 h-3 w-3" />
                            Tümünü okundu işaretle
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />

                {notifications.length === 0 ? (
                    <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                        Henüz bildirim yok
                    </div>
                ) : (
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.map((notification) => (
                            <DropdownMenuItem key={notification.id} asChild>
                                <Link
                                    href={getNotificationLink(notification)}
                                    className={`flex items-start gap-3 p-3 ${!notification.read ? "bg-surface-2" : ""
                                        }`}
                                    onClick={() => {
                                        if (!notification.read) {
                                            markAsRead.mutate([notification.id]);
                                        }
                                    }}
                                >
                                    <Avatar className="h-8 w-8">
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
                                            <p className="truncate text-sm">
                                                {getNotificationText(notification)}
                                            </p>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.created_at), {
                                                addSuffix: true,
                                                locale: tr,
                                            })}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="h-2 w-2 rounded-full bg-neon" />
                                    )}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/notifications" className="w-full text-center text-sm">
                        Tüm bildirimleri gör
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

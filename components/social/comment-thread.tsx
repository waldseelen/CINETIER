"use client";

import { ReportDialog } from "@/components/social/report-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MessageSquare, MoreHorizontal, Reply, Trash } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Comment {
    id: string;
    body: string;
    created_at: string;
    user_id: string;
    parent_id: string | null;
    profiles: {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
    };
    likes_count?: number;
    is_liked?: boolean;
    replies?: Comment[];
}

interface CommentThreadProps {
    comments: Comment[];
    currentUserId?: string;
    targetType: "tier_list" | "media" | "review";
    targetId: string;
    onCommentAdded?: (comment: Comment) => void;
    onCommentDeleted?: (commentId: string) => void;
}

export function CommentThread({
    comments,
    currentUserId,
    targetType,
    targetId,
    onCommentAdded,
    onCommentDeleted,
}: CommentThreadProps) {
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

    // Group comments into threads
    const rootComments = comments.filter((c) => !c.parent_id);
    const repliesMap = new Map<string, Comment[]>();
    comments.forEach((c) => {
        if (c.parent_id) {
            const existing = repliesMap.get(c.parent_id) || [];
            repliesMap.set(c.parent_id, [...existing, c]);
        }
    });

    const handleSubmitReply = async (parentId: string) => {
        if (!replyContent.trim() || !currentUserId) return;

        setSubmitting(true);
        const supabase = createClient();

        const insertData: any = {
            user_id: currentUserId,
            target_type: targetType,
            body: replyContent.trim(),
            parent_id: parentId,
        };

        if (targetType === "tier_list") {
            insertData.tier_list_id = targetId;
        } else if (targetType === "media") {
            insertData.media_id = targetId;
        } else if (targetType === "review") {
            insertData.review_id = targetId;
        }

        const { data, error } = await (supabase
            .from("comments") as any)
            .insert(insertData)
            .select(`
                id,
                body,
                created_at,
                user_id,
                parent_id,
                profiles:user_id (
                    username,
                    display_name,
                    avatar_url
                )
            `)
            .single();

        if (!error && data) {
            onCommentAdded?.(data);
            setReplyContent("");
            setReplyingTo(null);
            // Auto-expand replies for this comment
            setExpandedReplies((prev) => new Set([...prev, parentId]));
        }
        setSubmitting(false);
    };

    const handleDelete = async (commentId: string) => {
        if (!currentUserId) return;
        const supabase = createClient();
        const { error } = await supabase
            .from("comments")
            .delete()
            .eq("id", commentId)
            .eq("user_id", currentUserId);

        if (!error) {
            onCommentDeleted?.(commentId);
        }
    };

    const toggleReplies = (commentId: string) => {
        setExpandedReplies((prev) => {
            const next = new Set(prev);
            if (next.has(commentId)) {
                next.delete(commentId);
            } else {
                next.add(commentId);
            }
            return next;
        });
    };

    return (
        <div className="space-y-4">
            {rootComments.map((comment) => {
                const replies = repliesMap.get(comment.id) || [];
                const hasReplies = replies.length > 0;
                const isExpanded = expandedReplies.has(comment.id);

                return (
                    <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg border border-border bg-surface-1 p-4"
                    >
                        {/* Comment Header */}
                        <div className="flex items-start justify-between">
                            <Link href={`/u/${comment.profiles.username}`} className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    {comment.profiles.avatar_url && (
                                        <AvatarImage src={comment.profiles.avatar_url} />
                                    )}
                                    <AvatarFallback>
                                        {(comment.profiles.display_name || comment.profiles.username)
                                            .slice(0, 2)
                                            .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium hover:text-neon">
                                        {comment.profiles.display_name || comment.profiles.username}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(comment.created_at), {
                                            addSuffix: true,
                                            locale: tr,
                                        })}
                                    </p>
                                </div>
                            </Link>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {comment.user_id === currentUserId ? (
                                        <DropdownMenuItem
                                            onClick={() => handleDelete(comment.id)}
                                            className="text-destructive"
                                        >
                                            <Trash className="mr-2 h-4 w-4" />
                                            Sil
                                        </DropdownMenuItem>
                                    ) : (
                                        <ReportDialog
                                            targetType="comment"
                                            targetId={comment.id}
                                            trigger={
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                    Raporla
                                                </DropdownMenuItem>
                                            }
                                        />
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Comment Body */}
                        <p className="mt-3 text-sm">{comment.body}</p>

                        {/* Comment Actions */}
                        <div className="mt-3 flex items-center gap-4">
                            {currentUserId && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-2 text-muted-foreground hover:text-neon"
                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                >
                                    <Reply className="h-4 w-4" />
                                    Yanıtla
                                </Button>
                            )}
                            {hasReplies && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-2 text-muted-foreground hover:text-turquoise"
                                    onClick={() => toggleReplies(comment.id)}
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    {replies.length} yanıt {isExpanded ? "▲" : "▼"}
                                </Button>
                            )}
                        </div>

                        {/* Reply Input */}
                        <AnimatePresence>
                            {replyingTo === comment.id && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-3 overflow-hidden"
                                >
                                    <div className="flex gap-2">
                                        <Textarea
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            placeholder="Yanıtınızı yazın..."
                                            rows={2}
                                            className="flex-1"
                                        />
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleSubmitReply(comment.id)}
                                                disabled={submitting || !replyContent.trim()}
                                            >
                                                {submitting ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    "Gönder"
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setReplyingTo(null);
                                                    setReplyContent("");
                                                }}
                                            >
                                                İptal
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Replies */}
                        <AnimatePresence>
                            {isExpanded && hasReplies && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 space-y-3 border-l-2 border-border pl-4"
                                >
                                    {replies.map((reply) => (
                                        <div key={reply.id} className="rounded-md bg-surface-2 p-3">
                                            <div className="flex items-start justify-between">
                                                <Link
                                                    href={`/u/${reply.profiles.username}`}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Avatar className="h-6 w-6">
                                                        {reply.profiles.avatar_url && (
                                                            <AvatarImage src={reply.profiles.avatar_url} />
                                                        )}
                                                        <AvatarFallback className="text-xs">
                                                            {(reply.profiles.display_name || reply.profiles.username)
                                                                .slice(0, 2)
                                                                .toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium hover:text-neon">
                                                        {reply.profiles.display_name || reply.profiles.username}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(reply.created_at), {
                                                            addSuffix: true,
                                                            locale: tr,
                                                        })}
                                                    </span>
                                                </Link>

                                                {reply.user_id === currentUserId && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-destructive"
                                                        onClick={() => handleDelete(reply.id)}
                                                    >
                                                        <Trash className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                            <p className="mt-2 text-sm">{reply.body}</p>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
}

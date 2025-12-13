"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Ban, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface BlockButtonProps {
    targetUserId: string;
    targetUsername: string;
    isBlocked?: boolean;
    onBlockChange?: (blocked: boolean) => void;
}

export function BlockButton({
    targetUserId,
    targetUsername,
    isBlocked = false,
    onBlockChange,
}: BlockButtonProps) {
    const [blocked, setBlocked] = useState(isBlocked);
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    const handleBlock = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/blocks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId }),
            });

            if (!res.ok) throw new Error("Block failed");

            setBlocked(true);
            onBlockChange?.(true);
            toast.success(`@${targetUsername} engellendi`);
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            queryClient.invalidateQueries({ queryKey: ["is-following"] });
        } catch (error) {
            toast.error("Engelleme başarısız");
        } finally {
            setLoading(false);
        }
    };

    const handleUnblock = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/blocks?targetUserId=${targetUserId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Unblock failed");

            setBlocked(false);
            onBlockChange?.(false);
            toast.success(`@${targetUsername} engeli kaldırıldı`);
            queryClient.invalidateQueries({ queryKey: ["profile"] });
        } catch (error) {
            toast.error("Engel kaldırma başarısız");
        } finally {
            setLoading(false);
        }
    };

    if (blocked) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={handleUnblock}
                disabled={loading}
                className="gap-2"
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Ban className="h-4 w-4" />
                )}
                Engeli Kaldır
            </Button>
        );
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive"
                >
                    <Ban className="h-4 w-4" />
                    Engelle
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>@{targetUsername} engellensin mi?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Engellediğiniz kullanıcılar sizin profilinizi, listelerinizi ve
                        içeriklerinizi göremez. Ayrıca size mesaj gönderemezler.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleBlock}
                        disabled={loading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Engelle
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Check, Copy, Download, Instagram, Link2, Share2, Twitter } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShareDialogProps {
    tierListId: string;
    tierListSlug: string;
    tierListTitle: string;
}

export function ShareDialog({ tierListId, tierListSlug, tierListTitle }: ShareDialogProps) {
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);

    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/list/${tierListSlug}`;
    const ogImageUrl = `/api/share/tierlist/${tierListId}/og`;

    const copyLink = async () => {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success("Link kopyalandı!");
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadImage = async (format: "twitter" | "instagram") => {
        setDownloading(format);
        try {
            const response = await fetch(`${ogImageUrl}?format=${format}`);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${tierListSlug}-${format}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Görsel indirildi!");
        } catch (error) {
            toast.error("Görsel indirilemedi");
        } finally {
            setDownloading(null);
        }
    };

    const shareToTwitter = () => {
        const text = `${tierListTitle} - CineTier tier listemi oluşturdum!`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(url, "_blank");
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Paylaş
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Tier List&apos;i Paylaş</DialogTitle>
                    <DialogDescription>
                        Listeni sosyal medyada paylaş veya görsel olarak indir.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="link" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="link">Link</TabsTrigger>
                        <TabsTrigger value="image">Görsel</TabsTrigger>
                    </TabsList>

                    <TabsContent value="link" className="space-y-4">
                        <div className="flex items-center gap-2">
                            <input
                                readOnly
                                value={shareUrl}
                                className="flex-1 rounded-md border border-border bg-surface-1 px-3 py-2 text-sm"
                            />
                            <Button size="sm" variant="outline" onClick={copyLink}>
                                {copied ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={shareToTwitter}
                            >
                                <Twitter className="h-4 w-4" />
                                Twitter
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={copyLink}
                            >
                                <Link2 className="h-4 w-4" />
                                Link Kopyala
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="image" className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Sosyal medya için optimize edilmiş görseller indir.
                        </p>

                        <div className="grid gap-3">
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-3"
                                onClick={() => downloadImage("twitter")}
                                disabled={downloading === "twitter"}
                            >
                                <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                                <div className="flex flex-col items-start">
                                    <span>Twitter / X</span>
                                    <span className="text-xs text-muted-foreground">
                                        1200 × 675 px
                                    </span>
                                </div>
                                <Download className="ml-auto h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full justify-start gap-3"
                                onClick={() => downloadImage("instagram")}
                                disabled={downloading === "instagram"}
                            >
                                <Instagram className="h-5 w-5 text-[#E4405F]" />
                                <div className="flex flex-col items-start">
                                    <span>Instagram</span>
                                    <span className="text-xs text-muted-foreground">
                                        1080 × 1350 px
                                    </span>
                                </div>
                                <Download className="ml-auto h-4 w-4" />
                            </Button>
                        </div>

                        {/* Preview */}
                        <div className="mt-4">
                            <p className="mb-2 text-sm font-medium">Önizleme</p>
                            <div className="overflow-hidden rounded-lg border border-border">
                                <img
                                    src={`${ogImageUrl}?format=twitter`}
                                    alt="Preview"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

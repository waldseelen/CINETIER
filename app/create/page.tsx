"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useCreateTierList, useTMDBSearch, useUser } from "@/lib/hooks/use-queries";
import { getPosterUrl } from "@/lib/tmdb/client";
import { DEFAULT_TIERS, type Tier, type TierItem } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, GripVertical, Link as LinkIcon, Loader2, Lock, Plus, Save, Search, Share2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export default function CreatePage() {
    const router = useRouter();
    const { data: user } = useUser();
    const createTierList = useCreateTierList();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
    const [mediaType, setMediaType] = useState<"movie" | "tv" | "mixed">("mixed");
    const [tiers, setTiers] = useState<Tier[]>(
        DEFAULT_TIERS.map((t) => ({ ...t, items: [] }))
    );
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

    const debouncedQuery = useDebounce(searchQuery, 300);
    const { data: searchResults, isLoading: searchLoading } = useTMDBSearch(debouncedQuery);

    const handleAddItem = useCallback((result: { id: number; title?: string; name?: string; poster_path: string | null; media_type?: string }) => {
        if (!selectedTierId) return;

        const newItem: TierItem = {
            id: `${result.id}-${Date.now()}`,
            mediaId: result.id.toString(),
            tmdbId: result.id,
            title: result.title || result.name || "",
            posterPath: result.poster_path,
            mediaType: (result.media_type as "movie" | "tv") || "movie",
        };

        setTiers(prev => prev.map(tier =>
            tier.id === selectedTierId
                ? { ...tier, items: [...tier.items, newItem] }
                : tier
        ));

        setSearchOpen(false);
        setSearchQuery("");
        setSelectedTierId(null);
    }, [selectedTierId]);

    const handleRemoveItem = useCallback((tierId: string, itemId: string) => {
        setTiers(prev => prev.map(tier =>
            tier.id === tierId
                ? { ...tier, items: tier.items.filter(item => item.id !== itemId) }
                : tier
        ));
    }, []);

    const handleOpenSearch = (tierId: string) => {
        setSelectedTierId(tierId);
        setSearchOpen(true);
    };

    const handleSave = async () => {
        if (!user) {
            router.push("/auth/login");
            return;
        }

        if (!title.trim()) {
            alert("Lütfen bir başlık girin");
            return;
        }

        const tierData = tiers.map(tier => ({
            key: tier.id,
            label: tier.name,
            color: tier.color,
            items: tier.items.map(item => ({
                mediaId: item.mediaId || item.id,
                tmdbId: item.tmdbId,
                title: item.title,
                posterPath: item.posterPath,
            })),
        }));

        try {
            const result = await createTierList.mutateAsync({
                title: title.trim(),
                description: description.trim() || undefined,
                visibility,
                mediaType,
                tiers: tierData,
            });

            router.push(`/list/${(result as any).slug}`);
        } catch (error) {
            console.error("Failed to create tier list:", error);
            alert("Liste oluşturulurken bir hata oluştu");
        }
    };

    const totalItems = tiers.reduce((acc, tier) => acc + tier.items.length, 0);

    return (
        <div className="container py-8 pb-20 md:pb-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Liste başlığı..."
                        className="border-none bg-transparent font-display text-2xl font-bold placeholder:text-muted-foreground focus-visible:ring-0 md:text-3xl"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Visibility toggle */}
                    <div className="flex items-center rounded-lg border border-border bg-surface-1 p-1">
                        <button
                            onClick={() => setVisibility("public")}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${visibility === "public"
                                ? "bg-neon text-cinetier-bg-0"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Globe className="h-4 w-4" />
                            Public
                        </button>
                        <button
                            onClick={() => setVisibility("unlisted")}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${visibility === "unlisted"
                                ? "bg-turquoise text-cinetier-bg-0"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <LinkIcon className="h-4 w-4" />
                            Unlisted
                        </button>
                        <button
                            onClick={() => setVisibility("private")}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${visibility === "private"
                                ? "bg-surface-2 text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Lock className="h-4 w-4" />
                            Private
                        </button>
                    </div>

                    <Button variant="outline" className="gap-2">
                        <Share2 className="h-4 w-4" />
                        Paylaş
                    </Button>

                    <Button
                        variant="neon"
                        className="gap-2"
                        onClick={handleSave}
                        disabled={createTierList.isPending || !title.trim()}
                    >
                        {createTierList.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Kaydet
                    </Button>
                </div>
            </div>

            {/* Description */}
            <div className="mt-4">
                <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Açıklama ekle (opsiyonel)..."
                    className="border-border bg-surface-1"
                />
            </div>

            {/* Search Dialog */}
            <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Film veya Dizi Ekle</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Film veya dizi ara..."
                                className="pl-10"
                                autoFocus
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Search results */}
                        <div className="mt-4 max-h-[400px] overflow-y-auto">
                            {searchLoading ? (
                                <div className="grid grid-cols-4 gap-3">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <Skeleton key={i} className="aspect-[2/3] rounded-poster" />
                                    ))}
                                </div>
                            ) : (searchResults?.results?.length ?? 0) > 0 ? (
                                <div className="grid grid-cols-4 gap-3">
                                    {searchResults?.results?.map((result: any) => (
                                        <motion.button
                                            key={result.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            onClick={() => handleAddItem(result)}
                                            className="group relative aspect-[2/3] overflow-hidden rounded-poster bg-surface-1 transition-all hover:ring-2 hover:ring-turquoise focus:outline-none focus:ring-2 focus:ring-turquoise"
                                        >
                                            {result.poster_path ? (
                                                <Image
                                                    src={getPosterUrl(result.poster_path, "medium") || ""}
                                                    alt={result.title || result.name || ""}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                                                    {result.title || result.name}
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="absolute bottom-0 left-0 right-0 p-2">
                                                    <p className="text-xs font-medium text-white line-clamp-2">
                                                        {result.title || result.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            ) : searchQuery ? (
                                <div className="py-12 text-center text-muted-foreground">
                                    <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>Sonuç bulunamadı</p>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-muted-foreground">
                                    <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>Aramak için yazmaya başla</p>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Tier Board */}
            <div className="mt-6 space-y-2">
                {tiers.map((tier) => (
                    <div
                        key={tier.id}
                        className="flex min-h-[80px] overflow-hidden rounded-lg border border-border transition-all hover:border-turquoise/50"
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
                            {tier.items.length === 0 ? (
                                <button
                                    onClick={() => handleOpenSearch(tier.id)}
                                    className="flex h-16 w-full items-center justify-center text-sm text-muted-foreground hover:text-turquoise transition-colors"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    İçerik ekle
                                </button>
                            ) : (
                                <>
                                    <AnimatePresence mode="popLayout">
                                        {tier.items.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="group relative h-16 w-11 rounded-md overflow-hidden bg-surface-2"
                                            >
                                                {item.posterPath ? (
                                                    <Image
                                                        src={getPosterUrl(item.posterPath, "small") || ""}
                                                        alt={item.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-[8px] text-muted-foreground p-1 text-center">
                                                        {item.title}
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => handleRemoveItem(tier.id, item.id)}
                                                    className="absolute top-0 right-0 p-0.5 bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-bl"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                                <div className="absolute bottom-0 left-0 p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                                                    <GripVertical className="h-3 w-3" />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    <button
                                        onClick={() => handleOpenSearch(tier.id)}
                                        className="flex h-16 w-11 items-center justify-center rounded-md border-2 border-dashed border-border text-muted-foreground hover:border-turquoise hover:text-turquoise transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Stats */}
            <div className="mt-4 text-sm text-muted-foreground">
                Toplam {totalItems} içerik eklendi
            </div>

            {/* Help text */}
            <div className="mt-8 rounded-lg border border-border bg-surface-1 p-4">
                <h3 className="font-medium">Nasıl kullanılır?</h3>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>• Her tier satırındaki + butonuna tıklayarak film veya dizi arayın</li>
                    <li>• Arama sonuçlarından içerik seçerek tier&apos;a ekleyin</li>
                    <li>• Eklenen içeriklerin üzerine gelip X butonuyla kaldırabilirsiniz</li>
                    <li>• Kaydet butonuna tıklayarak listenizi yayınlayın</li>
                </ul>
            </div>
        </div>
    );
}

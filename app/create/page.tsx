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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useCollectionDetails, useCollectionSearch, useCreateTierList, useTMDBSearch, useUser } from "@/lib/hooks/use-queries";
import { getPosterUrl } from "@/lib/tmdb/client";
import { DEFAULT_TIERS, type Tier, type TierItem } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Film, Globe, GripVertical, Library, Link as LinkIcon, Loader2, Lock, Plus, Save, Search, Share2, X } from "lucide-react";
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
    const [searchMode, setSearchMode] = useState<"single" | "collection">("single");
    const [collectionQuery, setCollectionQuery] = useState("");
    const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);

    const debouncedQuery = useDebounce(searchQuery, 300);
    const debouncedCollectionQuery = useDebounce(collectionQuery, 300);
    const { data: searchResults, isLoading: searchLoading } = useTMDBSearch(debouncedQuery);
    const { data: collectionResults, isLoading: collectionSearchLoading } = useCollectionSearch(debouncedCollectionQuery);
    const { data: collectionDetails, isLoading: collectionDetailsLoading } = useCollectionDetails(selectedCollectionId);

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

    const handleAddCollection = useCallback((parts: Array<{ id: number; tmdbId: number; title: string; posterPath: string | null }>) => {
        if (!selectedTierId) return;

        const newItems: TierItem[] = parts.map((part, index) => ({
            id: `${part.tmdbId}-${Date.now()}-${index}`,
            mediaId: part.tmdbId.toString(),
            tmdbId: part.tmdbId,
            title: part.title,
            posterPath: part.posterPath,
            mediaType: "movie" as const,
        }));

        setTiers(prev => prev.map(tier =>
            tier.id === selectedTierId
                ? { ...tier, items: [...tier.items, ...newItems] }
                : tier
        ));

        setSearchOpen(false);
        setCollectionQuery("");
        setSelectedCollectionId(null);
        setSelectedTierId(null);
        setSearchMode("single");
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
            <Dialog open={searchOpen} onOpenChange={(open) => {
                setSearchOpen(open);
                if (!open) {
                    setSearchQuery("");
                    setCollectionQuery("");
                    setSelectedCollectionId(null);
                    setSearchMode("single");
                }
            }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Film veya Dizi Ekle</DialogTitle>
                    </DialogHeader>

                    {/* Tab Switch: Single vs Collection */}
                    <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as "single" | "collection")}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="single" className="gap-2">
                                <Film className="h-4 w-4" />
                                Tekli Arama
                            </TabsTrigger>
                            <TabsTrigger value="collection" className="gap-2">
                                <Library className="h-4 w-4" />
                                Koleksiyon
                            </TabsTrigger>
                        </TabsList>

                        {/* Single Search Tab */}
                        <TabsContent value="single" className="mt-4">
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
                        </TabsContent>

                        {/* Collection Tab */}
                        <TabsContent value="collection" className="mt-4">
                            {!selectedCollectionId ? (
                                <>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={collectionQuery}
                                            onChange={(e) => setCollectionQuery(e.target.value)}
                                            placeholder="Koleksiyon ara (Harry Potter, Marvel, Star Wars...)"
                                            className="pl-10"
                                        />
                                        {collectionQuery && (
                                            <button
                                                onClick={() => setCollectionQuery("")}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-4 max-h-[400px] overflow-y-auto">
                                        {collectionSearchLoading ? (
                                            <div className="space-y-2">
                                                {Array.from({ length: 4 }).map((_, i) => (
                                                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                                                ))}
                                            </div>
                                        ) : (collectionResults?.data?.length ?? 0) > 0 ? (
                                            <div className="space-y-2">
                                                {collectionResults?.data?.map((collection: any) => (
                                                    <motion.button
                                                        key={collection.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        onClick={() => setSelectedCollectionId(collection.id)}
                                                        className="flex w-full items-center gap-4 rounded-lg border border-border bg-surface-1 p-3 text-left transition-all hover:border-turquoise hover:bg-surface-2"
                                                    >
                                                        <div className="h-12 w-8 shrink-0 overflow-hidden rounded bg-surface-2">
                                                            {collection.posterPath ? (
                                                                <Image
                                                                    src={getPosterUrl(collection.posterPath, "small") || ""}
                                                                    alt={collection.name}
                                                                    width={32}
                                                                    height={48}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <Library className="h-full w-full p-2 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium truncate">{collection.name}</p>
                                                        </div>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        ) : collectionQuery ? (
                                            <div className="py-12 text-center text-muted-foreground">
                                                <Library className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                                <p>Koleksiyon bulunamadı</p>
                                            </div>
                                        ) : (
                                            <div className="py-12 text-center text-muted-foreground">
                                                <Library className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                                <p>Koleksiyon aramak için yazmaya başla</p>
                                                <p className="mt-1 text-xs">Örn: Harry Potter, Marvel, Star Wars</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Collection Details View */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedCollectionId(null)}
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Geri
                                        </Button>
                                        {collectionDetails?.data && (
                                            <h3 className="font-medium truncate">{collectionDetails.data.name}</h3>
                                        )}
                                    </div>

                                    <div className="max-h-[400px] overflow-y-auto">
                                        {collectionDetailsLoading ? (
                                            <div className="grid grid-cols-4 gap-3">
                                                {Array.from({ length: 8 }).map((_, i) => (
                                                    <Skeleton key={i} className="aspect-[2/3] rounded-poster" />
                                                ))}
                                            </div>
                                        ) : collectionDetails?.data?.parts ? (
                                            <>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    {collectionDetails.data.parts.length} film bulundu. Tümünü eklemek için butona tıklayın.
                                                </p>
                                                <Button
                                                    className="w-full mb-4 gap-2"
                                                    variant="turquoise"
                                                    onClick={() => handleAddCollection(collectionDetails.data.parts)}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Tüm Koleksiyonu Ekle ({collectionDetails.data.parts.length} film)
                                                </Button>
                                                <div className="grid grid-cols-4 gap-3">
                                                    {collectionDetails.data.parts.map((part: any) => (
                                                        <motion.div
                                                            key={part.id}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className="group relative aspect-[2/3] overflow-hidden rounded-poster bg-surface-1"
                                                        >
                                                            {part.posterPath ? (
                                                                <Image
                                                                    src={getPosterUrl(part.posterPath, "medium") || ""}
                                                                    alt={part.title}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                                                                    {part.title}
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                                                                <div className="absolute bottom-0 left-0 right-0 p-2">
                                                                    <p className="text-xs font-medium text-white line-clamp-2">
                                                                        {part.title}
                                                                    </p>
                                                                    {part.releaseDate && (
                                                                        <p className="text-[10px] text-white/70">
                                                                            {new Date(part.releaseDate).getFullYear()}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="py-12 text-center text-muted-foreground">
                                                <Library className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                                <p>Koleksiyon yüklenemedi</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </TabsContent>
                    </Tabs>
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

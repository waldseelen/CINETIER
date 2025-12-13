"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Film, Loader2, Star, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useState } from "react";

interface PersonPageProps {
    params: Promise<{ tmdbId: string }>;
}

interface PersonData {
    id: number;
    name: string;
    profile_path: string | null;
    known_for_department: string;
    popularity: number;
    biography: string;
    birthday: string;
    place_of_birth: string;
    credits: {
        cast: any[];
        crew: any[];
    };
}

interface Rating {
    acting: number;
    charisma: number;
    voice: number;
    rangeScore: number;
    comment: string;
}

const TRAITS = [
    { key: "acting", label: "Oyunculuk", description: "Rol yapma yeteneği" },
    { key: "charisma", label: "Karizma", description: "Ekran varlığı" },
    { key: "voice", label: "Ses", description: "Ses tonu ve kullanımı" },
    { key: "rangeScore", label: "Çeşitlilik", description: "Farklı rollerdeki performans" },
];

export default function PersonPage({ params }: PersonPageProps) {
    const resolvedParams = use(params);
    const { tmdbId } = resolvedParams;
    const queryClient = useQueryClient();

    const [rating, setRating] = useState<Rating>({
        acting: 5,
        charisma: 5,
        voice: 5,
        rangeScore: 5,
        comment: "",
    });

    // Fetch person data
    const { data: person, isLoading: personLoading } = useQuery<PersonData>({
        queryKey: ["person", tmdbId],
        queryFn: async () => {
            const res = await fetch(`/api/tmdb/person?id=${tmdbId}`);
            if (!res.ok) throw new Error("Person not found");
            return res.json();
        },
    });

    // Fetch ratings
    const { data: ratingsData, isLoading: ratingsLoading } = useQuery({
        queryKey: ["person-ratings", tmdbId],
        queryFn: async () => {
            // We need to first get our DB person ID
            // For now we'll use tmdb_id based lookup on server
            const res = await fetch(`/api/person-ratings?personId=${tmdbId}`);
            if (!res.ok) return null;
            return res.json();
        },
        enabled: !!person,
    });

    // Submit rating mutation
    const submitRating = useMutation({
        mutationFn: async (data: Rating) => {
            const res = await fetch("/api/person-ratings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tmdbId: Number(tmdbId),
                    name: person?.name,
                    profilePath: person?.profile_path,
                    acting: data.acting,
                    charisma: data.charisma,
                    voice: data.voice,
                    rangeScore: data.rangeScore,
                    comment: data.comment,
                }),
            });
            if (!res.ok) throw new Error("Failed to save rating");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["person-ratings", tmdbId] });
        },
    });

    if (personLoading) {
        return (
            <div className="container flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-neon" />
            </div>
        );
    }

    if (!person) {
        return (
            <div className="container py-20 text-center">
                <h1 className="font-display text-2xl font-bold">Kişi bulunamadı</h1>
                <Button asChild className="mt-4">
                    <Link href="/">Ana Sayfa</Link>
                </Button>
            </div>
        );
    }

    const aggregate = ratingsData?.aggregate;
    const profileUrl = person.profile_path
        ? `https://image.tmdb.org/t/p/w300${person.profile_path}`
        : null;

    return (
        <div className="container py-8 pb-20 md:pb-8">
            <Link
                href="/"
                className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-neon"
            >
                <ArrowLeft className="h-4 w-4" />
                Geri
            </Link>

            <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
                {/* Left: Profile */}
                <div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="overflow-hidden rounded-xl bg-surface-1"
                    >
                        {profileUrl ? (
                            <Image
                                src={profileUrl}
                                alt={person.name}
                                width={300}
                                height={450}
                                className="w-full object-cover"
                            />
                        ) : (
                            <div className="flex aspect-[2/3] items-center justify-center bg-surface-2">
                                <User className="h-20 w-20 text-muted-foreground/30" />
                            </div>
                        )}
                    </motion.div>

                    {/* Quick Stats */}
                    <div className="mt-4 space-y-2">
                        <Badge variant="secondary">{person.known_for_department}</Badge>
                        {person.birthday && (
                            <p className="text-sm text-muted-foreground">
                                🎂 {new Date(person.birthday).toLocaleDateString("tr-TR")}
                            </p>
                        )}
                        {person.place_of_birth && (
                            <p className="text-sm text-muted-foreground">
                                📍 {person.place_of_birth}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right: Content */}
                <div className="space-y-8">
                    <div>
                        <h1 className="font-display text-3xl font-bold md:text-4xl">
                            {person.name}
                        </h1>
                        {person.biography && (
                            <p className="mt-4 text-muted-foreground line-clamp-4">
                                {person.biography}
                            </p>
                        )}
                    </div>

                    {/* Community Ratings */}
                    {aggregate && aggregate.rating_count > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl border border-border bg-surface-1 p-6"
                        >
                            <h2 className="mb-4 font-display text-xl font-semibold">
                                Topluluk Puanları
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    ({aggregate.rating_count} değerlendirme)
                                </span>
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                                {TRAITS.map((trait) => {
                                    const key = trait.key === "rangeScore" ? "avg_range" : `avg_${trait.key}`;
                                    const value = aggregate[key];
                                    return (
                                        <div
                                            key={trait.key}
                                            className="rounded-lg bg-surface-2 p-4 text-center"
                                        >
                                            <p className="text-sm text-muted-foreground">{trait.label}</p>
                                            <p className="mt-1 font-display text-2xl font-bold text-neon">
                                                {value || "-"}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-4 text-center">
                                <p className="text-sm text-muted-foreground">Genel Ortalama</p>
                                <p className="font-display text-3xl font-bold text-turquoise">
                                    {aggregate.avg_overall || "-"}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Rating Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-xl border border-border bg-surface-1 p-6"
                    >
                        <h2 className="mb-4 font-display text-xl font-semibold">
                            Değerlendir
                        </h2>
                        <div className="space-y-6">
                            {TRAITS.map((trait) => (
                                <div key={trait.key}>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="text-sm font-medium">
                                            {trait.label}
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                {trait.description}
                                            </span>
                                        </label>
                                        <span className="font-display text-lg font-bold text-neon">
                                            {rating[trait.key as keyof Rating]}
                                        </span>
                                    </div>
                                    <Slider
                                        value={[rating[trait.key as keyof Rating] as number]}
                                        onValueChange={([value]) =>
                                            setRating({ ...rating, [trait.key]: value })
                                        }
                                        min={0}
                                        max={10}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>
                            ))}

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Yorum (opsiyonel)
                                </label>
                                <Textarea
                                    value={rating.comment}
                                    onChange={(e) => setRating({ ...rating, comment: e.target.value })}
                                    placeholder="Bu oyuncu hakkındaki düşünceleriniz..."
                                    rows={3}
                                />
                            </div>

                            <Button
                                className="w-full"
                                onClick={() => submitRating.mutate(rating)}
                                disabled={submitRating.isPending}
                            >
                                {submitRating.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Star className="mr-2 h-4 w-4" />
                                )}
                                Puanla
                            </Button>
                        </div>
                    </motion.div>

                    {/* Known For */}
                    {person.credits.cast.length > 0 && (
                        <div>
                            <h2 className="mb-4 font-display text-xl font-semibold">
                                Bilinen Yapımlar
                            </h2>
                            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
                                {person.credits.cast.slice(0, 16).map((credit: any) => (
                                    <Link
                                        key={credit.credit_id}
                                        href={`/media/${credit.media_type}/${credit.id}`}
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            className="group relative aspect-[2/3] overflow-hidden rounded-lg bg-surface-2"
                                        >
                                            {credit.poster_path ? (
                                                <Image
                                                    src={`https://image.tmdb.org/t/p/w185${credit.poster_path}`}
                                                    alt={credit.title || credit.name}
                                                    fill
                                                    className="object-cover transition-transform group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center">
                                                    <Film className="h-6 w-6 text-muted-foreground/30" />
                                                </div>
                                            )}
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

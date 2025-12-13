import { z } from "zod";

// Auth schemas
export const signUpSchema = z.object({
    email: z.string().email("Geçerli bir e-posta adresi girin"),
    password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
    username: z
        .string()
        .min(3, "Kullanıcı adı en az 3 karakter olmalıdır")
        .max(20, "Kullanıcı adı en fazla 20 karakter olabilir")
        .regex(/^[a-zA-Z0-9_]+$/, "Sadece harf, rakam ve alt çizgi kullanabilirsiniz"),
    displayName: z.string().min(1, "Görünen ad zorunludur").max(50),
});

export const signInSchema = z.object({
    email: z.string().email("Geçerli bir e-posta adresi girin"),
    password: z.string().min(1, "Şifre zorunludur"),
});

// Tier List schemas
export const tierSchema = z.object({
    id: z.string(),
    name: z.string().min(1).max(20),
    color: z.string(),
    items: z.array(z.string()), // Array of media IDs
});

export const tierListSchema = z.object({
    title: z.string().min(1, "Başlık zorunludur").max(100),
    description: z.string().max(500).optional(),
    visibility: z.enum(["public", "unlisted", "private"]),
    tiers: z.array(tierSchema),
    mediaType: z.enum(["movie", "tv", "mixed"]).optional(),
});

export const createTierListSchema = tierListSchema;

// Rating schema
export const ratingSchema = z.object({
    rating: z.number().min(0).max(10).step(0.5),
    shortNote: z.string().max(280).optional(),
});

// Review schema
export const reviewSchema = z.object({
    content: z.string().min(10, "İnceleme en az 10 karakter olmalıdır").max(5000),
    hasSpoilers: z.boolean().default(false),
    rating: z.number().min(0).max(10).step(0.5).optional(),
});

// Comment schema
export const commentSchema = z.object({
    content: z.string().min(1, "Yorum boş olamaz").max(1000),
    parentId: z.string().uuid().optional(), // For replies
});

// Report schema
export const reportSchema = z.object({
    targetType: z.enum(["tier_list", "review", "comment", "user"]),
    targetId: z.string().uuid(),
    reason: z.enum([
        "spam",
        "harassment",
        "hate_speech",
        "inappropriate_content",
        "spoilers",
        "other",
    ]),
    details: z.string().max(500).optional(),
});

// Profile settings schema
export const profileSettingsSchema = z.object({
    displayName: z.string().min(1).max(50),
    bio: z.string().max(300).optional(),
    avatarUrl: z.string().url().optional(),
    watchlistPrivacy: z.enum(["public", "followers", "private"]),
    watchedPrivacy: z.enum(["public", "followers", "private"]),
    showEloStats: z.boolean(),
});

// VS Match schema
export const vsMatchSchema = z.object({
    winnerId: z.number(),
    loserId: z.number(),
    mediaType: z.enum(["movie", "tv"]),
    scope: z.enum(["global", "user"]),
    tierListId: z.string().uuid().optional(), // If VS from a tier list
});

// Types
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type TierInput = z.infer<typeof tierSchema>;
export type TierListInput = z.infer<typeof tierListSchema>;
export type RatingInput = z.infer<typeof ratingSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
export type VSMatchInput = z.infer<typeof vsMatchSchema>;

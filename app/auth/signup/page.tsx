"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Check, Eye, EyeOff, Loader2, Lock, Mail, User, X, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const signupSchema = z.object({
    username: z
        .string()
        .min(3, "Kullanıcı adı en az 3 karakter olmalı")
        .max(20, "Kullanıcı adı en fazla 20 karakter olabilir")
        .regex(/^[a-zA-Z0-9_]+$/, "Sadece harf, rakam ve alt çizgi kullanılabilir"),
    email: z.string().email("Geçerli bir e-posta girin"),
    password: z
        .string()
        .min(8, "Şifre en az 8 karakter olmalı")
        .regex(/[A-Z]/, "En az bir büyük harf içermeli")
        .regex(/[a-z]/, "En az bir küçük harf içermeli")
        .regex(/[0-9]/, "En az bir rakam içermeli"),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<SignupForm>({
        resolver: zodResolver(signupSchema),
    });

    const password = watch("password", "");
    const username = watch("username", "");

    // Password strength indicators
    const passwordChecks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
    };

    const checkUsername = async (value: string) => {
        if (value.length < 3) {
            setUsernameAvailable(null);
            return;
        }

        setCheckingUsername(true);
        const supabase = createClient();

        const { data } = await supabase
            .from("profiles")
            .select("username")
            .eq("username", value.toLowerCase())
            .single();

        setUsernameAvailable(!data);
        setCheckingUsername(false);
    };

    const onSubmit = async (data: SignupForm) => {
        setIsLoading(true);
        setError(null);

        const supabase = createClient();

        // Sign up with Supabase Auth
        const { error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    username: data.username.toLowerCase(),
                    display_name: data.username,
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (authError) {
            setError(
                authError.message === "User already registered"
                    ? "Bu e-posta zaten kayıtlı"
                    : authError.message
            );
            setIsLoading(false);
            return;
        }

        // Redirect to verification page
        router.push("/auth/verify");
    };

    const handleGoogleSignup = async () => {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback?signup=true`,
            },
        });
    };

    const handleGithubSignup = async () => {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: `${window.location.origin}/auth/callback?signup=true`,
            },
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-2xl font-display font-bold text-primary">
                            CineTier
                        </span>
                    </Link>
                    <p className="text-muted-foreground mt-2">
                        Zevkini tier&apos;la, VS ile ispatla!
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-surface-1 rounded-2xl p-6 border border-border shadow-xl">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Username */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Kullanıcı Adı
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    {...register("username", {
                                        onChange: (e) => checkUsername(e.target.value),
                                    })}
                                    placeholder="kullanici_adi"
                                    className="pl-10 pr-10"
                                    disabled={isLoading}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {checkingUsername && (
                                        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                                    )}
                                    {!checkingUsername && usernameAvailable === true && (
                                        <Check className="w-5 h-5 text-green-500" />
                                    )}
                                    {!checkingUsername && usernameAvailable === false && (
                                        <X className="w-5 h-5 text-destructive" />
                                    )}
                                </div>
                            </div>
                            {errors.username && (
                                <p className="text-sm text-destructive">{errors.username.message}</p>
                            )}
                            {usernameAvailable === false && (
                                <p className="text-sm text-destructive">Bu kullanıcı adı alınmış</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                E-posta
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    {...register("email")}
                                    type="email"
                                    placeholder="ornek@email.com"
                                    className="pl-10"
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Şifre
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    {...register("password")}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            )}

                            {/* Password Strength */}
                            {password && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className={`text-xs flex items-center gap-1 ${passwordChecks.length ? 'text-green-500' : 'text-muted-foreground'}`}>
                                        {passwordChecks.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                        8+ karakter
                                    </div>
                                    <div className={`text-xs flex items-center gap-1 ${passwordChecks.uppercase ? 'text-green-500' : 'text-muted-foreground'}`}>
                                        {passwordChecks.uppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                        Büyük harf
                                    </div>
                                    <div className={`text-xs flex items-center gap-1 ${passwordChecks.lowercase ? 'text-green-500' : 'text-muted-foreground'}`}>
                                        {passwordChecks.lowercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                        Küçük harf
                                    </div>
                                    <div className={`text-xs flex items-center gap-1 ${passwordChecks.number ? 'text-green-500' : 'text-muted-foreground'}`}>
                                        {passwordChecks.number ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                        Rakam
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Terms */}
                        <p className="text-xs text-muted-foreground">
                            Kayıt olarak{" "}
                            <Link href="/terms" className="text-primary hover:underline">
                                Kullanım Koşulları
                            </Link>
                            &apos;nı ve{" "}
                            <Link href="/privacy" className="text-primary hover:underline">
                                Gizlilik Politikası
                            </Link>
                            &apos;nı kabul etmiş olursunuz.
                        </p>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || usernameAvailable === false}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Kayıt olunuyor...
                                </>
                            ) : (
                                "Kayıt Ol"
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-surface-1 px-2 text-muted-foreground">
                                veya
                            </span>
                        </div>
                    </div>

                    {/* OAuth Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleGoogleSignup}
                            disabled={isLoading}
                            className="w-full"
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Google
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleGithubSignup}
                            disabled={isLoading}
                            className="w-full"
                        >
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.42 22 12c0-5.523-4.477-10-10-10z"
                                />
                            </svg>
                            GitHub
                        </Button>
                    </div>
                </div>

                {/* Login Link */}
                <p className="text-center mt-6 text-muted-foreground">
                    Zaten hesabın var mı?{" "}
                    <Link
                        href="/auth/login"
                        className="text-primary font-medium hover:underline"
                    >
                        Giriş yap
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}

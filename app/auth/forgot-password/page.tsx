"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Loader2, Mail, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const forgotPasswordSchema = z.object({
    email: z.string().email("Geçerli bir e-posta girin"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordForm) => {
        setIsLoading(true);
        setError(null);

        const supabase = createClient();

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            data.email,
            {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            }
        );

        if (resetError) {
            setError(resetError.message);
            setIsLoading(false);
            return;
        }

        setIsSuccess(true);
        setIsLoading(false);
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md text-center"
                >
                    {/* Success Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check className="w-10 h-10 text-green-500" />
                    </div>

                    <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                        E-posta gönderildi!
                    </h1>

                    <p className="text-muted-foreground mb-8">
                        Şifre sıfırlama linki e-postana gönderildi. Spam klasörünü de
                        kontrol etmeyi unutma.
                    </p>

                    <Button asChild variant="outline" className="w-full">
                        <Link href="/auth/login">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Giriş sayfasına dön
                        </Link>
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
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
                    <h1 className="text-xl font-bold text-foreground mt-4">
                        Şifreni mi unuttun?
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        E-postanı gir, sana şifre sıfırlama linki gönderelim.
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-surface-1 rounded-2xl p-6 border border-border shadow-xl">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                        {/* Submit Button */}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Gönderiliyor...
                                </>
                            ) : (
                                "Sıfırlama linki gönder"
                            )}
                        </Button>
                    </form>
                </div>

                {/* Back to Login */}
                <p className="text-center mt-6">
                    <Link
                        href="/auth/login"
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Giriş sayfasına dön
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}

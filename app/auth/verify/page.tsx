"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Zap } from "lucide-react";
import Link from "next/link";

export default function VerifyPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md text-center"
            >
                {/* Logo */}
                <Link href="/" className="inline-flex items-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-2xl font-display font-bold text-primary">
                        CineTier
                    </span>
                </Link>

                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="w-10 h-10 text-primary" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                    E-postanı kontrol et!
                </h1>

                {/* Description */}
                <p className="text-muted-foreground mb-8">
                    Kayıt işlemini tamamlamak için e-postana gönderdiğimiz onay linkine
                    tıkla. Spam klasörünü de kontrol etmeyi unutma!
                </p>

                {/* Actions */}
                <div className="space-y-4">
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/auth/login">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Giriş sayfasına dön
                        </Link>
                    </Button>
                </div>

                {/* Help Text */}
                <p className="text-sm text-muted-foreground mt-8">
                    E-posta gelmedi mi?{" "}
                    <button className="text-primary hover:underline">
                        Tekrar gönder
                    </button>
                </p>
            </motion.div>
        </div>
    );
}

import { CommandPaletteWrapper } from "@/components/layout/command-palette-wrapper";
import { Navbar } from "@/components/layout/navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
    title: {
        default: "CineTier - Film & Dizi Tier Listeleri",
        template: "%s | CineTier",
    },
    description:
        "Zevkini görselleştir, yarıştır, paylaş. Film ve dizi tier listeleri oluştur, VS modunda karşılaştır.",
    keywords: ["tier list", "film", "dizi", "anime", "rating", "vs", "ranking"],
    authors: [{ name: "CineTier" }],
    openGraph: {
        title: "CineTier",
        description: "Film & Dizi Tier Listeleri",
        type: "website",
        locale: "tr_TR",
    },
    twitter: {
        card: "summary_large_image",
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="tr" className="dark">
            <body className="font-sans antialiased scrollbar-thin">
                <Providers>
                    <TooltipProvider>
                        <div className="relative flex min-h-screen flex-col">
                            <Navbar />
                            <main className="flex-1">{children}</main>
                        </div>
                        <CommandPaletteWrapper />
                    </TooltipProvider>
                </Providers>
            </body>
        </html>
    );
}

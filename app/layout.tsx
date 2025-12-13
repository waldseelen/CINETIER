import { CommandPalette } from "@/components/layout/command-palette";
import { Navbar } from "@/components/layout/navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    variable: "--font-space-grotesk",
});

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
            <body
                className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased scrollbar-thin`}
            >
                <Providers>
                    <TooltipProvider>
                        <div className="relative flex min-h-screen flex-col">
                            <Navbar />
                            <main className="flex-1">{children}</main>
                        </div>
                        <CommandPalette />
                    </TooltipProvider>
                </Providers>
            </body>
        </html>
    );
}

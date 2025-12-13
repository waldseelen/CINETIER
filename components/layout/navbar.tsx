"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Compass,
    Home,
    Menu,
    PlusCircle,
    Rss,
    Search,
    Swords,
    Trophy,
    User,
    X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NotificationBell } from "./notification-bell";

const navLinks = [
    { href: "/", label: "Ana Sayfa", icon: Home },
    { href: "/explore", label: "Keşfet", icon: Compass },
    { href: "/vs", label: "VS", icon: Swords },
    { href: "/leaderboard", label: "Sıralama", icon: Trophy },
    { href: "/feed", label: "Akış", icon: Rss },
];

export function Navbar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            {/* Desktop navbar */}
            <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
                <nav className="container flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="font-display text-2xl font-bold text-gradient-neon transition-transform duration-200 hover:scale-105">
                            CineTier
                        </div>
                    </Link>

                    {/* Desktop nav links */}
                    <div className="hidden items-center gap-1 md:flex">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            const Icon = link.icon;

                            return (
                                <Link key={link.href} href={link.href}>
                                    <Button
                                        variant={isActive ? "secondary" : "ghost"}
                                        size="sm"
                                        className={cn(
                                            "gap-2",
                                            isActive && "bg-surface-1 text-neon"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {link.label}
                                    </Button>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-2">
                        {/* Search button */}
                        <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
                            <Link href="/search">
                                <Search className="h-5 w-5" />
                            </Link>
                        </Button>

                        {/* Notifications */}
                        <NotificationBell />

                        {/* Create button */}
                        <Link href="/create">
                            <Button variant="neon" size="sm" className="hidden gap-2 md:flex">
                                <PlusCircle className="h-4 w-4" />
                                Oluştur
                            </Button>
                        </Link>

                        {/* Profile/Auth */}
                        <Link href="/settings">
                            <Button variant="ghost" size="icon">
                                <User className="h-5 w-5" />
                            </Button>
                        </Link>

                        {/* Mobile menu toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </nav>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="border-t border-border bg-background p-4 md:hidden animate-fade-in">
                        <div className="flex flex-col gap-2">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                const Icon = link.icon;

                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Button
                                            variant={isActive ? "secondary" : "ghost"}
                                            className={cn(
                                                "w-full justify-start gap-2",
                                                isActive && "bg-surface-1 text-neon"
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {link.label}
                                        </Button>
                                    </Link>
                                );
                            })}
                            <Link href="/create" onClick={() => setMobileMenuOpen(false)}>
                                <Button variant="neon" className="w-full gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    Tier List Oluştur
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* Mobile bottom nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden">
                <div className="flex h-16 items-center justify-around">
                    {[
                        { href: "/", icon: Home, label: "Ana Sayfa" },
                        { href: "/explore", icon: Compass, label: "Keşfet" },
                        { href: "/create", icon: PlusCircle, label: "Oluştur" },
                        { href: "/vs", icon: Swords, label: "VS" },
                        { href: "/settings", icon: User, label: "Profil" },
                    ].map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
                                    isActive ? "text-neon" : "text-muted-foreground"
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "h-5 w-5",
                                        link.href === "/create" &&
                                        "rounded-full bg-neon p-1 text-cinetier-bg-0 h-7 w-7"
                                    )}
                                />
                                <span>{link.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}

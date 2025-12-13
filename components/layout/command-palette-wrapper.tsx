"use client";

import dynamic from "next/dynamic";

// Lazy load CommandPalette - keyboard shortcut ile açılacak
const CommandPaletteComponent = dynamic(
    () => import("@/components/layout/command-palette").then((mod) => mod.CommandPalette),
    { ssr: false }
);

export function CommandPaletteWrapper() {
    return <CommandPaletteComponent />;
}

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";

// Lazy load devtools for development only
const ReactQueryDevtools =
    process.env.NODE_ENV === "development"
        ? dynamic(
            () =>
                import("@tanstack/react-query-devtools").then(
                    (mod) => mod.ReactQueryDevtools
                ),
            { ssr: false }
        )
        : () => null;

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        gcTime: 10 * 60 * 1000, // 10 minutes
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}

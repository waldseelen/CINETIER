import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const isSignup = requestUrl.searchParams.get("signup") === "true";

    if (code) {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data.user) {
            // Check if user has a profile (new OAuth user)
            const { data: profile } = await supabase
                .from("profiles")
                .select("id")
                .eq("id", data.user.id)
                .single();

            // If no profile exists (new OAuth signup), create one
            if (!profile && isSignup) {
                const username = data.user.email?.split("@")[0] || `user_${Date.now()}`;
                const displayName =
                    data.user.user_metadata?.full_name ||
                    data.user.user_metadata?.name ||
                    username;

                await supabase.from("profiles").insert({
                    id: data.user.id,
                    username: username.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 20),
                    display_name: displayName.slice(0, 50),
                    avatar_url: data.user.user_metadata?.avatar_url,
                } as any);
            }
        }
    }

    // Redirect to home page
    return NextResponse.redirect(new URL("/", requestUrl.origin));
}

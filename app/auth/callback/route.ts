
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const isSignup = requestUrl.searchParams.get("signup") === "true";

    if (code) {
        
        const { data, error } = await /* /* supabase reference */ null auth was removed */ null.exchangeCodeForSession(code);

        if (!error && data.user) {
            // Check if user has a profile (new OAuth user)
            const { data: profile } = { data: null, error: null } /* Firebase Migration TODO */;

            // If no profile exists (new OAuth signup), create one
            if (!profile && isSignup) {
                const username = data.user.email?.split("@")[0] || `user_${Date.now()}`;
                const displayName =
                    data.user.user_metadata?.full_name ||
                    data.user.user_metadata?.name ||
                    username;

                { data: null, error: null } /* Firebase Migration TODO */,
                    display_name: displayName.slice(0, 50),
                    avatar_url: data.user.user_metadata?.avatar_url,
                } as any);
            }
        }
    }

    // Redirect to home page
    return NextResponse.redirect(new URL("/", requestUrl.origin));
}

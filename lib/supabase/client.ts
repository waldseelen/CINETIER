import type { Database } from "@/types/supabase";
import { createBrowserClient } from "@supabase/ssr";

const isSupabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createStubClient() {
    const defaultResponse = Promise.resolve({
        data: null,
        error: null,
        count: null,
    });

    const queryBuilder: any = {
        select: () => queryBuilder,
        insert: () => queryBuilder,
        upsert: () => queryBuilder,
        update: () => queryBuilder,
        delete: () => queryBuilder,
        eq: () => queryBuilder,
        neq: () => queryBuilder,
        in: () => queryBuilder,
        not: () => queryBuilder,
        or: () => queryBuilder,
        order: () => queryBuilder,
        range: () => queryBuilder,
        limit: () => queryBuilder,
        single: () => defaultResponse,
        maybeSingle: () => defaultResponse,
        then: (...args: any[]) => defaultResponse.then(...args),
        catch: (...args: any[]) => defaultResponse.catch(...args),
        finally: (...args: any[]) => defaultResponse.finally(...args),
    };

    return {
        auth: {
            getUser: async () => ({ data: { user: null }, error: null }),
            getSession: async () => ({ data: { session: null }, error: null }),
            signInWithPassword: async () => ({
                data: { session: null, user: null },
                error: new Error("Supabase environment variables are missing or invalid"),
            }),
            signInWithOAuth: async () => ({
                data: null,
                error: new Error("Supabase environment variables are missing or invalid"),
            }),
            signUp: async () => ({
                data: { user: null, session: null },
                error: new Error("Supabase environment variables are missing or invalid"),
            }),
            resetPasswordForEmail: async () => ({
                data: {},
                error: new Error("Supabase environment variables are missing or invalid"),
            }),
            signOut: async () => ({ error: null }),
            exchangeCodeForSession: async () => ({
                data: { session: null, user: null },
                error: new Error("Supabase environment variables are missing or invalid"),
            }),
        },
        from: () => queryBuilder,
    } as any;
}

export function createClient() {
    if (!isSupabaseConfigured) {
        return createStubClient();
    }

    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// Singleton for client-side
let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
    if (!client) {
        client = createClient();
    }
    return client;
}

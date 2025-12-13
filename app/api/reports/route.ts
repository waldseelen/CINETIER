import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetType, targetId, reason } = body;

    if (!targetType || !targetId) {
        return NextResponse.json({ error: "targetType and targetId required" }, { status: 400 });
    }

    const validTargetTypes = ["comment", "review", "tier_list", "profile"];
    if (!validTargetTypes.includes(targetType)) {
        return NextResponse.json({ error: "Invalid target type" }, { status: 400 });
    }

    const { data, error } = await (supabase
        .from("reports") as any)
        .insert({
            reporter_id: user.id,
            target_type: targetType,
            target_id: targetId,
            reason: reason || null,
            status: "open",
        })
        .select()
        .single();

    if (error) {
        console.error("Report error:", error);
        return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
    }

    return NextResponse.json({ success: true, report: data });
}

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admins to view reports (check for admin role if you have one)
    // For now, users can only see their own reports
    const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
    }

    return NextResponse.json({ reports: data });
}

import { createClient } from "@/lib/supabase/server";
import { ImageResponse } from "next/og";

export const runtime = "edge";

const TIER_COLORS: Record<string, string> = {
    S: "#ff4d4f",
    A: "#fa8c16",
    B: "#fadb14",
    C: "#52c41a",
    D: "#1890ff",
    F: "#722ed1",
};

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "twitter"; // twitter | instagram

    // Dimensions based on format
    const dimensions = {
        twitter: { width: 1200, height: 675 },
        instagram: { width: 1080, height: 1350 },
    }[format] || { width: 1200, height: 675 };

    try {
        const supabase = await createClient();

        // Fetch tier list with items
        const { data: tierList, error } = await supabase
            .from("tier_lists")
            .select(`
                *,
                profiles:user_id (username, display_name, avatar_url),
                tier_list_items (
                    tier_key,
                    position,
                    media:media_id (title, poster_path)
                )
            `)
            .eq("id", id)
            .single();

        if (error || !tierList) {
            return new Response("Tier list not found", { status: 404 });
        }

        // Group items by tier
        const itemsByTier: Record<string, any[]> = {};
        const items = (tierList as any).tier_list_items || [];
        items.forEach((item: any) => {
            if (!itemsByTier[item.tier_key]) {
                itemsByTier[item.tier_key] = [];
            }
            itemsByTier[item.tier_key].push(item);
        });

        // Sort items within each tier by position
        Object.keys(itemsByTier).forEach((key) => {
            itemsByTier[key].sort((a, b) => a.position - b.position);
        });

        const tiers = (tierList as any).template?.tiers || [
            { key: "S", label: "S", color: "#ff4d4f" },
            { key: "A", label: "A", color: "#fa8c16" },
            { key: "B", label: "B", color: "#fadb14" },
            { key: "C", label: "C", color: "#52c41a" },
            { key: "D", label: "D", color: "#1890ff" },
        ];

        const profile = (tierList as any).profiles;
        const username = profile?.display_name || profile?.username || "Anonymous";

        return new ImageResponse(
            (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        background: "linear-gradient(135deg, #050B08 0%, #0B1F16 50%, #07130E 100%)",
                        padding: format === "instagram" ? "60px" : "40px",
                        fontFamily: "Inter, sans-serif",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: format === "instagram" ? "40px" : "24px",
                        }}
                    >
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span
                                style={{
                                    fontSize: format === "instagram" ? "48px" : "32px",
                                    fontWeight: 700,
                                    color: "#E9FFF4",
                                    marginBottom: "8px",
                                }}
                            >
                                {(tierList as any).title}
                            </span>
                            <span
                                style={{
                                    fontSize: format === "instagram" ? "24px" : "18px",
                                    color: "#A7D6C1",
                                }}
                            >
                                by @{username}
                            </span>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: format === "instagram" ? "28px" : "20px",
                                    fontWeight: 700,
                                    color: "#B8FF4A",
                                }}
                            >
                                CineTier
                            </span>
                        </div>
                    </div>

                    {/* Tier Grid */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: format === "instagram" ? "12px" : "8px",
                            flex: 1,
                        }}
                    >
                        {tiers.map((tier: any) => {
                            const tierItems = itemsByTier[tier.key] || [];
                            const maxItems = format === "instagram" ? 8 : 10;
                            const displayItems = tierItems.slice(0, maxItems);

                            return (
                                <div
                                    key={tier.key}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        background: "rgba(14, 42, 29, 0.6)",
                                        borderRadius: "12px",
                                        padding: format === "instagram" ? "12px" : "8px",
                                    }}
                                >
                                    {/* Tier Label */}
                                    <div
                                        style={{
                                            width: format === "instagram" ? "80px" : "60px",
                                            height: format === "instagram" ? "80px" : "60px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: tier.color || TIER_COLORS[tier.key] || "#666",
                                            borderRadius: "8px",
                                            fontSize: format === "instagram" ? "36px" : "28px",
                                            fontWeight: 700,
                                            color: "#000",
                                        }}
                                    >
                                        {tier.label}
                                    </div>

                                    {/* Items */}
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "6px",
                                            flex: 1,
                                        }}
                                    >
                                        {displayItems.map((item: any, idx: number) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    width: format === "instagram" ? "60px" : "50px",
                                                    height: format === "instagram" ? "80px" : "65px",
                                                    borderRadius: "6px",
                                                    overflow: "hidden",
                                                    background: "#0E2A1D",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                {item.media?.poster_path ? (
                                                    <img
                                                        src={`https://image.tmdb.org/t/p/w92${item.media.poster_path}`}
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "cover",
                                                        }}
                                                    />
                                                ) : (
                                                    <span
                                                        style={{
                                                            fontSize: "10px",
                                                            color: "#6E9B88",
                                                            textAlign: "center",
                                                            padding: "4px",
                                                        }}
                                                    >
                                                        {item.media?.title?.slice(0, 10) || "?"}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {tierItems.length > maxItems && (
                                            <div
                                                style={{
                                                    width: format === "instagram" ? "60px" : "50px",
                                                    height: format === "instagram" ? "80px" : "65px",
                                                    borderRadius: "6px",
                                                    background: "rgba(184, 255, 74, 0.1)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "#B8FF4A",
                                                    fontSize: "14px",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                +{tierItems.length - maxItems}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginTop: format === "instagram" ? "40px" : "24px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: format === "instagram" ? "20px" : "14px",
                                color: "#00F5D4",
                            }}
                        >
                            cinetier.app
                        </span>
                    </div>
                </div>
            ),
            {
                ...dimensions,
            }
        );
    } catch (error) {
        console.error("OG Image error:", error);
        return new Response("Error generating image", { status: 500 });
    }
}

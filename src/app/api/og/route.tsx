import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const title = (url.searchParams.get("title") || "Papás en CDMX").slice(0, 90);
    const subtitle = (url.searchParams.get("subtitle") || "").slice(0, 140);

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    background:
                        "linear-gradient(135deg, #0c2d4d 0%, #163d6a 50%, #0c2d4d 100%)",
                    padding: "70px 80px",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        fontSize: 22,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.85)",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                    }}
                >
                    <span style={{ display: "flex", width: 12, height: 12, borderRadius: 6, background: "#F08C00" }} />
                    Papás en CDMX
                </div>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        marginTop: "auto",
                    }}
                >
                    <div
                        style={{
                            fontSize: title.length > 50 ? 64 : 78,
                            fontWeight: 800,
                            color: "#ffffff",
                            lineHeight: 1.1,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        {title}
                    </div>
                    {subtitle && (
                        <div
                            style={{
                                marginTop: 24,
                                fontSize: 32,
                                fontWeight: 500,
                                color: "rgba(255,255,255,0.7)",
                                lineHeight: 1.3,
                                maxWidth: 1000,
                            }}
                        >
                            {subtitle}
                        </div>
                    )}
                    <div
                        style={{
                            marginTop: 36,
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                        }}
                    >
                        <span
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                background: "#F08C00",
                                color: "#fff",
                                fontSize: 24,
                                fontWeight: 700,
                                borderRadius: 999,
                                padding: "10px 22px",
                            }}
                        >
                            papasencdmx.com
                        </span>
                    </div>
                </div>
            </div>
        ),
        { width: 1200, height: 630 }
    );
}

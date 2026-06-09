import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { email } = await req.json();

    if (!email) {
        return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const res = await fetch(
        `https://api.beehiiv.com/v2/publications/${process.env.BEEHIIV_PUB_ID}/subscriptions`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.BEEHIIV_API_KEY}`,
            },
            body: JSON.stringify({
                email,
                reactivate_existing: false,
                send_welcome_email: true,
            }),
        }
    );

    if (!res.ok) {
        return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}


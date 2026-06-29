import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { session_id } = await req.json();

    if (!session_id) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 });
    }

    const response = await fetch(`${BACKEND}/quotes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": session.userId,
        "X-User-Role": session.role,
      },
      body: JSON.stringify({ session_id }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend /quotes error:", response.status, errorText);
      return NextResponse.json({ error: "Failed to generate quote" }, { status: 502 });
    }

    const data = await response.json();
    // data = { id, content, author, tags, delivery_id }
    return NextResponse.json({
      quote: data.content,
      deliveryId: data.delivery_id,
    });
  } catch (error) {
    console.error("Quote proxy error:", error);
    return NextResponse.json({ error: "Something quiet failed. Try again." }, { status: 500 });
  }
}

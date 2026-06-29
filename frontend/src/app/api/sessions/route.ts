import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  // Verify the user is authenticated — get their ID from the JWT (server-side only)
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { primary, secondary, tertiary } = await req.json();

    if (!primary || !secondary || !tertiary) {
      return NextResponse.json({ error: "primary, secondary, tertiary are required" }, { status: 400 });
    }

    const response = await fetch(`${BACKEND}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": session.userId,
        "X-User-Role": session.role,
      },
      body: JSON.stringify({
        emotions: [
          {
            primary_emotion: primary,
            secondary_emotion: secondary,
            tertiary_emotion: tertiary,
            intensity: 3,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend /sessions error:", response.status, errorText);
      return NextResponse.json({ error: "Failed to create session" }, { status: 502 });
    }

    const data = await response.json();
    // data = { id, user_id, time_of_day, notes, emotion_logs, created_at }
    return NextResponse.json({ session_id: data.id });
  } catch (error) {
    console.error("Sessions proxy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

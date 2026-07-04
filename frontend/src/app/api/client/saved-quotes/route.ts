import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND}/client/saved-quotes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": session.userId,
        "X-User-Role": session.role,
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch saved quotes" }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Saved quotes proxy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

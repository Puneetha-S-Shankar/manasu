import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ deliveryId: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { deliveryId } = await params;
    const { reaction } = await req.json();

    if (!reaction || !["helped", "missed", "saved"].includes(reaction)) {
      return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
    }

    const response = await fetch(`${BACKEND}/quotes/${deliveryId}/react`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reaction }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend /react error:", response.status, errorText);
      return NextResponse.json({ error: "Failed to record reaction" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("React proxy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

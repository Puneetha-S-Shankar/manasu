import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";
const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function proxy(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "therapist") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const backendPath = url.pathname.replace("/api", ""); 
  
  const options: RequestInit = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      "X-User-ID": session.userId,
      "X-User-Role": session.role,
    },
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const text = await req.text();
    if (text) {
      options.body = text;
    }
  }

  try {
    const response = await fetch(`${BACKEND}${backendPath}`, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Proxy error for ${backendPath}:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;

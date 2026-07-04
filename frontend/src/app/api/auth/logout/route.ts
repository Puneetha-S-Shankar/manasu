import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set("auth_token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.set("auth_token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  
  let appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    const forwardedHost = req.headers.get("x-forwarded-host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    appUrl = forwardedHost ? `${proto}://${forwardedHost}` : req.nextUrl.origin;
  }
  
  return NextResponse.redirect(`${appUrl}/login`);
}

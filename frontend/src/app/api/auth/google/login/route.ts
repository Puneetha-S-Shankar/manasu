import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  
  let appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    const forwardedHost = req.headers.get("x-forwarded-host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    appUrl = forwardedHost ? `${proto}://${forwardedHost}` : req.nextUrl.origin;
  }
  
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!clientId) {
    console.error("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID in environment variables.");
    return NextResponse.json(
      { error: "Google OAuth client ID is not configured on the server. Please check your .env file." },
      { status: 500 }
    );
  }

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.append("client_id", clientId);
  googleAuthUrl.searchParams.append("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.append("response_type", "code");
  googleAuthUrl.searchParams.append("scope", "openid email profile");
  googleAuthUrl.searchParams.append("access_type", "offline");
  googleAuthUrl.searchParams.append("prompt", "consent");

  return NextResponse.redirect(googleAuthUrl.toString());
}

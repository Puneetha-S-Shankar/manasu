import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code) {
    console.error("Google OAuth error or missing code:", error);
    return NextResponse.redirect(`${appUrl}/?error=oauth_failed`);
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    console.error("Missing Google Client credentials in environment variables.");
    return NextResponse.redirect(`${appUrl}/?error=server_configuration_error`);
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const tokenErrText = await tokenResponse.text();
      console.error("Failed to exchange code for tokens:", tokenErrText);
      return NextResponse.redirect(`${appUrl}/?error=token_exchange_failed`);
    }

    const { id_token } = await tokenResponse.json();

    if (!id_token) {
      console.error("No id_token returned by Google");
      return NextResponse.redirect(`${appUrl}/?error=no_id_token`);
    }

    // 2. Verify Google ID token using Google API endpoint
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`
    );

    if (!tokenInfoRes.ok) {
      console.error("Failed to verify ID token with Google");
      return NextResponse.redirect(`${appUrl}/?error=invalid_token`);
    }

    const tokenInfo = await tokenInfoRes.json();

    // Verify audience matches our application's Google Client ID
    if (tokenInfo.aud !== clientId) {
      console.error("Google token audience mismatch:", tokenInfo.aud);
      return NextResponse.redirect(`${appUrl}/?error=audience_mismatch`);
    }

    const email = tokenInfo.email;
    const name = tokenInfo.name;

    if (!email) {
      console.error("No email associated with Google account");
      return NextResponse.redirect(`${appUrl}/?error=no_email`);
    }

    // 3. Find or create the user in Neon database via Drizzle
    let existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    let user = existingUser[0];

    if (!user) {
      const inserted = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          name: name || null,
        })
        .returning();
      user = inserted[0];
    }

    // 4. Create custom local session JWT
    const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const sessionToken = await encrypt(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      sessionExpires
    );

    // 5. Store session in HTTP-only Cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: sessionExpires,
      sameSite: "lax",
      path: "/",
    });

    // 6. Redirect to app root — App.tsx detects the session and advances to check-in
    const targetRoute = user.role === "admin" ? "/admin/dashboard" : user.role === "therapist" ? "/therapist/dashboard" : "/check-in";
    return NextResponse.redirect(`${appUrl}${targetRoute}`);
  } catch (err) {
    console.error("Error during Google OAuth callback processing:", err);
    return NextResponse.redirect(`${appUrl}/?error=server_error`);
  }
}

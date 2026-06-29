import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken in request body" }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: "Google client ID not configured on server" }, { status: 500 });
    }

    // 1. Verify Google ID token using Google API
    const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!tokenInfoRes.ok) {
      return NextResponse.json({ error: "Invalid Google ID token" }, { status: 401 });
    }

    const tokenInfo = await tokenInfoRes.json();

    // Verify audience matches our Google Client ID
    if (tokenInfo.aud !== clientId) {
      return NextResponse.json({ error: "Audience mismatch: Token not signed for this app" }, { status: 401 });
    }

    const email = tokenInfo.email;
    const name = tokenInfo.name;

    if (!email) {
      return NextResponse.json({ error: "No email address returned from Google account" }, { status: 400 });
    }

    // 2. Find or create the user in the database
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

    // 3. Generate session JWT
    const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const sessionToken = await encrypt(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role as "client" | "therapist",
      },
      sessionExpires
    );

    // 4. Set the HTTP-only cookie as well (beneficial for WebView hybrid setups)
    const cookieStore = await cookies();
    cookieStore.set("auth_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: sessionExpires,
      sameSite: "lax",
      path: "/",
    });

    // 5. Return the token and user details in the JSON response
    // This allows native Android apps to save the token in secure storage and send it in Authorization headers.
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token: sessionToken,
      expiresAt: sessionExpires.toISOString(),
    });
  } catch (err) {
    console.error("Error verifying native Google token:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

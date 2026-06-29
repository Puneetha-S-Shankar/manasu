import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// Fallback is helpful for development/testing if environment variables are not yet configured.
const JWT_SECRET = process.env.JWT_SECRET || "manasu-secure-jwt-secret-placeholder-minimum-32-chars";
const key = new TextEncoder().encode(JWT_SECRET);

export interface SessionPayload {
  userId: string;
  email: string;
  name?: string | null;
  role: "client" | "therapist";
}

/**
 * Encrypts a payload into a signed JWT token.
 */
export async function encrypt(payload: SessionPayload, expiresAt: Date): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(key);
}

/**
 * Decrypts and verifies a JWT token. Returns the payload or null if invalid.
 */
export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Server-side helper to get the session in Server Components and Server Actions.
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    return await decrypt(token);
  } catch (err) {
    console.error("Failed to read auth session cookie:", err);
    return null;
  }
}

/**
 * Middleware/Route-Handler helper to extract session from cookies or headers.
 * Standardizes compatibility for standard web cookies and native mobile Bearer tokens.
 */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  try {
    // 1. Check cookies first
    let token = req.cookies.get("auth_token")?.value;

    // 2. Fallback to Authorization Header (Bearer token)
    if (!token) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) return null;
    return await decrypt(token);
  } catch (err) {
    console.error("Failed to parse request session:", err);
    return null;
  }
}

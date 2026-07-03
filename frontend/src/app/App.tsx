"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/* Shared logo component                                               */
/* ------------------------------------------------------------------ */
function Logo({ height = 32, width = "auto" }: { height?: number; width?: number | "auto" }) {
  return (
    <img
      src="/images/logos/logo.png"
      alt="ಮನಸು"
      style={{
        height,
        width,
        mixBlendMode: "screen" as const,
        display: "block",
      }}
    />
  );
}

/* ================================================================== */
/* LOGIN SCREEN                                                        */
/* ================================================================== */
function LoginScreen({ error }: { error?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [hov, setHov] = useState(false);

  const errorMessages: Record<string, string> = {
    oauth_failed: "Sign-in was cancelled or failed. Try again.",
    token_exchange_failed: "Could not exchange credentials with Google.",
    invalid_token: "Google token was invalid.",
    no_email: "Your Google account needs an email address.",
    server_configuration_error: "Server configuration error.",
    server_error: "Something went wrong. Please try again.",
  };
  const errorText = error ? (errorMessages[error] ?? "An unexpected error occurred.") : null;

  const handleGoogleSignIn = () => {
    setLoading(true);
    window.location.href = "/api/auth/google/login";
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100vw",
        background: "#1a1614",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, sans-serif",
        animation: "screen-enter 200ms ease-out forwards",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 340,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ marginBottom: "2rem" }}>
          <Logo height={120} />
        </div>

        <p
          style={{
            fontSize: 13,
            letterSpacing: "0.08em",
            color: "rgba(255,255,255,0.35)",
            textAlign: "center",
            margin: "0 0 2.5rem",
          }}
        >
          understand your emotional landscape
        </p>

        {errorText && (
          <div
            style={{
              width: "100%",
              padding: "11px 14px",
              marginBottom: 16,
              background: "rgba(249,112,96,0.1)",
              border: "1px solid rgba(249,112,96,0.25)",
              borderRadius: 10,
              fontSize: 12,
              color: "rgba(249,112,96,0.9)",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            {errorText}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            background: hov ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.92)",
            border: "none",
            borderRadius: 10,
            padding: "13px 16px",
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.65 : 1,
            transition: "background 150ms ease-out, opacity 150ms ease-out",
            fontFamily: "inherit",
          }}
        >
          {loading ? (
            <div
              style={{
                width: 18,
                height: 18,
                border: "2px solid rgba(0,0,0,0.15)",
                borderTopColor: "rgba(0,0,0,0.6)",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }}
            />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.59 5.59 0 0 1 8.4 12.928a5.59 5.59 0 0 1 5.59-5.591c2.146 0 3.965.857 5.3 2.257l3.226-3.226C20.146 4.157 17.3 2.8 13.99 2.8c-6.136 0-11.11 4.973-11.11 11.109s4.973 11.11 11.11 11.11c5.968 0 10.875-4.329 10.875-10.286v-4.448H12.24Z" />
            </svg>
          )}
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "rgba(0,0,0,0.75)",
              letterSpacing: "0.01em",
            }}
          >
            {loading ? "Signing in..." : "Sign in with Google"}
          </span>
        </button>

        <p
          style={{
            marginTop: "1.5rem",
            fontSize: 11,
            color: "rgba(255,255,255,0.2)",
            textAlign: "center",
            lineHeight: 1.6,
            margin: "1.5rem 0 0",
          }}
        >
          Your emotional data is stored privately and never shared.
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/* ROOT APP — strictly handles login & auth routing                    */
/* ================================================================== */
export default function App() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) setOauthError(err);
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "admin") {
        router.replace("/admin/dashboard");
      } else if (user.role === "therapist") {
        router.replace("/therapist/dashboard");
      } else {
        router.replace("/check-in");
      }
    }
  }, [user, isLoading, router]);

  // AuthProvider handles the global loading state, but we can return null here to avoid flashing
  if (isLoading || user) {
    return null;
  }

  return <LoginScreen error={oauthError} />;
}

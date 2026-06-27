"use client";

import { useState, useEffect } from "react";
import CheckIn from "./check-in/CheckIn";

type Screen = "login" | "checkin" | "profile";

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

/* ------------------------------------------------------------------ */
/* Controlled text input                                               */
/* ------------------------------------------------------------------ */
function TextInput({
  type,
  placeholder,
  value,
  onChange,
  style,
}: {
  type: "text" | "email" | "password";
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  style?: React.CSSProperties;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="manasu-input"
      style={{
        width: "100%",
        boxSizing: "border-box",
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${focused ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 10,
        padding: "13px 16px",
        color: "rgba(255,255,255,0.8)",
        fontSize: 14,
        fontFamily: "inherit",
        outline: "none",
        transition: "border-color 150ms ease-out",
        ...style,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Toggle switch                                                       */
/* ------------------------------------------------------------------ */
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div
      role="switch"
      aria-checked={on}
      onClick={onChange}
      style={{
        width: 36,
        height: 20,
        borderRadius: 999,
        background: on ? "#C084FC" : "rgba(255,255,255,0.1)",
        cursor: "pointer",
        position: "relative",
        transition: "background 200ms ease-out",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: on ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "white",
          transition: "left 200ms ease-out",
        }}
      />
    </div>
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
        {/* Logo — centred, large */}
        <div style={{ marginBottom: "2rem" }}>
          <Logo height={120} />
        </div>

        {/* Tagline */}
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

        {/* OAuth error */}
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

        {/* Google Sign-In button */}
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

        {/* Privacy note */}
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
/* PROFILE SCREEN                                                      */
/* ================================================================== */
function ProfileScreen({
  onBack,
  onSignOut,
}: {
  onBack: () => void;
  onSignOut: () => void;
}) {
  const [notifications, setNotifications] = useState(false);

  const settingRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    width: "100%",
  };

  const settingLabelStyle: React.CSSProperties = {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "inherit",
  };

  const settingValueStyle: React.CSSProperties = {
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        background: "#1a1614",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflowY: "auto",
      }}
    >
      {/* Navbar — matches check-in navbar exactly */}
      <nav
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.75rem",
          height: 72,
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(26,22,20,0.96)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxSizing: "border-box",
        }}
      >
        <BackArrow onClick={onBack} />
        <Logo height={32} />
        {/* right spacer keeps logo centred */}
        <div style={{ width: 34 }} />
      </nav>

      {/* Scrollable content area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "2rem 2rem 5rem",
          boxSizing: "border-box",
          position: "relative",
        }}
      >

      {/* Avatar */}
      <div
        style={{
          marginTop: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #C084FC, #F9A8C9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 600,
            color: "white",
            fontFamily: "inherit",
          }}
        >
          P
        </div>

        <p
          style={{
            marginTop: "0.75rem",
            fontSize: 18,
            fontWeight: 500,
            color: "rgba(255,255,255,0.8)",
            fontFamily: "inherit",
            margin: "0.75rem 0 0",
          }}
        >
          Puneetha
        </p>

        <p
          style={{
            marginTop: "0.25rem",
            fontSize: 13,
            color: "rgba(255,255,255,0.35)",
            fontFamily: "inherit",
            margin: "0.25rem 0 0",
          }}
        >
          puneetha@gmail.com
        </p>
      </div>

      {/* Stats row */}
      <div
        style={{
          marginTop: "2rem",
          display: "flex",
          gap: "2.5rem",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span className="manasu-stat-num">0</span>
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              fontFamily: "inherit",
            }}
          >
            check-ins
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span className="manasu-stat-num">0</span>
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              fontFamily: "inherit",
            }}
          >
            streak
          </span>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: "100%",
          maxWidth: 320,
          height: 1,
          background: "rgba(255,255,255,0.06)",
          margin: "2rem auto",
        }}
      />

      {/* Settings list */}
      <div style={{ width: "100%", maxWidth: 320 }}>
        {/* Notifications */}
        <div style={settingRowStyle}>
          <span style={settingLabelStyle}>Notifications</span>
          <Toggle
            on={notifications}
            onChange={() => setNotifications((v) => !v)}
          />
        </div>

        {/* Language */}
        <div style={settingRowStyle}>
          <span style={settingLabelStyle}>Language</span>
          <span style={settingValueStyle}>English ›</span>
        </div>

        {/* About */}
        <div style={{ ...settingRowStyle }}>
          <span style={settingLabelStyle}>About</span>
          <span style={settingValueStyle}>›</span>
        </div>

        {/* Sign out */}
        <div
          style={{
            ...settingRowStyle,
            borderBottom: "none",
            cursor: "pointer",
          }}
          onClick={onSignOut}
        >
          <span
            style={{
              ...settingLabelStyle,
              color: "rgba(255,255,255,0.35)",
              cursor: "pointer",
            }}
          >
            Sign out
          </span>
        </div>
      </div>

      {/* Footer */}
      <p
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 11,
          color: "rgba(255,255,255,0.15)",
          textAlign: "center",
          letterSpacing: "0.1em",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
          margin: 0,
        }}
      >
        ಮನಸು v1.0
      </p>
      </div>{/* end content area */}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared back arrow button                                            */
/* ------------------------------------------------------------------ */
function BackArrow({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: 12,
        letterSpacing: "0.06em",
        color: hov ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.38)",
        transition: "color 150ms ease-out",
        fontFamily: "inherit",
        padding: 0,
        lineHeight: 1,
      }}
    >
      ←
    </button>
  );
}

/* ================================================================== */
/* ROOT APP — state machine                                            */
/* ================================================================== */
export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [initializing, setInitializing] = useState(true);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    // Read ?error= param that Google OAuth callback may append
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) setOauthError(err);

    // Check for existing session — if authenticated, skip login screen
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setScreen("checkin");
      })
      .catch(() => {})
      .finally(() => setInitializing(false));
  }, []);

  // Brief loading state while session check runs (prevents login flash)
  if (initializing) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: "#1a1614",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "2px solid rgba(255,255,255,0.1)",
            borderTopColor: "rgba(255,255,255,0.4)",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
      </div>
    );
  }

  if (screen === "login") {
    return <LoginScreen error={oauthError} />;
  }

  if (screen === "checkin") {
    return <CheckIn onProfileClick={() => setScreen("profile")} />;
  }

  if (screen === "profile") {
    return (
      <ProfileScreen
        onBack={() => setScreen("checkin")}
        onSignOut={() => {
          // Clear session cookie then return to login
          fetch("/api/auth/logout").finally(() => setScreen("login"));
        }}
      />
    );
  }

  return null;
}

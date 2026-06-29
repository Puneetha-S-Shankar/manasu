"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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

export default function ProfilePage() {
  const [notifications, setNotifications] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleSignOut = () => {
    fetch("/api/auth/logout").finally(() => {
      window.location.href = "/";
    });
  };

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
        <BackArrow onClick={() => router.back()} />
        <Logo height={32} />
        <div style={{ width: 34 }} />
      </nav>

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
        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {user?.avatarUrl ? (
             <img 
               src={user.avatarUrl} 
               alt={user.name || "Avatar"} 
               style={{ width: 80, height: 80, borderRadius: "50%" }} 
             />
          ) : (
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
              {user?.name?.[0]?.toUpperCase() || "M"}
            </div>
          )}

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
            {user?.name || "Anonymous"}
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
            {user?.email || "No email"}
          </p>
        </div>

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

        <div
          style={{
            width: "100%",
            maxWidth: 320,
            height: 1,
            background: "rgba(255,255,255,0.06)",
            margin: "2rem auto",
          }}
        />

        <div style={{ width: "100%", maxWidth: 320 }}>
          <div style={settingRowStyle}>
            <span style={settingLabelStyle}>Notifications</span>
            <Toggle on={notifications} onChange={() => setNotifications((v) => !v)} />
          </div>

          <div style={settingRowStyle}>
            <span style={settingLabelStyle}>Language</span>
            <span style={settingValueStyle}>English ›</span>
          </div>

          <div style={{ ...settingRowStyle }}>
            <span style={settingLabelStyle}>About</span>
            <span style={settingValueStyle}>›</span>
          </div>

          <div
            style={{
              ...settingRowStyle,
              borderBottom: "none",
              cursor: "pointer",
            }}
            onClick={handleSignOut}
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
      </div>
    </div>
  );
}

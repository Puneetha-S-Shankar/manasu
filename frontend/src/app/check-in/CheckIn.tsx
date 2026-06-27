"use client";

import { useState, useEffect, useCallback } from "react";
import emotionsData from "../../../public/data/emotions.json";

interface EmotionNode {
  name: string;
  tier?: string;
  children?: EmotionNode[];
}

const emotions: EmotionNode[] = emotionsData.children;

/* ------------------------------------------------------------------ */
/* Vivid, saturated primary emotion color map                         */
/* ------------------------------------------------------------------ */
const COLOR_MAP: Record<string, { base: string; text: string }> = {
  Bad:      { base: "#9E9E8C", text: "#1C1C14" },
  Afraid:   { base: "#C084FC", text: "#3B0764" },
  Angry:    { base: "#F97060", text: "#450A0A" },
  Disgust:  { base: "#6EE7B7", text: "#022C22" },
  Sad:      { base: "#7EB8F7", text: "#0C2340" },
  Happy:    { base: "#F9A8C9", text: "#500724" },
  Surprise: { base: "#FBB045", text: "#431407" },
};

/* ------------------------------------------------------------------ */
/* Color helpers                                                       */
/* ------------------------------------------------------------------ */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => Math.min(255, Math.max(0, Math.round(c))))
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")
  );
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* Painted radial-gradient feel: bright center, slightly deeper edge */
function makeBubbleGradient(hex: string, opacity = 1): string {
  if (opacity < 1) {
    return `radial-gradient(circle at 38% 35%, ${withAlpha(hex, opacity)} 0%, ${withAlpha(darken(hex, 0.15), opacity)} 100%)`;
  }
  return `radial-gradient(circle at 38% 35%, ${hex} 0%, ${darken(hex, 0.15)} 100%)`;
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function NavBar({ onProfileClick }: { onProfileClick?: () => void }) {
  return (
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
      }}
    >
      <img
        src="/images/logos/logo.png"
        alt="ಮನಸು"
        style={{ height: 32, width: "auto", display: "block" }}
      />

      <button
        onClick={onProfileClick}
        aria-label="Profile"
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #C084FC, #F9A8C9)",
          border: "none",
          cursor: onProfileClick ? "pointer" : "default",
          fontSize: 13,
          fontWeight: 600,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "inherit",
          opacity: onProfileClick ? 1 : 0.5,
          transition: "opacity 150ms ease-out, transform 150ms ease-out",
        }}
      >
        P
      </button>
    </nav>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: "2rem" }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            width: 24,
            height: 3,
            borderRadius: 2,
            background: i <= step ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.12)",
            transition: "background 200ms ease-out",
          }}
        />
      ))}
    </div>
  );
}

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        marginBottom: "1.25rem",
        alignSelf: "flex-start" as const,
        fontSize: 12,
        letterSpacing: "0.06em",
        color: hovered ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.38)",
        transition: "color 150ms ease-out",
        fontFamily: "inherit",
      }}
    >
      ← {label}
    </button>
  );
}

function Heading({ text }: { text: string }) {
  return (
    <h2
      style={{
        fontSize: 11,
        letterSpacing: "0.15em",
        textTransform: "uppercase" as const,
        color: "rgba(255,255,255,0.45)",
        textAlign: "center" as const,
        marginBottom: "0.5rem",
        fontWeight: 400,
      }}
    >
      {text}
    </h2>
  );
}

function Breadcrumb({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: "rgba(255,255,255,0.28)",
        letterSpacing: "0.1em",
        textAlign: "center" as const,
        marginBottom: "0.5rem",
      }}
    >
      {text}
    </div>
  );
}

function QuoteSkeleton() {
  const barStyle = (width: string): React.CSSProperties => ({
    width,
    height: 10,
    borderRadius: 4,
    background: "rgba(255,255,255,0.08)",
    animation: "pulse-soft 1.6s ease-in-out infinite",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "1rem 0" }}>
      <div style={barStyle("20%")} />
      <div style={{ ...barStyle("40%"), animationDelay: "0.2s" }} />
      <div style={{ ...barStyle("25%"), animationDelay: "0.4s" }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
export default function CheckIn({ onProfileClick }: { onProfileClick?: () => void }) {
  const [screen, setScreen] = useState(1);
  const [selectedPrimary, setSelectedPrimary] = useState<EmotionNode | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<EmotionNode | null>(null);
  const [selectedTertiary, setSelectedTertiary] = useState<EmotionNode | null>(null);

  const [quote, setQuote] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [logged, setLogged] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  /* Session + delivery tracking */
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [deliveryId, setDeliveryId] = useState<string | null>(null);

  const primaryName = selectedPrimary?.name || "";
  const colors = COLOR_MAP[primaryName] || { base: "#888888", text: "#222222" };

  /* Secondary: same hue at 0.85 opacity — slightly less vivid */
  const secondaryBg = makeBubbleGradient(colors.base, 0.85);
  /* Tertiary: same hue at 0.72 opacity — further muted */
  const tertiaryBg = makeBubbleGradient(colors.base, 0.72);

  /* ---------------------------------------------------------------- */
  /* Session creation + quote fetching                                */
  /* ---------------------------------------------------------------- */

  /* Called once when screen 4 is first entered — creates the session
     then immediately requests a quote for it.                        */
  const createSessionAndFetchQuote = useCallback(async (
    primary: string,
    secondary: string,
    tertiary: string,
  ) => {
    setQuoteLoading(true);
    setQuote(null);
    setDeliveryId(null);

    try {
      // 1. Create session (Next.js route injects user_id from JWT)
      const sessionRes = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primary, secondary, tertiary }),
      });
      if (!sessionRes.ok) throw new Error("Session creation failed");
      const { session_id } = await sessionRes.json();
      setSessionId(session_id);

      // 2. Generate quote for that session
      const quoteRes = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id }),
      });
      const quoteData = await quoteRes.json();
      setQuote(quoteData.quote || quoteData.error || "Something quiet failed. Try again.");
      if (quoteData.deliveryId) setDeliveryId(quoteData.deliveryId);
    } catch {
      setQuote("Something quiet failed. Try again.");
    } finally {
      setQuoteLoading(false);
    }
  }, []);

  /* Called when user taps "Not quite" — re-uses existing session_id */
  const fetchNewQuote = useCallback(async () => {
    if (!sessionId) return;
    setQuoteLoading(true);
    setQuote(null);

    // Record the "missed" reaction on the previous delivery before fetching a new one
    if (deliveryId) {
      fetch(`/api/quote/${deliveryId}/react`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction: "missed" }),
      }).catch(() => {});
    }

    try {
      const quoteRes = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const quoteData = await quoteRes.json();
      setQuote(quoteData.quote || quoteData.error || "Something quiet failed. Try again.");
      if (quoteData.deliveryId) setDeliveryId(quoteData.deliveryId);
    } catch {
      setQuote("Something quiet failed. Try again.");
    } finally {
      setQuoteLoading(false);
    }
  }, [sessionId, deliveryId]);

  /* ---------------------------------------------------------------- */
  /* Screen transitions                                                */
  /* ---------------------------------------------------------------- */
  function goToScreen(n: number) {
    setAnimKey((k) => k + 1);
    setScreen(n);
  }

  function selectPrimary(e: EmotionNode) {
    setSelectedPrimary(e);
    goToScreen(2);
  }

  function selectSecondary(e: EmotionNode) {
    setSelectedSecondary(e);
    goToScreen(3);
  }

  function selectTertiary(e: EmotionNode) {
    setSelectedTertiary(e);
    goToScreen(4);
    // Kick off session creation + quote fetch immediately with the known values
    if (selectedPrimary && selectedSecondary) {
      createSessionAndFetchQuote(
        selectedPrimary.name,
        selectedSecondary.name,
        e.name,
      );
    }
  }

  function goBack(toScreen: number) {
    if (toScreen <= 1) {
      setSelectedPrimary(null);
      setSelectedSecondary(null);
      setSelectedTertiary(null);
    } else if (toScreen === 2) {
      setSelectedSecondary(null);
      setSelectedTertiary(null);
    } else if (toScreen === 3) {
      setSelectedTertiary(null);
    }
    goToScreen(toScreen);
  }

  function handleHelped() {
    // Record positive reaction (fire-and-forget)
    if (deliveryId) {
      fetch(`/api/quote/${deliveryId}/react`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction: "helped" }),
      }).catch(() => {});
    }

    setFadeOut(true);
    setTimeout(() => {
      setLogged(true);
      setFadeOut(false);
    }, 300);
    setTimeout(() => {
      setLogged(false);
      setQuote(null);
      setSessionId(null);
      setDeliveryId(null);
      setSelectedPrimary(null);
      setSelectedSecondary(null);
      setSelectedTertiary(null);
      setScreen(1);
      setAnimKey((k) => k + 1);
    }, 2100);
  }

  function handleNotQuiteClick() {
    fetchNewQuote();
  }

  /* ---------------------------------------------------------------- */
  /* Shared styles                                                     */
  /* ---------------------------------------------------------------- */

  /* Full-viewport column: navbar row on top, content fills the rest */
  const wrapperStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    minHeight: "100dvh",
    width: "100%",
    background: "#1a1614",
    overflowY: "auto",
    overflowX: "hidden",
  };

  /* Grows to fill remaining height and centers its child */
  const contentAreaStyle: React.CSSProperties = {
    flex: 1,
    width: "100%",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: "2rem",
    paddingBottom: "2rem",
    paddingLeft: "2rem",
    paddingRight: "2rem",
    boxSizing: "border-box",
  };

  /* Constrained readable width, centered.
     Uses emerge-from-bubble (scale + blur from click origin) for screens 2-4,
     screen-enter (slide up) for the initial screen 1.                        */
  const innerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "min(520px, calc(100vw - 4rem))",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animation: "screen-enter 260ms ease-out forwards",
  };

  /* ---------------------------------------------------------------- */
  /* Circle button — primary emotions                                  */
  /* ---------------------------------------------------------------- */
  function CircleButton({
    emotion,
    onClick,
  }: {
    emotion: EmotionNode;
    onClick: () => void;
  }) {
    const [hov, setHov] = useState(false);
    const c = COLOR_MAP[emotion.name] || { base: "#888888", text: "#222222" };

    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: "50%",
          fontSize: "clamp(12px, 2.5vw, 16px)",
          fontWeight: 500,
          fontFamily: "inherit",
          textAlign: "center" as const,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: makeBubbleGradient(c.base),
          color: c.text,
          border: `1.5px solid ${withAlpha(c.base, hov ? 0.85 : 0.55)}`,
          cursor: "pointer",
          transition: "transform 150ms ease-out, border-color 150ms ease-out",
          transform: hov ? "scale(1.04)" : "scale(1)",
          boxShadow: "none",
        }}
      >
        {emotion.name}
      </button>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Pill button — secondary / tertiary emotions                       */
  /* ---------------------------------------------------------------- */
  function PillButton({
    emotion,
    bg,
    textColor,
    baseColor,
    onClick,
  }: {
    emotion: EmotionNode;
    bg: string;
    textColor: string;
    baseColor: string;
    onClick: () => void;
  }) {
    const [hov, setHov] = useState(false);

    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          borderRadius: 999,
          padding: "12px 26px",
          fontSize: "clamp(13px, 2vw, 15px)",
          fontWeight: 500,
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          background: bg,
          color: textColor,
          border: `1.5px solid ${withAlpha(baseColor, hov ? 0.85 : 0.55)}`,
          cursor: "pointer",
          transition: "transform 150ms ease-out, border-color 150ms ease-out",
          transform: hov ? "scale(1.04)" : "scale(1)",
          boxShadow: "none",
        }}
      >
        {emotion.name}
      </button>
    );
  }

  /* ================================================================ */
  /* RENDER                                                            */
  /* ================================================================ */
  return (
    <div style={wrapperStyle}>
      <NavBar onProfileClick={onProfileClick} />

      <div style={contentAreaStyle}>
      {/* ============================================================ */}
      {/* SCREEN 1: Primary emotions                                   */}
      {/* ============================================================ */}
      {screen === 1 && (
        <div key={`s1-${animKey}`} style={innerStyle}>
          <Heading text="What are you feeling?" />
          <ProgressBar step={1} />

          {/* flex-wrap centers any number of bubbles naturally */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "clamp(10px, 2.5vw, 18px)",
              width: "100%",
            }}
          >
            {emotions.map((e) => (
              <div
                key={e.name}
                style={{ width: "calc(33.333% - clamp(7px, 1.7vw, 12px))" }}
              >
                <CircleButton emotion={e} onClick={() => selectPrimary(e)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SCREEN 2: Secondary emotions                                 */}
      {/* ============================================================ */}
      {screen === 2 && selectedPrimary && (
        <div key={`s2-${animKey}`} style={innerStyle}>
          <BackButton label={selectedPrimary.name} onClick={() => goBack(1)} />
          <Breadcrumb text={`${selectedPrimary.name} → refine`} />
          <ProgressBar step={2} />
          <Heading text="A little more specific" />
          <div style={{ marginTop: "1.75rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: "100%" }}>
            {selectedPrimary.children?.map((e, idx) => (
              <div
                key={e.name}
                style={{
                  width: "100%",
                  animation: "fade-slide-up 300ms ease-out both",
                  animationDelay: `${idx * 55}ms`,
                }}
              >
                <PillButton
                  emotion={e}
                  bg={secondaryBg}
                  textColor={colors.text}
                  baseColor={colors.base}
                  onClick={() => selectSecondary(e)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SCREEN 3: Tertiary emotions                                  */}
      {/* ============================================================ */}
      {screen === 3 && selectedPrimary && selectedSecondary && (
        <div key={`s3-${animKey}`} style={innerStyle}>
          <BackButton label={selectedSecondary.name} onClick={() => goBack(2)} />
          <Breadcrumb text={`${selectedPrimary.name} → ${selectedSecondary.name} → refine`} />
          <ProgressBar step={3} />
          <Heading text="Almost there" />
          <div style={{ marginTop: "1.75rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: "100%" }}>
            {selectedSecondary.children?.map((e, idx) => (
              <div
                key={e.name}
                style={{
                  width: "100%",
                  animation: "fade-slide-up 300ms ease-out both",
                  animationDelay: `${idx * 55}ms`,
                }}
              >
                <PillButton
                  emotion={e}
                  bg={tertiaryBg}
                  textColor={colors.text}
                  baseColor={colors.base}
                  onClick={() => selectTertiary(e)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SCREEN 4: Quote                                              */}
      {/* ============================================================ */}
      {screen === 4 && selectedPrimary && selectedSecondary && selectedTertiary && (
        <div key={`s4-${animKey}`} style={innerStyle}>
          <BackButton label={selectedTertiary.name} onClick={() => goBack(3)} />
          <ProgressBar step={4} />

          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 18,
              padding: "2rem 2rem 1.5rem",
              width: "100%",
              animation: fadeOut ? "fade-out 300ms ease-out forwards" : undefined,
            }}
          >
            {logged ? (
              <div
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontStyle: "italic",
                  fontSize: 16,
                  color: "rgba(255,255,255,0.55)",
                  textAlign: "center",
                  padding: "2rem 0",
                  animation: "fade-in-up 300ms ease-out forwards",
                }}
              >
                Logged ✓
              </div>
            ) : (
              <>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    color: "rgba(255,255,255,0.22)",
                    textAlign: "center",
                    marginBottom: "1.25rem",
                    textTransform: "uppercase",
                  }}
                >
                  {selectedPrimary.name} · {selectedSecondary.name} · {selectedTertiary.name}
                </div>

                {quoteLoading ? (
                  <QuoteSkeleton />
                ) : (
                  <div
                    style={{
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontSize: 16,
                      lineHeight: 1.8,
                      color: "rgba(255,255,255,0.8)",
                      fontStyle: "italic",
                      textAlign: "center",
                      marginBottom: "1.75rem",
                    }}
                  >
                    {quote}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, width: "100%" }}>
                  <QuoteActionButton
                    label="This helped"
                    variant="primary"
                    onClick={handleHelped}
                    disabled={quoteLoading}
                  />
                  <QuoteActionButton
                    label="Not quite"
                    variant="secondary"
                    onClick={handleNotQuiteClick}
                    disabled={quoteLoading}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </div>{/* end contentAreaStyle */}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quote action button                                                 */
/* ------------------------------------------------------------------ */
function QuoteActionButton({
  label,
  variant,
  onClick,
  disabled,
}: {
  label: string;
  variant: "primary" | "secondary";
  onClick: () => void;
  disabled?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const isPrimary = variant === "primary";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1,
        background: isPrimary
          ? hov ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.09)"
          : hov ? "rgba(255,255,255,0.04)" : "transparent",
        border: isPrimary
          ? "1px solid rgba(255,255,255,0.14)"
          : "1px solid rgba(255,255,255,0.07)",
        color: isPrimary ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.3)",
        borderRadius: 10,
        padding: 11,
        fontSize: 13,
        fontFamily: "inherit",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background 150ms ease-out, opacity 150ms ease-out",
      }}
    >
      {label}
    </button>
  );
}

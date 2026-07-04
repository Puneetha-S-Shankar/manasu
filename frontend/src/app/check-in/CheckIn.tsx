"use client";

import { useState, useEffect, useCallback } from "react";
import emotionsData from "../../../public/data/emotions.json";
import { useRouter } from "next/navigation";
import { Navbar, Footer } from "../App";

interface EmotionNode {
  name: string;
  tier?: string;
  children?: EmotionNode[];
}

const emotions: EmotionNode[] = emotionsData.children;

/* ------------------------------------------------------------------ */
/* Calm Organic Color map                                              */
/* ------------------------------------------------------------------ */
const COLOR_MAP: Record<string, string> = {
  Bad: "var(--emotion-bad)",
  Afraid: "var(--emotion-afraid)",
  Angry: "var(--emotion-angry)",
  Disgust: "var(--emotion-disgust)",
  Sad: "var(--emotion-sad)",
  Happy: "var(--emotion-happy)",
  Surprise: "var(--emotion-surprise)",
};

const BADGE_MAP: Record<string, string> = {
  Bad: "var(--emotion-bad-badge)",
  Afraid: "var(--emotion-afraid-badge)",
  Angry: "var(--emotion-angry-badge)",
  Disgust: "var(--emotion-disgust-badge)",
  Sad: "var(--emotion-sad-badge)",
  Happy: "var(--emotion-happy-badge)",
  Surprise: "var(--emotion-surprise-badge)",
};

function StepIndicator({ step, title, breadcrumb, onBreadcrumbClick }: { step: number; title: string; breadcrumb: string[]; onBreadcrumbClick: (index: number) => void }) {
  return (
    <div className="w-full mb-12 animate-[fadeInUp_0.8s_ease-out_forwards]">
      <div className="flex justify-between items-end mb-3 text-[11px] font-semibold tracking-[0.06em] text-[var(--muted)]">
        <span className="uppercase">Step {step} of 4</span>
        <span>{title}</span>
      </div>
      <div className="w-full h-[3px] bg-[var(--surface-2)] rounded-full overflow-hidden flex">
        <div className="h-full bg-[var(--accent)] transition-all duration-500 ease-out" style={{ width: `${(step / 4) * 100}%` }} />
      </div>
      {breadcrumb.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-[var(--muted)] font-sans">
          {breadcrumb.map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {idx > 0 && <span>→</span>}
              <button 
                onClick={() => onBreadcrumbClick(idx + 1)}
                className="hover:text-[var(--foreground)] transition-colors py-1 cursor-pointer hover:underline"
              >
                {crumb}
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span>→</span>
            <span className="text-[var(--foreground)] font-medium italic">refine</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Heading({ text, subtext }: { text: string; subtext?: string }) {
  return (
    <div className="mb-10 text-left w-full">
      <h2 className="heading text-[28px] md:text-[32px] text-[var(--foreground)] mb-2">
        {text}
      </h2>
      {subtext && (
        <p className="text-[14px] text-[var(--muted)] font-sans">{subtext}</p>
      )}
    </div>
  );
}

function QuoteSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 py-4 w-full">
      <div className="h-2.5 rounded bg-[var(--card-border)] w-[20%]" style={{ animation: "softShimmer 2.2s infinite" }} />
      <div className="h-2.5 rounded bg-[var(--card-border)] w-[40%]" style={{ animation: "softShimmer 2.2s infinite 0.2s" }} />
      <div className="h-2.5 rounded bg-[var(--card-border)] w-[25%]" style={{ animation: "softShimmer 2.2s infinite 0.4s" }} />
    </div>
  );
}

export default function CheckIn() {
  const [screen, setScreen] = useState(1);
  const [selectedPrimary, setSelectedPrimary] = useState<EmotionNode | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<EmotionNode | null>(null);
  const [selectedTertiary, setSelectedTertiary] = useState<EmotionNode | null>(null);

  const [quote, setQuote] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [logged, setLogged] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [deliveryId, setDeliveryId] = useState<string | null>(null);

  const createSessionAndFetchQuote = useCallback(async (
    primary: string,
    secondary: string,
    tertiary: string,
  ) => {
    setQuoteLoading(true);
    setQuote(null);
    setDeliveryId(null);
    setIsSaved(false);

    try {
      const sessionRes = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primary, secondary, tertiary }),
      });
      if (!sessionRes.ok) throw new Error("Session creation failed");
      const { session_id } = await sessionRes.json();
      setSessionId(session_id);

      const quoteRes = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id }),
      });
      const quoteData = await quoteRes.json();
      setQuote(quoteData.quote || quoteData.error || "We're here whenever you're ready.");
      if (quoteData.deliveryId) setDeliveryId(quoteData.deliveryId);
    } catch {
      setQuote("We're here whenever you're ready.");
    } finally {
      setQuoteLoading(false);
    }
  }, []);

  const fetchNewQuote = useCallback(async () => {
    if (!sessionId) return;
    setQuoteLoading(true);
    setQuote(null);
    setIsSaved(false);

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
      setQuote(quoteData.quote || quoteData.error || "We're here whenever you're ready.");
      if (quoteData.deliveryId) setDeliveryId(quoteData.deliveryId);
    } catch {
      setQuote("We're here whenever you're ready.");
    } finally {
      setQuoteLoading(false);
    }
  }, [sessionId, deliveryId]);

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
    if (deliveryId && !isSaved) {
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
    }, 500);
    setTimeout(() => {
      setLogged(false);
      setQuote(null);
      setSessionId(null);
      setDeliveryId(null);
      setIsSaved(false);
      setSelectedPrimary(null);
      setSelectedSecondary(null);
      setSelectedTertiary(null);
      setScreen(1);
      setAnimKey((k) => k + 1);
    }, 2500);
  }

  function handleSave() {
    if (deliveryId) {
      fetch(`/api/quote/${deliveryId}/react`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction: "saved" }),
      }).then(() => {
        setIsSaved(true);
        // Just visually acknowledge
        alert("Quote saved!");
      }).catch(() => {});
    }
  }

  function handleNotQuiteClick() {
    fetchNewQuote();
  }

  const IconBadgeCard = ({ emotion, index }: { emotion: EmotionNode, index: number }) => {
    const isSelected = selectedPrimary?.name === emotion.name;
    const cColor = COLOR_MAP[emotion.name] || "var(--accent)";
    const cBadge = BADGE_MAP[emotion.name] || "var(--accent-dim)";
    
    return (
      <button
        onClick={() => selectPrimary(emotion)}
        className={`calm-card w-full p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 stagger-${index % 4 + 1} ${isSelected ? 'selected' : ''}`}
        style={{
          animation: isSelected ? "none" : "fadeInUp 0.6s ease-out forwards",
        } as React.CSSProperties}
      >
        <div 
          className="w-[var(--icon-badge-size)] h-[var(--icon-badge-size)] rounded-full flex items-center justify-center transition-colors duration-300"
          style={{ backgroundColor: cBadge, color: cColor }}
        >
          {/* Using simple SVG primitive to represent the emotion face abstractly */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            {emotion.name === 'Happy' && <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>}
            {emotion.name === 'Sad' && <path d="M8 16s1.5-2 4-2 4 2 4 2"></path>}
            {emotion.name === 'Angry' && <path d="M16 16s-1.5-2-4-2-4 2-4 2M8 9l2 1M16 9l-2 1"></path>}
            {emotion.name === 'Afraid' && <path d="M8 15h8M9 9h.01M15 9h.01"></path>}
            {emotion.name === 'Surprise' && <circle cx="12" cy="15" r="2"></circle>}
            {emotion.name === 'Disgust' && <path d="M8 15s1.5-1 4-1 4 1 4 1M9 9h.01M15 9h.01"></path>}
            {emotion.name === 'Bad' && <path d="M8 15h8M9 9h.01M15 9h.01"></path>}
          </svg>
        </div>
        <span className="font-sans font-medium text-[15px] text-[var(--muted)]">
          {emotion.name}
        </span>
      </button>
    );
  };

  const ListRowCard = ({ emotion, index, onClick }: { emotion: EmotionNode, index: number, onClick: () => void }) => {
    return (
      <button
        onClick={onClick}
        className={`calm-card w-full py-5 px-6 flex items-center justify-between text-left stagger-${index % 4 + 1}`}
        style={{
          animation: "fadeInUp 0.5s ease-out forwards",
        }}
      >
        <span className="font-sans font-medium text-[15px] text-[var(--foreground)]">{emotion.name}</span>
        <span className="text-[var(--muted)] text-[13px] group-hover:text-[var(--accent)] transition-colors">Select →</span>
      </button>
    );
  };

  return (
    <div className="ambient-bg flex flex-col min-h-[100dvh] w-full text-[var(--foreground)]">
      <Navbar showLinks={true} />

      <main className="flex-1 w-full max-w-[var(--container-max)] mx-auto flex flex-col pt-12 md:pt-20 px-6 pb-24 box-border z-10 relative">
        {screen === 1 && (
          <div key={`s1-${animKey}`} className="w-full flex flex-col">
            <StepIndicator 
              step={1} 
              title="Emotion Identification" 
              breadcrumb={[]} 
              onBreadcrumbClick={goBack} 
            />
            <Heading 
              text="How are you feeling right now?" 
              subtext="Select the emotion that best describes your current state."
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full mt-2">
              {emotions.map((e, idx) => (
                <IconBadgeCard key={e.name} emotion={e} index={idx} />
              ))}
            </div>
          </div>
        )}

        {screen === 2 && selectedPrimary && (
          <div key={`s2-${animKey}`} className="w-full flex flex-col">
            <StepIndicator 
              step={2} 
              title="Refine" 
              breadcrumb={[selectedPrimary.name]} 
              onBreadcrumbClick={goBack} 
            />
            <Heading 
              text="A little more specific" 
              subtext={`You selected ${selectedPrimary.name}. Let's narrow it down.`}
            />
            <div className="flex flex-col gap-3 w-full mt-2">
              {selectedPrimary.children?.map((e, idx) => (
                <ListRowCard key={e.name} emotion={e} index={idx} onClick={() => selectSecondary(e)} />
              ))}
            </div>
          </div>
        )}

        {screen === 3 && selectedPrimary && selectedSecondary && (
          <div key={`s3-${animKey}`} className="w-full flex flex-col">
            <StepIndicator 
              step={3} 
              title="Deep Dive" 
              breadcrumb={[selectedPrimary.name, selectedSecondary.name]} 
              onBreadcrumbClick={goBack} 
            />
            <Heading 
              text="Almost there" 
              subtext="Choose the precise word for what you're experiencing."
            />
            <div className="flex flex-col gap-3 w-full mt-2">
              {selectedSecondary.children?.map((e, idx) => (
                <ListRowCard key={e.name} emotion={e} index={idx} onClick={() => selectTertiary(e)} />
              ))}
            </div>
          </div>
        )}

        {screen === 4 && selectedPrimary && selectedSecondary && selectedTertiary && (
          <div key={`s4-${animKey}`} className="w-full flex flex-col">
            <StepIndicator 
              step={4} 
              title="Reflection" 
              breadcrumb={[]} 
              onBreadcrumbClick={goBack} 
            />
            
            <div className={`calm-card p-10 md:p-12 w-full mt-6 flex flex-col relative overflow-hidden transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`} style={{ backgroundColor: "var(--quote-bg)" }}>
              {logged ? (
                <div className="flex items-center justify-center py-16">
                  <div className="font-sans font-medium text-xl text-[var(--success)] animate-[fadeInUp_0.5s_ease-out_forwards] flex items-center gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Logged
                  </div>
                </div>
              ) : (
                <>
                  <div className="absolute top-6 left-8 text-[120px] leading-none text-[var(--foreground)] opacity-10 font-display select-none">"</div>
                  
                  <button 
                    onClick={handleSave} 
                    disabled={quoteLoading}
                    className="absolute top-8 right-8 text-[var(--muted)] hover:text-[var(--accent)] transition-colors z-20"
                    title="Save Quote"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </button>
                  
                  <div className="flex items-center gap-2 text-[12px] tracking-wide text-[var(--muted)] uppercase font-semibold mb-8 z-10 relative">
                    <span>{selectedPrimary.name}</span>
                    <span>·</span>
                    <span>{selectedSecondary.name}</span>
                    <span>·</span>
                    <span>{selectedTertiary.name}</span>
                  </div>

                  <div className="min-h-[140px] flex items-center justify-center z-10 relative">
                    {quoteLoading ? (
                      <QuoteSkeleton />
                    ) : (
                      <div className="font-display font-medium italic text-2xl md:text-3xl leading-relaxed text-[var(--foreground)] text-center w-full">
                        {quote}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full mt-12 z-10 relative">
                    <button
                      onClick={handleHelped}
                      disabled={quoteLoading}
                      className="calm-button w-full opacity-90 hover:opacity-100 disabled:opacity-50 text-[15px]"
                    >
                      This helped
                    </button>
                    <button
                      onClick={handleNotQuiteClick}
                      disabled={quoteLoading}
                      className="w-full bg-transparent border border-[var(--card-border)] rounded-full text-[var(--foreground)] py-3 px-6 hover:bg-[var(--card-hover)] transition-colors disabled:opacity-50 font-sans font-medium text-[15px]"
                    >
                      Not quite
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

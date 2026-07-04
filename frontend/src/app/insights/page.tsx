"use client";

import { useEffect, useState } from "react";
import { Navbar, Footer } from "../App";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

export default function InsightsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  const [trends, setTrends] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    
    // Fetch trends
    fetch("/api/client/insights/trends", { cache: "no-store", headers: { "Cache-Control": "no-cache" } })
      .then(res => res.json())
      .then(data => {
        setTrends(Array.isArray(data) ? data : []);
        setLoadingTrends(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingTrends(false);
      });

    // Fetch AI Summary
    fetch("/api/client/insights/summary", { cache: "no-store", headers: { "Cache-Control": "no-cache" } })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to generate summary");
        }
        return res.json();
      })
      .then(data => {
        setSummary(data);
        setLoadingSummary(false);
      })
      .catch(err => {
        console.error("Summary error:", err);
        setSummaryError(err.message);
        setLoadingSummary(false);
      });
  }, [user]);

  const getColor = (primaryEmotion: string | null) => {
    if (!primaryEmotion) return "var(--card-border)";
    const map: Record<string, string> = {
      Bad: "var(--emotion-bad)",
      Afraid: "var(--emotion-afraid)",
      Angry: "var(--emotion-angry)",
      Disgust: "var(--emotion-disgust)",
      Sad: "var(--emotion-sad)",
      Happy: "var(--emotion-happy)",
      Surprise: "var(--emotion-surprise)",
    };
    return map[primaryEmotion] || "var(--accent)";
  };

  if (isLoading || !user) return <div className="ambient-bg" />;

  return (
    <div className="ambient-bg flex flex-col min-h-[100dvh] w-full text-[var(--foreground)]">
      <Navbar showLinks={true} />

      <main className="flex-1 w-full max-w-[var(--container-max)] mx-auto flex flex-col pt-12 md:pt-20 px-6 pb-24 box-border z-10 relative">
        
        <div className="mb-10">
          <h1 className="heading text-[32px] text-[var(--foreground)] mb-2 animate-[fadeInUp_0.4s_ease-out_forwards]">Your Insights</h1>
          <p className="text-[15px] text-[var(--muted)] animate-[fadeInUp_0.5s_ease-out_forwards]">A deeper look into your emotional landscape.</p>
        </div>

        <div className="flex flex-col gap-10 w-full animate-[fadeInUp_0.6s_ease-out_forwards]">
          
          {/* AI SUMMARY SECTION */}
          <section className="flex flex-col gap-4">
            <h3 className="heading text-[20px] text-[var(--foreground)] flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              Weekly Reflection
            </h3>
            
            <div className="calm-card w-full p-8 relative overflow-hidden">
              {loadingSummary ? (
                <div className="flex flex-col gap-4 w-full">
                  <div className="h-4 bg-[var(--card-border)] rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-[var(--card-border)] rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-[var(--card-border)] rounded w-5/6 animate-pulse"></div>
                  <div className="mt-4 flex gap-2">
                    <div className="h-6 bg-[var(--card-border)] rounded-full w-24 animate-pulse"></div>
                    <div className="h-6 bg-[var(--card-border)] rounded-full w-20 animate-pulse"></div>
                  </div>
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
                </div>
              ) : summaryError ? (
                <div className="text-[14px] text-[var(--muted)] italic">
                  {summaryError === "Not enough check-ins in the last 7 days to generate a summary." 
                    ? "Check in a few times this week to unlock your AI reflection."
                    : "Could not generate reflection at this time. Please try again later."}
                </div>
              ) : summary ? (
                <div className="flex flex-col gap-6 relative z-10">
                  <p className="text-[15px] leading-relaxed text-[var(--foreground)]">
                    {summary.summary}
                  </p>
                  
                  {summary.triggers && summary.triggers.length > 0 && (
                    <div className="flex flex-col gap-3 pt-4 border-t border-[var(--card-border)]">
                      <span className="text-[12px] uppercase tracking-wider text-[var(--muted)] font-semibold">Noticed Patterns</span>
                      <div className="flex flex-wrap gap-2">
                        {summary.triggers.map((trigger: string, idx: number) => (
                          <span key={idx} className="text-[13px] px-3 py-1 bg-[var(--background)] border border-[var(--card-border)] rounded-full text-[var(--foreground)]">
                            {trigger}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </section>

          {/* MOOD TRENDS SECTION */}
          <section className="flex flex-col gap-4">
            <h3 className="heading text-[20px] text-[var(--foreground)]">14-Day Mood Trend</h3>
            
            <div className="calm-card w-full p-8">
              {loadingTrends ? (
                <div className="w-full h-40 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[var(--card-border)] border-t-[var(--accent)] rounded-full animate-spin" />
                </div>
              ) : trends.length === 0 ? (
                <div className="w-full h-40 flex items-center justify-center text-[14px] text-[var(--muted)] italic">
                  No mood data available yet.
                </div>
              ) : (
                <div className="flex items-end justify-between h-48 gap-2 mt-4">
                  {trends.map((point, idx) => {
                    const intensity = point.avg_intensity || 1;
                    const height = `${Math.max((intensity / 5) * 100, 15)}%`; // min height for empty days
                    const color = getColor(point.primary_emotion);
                    const dateObj = new Date(point.date);
                    const isToday = new Date().toDateString() === dateObj.toDateString();
                    
                    return (
                      <div key={idx} className="flex flex-col items-center justify-end gap-3 flex-1 h-full group relative">
                        {/* Tooltip */}
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--foreground)] text-[var(--background)] text-[11px] px-2 py-1 rounded pointer-events-none whitespace-nowrap z-20">
                          {point.date} {point.primary_emotion ? `· ${point.primary_emotion}` : ''}
                        </div>
                        
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height, opacity: 1 }}
                          transition={{ delay: idx * 0.05, type: "spring", stiffness: 100, damping: 15 }}
                          className="w-full rounded-full transition-all duration-300 group-hover:opacity-80"
                          style={{ 
                            backgroundColor: color,
                            minWidth: '4px'
                          }}
                        />
                        <div className={`text-[10px] ${isToday ? 'text-[var(--accent)] font-bold' : 'text-[var(--muted)]'}`}>
                          {dateObj.toLocaleDateString('en-US', { weekday: 'narrow' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Navbar, Footer } from "../App";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [savedQuotes, setSavedQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    
    Promise.all([
      fetch("/api/client/history").then(res => res.json()),
      fetch("/api/client/saved-quotes").then(res => res.json())
    ]).then(([historyData, quotesData]) => {
      setHistory(Array.isArray(historyData) ? historyData.slice(0, 7).reverse() : []);
      setSavedQuotes(Array.isArray(quotesData) ? quotesData : []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [user]);

  const getColor = (primaryEmotion: string) => {
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

      <main className="flex-1 w-full max-w-[var(--container-max)] mx-auto flex flex-col pt-12 md:pt-20 px-6 pb-24 box-border z-10 relative animate-[fadeInUp_0.6s_ease-out_forwards]">
        
        {/* Call to action */}
        <div className="calm-card w-full p-8 mb-10 flex flex-col items-center text-center">
          <h2 className="heading text-[24px] text-[var(--foreground)] mb-2">How are you feeling today?</h2>
          <p className="text-[14px] text-[var(--muted)] mb-6">Take a moment to check in with yourself.</p>
          <Link href="/check-in" className="calm-button w-full sm:w-auto px-10 text-center">
            Check in today
          </Link>
        </div>

        {loading ? (
          <div className="w-full flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-[var(--card-border)] border-t-[var(--accent)] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            
            {/* Mood Journey */}
            <div className="w-full flex flex-col gap-4">
              <h3 className="heading text-[20px] text-[var(--foreground)]">Mood Journey</h3>
              <p className="text-[13px] text-[var(--muted)] -mt-3">Your last 7 check-ins.</p>
              
              <div className="calm-card w-full p-6 flex flex-col h-full min-h-[200px] justify-end relative">
                {history.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-[13px] text-[var(--muted)] italic">
                    No data yet.
                  </div>
                ) : (
                  <div className="flex items-end justify-between h-32 gap-2">
                    {history.map((session, idx) => {
                      const primary = session.emotion_logs[0]?.primary_emotion;
                      const intensity = session.emotion_logs[0]?.intensity || 3;
                      const height = `${(intensity / 5) * 100}%`;
                      
                      return (
                        <div key={session.id} className="flex flex-col items-center gap-2 flex-1 group">
                          <div 
                            className="w-full rounded-full transition-all duration-300 group-hover:opacity-80"
                            style={{ 
                              backgroundColor: getColor(primary), 
                              height,
                              minHeight: '20%'
                            }}
                            title={`${primary} (Intensity: ${intensity})`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Saved Quotes */}
            <div className="w-full flex flex-col gap-4">
              <h3 className="heading text-[20px] text-[var(--foreground)]">Saved Quotes</h3>
              <p className="text-[13px] text-[var(--muted)] -mt-3">Words that resonated with you.</p>
              
              <div className="flex flex-col gap-3">
                {savedQuotes.length === 0 ? (
                  <div className="calm-card p-6 text-center text-[13px] text-[var(--muted)] italic">
                    You haven't saved any quotes yet.
                  </div>
                ) : (
                  savedQuotes.map((q) => (
                    <div key={q.id} className="calm-card p-5 flex flex-col relative" style={{ backgroundColor: "var(--quote-bg)" }}>
                      <div className="absolute top-2 left-4 text-[40px] leading-none text-[var(--foreground)] opacity-10 font-display select-none">"</div>
                      <div className="font-display font-medium italic text-[16px] leading-relaxed text-[var(--foreground)] relative z-10">
                        {q.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

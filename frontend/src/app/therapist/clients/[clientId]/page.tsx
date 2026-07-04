"use client";

import { useEffect, useState, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User as UserIcon, Send, X, Package } from "lucide-react";

const EMOTION_COLORS: Record<string, string> = {
  Happy:    "#FDE68A",
  Sad:      "#93C5FD",
  Angry:    "#F97060",
  Afraid:   "#C084FC",
  Disgust:  "#6EE7B7",
  Surprise: "#FBB045",
  Content:  "#A5F3FC",
  Bad:      "#CBD5E1",
};

interface EmotionLog {
  id: string;
  primary_emotion: string;
  secondary_emotion: string;
  tertiary_emotion: string | null;
  intensity: number | null;
}

interface Session {
  id: string;
  time_of_day: string | null;
  notes: string | null;
  emotion_logs: EmotionLog[];
  created_at: string;
}

interface DayMoodPoint {
  date: string;
  primary_emotion: string | null;
  avg_intensity: number | null;
}

interface Summary {
  client_id: string;
  client_name: string | null;
  client_email: string;
  linked_since: string;
  total_checkins: number;
  last_checkin: string | null;
  most_frequent_primary: string | null;
  low_mood_streak: number;
  low_mood_days: number;
  has_unread_alert: boolean;
  fourteen_day_trend: DayMoodPoint[];
  recent_sessions: Session[];
}

interface QuotePack {
  id: string;
  name: string;
  tags: string[];
  quote_count: number;
}

export default function ClientDetail({ params }: { params: Promise<{ clientId: string }> }) {
  const unwrappedParams = use(params);
  const clientId = unwrappedParams.clientId;
  
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Push Support Modal state
  const [pushOpen, setPushOpen] = useState(false);
  const [pushTab, setPushTab] = useState<"write" | "pack">("write");
  const [message, setMessage] = useState("");
  const [packs, setPacks] = useState<QuotePack[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(`/api/therapist/clients/${clientId}/summary`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [clientId]);

  const loadPacks = async () => {
    if (packs.length > 0) return;
    setLoadingPacks(true);
    try {
      const res = await fetch("/api/therapist/packs");
      if (res.ok) {
        setPacks(await res.json());
      }
    } finally {
      setLoadingPacks(false);
    }
  };

  useEffect(() => {
    if (pushOpen && pushTab === "pack") {
      loadPacks();
    }
  }, [pushOpen, pushTab]);

  const handleSendPush = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/therapist/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          push_type: "custom",
          content: message,
        }),
      });
      if (res.ok) {
        setPushOpen(false);
        setMessage("");
        setToast(`Support sent to ${summary?.client_name || summary?.client_email}`);
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col p-4 md:p-8 max-w-[1200px] mx-auto w-full gap-6 animate-pulse">
        <div className="h-32 bg-white/[0.04] rounded-[14px]" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="h-24 bg-white/[0.04] rounded-[14px]" />
          <div className="h-24 bg-white/[0.04] rounded-[14px]" />
          <div className="h-24 bg-white/[0.04] rounded-[14px]" />
          <div className="h-24 bg-white/[0.04] rounded-[14px]" />
        </div>
        <div className="h-64 bg-white/[0.04] rounded-[14px]" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex flex-col min-h-full items-center justify-center p-8 text-[var(--foreground)] text-center">
        <div className="text-[16px] text-[var(--muted)] mb-4">Client not found</div>
        <button onClick={() => router.push("/therapist/dashboard")} className="text-[#C084FC] hover:underline">
          Return to dashboard
        </button>
      </div>
    );
  }

  const avatarColor = summary.most_frequent_primary
    ? EMOTION_COLORS[summary.most_frequent_primary] || "rgba(255,255,255,0.08)"
    : "rgba(255,255,255,0.08)";

  const linkedDateStr = new Date(summary.linked_since).toLocaleDateString(undefined, { 
    month: "long", day: "numeric", year: "numeric" 
  });

  // Calculate Avg Intensity (1-5) across the 14 day trend
  const trendIntensities = (summary.fourteen_day_trend || [])
    .filter((pt) => pt.avg_intensity !== null)
    .map((pt) => pt.avg_intensity as number);
  
  const rawAvg = trendIntensities.length > 0 
    ? trendIntensities.reduce((a, b) => a + b, 0) / trendIntensities.length 
    : 0;
  
  const avgIntensityDots = Math.round(rawAvg);

  // Generate exact 14 columns for the chart (pad if backend returned fewer than 14)
  const chartData = [...(summary.fourteen_day_trend || [])];
  while (chartData.length < 14) {
    chartData.unshift({ date: "", primary_emotion: null, avg_intensity: null });
  }
  const last14 = chartData.slice(-14);

  return (
    <div className="flex flex-col min-h-full p-4 md:p-8 text-[var(--foreground)] max-w-[1200px] mx-auto w-full gap-6 pb-24">
      {/* Top Navigation */}
      <button 
        onClick={() => router.push("/therapist/dashboard")}
        className="flex items-center gap-2 text-[13px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* TOP CARD - Header */}
      <div className="w-full bg-white/[0.04] border border-white/[0.07] rounded-[14px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-[#1a1614] font-bold text-lg"
            style={{ background: avatarColor }}
          >
            {summary.client_name?.[0]?.toUpperCase() || summary.client_email[0].toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-[18px] text-[var(--foreground)]/[0.85] font-semibold truncate">
              {summary.client_name || "Unnamed"}
            </h1>
            <div className="text-[12px] text-[var(--foreground)]/[0.35] truncate">{summary.client_email}</div>
            <div className="text-[11px] text-[var(--foreground)]/[0.25] mt-1">Linked since {linkedDateStr}</div>
          </div>
        </div>
        <div className="flex items-center">
          <button 
            onClick={() => setPushOpen(true)}
            className="bg-[#C084FC]/15 border border-[#C084FC]/30 text-[#C084FC] rounded-lg px-[18px] py-[9px] text-[13px] hover:bg-[#C084FC]/25 transition-colors font-medium"
          >
            Push Support
          </button>
          <button className="bg-transparent border border-[var(--card-border)] text-[var(--muted)] rounded-lg px-[18px] py-[9px] text-[13px] hover:bg-[var(--surface-2)] hover:text-[var(--muted)] transition-colors ml-2 font-medium">
            Send Alert
          </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1 */}
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-[14px] p-5 flex flex-col justify-between h-[104px]">
          <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">Total Check-ins</div>
          <div className="font-serif text-[32px] text-[var(--foreground)] leading-none">{summary.total_checkins || 0}</div>
        </div>
        
        {/* Card 2 */}
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-[14px] p-5 flex flex-col justify-between h-[104px]">
          <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">Most Frequent</div>
          <div 
            className="text-[18px] font-medium leading-none"
            style={{ color: avatarColor }}
          >
            {summary.most_frequent_primary || "None"}
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-[14px] p-5 flex flex-col justify-between h-[104px]">
          <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">Avg Intensity</div>
          <div className="flex items-center gap-1.5 pb-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div 
                key={i}
                className={`w-3 h-3 rounded-full ${i <= avgIntensityDots ? "bg-[#C084FC]" : "bg-white/10"}`}
              />
            ))}
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-[14px] p-5 flex flex-col justify-between h-[104px]">
          <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">Low Mood Days</div>
          <div 
            className="text-[32px] font-serif leading-none"
            style={{ color: summary.low_mood_days > 3 ? "#F97060" : "rgba(255,255,255,0.7)" }}
          >
            {summary.low_mood_days || 0}
          </div>
        </div>
      </div>

      {/* 14-DAY MOOD CHART */}
      <div className="w-full bg-white/[0.04] border border-white/[0.07] rounded-[14px] p-6">
        <h2 className="text-[12px] uppercase tracking-[0.1em] text-[var(--muted)] mb-8">14-Day Mood</h2>
        <div className="relative w-full h-[180px]">
          {(summary.fourteen_day_trend || []).length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-[13px] text-[var(--muted)]">
              No check-in data yet
            </div>
          ) : (
            <div className="w-full h-full flex items-end justify-between gap-1 pb-6 px-1">
              {last14.map((pt, i) => {
                const hPercent = pt.avg_intensity ? (pt.avg_intensity / 5) * 100 : 8; // small nub if no data
                const color = pt.primary_emotion ? (EMOTION_COLORS[pt.primary_emotion] || "rgba(255,255,255,0.08)") : "rgba(255,255,255,0.08)";
                const dayLabel = pt.date ? new Date(pt.date).toLocaleDateString('en-US', { weekday: 'short' }) : "";

                return (
                  <div key={i} className="group relative flex flex-col items-center flex-1 h-full justify-end">
                    {/* SVG Bar */}
                    <div className="w-full max-w-[24px] rounded-[4px] transition-all hover:opacity-80" 
                         style={{ height: `${hPercent}%`, background: color }} />
                    
                    {/* X-Axis Label */}
                    <div className="absolute -bottom-6 text-[10px] text-[var(--foreground)]/25">
                      {dayLabel}
                    </div>

                    {/* Tooltip */}
                    {pt.primary_emotion && (
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-max max-w-[150px] bg-[#1f1c19] border border-[var(--card-border)] rounded-lg p-3 text-center shadow-xl">
                        <div className="text-[10px] text-[var(--muted)] mb-1">{pt.date}</div>
                        <div className="text-[13px] font-medium" style={{ color }}>{pt.primary_emotion}</div>
                        {pt.avg_intensity && (
                          <div className="text-[11px] text-[var(--muted)] mt-1">Intensity: {pt.avg_intensity.toFixed(1)}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RECENT SESSIONS */}
      <div className="w-full bg-white/[0.04] border border-white/[0.07] rounded-[14px] flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <h2 className="text-[12px] uppercase tracking-[0.1em] text-[var(--muted)]">Recent Sessions</h2>
        </div>
        
        {!(summary.recent_sessions && summary.recent_sessions.length > 0) ? (
          <div className="py-16 text-center text-[13px] text-[var(--muted)]">
            No sessions yet
          </div>
        ) : (
          <div className="flex flex-col">
            {(summary.recent_sessions || []).map((sess) => {
              const d = new Date(sess.created_at);
              const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
              const timeStr = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
              
              // Map emotions to a trail string, picking the first log's trail for simplicity
              const firstLog = sess.emotion_logs[0];
              let trail = "—";
              if (firstLog) {
                trail = firstLog.primary_emotion;
                if (firstLog.secondary_emotion) trail += ` → ${firstLog.secondary_emotion}`;
                if (firstLog.tertiary_emotion) trail += ` → ${firstLog.tertiary_emotion}`;
              }

              // Intensity dots for the first log
              const intensity = firstLog?.intensity || 0;

              return (
                <div key={sess.id} className="grid grid-cols-1 md:grid-cols-[140px_1fr_100px_2fr] gap-4 p-4 md:px-6 md:py-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors items-center">
                  
                  {/* Date & Time */}
                  <div className="flex items-center md:flex-col md:items-start md:justify-center">
                    <span className="md:hidden text-[10px] uppercase tracking-wider text-[var(--muted)] mr-2 w-16">When:</span>
                    <div className="text-[13px] text-[var(--foreground)]">{dateStr}</div>
                    <div className="text-[11px] text-[var(--muted)] ml-2 md:ml-0">{timeStr}</div>
                  </div>

                  {/* Emotion Trail */}
                  <div className="flex items-center">
                    <span className="md:hidden text-[10px] uppercase tracking-wider text-[var(--muted)] mr-2 w-16">Mood:</span>
                    <div className="text-[13px] text-[var(--muted)] truncate">{trail}</div>
                  </div>

                  {/* Intensity */}
                  <div className="flex items-center">
                    <span className="md:hidden text-[10px] uppercase tracking-wider text-[var(--muted)] mr-2 w-16">Level:</span>
                    <div className="flex items-center gap-[3px]">
                      {intensity > 0 ? [1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= intensity ? "bg-white/70" : "bg-white/10"}`} />
                      )) : <span className="text-[var(--muted)] text-[13px]">—</span>}
                    </div>
                  </div>

                  {/* Notes Snippet */}
                  <div className="flex items-start">
                    <span className="md:hidden text-[10px] uppercase tracking-wider text-[var(--muted)] mr-2 w-16 mt-0.5">Notes:</span>
                    <div className="text-[12px] text-[var(--muted)] italic truncate max-w-full">
                      {sess.notes ? (sess.notes.length > 60 ? sess.notes.substring(0, 60) + "..." : sess.notes) : "No notes"}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PUSH SUPPORT MODAL */}
      {pushOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1f1c19] border border-[var(--card-border)] rounded-[16px] p-8 max-w-[480px] w-full shadow-2xl relative">
            <button onClick={() => setPushOpen(false)} className="absolute top-4 right-4 p-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors rounded-full hover:bg-[var(--surface-2)]">
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-[18px] font-semibold text-[var(--foreground)] mb-6">Send Support to {summary.client_name?.split(" ")[0]}</h2>
            
            {/* Tabs */}
            <div className="flex bg-white/[0.04] p-1 rounded-xl mb-6">
              <button 
                onClick={() => setPushTab("write")}
                className={`flex-1 py-2 text-[13px] font-medium rounded-lg transition-colors ${pushTab === "write" ? "bg-white/10 text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--muted)]"}`}
              >
                Write a message
              </button>
              <button 
                onClick={() => setPushTab("pack")}
                className={`flex-1 py-2 text-[13px] font-medium rounded-lg transition-colors ${pushTab === "pack" ? "bg-white/10 text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--muted)]"}`}
              >
                From a pack
              </button>
            </div>

            {pushTab === "write" ? (
              <form onSubmit={handleSendPush}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Just checking in..."
                  className="w-full h-[120px] resize-none bg-[var(--surface-2)] border border-[var(--card-border)] focus:border-[var(--card-border)] rounded-[10px] p-4 text-[13px] text-[var(--foreground)] outline-none transition-colors mb-6 placeholder:text-[var(--muted)]"
                />
                <button 
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="w-full bg-[#C084FC]/15 border border-[#C084FC]/30 text-[#C084FC] rounded-lg py-3 text-[14px] font-medium hover:bg-[#C084FC]/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-3 min-h-[120px] max-h-[240px] overflow-y-auto pr-2">
                {loadingPacks ? (
                  <div className="py-8 text-center text-[13px] text-[var(--muted)] animate-pulse">Loading packs...</div>
                ) : packs.length === 0 ? (
                  <div className="py-8 text-center text-[13px] text-[var(--muted)]">You haven't created any Quote Packs yet.</div>
                ) : (
                  packs.map(pack => (
                    <button key={pack.id} className="flex flex-col text-left p-4 bg-[var(--surface-2)] hover:bg-[var(--surface-2)] border border-white/[0.05] rounded-xl transition-colors">
                      <div className="text-[14px] font-medium text-[var(--foreground)] mb-1">{pack.name}</div>
                      <div className="text-[12px] text-[var(--muted)] flex items-center gap-2">
                        <Package className="w-3.5 h-3.5" />
                        {pack.quote_count} quotes
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1f1c19] border border-[var(--card-border)] rounded-[10px] px-[18px] py-[12px] text-[13px] text-[var(--foreground)] shadow-2xl animate-fade-slide-up z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { X } from "lucide-react";

// --- Types mapping to the backend schemas ---

interface ClientLinkOut {
  id: string;
  client_id: string;
  client_name: string | null;
  client_email: string;
}

interface DayMoodPoint {
  date: string;
  primary_emotion: string | null;
  avg_intensity: number | null;
}

interface ClientMoodSummary {
  client_id: string;
  last_checkin: string | null;
  most_frequent_primary: string | null;
  low_mood_streak: number;
  has_unread_alert: boolean;
  fourteen_day_trend: DayMoodPoint[];
}

type RichClient = ClientLinkOut & { summary?: ClientMoodSummary };

// --- Constants ---
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

export default function ClientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [clients, setClients] = useState<RichClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [needsProfile, setNeedsProfile] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Link Client Modal state
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/therapist/clients");
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (res.status === 404 && (errData.error?.includes("profile not found") || errData.detail?.includes("profile not found"))) {
            setNeedsProfile(true);
            router.push("/therapist/dashboard");
            return;
          }
          throw new Error(errData.error || errData.detail || `API returned ${res.status}`);
        }
        const baseClients: ClientLinkOut[] = await res.json();
        
        // Load summaries in parallel
        const enriched = await Promise.all(
          baseClients.map(async (c) => {
            try {
              const sRes = await fetch(`/api/therapist/clients/${c.client_id}/summary`);
              if (sRes.ok) {
                const summary: ClientMoodSummary = await sRes.json();
                return { ...c, summary };
              }
            } catch (err) {
              // Ignore individual failures
            }
            return c;
          })
        );
        
        setClients(enriched);
      } catch (err: any) {
        console.error(err);
        setGlobalError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const filteredClients = clients.filter((c) => {
    const term = search.toLowerCase();
    const nameMatch = c.client_name?.toLowerCase().includes(term);
    const emailMatch = c.client_email.toLowerCase().includes(term);
    return nameMatch || emailMatch;
  });

  const relativeTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  const handleLinkClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkEmail.trim() || linking) return;
    setLinking(true);
    setLinkError(null);
    try {
      const res = await fetch("/api/therapist/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_email: linkEmail.trim() }),
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || "Failed to link client. Make sure the email belongs to a registered client.");
      }
      
      // Reload page to fetch new clients list
      window.location.reload();
    } catch (err: any) {
      setLinkError(err.message);
      setLinking(false);
    }
  };

  if (needsProfile) return null; // Let the redirect happen

  return (
    <div className="flex flex-col min-h-full p-4 md:p-8 text-white max-w-[1200px] mx-auto w-full">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-2 md:pt-0">
        <h1 className="text-[16px] font-semibold text-white/[0.85]">Clients</h1>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-white/[0.25] rounded-[10px] py-2 pl-9 pr-4 text-[13px] text-white/80 outline-none transition-colors"
            />
          </div>
          <button 
            onClick={() => setLinkOpen(true)}
            className="shrink-0 bg-[#C084FC]/15 border border-[#C084FC]/30 text-[#C084FC] rounded-lg px-4 py-2 text-[13px] hover:bg-[#C084FC]/25 transition-colors"
          >
            Link Client
          </button>
        </div>
      </div>

      {/* Client List */}
      <div className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-[14px] overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-[3px] border-white/10 border-t-[#C084FC] rounded-full animate-spin" />
            <div className="text-[13px] text-white/30 tracking-widest uppercase">Loading</div>
          </div>
        ) : globalError ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="text-[14px] text-[#F97060] mb-2 font-medium">Failed to load data</div>
            <div className="text-[12px] text-white/40 max-w-md bg-white/[0.02] p-4 rounded-lg break-all font-mono">
              {globalError}
            </div>
          </div>
        ) : clients.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
            <Users className="w-8 h-8 text-white/15 mb-3" />
            <div className="text-[14px] text-white/30 mb-1">No clients yet</div>
            <div className="text-[12px] text-white/20">Link a client to get started</div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_80px] gap-4 px-6 pt-5 pb-2 border-b border-white/[0.06] text-[10px] tracking-[0.1em] text-white/30 uppercase sticky top-0 bg-[#1f1c19]/95 backdrop-blur z-10">
              <div>CLIENT</div>
              <div>LAST CHECK-IN</div>
              <div>MOOD (7d)</div>
              <div>STREAK</div>
              <div>ALERT</div>
              <div className="text-right">ACTION</div>
            </div>

            {/* Rows */}
            <div className="flex flex-col">
              {filteredClients.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-white/30">
                  No clients match your search.
                </div>
              ) : (
                filteredClients.map((c) => {
                  const s = c.summary;
                  
                  // Extract 7 days dots (newest first, limit 7)
                  const trend = s?.fourteen_day_trend || [];
                  const last7 = [...trend].reverse().slice(0, 7);
                  // pad if less than 7
                  while (last7.length < 7) {
                    last7.push({ date: "", primary_emotion: null, avg_intensity: null });
                  }
                  // Reverse back so oldest is left, newest is right
                  last7.reverse();

                  const avatarColor = s?.most_frequent_primary 
                    ? (EMOTION_COLORS[s.most_frequent_primary] || "rgba(255,255,255,0.08)") 
                    : "rgba(255,255,255,0.08)";

                  return (
                    <div 
                      key={c.id}
                      className="group flex flex-col md:grid md:grid-cols-[2fr_1.2fr_1fr_1fr_1fr_80px] gap-4 p-4 md:px-6 md:py-3.5 border-b border-white/[0.04] items-center hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Client Info */}
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[#1a1614] font-bold text-xs"
                          style={{ background: avatarColor }}
                        >
                          {c.client_name?.[0]?.toUpperCase() || c.client_email[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1 md:flex-none">
                          <div className="text-[14px] text-white/80 truncate">
                            {c.client_name || "Unnamed"}
                          </div>
                          <div className="text-[11px] text-white/30 truncate">
                            {c.client_email}
                          </div>
                        </div>
                        
                        {/* Mobile Action Button (Right side on mobile) */}
                        <button 
                          onClick={() => router.push(`/therapist/clients/${c.client_id}`)}
                          className="md:hidden ml-auto text-[12px] text-[#C084FC] hover:text-[#C084FC]/80 px-2 py-1 rounded"
                        >
                          View →
                        </button>
                      </div>

                      {/* Desktop + Mobile stacked data */}
                      <div className="flex w-full md:contents gap-2 text-[13px] text-white/50 justify-between">
                        
                        {/* Last Check-in */}
                        <div className="flex items-center md:block">
                          <span className="md:hidden text-[10px] uppercase tracking-wider text-white/20 mr-2">Last:</span>
                          <span className={!s?.last_checkin ? "text-white/20" : ""}>
                            {relativeTime(s?.last_checkin)}
                          </span>
                        </div>

                        {/* Mood 7d */}
                        <div className="flex items-center md:block">
                          <span className="md:hidden text-[10px] uppercase tracking-wider text-white/20 mr-2">Mood:</span>
                          <div className="flex items-center gap-[3px] h-full">
                            {last7.map((pt, i) => (
                              <div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ 
                                  background: pt.primary_emotion 
                                    ? EMOTION_COLORS[pt.primary_emotion] || "rgba(255,255,255,0.08)" 
                                    : "rgba(255,255,255,0.08)"
                                }}
                                title={pt.date ? `${pt.date}: ${pt.primary_emotion || "No data"}` : "No data"}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Streak */}
                        <div className="flex items-center md:block">
                          <span className="md:hidden text-[10px] uppercase tracking-wider text-white/20 mr-2">Streak:</span>
                          {(s?.low_mood_streak || 0) > 0 ? (
                            <span className="text-[#C084FC]">
                              {s!.low_mood_streak} {s!.low_mood_streak > 3 ? "🔥" : ""}
                            </span>
                          ) : (
                            <span className="text-white/20">—</span>
                          )}
                        </div>

                        {/* Alert */}
                        <div className="flex items-center md:block">
                          <span className="md:hidden text-[10px] uppercase tracking-wider text-white/20 mr-2">Alert:</span>
                          {s?.has_unread_alert ? (
                            <div className="w-2 h-2 rounded-full bg-[#F97060]" />
                          ) : (
                            <span className="md:hidden text-white/20">—</span>
                          )}
                        </div>
                      </div>

                      {/* Desktop Action Button */}
                      <div className="hidden md:flex justify-end w-full">
                        <button 
                          onClick={() => router.push(`/therapist/clients/${c.client_id}`)}
                          className="text-[12px] text-[#C084FC] hover:text-[#C084FC]/80 transition-colors"
                        >
                          View →
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* LINK CLIENT MODAL */}
      {linkOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1f1c19] border border-white/[0.08] rounded-[16px] p-8 max-w-[400px] w-full shadow-2xl relative">
            <button onClick={() => setLinkOpen(false)} className="absolute top-4 right-4 p-2 text-white/30 hover:text-white/70 transition-colors rounded-full hover:bg-white/5">
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-[18px] font-semibold text-white/90 mb-2">Link a Client</h2>
            <p className="text-[13px] text-white/50 mb-6">
              Enter the email address of a registered client to link them to your practice.
            </p>
            
            <form onSubmit={handleLinkClient}>
              <input
                type="email"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                placeholder="client@example.com"
                required
                className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-white/[0.25] rounded-[10px] p-3 text-[13px] text-white/80 outline-none transition-colors mb-4 placeholder:text-white/20"
              />
              
              {linkError && (
                <div className="text-[12px] text-[#F97060] mb-4 bg-[#F97060]/10 p-2 rounded border border-[#F97060]/20">
                  {linkError}
                </div>
              )}

              <button 
                type="submit"
                disabled={linking || !linkEmail.trim()}
                className="w-full bg-[#C084FC]/15 border border-[#C084FC]/30 text-[#C084FC] rounded-lg py-3 text-[14px] font-medium hover:bg-[#C084FC]/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {linking ? "Linking..." : "Send Link Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

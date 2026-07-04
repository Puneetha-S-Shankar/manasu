"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Users, Bookmark, Bell, LogOut, X } from "lucide-react";
import { withRole } from "@/components/withRole";
import { useState, useEffect } from "react";

interface MoodAlert {
  id: string;
  client_id: string;
  client_name: string | null;
  alert_type: string;
  reason: string;
  is_read: boolean;
  triggered_at: string;
}

function Sidebar({ 
  unreadCount, 
  onOpenAlerts 
}: { 
  unreadCount: number; 
  onOpenAlerts: () => void 
}) {
  const { user } = useAuth();
  const pathname = usePathname();

  const handleSignOut = () => {
    fetch("/api/auth/logout").finally(() => {
      window.location.href = "/";
    });
  };

  const navItems = [
    { name: "Dashboard", href: "/therapist/dashboard", icon: LayoutGrid },
    { name: "Clients", href: "/therapist/clients", icon: Users },
    { name: "Quote Packs", href: "/therapist/packs", icon: Bookmark },
    { name: "Alerts", href: "#", icon: Bell, badge: unreadCount, isButton: true },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] bg-[var(--surface-2)] h-full shrink-0 border-r border-[var(--card-border)]">
        <div className="p-6 pb-2">
          <img
            src="/images/logos/logo.png"
            alt="ಮನಸು"
            className="h-[28px] w-auto mix-blend-screen mb-8"
            style={{ filter: "brightness(0) invert(var(--tw-invert, 0))" }}
          />
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const active = !item.isButton && pathname?.startsWith(item.href);
            const content = (
              <>
                <item.icon className="w-[18px] h-[18px]" />
                {item.name}
                {(item.badge ?? 0) > 0 ? (
                  <span className="ml-auto bg-[var(--error)] text-[var(--foreground)] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
                    {item.badge}
                  </span>
                ) : null}
              </>
            );
            const className = `flex items-center gap-[10px] h-[40px] px-[12px] rounded-lg text-[13px] font-medium transition-colors w-full text-left ${
              active
                ? "bg-[var(--accent-dim)] text-[var(--foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]"
            }`;

            if (item.isButton) {
              return (
                <button key={item.name} onClick={onOpenAlerts} className={className}>
                  {content}
                </button>
              );
            }
            return (
              <Link key={item.name} href={item.href} className={className}>
                {content}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-[var(--card-border)]">
          <div className="flex items-center gap-3">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--surface-1)] text-xs font-bold shadow-sm">
                {user?.name?.[0]?.toUpperCase() || "T"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[var(--foreground)] truncate font-semibold">{user?.name || "Therapist"}</div>
              <div className="text-[11px] text-[var(--muted)] truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-3 flex items-center gap-2 text-[12px] text-[var(--muted)] hover:text-[var(--error)] w-full transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-[var(--surface-2)] border-t border-[var(--card-border)] flex items-center justify-around px-2 z-50 pb-safe">
        {navItems.map((item) => {
          const active = !item.isButton && pathname?.startsWith(item.href);
          const className = `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative ${
            active ? "text-[var(--foreground)]" : "text-[var(--muted)]"
          }`;
          
          if (item.isButton) {
            return (
              <button key={item.name} onClick={onOpenAlerts} className={className}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.name}</span>
                {(item.badge ?? 0) > 0 ? (
                  <span className="absolute top-1 right-1/4 bg-[var(--error)] w-2 h-2 rounded-full" />
                ) : null}
              </button>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={className}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.name}</span>
              {(item.badge ?? 0) > 0 ? (
                <span className="absolute top-1 right-1/4 bg-[var(--error)] w-2 h-2 rounded-full" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function TherapistLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState<MoodAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/therapist/alerts");
      if (res.ok) {
        setAlerts(await res.json());
      }
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const unreadCount = alerts.filter(a => !a.is_read).length;

  const handleMarkReadAndGo = async (alert: MoodAlert) => {
    if (!alert.is_read) {
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, is_read: true } : a));
      try {
        await fetch(`/api/therapist/alerts/${alert.id}/read`, { method: "PATCH" });
      } catch (err) {
        console.error(err);
      }
    }
    setAlertsOpen(false);
    router.push(`/therapist/clients/${alert.client_id}`);
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case "low_mood_streak":
        return { bg: "var(--error)", color: "white", label: "Low Mood" };
      case "high_intensity":
        return { bg: "var(--warning)", color: "white", label: "High Intensity" };
      case "no_checkin":
        return { bg: "var(--card-border)", color: "var(--muted)", label: "No Check-in" };
      default:
        return { bg: "var(--card-border)", color: "var(--muted)", label: "Alert" };
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[var(--background)] overflow-hidden font-mono relative text-[var(--foreground)]">
      <Sidebar unreadCount={unreadCount} onOpenAlerts={() => setAlertsOpen(true)} />
      <main className="flex-1 overflow-y-auto pb-[64px] md:pb-0 relative">
        {children}
      </main>

      {alertsOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity"
          onClick={() => setAlertsOpen(false)}
        />
      )}

      <div 
        className={`fixed top-0 right-0 h-full w-[360px] max-w-full bg-[var(--surface-2)] border-l border-[var(--card-border)] z-50 flex flex-col transform transition-transform duration-300 ease-in-out shadow-[-8px_0_32px_rgba(0,0,0,0.1)] ${alertsOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-[var(--card-border)] shrink-0">
          <h2 className="text-[16px] font-semibold text-[var(--foreground)] font-sans">Alerts</h2>
          <button 
            onClick={() => setAlertsOpen(false)} 
            className="text-[var(--muted)] hover:text-[var(--foreground)] p-1.5 rounded-full hover:bg-[var(--card-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {loadingAlerts ? (
             <div className="animate-pulse flex flex-col gap-3">
                <div className="h-[90px] bg-[var(--card-hover)] rounded-xl" />
                <div className="h-[90px] bg-[var(--card-hover)] rounded-xl" />
                <div className="h-[90px] bg-[var(--card-hover)] rounded-xl" />
             </div>
          ) : alerts.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-center">
               <div className="text-[14px] text-[var(--muted)] font-sans">No alerts</div>
             </div>
          ) : (
             alerts.map(alert => {
               const badge = getAlertBadge(alert.alert_type);
               const timeStr = new Date(alert.triggered_at).toLocaleDateString(undefined, {
                 month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
               });
               return (
                 <div 
                   key={alert.id}
                   className="calm-card p-4 relative overflow-hidden"
                 >
                   {!alert.is_read && (
                     <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ backgroundColor: badge.bg }} />
                   )}
                   <div className="flex items-start justify-between mb-2">
                     <span 
                       className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md"
                       style={{ backgroundColor: badge.bg, color: badge.color }}
                     >
                       {badge.label}
                     </span>
                     <span className="text-[11px] text-[var(--muted)]">{timeStr}</span>
                   </div>
                   <div className="text-[14px] text-[var(--foreground)] font-semibold mb-1 font-sans">
                     {alert.client_name || "Unknown Client"}
                   </div>
                   <div className="text-[12px] text-[var(--muted)] mb-3 font-sans">
                     {alert.reason}
                   </div>
                   <button 
                     onClick={() => handleMarkReadAndGo(alert)}
                     className="text-[12px] text-[var(--accent)] hover:text-[var(--accent-light)] hover:underline flex items-center gap-1 font-medium transition-all"
                   >
                     View Client →
                   </button>
                 </div>
               );
             })
          )}
        </div>
      </div>
    </div>
  );
}

export default withRole(TherapistLayout, "therapist");

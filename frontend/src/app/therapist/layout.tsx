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
      <aside className="hidden md:flex flex-col w-[240px] bg-[#1f1c19] h-full shrink-0 border-r border-white/[0.04]">
        <div className="p-6 pb-2">
          <img
            src="/images/logos/logo.png"
            alt="ಮನಸು"
            className="h-[28px] w-auto mix-blend-screen mb-8"
          />
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const active = !item.isButton && pathname.startsWith(item.href);
            const content = (
              <>
                <item.icon className="w-[18px] h-[18px]" />
                {item.name}
                {item.badge > 0 ? (
                  <span className="ml-auto bg-[#F97060] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
                    {item.badge}
                  </span>
                ) : null}
              </>
            );
            const className = `flex items-center gap-[10px] h-[40px] px-[12px] rounded-lg text-[13px] font-medium transition-colors w-full text-left ${
              active
                ? "bg-white/[0.08] text-white/90"
                : "text-white/[0.35] hover:text-white/60 hover:bg-white/[0.02]"
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

        <div className="p-4 mt-auto border-t border-white/[0.04]">
          <div className="flex items-center gap-3">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C084FC] to-[#F9A8C9] flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase() || "T"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-white/80 truncate">{user?.name || "Therapist"}</div>
              <div className="text-[11px] text-white/30 truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-3 flex items-center gap-2 text-[12px] text-white/40 hover:text-white/70 w-full transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-[#1f1c19] border-t border-white/[0.06] flex items-center justify-around px-2 z-50 pb-safe">
        {navItems.map((item) => {
          const active = !item.isButton && pathname.startsWith(item.href);
          const className = `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative ${
            active ? "text-white/90" : "text-white/[0.35]"
          }`;
          
          if (item.isButton) {
            return (
              <button key={item.name} onClick={onOpenAlerts} className={className}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.name}</span>
                {item.badge > 0 ? (
                  <span className="absolute top-1 right-1/4 bg-[#F97060] w-2 h-2 rounded-full" />
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
              {item.badge > 0 ? (
                <span className="absolute top-1 right-1/4 bg-[#F97060] w-2 h-2 rounded-full" />
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
      // Optimistic update
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
        return { bg: "rgba(249,112,96,0.12)", color: "#F97060", label: "Low Mood" };
      case "high_intensity":
        return { bg: "rgba(251,176,69,0.12)", color: "#FBB045", label: "High Intensity" };
      case "no_checkin":
        return { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", label: "No Check-in" };
      default:
        return { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", label: "Alert" };
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#1a1614] overflow-hidden font-sans relative">
      <Sidebar unreadCount={unreadCount} onOpenAlerts={() => setAlertsOpen(true)} />
      <main className="flex-1 overflow-y-auto pb-[64px] md:pb-0 relative">
        {children}
      </main>

      {/* Alerts Drawer overlay */}
      {alertsOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity"
          onClick={() => setAlertsOpen(false)}
        />
      )}

      {/* Alerts Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-[360px] max-w-full bg-[#1f1c19] border-l border-white/[0.06] z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${alertsOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06] shrink-0">
          <h2 className="text-[16px] font-semibold text-white/90">Alerts</h2>
          <button 
            onClick={() => setAlertsOpen(false)} 
            className="text-white/40 hover:text-white/80 p-1.5 rounded-full hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {loadingAlerts ? (
             <div className="animate-pulse flex flex-col gap-3">
                <div className="h-[90px] bg-white/[0.04] rounded-xl" />
                <div className="h-[90px] bg-white/[0.04] rounded-xl" />
                <div className="h-[90px] bg-white/[0.04] rounded-xl" />
             </div>
          ) : alerts.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-center">
               <div className="text-[14px] text-white/30">No alerts</div>
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
                   className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 relative overflow-hidden"
                 >
                   {!alert.is_read && (
                     <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ backgroundColor: badge.color }} />
                   )}
                   <div className="flex items-start justify-between mb-2">
                     <span 
                       className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md"
                       style={{ backgroundColor: badge.bg, color: badge.color }}
                     >
                       {badge.label}
                     </span>
                     <span className="text-[11px] text-white/25">{timeStr}</span>
                   </div>
                   <div className="text-[14px] text-white/75 font-medium mb-1">
                     {alert.client_name || "Unknown Client"}
                   </div>
                   <div className="text-[12px] text-white/40 mb-3">
                     {alert.reason}
                   </div>
                   <button 
                     onClick={() => handleMarkReadAndGo(alert)}
                     className="text-[12px] text-[#C084FC] hover:underline flex items-center gap-1 font-medium transition-all"
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

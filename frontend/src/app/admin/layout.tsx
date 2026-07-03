"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Link2, Quote, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { withRole } from "@/components/withRole";

function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [pendingLinksCount, setPendingLinksCount] = useState(0);

  useEffect(() => {
    const fetchPendingLinks = async () => {
      try {
        const res = await fetch("/api/admin/link-requests?status=pending");
        if (res.ok) {
          const data = await res.json();
          setPendingLinksCount(data.length);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchPendingLinks();
  }, []);

  const handleSignOut = () => {
    fetch("/api/auth/logout").finally(() => {
      window.location.href = "/";
    });
  };

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Link Requests", href: "/admin/links", icon: Link2, badge: pendingLinksCount },
    { name: "Quotes", href: "/admin/quotes", icon: Quote },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#1a1614] overflow-hidden font-sans relative">
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
            const active = pathname?.startsWith(item.href);
            const className = `flex items-center gap-[10px] h-[40px] px-[12px] rounded-lg text-[13px] font-medium transition-colors w-full text-left ${
              active
                ? "bg-white/[0.08] text-white/90"
                : "text-white/[0.35] hover:text-white/60 hover:bg-white/[0.02]"
            }`;

            return (
              <Link key={item.name} href={item.href} className={className}>
                <item.icon className="w-[18px] h-[18px]" />
                {item.name}
                {item.badge ? (
                  <span className="ml-auto bg-[#FBB045] text-[#1a1614] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
                    {item.badge}
                  </span>
                ) : null}
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
                {user?.name?.[0]?.toUpperCase() || "A"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-white/80 truncate">{user?.name || "Admin"}</div>
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
          const active = pathname?.startsWith(item.href);
          const className = `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative ${
            active ? "text-white/90" : "text-white/[0.35]"
          }`;

          return (
            <Link key={item.name} href={item.href} className={className}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.name}</span>
              {item.badge ? (
                <span className="absolute top-1 right-1/4 bg-[#FBB045] w-2 h-2 rounded-full" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 overflow-y-auto pb-[64px] md:pb-0 relative">
        {children}
      </main>
    </div>
  );
}

export default withRole(AdminLayout, "admin");

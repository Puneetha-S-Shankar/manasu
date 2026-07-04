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
    <div className="flex flex-col md:flex-row h-screen w-full bg-[var(--background)] overflow-hidden font-mono relative text-[var(--foreground)]">
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
            const active = pathname?.startsWith(item.href);
            const className = `flex items-center gap-[10px] h-[40px] px-[12px] rounded-lg text-[13px] font-medium transition-colors w-full text-left ${
              active
                ? "bg-[var(--accent-dim)] text-[var(--foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]"
            }`;

            return (
              <Link key={item.name} href={item.href} className={className}>
                <item.icon className="w-[18px] h-[18px]" />
                {item.name}
                {item.badge ? (
                  <span className="ml-auto bg-[var(--warning)] text-[var(--surface-1)] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
                    {item.badge}
                  </span>
                ) : null}
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
                {user?.name?.[0]?.toUpperCase() || "A"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[var(--foreground)] truncate font-semibold">{user?.name || "Admin"}</div>
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
          const active = pathname?.startsWith(item.href);
          const className = `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative ${
            active ? "text-[var(--foreground)]" : "text-[var(--muted)]"
          }`;

          return (
            <Link key={item.name} href={item.href} className={className}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.name}</span>
              {item.badge ? (
                <span className="absolute top-1 right-1/4 bg-[var(--warning)] w-2 h-2 rounded-full" />
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

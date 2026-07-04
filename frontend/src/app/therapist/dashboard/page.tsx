"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function TherapistDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [needsProfile, setNeedsProfile] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkProfile() {
      try {
        const res = await fetch("/api/therapist/clients");
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (res.status === 404 && (errData.error?.includes("profile not found") || errData.detail?.includes("profile not found"))) {
            setNeedsProfile(true);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    checkProfile();
  }, []);

  const handleCreateProfile = async () => {
    if (!user) return;
    setCreatingProfile(true);
    try {
      const res = await fetch("/api/therapist/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (!res.ok) throw new Error("Failed to create profile");
      window.location.reload();
    } catch (err) {
      console.error(err);
      setCreatingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full items-center justify-center p-8">
        <div className="w-12 h-12 border-[3px] border-white/10 border-t-[#C084FC] rounded-full animate-spin" />
      </div>
    );
  }

  if (needsProfile) {
    return (
      <div className="flex flex-col min-h-full items-center justify-center p-8 text-[var(--foreground)] max-w-[1200px] mx-auto w-full">
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-[14px] p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold mb-2">Welcome, {user?.name}!</h2>
          <p className="text-[13px] text-[var(--muted)] mb-8">
            Before you can access the dashboard, you need to set up your therapist profile.
          </p>
          <button
            onClick={handleCreateProfile}
            disabled={creatingProfile}
            className="w-full bg-[#C084FC]/15 border border-[#C084FC]/30 text-[#C084FC] rounded-lg px-4 py-3 text-[14px] font-medium hover:bg-[#C084FC]/25 transition-colors"
          >
            {creatingProfile ? "Setting up..." : "Complete Setup"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full p-4 md:p-8 text-[var(--foreground)] max-w-[1200px] mx-auto w-full">
      <div className="flex flex-col items-center justify-center flex-1 text-center bg-white/[0.02] border border-white/[0.05] rounded-[14px] p-8">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-3">Welcome to your Dashboard, {user?.name?.split(" ")[0]}!</h1>
        <p className="text-[14px] text-[var(--muted)] max-w-md">
          Use the sidebar on the left to manage your clients, review alerts, and curate your quote packs. We'll be adding more dashboard insights here soon.
        </p>
        <button 
          onClick={() => router.push("/therapist/clients")}
          className="mt-8 bg-[#C084FC]/15 border border-[#C084FC]/30 text-[#C084FC] rounded-lg px-6 py-3 text-[14px] font-medium hover:bg-[#C084FC]/25 transition-colors"
        >
          View your Clients
        </button>
      </div>
    </div>
  );
}

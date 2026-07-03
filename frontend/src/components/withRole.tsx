"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function withRole<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRole: "client" | "therapist" | "admin"
) {
  return function ProtectedRoute(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!user || user.role !== allowedRole) {
          // Redirect unauthenticated or unauthorized users to login
          router.replace("/");
        }
      }
    }, [user, isLoading, router]);

    // Note: The AuthProvider already handles the isLoading screen,
    // so if we reach here and are still loading, it means AuthProvider 
    // hasn't rendered children yet. But just in case, we can add a fallback.
    if (isLoading || !user || user.role !== allowedRole) {
      return (
        <div className="min-h-screen w-full bg-[#1a1614] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

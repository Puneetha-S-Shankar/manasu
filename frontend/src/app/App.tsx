"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/* Shared logo component                                               */
/* ------------------------------------------------------------------ */
function Logo({ height = 32, width = "auto" }: { height?: number; width?: number | "auto" }) {
  return (
    <img
      src="/images/logos/logo.png"
      alt="ಮನಸು"
      className="block"
      style={{
        height,
        width,
        mixBlendMode: "screen",
        filter: "brightness(0) invert(var(--tw-invert, 0))"
      }}
    />
  );
}

export function Navbar({ showLinks = false }: { showLinks?: boolean }) {
  const router = useRouter();
  const [showCrisis, setShowCrisis] = useState(false);
  
  return (
    <>
      <nav className="w-full flex items-center justify-between px-6 h-[var(--navbar-height)] shrink-0 border-b border-[var(--card-border)] bg-[var(--background)] sticky top-0 z-40">
        <div className="flex items-center gap-12">
          <Link href="/dashboard"><Logo height={24} /></Link>
          {showLinks && (
            <div className="hidden md:flex gap-6 text-[14px] text-[var(--muted)]">
              <Link href="/dashboard" className="hover:text-[var(--foreground)] transition-colors">Dashboard</Link>
              <Link href="/check-in" className="hover:text-[var(--foreground)] transition-colors">Check-in</Link>
              <Link href="/insights" className="hover:text-[var(--foreground)] transition-colors">Insights</Link>
              <Link href="/library" className="hover:text-[var(--foreground)] transition-colors">Library</Link>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCrisis(true)}
            className="text-[13px] font-semibold text-[var(--emotion-angry)] border border-[var(--emotion-angry)] rounded-full px-4 py-1.5 hover:bg-[var(--emotion-angry)] hover:text-white transition-colors"
          >
            Get Help
          </button>
          
          {showLinks && (
            <button
              onClick={() => router.push("/profile")}
              aria-label="Profile"
              className="w-8 h-8 rounded-full bg-[var(--accent)] text-[var(--surface-1)] font-semibold flex items-center justify-center text-[13px] hover:bg-[var(--accent-light)] transition-colors"
            >
              P
            </button>
          )}
        </div>
      </nav>

      {/* Crisis Modal */}
      {showCrisis && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 animate-[fadeIn_0.2s_ease-out_forwards]">
          <div className="bg-[var(--surface-1)] rounded-2xl w-full max-w-md p-8 relative shadow-2xl animate-[fadeInUp_0.3s_ease-out_forwards]">
            <button 
              onClick={() => setShowCrisis(false)}
              className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <h2 className="text-2xl font-display font-medium text-[var(--foreground)] mb-2 text-[var(--emotion-angry)]">Immediate Support</h2>
            <p className="text-[14px] text-[var(--muted)] mb-8">You are not alone. Please reach out to one of these free, confidential resources available 24/7.</p>
            
            <div className="flex flex-col gap-4">
              <a href="tel:988" className="flex items-center justify-between p-4 border border-[var(--card-border)] rounded-xl hover:bg-[var(--card-hover)] transition-colors">
                <div>
                  <div className="font-semibold text-[var(--foreground)] text-[16px]">Suicide & Crisis Lifeline</div>
                  <div className="text-[13px] text-[var(--muted)]">Call or text 988 anytime</div>
                </div>
                <div className="bg-[var(--emotion-angry)] text-white px-4 py-2 rounded-full font-bold">988</div>
              </a>
              <a href="tel:911" className="flex items-center justify-between p-4 border border-[var(--card-border)] rounded-xl hover:bg-[var(--card-hover)] transition-colors">
                <div>
                  <div className="font-semibold text-[var(--foreground)] text-[16px]">Emergency Services</div>
                  <div className="text-[13px] text-[var(--muted)]">For immediate medical emergencies</div>
                </div>
                <div className="bg-[var(--foreground)] text-[var(--background)] px-4 py-2 rounded-full font-bold">911</div>
              </a>
            </div>
            
            <div className="mt-8 pt-6 border-t border-[var(--card-border)] text-center">
              <p className="text-[13px] text-[var(--muted)] mb-4">Focus on taking one slow breath right now.</p>
              <Link href="/library" onClick={() => setShowCrisis(false)} className="text-[var(--accent)] hover:underline text-[14px] font-medium">
                Try a grounding exercise →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Footer() {
  return (
    <footer className="w-full flex flex-col md:flex-row items-center justify-between px-6 py-6 text-[12px] text-[var(--muted)] border-t border-[var(--card-border)] mt-auto bg-[var(--background)] z-10 relative">
      <div className="flex items-center gap-2 mb-4 md:mb-0">
        <Logo height={16} />
        <span>· understand your emotional landscape</span>
      </div>
      <div className="flex gap-6">
        <Link href="#" className="hover:text-[var(--foreground)] transition-colors">Privacy</Link>
        <Link href="#" className="hover:text-[var(--foreground)] transition-colors">Support</Link>
        <Link href="#" className="hover:text-[var(--foreground)] transition-colors">Resources</Link>
      </div>
    </footer>
  );
}

/* ================================================================== */
/* LOGIN SCREEN                                                        */
/* ================================================================== */
function LoginScreen({ error }: { error?: string | null }) {
  const [loading, setLoading] = useState(false);

  const errorMessages: Record<string, string> = {
    oauth_failed: "Sign-in was cancelled or failed. Try again.",
    token_exchange_failed: "Could not exchange credentials with Google.",
    invalid_token: "Google token was invalid.",
    no_email: "Your Google account needs an email address.",
    server_configuration_error: "Server configuration error.",
    server_error: "Something went wrong. Please try again.",
  };
  const errorText = error ? (errorMessages[error] ?? "An unexpected error occurred.") : null;

  const handleGoogleSignIn = () => {
    setLoading(true);
    window.location.href = "/api/auth/google/login";
  };

  return (
    <div className="ambient-bg flex flex-col min-h-[100dvh] w-full text-[var(--foreground)]">
      <Navbar />
      
      <main className="flex-1 w-full max-w-[var(--container-max)] mx-auto flex flex-col items-center justify-center p-8 box-border z-10 relative animate-[fadeInUp_0.8s_ease-out_forwards]">
        <div className="w-full max-w-[380px] flex flex-col items-center">
          <div className="mb-8">
            <Logo height={100} />
          </div>

          <p className="text-[14px] tracking-wide text-[var(--muted)] text-center mb-10 font-sans">
            understand your emotional landscape
          </p>

          {errorText && (
            <div className="w-full p-3 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-[13px] text-red-600 dark:text-red-400 text-center">
              {errorText}
            </div>
          )}

          <div className="calm-card w-full p-8 flex flex-col items-center">
            <h2 className="heading text-[24px] text-[var(--foreground)] mb-6">Welcome back</h2>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--card-border)] rounded-full py-3 px-6 cursor-pointer disabled:opacity-60 transition-colors shadow-sm"
            >
              {loading ? (
                <div className="w-[18px] h-[18px] border-2 border-[var(--card-border)] border-t-[var(--accent)] rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.59 5.59 0 0 1 8.4 12.928a5.59 5.59 0 0 1 5.59-5.591c2.146 0 3.965.857 5.3 2.257l3.226-3.226C20.146 4.157 17.3 2.8 13.99 2.8c-6.136 0-11.11 4.973-11.11 11.109s4.973 11.11 11.11 11.11c5.968 0 10.875-4.329 10.875-10.286v-4.448H12.24Z" />
                </svg>
              )}
              <span className="text-[14px] font-medium text-[var(--foreground)]">
                {loading ? "Signing in..." : "Continue with Google"}
              </span>
            </button>
          </div>

          <p className="mt-8 text-[12px] text-[var(--muted)] text-center leading-relaxed max-w-[280px]">
            Your emotional data is stored privately and never shared.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ================================================================== */
/* ROOT APP — strictly handles login & auth routing                    */
/* ================================================================== */
export default function App() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) setOauthError(err);
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "admin") {
        router.replace("/admin/dashboard");
      } else if (user.role === "therapist") {
        router.replace("/therapist/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return null;
  }

  return <LoginScreen error={oauthError} />;
}

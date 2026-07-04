"use client";

import { useState, useEffect } from "react";
import { Navbar, Footer } from "../App";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LibraryPage() {
  const { user, isLoading } = useAuth();
  const [phase, setPhase] = useState("Inhale");
  const [timeRemaining, setTimeRemaining] = useState(4);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev > 1) return prev - 1;

        if (phase === "Inhale") {
          setPhase("Hold");
          return 7;
        } else if (phase === "Hold") {
          setPhase("Exhale");
          return 8;
        } else {
          setPhase("Inhale");
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, phase]);

  const toggleBreathing = () => {
    if (isActive) {
      setIsActive(false);
      setPhase("Inhale");
      setTimeRemaining(4);
    } else {
      setIsActive(true);
      setPhase("Inhale");
      setTimeRemaining(4);
    }
  };

  if (isLoading) return <div className="ambient-bg" />;

  return (
    <div className="ambient-bg flex flex-col min-h-[100dvh] w-full text-[var(--foreground)]">
      <Navbar showLinks={true} />

      <main className="flex-1 w-full max-w-[var(--container-max)] mx-auto flex flex-col pt-12 md:pt-20 px-6 pb-24 box-border z-10 relative animate-[fadeInUp_0.6s_ease-out_forwards]">
        
        <div className="mb-10 text-center">
          <h2 className="heading text-[28px] text-[var(--foreground)] mb-2">Grounding Library</h2>
          <p className="text-[15px] text-[var(--muted)]">Simple tools to help you come back to the present moment.</p>
        </div>

        <div className="w-full flex flex-col gap-12">
          
          {/* 4-7-8 Breathing Exercise */}
          <div className="calm-card w-full p-8 md:p-12 flex flex-col items-center relative overflow-hidden">
            <h3 className="heading text-[20px] text-[var(--foreground)] mb-2 z-10">4-7-8 Breathing</h3>
            <p className="text-[13px] text-[var(--muted)] text-center max-w-sm mb-12 z-10">
              A powerful technique to reduce anxiety. Inhale for 4, hold for 7, and exhale slowly for 8.
            </p>

            <div className="relative w-64 h-64 flex items-center justify-center mb-10 z-10">
              {/* Outer pulsing ring */}
              <div 
                className={`absolute inset-0 rounded-full border-2 border-[var(--accent)] transition-all duration-1000 ease-in-out ${isActive ? (phase === "Inhale" ? "scale-100 opacity-20" : phase === "Hold" ? "scale-100 opacity-50" : "scale-50 opacity-10") : "scale-75 opacity-10"}`} 
              />
              {/* Inner solid circle */}
              <div 
                className={`absolute w-32 h-32 rounded-full bg-[var(--accent)] transition-all ease-in-out flex items-center justify-center shadow-lg ${isActive ? (phase === "Inhale" ? "scale-[1.8] duration-[4000ms]" : phase === "Hold" ? "scale-[1.8] duration-[7000ms]" : "scale-100 duration-[8000ms]") : "scale-100 duration-500"}`}
                style={{ opacity: isActive ? (phase === "Hold" ? 0.8 : 0.4) : 0.1 }}
              />
              
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <span className="font-display text-2xl font-medium text-[var(--foreground)] transition-opacity">
                  {isActive ? phase : "Ready?"}
                </span>
                {isActive && (
                  <span className="text-4xl font-bold font-sans mt-2 opacity-80">
                    {timeRemaining}
                  </span>
                )}
              </div>
            </div>

            <button 
              onClick={toggleBreathing}
              className="calm-button px-8 py-3 z-10"
            >
              {isActive ? "Stop Exercise" : "Start Breathing"}
            </button>
          </div>

          {/* 5-4-3-2-1 Grounding */}
          <div className="calm-card w-full p-8 flex flex-col gap-4">
            <h3 className="heading text-[20px] text-[var(--foreground)]">5-4-3-2-1 Senses</h3>
            <p className="text-[13px] text-[var(--muted)]">When your mind is racing, look around you and name out loud:</p>
            <ul className="flex flex-col gap-3 mt-4 text-[14px] text-[var(--foreground)]">
              <li className="flex gap-4 items-center">
                <span className="w-6 h-6 rounded-full bg-[var(--surface-2)] flex items-center justify-center font-bold text-[12px]">5</span>
                Things you can <strong>see</strong>
              </li>
              <li className="flex gap-4 items-center">
                <span className="w-6 h-6 rounded-full bg-[var(--surface-2)] flex items-center justify-center font-bold text-[12px]">4</span>
                Things you can <strong>touch</strong>
              </li>
              <li className="flex gap-4 items-center">
                <span className="w-6 h-6 rounded-full bg-[var(--surface-2)] flex items-center justify-center font-bold text-[12px]">3</span>
                Things you can <strong>hear</strong>
              </li>
              <li className="flex gap-4 items-center">
                <span className="w-6 h-6 rounded-full bg-[var(--surface-2)] flex items-center justify-center font-bold text-[12px]">2</span>
                Things you can <strong>smell</strong>
              </li>
              <li className="flex gap-4 items-center">
                <span className="w-6 h-6 rounded-full bg-[var(--surface-2)] flex items-center justify-center font-bold text-[12px]">1</span>
                Thing you can <strong>taste</strong>
              </li>
            </ul>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

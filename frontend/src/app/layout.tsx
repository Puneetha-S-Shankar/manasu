import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], weight: ["400","500","600"], display: "swap", variable: "--font-fraunces" });
const nunitoSans = Nunito_Sans({ subsets: ["latin"], weight: ["400","500","600","700"], display: "swap", variable: "--font-nunito-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "Manasu",
  description: "Understand your emotional landscape",
  manifest: "/manifest.json"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fraunces.variable} ${nunitoSans.variable} ${jetbrainsMono.variable}`}>
      <body
        className="antialiased bg-[var(--background)] text-[var(--foreground)]"
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <div className="fixed top-4 left-4 z-50">
              <ThemeToggle />
            </div>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

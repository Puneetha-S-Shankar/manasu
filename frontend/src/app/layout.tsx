import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manasu",
  description: "Explore and understand your emotions",
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
    <html lang="en" style={{ width: "100%", height: "100%" }} suppressHydrationWarning>
      <body
        className="antialiased bg-white text-black dark:bg-black dark:text-white"
        style={{ width: "100%", minHeight: "100%", margin: 0, padding: 0 }}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <div className="fixed top-4 right-4 z-50">
              <ThemeToggle />
            </div>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

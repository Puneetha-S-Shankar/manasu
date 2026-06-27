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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ width: "100%", height: "100%" }}>
      <body
        className="antialiased"
        style={{ width: "100%", minHeight: "100%", margin: 0, padding: 0 }}
      >
        {children}
      </body>
    </html>
  );
}

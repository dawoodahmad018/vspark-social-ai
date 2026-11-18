import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "V-Spark Social — Create with intention",
  description: "AI-assisted social captions, saved schedules, and connected workflows.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

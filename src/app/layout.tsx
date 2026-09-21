import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fathom AI — AI Meeting Assistant & Intelligence Workspace",
  description: "A Fathom-inspired demo of meeting summaries, searchable transcripts, action items, highlights, and grounded Q&A using seeded meetings.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-[#0B0D12] text-slate-100 flex flex-col antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}

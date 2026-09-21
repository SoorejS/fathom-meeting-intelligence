import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fathom AI — AI Meeting Assistant & Intelligence Workspace",
  description: "Record, transcribe, highlight, and summarize meetings with Fathom AI. Never take meeting notes again.",
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

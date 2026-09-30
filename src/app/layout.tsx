import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Relay — Make the next step count',
  description: 'A connected meeting workspace for conversations, decisions, and follow-through. Find the moment. Keep the work moving.',
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('relay-theme') || 'system';
    var isDark = stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var theme = isDark ? 'dark' : 'light';
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.classList.add(theme);
    root.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

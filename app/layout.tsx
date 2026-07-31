import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SavedArticlesProvider } from "@/lib/context/SavedArticlesContext";
import { ThemeProvider } from "@/lib/context/ThemeContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "dev.pulse - Developer AI News",
  description: "Daily AI news briefing for developers with code examples and GitHub integration",
};

/**
 * Inline script that runs before React hydrates to apply the persisted theme
 * to <html> immediately, preventing a flash of the wrong theme (FOUC).
 */
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('pulse_theme');
    var theme = null;
    if (stored === 'dark' || stored === 'light') {
      theme = stored;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark';
    } else {
      theme = 'light';
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    // Default to light if localStorage/matchMedia are unavailable.
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider>
          <SavedArticlesProvider>
            {children}
          </SavedArticlesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

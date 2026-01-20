import "./global.css";

import type { Metadata } from "next";
import { Suspense } from "react";

import { Rubik, Atkinson_Hyperlegible } from "next/font/google";
import { ThemeProvider } from "../components/ThemeProvider";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const rubik = Rubik({
  subsets: ["latin-ext"],
  display: "block",
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin-ext"],
  weight: ["400", "700"],
  display: "block",
});

export const metadata: Metadata = {
  title: "Visuels PDF",
};

// Script to prevent flash of unstyled content (FOUC)
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme-preference');
    var theme = stored;
    if (!theme || theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Visuels PDF</title>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <div id="root">
            <Suspense>{children}</Suspense>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

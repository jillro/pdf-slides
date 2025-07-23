import "./global.css";

import type { Metadata } from "next";
import { Suspense } from "react";

import { Rubik, Atkinson_Hyperlegible } from "next/font/google";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const rubik = Rubik({
  subsets: ["latin-ext"],
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin-ext"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Visuels PDF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Visuels PDF</title>
      </head>
      <body>
        <div id="root">
          <Suspense>{children}</Suspense>
        </div>
      </body>
    </html>
  );
}

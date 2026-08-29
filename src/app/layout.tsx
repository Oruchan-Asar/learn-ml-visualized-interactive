import type { Metadata } from "next";
import { Fraunces, Source_Sans_3, IBM_Plex_Mono } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { MathAutoFit } from "@/components/MathAutoFit";
import { ThemeToggle } from "@/components/ThemeToggle";

const THEME_INIT_SCRIPT = `!function(){try{var t=localStorage.getItem("gradient:theme");if("light"===t||"dark"===t)document.documentElement.setAttribute("data-theme",t)}catch(e){}}()`;

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Gradient — a visual, interactive path through every course you're taking",
  description:
    "A personal learning platform: machine learning, deep learning, and explainable AI, plus every other course on the syllabus — each chapter visualized, tested, and interactive.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${sourceSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {children}
        <MathAutoFit />
        <ThemeToggle />
      </body>
    </html>
  );
}

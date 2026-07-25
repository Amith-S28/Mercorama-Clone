import type { Metadata } from "next";
import {
  Playfair_Display,
  Space_Grotesk,
  JetBrains_Mono,
  Questrial,
  Roboto,
} from "next/font/google";
import { GrainOverlay } from "@/components/ambient/GrainOverlay";
import { LenisProvider } from "@/components/ambient/LenisProvider";
import { GsapRegistrar } from "@/components/ambient/GsapRegistrar";
import "./globals.css";
import "./landing.css";
import "./theme-overrides.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-loaded",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk-loaded",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono-loaded",
  display: "swap",
});

const questrial = Questrial({
  subsets: ["latin"],
  variable: "--font-questrial-loaded",
  display: "swap",
  weight: ["400"],
});

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto-loaded",
  display: "swap",
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "MERCORAMA",
  description:
    "Trade readiness intelligence platform for global export advisors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  const theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${playfairDisplay.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${questrial.variable} ${roboto.variable}`}
        suppressHydrationWarning
      >
        <LenisProvider>
          <GsapRegistrar />
          <GrainOverlay />
          <main className="relative z-0 flex-1 flex flex-col min-h-screen">
            {children}
          </main>
        </LenisProvider>
      </body>
    </html>
  );
}

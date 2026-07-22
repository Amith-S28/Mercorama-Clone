import type { Metadata } from 'next';
import { JetBrains_Mono, Outfit, Inter } from 'next/font/google';
import { GrainOverlay } from '@/components/ambient/GrainOverlay';
import { LenisProvider } from '@/components/ambient/LenisProvider';
import { GsapRegistrar } from '@/components/ambient/GsapRegistrar';
import './globals.css';
import './theme-overrides.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter-loaded',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit-loaded',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono-loaded',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Trade Agency Sandbox',
  description: 'Trade readiness sandbox portal for export advisors',
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
      <body className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
        <LenisProvider>
          <GsapRegistrar />
          <GrainOverlay />
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}

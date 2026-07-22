import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { JsonLd } from '@/components/seo/JsonLd';
import './globals.css'

const GA_ID = 'G-57LY2Z3RVV'
const SITE_URL = 'https://mercorama.com'

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Mercorama | AI-Powered Trade Intelligence for Canadian SMEs',
    template: '%s | Mercorama',
  },
  description: 'AI-powered trade intelligence platform for Canadian SMEs. HS Code classification, Incoterms analysis, export market intelligence, FTA optimization, and verified trade expert consultations.',
  keywords: [
    'trade intelligence', 'HS code classification', 'Incoterms 2020', 'export compass',
    'Canadian SME export', 'FTA CETA CPTPP', 'customs broker', 'international trade',
    'trade expert marketplace', 'export readiness', 'tariff rates', 'trade documentation',
    'freight connect', 'deal wizard', 'export finance', 'CITP FIBP',
  ],
  authors: [{ name: 'MightyIQ Inc.', url: 'https://mightyiq.ca' }],
  creator: 'MightyIQ Inc.',
  publisher: 'MightyIQ Inc.',
  icons: {
    icon: '/icon-light-32x32.png',
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: SITE_URL,
    siteName: 'Mercorama',
    title: 'Mercorama | AI-Powered Trade Intelligence for Canadian SMEs',
    description: 'From HS Code to signed deal. AI tools + verified trade experts for Canadian exporters.',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Mercorama — AI-Powered Trade Intelligence',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mercorama | AI-Powered Trade Intelligence',
    description: 'From HS Code to signed deal. AI tools + verified trade experts for Canadian exporters.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: 'technology',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google tag */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>
          <JsonLd />
          {children}
          <Toaster />
        </Providers>
        <GoogleAnalytics />
      </body>
    </html>
  )
}

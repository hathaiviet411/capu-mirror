import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Capu - Cast',
  description: '最高の乾杯にCapuでつながる',
  generator: 'v0.dev',
  icons: {
    icon: '/capu-logo.svg',
    apple: '/capu-logo.svg',
    shortcut: '/capu-logo.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Capu - Cast',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1A1B3A',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Capu - Cast" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="touch-optimized smooth-touch-scroll">{children}</body>
    </html>
  )
}

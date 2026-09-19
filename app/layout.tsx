import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'ParkShare — Know your parking. Reserve it. Arrive with confidence.',
    template: '%s · ParkShare',
  },
  description:
    'ParkShare is Rwanda’s trusted parking network. Find verified parking in Kigali with confirmed availability, reserve ahead, pay with MTN MoMo or Airtel Money, and arrive with confidence.',
  generator: 'v0.app',
  keywords: ['parking', 'Kigali', 'Rwanda', 'reservation', 'MTN MoMo', 'Airtel Money', 'parking marketplace'],
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#15706b',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

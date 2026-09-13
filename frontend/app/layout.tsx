import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Automark Admin Portal',
  description: 'Automark institutional administration portal for attendance, academics, timetables, and student management.',
  generator: 'Automark',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0D59D6',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-background">
      <body>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

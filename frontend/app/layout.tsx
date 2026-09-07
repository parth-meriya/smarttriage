import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/hooks/useAuth'
import './globals.css'

export const metadata: Metadata = {
  title: 'SmartTriage — Clinical care, clearly prioritized',
  description: 'A calm, urgency-driven patient flow and triage workspace for modern healthcare teams.',
  generator: 'SmartTriage',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f5f8fc',
  userScalable: true,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

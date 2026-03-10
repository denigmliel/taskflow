// src/app/layout.tsx
import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import Providers from '@/components/shared/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'TaskFlow', template: '%s — TaskFlow' },
  description: 'Personal Project Management System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#17172a',
                color: '#e8e8f0',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontSize: '13px',
                fontFamily: 'DM Sans, sans-serif',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#17172a' } },
              error:   { iconTheme: { primary: '#f43f5e', secondary: '#17172a' } },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}

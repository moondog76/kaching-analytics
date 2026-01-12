import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kaching Pro - AI-Native Analytics',
  description: 'Autonomous AI analyst for retail campaign intelligence',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

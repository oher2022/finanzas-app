// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const geistSans = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Finanzas · Centro de control',
  description: 'Gestión financiera personal con integración Gmail',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${geistSans.variable} font-sans bg-surface text-gray-100 antialiased`}>
        {children}
      </body>
    </html>
  )
}

// src/app/layout.tsx
import './globals.css'
import { Playfair_Display, Inter } from 'next/font/google'
import type { Metadata } from 'next'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Bliss Hair Studio | Book Your Appointment',
  description: 'Book your next hair appointment at Bliss Hair Studio. Professional stylists, relaxing atmosphere, and premium services.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-primary-50 text-gray-800 font-body flex flex-col">
        {children}
      </body>
    </html>
  )
}

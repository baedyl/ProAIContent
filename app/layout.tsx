import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Wand Wiser - Advanced AI Content Generation Platform',
  description: 'Wand Wiser crafts SEO-optimized, humanized, and conversion-focused content in seconds. Generate articles, reviews, and affiliate pages with pro-grade workflows.',
  keywords: 'Wand Wiser, AI content generation, SEO optimization, content writing, blog posts, product reviews',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Toaster position="top-right" />
          {children}
        </Providers>
      </body>
    </html>
  )
}



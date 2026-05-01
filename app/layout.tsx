import type { Metadata } from 'next'
import './globals.css'
import AppChrome from '@/components/AppChrome'

export const metadata: Metadata = {
  title: 'HomePlate',
  description: 'Share your homemade dishes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  )
}

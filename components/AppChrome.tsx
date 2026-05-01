'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideSidebar = pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/signup')

  return (
    <div className={`app-shell${hideSidebar ? ' no-sidebar' : ' with-sidebar'}`}>
      {!hideSidebar && <Sidebar />}
      <main className="main-content">{children}</main>
    </div>
  )
}

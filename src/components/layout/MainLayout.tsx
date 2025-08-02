'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  // Close sidebar when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleSidebarClose = () => {
    setIsSidebarOpen(false)
  }

  // Pages that should use minimal layout (no sidebar/footer)
  const minimalLayoutPages = [
    '/auth/signin',
    '/auth/signup',
    '/auth/error',
    '/auth/verify-request',
  ]

  const isMinimalLayout = minimalLayoutPages.some(page => 
    pathname.startsWith(page)
  )

  if (isMinimalLayout) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:flex md:flex-shrink-0 md:h-screen">
        <div className="flex flex-col w-64 h-full">
          <Sidebar isOpen={true} onClose={() => {}} />
        </div>
      </div>

      {/* Mobile sidebar - only shown when open */}
      <div className="md:hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
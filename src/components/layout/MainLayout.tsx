'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'
import { useSidebar } from '@/contexts/SidebarContext'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(288) // デフォルト幅
  const [isResizing, setIsResizing] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false) // サイドバー最小化状態
  const pathname = usePathname()
  const { folderProps } = useSidebar()
  const sidebarRef = useRef<HTMLDivElement>(null)

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

    const handleToggleMainSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('toggleMainSidebar', handleToggleMainSidebar)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('toggleMainSidebar', handleToggleMainSidebar)
    }
  }, [isSidebarOpen])

  // Load saved sidebar width and minimized state from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth')
    const savedMinimized = localStorage.getItem('sidebarMinimized')
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth))
    }
    if (savedMinimized) {
      setIsMinimized(savedMinimized === 'true')
    }
  }, [])

  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    console.log('handleMouseDown triggered')
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    
    console.log('handleMouseMove - clientX:', e.clientX, 'isResizing:', isResizing)
    const newWidth = e.clientX
    if (newWidth >= 200) { // 最小200pxのみ、最大制限なし
      setSidebarWidth(newWidth)
      console.log('Setting new width:', newWidth)
    }
  }, [isResizing])

  const handleMouseUp = useCallback(() => {
    console.log('handleMouseUp - isResizing:', isResizing)
    if (isResizing) {
      setIsResizing(false)
      localStorage.setItem('sidebarWidth', sidebarWidth.toString())
      console.log('Saved width to localStorage:', sidebarWidth)
    }
  }, [isResizing, sidebarWidth])

  // Add mouse event listeners
  useEffect(() => {
    console.log('useEffect for resize - isResizing:', isResizing)
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      console.log('Added resize event listeners')
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        console.log('Removed resize event listeners')
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleSidebarClose = () => {
    setIsSidebarOpen(false)
  }

  const handleSidebarToggleMinimize = () => {
    const newMinimized = !isMinimized
    setIsMinimized(newMinimized)
    localStorage.setItem('sidebarMinimized', newMinimized.toString())
  }

  // Pages that should use minimal layout (no sidebar/footer)
  const minimalLayoutPages = [
    '/',  // トップページ（ランディングページ）
    '/auth/signin',
    '/auth/signup',
    '/auth/error',
    '/auth/verify-request',
  ]

  const isMinimalLayout = minimalLayoutPages.some(page => 
    page === '/' ? pathname === '/' : pathname.startsWith(page)
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
      <div 
        ref={sidebarRef}
        className="hidden md:flex md:flex-shrink-0 md:h-screen relative"
        style={{ width: isMinimized ? '64px' : `${sidebarWidth}px` }}
        data-sidebar-width={sidebarWidth}
        data-is-resizing={isResizing}
        data-is-minimized={isMinimized}
      >
        <div className="flex flex-col w-full h-full">
          <Sidebar 
            isOpen={true} 
            onClose={() => {}} 
            folderProps={folderProps} 
            isMinimized={isMinimized}
            onToggleMinimize={handleSidebarToggleMinimize}
          />
        </div>
        
        {/* Resize handle - hidden when minimized */}
        {!isMinimized && (
          <div
            className="absolute right-0 top-0 w-1 h-full cursor-col-resize z-[60] hover:bg-gray-400 transition-colors"
            onMouseDown={handleMouseDown}
            style={{ touchAction: 'none' }}
          />
        )}
      </div>

      {/* Mobile sidebar - only shown when open */}
      <div className="md:hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} folderProps={folderProps} />
      </div>

      {/* Main content area */}
      <div className={`flex flex-col flex-1 overflow-hidden ${isResizing ? 'select-none' : ''}`}>
        <Header onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="min-h-full flex flex-col">
            <div className="flex-1 py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
            <Footer />
          </div>
        </main>
      </div>
    </div>
  )
}
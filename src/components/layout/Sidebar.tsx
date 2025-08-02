'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FolderTree } from '@/components/folders/FolderTree'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isMinimized?: boolean
  onToggleMinimize?: () => void
  folderProps?: {
    selectedFolderId?: string
    onFolderSelect: (folderId: string | null) => void
    onFolderCreate?: (parentId?: string) => void
    onFolderEdit?: (folder: { id: string; name: string; parentId?: string }) => void
    onFolderDelete?: (folder: { id: string; name: string }) => void
    onItemDrop?: (itemData: any, folderId: string | null) => void
  }
}

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  requireAuth?: boolean
  badge?: string
}

export function Sidebar({ isOpen, onClose, isMinimized = false, onToggleMinimize, folderProps }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const navigationItems: NavItem[] = [
    {
      name: 'アイテム管理',
      href: '/items',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      requireAuth: true,
    },
    {
      name: 'ダッシュボード',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      requireAuth: true,
    },
    {
      name: 'AI機能',
      href: '/ai',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      requireAuth: true,
      badge: '準備中',
    },
  ]

  const testingItems: NavItem[] = [
    {
      name: 'API テスト',
      href: '/test',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'デバッグ',
      href: '/debug',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const renderNavItem = (item: NavItem) => {
    // 認証が必要なページで未認証の場合はスキップ
    if (item.requireAuth && (!session || !session.hasSession)) {
      return null
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={`
          group flex items-center ${isMinimized ? 'px-2 py-3 justify-center' : 'px-2 py-2'} text-sm font-medium rounded-md transition-colors duration-150
          ${
            isActive(item.href)
              ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-600'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }
        `}
        title={isMinimized ? item.name : undefined}
      >
        <span
          className={`
            ${isMinimized ? 'mr-0' : 'mr-3'} flex-shrink-0
            ${isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
          `}
        >
          {item.icon}
        </span>
        {!isMinimized && (
          <>
            <span className="flex-1">{item.name}</span>
            {item.badge && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 md:h-screen md:w-full
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 md:hidden">
            <span className="text-lg font-semibold text-gray-900">メニュー</span>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 ${isMinimized ? 'px-2' : 'px-4'} py-6 space-y-8 overflow-y-auto`}>
            {/* Main navigation */}
            <div>
              {!isMinimized && (
                <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  メイン機能
                </h3>
              )}
              <div className="space-y-1">
                {navigationItems.map(renderNavItem)}
              </div>
            </div>

            {/* Folder tree for items page */}
            {!isMinimized && folderProps && pathname.startsWith('/items') && (
              <div>
                <FolderTree
                  selectedFolderId={folderProps.selectedFolderId}
                  onFolderSelect={folderProps.onFolderSelect}
                  onFolderCreate={folderProps.onFolderCreate}
                  onFolderEdit={folderProps.onFolderEdit}
                  onFolderDelete={folderProps.onFolderDelete}
                  onItemDrop={folderProps.onItemDrop}
                  className="px-2"
                />
              </div>
            )}

            {/* Testing section */}
            <div>
              {!isMinimized && (
                <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  開発・テスト
                </h3>
              )}
              <div className="space-y-1">
                {testingItems.map(renderNavItem)}
              </div>
            </div>

            {/* Quick actions */}
            {session && session.hasSession ? (
              <div>
                {!isMinimized && (
                  <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    クイックアクション
                  </h3>
                )}
                <div className="space-y-2">
                  <Link
                    href="/items/new"
                    onClick={onClose}
                    className={`
                      flex items-center ${isMinimized ? 'justify-center px-2 py-3' : 'justify-center px-4 py-2'} 
                      text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    `}
                    title={isMinimized ? '新しいアイテム' : undefined}
                  >
                    <svg className={`w-4 h-4 ${isMinimized ? 'mr-0' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {!isMinimized && '新しいアイテム'}
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                {!isMinimized && (
                  <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    はじめに
                  </h3>
                )}
                <div className="space-y-2">
                  <Link
                    href="/auth/signin"
                    onClick={onClose}
                    className={`
                      flex items-center ${isMinimized ? 'justify-center px-2 py-3' : 'justify-center px-4 py-2'} 
                      text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    `}
                    title={isMinimized ? 'ログイン' : undefined}
                  >
                    <svg className={`w-4 h-4 ${isMinimized ? 'mr-0' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                    </svg>
                    {!isMinimized && 'ログイン'}
                  </Link>
                </div>
              </div>
            )}
          </nav>

          {/* Sidebar footer */}
          <div className="flex-shrink-0 border-t border-gray-200">
            <div className={`flex items-center ${isMinimized ? 'justify-center p-2' : 'justify-between p-4'}`}>
              {!isMinimized && (
                <div className="flex items-center text-xs text-gray-500">
                  <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center mr-2 p-1">
                    {/* plat-dot logo icon */}
                    <svg className="w-full h-full" viewBox="0 0 32 32" fill="none">
                      {/* Box/package icon representing inventory management */}
                      <g transform="translate(6, 6)">
                        {/* Main box */}
                        <path d="M2 8L10 4L18 8V18L10 22L2 18V8Z" fill="#ffffff" stroke="#e5e7eb" strokeWidth="0.5"/>
                        
                        {/* Box lines for 3D effect */}
                        <path d="M2 8L10 12L18 8" stroke="#cbd5e1" strokeWidth="1" fill="none"/>
                        <path d="M10 12V22" stroke="#cbd5e1" strokeWidth="1"/>
                        
                        {/* Small dots representing items */}
                        <circle cx="6" cy="10" r="1" fill="#60a5fa"/>
                        <circle cx="14" cy="10" r="1" fill="#60a5fa"/>
                        <circle cx="10" cy="15" r="1" fill="#60a5fa"/>
                      </g>
                    </svg>
                  </div>
                  <div>
                    <p>plat-dot v1.0.0</p>
                    <p>AI機能付き持ち物管理</p>
                  </div>
                </div>
              )}
              
              {/* Minimize toggle button */}
              {onToggleMinimize && (
                <button
                  onClick={onToggleMinimize}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title={isMinimized ? 'サイドバーを展開' : 'サイドバーを最小化'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMinimized ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    )}
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
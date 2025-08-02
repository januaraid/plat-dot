'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut, getSession } from 'next-auth/react'

interface HeaderProps {
  onMenuToggle: () => void
  isSidebarOpen: boolean
}

export function Header({ onMenuToggle, isSidebarOpen }: HeaderProps) {
  const { data: session, status, update } = useSession()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  // ページフォーカス時にセッション状態を更新
  useEffect(() => {
    const handleFocus = () => {
      update()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [update])

  const handleSignOut = () => {
    signOut()
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and menu toggle */}
          <div className="flex items-center">
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-label="メニューを開く"
            >
              <svg
                className={`h-6 w-6 transition-transform duration-200 ${
                  isSidebarOpen ? 'rotate-90' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <Link href="/" className="flex items-center ml-2 md:ml-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 p-1">
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
                <span className="font-bold text-xl text-gray-900">plat-dot</span>
              </div>
            </Link>
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="animate-pulse">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              </div>
            ) : status === 'authenticated' && session && 'hasSession' in session && session.hasSession ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="ユーザーメニューを開く"
                >
                  <img
                    className="h-8 w-8 rounded-full"
                    src={session?.session?.user?.image || session?.user?.image || '/default-avatar.svg'}
                    alt={session?.session?.user?.name || session?.user?.name || 'ユーザー'}
                  />
                </button>

                {/* User dropdown menu */}
                {isUserMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <div className="font-medium">{session?.session?.user?.name || session?.user?.name}</div>
                        <div className="text-gray-500">{session?.session?.user?.email || session?.user?.email}</div>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        プロフィール
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        設定
                      </Link>
                      <Link
                        href="/test"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        テストページ
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        ログアウト
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ログイン
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Close user menu when clicking outside */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </header>
  )
}
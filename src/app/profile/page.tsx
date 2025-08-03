'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface UserStats {
  totalItems: number
  totalFolders: number
  totalImages: number
  aiUsageCount: number
  registrationDate: string
  displayName: string
}

const ProfilePage = memo(function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // 認証状態を安定化（一度認証されたら loading への変化を無視）
  const authStateRef = useRef({ isAuthenticated: false, hasBeenAuthenticated: false })
  
  const isAuthenticated = useMemo(() => {
    const currentAuth = !!(status === 'authenticated' && session?.hasSession && session?.user?.email)
    if (currentAuth) {
      authStateRef.current.hasBeenAuthenticated = true
    }
    // 一度認証されていて、現在loadingの場合は認証済みとして扱う
    if (authStateRef.current.hasBeenAuthenticated && status === 'loading') {
      return true
    }
    authStateRef.current.isAuthenticated = currentAuth
    return currentAuth
  }, [status, session?.hasSession, session?.user?.email])

  const isAuthLoading = useMemo(() => {
    // 一度も認証されていない場合のみloadingとして扱う
    return status === 'loading' && !authStateRef.current.hasBeenAuthenticated
  }, [status])
  
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserStats = useCallback(async () => {
    try {
      const response = await fetch('/api/profile/stats')
      if (!response.ok) {
        throw new Error('統計情報の取得に失敗しました')
      }
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching user stats:', error)
      setError(error instanceof Error ? error.message : '統計情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (isAuthenticated) {
      console.log('Profile page - User authenticated:', {
        email: session?.user?.email,
        name: session?.user?.name,
        hasSession: session?.hasSession
      })
      fetchUserStats()
    }
  }, [isAuthenticated, fetchUserStats, session?.user?.email, session?.user?.name, session?.hasSession])

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6">
          {/* モバイル: 縦並び、デスクトップ: 横並び */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* プロフィール画像 */}
            <div className="flex-shrink-0 self-center sm:self-auto">
              {session?.user?.image ? (
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden">
                  <Image
                    src={session?.user?.image || ''}
                    alt="プロフィール画像"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
            </div>

            {/* ユーザー情報 */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats?.displayName || session?.user?.name || 'ユーザー'}
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base break-all">
                {session?.user?.email}
              </p>
              {stats && (
                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                  登録日: {new Date(stats.registrationDate).toLocaleDateString('ja-JP')}
                </p>
              )}
            </div>

            {/* 設定ボタン */}
            <div className="flex justify-center sm:justify-start">
              <Link
                href="/settings"
                className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                設定
              </Link>
            </div>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
          {loading ? (
            <div className="col-span-full text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2 text-sm">統計情報を読み込んでいます...</p>
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-8">
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={fetchUserStats}
                className="mt-2 text-blue-600 hover:text-blue-500 font-medium text-sm"
              >
                再試行
              </button>
            </div>
          ) : stats ? (
            <>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="ml-2 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">アイテム数</p>
                    <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.totalItems}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-2 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">フォルダ数</p>
                    <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.totalFolders}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-2 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">画像数</p>
                    <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.totalImages}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="ml-2 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">AI使用回数</p>
                    <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.aiUsageCount}</p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* アクションセクション */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* データ管理 */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">データ管理</h3>
            <div className="space-y-2 sm:space-y-3">
              <Link
                href="/dashboard"
                className="block w-full text-left px-2 sm:px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 sm:mr-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-xs sm:text-sm">ダッシュボードを表示</span>
                </div>
              </Link>
              <Link
                href="/items"
                className="block w-full text-left px-2 sm:px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 sm:mr-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="text-xs sm:text-sm">アイテム管理</span>
                </div>
              </Link>
            </div>
          </div>

          {/* セキュリティ */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">セキュリティ</h3>
            <div className="space-y-2 sm:space-y-3">
              <div className="px-2 sm:px-3 py-2 text-sm text-gray-700">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 sm:mr-3 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs sm:text-sm">Google OAuth認証済み</span>
                </div>
              </div>
              <Link
                href="/privacy"
                className="block w-full text-left px-2 sm:px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 sm:mr-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-xs sm:text-sm">プライバシーポリシー</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default ProfilePage
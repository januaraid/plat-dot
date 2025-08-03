'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession({
    required: false
  })
  const router = useRouter()
  
  // ランディングページ専用：フォーカス時の更新を完全に無視
  const stableSessionRef = useRef<any>(null)
  const stableStatusRef = useRef<string>('loading')
  const hasInitializedRef = useRef(false)

  // 初回のみセッション状態を記録し、その後は固定値を使用
  useEffect(() => {
    if (!hasInitializedRef.current && status !== 'loading') {
      hasInitializedRef.current = true
      stableSessionRef.current = session
      stableStatusRef.current = status
      
      // 認証済みの場合はリダイレクト
      if (status === 'authenticated' && session?.hasSession) {
        router.replace('/items')
      }
    }
  }, [status, session, router])

  // フォーカス時更新を無視するために安定したセッション情報を使用
  const stableSession = hasInitializedRef.current ? stableSessionRef.current : session
  const stableStatus = hasInitializedRef.current ? stableStatusRef.current : status

  // 初期化中またはリダイレクト中
  if (status === 'loading' || (stableStatus === 'authenticated' && stableSession?.hasSession)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }


  return (
    <div className="space-y-8 px-6 sm:px-6 lg:px-8 py-6">
      {/* Hero section */}
      <div className="text-center py-12 sm:py-16 bg-white rounded-lg shadow-sm px-8 sm:px-12">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">
          plat-dot へようこそ
        </h1>
        <p className="text-base sm:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
          AI画像認識とリアルタイム価格調査で、持ち物の価値を自動で追跡・管理
        </p>
        
        <div className="space-y-6">
          <div className="flex justify-center">
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-8 sm:px-10 py-4 sm:py-5 border border-transparent text-lg sm:text-xl font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-xl transform hover:scale-105 transition-all duration-200 w-full sm:w-auto justify-center max-w-sm"
            >
              <svg className="w-7 h-7 mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              今すぐ無料で始める
            </Link>
          </div>
          <p className="text-sm text-gray-500 text-center leading-relaxed">
            ログインすることで、プライバシーポリシーに同意したものとみなされます
          </p>
        </div>
      </div>

      {/* Features overview */}
      <div className="bg-white p-8 sm:p-12 rounded-lg shadow-sm">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-8 text-center">主な機能</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          <div className="text-center px-2">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">アイテム管理</h3>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              持ち物を写真付きで登録し、フォルダとカテゴリで効率的に整理
            </p>
          </div>
          
          <div className="text-center px-2">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">検索・フィルタ</h3>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              キーワード検索やカテゴリ・フォルダでの絞り込みで簡単に発見
            </p>
          </div>
          
          <div className="text-center px-2">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">画像管理</h3>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              複数の画像を登録し、サムネイル表示で見やすく管理
            </p>
          </div>

          <div className="text-center px-2">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">AI価格調査</h3>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              市場価格を自動調査し、アイテムの現在価値をリアルタイムで更新
            </p>
          </div>

          <div className="text-center px-2">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">AI画像認識</h3>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              写真を撮るだけで商品情報を自動識別・入力する画期的な機能
            </p>
          </div>

          <div className="text-center px-2">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">価値推移分析</h3>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              過去から現在まで価格変動を記録し、投資価値を可視化
            </p>
          </div>
        </div>
      </div>


    </div>
  )
}
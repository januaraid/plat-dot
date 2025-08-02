'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }


  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          plat-dot へようこそ
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          AI技術を活用した持ち物管理システムで、あなたの大切な物をスマートに管理しましょう
        </p>
        
        {!session || !session.hasSession ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signin"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                今すぐ始める
              </Link>
              <Link
                href="/auth/signin"
                className="inline-flex items-center px-6 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ログイン
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              Googleアカウントでログインして、持ち物管理を始めましょう
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-lg text-gray-700">
              おかえりなさい、{session?.session?.user?.name || session?.user?.name}さん！
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/items"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                アイテム管理を始める
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ダッシュボードを見る
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">アイテム管理</h3>
          <p className="text-gray-600 text-sm">
            持ち物を写真付きで登録し、カテゴリやフォルダで整理できます
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">AI機能</h3>
          <p className="text-gray-600 text-sm">
            画像から商品名を自動認識し、価格比較も行います（準備中）
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">画像管理</h3>
          <p className="text-gray-600 text-sm">
            アイテムの写真を複数登録し、サムネイル生成で効率的に表示
          </p>
        </div>
      </div>

      {/* Development status */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">開発状況</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>プロジェクト基盤構築</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>認証システム</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>アイテム管理API</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>フォルダ管理システム</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>画像アップロード機能</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>画像表示最適化</span>
            </div>
            <div className="flex items-center">
              <span className="text-blue-500 mr-2">🔄</span>
              <span>基本レイアウト実装中</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-400 mr-2">⏳</span>
              <span>AI機能（準備中）</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions for developers */}
      {session && session.hasSession && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">開発者向けリンク</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/test"
              className="text-center p-3 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow text-sm"
            >
              🧪 API テスト
            </Link>
            <Link
              href="/debug"
              className="text-center p-3 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow text-sm"
            >
              🐛 デバッグ
            </Link>
            <Link
              href="/test/optimized-images"
              className="text-center p-3 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow text-sm"
            >
              🖼️ 画像最適化
            </Link>
            <a
              href="/api/auth/session"
              target="_blank"
              rel="noopener noreferrer"
              className="text-center p-3 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow text-sm"
            >
              🔍 セッション
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
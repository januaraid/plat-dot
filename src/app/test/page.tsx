'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function TestIndexPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // 未ログインの場合はトップページにリダイレクト
  useEffect(() => {
    if (status !== 'loading' && (!session || !session.hasSession)) {
      router.replace('/')
    }
  }, [session, status, router])

  // 認証チェック中はローディング表示
  if (status === 'loading' || !session || !session.hasSession) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">API テストページ</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link 
          href="/test/items" 
          className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">アイテム管理API</h2>
          <p className="text-gray-600">
            アイテムの作成、取得、更新、削除機能をテストできます。
          </p>
          <div className="mt-4 text-sm text-blue-500">
            → テストページを開く
          </div>
        </Link>
        
        <Link 
          href="/test/folders" 
          className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">フォルダ管理API</h2>
          <p className="text-gray-600">
            フォルダの作成、階層管理、アイテム分類機能をテストできます。
          </p>
          <div className="mt-4 text-sm text-blue-500">
            → テストページを開く
          </div>
        </Link>
        
        <Link 
          href="/test/items/folders" 
          className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">アイテム・フォルダ関連</h2>
          <p className="text-gray-600">
            アイテムのフォルダ移動、未分類管理機能をテストできます。
          </p>
          <div className="mt-4 text-sm text-blue-500">
            → テストページを開く
          </div>
        </Link>
        
        <Link 
          href="/test/upload" 
          className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">画像アップロードAPI</h2>
          <p className="text-gray-600">
            画像のアップロード、ファイル検証機能をテストできます。
          </p>
          <div className="mt-4 text-sm text-blue-500">
            → テストページを開く
          </div>
        </Link>
        
        <Link 
          href="/test/images" 
          className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">画像管理機能</h2>
          <p className="text-gray-600">
            画像の一覧表示、削除、順序変更機能をテストできます。
          </p>
          <div className="mt-4 text-sm text-blue-500">
            → テストページを開く
          </div>
        </Link>
        
        <Link 
          href="/test/optimized-images" 
          className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">画像表示最適化</h2>
          <p className="text-gray-600">
            サムネイル、遅延読み込み、レスポンシブ画像をテストできます。
          </p>
          <div className="mt-4 text-sm text-blue-500">
            → テストページを開く
          </div>
        </Link>
      </div>
      
      <div className="mt-12 bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">開発者向け情報</h2>
        <div className="space-y-2 text-sm">
          <p><strong>認証:</strong> Google OAuth（NextAuth.js）</p>
          <p><strong>データベース:</strong> SQLite（開発環境）</p>
          <p><strong>API仕様:</strong> REST API with Zod validation</p>
          <p><strong>テストファイル:</strong> 
            <code className="bg-gray-100 px-2 py-1 rounded ml-2">test-items-api.md</code>
          </p>
        </div>
        
        <div className="mt-4">
          <h3 className="font-semibold mb-2">実装済みエンドポイント:</h3>
          <div className="text-sm space-y-3">
            <div>
              <h4 className="font-medium text-gray-800">アイテム管理API:</h4>
              <ul className="text-gray-600 space-y-1 ml-4">
                <li>• <code>GET /api/items</code> - アイテム一覧取得（検索・ページネーション対応）</li>
                <li>• <code>POST /api/items</code> - アイテム新規作成</li>
                <li>• <code>GET /api/items/[id]</code> - 単一アイテム取得</li>
                <li>• <code>PUT /api/items/[id]</code> - アイテム更新</li>
                <li>• <code>DELETE /api/items/[id]</code> - アイテム削除</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">フォルダ管理API:</h4>
              <ul className="text-gray-600 space-y-1 ml-4">
                <li>• <code>GET /api/folders</code> - フォルダ一覧取得（階層・カウント対応）</li>
                <li>• <code>POST /api/folders</code> - フォルダ新規作成（階層制限・重複チェック）</li>
                <li>• <code>GET /api/folders/[id]</code> - 単一フォルダ取得</li>
                <li>• <code>PUT /api/folders/[id]</code> - フォルダ更新（循環参照チェック）</li>
                <li>• <code>DELETE /api/folders/[id]</code> - フォルダ削除（アイテム移動処理）</li>
                <li>• <code>POST /api/folders/move</code> - フォルダ移動（階層制限・循環参照チェック）</li>
                <li>• <code>GET /api/folders/tree</code> - フォルダツリー取得（階層構造・統計情報）</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">アイテム・フォルダ関連API:</h4>
              <ul className="text-gray-600 space-y-1 ml-4">
                <li>• <code>POST /api/items/move</code> - アイテムのフォルダ移動</li>
                <li>• <code>GET /api/folders/[id]/items</code> - フォルダ内アイテム一覧取得</li>
                <li>• <code>GET /api/items/uncategorized</code> - 未分類アイテム一覧取得（統計情報付き）</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">画像アップロードAPI:</h4>
              <ul className="text-gray-600 space-y-1 ml-4">
                <li>• <code>POST /api/upload</code> - 画像アップロード（サムネイル自動生成付き）</li>
                <li>• <code>GET /api/upload</code> - アップロード設定情報取得</li>
                <li>• <code>GET /api/uploads/[fileName]</code> - オリジナル画像取得</li>
                <li>• <code>GET /api/uploads/thumbnails/[size]/[fileName]</code> - サムネイル画像取得</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">画像管理API:</h4>
              <ul className="text-gray-600 space-y-1 ml-4">
                <li>• <code>GET /api/items/[id]/images</code> - アイテムの画像一覧取得</li>
                <li>• <code>DELETE /api/images/[id]</code> - 画像削除（ファイルとDB両方）</li>
                <li>• <code>PUT /api/images/order</code> - 画像順序更新（ドラッグ&ドロップ対応準備）</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
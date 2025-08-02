'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function DebugPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // 未ログインの場合はトップページにリダイレクト
  useEffect(() => {
    if (status !== 'loading' && (!session || !session.hasSession)) {
      router.replace('/')
    }
  }, [session, status, router])
  const [debugResult, setDebugResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDebugTest = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/test/items-debug')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${data.error || 'Unknown error'}`)
      }
      
      setDebugResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testItemsAPI = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Testing /api/items...')
      const response = await fetch('/api/items?page=1&limit=5')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(`Items API Error ${response.status}: ${data.error || 'Unknown error'}`)
      }
      
      console.log('Items API Success:', data)
      setDebugResult({
        ...debugResult,
        itemsAPI: {
          success: true,
          itemCount: data.items?.length || 0,
          pagination: data.pagination,
        }
      })
    } catch (err) {
      console.error('Items API Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      runDebugTest()
    }
  }, [status])

  if (status === 'loading') {
    return <div className="p-8">Loading session...</div>
  }

  if (status === 'unauthenticated') {
    return (
      <div className="p-8">
        <p>認証が必要です。</p>
        <a href="/auth/signin" className="text-blue-500 underline">ログイン</a>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">API デバッグページ</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">セッション情報</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
          {JSON.stringify({
            status,
            userId: session?.user?.id,
            email: session?.user?.email,
            name: session?.user?.name,
          }, null, 2)}
        </pre>
      </div>

      <div className="mb-8">
        <div className="flex gap-4 mb-4">
          <button
            onClick={runDebugTest}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'テスト中...' : 'デバッグテスト実行'}
          </button>
          
          <button
            onClick={testItemsAPI}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'テスト中...' : 'Items API テスト'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>エラー:</strong> {error}
          </div>
        )}

        {debugResult && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">デバッグ結果</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
              {JSON.stringify(debugResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">デバッグ情報</h3>
        <ul className="text-sm space-y-1">
          <li>• ブラウザの開発者ツール（F12）でコンソールを確認してください</li>
          <li>• サーバーサイドのログは開発サーバーのターミナルで確認できます</li>
          <li>• APIエラーの詳細は Network タブで確認できます</li>
        </ul>
      </div>
    </div>
  )
}
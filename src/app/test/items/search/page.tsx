'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Item {
  id: string
  name: string
  description?: string
  category?: string
  purchasePrice?: number
  createdAt: string
  updatedAt: string
  folder?: {
    id: string
    name: string
  }
}

interface SearchResponse {
  items: Item[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function ItemSearchTestPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('')
  const [folderId, setFolderId] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [sortField, setSortField] = useState<'createdAt' | 'updatedAt' | 'name' | 'purchaseDate'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<SearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const performSearch = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (category) params.append('category', category)
      if (folderId) params.append('folderId', folderId)
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      params.append('sort', sortField)
      params.append('order', sortOrder)

      const res = await fetch(`/api/items?${params.toString()}`)
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to search items')
      }

      const data = await res.json()
      setResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-4">
        <p>Loading...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">アイテム検索テスト</h1>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">検索キーワード (名前、説明、カテゴリーで検索)</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="例: カメラ、バッグ、電子機器"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">カテゴリー</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="例: 電子機器"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">フォルダID</label>
            <input
              type="text"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              placeholder="例: clxxxxxx"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">ページ</label>
            <input
              type="number"
              value={page}
              onChange={(e) => setPage(parseInt(e.target.value) || 1)}
              min={1}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">表示件数</label>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ソート項目</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="createdAt">作成日時</option>
              <option value="updatedAt">更新日時</option>
              <option value="name">名前</option>
              <option value="purchaseDate">購入日</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ソート順</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="desc">降順</option>
              <option value="asc">昇順</option>
            </select>
          </div>
        </div>

        <button
          onClick={performSearch}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? '検索中...' : '検索実行'}
        </button>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-bold">エラー:</p>
          <p>{error}</p>
        </div>
      )}

      {response && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded-md">
            <h2 className="font-semibold mb-2">検索結果情報</h2>
            <p>総件数: {response.pagination.total}件</p>
            <p>ページ: {response.pagination.page} / {response.pagination.totalPages}</p>
            <p>表示件数: {response.items.length}件</p>
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold">アイテム一覧</h2>
            {response.items.length === 0 ? (
              <p className="text-gray-500">検索結果がありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">名前</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">カテゴリー</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">フォルダ</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">価格</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">作成日時</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">更新日時</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {response.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-mono">{item.id.slice(0, 8)}...</td>
                        <td className="px-4 py-2 text-sm font-medium">{item.name}</td>
                        <td className="px-4 py-2 text-sm">{item.category || '-'}</td>
                        <td className="px-4 py-2 text-sm">{item.folder?.name || '-'}</td>
                        <td className="px-4 py-2 text-sm">
                          {item.purchasePrice ? `¥${item.purchasePrice.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">{formatDate(item.createdAt)}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{formatDate(item.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {response.pagination.totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded-md disabled:opacity-50"
              >
                前へ
              </button>
              <span className="px-3 py-1">
                {page} / {response.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(response.pagination.totalPages, page + 1))}
                disabled={page === response.pagination.totalPages}
                className="px-3 py-1 border rounded-md disabled:opacity-50"
              >
                次へ
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
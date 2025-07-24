'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Item {
  id: string
  name: string
  description?: string
  category?: string
  purchasePrice?: number
  purchaseDate?: string
  purchaseLocation?: string
  condition?: string
  notes?: string
  folderId?: string
  folder?: {
    id: string
    name: string
  }
  images: Array<{
    id: string
    url: string
    order: number
  }>
  createdAt: string
  updatedAt: string
}

export default function ItemsTestPage() {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  
  // フォーム用の状態
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    purchasePrice: '',
    purchaseDate: '',
    purchaseLocation: '',
    condition: '',
    notes: '',
  })

  // 検索用の状態
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // アイテム一覧を取得
  const fetchItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchQuery && { q: searchQuery }),
      })
      
      const response = await fetch(`/api/items?${params}`)
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      setItems(data.items)
      setTotalPages(data.pagination.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items')
    } finally {
      setLoading(false)
    }
  }

  // 初回ロード時とページ変更時にアイテムを取得
  useEffect(() => {
    if (status === 'authenticated') {
      fetchItems()
    }
  }, [status, currentPage, searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  // アイテムを作成
  const createItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    try {
      const body: any = {
        name: formData.name,
      }
      
      // オプショナルフィールドを追加
      if (formData.description) body.description = formData.description
      if (formData.category) body.category = formData.category
      if (formData.purchasePrice) body.purchasePrice = parseFloat(formData.purchasePrice)
      if (formData.purchaseDate) body.purchaseDate = new Date(formData.purchaseDate).toISOString()
      if (formData.purchaseLocation) body.purchaseLocation = formData.purchaseLocation
      if (formData.condition) body.condition = formData.condition
      if (formData.notes) body.notes = formData.notes
      
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error: ${response.status}`)
      }
      
      // フォームをリセットして一覧を更新
      setFormData({
        name: '',
        description: '',
        category: '',
        purchasePrice: '',
        purchaseDate: '',
        purchaseLocation: '',
        condition: '',
        notes: '',
      })
      
      fetchItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item')
    }
  }

  // アイテムを削除
  const deleteItem = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return
    
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      fetchItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item')
    }
  }

  // アイテムを更新
  const updateItem = async (id: string, updates: Partial<Item>) => {
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      fetchItems()
      setSelectedItem(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item')
    }
  }

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>
  }

  if (status === 'unauthenticated') {
    return (
      <div className="p-8">
        <p>このページを表示するにはログインが必要です。</p>
        <a href="/auth/signin" className="text-blue-500 underline">ログイン</a>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">アイテムAPI テストページ</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* アイテム作成フォーム */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">新規アイテム作成</h2>
        <form onSubmit={createItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">商品名 *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">説明</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">カテゴリー</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">購入価格</label>
              <input
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">購入日</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">購入場所</label>
              <input
                type="text"
                value={formData.purchaseLocation}
                onChange={(e) => setFormData({ ...formData, purchaseLocation: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            作成
          </button>
        </form>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">検索・フィルター</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="検索..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={fetchItems}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            再読み込み
          </button>
        </div>
      </div>

      {/* アイテム一覧 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">アイテム一覧</h2>
        
        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p>アイテムがありません</p>
        ) : (
          <>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      {item.description && (
                        <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                      )}
                      <div className="mt-2 text-sm text-gray-500 space-x-4">
                        {item.category && <span>カテゴリー: {item.category}</span>}
                        {item.purchasePrice && <span>価格: ¥{item.purchasePrice}</span>}
                        {item.folder && <span>フォルダ: {item.folder.name}</span>}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        ID: {item.id} | 更新: {new Date(item.updatedAt).toLocaleString('ja-JP')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-blue-500 hover:underline"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-red-500 hover:underline"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* ページネーション */}
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                前へ
              </button>
              <span className="px-3 py-1">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                次へ
              </button>
            </div>
          </>
        )}
      </div>

      {/* 編集モーダル */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">アイテムを編集</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                updateItem(selectedItem.id, {
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                })
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">商品名</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={selectedItem.name}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">説明</label>
                <textarea
                  name="description"
                  defaultValue={selectedItem.description}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  更新
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Item {
  id: string
  name: string
  description?: string
  category?: string
  folderId?: string
  folder?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

interface Folder {
  id: string
  name: string
  description?: string
  parentId?: string
  _count?: {
    items: number
    children: number
  }
}

export default function ItemFoldersTestPage() {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<Item[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [uncategorizedItems, setUncategorizedItems] = useState<Item[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [folderItems, setFolderItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // アイテム移動フォーム用の状態
  const [moveFormData, setMoveFormData] = useState({
    itemId: '',
    targetFolderId: '',
  })
  const [moveLoading, setMoveLoading] = useState(false)

  // アイテム一覧を取得
  const fetchItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/items?limit=50')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Error: ${response.status}`)
      }
      
      const data = await response.json()
      setItems(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items')
    } finally {
      setLoading(false)
    }
  }

  // フォルダ一覧を取得
  const fetchFolders = async () => {
    setError(null)
    try {
      const response = await fetch('/api/folders?includeItemCount=true')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Error: ${response.status}`)
      }
      
      const data = await response.json()
      setFolders(data.folders)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch folders')
    }
  }

  // 未分類アイテムを取得
  const fetchUncategorizedItems = async () => {
    setError(null)
    try {
      const response = await fetch('/api/items/uncategorized?includeStats=true')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Error: ${response.status}`)
      }
      
      const data = await response.json()
      setUncategorizedItems(data.items)
      console.log('未分類アイテム統計:', data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch uncategorized items')
    }
  }

  // フォルダ内アイテムを取得
  const fetchFolderItems = async (folderId: string) => {
    setError(null)
    try {
      const response = await fetch(`/api/folders/${folderId}/items`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Error: ${response.status}`)
      }
      
      const data = await response.json()
      setFolderItems(data.items)
      setSelectedFolder(folderId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch folder items')
    }
  }

  // アイテムを移動
  const moveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setMoveLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/items/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moveFormData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Error: ${response.status}`)
      }
      
      const result = await response.json()
      alert(result.message)
      
      // フォームをリセットしてデータを更新
      setMoveFormData({ itemId: '', targetFolderId: '' })
      fetchItems()
      fetchFolders()
      fetchUncategorizedItems()
      if (selectedFolder) {
        fetchFolderItems(selectedFolder)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move item')
    } finally {
      setMoveLoading(false)
    }
  }

  // 初回ロード時にデータを取得
  useEffect(() => {
    if (status === 'authenticated') {
      fetchItems()
      fetchFolders()
      fetchUncategorizedItems()
    }
  }, [status])

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
      <div className="mb-6">
        <Link href="/test/items" className="text-blue-500 hover:underline">
          ← アイテム管理テストに戻る
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">アイテム・フォルダ関連機能 テストページ</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左側: アイテム移動機能 */}
        <div className="space-y-6">
          {/* アイテム移動フォーム */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">アイテム移動</h2>
            <form onSubmit={moveItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">移動するアイテムID *</label>
                <input
                  type="text"
                  required
                  value={moveFormData.itemId}
                  onChange={(e) => setMoveFormData({ ...moveFormData, itemId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="移動するアイテムのID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">移動先フォルダID</label>
                <input
                  type="text"
                  value={moveFormData.targetFolderId}
                  onChange={(e) => setMoveFormData({ ...moveFormData, targetFolderId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="移動先フォルダID（未分類の場合は空白）"
                />
              </div>
              
              <button
                type="submit"
                disabled={moveLoading}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {moveLoading ? '移動中...' : 'アイテムを移動'}
              </button>
            </form>
            
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>使い方:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>下のアイテム一覧からIDをコピーして入力</li>
                <li>フォルダ一覧からフォルダIDをコピーして入力</li>
                <li>未分類に移動する場合は移動先フォルダIDを空白にする</li>
              </ul>
            </div>
          </div>

          {/* フォルダ一覧 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">フォルダ一覧</h2>
            {folders.length === 0 ? (
              <p className="text-gray-500">フォルダがありません</p>
            ) : (
              <div className="space-y-3">
                {folders.map((folder) => (
                  <div key={folder.id} className="border rounded p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{folder.name}</h3>
                        {folder.description && (
                          <p className="text-sm text-gray-600 mt-1">{folder.description}</p>
                        )}
                        <div className="text-sm text-gray-500 mt-1">
                          <span>{folder._count?.items || 0}個のアイテム</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          ID: {folder.id}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => fetchFolderItems(folder.id)}
                          className="text-blue-500 hover:underline text-sm"
                        >
                          アイテム表示
                        </button>
                        <button
                          onClick={() => setMoveFormData({ ...moveFormData, targetFolderId: folder.id })}
                          className="text-green-500 hover:underline text-sm"
                        >
                          移動先に設定
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右側: アイテム一覧と詳細 */}
        <div className="space-y-6">
          {/* 未分類アイテム */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">未分類アイテム</h2>
              <button
                onClick={fetchUncategorizedItems}
                className="text-blue-500 hover:underline text-sm"
              >
                更新
              </button>
            </div>
            
            {uncategorizedItems.length === 0 ? (
              <p className="text-gray-500">未分類のアイテムはありません</p>
            ) : (
              <div className="space-y-3">
                {uncategorizedItems.map((item) => (
                  <div key={item.id} className="border rounded p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                        {item.category && (
                          <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mt-1">
                            {item.category}
                          </span>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          ID: {item.id}
                        </div>
                      </div>
                      <button
                        onClick={() => setMoveFormData({ ...moveFormData, itemId: item.id })}
                        className="text-blue-500 hover:underline text-sm ml-4"
                      >
                        移動対象に設定
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* フォルダ内アイテム */}
          {selectedFolder && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">フォルダ内アイテム</h2>
              
              {folderItems.length === 0 ? (
                <p className="text-gray-500">このフォルダにはアイテムがありません</p>
              ) : (
                <div className="space-y-3">
                  {folderItems.map((item) => (
                    <div key={item.id} className="border rounded p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                          {item.category && (
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                              {item.category}
                            </span>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            ID: {item.id}
                          </div>
                        </div>
                        <button
                          onClick={() => setMoveFormData({ ...moveFormData, itemId: item.id })}
                          className="text-blue-500 hover:underline text-sm ml-4"
                        >
                          移動対象に設定
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 全アイテム一覧（参考用） */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">全アイテム一覧（参考）</h2>
              <button
                onClick={fetchItems}
                disabled={loading}
                className="text-blue-500 hover:underline text-sm disabled:opacity-50"
              >
                {loading ? '読み込み中...' : '更新'}
              </button>
            </div>
            
            {loading ? (
              <p>Loading...</p>
            ) : items.length === 0 ? (
              <p className="text-gray-500">アイテムがありません</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="border rounded p-2 text-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                        {item.folder && (
                          <span className="ml-2 text-green-600">📁 {item.folder.name}</span>
                        )}
                        {!item.folder && (
                          <span className="ml-2 text-gray-500">📄 未分類</span>
                        )}
                      </div>
                      <button
                        onClick={() => setMoveFormData({ ...moveFormData, itemId: item.id })}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        選択
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
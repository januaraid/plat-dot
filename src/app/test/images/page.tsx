'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Item {
  id: string
  name: string
  description?: string
  _count?: {
    images: number
  }
}

interface ItemImage {
  id: string
  url: string
  fileName?: string
  filename?: string
  fileSize?: number
  size?: number
  mimeType: string
  order: number
}

interface ItemWithImages {
  id: string
  name: string
  description?: string
}

export default function ImagesTestPage() {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<Item[]>([])
  const [selectedItem, setSelectedItem] = useState<string>('')
  const [images, setImages] = useState<ItemImage[]>([])
  const [itemInfo, setItemInfo] = useState<ItemWithImages | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 順序変更用の状態
  const [isReordering, setIsReordering] = useState(false)
  const [reorderData, setReorderData] = useState<{ imageId: string; order: number }[]>([])

  // アイテム一覧を取得
  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items?limit=100')
      if (!response.ok) {
        throw new Error('Failed to fetch items')
      }
      const data = await response.json()
      setItems(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items')
    }
  }

  // アイテムの画像一覧を取得
  const fetchItemImages = async (itemId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/items/${itemId}/images`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to fetch images')
      }
      const data = await response.json()
      setImages(data.images)
      setItemInfo(data.item)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch images')
      setImages([])
      setItemInfo(null)
    } finally {
      setLoading(false)
    }
  }

  // 初回ロード時にアイテム一覧を取得
  useEffect(() => {
    if (status === 'authenticated') {
      fetchItems()
    }
  }, [status])

  // アイテム選択時に画像を取得
  useEffect(() => {
    if (selectedItem) {
      fetchItemImages(selectedItem)
    }
  }, [selectedItem])

  // ファイルアップロード
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedItem) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('itemId', selectedItem)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Upload failed')
      }

      setSuccess(data.message)
      fetchItemImages(selectedItem)
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 画像削除
  const handleDeleteImage = async (imageId: string, fileName: string) => {
    if (!confirm(`画像「${fileName}」を削除しますか？\n\nこの操作は取り消せません。`)) {
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Delete failed')
      }

      setSuccess(data.message)
      fetchItemImages(selectedItem)
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 順序変更開始
  const startReordering = () => {
    setIsReordering(true)
    setReorderData(images.map(img => ({ imageId: img.id, order: img.order })))
  }

  // 順序変更
  const updateOrder = (imageId: string, newOrder: number) => {
    setReorderData(prev => 
      prev.map(item => 
        item.imageId === imageId ? { ...item, order: newOrder } : item
      )
    )
  }

  // 順序変更を保存
  const saveOrder = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/images/order', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageOrders: reorderData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Update failed')
      }

      setSuccess(data.message)
      setIsReordering(false)
      fetchItemImages(selectedItem)
    } catch (err) {
      setError(err instanceof Error ? err.message : '順序の更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 順序変更をキャンセル
  const cancelReordering = () => {
    setIsReordering(false)
    setReorderData([])
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
      <div className="mb-6">
        <Link href="/test" className="text-blue-500 hover:underline">
          ← テストページ一覧に戻る
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">画像管理機能 テストページ</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左側: アイテム選択とアップロード */}
        <div className="space-y-6">
          {/* アイテム選択 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">アイテム選択</h2>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">アイテムを選択してください</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item._count?.images || 0}/10枚)
                </option>
              ))}
            </select>
          </div>

          {/* 画像アップロード */}
          {selectedItem && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">画像アップロード</h2>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileUpload}
                disabled={loading || (images.length >= 10)}
                className="w-full border rounded px-3 py-2 disabled:opacity-50"
              />
              {images.length >= 10 && (
                <p className="mt-2 text-sm text-red-600">
                  最大10枚まで登録済みです。新しい画像を追加するには既存の画像を削除してください。
                </p>
              )}
            </div>
          )}

          {/* 統計情報 */}
          {itemInfo && images.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">統計情報</h2>
              <div className="space-y-2 text-sm">
                <p><strong>アイテム名:</strong> {itemInfo.name}</p>
                <p><strong>画像数:</strong> {images.length}/10枚</p>
                <p><strong>総容量:</strong> {
                  (images.reduce((sum, img) => sum + (img.size || img.fileSize || 0), 0) / 1024 / 1024).toFixed(2)
                }MB</p>
              </div>
            </div>
          )}
        </div>

        {/* 中央・右側: 画像一覧 */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">画像一覧</h2>
              {images.length > 1 && !isReordering && (
                <button
                  onClick={startReordering}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  順序を変更
                </button>
              )}
              {isReordering && (
                <div className="space-x-2">
                  <button
                    onClick={saveOrder}
                    disabled={loading}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    保存
                  </button>
                  <button
                    onClick={cancelReordering}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    キャンセル
                  </button>
                </div>
              )}
            </div>

            {loading && !images.length ? (
              <p>画像を読み込み中...</p>
            ) : !selectedItem ? (
              <p className="text-gray-500">アイテムを選択してください</p>
            ) : images.length === 0 ? (
              <p className="text-gray-500">このアイテムには画像がありません</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(isReordering ? reorderData.sort((a, b) => a.order - b.order) : images).map((imageData) => {
                  const image = isReordering 
                    ? images.find(img => img.id === imageData.imageId)!
                    : imageData as ItemImage

                  return (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={`/api/uploads/${image.filename || image.fileName}`}
                          alt={`画像 ${image.order + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* 順序バッジ */}
                      <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                        {isReordering ? (
                          <select
                            value={imageData.order}
                            onChange={(e) => updateOrder(image.id, parseInt(e.target.value))}
                            className="bg-transparent border border-white rounded px-1"
                          >
                            {Array.from({ length: images.length }, (_, i) => (
                              <option key={i} value={i} className="bg-black">
                                {i + 1}
                              </option>
                            ))}
                          </select>
                        ) : (
                          `${image.order + 1}`
                        )}
                      </div>
                      
                      {/* 削除ボタン */}
                      {!isReordering && (
                        <button
                          onClick={() => handleDeleteImage(image.id, image.filename || image.fileName || '')}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="削除"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      
                      {/* ファイル情報 */}
                      <div className="mt-2 text-xs text-gray-600">
                        <p>{((image.size || image.fileSize || 0) / 1024).toFixed(1)}KB</p>
                        <p className="truncate">{image.filename || image.fileName}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ドラッグ&ドロップ説明 */}
            {isReordering && (
              <div className="mt-4 text-sm text-gray-600">
                <p>ドロップダウンで画像の表示順序を変更できます。変更後は「保存」ボタンをクリックしてください。</p>
                <p className="mt-1">（将来的にドラッグ&ドロップに対応予定）</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
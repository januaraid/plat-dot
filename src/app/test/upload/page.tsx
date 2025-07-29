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

interface UploadedImage {
  id: string
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  order: number
  item: {
    id: string
    name: string
  }
}

interface UploadConfig {
  maxFileSize: number
  maxFileSizeMB: number
  acceptedFormats: string[]
  acceptedExtensions: string[]
  maxImagesPerItem: number
}

export default function UploadTestPage() {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<Item[]>([])
  const [uploadConfig, setUploadConfig] = useState<UploadConfig | null>(null)
  const [selectedItem, setSelectedItem] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // アップロード設定を取得
  const fetchUploadConfig = async () => {
    try {
      const response = await fetch('/api/upload')
      if (!response.ok) {
        throw new Error('Failed to fetch upload config')
      }
      const data = await response.json()
      setUploadConfig(data.config)
    } catch (err) {
      console.error('Failed to fetch upload config:', err)
    }
  }

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

  // 初回ロード時にデータを取得
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUploadConfig()
      fetchItems()
    }
  }, [status])

  // ファイル選択の処理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setSuccess(null)

    // クライアントサイドバリデーション
    if (!uploadConfig) return

    // ファイルサイズチェック
    if (file.size > uploadConfig.maxFileSize) {
      setError(`ファイルサイズは${uploadConfig.maxFileSizeMB}MB以下にしてください`)
      setSelectedFile(null)
      return
    }

    // ファイル形式チェック
    if (!uploadConfig.acceptedFormats.includes(file.type)) {
      setError('JPG、PNG、WEBPファイルのみアップロード可能です')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  // ファイルアップロードの処理
  const handleUpload = async () => {
    if (!selectedFile || !selectedItem) {
      setError('アイテムとファイルを選択してください')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
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
      setUploadedImages([...uploadedImages, data.image])
      
      // フォームをリセット
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // アイテム一覧を更新
      fetchItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました')
    } finally {
      setLoading(false)
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
      <div className="mb-6">
        <Link href="/test" className="text-blue-500 hover:underline">
          ← テストページ一覧に戻る
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">画像アップロード テストページ</h1>
      
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左側: アップロードフォーム */}
        <div className="space-y-6">
          {/* アップロード設定情報 */}
          {uploadConfig && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">アップロード設定</h2>
              <div className="space-y-2 text-sm">
                <p><strong>最大ファイルサイズ:</strong> {uploadConfig.maxFileSizeMB}MB</p>
                <p><strong>対応形式:</strong> JPG、PNG、WEBP</p>
                <p><strong>1アイテムあたりの最大画像数:</strong> {uploadConfig.maxImagesPerItem}枚</p>
              </div>
            </div>
          )}

          {/* アップロードフォーム */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">画像アップロード</h2>
            
            <div className="space-y-4">
              {/* アイテム選択 */}
              <div>
                <label className="block text-sm font-medium mb-1">アイテム選択 *</label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">アイテムを選択してください</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item._count?.images || 0}/10枚)
                    </option>
                  ))}
                </select>
              </div>

              {/* ファイル選択 */}
              <div>
                <label className="block text-sm font-medium mb-1">画像ファイル *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleFileSelect}
                  className="w-full border rounded px-3 py-2"
                />
                {selectedFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p>ファイル名: {selectedFile.name}</p>
                    <p>サイズ: {(selectedFile.size / 1024 / 1024).toFixed(2)}MB</p>
                  </div>
                )}
              </div>

              {/* アップロードボタン */}
              <button
                onClick={handleUpload}
                disabled={loading || !selectedFile || !selectedItem}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'アップロード中...' : 'アップロード'}
              </button>
            </div>
          </div>

          {/* ドラッグ&ドロップ対応テスト（将来実装用） */}
          <div className="bg-gray-100 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-500">ドラッグ&ドロップ（将来実装）</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
              <p>ここに画像をドラッグ&ドロップ</p>
              <p className="text-sm mt-2">（現在は未実装）</p>
            </div>
          </div>
        </div>

        {/* 右側: アップロード済み画像 */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">アップロード済み画像（このセッション）</h2>
            
            {uploadedImages.length === 0 ? (
              <p className="text-gray-500">まだ画像をアップロードしていません</p>
            ) : (
              <div className="space-y-4">
                {uploadedImages.map((image) => (
                  <div key={image.id} className="border rounded p-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={`/api/uploads/${image.fileName}`}
                          alt={image.fileName}
                          className="w-24 h-24 object-cover rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{image.item.name}</h3>
                        <p className="text-sm text-gray-600">
                          ファイル名: {image.fileName}
                        </p>
                        <p className="text-sm text-gray-600">
                          サイズ: {(image.fileSize / 1024 / 1024).toFixed(2)}MB
                        </p>
                        <p className="text-sm text-gray-600">
                          形式: {image.mimeType}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          ID: {image.id}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* API情報 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">API情報</h2>
            <div className="space-y-3 text-sm">
              <div>
                <h3 className="font-medium">アップロードエンドポイント</h3>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">POST /api/upload</code>
              </div>
              
              <div>
                <h3 className="font-medium">必須パラメータ</h3>
                <ul className="list-disc list-inside text-gray-600">
                  <li>file: 画像ファイル（multipart/form-data）</li>
                  <li>itemId: アイテムID</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium">オプションパラメータ</h3>
                <ul className="list-disc list-inside text-gray-600">
                  <li>order: 表示順序（0-9）</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium">画像取得エンドポイント</h3>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">GET /api/uploads/[fileName]</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { LazyImage, ResponsiveImage } from '@/components/LazyImage'
import { ImageModal, ImageGallery } from '@/components/ImageModal'

interface Item {
  id: string
  name: string
  description?: string
}

interface ItemImage {
  id: string
  url: string
  filename: string
  mimeType: string
  size: number
  order: number
}

interface ImageWithThumbnails extends ItemImage {
  thumbnails?: {
    small: string
    medium: string
    large: string
  }
  imageInfo?: {
    width: number
    height: number
    format: string
    hasAlpha: boolean
    aspectRatio: string
  }
}

export default function OptimizedImagesTestPage() {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<Item[]>([])
  const [selectedItem, setSelectedItem] = useState<string>('')
  const [images, setImages] = useState<ImageWithThumbnails[]>([])
  const [itemInfo, setItemInfo] = useState<Item | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // モーダル用の状態
  const [modalOpen, setModalOpen] = useState(false)
  const [modalImage, setModalImage] = useState<{ src: string; alt: string; caption?: string } | null>(null)
  
  // テスト設定
  const [loadingMode, setLoadingMode] = useState<'lazy' | 'eager'>('lazy')
  const [imageSize, setImageSize] = useState<'small' | 'medium' | 'large'>('medium')

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
      
      // サムネイル情報を追加（実際のAPIレスポンスに合わせて調整）
      const imagesWithThumbnails = data.images.map((image: ItemImage) => ({
        ...image,
        thumbnails: {
          small: `/api/uploads/thumbnails/small/${image.filename}`,
          medium: `/api/uploads/thumbnails/medium/${image.filename}`,
          large: `/api/uploads/thumbnails/large/${image.filename}`,
        }
      }))
      
      setImages(imagesWithThumbnails)
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

  // 画像クリック時のモーダル表示
  const handleImageClick = (image: ImageWithThumbnails) => {
    // URLを正しいAPIパスに変換
    const normalizedUrl = image.url.startsWith('/uploads/') 
      ? image.url.replace('/uploads/', '/api/uploads/') 
      : image.url
    
    setModalImage({
      src: normalizedUrl,
      alt: `${itemInfo?.name || 'アイテム'} - 画像 ${image.order + 1}`,
      caption: `${itemInfo?.name || 'アイテム'} - 画像 ${image.order + 1} (${((image.size) / 1024).toFixed(1)}KB)`
    })
    setModalOpen(true)
  }

  // ギャラリー用の画像データ変換
  const galleryImages = images.map(image => {
    const normalizedUrl = image.url.startsWith('/uploads/') 
      ? image.url.replace('/uploads/', '/api/uploads/') 
      : image.url
    
    return {
      id: image.id,
      src: normalizedUrl,
      alt: `${itemInfo?.name || 'アイテム'} - 画像 ${image.order + 1}`,
      thumbnailSrc: image.thumbnails?.[imageSize],
      caption: `${itemInfo?.name || 'アイテム'} - 画像 ${image.order + 1}`
    }
  })

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

      <h1 className="text-3xl font-bold mb-8">画像表示最適化 テストページ</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 左側: 設定とコントロール */}
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
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* 表示設定 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">表示設定</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">読み込みモード</label>
                <select
                  value={loadingMode}
                  onChange={(e) => setLoadingMode(e.target.value as 'lazy' | 'eager')}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="lazy">遅延読み込み (Lazy)</option>
                  <option value="eager">即座読み込み (Eager)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">サムネイルサイズ</label>
                <select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value as 'small' | 'medium' | 'large')}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="small">小 (150x150)</option>
                  <option value="medium">中 (300x300)</option>
                  <option value="large">大 (600x600)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 最適化情報 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">最適化機能</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-green-600">
                <span className="mr-2">✓</span>
                <span>サムネイル自動生成</span>
              </div>
              <div className="flex items-center text-green-600">
                <span className="mr-2">✓</span>
                <span>遅延読み込み対応</span>
              </div>
              <div className="flex items-center text-green-600">
                <span className="mr-2">✓</span>
                <span>レスポンシブ画像</span>
              </div>
              <div className="flex items-center text-green-600">
                <span className="mr-2">✓</span>
                <span>プログレッシブJPEG</span>
              </div>
              <div className="flex items-center text-green-600">
                <span className="mr-2">✓</span>
                <span>EXIF削除</span>
              </div>
            </div>
          </div>
        </div>

        {/* 右側: 画像表示 */}
        <div className="lg:col-span-3 space-y-8">
          {/* LazyImageコンポーネントのテスト */}
          {images.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">LazyImage コンポーネント</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="aspect-square">
                    <LazyImage
                      src={image.url}
                      alt={`画像 ${image.order + 1}`}
                      thumbnailSrc={image.thumbnails?.[imageSize]}
                      className="w-full h-full rounded-lg"
                      loading={loadingMode}
                      onClick={() => handleImageClick(image)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ResponsiveImageコンポーネントのテスト */}
          {images.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">ResponsiveImage コンポーネント</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {images.slice(0, 4).map((image) => (
                  <div key={`responsive-${image.id}`} className="aspect-video">
                    <ResponsiveImage
                      src={image.url}
                      alt={`画像 ${image.order + 1}`}
                      thumbnails={image.thumbnails}
                      className="w-full h-full rounded-lg"
                      loading={loadingMode}
                      onClick={() => handleImageClick(image)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ImageGalleryコンポーネントのテスト */}
          {images.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">ImageGallery コンポーネント</h2>
              <ImageGallery
                images={galleryImages}
                onImageClick={(index) => {
                  const image = images[index]
                  if (image) handleImageClick(image)
                }}
                loading={loadingMode}
              />
            </div>
          )}

          {/* パフォーマンステスト */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">パフォーマンステスト</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                開発者ツールの Network タブを開いて画像の読み込み状況を確認してください。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-medium mb-2">遅延読み込み (Lazy)</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>スクロール時に段階的に読み込み</li>
                    <li>初期表示が高速</li>
                    <li>不要な画像は読み込まない</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">即座読み込み (Eager)</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>全画像を同時に読み込み</li>
                    <li>表示後の操作が高速</li>
                    <li>帯域幅を多く使用</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {!selectedItem && (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500">左側からアイテムを選択して画像表示最適化機能をテストしてください</p>
            </div>
          )}

          {selectedItem && images.length === 0 && !loading && (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500">このアイテムには画像がありません</p>
            </div>
          )}
        </div>
      </div>

      {/* 画像モーダル */}
      {modalImage && (
        <ImageModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          src={modalImage.src}
          alt={modalImage.alt}
          caption={modalImage.caption}
        />
      )}
    </div>
  )
}
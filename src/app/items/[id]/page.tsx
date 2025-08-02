'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Item } from '@/components/items/ItemCard'
import { UploadedImage } from '@/components/UploadedImage'
import { useItems } from '@/hooks/useItems'

interface Props {
  params: Promise<{ id: string }>
}

export default function ItemDetailPage({ params }: Props) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { deleteItem } = useItems()
  
  const resolvedParams = use(params)
  const itemId = resolvedParams.id
  
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // 認証チェック
  useEffect(() => {
    if (status !== 'loading' && (!session || !session.hasSession)) {
      router.replace('/')
    }
  }, [session, status, router])

  // アイテム詳細を取得
  useEffect(() => {
    const fetchItem = async () => {
      if (status === 'loading') return
      if (!session || !session.hasSession) return

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/items/${itemId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('アイテムが見つかりませんでした')
          }
          throw new Error('アイテムの取得に失敗しました')
        }

        const data = await response.json()
        setItem(data)
      } catch (err) {
        console.error('Error fetching item:', err)
        setError(err instanceof Error ? err.message : 'エラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [itemId, session, status])

  const handleDelete = async () => {
    if (!item) return
    
    if (!confirm('このアイテムを削除してもよろしいですか？')) {
      return
    }

    try {
      await deleteItem(item.id)
      router.push('/items')
    } catch (err) {
      console.error('Error deleting item:', err)
      alert(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }

  const formatPrice = (price?: number) => {
    if (!price) return null
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  // 認証チェック中
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 未ログイン
  if (!session || !session.hasSession) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // ローディング中
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // エラー状態
  if (error || !item) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.76 0L3.054 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {error || 'アイテムが見つかりませんでした'}
          </h3>
          <div className="mt-6">
            <Link
              href="/items"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              アイテム一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const primaryImage = item.images.find(img => img.order === 0) || item.images[0]
  const hasMultipleImages = item.images.length > 1

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 戻るボタン */}
      <div className="flex items-center justify-between">
        <Link
          href="/items"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          アイテム一覧に戻る
        </Link>
        
        {/* アクションボタン */}
        <div className="flex items-center space-x-3">
          <Link
            href={`/items/${item.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            編集
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            削除
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8 p-4 lg:p-6">
          {/* 画像エリア */}
          <div className="space-y-4">
            {/* メイン画像 */}
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
              {primaryImage && !imageError ? (
                <UploadedImage
                  src={item.images[selectedImageIndex]?.url || primaryImage.url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* サムネイル一覧 */}
            {hasMultipleImages && (
              <div className="flex space-x-2 overflow-x-auto">
                {item.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index 
                        ? 'border-blue-500' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <UploadedImage
                      src={image.url}
                      alt={`${item.name} ${index + 1}`}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 詳細情報 */}
          <div className="space-y-4 lg:space-y-6">
            {/* 基本情報 */}
            <div>
              <h1 className="text-xl lg:text-3xl font-bold text-gray-900 mb-3 lg:mb-4">{item.name}</h1>
              
              {/* メタ情報 */}
              <div className="flex flex-wrap gap-2 mb-3 lg:mb-4">
                {item.category && (
                  <span className="inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-medium bg-blue-100 text-blue-800">
                    {item.category}
                  </span>
                )}
                {item.folder && (
                  <span className="inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-medium bg-gray-100 text-gray-800">
                    <svg className="w-3 lg:w-4 h-3 lg:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                    {item.folder.name}
                  </span>
                )}
              </div>

              {item.description && (
                <p className="text-sm lg:text-base text-gray-600 leading-relaxed mb-3 lg:mb-4 whitespace-pre-wrap">
                  {item.description}
                </p>
              )}
            </div>

            {/* 購入情報 */}
            {(item.purchasePrice || item.purchaseDate || item.purchaseLocation) && (
              <div className="bg-gray-50 rounded-lg p-3 lg:p-4">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2 lg:mb-3">購入情報</h3>
                <dl className="space-y-1.5 lg:space-y-2">
                  {item.purchasePrice && (
                    <div className="flex flex-col gap-1">
                      <dt className="text-xs lg:text-sm font-medium text-gray-500">価格</dt>
                      <dd className="text-sm lg:text-base text-gray-900 font-semibold">
                        {formatPrice(item.purchasePrice)}
                      </dd>
                    </div>
                  )}
                  {item.purchaseDate && (
                    <div className="flex flex-col gap-1">
                      <dt className="text-xs lg:text-sm font-medium text-gray-500">購入日</dt>
                      <dd className="text-xs lg:text-sm text-gray-900">
                        {formatDate(item.purchaseDate)}
                      </dd>
                    </div>
                  )}
                  {item.purchaseLocation && (
                    <div className="flex flex-col gap-1">
                      <dt className="text-xs lg:text-sm font-medium text-gray-500">購入場所</dt>
                      <dd className="text-xs lg:text-sm text-gray-900 break-all">
                        {item.purchaseLocation}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* その他情報 */}
            <div className="space-y-3 lg:space-y-4">
              {item.condition && (
                <div>
                  <h4 className="text-xs lg:text-sm font-medium text-gray-500 mb-1">状態</h4>
                  <p className="text-xs lg:text-sm text-gray-900">{item.condition}</p>
                </div>
              )}
              
              {item.notes && (
                <div>
                  <h4 className="text-xs lg:text-sm font-medium text-gray-500 mb-1">メモ</h4>
                  <p className="text-xs lg:text-sm text-gray-900 whitespace-pre-wrap">{item.notes}</p>
                </div>
              )}
            </div>

            {/* 作成・更新日時 */}
            <div className="pt-3 lg:pt-4 border-t border-gray-200">
              <dl className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <dt>作成日時</dt>
                  <dd>{formatDate(item.createdAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>更新日時</dt>
                  <dd>{formatDate(item.updatedAt)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* 今後の拡張エリア（AI機能など）*/}
      <div className="bg-gray-50 rounded-lg p-4 lg:p-6">
        <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2 lg:mb-3">AI機能（今後実装予定）</h3>
        <div className="text-xs lg:text-sm text-gray-500 space-y-1">
          <p>・商品の価値査定</p>
          <p>・類似商品の検索</p>
          <p>・最適な保管方法の提案</p>
          <p>・メンテナンス時期の通知</p>
        </div>
      </div>
    </div>
  )
}
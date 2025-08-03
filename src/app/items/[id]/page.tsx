'use client'

import { useState, useEffect, use, useRef, useMemo, memo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Item } from '@/components/items/ItemCard'
import { UploadedImage } from '@/components/UploadedImage'
import { useItems } from '@/hooks/useItems'
import { PriceTrendChart } from '@/components/charts/PriceTrendChart'

interface Props {
  params: Promise<{ id: string }>
}

const ItemDetailPage = memo(function ItemDetailPage({ params }: Props) {
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
  const [priceSearchLoading, setPriceSearchLoading] = useState(false)
  const [priceSearchResult, setPriceSearchResult] = useState<any>(null)
  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [priceHistoryLoading, setPriceHistoryLoading] = useState(false)
  const [priceHistoryLoaded, setPriceHistoryLoaded] = useState(false)

  // 認証状態を安定化（一度認証されたら loading への変化を無視）
  const authStateRef = useRef({ isAuthenticated: false, hasBeenAuthenticated: false })
  
  const isAuthenticated = useMemo(() => {
    const currentAuth = status === 'authenticated' && session?.hasSession
    if (currentAuth) {
      authStateRef.current.hasBeenAuthenticated = true
    }
    // 一度認証されていて、現在loadingの場合は認証済みとして扱う
    if (authStateRef.current.hasBeenAuthenticated && status === 'loading') {
      return true
    }
    authStateRef.current.isAuthenticated = currentAuth
    return currentAuth
  }, [status, session?.hasSession])

  const isAuthLoading = useMemo(() => {
    // 一度も認証されていない場合のみloadingとして扱う
    return status === 'loading' && !authStateRef.current.hasBeenAuthenticated
  }, [status])

  // 認証チェック
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, isAuthLoading, router])

  // アイテム詳細を取得
  useEffect(() => {
    const fetchItem = async () => {
      if (isAuthLoading) return
      if (!isAuthenticated) return

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
  }, [itemId, isAuthenticated, isAuthLoading])

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

  // 価格履歴を取得（初回のみ）
  const fetchPriceHistory = useCallback(async () => {
    if (!item) return

    try {
      setPriceHistoryLoading(true)
      const response = await fetch(`/api/items/${itemId}/price-history?limit=5`)
      
      if (!response.ok) {
        throw new Error('価格履歴の取得に失敗しました')
      }

      const result = await response.json()
      if (result.success) {
        setPriceHistory(result.data)
        setPriceHistoryLoaded(true)
      }
    } catch (error) {
      console.error('価格履歴取得エラー:', error)
    } finally {
      setPriceHistoryLoading(false)
    }
  }, [item, itemId])

  // 手動で価格履歴を更新
  const refreshPriceHistory = useCallback(async () => {
    if (!item) return

    try {
      setPriceHistoryLoading(true)
      const response = await fetch(`/api/items/${itemId}/price-history?limit=5`)
      
      if (!response.ok) {
        throw new Error('価格履歴の取得に失敗しました')
      }

      const result = await response.json()
      if (result.success) {
        setPriceHistory(result.data)
      }
    } catch (error) {
      console.error('価格履歴取得エラー:', error)
    } finally {
      setPriceHistoryLoading(false)
    }
  }, [item, itemId])

  // 価格履歴を削除
  const deletePriceHistory = useCallback(async (historyId: string) => {
    if (!item) return false

    try {
      const response = await fetch(`/api/items/${itemId}/price-history/${historyId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('削除に失敗しました')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || '削除に失敗しました')
      }

      // 成功したら価格履歴を再取得
      refreshPriceHistory()
      return true
    } catch (error) {
      console.error('価格履歴削除エラー:', error)
      alert(error instanceof Error ? error.message : '削除中にエラーが発生しました')
      return false
    }
  }, [item, itemId, refreshPriceHistory])

  // AI価格調査を実行
  const handlePriceSearch = useCallback(async () => {
    if (!item || priceSearchLoading) return

    try {
      setPriceSearchLoading(true)
      setPriceSearchResult(null)

      const response = await fetch('/api/ai/search-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemId: item.id,
          itemName: item.name,
          manufacturer: item.manufacturer
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`価格調査に失敗しました: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '価格調査に失敗しました')
      }

      setPriceSearchResult(result.data)
      // 価格履歴を再取得
      refreshPriceHistory()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '価格調査中にエラーが発生しました'
      setPriceSearchResult({
        error: errorMessage,
        prices: [],
        summary: 'エラーが発生したため価格情報を取得できませんでした。'
      })
      console.error('価格調査エラー:', error)
    } finally {
      setPriceSearchLoading(false)
    }
  }, [item, refreshPriceHistory])

  // アイテム詳細取得後に価格履歴も取得（初回のみ）
  useEffect(() => {
    if (item && !priceHistoryLoaded) {
      fetchPriceHistory()
    }
  }, [item, priceHistoryLoaded, fetchPriceHistory])

  // 認証チェック中
  if (isAuthLoading || !isAuthenticated) {
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
                {item.manufacturer && (
                  <span className="inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-medium bg-green-100 text-green-800">
                    {item.manufacturer}
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

      {/* AI価格調査・履歴エリア */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              AI価格調査
            </h3>
            <button
              onClick={handlePriceSearch}
              disabled={priceSearchLoading || !item}
              className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all"
            >
              {priceSearchLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-700" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  価格調査中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  価格を調査
                </>
              )}
            </button>
          </div>

          {/* 最新の価格調査結果 */}
          {priceSearchResult && (
            <div className={`mb-6 p-4 rounded-lg border ${
              priceSearchResult.error 
                ? 'bg-red-50 border-red-200'
                : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`text-base font-semibold flex items-center ${
                  priceSearchResult.error ? 'text-red-800' : 'text-green-800'
                }`}>
                  {priceSearchResult.error ? (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.76 0L3.054 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      調査エラー
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      最新の調査結果
                    </>
                  )}
                </h4>
                <button
                  type="button"
                  onClick={() => setPriceSearchResult(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="調査結果を閉じる"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {priceSearchResult.error ? (
                <p className="text-sm text-red-700">{priceSearchResult.error}</p>
              ) : (
                <div className="space-y-4">
                  {/* 価格サマリー */}
                  {priceSearchResult.summary && (
                    <div className="bg-white p-3 rounded-md border border-gray-200">
                      <div className="text-sm text-gray-700 leading-relaxed">
                        {priceSearchResult.summary.split('\n').map((line: string, index: number) => (
                          <div key={index} className={index > 0 ? 'mt-2' : ''}>
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 価格一覧 */}
                  {priceSearchResult.prices && priceSearchResult.prices.length > 0 ? (
                    <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                        <h5 className="text-sm font-medium text-gray-900">
                          価格情報 ({priceSearchResult.prices.length}件)
                        </h5>
                      </div>
                      <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                        {priceSearchResult.prices.map((price: any, index: number) => (
                          <div key={index} className="p-3 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {price.price}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {price.site}
                                  </span>
                                  {price.condition && (
                                    <span className="text-xs text-gray-500">
                                      {price.condition}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {price.url && (
                                <a
                                  href={price.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  詳細
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : !priceSearchResult.error && (
                    <div className="bg-white rounded-md border border-gray-200 p-4 text-center">
                      <svg className="mx-auto w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm text-gray-600 mb-1">価格情報が見つかりませんでした</p>
                      <p className="text-xs text-gray-500">
                        商品名やメーカー名を確認して、再度検索してみてください
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 価格履歴 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-semibold text-gray-900 flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                価格履歴
              </h4>
              {priceHistory.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      refreshPriceHistory()
                    }}
                    disabled={priceHistoryLoading}
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    {priceHistoryLoading ? '更新中...' : '更新'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (confirm(`${priceHistory.length}件の価格履歴をすべて削除してもよろしいですか？`)) {
                        // 全履歴を順次削除
                        Promise.all(priceHistory.map(history => deletePriceHistory(history.id)))
                          .then(() => {
                            console.log('全ての価格履歴を削除しました')
                          })
                          .catch(error => {
                            console.error('一括削除エラー:', error)
                          })
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-800"
                    title="全ての履歴を削除"
                  >
                    全削除
                  </button>
                </div>
              )}
            </div>

            {priceHistoryLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : priceHistory.length > 0 ? (
              <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                  {priceHistory.map((history: any, index: number) => (
                    <div key={history.id} className="p-3 hover:bg-white transition-colors relative group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">
                          {formatDate(history.searchDate)}
                        </div>
                        <div className="flex items-center space-x-2">
                          {history.avgPrice && (
                            <span className="text-sm font-medium text-gray-900">
                              平均: ¥{Number(history.avgPrice).toLocaleString()}
                            </span>
                          )}
                          {history.listingCount > 0 && (
                            <span className="text-xs text-gray-500">
                              {history.listingCount}件
                            </span>
                          )}
                          {/* 削除ボタン */}
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (confirm('この価格調査履歴を削除してもよろしいですか？')) {
                                deletePriceHistory(history.id)
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-100 text-red-600"
                            title="この履歴を削除"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {history.summary && (
                        <div className="text-xs text-gray-600 leading-relaxed">
                          {history.summary.split('\n').map((line: string, index: number) => (
                            <div key={index} className={index > 0 ? 'mt-1' : ''}>
                              {line}
                            </div>
                          ))}
                        </div>
                      )}
                      {(history.details || history.priceDetails) && (history.details || history.priceDetails).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(history.details || history.priceDetails).slice(0, 3).map((detail: any, i: number) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                              {detail.site}: {detail.price}
                            </span>
                          ))}
                          {(history.details || history.priceDetails).length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{(history.details || history.priceDetails).length - 3}件
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
                <svg className="mx-auto w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm text-gray-500">
                  まだ価格調査を行っていません
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  「価格を調査」ボタンをクリックして相場を確認しましょう
                </p>
              </div>
            )}

            {/* 価格推移グラフ */}
            {priceHistory.length > 0 && (
              <div className="mt-6">
                <PriceTrendChart priceHistory={priceHistory} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

export default ItemDetailPage
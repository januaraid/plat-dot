'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UploadedImage } from '@/components/UploadedImage'

export interface ItemImage {
  id: string
  url: string
  order: number
}

export interface ItemFolder {
  id: string
  name: string
}

export interface PriceHistory {
  id: string
  searchDate: string
  minPrice?: number | null
  avgPrice?: number | null
  maxPrice?: number | null
  listingCount: number
}

export interface Item {
  id: string
  name: string
  description?: string
  category?: string
  manufacturer?: string
  purchasePrice?: number
  purchaseDate?: string
  purchaseLocation?: string
  condition?: string
  notes?: string
  folderId?: string
  userId?: string
  createdAt: string
  updatedAt: string
  folder?: ItemFolder
  images: ItemImage[]
  priceHistory?: PriceHistory[]
}

interface ItemCardProps {
  item: Item
  viewMode?: 'grid' | 'list'
  onClick?: (item: Item) => void
  onDragStart?: (item: Item) => void
  onDragEnd?: () => void
}

export function ItemCard({ item, viewMode = 'grid', onClick, onDragStart, onDragEnd }: ItemCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const primaryImage = item.images.find(img => img.order === 0) || item.images[0]
  const hasMultipleImages = item.images.length > 1

  const formatPrice = (price?: number | null) => {
    if (!price) return null
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price)
  }

  // 価格比較を計算
  const calculatePriceComparison = () => {
    if (!item.purchasePrice || !item.priceHistory?.[0]?.avgPrice) {
      return null
    }

    const purchasePrice = item.purchasePrice
    const currentPrice = Number(item.priceHistory[0].avgPrice)
    const difference = currentPrice - purchasePrice
    const percentageChange = (difference / purchasePrice) * 100

    return {
      difference,
      percentageChange,
      currentPrice,
      isIncrease: difference > 0,
      isDecrease: difference < 0,
    }
  }

  const priceComparison = calculatePriceComparison()
  const latestPriceHistory = item.priceHistory?.[0]

  const handleCardClick = () => {
    if (onClick) {
      onClick(item)
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    const itemJson = JSON.stringify(item)
    console.log('[ItemCard] Drag start:', {
      itemId: item.id,
      itemName: item.name,
      itemJson: itemJson,
      hasOnDragStart: !!onDragStart
    })
    
    e.dataTransfer.setData('application/json', itemJson)
    e.dataTransfer.effectAllowed = 'move'
    
    if (onDragStart) {
      onDragStart(item)
    }
  }

  const handleDragEnd = () => {
    if (onDragEnd) {
      onDragEnd()
    }
  }

  if (viewMode === 'list') {
    return (
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        draggable={!!onDragStart}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex p-3 space-x-3">
          {/* Image */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden relative">
              {primaryImage && !imageError ? (
                <UploadedImage
                  src={primaryImage.url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {hasMultipleImages && (
                <div className="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded">
                  {item.images.length}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {item.name}
                </h3>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 ml-3 text-right">
                <div className="space-y-1">
                  {formatPrice(item.purchasePrice) && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">購入</span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatPrice(item.purchasePrice)}
                      </span>
                    </div>
                  )}
                  {latestPriceHistory?.avgPrice && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">相場</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-blue-600">
                          {formatPrice(latestPriceHistory.avgPrice)}
                        </span>
                        {priceComparison && (
                          <div className={`flex items-center text-xs font-medium ${
                            priceComparison.isIncrease ? 'text-red-600' : 
                            priceComparison.isDecrease ? 'text-green-600' : 
                            'text-gray-500'
                          }`}>
                            {priceComparison.isIncrease ? (
                              <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                                <span className="ml-0.5">{Math.abs(priceComparison.percentageChange).toFixed(0)}%</span>
                              </>
                            ) : priceComparison.isDecrease ? (
                              <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                                <span className="ml-0.5">{Math.abs(priceComparison.percentageChange).toFixed(0)}%</span>
                              </>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-2 mt-2">
              {item.category && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {item.category}
                </span>
              )}
              {item.folder && (
                <span className="inline-flex items-center text-xs text-gray-500">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  </svg>
                  {item.folder.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer group overflow-hidden"
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={!!onDragStart}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Image - 16:9のアスペクト比に変更してコンパクトに */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {primaryImage && !imageError ? (
          <UploadedImage
            src={primaryImage.url}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* カテゴリ・フォルダ情報 - 画像上部 */}
        <div className="absolute top-1 left-1 flex gap-1">
          {item.category && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-600 bg-opacity-90 text-white backdrop-blur-sm">
              {item.category}
            </span>
          )}
          {item.folder && (
            <div className="flex items-center bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded backdrop-blur-sm">
              <svg className="w-3 h-3 mr-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              <span className="truncate max-w-[5rem]">{item.folder.name}</span>
            </div>
          )}
        </div>

        {/* Image count badge */}
        {hasMultipleImages && (
          <div className="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
            {item.images.length}
          </div>
        )}

        {/* Quick action overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium pointer-events-none">
              詳細を見る
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* 商品名 - 1行に短縮 */}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-2">
          {item.name}
        </h3>

        {/* 価格情報 - コンパクトに */}
        {(formatPrice(item.purchasePrice) || latestPriceHistory?.avgPrice) && (
          <div className="space-y-1">
            {formatPrice(item.purchasePrice) && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">購入</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatPrice(item.purchasePrice)}
                </span>
              </div>
            )}
            
            {latestPriceHistory?.avgPrice && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">相場</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-blue-600">
                    {formatPrice(latestPriceHistory.avgPrice)}
                  </span>
                  {priceComparison && (
                    <div className={`flex items-center text-xs font-medium ${
                      priceComparison.isIncrease ? 'text-red-600' : 
                      priceComparison.isDecrease ? 'text-green-600' : 
                      'text-gray-500'
                    }`}>
                      {priceComparison.isIncrease ? (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                          <span className="ml-0.5">{Math.abs(priceComparison.percentageChange).toFixed(0)}%</span>
                        </>
                      ) : priceComparison.isDecrease ? (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          <span className="ml-0.5">{Math.abs(priceComparison.percentageChange).toFixed(0)}%</span>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
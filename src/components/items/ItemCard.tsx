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

  const formatPrice = (price?: number) => {
    if (!price) return null
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price)
  }

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
        <div className="flex p-4 space-x-4">
          {/* Image */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden relative">
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
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {item.name}
                </h3>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 ml-4">
                {formatPrice(item.purchasePrice) && (
                  <span className="text-lg font-bold text-green-600">
                    {formatPrice(item.purchasePrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Meta info */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {item.category && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.category}
                  </span>
                )}
                {item.folder && (
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                    {item.folder.name}
                  </span>
                )}
              </div>
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
      {/* Image */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
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
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.category && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 bg-opacity-90 text-white backdrop-blur-sm">
              {item.category}
            </span>
          )}
          {item.folder && (
            <div className="flex items-center bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              <span className="truncate max-w-[6rem]">{item.folder.name}</span>
            </div>
          )}
        </div>

        {/* Image count badge */}
        {hasMultipleImages && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
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
      <div className="p-4">
        {/* 商品名 - 2行まで表示 */}
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2 leading-tight mb-3 min-h-[2.5rem]">
          {item.name}
        </h3>

        {/* 価格 - 目立つ位置に */}
        {formatPrice(item.purchasePrice) && (
          <div className="mb-2">
            <span className="text-xl font-bold text-green-600">
              {formatPrice(item.purchasePrice)}
            </span>
          </div>
        )}

        {/* 説明文 - 1行のみ、簡潔に */}
        {item.description && (
          <p className="text-sm text-gray-500 line-clamp-1">
            {item.description}
          </p>
        )}
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Item } from './ItemCard'
import { UploadedImage } from '@/components/UploadedImage'

interface ItemDetailModalProps {
  item: Item | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (item: Item) => void
  onDelete?: (item: Item) => void
}

export function ItemDetailModal({ 
  item, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete 
}: ItemDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageError, setImageError] = useState(false)

  // Reset image index when item changes
  useEffect(() => {
    setCurrentImageIndex(0)
    setImageError(false)
  }, [item])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !item) return null

  const formatPrice = (price?: number) => {
    if (!price) return null
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const currentImage = item.images[currentImageIndex]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
          
          {/* Header */}
          <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
            <button
              type="button"
              className="rounded-md bg-white p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={onClose}
            >
              <span className="sr-only">閉じる</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Image section */}
              <div className="space-y-4">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                  {currentImage && !imageError ? (
                    <UploadedImage
                      src={currentImage.url}
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

                {/* Image thumbnails */}
                {item.images.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {item.images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => {
                          setCurrentImageIndex(index)
                          setImageError(false)
                        }}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                          index === currentImageIndex
                            ? 'border-blue-500'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <UploadedImage
                          src={image.url}
                          alt={`${item.name} - ${index + 1}`}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Details section */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {item.name}
                  </h1>
                  {formatPrice(item.price) && (
                    <div className="text-3xl font-bold text-green-600 mb-4">
                      {formatPrice(item.price)}
                    </div>
                  )}
                </div>

                {item.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">説明</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="font-medium text-gray-900">数量</dt>
                    <dd className="text-gray-700">{item.quantity}</dd>
                  </div>
                  
                  {item.category && (
                    <div>
                      <dt className="font-medium text-gray-900">カテゴリ</dt>
                      <dd className="text-gray-700">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.category}
                        </span>
                      </dd>
                    </div>
                  )}
                  
                  {item.location && (
                    <div>
                      <dt className="font-medium text-gray-900">保管場所</dt>
                      <dd className="text-gray-700">{item.location}</dd>
                    </div>
                  )}
                  
                  {item.folder && (
                    <div>
                      <dt className="font-medium text-gray-900">フォルダ</dt>
                      <dd className="text-gray-700 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        </svg>
                        {item.folder.name}
                      </dd>
                    </div>
                  )}
                  
                  <div>
                    <dt className="font-medium text-gray-900">作成日時</dt>
                    <dd className="text-gray-700">{formatDate(item.createdAt)}</dd>
                  </div>
                  
                  <div>
                    <dt className="font-medium text-gray-900">更新日時</dt>
                    <dd className="text-gray-700">{formatDate(item.updatedAt)}</dd>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex space-x-3 pt-4">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(item)}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      編集
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(item)}
                      className="inline-flex justify-center items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      削除
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
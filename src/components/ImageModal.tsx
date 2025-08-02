'use client'

import { useEffect, useRef } from 'react'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  src: string
  alt: string
  caption?: string
}

export function ImageModal({ isOpen, onClose, src, alt, caption }: ImageModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // スクロールを無効化
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // モーダル外クリックで閉じる
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={handleBackdropClick}
      />
      
      {/* Modal content */}
      <div 
        ref={modalRef}
        className="relative max-w-full max-h-full p-4"
        onClick={handleBackdropClick}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors"
          aria-label="閉じる"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Navigation buttons */}
        <div className="absolute inset-y-0 left-2 flex items-center">
          <button className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors opacity-50 cursor-not-allowed">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        
        <div className="absolute inset-y-0 right-2 flex items-center">
          <button className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors opacity-50 cursor-not-allowed">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Image */}
        <div className="flex flex-col items-center">
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[80vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Caption */}
          {caption && (
            <div className="mt-4 text-white text-center bg-black bg-opacity-50 px-4 py-2 rounded">
              {caption}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ImageGalleryProps {
  images: Array<{
    id: string
    src: string
    alt: string
    thumbnailSrc?: string
    caption?: string
  }>
  onImageClick?: (index: number) => void
  className?: string
  loading?: 'lazy' | 'eager'
}

export function ImageGallery({ 
  images, 
  onImageClick, 
  className = '',
  loading = 'lazy' 
}: ImageGalleryProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {images.map((image, index) => (
        <div
          key={image.id}
          className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
          onClick={() => onImageClick?.(index)}
        >
          <img
            src={image.thumbnailSrc || image.src}
            alt={image.alt}
            loading={loading}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  )
}
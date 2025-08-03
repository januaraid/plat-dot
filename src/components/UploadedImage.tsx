'use client'

import Image from 'next/image'
import { useState } from 'react'

interface UploadedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  onError?: () => void
  sizes?: string
  // サムネイルサイズを指定（thumbnailSmall, thumbnailMedium, thumbnailLargeが利用可能な場合）
  thumbnailSize?: 'small' | 'medium' | 'large'
  // 画像データにサムネイルURLが含まれている場合
  thumbnailUrls?: {
    small?: string
    medium?: string
    large?: string
  }
}

export function UploadedImage({
  src,
  alt,
  width,
  height,
  fill,
  className = '',
  onError,
  sizes,
  thumbnailSize,
  thumbnailUrls,
}: UploadedImageProps) {
  const [error, setError] = useState(false)

  // 使用する画像URLを決定（サムネイルが利用可能な場合は優先して使用）
  const getImageUrl = () => {
    // サムネイルサイズが指定されていて、サムネイルURLが利用可能な場合
    if (thumbnailSize && thumbnailUrls) {
      const thumbnailUrl = thumbnailUrls[thumbnailSize]
      if (thumbnailUrl) {
        return thumbnailUrl
      }
    }
    
    // サムネイルが利用できない場合は元のURLを使用
    if (src.startsWith('/uploads/')) {
      return `/api${src}`
    }
    return src
  }

  const handleError = () => {
    setError(true)
    if (onError) {
      onError()
    }
  }

  if (error) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center text-gray-400 ${className}`}>
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  const imageProps = {
    src: getImageUrl(),
    alt,
    className,
    onError: handleError,
    ...(sizes && { sizes }),
  }

  if (fill) {
    return <Image {...imageProps} fill />
  }

  return (
    <Image
      {...imageProps}
      width={width || 100}
      height={height || 100}
    />
  )
}
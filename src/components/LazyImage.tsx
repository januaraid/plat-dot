'use client'

import { useState, useRef, useEffect } from 'react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  thumbnailSrc?: string
  width?: number
  height?: number
  onClick?: () => void
  loading?: 'lazy' | 'eager'
}

export function LazyImage({
  src,
  alt,
  className = '',
  thumbnailSrc,
  width,
  height,
  onClick,
  loading = 'lazy'
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager') {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px', // Load image 50px before it comes into view
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [loading])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setError(true)
  }

  const displaySrc = isInView ? src : (thumbnailSrc || src)

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Loading placeholder */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}

      {/* Error placeholder */}
      {error && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-500 text-sm text-center">
            <div className="mb-2">📷</div>
            <div>画像を読み込めませんでした</div>
          </div>
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={displaySrc}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          className={`
            w-full h-full object-cover transition-opacity duration-300
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
          `}
        />
      )}
    </div>
  )
}

interface ResponsiveImageProps {
  src: string
  alt: string
  thumbnails?: {
    small?: string
    medium?: string
    large?: string
  }
  className?: string
  sizes?: string
  onClick?: () => void
  loading?: 'lazy' | 'eager'
}

export function ResponsiveImage({
  src,
  alt,
  thumbnails,
  className = '',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  onClick,
  loading = 'lazy'
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager') {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px',
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [loading])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setError(true)
  }

  // Generate srcSet for responsive images
  const srcSet = thumbnails ? [
    thumbnails.small && `${thumbnails.small} 150w`,
    thumbnails.medium && `${thumbnails.medium} 300w`,
    thumbnails.large && `${thumbnails.large} 600w`,
    `${src} 1200w`
  ].filter(Boolean).join(', ') : undefined

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Loading placeholder */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}

      {/* Error placeholder */}
      {error && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-500 text-sm text-center">
            <div className="mb-2">📷</div>
            <div>画像を読み込めませんでした</div>
          </div>
        </div>
      )}

      {/* Responsive image */}
      {isInView && (
        <img
          src={thumbnails?.medium || src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`
            w-full h-full object-cover transition-opacity duration-300
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
          `}
        />
      )}
    </div>
  )
}
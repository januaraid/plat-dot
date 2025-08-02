'use client'

import { useState, useCallback } from 'react'

interface UploadedImageData {
  id: string
  url: string
  filename: string
  mimeType: string
  size: number
  order: number
  isPreview?: boolean
  file?: File
}

interface UseImageUploadModalOptions {
  itemId?: string
  maxImages?: number
  allowPreview?: boolean
}

export function useImageUploadModal({
  itemId,
  maxImages = 10,
  allowPreview = false
}: UseImageUploadModalOptions = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [images, setImages] = useState<UploadedImageData[]>([])

  const openModal = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  const updateImages = useCallback((newImages: UploadedImageData[]) => {
    setImages(newImages)
  }, [images.length])

  const initializeImages = useCallback((initialImages: UploadedImageData[]) => {
    setImages(initialImages)
  }, [])

  return {
    isOpen,
    images,
    openModal,
    closeModal,
    updateImages,
    initializeImages,
    modalProps: {
      isOpen,
      onClose: closeModal,
      itemId,
      images,
      onImagesChange: updateImages,
      maxImages,
      allowPreview
    }
  }
}
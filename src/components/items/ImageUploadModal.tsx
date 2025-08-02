'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { UploadedImage } from '@/components/UploadedImage'

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

interface UploadConfig {
  maxFileSize: number
  maxFileSizeMB: number
  acceptedFormats: string[]
  acceptedExtensions: string[]
  maxImagesPerItem: number
}

interface ImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
  itemId?: string
  images: UploadedImageData[]
  onImagesChange: (images: UploadedImageData[]) => void
  maxImages?: number
  allowPreview?: boolean
}

export function ImageUploadModal({
  isOpen,
  onClose,
  itemId,
  images,
  onImagesChange,
  maxImages = 10,
  allowPreview = false
}: ImageUploadModalProps) {
  const [uploadConfig, setUploadConfig] = useState<UploadConfig | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  
  const canAddMore = images.length < maxImages

  // アップロード設定を取得
  const fetchUploadConfig = useCallback(async () => {
    if (uploadConfig) return
    
    try {
      const response = await fetch('/api/upload')
      if (!response.ok) throw new Error('Failed to fetch upload config')
      const data = await response.json()
      setUploadConfig(data.config)
    } catch (err) {
      console.error('[ImageUploadModal] Failed to fetch upload config:', err)
    }
  }, [uploadConfig])

  // ファイルバリデーション
  const validateFile = useCallback((file: File): string | null => {
    if (!uploadConfig) return 'アップロード設定を読み込み中です'
    
    if (file.size > uploadConfig.maxFileSize) {
      return `ファイルサイズは${uploadConfig.maxFileSizeMB}MB以下にしてください`
    }
    
    if (!uploadConfig.acceptedFormats.includes(file.type)) {
      return 'JPG、PNG、WEBPファイルのみアップロード可能です'
    }
    
    if (images.length >= maxImages) {
      return `画像は最大${maxImages}枚まで追加できます`
    }
    
    return null
  }, [uploadConfig, images.length, maxImages])

  // プレビュー用にファイルからURLを生成
  const createPreviewUrl = useCallback((file: File): string => {
    return URL.createObjectURL(file)
  }, [])

  // ファイルアップロード処理
  const uploadFile = useCallback(async (file: File): Promise<UploadedImageData | null> => {
    const validation = validateFile(file)
    if (validation) {
      setError(validation)
      return null
    }

    // 新規作成時でプレビュー許可の場合は、プレビューオブジェクトを作成
    if (!itemId && allowPreview) {
      const previewData = {
        id: `preview_${Date.now()}_${Math.random()}`,
        url: createPreviewUrl(file),
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        order: images.length,
        isPreview: true,
        file: file
      }
      return previewData
    }

    // 編集時は実際にアップロード
    if (!itemId) {
      setError('アイテムIDが必要です')
      return null
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('order', images.length.toString())
      formData.append('itemId', itemId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || data.error || 'アップロードに失敗しました')
      }

      const uploadedData = {
        id: data.image.id,
        url: data.image.url,
        filename: data.image.filename || data.image.fileName,
        mimeType: data.image.mimeType,
        size: data.image.size || data.image.fileSize,
        order: data.image.order
      }
      return uploadedData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'アップロードに失敗しました'
      setError(errorMessage)
      return null
    }
  }, [itemId, allowPreview, images.length, validateFile, createPreviewUrl])

  // 複数ファイルの処理
  const handleFiles = useCallback(async (files: FileList) => {
    await fetchUploadConfig()
    
    setError(null)
    setUploading(true)

    const newImages: UploadedImageData[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      if (images.length + newImages.length >= maxImages) {
        setError(`画像は最大${maxImages}枚まで追加できます`)
        break
      }
      
      const uploadedImage = await uploadFile(file)
      if (uploadedImage) {
        newImages.push(uploadedImage)
      }
    }
    
    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages])
    }
    
    setUploading(false)
  }, [fetchUploadConfig, images, maxImages, onImagesChange, uploadFile])

  // ファイル選択
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
    
    // ファイル選択をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFiles])

  // ドラッグ&ドロップ
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
  }, [handleFiles])

  // 画像削除
  const handleRemoveImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }, [images, onImagesChange])

  // 画像順序変更
  const handleMoveImage = useCallback((fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    
    // orderを更新
    const updatedImages = newImages.map((img, index) => ({
      ...img,
      order: index
    }))
    
    onImagesChange(updatedImages)
  }, [images, onImagesChange])

  // モーダル外クリックで閉じる
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  // ESCキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      
      // 設定を取得
      fetchUploadConfig()
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, fetchUploadConfig])

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
      >
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">画像管理</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* エラー表示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* ファイル選択・ドロップエリア */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-6 ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : !canAddMore
                ? 'border-gray-200 bg-gray-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={!canAddMore ? undefined : handleDragOver}
            onDragLeave={!canAddMore ? undefined : handleDragLeave}
            onDrop={!canAddMore ? undefined : handleDrop}
          >
            <div className="space-y-3">
              {uploading ? (
                <>
                  <div className="mx-auto w-12 h-12 animate-spin">
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <p className="text-base text-gray-600">アップロード中...</p>
                </>
              ) : (
                <>
                  <svg className="mx-auto w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                  </svg>
                  
                  {canAddMore ? (
                    <>
                      <p className="text-base text-gray-600">
                        画像をドラッグ&ドロップするか、
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-500 hover:text-blue-600 underline ml-1"
                        >
                          ファイルを選択
                        </button>
                      </p>
                      <p className="text-sm text-gray-500">
                        JPG、PNG、WEBP形式、最大10MB、{maxImages}枚まで
                      </p>
                    </>
                  ) : (
                    <p className="text-base text-gray-500">
                      最大{maxImages}枚の画像が追加されています
                    </p>
                  )}
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={!canAddMore}
            />
          </div>

          {/* 画像プレビュー */}
          {images.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                追加された画像 ({images.length}/{maxImages})
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={image.id || index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      {image.isPreview ? (
                        <img
                          src={image.url}
                          alt={`プレビュー画像 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UploadedImage
                          src={image.url}
                          alt={`アップロード画像 ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    
                    {/* 順序バッジ */}
                    <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                    
                    {/* 操作ボタン */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-1">
                        {/* 左に移動 */}
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMoveImage(index, index - 1)}
                            className="p-1 bg-black bg-opacity-60 text-white rounded hover:bg-opacity-80"
                            title="左に移動"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                        )}
                        
                        {/* 右に移動 */}
                        {index < images.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMoveImage(index, index + 1)}
                            className="p-1 bg-black bg-opacity-60 text-white rounded hover:bg-opacity-80"
                            title="右に移動"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                        
                        {/* 削除 */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="p-1 bg-red-500 bg-opacity-80 text-white rounded hover:bg-opacity-100"
                          title="削除"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* ファイル情報 */}
                    <div className="mt-2 text-xs text-gray-500 truncate text-center">
                      {image.filename}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  )

  // Portalを使用してdocument.bodyに直接レンダリング
  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null
}
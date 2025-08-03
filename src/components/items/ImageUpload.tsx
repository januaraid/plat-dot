'use client'

import { useState, useRef, useCallback, useEffect, memo } from 'react'
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

interface ImageUploadProps {
  itemId?: string // 編集時のアイテムID
  images: UploadedImageData[]
  onImagesChange: (images: UploadedImageData[]) => void
  disabled?: boolean
  maxImages?: number
  allowPreview?: boolean // 新規作成時のプレビュー表示を許可
}

function ImageUploadComponent({
  itemId,
  images,
  onImagesChange,
  disabled = false,
  maxImages = 10,
  allowPreview = false
}: ImageUploadProps) {
  const [uploadConfig, setUploadConfig] = useState<UploadConfig | null>(null)
  const uploadConfigRef = useRef<UploadConfig | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const canAddMore = images.length < maxImages

  // アップロード設定を取得（初回のみ）
  const fetchUploadConfig = useCallback(async () => {
    if (uploadConfigRef.current) {
      return
    }
    
    try {
      const response = await fetch('/api/upload')
      if (!response.ok) throw new Error('Failed to fetch upload config')
      const data = await response.json()
      uploadConfigRef.current = data.config
      setUploadConfig(data.config)
    } catch (err) {
      console.error('[ImageUpload] Failed to fetch upload config:', err)
    }
  }, []) // 空の依存配列で再作成を防ぐ

  // ファイルバリデーション
  const validateFile = (file: File): string | null => {
    const config = uploadConfigRef.current
    
    if (!config) return 'アップロード設定を読み込み中です'
    
    if (file.size > config.maxFileSize) {
      return `ファイルサイズは${config.maxFileSizeMB}MB以下にしてください`
    }
    
    if (!config.acceptedFormats.includes(file.type)) {
      return 'JPG、PNG、WEBPファイルのみアップロード可能です'
    }
    
    if (images.length >= maxImages) {
      return `画像は最大${maxImages}枚まで追加できます`
    }
    
    return null
  }

  // プレビュー用にファイルからURLを生成
  const createPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file)
  }

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
        file: file // プレビューファイルを保持
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
        console.error('[ImageUpload] Upload failed:', data)
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
      console.error('[ImageUpload] Upload error:', err)
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
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
  }

  // 画像削除
  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  // 画像順序変更
  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    
    // orderを更新
    const updatedImages = newImages.map((img, index) => ({
      ...img,
      order: index
    }))
    
    onImagesChange(updatedImages)
  }

  // コンポーネント初期化時にconfig取得
  useEffect(() => {
    fetchUploadConfig()
  }, [fetchUploadConfig])

  return (
    <div className="space-y-4">
      {/* エラー表示 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* ファイル選択・ドロップエリア */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : disabled || !canAddMore
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={disabled || !canAddMore ? undefined : handleDragOver}
        onDragLeave={disabled || !canAddMore ? undefined : handleDragLeave}
        onDrop={disabled || !canAddMore ? undefined : handleDrop}
      >
        <div className="space-y-2">
          {uploading ? (
            <>
              <div className="mx-auto w-8 h-8 animate-spin">
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-sm text-gray-600">アップロード中...</p>
            </>
          ) : (
            <>
              <svg className="mx-auto w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
              </svg>
              
              {canAddMore && !disabled ? (
                <>
                  <p className="text-sm text-gray-600">
                    画像をドラッグ&ドロップするか、
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.click()
                        }
                      }}
                      className="text-blue-500 hover:text-blue-600 underline"
                    >
                      ファイルを選択
                    </button>
                  </p>
                  <p className="text-xs text-gray-500">
                    JPG、PNG、WEBP形式、最大5MB、{maxImages}枚まで
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  {disabled ? '編集が無効になっています' : `最大${maxImages}枚の画像が追加されています`}
                </p>
              )}
            </>
          )}
        </div>

        <input
          key={`file-input-${itemId || 'new'}`}
          ref={fileInputRef}
          id={`file-input-${itemId || 'new'}`}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || !canAddMore}
        />
      </div>

      {/* 画像プレビュー */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            追加された画像 ({images.length}/{maxImages})
          </h4>
          
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
                {!disabled && (
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
                )}
                
                {/* ファイル情報 */}
                <div className="mt-1 text-xs text-gray-500 truncate">
                  {image.filename}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// React.memoでコンポーネントをメモ化（デフォルトの浅い比較を使用）
export const ImageUpload = memo(ImageUploadComponent)
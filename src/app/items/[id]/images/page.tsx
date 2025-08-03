'use client'

import { useState, useEffect, useRef, useCallback, use, useMemo, memo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
  base64Data?: string
}

interface UploadConfig {
  maxFileSize: number
  maxFileSizeMB: number
  acceptedFormats: string[]
  acceptedExtensions: string[]
  maxImagesPerItem: number
}

interface Props {
  params: Promise<{ id: string }>
}

const ItemImagesPage = memo(function ItemImagesPage({ params }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  
  const [images, setImages] = useState<UploadedImageData[]>([])
  const [uploadConfig, setUploadConfig] = useState<UploadConfig | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // paramsをPromiseとして展開
  const resolvedParams = use(params)
  const itemId = resolvedParams.id
  const returnUrl = searchParams.get('return') || '/items'
  const isNewItem = itemId === 'new'
  const maxImages = 10

  // 安定した値のメモ化で不要な再レンダリングを防ぐ
  const stableValues = useMemo(() => ({
    itemId,
    returnUrl,
    isNewItem,
    maxImages
  }), [itemId, returnUrl, isNewItem])
  
  const fileInputId = useMemo(() => `file-input-${itemId}`, [itemId])

  console.log('[ItemImagesPage] Component loaded:', {
    ...stableValues,
    sessionStatus: status,
    hasSession: !!session?.hasSession
  })

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

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, isAuthLoading, router])

  // 既存画像の読み込み（編集時）- 依存関係を安定化
  useEffect(() => {
    const loadExistingImages = async () => {
      if (stableValues.isNewItem) {
        // 新規作成時はLocalStorageからプレビュー画像を復元
        const savedImages = localStorage.getItem(`item-images-preview-${stableValues.returnUrl}`)
        if (savedImages) {
          try {
            const parsed = JSON.parse(savedImages)
            setImages(parsed)
          } catch (err) {
            console.error('Failed to load preview images:', err)
          }
        }
        setLoading(false)
        return
      }

      // 既存アイテムの画像を取得
      try {
        const response = await fetch(`/api/items/${stableValues.itemId}`)
        if (response.ok) {
          const item = await response.json()
          if (item.images && item.images.length > 0) {
            setImages(item.images.map((img: any) => ({
              id: img.id,
              url: img.url,
              filename: `image_${img.order}.jpg`,
              mimeType: 'image/jpeg',
              size: 0,
              order: img.order
            })))
          }
        }
      } catch (err) {
        console.error('Failed to load existing images:', err)
      }
      setLoading(false)
    }

    if (isAuthenticated) {
      loadExistingImages()
    }
  }, [stableValues, isAuthenticated])

  // アップロード設定の取得
  useEffect(() => {
    const fetchUploadConfig = async () => {
      try {
        const response = await fetch('/api/upload')
        if (response.ok) {
          const data = await response.json()
          setUploadConfig(data.config)
        }
      } catch (err) {
        console.error('Failed to fetch upload config:', err)
      }
    }

    fetchUploadConfig()
  }, [])

  // ファイルバリデーション
  const validateFile = useCallback((file: File): string | null => {
    if (!uploadConfig) return 'アップロード設定を読み込み中です'
    
    if (file.size > uploadConfig.maxFileSize) {
      return `ファイルサイズは${uploadConfig.maxFileSizeMB}MB以下にしてください`
    }
    
    if (!uploadConfig.acceptedFormats.includes(file.type)) {
      return 'JPG、PNG、WEBPファイルのみアップロード可能です'
    }
    
    if (images.length >= stableValues.maxImages) {
      return `画像は最大${stableValues.maxImages}枚まで追加できます`
    }
    
    return null
  }, [uploadConfig, images.length, stableValues.maxImages])

  // プレビュー用にファイルからURLを生成
  const createPreviewUrl = useCallback((file: File): string => {
    return URL.createObjectURL(file)
  }, [])

  // ファイルをBase64に変換
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }, [])

  // ファイルアップロード処理
  const uploadFile = useCallback(async (file: File): Promise<UploadedImageData | null> => {
    const validation = validateFile(file)
    if (validation) {
      setError(validation)
      return null
    }

    // 新規作成時はプレビューオブジェクトを作成（Base64データとして保存）
    if (isNewItem) {
      try {
        const base64Data = await fileToBase64(file)
        const previewData = {
          id: `preview_${Date.now()}_${Math.random()}`,
          url: createPreviewUrl(file),
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          order: images.length,
          isPreview: true,
          base64Data: base64Data // Base64データとして保存
        }
        return previewData
      } catch (err) {
        setError('ファイルの読み込みに失敗しました')
        return null
      }
    }

    // 編集時は実際にアップロード
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
  }, [stableValues.itemId, stableValues.isNewItem, images.length, validateFile, createPreviewUrl, fileToBase64])

  // 複数ファイルの処理 - 依存関係を安定化
  const handleFiles = useCallback(async (files: FileList) => {
    console.log('[ItemImagesPage] handleFiles called with', files.length, 'files')
    setError(null)
    setUploading(true)

    const newImages: UploadedImageData[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log('[ItemImagesPage] Processing file:', file.name, file.type, file.size)
      
      if (images.length + newImages.length >= stableValues.maxImages) {
        setError(`画像は最大${stableValues.maxImages}枚まで追加できます`)
        break
      }
      
      const uploadedImage = await uploadFile(file)
      if (uploadedImage) {
        newImages.push(uploadedImage)
        console.log('[ItemImagesPage] File processed successfully:', uploadedImage.filename)
      }
    }
    
    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages]
      setImages(updatedImages)
      
      // 新規作成時はLocalStorageに保存
      if (stableValues.isNewItem) {
        localStorage.setItem(`item-images-preview-${stableValues.returnUrl}`, JSON.stringify(updatedImages))
      }
      console.log('[ItemImagesPage] Images updated, total count:', updatedImages.length)
    }
    
    setUploading(false)
  }, [images, uploadFile, stableValues])

  // ファイル選択
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[ItemImagesPage] File select event triggered', {
      target: e.target,
      files: e.target.files,
      fileCount: e.target.files?.length || 0,
      inputId: e.target.id,
      inputValue: e.target.value
    })
    
    const files = e.target.files
    if (files && files.length > 0) {
      console.log('[ItemImagesPage] Files selected:', Array.from(files).map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      })))
      handleFiles(files)
    } else {
      console.log('[ItemImagesPage] No files selected')
    }
    
    // ファイル選択をリセット
    e.target.value = ''
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

  // 画像削除 - 依存関係を安定化
  const handleRemoveImage = useCallback((index: number) => {
    const updatedImages = images.filter((_, i) => i !== index)
    setImages(updatedImages)
    
    // 新規作成時はLocalStorageを更新
    if (stableValues.isNewItem) {
      if (updatedImages.length === 0) {
        localStorage.removeItem(`item-images-preview-${stableValues.returnUrl}`)
      } else {
        localStorage.setItem(`item-images-preview-${stableValues.returnUrl}`, JSON.stringify(updatedImages))
      }
    }
  }, [images, stableValues])

  // 画像順序変更 - 依存関係を安定化
  const handleMoveImage = useCallback((fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    
    // orderを更新
    const updatedImages = newImages.map((img, index) => ({
      ...img,
      order: index
    }))
    
    setImages(updatedImages)
    
    // 新規作成時はLocalStorageを更新
    if (stableValues.isNewItem) {
      localStorage.setItem(`item-images-preview-${stableValues.returnUrl}`, JSON.stringify(updatedImages))
    }
  }, [images, stableValues])

  // 完了ボタン - 依存関係を安定化
  const handleComplete = useCallback(() => {
    console.log('[ItemImagesPage] Completing image management, returning to:', stableValues.returnUrl)
    router.push(stableValues.returnUrl)
  }, [router, stableValues.returnUrl])

  // 認証チェック中
  if (isAuthLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 未ログイン
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const canAddMore = images.length < stableValues.maxImages

  return (
    <div className="container mx-auto px-4 py-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={handleComplete}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              フォームに戻る
            </button>
            <h1 className="text-3xl font-bold text-gray-900">画像管理</h1>
            <p className="mt-2 text-gray-600">
              {stableValues.isNewItem ? '新規アイテムの画像を管理します' : 'アイテムの画像を管理します'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
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
                        onClick={() => {
                          console.log('[ItemImagesPage] File select button clicked')
                          const fileInput = document.getElementById(fileInputId) as HTMLInputElement
                          console.log('[ItemImagesPage] File input element:', fileInput)
                          if (fileInput) {
                            console.log('[ItemImagesPage] Triggering file input click')
                            fileInput.click()
                          } else {
                            console.log('[ItemImagesPage] File input element not found')
                          }
                        }}
                        className="text-blue-500 hover:text-blue-600 underline ml-1"
                      >
                        ファイルを選択
                      </button>
                    </p>
                    <p className="text-sm text-gray-500">
                      JPG、PNG、WEBP形式、最大10MB、{stableValues.maxImages}枚まで
                    </p>
                  </>
                ) : (
                  <p className="text-base text-gray-500">
                    最大{stableValues.maxImages}枚の画像が追加されています
                  </p>
                )}
              </>
            )}
          </div>

          <input
            id={fileInputId}
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
              追加された画像 ({images.length}/{stableValues.maxImages})
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={image.id || index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
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
        
        {/* 下部のアクションボタン */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleComplete}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            完了
          </button>
        </div>

      </div>
    </div>
  )
})

export default ItemImagesPage
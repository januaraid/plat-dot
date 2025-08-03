'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Item } from './ItemCard'
import { useFormPersistence } from '@/hooks/useFormPersistence'
import { usePerformanceProfiler } from '@/hooks/usePerformanceProfiler'

interface ItemFolder {
  id: string
  name: string
  displayName?: string
  depth?: number
}

interface ItemFormData {
  name: string
  description?: string
  category?: string
  manufacturer?: string
  purchasePrice?: number | string
  purchaseDate?: string
  purchaseLocation?: string
  condition?: string
  notes?: string
  folderId?: string
}

interface ItemFormProps {
  item?: Item | null
  mode: 'create' | 'edit'
  folders?: ItemFolder[]
  onSave: (itemData: ItemFormData) => Promise<void>
  loading?: boolean
  formKey?: string // フォーム永続化用のキー
}

export const ItemForm = memo(function ItemForm({
  item,
  mode,
  folders = [],
  onSave,
  loading = false,
  formKey
}: ItemFormProps) {
  const router = useRouter()
  
  // Performance profiling
  usePerformanceProfiler('ItemForm')
  
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    description: '',
    category: '',
    manufacturer: '',
    purchasePrice: '',
    purchaseDate: '',
    purchaseLocation: '',
    condition: '',
    notes: '',
    folderId: ''
  })
  const [images, setImages] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiRecognitionLoading, setAiRecognitionLoading] = useState(false)
  const [aiRecognitionResult, setAiRecognitionResult] = useState<any>(null)

  // フォーム永続化
  const persistenceKey = formKey || `item-form-${mode}-${item?.id || 'new'}`
  const { 
    loadFromStorage, 
    clearStorage, 
    saveFocusPosition, 
    restoreFocusPosition,
    clearFocusPosition 
  } = useFormPersistence({
    key: persistenceKey,
    data: formData,
    debounceMs: 300, // 300ms後に自動保存
    saveFocus: true
  })

  // フォームデータの初期化
  useEffect(() => {
    // まずローカルストレージから復元を試行
    const savedData = loadFromStorage()
    
    if (savedData) {
      // ローカルストレージにデータがある場合は復元（デフォルト値でマージ）
      setFormData({
        name: '',
        description: '',
        category: '',
        manufacturer: '',
        purchasePrice: '',
        purchaseDate: '',
        purchaseLocation: '',
        condition: '',
        notes: '',
        folderId: '',
        ...savedData
      })
    } else if (mode === 'edit' && item) {
      // ローカルストレージにデータがなく、編集モードの場合はアイテムデータを設定
      setFormData({
        name: item.name,
        description: item.description || '',
        category: item.category || '',
        manufacturer: item.manufacturer || '',
        purchasePrice: item.purchasePrice || '',
        purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : '', 
        purchaseLocation: item.purchaseLocation || '',
        condition: item.condition || '',
        notes: item.notes || '',
        folderId: item.folder?.id || ''
      })
      // 既存の画像を設定
      if (item.images && item.images.length > 0) {
        setImages(item.images.map(img => ({
          id: img.id,
          url: img.url,
          filename: `image_${img.order}.jpg`,
          mimeType: 'image/jpeg',
          size: 0,
          order: img.order
        })))
      }
    }
  }, [item, mode, loadFromStorage])


  // 画像データの読み込み関数
  const loadImages = useCallback(async () => {
    if (mode === 'edit' && item?.id) {
      try {
        const response = await fetch(`/api/items/${item.id}`)
        if (response.ok) {
          const updatedItem = await response.json()
          if (updatedItem.images) {
            const updatedImages = updatedItem.images.map((img: any) => ({
              id: img.id,
              url: img.url,
              filename: `image_${img.order}.jpg`,
              mimeType: 'image/jpeg',
              size: 0,
              order: img.order
            }))
            setImages(updatedImages)
          } else {
            setImages([])
          }
        }
      } catch (err) {
        console.error('Failed to load images:', err)
      }
    } else if (mode === 'create') {
      // 新規作成時はプレビュー画像を復元
      const currentUrl = window.location.pathname + window.location.search
      const savedImages = localStorage.getItem(`item-images-preview-${currentUrl}`)
      if (savedImages) {
        try {
          const parsed = JSON.parse(savedImages)
          setImages(parsed)
        } catch (err) {
          console.error('Failed to load preview images:', err)
        }
      }
    }
  }, [mode, item?.id])

  // コンポーネントマウント時と画面表示時に画像を読み込み
  useEffect(() => {
    loadImages()
  }, [loadImages])

  // ページにフォーカスが戻った時に画像を再読み込み
  useEffect(() => {
    const handleWindowFocus = () => {
      loadImages()
    }

    window.addEventListener('focus', handleWindowFocus)
    return () => {
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [loadImages])

  // フォーカス位置の復元
  useEffect(() => {
    const savedFocusId = restoreFocusPosition()
    if (savedFocusId) {
      // 少し遅延させてからフォーカスを設定（DOMの準備を待つ）
      setTimeout(() => {
        const element = document.getElementById(savedFocusId)
        if (element) {
          element.focus()
          // テキストフィールドの場合はカーソルを末尾に移動
          // setSelectionRangeをサポートしないタイプ（date, number等）は除外
          if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            const unsupportedTypes = ['date', 'number', 'email', 'url', 'tel', 'search', 'color', 'range', 'file']
            
            try {
              if (element instanceof HTMLTextAreaElement) {
                // テキストエリアの場合
                const length = element.value.length
                element.setSelectionRange(length, length)
              } else if (element instanceof HTMLInputElement) {
                // インプット要素の場合、タイプをチェック
                const inputType = element.type || 'text'
                if (!unsupportedTypes.includes(inputType)) {
                  const length = element.value.length
                  element.setSelectionRange(length, length)
                }
              }
            } catch (err) {
              // setSelectionRangeがサポートされていない場合は無視
            }
          }
        }
      }, 100)
    }
  }, [restoreFocusPosition])

  // フォーカス変更時の保存
  useEffect(() => {
    const handleFocusChange = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.id && target.closest('form')) {
        saveFocusPosition(target.id)
      }
    }

    document.addEventListener('focusin', handleFocusChange)
    return () => {
      document.removeEventListener('focusin', handleFocusChange)
    }
  }, [saveFocusPosition])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 商品名のバリデーション
    if (!formData.name.trim()) {
      newErrors.name = '商品名は必須です'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = '商品名は100文字以内で入力してください'
    }

    // 説明のバリデーション
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = '説明は1000文字以内で入力してください'
    }

    // カテゴリのバリデーション
    if (formData.category && formData.category.length > 50) {
      newErrors.category = 'カテゴリは50文字以内で入力してください'
    }

    // メーカーのバリデーション
    if (formData.manufacturer && formData.manufacturer.length > 100) {
      newErrors.manufacturer = 'メーカーは100文字以内で入力してください'
    }

    // 価格のバリデーション
    if (formData.purchasePrice) {
      const price = parseFloat(formData.purchasePrice.toString())
      if (isNaN(price)) {
        newErrors.purchasePrice = '有効な数値を入力してください'
      } else if (price < 0) {
        newErrors.purchasePrice = '価格は0以上で入力してください'
      } else if (price > 999999999) {
        newErrors.purchasePrice = '価格が大きすぎます（999,999,999以下で入力してください）'
      }
    }

    // 購入日のバリデーション
    if (formData.purchaseDate) {
      const date = new Date(formData.purchaseDate)
      if (isNaN(date.getTime())) {
        newErrors.purchaseDate = '有効な日付形式で入力してください'
      } else if (date > new Date()) {
        newErrors.purchaseDate = '購入日は現在より未来の日付にはできません'
      }
    }

    // ビジネスルールバリデーション
    if (formData.purchasePrice && parseFloat(formData.purchasePrice.toString()) > 0 && !formData.purchaseDate) {
      newErrors.purchaseDate = '購入価格を入力した場合は購入日も必須です'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // フォームデータを処理
      const submitData: ItemFormData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        category: formData.category?.trim() || undefined,
        manufacturer: formData.manufacturer?.trim() || undefined,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice.toString()) : undefined,
        purchaseDate: formData.purchaseDate || undefined,
        purchaseLocation: formData.purchaseLocation?.trim() || undefined,
        condition: formData.condition?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        folderId: formData.folderId || undefined
      }

      const createdItem = await onSave(submitData)
      
      // 新規作成時でプレビュー画像がある場合は、実際にアップロード
      if (mode === 'create' && images.length > 0 && createdItem?.id) {
        
        for (const image of images) {
          
          if (image.isPreview && image.base64Data) {
            try {
              // Base64データからFileオブジェクトを再構築
              const base64Response = await fetch(image.base64Data)
              const blob = await base64Response.blob()
              const file = new File([blob], image.filename, { type: image.mimeType })

              const formData = new FormData()
              formData.append('file', file)
              formData.append('itemId', createdItem.id)
              formData.append('order', image.order.toString())

              const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              })

              if (!response.ok) {
                const errorText = await response.text()
              }
            } catch (err) {
              // エラーは無視して次の画像に進む
            }
          }
        }
        
        // アップロード完了後にプレビュー画像をクリア
        const currentUrl = window.location.pathname + window.location.search
        localStorage.removeItem(`item-images-preview-${currentUrl}`)
      }
      
      // 成功時はローカルストレージをクリアしてからリダイレクト
      clearStorage()
      clearFocusPosition()
      router.push('/items')
    } catch (err) {
      console.error('Error saving item:', err)
      setErrors({ _root: err instanceof Error ? err.message : 'エラーが発生しました' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // 編集途中のデータを破棄するか確認
    const hasChanges = mode === 'create' ? 
      Object.values(formData).some(value => value && value.toString().trim() !== '') :
      JSON.stringify(formData) !== JSON.stringify({
        name: item?.name || '',
        description: item?.description || '',
        category: item?.category || '',
        manufacturer: item?.manufacturer || '',
        purchasePrice: item?.purchasePrice || '',
        purchaseDate: item?.purchaseDate ? item.purchaseDate.split('T')[0] : '',
        purchaseLocation: item?.purchaseLocation || '',
        condition: item?.condition || '',
        notes: item?.notes || '',
        folderId: item?.folder?.id || ''
      })

    if (hasChanges) {
      const confirmed = confirm('編集中の内容が失われますが、よろしいですか？')
      if (!confirmed) {
        return
      }
    }

    // ローカルストレージをクリアしてからアイテム一覧へ
    clearStorage()
    clearFocusPosition()
    
    // 新規作成時はプレビュー画像もクリア
    if (mode === 'create') {
      const currentUrl = window.location.pathname + window.location.search
      localStorage.removeItem(`item-images-preview-${currentUrl}`)
    }
    
    router.push('/items')
  }

  const updateFormData = (field: keyof ItemFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  // 画像管理ページに遷移
  const handleImageManagement = () => {
    const itemId = mode === 'edit' ? item?.id : 'new'
    const currentUrl = window.location.pathname + window.location.search
    router.push(`/items/${itemId}/images?return=${encodeURIComponent(currentUrl)}`)
  }

  // AI画像認識処理
  const handleAIRecognition = useCallback(async () => {
    if (images.length === 0) {
      alert('画像をアップロードしてからAI認識を実行してください。')
      return
    }

    setAiRecognitionLoading(true)
    setAiRecognitionResult(null)

    try {
      // 最初の画像を使用してAI認識を実行
      const firstImage = images[0]
      let imageBase64: string

      if (firstImage.isPreview && firstImage.base64Data) {
        // プレビュー画像の場合、Base64データを使用
        imageBase64 = firstImage.base64Data.split(',')[1] // data:image/...;base64, を除去
      } else {
        // アップロード済み画像の場合、URLから取得
        const response = await fetch(firstImage.url)
        if (!response.ok) {
          throw new Error(`画像の取得に失敗しました: ${response.status}`)
        }
        const blob = await response.blob()
        const base64Response = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
          reader.readAsDataURL(blob)
        })
        imageBase64 = base64Response.split(',')[1] // data:image/...;base64, を除去
      }

      if (!imageBase64) {
        throw new Error('画像データの処理に失敗しました')
      }

      
      // AI認識API呼び出し
      const apiResponse = await fetch('/api/ai/recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64,
          mimeType: firstImage.mimeType || 'image/jpeg'
        })
      })

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text()
        throw new Error(`AI認識に失敗しました: ${apiResponse.status} ${errorText}`)
      }

      const result = await apiResponse.json()
      
      setAiRecognitionResult(result)

      if (!result.success) {
        throw new Error(result.error || 'AI認識に失敗しました')
      }
    } catch (error) {
      setAiRecognitionResult({
        success: false,
        error: error instanceof Error ? error.message : 'AI認識中にエラーが発生しました'
      })
      alert(error instanceof Error ? error.message : 'AI認識中にエラーが発生しました')
    } finally {
      setAiRecognitionLoading(false)
    }
  }, [images, formData.name, formData.description, updateFormData])

  const isDisabled = loading || isSubmitting

  return (
    <div className="max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {mode === 'create' ? 'アイテム作成' : 'アイテム編集'}
        </h1>
        <p className="mt-2 text-gray-600">
          {mode === 'create' 
            ? '新しいアイテムの情報を入力してください。' 
            : 'アイテムの情報を編集できます。'
          }
        </p>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          入力内容は自動的に保存されます
        </div>
      </div>

      {/* フォーム */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 画像とAI認識セクション */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
              </svg>
              画像とAI認識
            </h2>
            
            {/* 画像プレビューと管理ボタン */}
            <div className="space-y-4">
              {images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.slice(0, 8).map((image, index) => (
                    <div key={image.id || index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      {image.isPreview ? (
                        <img
                          src={image.url}
                          alt={`画像 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={image.url}
                          alt={`画像 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {/* 順序バッジ */}
                      <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                  {images.length > 8 && (
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-500">+{images.length - 8}</div>
                        <div className="text-xs text-gray-500">枚</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <svg className="mx-auto w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">画像が添付されていません</p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-sm text-gray-600">
                  {images.length}/10 枚
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleImageManagement}
                    disabled={isDisabled}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    画像を管理
                  </button>
                  
                  {/* AI画像認識ボタン */}
                  {images.length > 0 && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleAIRecognition}
                        disabled={isDisabled || aiRecognitionLoading}
                        className="inline-flex items-center px-4 py-2 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all"
                      >
                        {aiRecognitionLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-700" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            AI認識中...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            AI画像認識
                          </>
                        )}
                      </button>
                      
                      {/* AI認識の説明とヒント */}
                      <p className="text-xs text-gray-500">
                        最初の画像を使用して商品名、カテゴリ、メーカー、商品説明を自動認識します
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {mode === 'create' && images.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-600">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  新規作成時は、アイテム作成後に画像がアップロードされます。
                </p>
              </div>
            )}
            
            {/* AI認識結果表示 */}
            {aiRecognitionResult && (
              <div className={`mt-4 p-4 rounded-lg border ${
                aiRecognitionResult.success 
                  ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`text-base font-semibold flex items-center ${
                    aiRecognitionResult.success ? 'text-purple-800' : 'text-red-800'
                  }`}>
                    {aiRecognitionResult.success ? (
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.76 0L3.054 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    )}
                    {aiRecognitionResult.success ? 'AI認識結果' : 'AI認識エラー'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setAiRecognitionResult(null)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="認識結果を閉じる"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* エラー表示 */}
                  {!aiRecognitionResult.success && aiRecognitionResult.error && (
                    <div className="bg-white p-3 rounded-md border border-red-300">
                      <p className="text-sm text-red-700 flex items-center">
                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {aiRecognitionResult.error}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        画像が不鮮明である、またはAIサービスが一時的に利用できない可能性があります。しばらく待ってから再度お試しください。
                      </p>
                    </div>
                  )}
                  
                  
                  {/* 商品名候補 */}
                  {aiRecognitionResult.success && aiRecognitionResult.data?.suggestions && Array.isArray(aiRecognitionResult.data.suggestions) && aiRecognitionResult.data.suggestions.length > 0 && (
                    <div className="bg-white p-3 rounded-md border border-gray-200">
                      <p className="font-medium text-gray-800 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        商品名候補 ({aiRecognitionResult.data.suggestions.length}件)
                      </p>
                      <div className="grid gap-2">
                        {aiRecognitionResult.data.suggestions.filter(s => s && typeof s === 'string' && s.trim()).map((suggestion: string, index: number) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                            <span className="text-sm text-gray-700 flex-1 mr-2">{suggestion}</span>
                            <div className="flex space-x-1">
                              <button
                                type="button"
                                onClick={() => {
                                  updateFormData('name', suggestion)
                                  // 採用された提案を視覚的にフィードバック
                                  const button = document.activeElement as HTMLButtonElement
                                  button.classList.add('bg-green-500', 'text-white')
                                  setTimeout(() => {
                                    button.classList.remove('bg-green-500', 'text-white')
                                  }, 1000)
                                }}
                                className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-full transition-colors"
                                title="この商品名を採用"
                              >
                                採用
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  // 拒否された提案を非表示にする
                                  setAiRecognitionResult(prev => ({
                                    ...prev,
                                    data: {
                                      ...prev.data,
                                      suggestions: prev.data.suggestions.filter((_: string, i: number) => i !== index)
                                    }
                                  }))
                                }}
                                className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
                                title="この商品名を拒否"
                              >
                                拒否
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* カテゴリ候補 */}
                  {aiRecognitionResult.success && aiRecognitionResult.data?.category && (
                    <div className="bg-white p-3 rounded-md border border-gray-200">
                      <p className="font-medium text-gray-800 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        カテゴリ候補
                      </p>
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                        <span className="text-sm text-gray-700 flex-1 mr-2">{aiRecognitionResult.data.category}</span>
                        <div className="flex space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              updateFormData('category', aiRecognitionResult.data.category)
                              // 採用フィードバック
                              const button = document.activeElement as HTMLButtonElement
                              button.classList.add('bg-green-500', 'text-white')
                              setTimeout(() => {
                                button.classList.remove('bg-green-500', 'text-white')
                              }, 1000)
                            }}
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-full transition-colors"
                          >
                            採用
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAiRecognitionResult(prev => ({
                                ...prev,
                                data: {
                                  ...prev.data,
                                  category: null
                                }
                              }))
                            }}
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
                          >
                            拒否
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* メーカー候補 */}
                  {aiRecognitionResult.success && aiRecognitionResult.data?.manufacturer && (
                    <div className="bg-white p-3 rounded-md border border-gray-200">
                      <p className="font-medium text-gray-800 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        メーカー候補
                      </p>
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                        <span className="text-sm text-gray-700 flex-1 mr-2">{aiRecognitionResult.data.manufacturer}</span>
                        <div className="flex space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              updateFormData('manufacturer', aiRecognitionResult.data.manufacturer)
                              // 採用フィードバック
                              const button = document.activeElement as HTMLButtonElement
                              button.classList.add('bg-green-500', 'text-white')
                              setTimeout(() => {
                                button.classList.remove('bg-green-500', 'text-white')
                              }, 1000)
                            }}
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-full transition-colors"
                          >
                            採用
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAiRecognitionResult(prev => ({
                                ...prev,
                                data: {
                                  ...prev.data,
                                  manufacturer: null
                                }
                              }))
                            }}
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
                          >
                            拒否
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 商品説明候補 */}
                  {aiRecognitionResult.success && aiRecognitionResult.data?.description && 
                   typeof aiRecognitionResult.data.description === 'string' && 
                   aiRecognitionResult.data.description.trim().length > 0 && (
                    <div className="bg-white p-3 rounded-md border border-gray-200">
                      <p className="font-medium text-gray-800 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        商品説明候補
                      </p>
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                          {aiRecognitionResult.data.description}
                        </p>
                        <div className="flex space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              updateFormData('description', aiRecognitionResult.data.description)
                              // 採用フィードバック
                              const button = document.activeElement as HTMLButtonElement
                              button.classList.add('bg-green-500', 'text-white')
                              setTimeout(() => {
                                button.classList.remove('bg-green-500', 'text-white')
                              }, 1000)
                            }}
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-full transition-colors"
                          >
                            採用
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAiRecognitionResult(prev => ({
                                ...prev,
                                data: {
                                  ...prev.data,
                                  description: null
                                }
                              }))
                            }}
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
                          >
                            拒否
                          </button>
                        </div>
                      </div>
                    </div>
                  )}


                  {/* 全て採用ボタン */}
                  {aiRecognitionResult.success && aiRecognitionResult.data && (
                    <div className="pt-2 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          const data = aiRecognitionResult.data
                          if (data?.suggestions?.[0]) updateFormData('name', data.suggestions[0])
                          if (data?.category) updateFormData('category', data.category)
                          if (data?.manufacturer) updateFormData('manufacturer', data.manufacturer)
                          if (data?.description) updateFormData('description', data.description)
                          setAiRecognitionResult(null)
                        }}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-md transition-all"
                      >
                        全ての提案を採用してフォームに反映
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 基本情報セクション */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">基本情報</h2>
            <div className="space-y-4">
              {/* 商品名 */}
              <div>
                <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">
                  商品名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="itemName"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 ${
                    errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="商品名を入力"
                  maxLength={100}
                  disabled={isDisabled}
                  autoFocus={!restoreFocusPosition()}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* 説明 */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 ${
                    errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="商品の説明を入力"
                  maxLength={1000}
                  disabled={isDisabled}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  {formData.description?.length || 0}/1000文字
                </p>
              </div>
            </div>
          </div>

          {/* 分類・整理セクション */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">分類・整理</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* カテゴリ */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリ
                </label>
                <input
                  type="text"
                  id="category"
                  value={formData.category}
                  onChange={(e) => updateFormData('category', e.target.value)}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 ${
                    errors.category ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="カテゴリを入力"
                  maxLength={50}
                  disabled={isDisabled}
                />
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              {/* メーカー */}
              <div>
                <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-1">
                  メーカー
                </label>
                <input
                  type="text"
                  id="manufacturer"
                  value={formData.manufacturer || ''}
                  onChange={(e) => updateFormData('manufacturer', e.target.value)}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 ${
                    errors.manufacturer ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="メーカーを入力"
                  maxLength={100}
                  disabled={isDisabled}
                />
                {errors.manufacturer && (
                  <p className="mt-1 text-sm text-red-600">{errors.manufacturer}</p>
                )}
              </div>

              {/* フォルダ */}
              <div>
                <label htmlFor="folder" className="block text-sm font-medium text-gray-700 mb-1">
                  フォルダ
                </label>
                <select
                  id="folder"
                  value={formData.folderId}
                  onChange={(e) => updateFormData('folderId', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  disabled={isDisabled}
                >
                  <option value="">フォルダを選択</option>
                  {folders?.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folder.displayName || folder.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 購入情報セクション */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">購入情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 価格 */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  価格（円）
                </label>
                <input
                  type="number"
                  id="price"
                  step="0.01"
                  min="0"
                  max="999999999"
                  value={formData.purchasePrice}
                  onChange={(e) => updateFormData('purchasePrice', e.target.value)}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 ${
                    errors.purchasePrice ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="0"
                  disabled={isDisabled}
                />
                {errors.purchasePrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.purchasePrice}</p>
                )}
              </div>

              {/* 購入日 */}
              <div>
                <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-1">
                  購入日
                </label>
                <input
                  type="date"
                  id="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={(e) => updateFormData('purchaseDate', e.target.value)}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 ${
                    errors.purchaseDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={isDisabled}
                />
                {errors.purchaseDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.purchaseDate}</p>
                )}
              </div>

              {/* 購入場所 */}
              <div>
                <label htmlFor="purchaseLocation" className="block text-sm font-medium text-gray-700 mb-1">
                  購入場所
                </label>
                <input
                  type="text"
                  id="purchaseLocation"
                  value={formData.purchaseLocation}
                  onChange={(e) => updateFormData('purchaseLocation', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  placeholder="購入場所を入力"
                  maxLength={200}
                  disabled={isDisabled}
                />
              </div>

              {/* 状態 */}
              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                  状態
                </label>
                <select
                  id="condition"
                  value={formData.condition}
                  onChange={(e) => updateFormData('condition', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  disabled={isDisabled}
                >
                  <option value="">状態を選択</option>
                  <option value="新品">新品</option>
                  <option value="未使用に近い">未使用に近い</option>
                  <option value="目立った傷や汚れなし">目立った傷や汚れなし</option>
                  <option value="やや傷や汚れあり">やや傷や汚れあり</option>
                  <option value="傷や汚れあり">傷や汚れあり</option>
                  <option value="全体的に状態が悪い">全体的に状態が悪い</option>
                </select>
              </div>
            </div>
          </div>

          {/* その他情報セクション */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">その他情報</h2>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                メモ
              </label>
              <textarea
                id="notes"
                rows={4}
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                placeholder="メモを入力"
                maxLength={2000}
                disabled={isDisabled}
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.notes?.length || 0}/2000文字
              </p>
            </div>
          </div>


          {/* 全体エラー表示 */}
          {errors._root && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{errors._root}</p>
                </div>
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isDisabled}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isDisabled || !formData.name.trim()}
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === 'create' ? '作成中...' : '更新中...'}
                </>
              ) : (
                mode === 'create' ? '作成' : '更新'
              )}
            </button>
          </div>
        </form>
      </div>

    </div>
  )
})
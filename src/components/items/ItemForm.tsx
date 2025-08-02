'use client'

import { useState, useEffect, useCallback } from 'react'
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

export function ItemForm({
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
      // ローカルストレージにデータがある場合は復元
      setFormData(savedData)
    } else if (mode === 'edit' && item) {
      // ローカルストレージにデータがなく、編集モードの場合はアイテムデータを設定
      setFormData({
        name: item.name,
        description: item.description || '',
        category: item.category || '',
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
            console.log('[ItemForm] Images loaded:', updatedImages.length)
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
          console.log('[ItemForm] Preview images loaded:', parsed.length)
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
      console.log('[ItemForm] Window focus - reloading images')
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
              console.debug('setSelectionRange not supported for element:', element.tagName, element instanceof HTMLInputElement ? element.type : 'textarea')
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
                console.error('[ItemForm] Failed to upload image:', errorText)
              }
            } catch (err) {
              console.error('[ItemForm] Error uploading image:', err)
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

    // ローカルストレージをクリアしてから戻る
    clearStorage()
    clearFocusPosition()
    router.back()
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

          {/* 画像セクション */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">画像</h2>
            
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
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {images.length}/10 枚
                </div>
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
}
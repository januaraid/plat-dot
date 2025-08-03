'use client'

import { useState, useEffect } from 'react'
import { Item } from './ItemCard'

interface ItemFolder {
  id: string
  name: string
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

interface ItemFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (itemData: ItemFormData) => Promise<void>
  item?: Item | null
  mode: 'create' | 'edit'
  folders?: ItemFolder[]
}

export function ItemFormModal({
  isOpen,
  onClose,
  onSave,
  item,
  mode,
  folders = []
}: ItemFormModalProps) {
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
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // フォームデータの初期化
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && item) {
        setFormData({
          name: item.name,
          description: item.description || '',
          category: item.category || '',
          purchasePrice: item.purchasePrice || '',
          purchaseDate: item.purchaseDate || '',
          purchaseLocation: item.purchaseLocation || '',
          condition: '', // TODO: APIが対応したら追加
          notes: '', // TODO: APIが対応したら追加
          folderId: item.folder?.id || ''
        })
      } else {
        setFormData({
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
      }
      setErrors({})
    }
  }, [isOpen, mode, item])

  // ESCキーでモーダルを閉じる
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

    setLoading(true)

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

      await onSave(submitData)
      onClose()
    } catch (err) {
      console.error('Error saving item:', err)
      setErrors({ _root: err instanceof Error ? err.message : 'エラーが発生しました' })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          
          {/* Header */}
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                {mode === 'create' ? 'アイテム作成' : 'アイテム編集'}
              </h3>
              <button
                type="button"
                className="rounded-md bg-white p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={handleClose}
                disabled={loading}
              >
                <span className="sr-only">閉じる</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={loading}
                  autoFocus
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
                  rows={3}
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 ${
                    errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="商品の説明を入力"
                  maxLength={1000}
                  disabled={loading}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* 2列グリッド */}
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
                    disabled={loading}
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
                    disabled={loading}
                  >
                    <option value="">フォルダを選択</option>
                    {folders?.map(folder => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2列グリッド - 価格と購入日 */}
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                  {errors.purchaseDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.purchaseDate}</p>
                  )}
                </div>
              </div>

              {/* 2列グリッド - 購入場所と状態 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    disabled={loading}
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
                    disabled={loading}
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

              {/* メモ */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  メモ
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  placeholder="メモを入力"
                  maxLength={2000}
                  disabled={loading}
                />
              </div>

              {/* 全体エラー表示 */}
              {errors._root && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
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

              {/* Action buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.name.trim()}
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
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
      </div>
    </div>
  )
}
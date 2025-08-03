'use client'

import { useState, useCallback } from 'react'
import { Item } from '@/components/items/ItemCard'

interface ItemFormData {
  name: string
  description?: string
  category?: string
  purchasePrice?: number
  purchaseDate?: string
  purchaseLocation?: string
  condition?: string
  notes?: string
  folderId?: string
}

interface UseItemsReturn {
  loading: boolean
  error: string | null
  createItem: (data: ItemFormData) => Promise<Item>
  updateItem: (id: string, data: Partial<ItemFormData>) => Promise<Item>
  deleteItem: (id: string) => Promise<void>
  uploadPreviewImages: (itemId: string, previewImages: any[]) => Promise<void>
  clearError: () => void
}

export function useItems(): UseItemsReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const createItem = useCallback(async (data: ItemFormData): Promise<Item> => {
    setLoading(true)
    setError(null)

    try {
      console.log('Creating item with data:', data)
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Create item error response:', errorData)
        console.error('Request data was:', data)
        if (errorData.details) {
          console.error('Validation error details:', errorData.details)
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const item = await response.json()
      return item
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'アイテムの作成に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateItem = useCallback(async (id: string, data: Partial<ItemFormData>): Promise<Item> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const item = await response.json()
      return item
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'アイテムの更新に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'アイテムの削除に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadPreviewImages = useCallback(async (itemId: string, previewImages: any[]): Promise<void> => {
    if (!previewImages || previewImages.length === 0) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log(`Uploading ${previewImages.length} preview images for item ${itemId}`)
      
      // Base64データをFileオブジェクトに変換してアップロード
      for (let i = 0; i < previewImages.length; i++) {
        const previewImage = previewImages[i]
        
        if (!previewImage.base64Data) {
          console.warn('Preview image missing base64Data:', previewImage)
          continue
        }

        try {
          // Base64をBlobに変換
          const response = await fetch(previewImage.base64Data)
          const blob = await response.blob()
          
          // BlobをFileオブジェクトに変換
          const file = new File([blob], previewImage.filename, {
            type: previewImage.mimeType
          })

          // FormDataを作成してアップロード
          const formData = new FormData()
          formData.append('file', file)
          formData.append('itemId', itemId)
          formData.append('order', i.toString())

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}))
            console.error(`Failed to upload image ${i + 1}:`, errorData)
            // 個別の画像アップロード失敗は警告として扱い、処理を続行
          } else {
            const uploadData = await uploadResponse.json()
            console.log(`Successfully uploaded image ${i + 1}:`, uploadData.image.filename)
          }
        } catch (imageError) {
          console.error(`Error uploading image ${i + 1}:`, imageError)
          // 個別の画像アップロード失敗は警告として扱い、処理を続行
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '画像のアップロードに失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    uploadPreviewImages,
    clearError,
  }
}
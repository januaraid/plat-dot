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

  return {
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    clearError,
  }
}
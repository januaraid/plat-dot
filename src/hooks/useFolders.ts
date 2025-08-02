'use client'

import { useState, useEffect, useCallback } from 'react'

interface Folder {
  id: string
  name: string
  parentId?: string
}

interface UseFoldersReturn {
  folders: Folder[]
  loading: boolean
  error: string | null
  refreshFolders: () => Promise<void>
}

export function useFolders(): UseFoldersReturn {
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true) // 初期状態をtrueに設定
  const [error, setError] = useState<string | null>(null)

  const fetchFolders = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // すべてのフォルダを取得（階層構造のため）
      const response = await fetch('/api/folders?includeChildren=true')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      // APIレスポンスの形式: { folders: [...] }
      const foldersArray = data.folders || data
      setFolders(Array.isArray(foldersArray) ? foldersArray : [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'フォルダの取得に失敗しました'
      setError(errorMessage)
      setFolders([]) // エラー時も空配列を設定
      console.error('Error fetching folders:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshFolders = useCallback(async () => {
    await fetchFolders()
  }, [fetchFolders])

  useEffect(() => {
    fetchFolders()
  }, []) // 初回のみ実行

  return {
    folders,
    loading,
    error,
    refreshFolders,
  }
}
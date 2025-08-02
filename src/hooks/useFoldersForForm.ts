'use client'

import { useState, useEffect, useCallback } from 'react'

interface Folder {
  id: string
  name: string
  parentId?: string
  depth?: number
  displayName?: string
}

interface UseFoldersForFormReturn {
  folders: Folder[]
  loading: boolean
  error: string | null
  refreshFolders: () => Promise<void>
}

export function useFoldersForForm(): UseFoldersForFormReturn {
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ツリー構造をフラット化してフォーム用に変換
  const flattenFolders = (tree: any[], prefix = ''): Folder[] => {
    const result: Folder[] = []
    
    for (const folder of tree) {
      const displayName = prefix ? `${prefix} / ${folder.name}` : folder.name
      
      result.push({
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        depth: folder.depth || 1,
        displayName
      })
      
      // 子フォルダがある場合は再帰的に処理
      if (folder.children && folder.children.length > 0) {
        result.push(...flattenFolders(folder.children, displayName))
      }
    }
    
    return result
  }

  const fetchFolders = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // ツリーAPIを使ってすべてのフォルダを取得
      const response = await fetch('/api/folders/tree')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      // ツリー構造をフラット化
      const flatFolders = flattenFolders(data.tree || [])
      setFolders(flatFolders)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'フォルダの取得に失敗しました'
      setError(errorMessage)
      setFolders([])
      console.error('Error fetching folders for form:', err)
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
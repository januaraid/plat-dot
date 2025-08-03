'use client'

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { usePerformanceProfiler } from '@/hooks/usePerformanceProfiler'
// SVGアイコンコンポーネント
const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const FolderIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
  </svg>
)

const FolderOpenIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
  </svg>
)

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

interface Folder {
  id: string
  name: string
  parentId?: string
  itemCount: number
  childCount: number
  children?: Folder[]
  depth?: number
}

interface FolderTreeProps {
  selectedFolderId?: string
  onFolderSelect: (folderId: string | null) => void
  onFolderCreate?: (parentId?: string) => void
  onFolderEdit?: (folder: Folder) => void
  onFolderDelete?: (folder: Folder) => void
  onItemDrop?: (itemData: any, folderId: string | null) => void
  onFolderMove?: (folderId: string, newParentId: string | null) => void
  className?: string
}

export interface FolderTreeHandle {
  refresh: () => void
}

export const FolderTree = forwardRef<FolderTreeHandle, FolderTreeProps>(({
  selectedFolderId,
  onFolderSelect,
  onFolderCreate,
  onFolderEdit,
  onFolderDelete,
  onItemDrop,
  onFolderMove,
  className = ''
}, ref) => {
  const { data: session, status } = useSession()
  const instanceId = useRef(Math.random().toString(36).substr(2, 9))
  
  // Performance profiling
  usePerformanceProfiler('FolderTree')
  
  // セッション変更のデバッグ - statusとhasSessionのみを監視
  useEffect(() => {
    // セッション状態の変更をトラッキング（デバッグログは削除済み）
  }, [status, session?.hasSession]) // sessionオブジェクト全体ではなく必要なプロパティのみ監視
  
  const [folders, setFolders] = useState<Folder[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null)
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null)
  const [draggingFolder, setDraggingFolder] = useState<string | null>(null)

  // 安定した参照を維持するためのフラグ
  const isAuthenticated = status === 'authenticated' && session?.hasSession
  const isLoading = status === 'loading'

  // フォルダツリーを取得
  const fetchFolders = useCallback(async () => {
    
    // 未ログインの場合は何もしない
    if (isLoading) {
      return
    }
    if (!isAuthenticated) {
      setFolders([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/folders/tree?includeItemCount=true')
      if (!response.ok) {
        throw new Error('フォルダの取得に失敗しました')
      }

      const data = await response.json()
      
      // APIレスポンスをFolderインターフェースに変換
      const transformFolders = (folders: any[]): Folder[] => {
        return folders.map(folder => ({
          id: folder.id,
          name: folder.name,
          parentId: folder.parentId,
          itemCount: folder._count?.items || 0,
          childCount: folder._count?.children || 0,
          children: folder.children ? transformFolders(folder.children) : [],
          depth: folder.depth || 1
        }))
      }
      
      const transformedFolders = transformFolders(data.tree || data.folders || [])
      setFolders(transformedFolders)
    } catch (err) {
      console.error('Error fetching folders:', err)
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, isLoading]) // より安定した依存関係

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  // 外部から呼び出せるようにrefを公開
  useImperativeHandle(ref, () => ({
    refresh: fetchFolders
  }), [fetchFolders])

  // フォルダ更新イベントハンドラー
  const handleFolderUpdate = useCallback(() => {
    fetchFolders()
  }, [fetchFolders])

  // フォルダ更新イベントをリッスン
  useEffect(() => {
    window.addEventListener('folder-updated', handleFolderUpdate)

    return () => {
      window.removeEventListener('folder-updated', handleFolderUpdate)
    }
  }, [handleFolderUpdate])

  // フォルダの展開/折りたたみ
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId)
      } else {
        newExpanded.add(folderId)
      }
      return newExpanded
    })
  }

  // フォルダの削除確認
  const handleFolderDelete = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`フォルダ「${folder.name}」を削除してもよろしいですか？\n含まれるアイテムは未分類に移動されます。`)) {
      onFolderDelete?.(folder)
    }
  }

  // フォルダの編集
  const handleFolderEdit = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation()
    onFolderEdit?.(folder)
  }

  // フォルダの作成
  const handleFolderCreate = (parentId?: string) => {
    onFolderCreate?.(parentId)
  }

  // ドラッグ&ドロップハンドラ
  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverFolder(folderId)
  }

  const handleDragLeave = () => {
    setDragOverFolder(null)
  }

  // フォルダのドラッグ開始
  const handleFolderDragStart = (e: React.DragEvent, folder: Folder) => {
    console.log('[FolderTree] Folder drag start:', folder.id)
    setDraggingFolder(folder.id)
    
    // フォルダデータをJSONとして設定
    const folderData = {
      type: 'folder',
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId
    }
    e.dataTransfer.setData('application/json', JSON.stringify(folderData))
    e.dataTransfer.effectAllowed = 'move'
  }

  // フォルダのドラッグ終了
  const handleFolderDragEnd = () => {
    console.log('[FolderTree] Folder drag end')
    setDraggingFolder(null)
    setDragOverFolder(null)
  }

  // ドロップ可能かチェック
  const canDropFolder = (draggingFolderId: string, targetFolderId: string | null) => {
    console.log('[FolderTree] Checking canDropFolder:', { draggingFolderId, targetFolderId })
    
    // 自分自身にはドロップできない
    if (draggingFolderId === targetFolderId) {
      console.log('[FolderTree] Cannot drop on self')
      return false
    }
    
    // ルートレベル（targetFolderId === null）への移動は常に許可
    if (targetFolderId === null) {
      console.log('[FolderTree] Dropping to root level - allowed')
      return true
    }
    
    // 子フォルダを親にはドロップできない（循環参照防止）
    const isDescendant = (parentId: string | null, childId: string): boolean => {
      if (!parentId) return false
      if (parentId === childId) return true
      
      const parentFolder = folders.find(f => f.id === parentId)
      if (!parentFolder) return false
      
      return isDescendant(parentFolder.parentId, childId)
    }
    
    if (isDescendant(draggingFolderId, targetFolderId)) {
      console.log('[FolderTree] Cannot drop - would create circular reference')
      return false
    }
    
    // 階層制限チェック（3階層まで）
    let depth = 1
    let currentFolder = folders.find(f => f.id === targetFolderId)
    while (currentFolder && currentFolder.parentId && depth < 3) {
      currentFolder = folders.find(f => f.id === currentFolder?.parentId)
      depth++
    }
    if (depth >= 3) {
      console.log('[FolderTree] Cannot drop - depth limit exceeded:', depth)
      return false
    }
    
    console.log('[FolderTree] Drop allowed')
    return true
  }

  const handleDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault()
    setDragOverFolder(null)
    
    console.log('[FolderTree] Drop event triggered:', {
      folderId,
      dataTransferTypes: Array.from(e.dataTransfer.types),
      isRootLevel: folderId === null
    })
    
    try {
      const rawData = e.dataTransfer.getData('application/json')
      console.log('[FolderTree] Raw drag data:', rawData)
      
      if (!rawData) {
        console.warn('[FolderTree] No drag data found')
        return
      }
      
      const dragData = JSON.parse(rawData)
      console.log('[FolderTree] Parsed drag data:', dragData)
      
      // フォルダのドロップの場合
      if (dragData.type === 'folder' && onFolderMove) {
        console.log('[FolderTree] Processing folder drop to:', folderId, '(isRootLevel:', folderId === null, ')')
        
        const canDrop = canDropFolder(dragData.id, folderId)
        console.log('[FolderTree] Can drop result:', canDrop)
        
        if (!canDrop) {
          console.warn('[FolderTree] Invalid folder drop - validation failed:', {
            draggingId: dragData.id,
            targetId: folderId,
            isRootLevel: folderId === null
          })
          return
        }
        
        console.log('[FolderTree] Calling onFolderMove with:', {
          folderId: dragData.id,
          newParentId: folderId
        })
        
        try {
          onFolderMove(dragData.id, folderId)
          console.log('[FolderTree] onFolderMove call completed successfully')
        } catch (moveError) {
          console.error('[FolderTree] Error in onFolderMove:', moveError)
        }
      }
      // アイテムのドロップの場合
      else if (dragData.type !== 'folder' && onItemDrop) {
        console.log('[FolderTree] Processing item drop')
        onItemDrop(dragData, folderId)
      } else {
        console.warn('[FolderTree] Unknown drop type or missing handler:', {
          dragDataType: dragData.type,
          hasOnFolderMove: !!onFolderMove,
          hasOnItemDrop: !!onItemDrop
        })
      }
    } catch (err) {
      console.error('[FolderTree] Error parsing dropped data:', err)
    }
  }

  // フォルダノードを再帰的にレンダリング
  const renderFolder = (folder: Folder, depth = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const isSelected = selectedFolderId === folder.id
    const isHovered = hoveredFolder === folder.id
    const isDragging = draggingFolder === folder.id
    const hasChildren = folder.children && folder.children.length > 0
    
    // ドロップ可能かチェック
    const isValidDropTarget = draggingFolder ? canDropFolder(draggingFolder, folder.id) : true
    const isDropTarget = dragOverFolder === folder.id

    return (
      <div key={folder.id}>
        <div
          draggable
          className={`
            group relative rounded transition-all duration-200 touch-manipulation
            ${isSelected ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100'}
            ${isDropTarget && isValidDropTarget ? 'bg-green-100 border-2 border-green-300' : ''}
            ${isDropTarget && !isValidDropTarget ? 'bg-red-100 border-2 border-red-300' : ''}
            ${isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab'}
            ${draggingFolder && !isValidDropTarget ? 'opacity-30' : ''}
          `}
          style={{ marginLeft: `${depth * 12}px`, paddingLeft: '0.5rem', paddingRight: '0.5rem' }}
          onClick={() => onFolderSelect(folder.id)}
          onMouseEnter={() => setHoveredFolder(folder.id)}
          onMouseLeave={() => setHoveredFolder(null)}
          onDragStart={(e) => handleFolderDragStart(e, folder)}
          onDragEnd={handleFolderDragEnd}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
        >
          <div className="flex items-center py-1.5">
            {/* 展開/折りたたみボタン */}
            <div className="flex-shrink-0">
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFolder(folder.id)
                  }}
                  className="p-0.5 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              ) : (
                <div className="w-5 h-5" />
              )}
            </div>

            {/* フォルダコンテンツ */}
            <div className="flex items-center flex-1 min-w-0 ml-1">
              {isExpanded && hasChildren ? (
                <FolderOpenIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
              ) : (
                <FolderIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
              
              <span className="ml-2 text-sm truncate flex-1" title={folder.name}>
                {folder.name}
              </span>
              
              {folder.itemCount > 0 && (
                <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                  {folder.itemCount}
                </span>
              )}
            </div>
          </div>

          {/* フォルダアクション - 絶対配置 */}
          {(isHovered || isSelected) && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded shadow-sm">
              {onFolderCreate && folder.depth < 3 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFolderCreate(folder.id)
                  }}
                  className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                  title="サブフォルダを作成"
                >
                  <PlusIcon className="w-3 h-3" />
                </button>
              )}
              
              {onFolderEdit && (
                <button
                  onClick={(e) => handleFolderEdit(folder, e)}
                  className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                  title="フォルダを編集"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              
              {onFolderDelete && (
                <button
                  onClick={(e) => handleFolderDelete(folder, e)}
                  className="p-1 hover:bg-red-100 rounded text-gray-500 hover:text-red-600"
                  title="フォルダを削除"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 子フォルダ */}
        {isExpanded && hasChildren && (
          <div>
            {folder.children!.map(child => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`p-2 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3 px-2">
        <h3 className="text-sm font-medium text-gray-900">フォルダ</h3>
        {onFolderCreate && (
          <button
            onClick={() => handleFolderCreate()}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700 touch-manipulation"
            title="新しいフォルダを作成"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 全てのアイテム */}
      <div
        className={`
          flex items-center px-2 py-2 rounded cursor-pointer mb-2 transition-all duration-200 touch-manipulation
          ${!selectedFolderId ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100'}
          ${dragOverFolder === null && draggingFolder ? 'bg-green-100 border-2 border-green-300' : ''}
        `}
        onClick={() => onFolderSelect(null)}
        onDragOver={(e) => handleDragOver(e, null)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, null)}
      >
        <div className="w-5 h-5" />
        <FolderIcon className="w-4 h-4 text-gray-500 ml-1" />
        <span className="ml-2 text-sm">すべてのアイテム</span>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="px-2 py-1 text-sm text-red-600 bg-red-50 rounded mb-2">
          {error}
          <button 
            onClick={fetchFolders}
            className="ml-2 underline hover:no-underline"
          >
            再試行
          </button>
        </div>
      )}

      {/* フォルダツリー */}
      <div className="space-y-1">
        {folders.map(folder => renderFolder(folder))}
      </div>

      {/* 空の状態 */}
      {!loading && folders.length === 0 && !error && (
        <div className="px-2 py-4 text-center">
          <FolderIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">フォルダがありません</p>
          {onFolderCreate && (
            <button
              onClick={() => handleFolderCreate()}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              最初のフォルダを作成
            </button>
          )}
        </div>
      )}
    </div>
  )
})
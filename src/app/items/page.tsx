'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ItemGrid, ViewMode, GridColumns } from '@/components/items/ItemGrid'
import { ItemFilters, FilterOptions, ResultsCounter } from '@/components/items/ItemFilters'
import { ViewModeToggle } from '@/components/items/ItemGrid'
import { Pagination } from '@/components/items/Pagination'
import { Item } from '@/components/items/ItemCard'
import { FolderTree } from '@/components/folders/FolderTree'
import { FolderModal } from '@/components/folders/FolderModal'
import { Breadcrumb } from '@/components/folders/Breadcrumb'
import { useSidebar } from '@/contexts/SidebarContext'
import { useItems } from '@/hooks/useItems'

interface ItemsResponse {
  items: Item[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  categories?: string[]
  manufacturers?: string[]
  folders?: Array<{ id: string; name: string; displayName?: string }>
}

export default function ItemsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { setFolderProps } = useSidebar()
  
  // Custom hooks for API operations
  const { deleteItem } = useItems()

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

  // 未ログインの場合はトップページにリダイレクト
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, isAuthLoading, router])
  
  // State
  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [categories, setCategories] = useState<string[]>([])
  const [manufacturers, setManufacturers] = useState<string[]>([])
  const [folders, setFolders] = useState<Array<{ id: string; name: string; displayName?: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI State with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [gridColumns, setGridColumns] = useState<GridColumns>(3)
  
  // Folder state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [folderModalMode, setFolderModalMode] = useState<'create' | 'edit'>('create')
  const [editingFolder, setEditingFolder] = useState<{ id: string; name: string; parentId?: string } | null>(null)
  const [parentFolderId, setParentFolderId] = useState<string | undefined>(undefined)
  
  
  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<Item | null>(null)
  
  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    category: '',
    manufacturer: '',
    folderId: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 24,
  })
  
  // Folder handlers - defined early to avoid initialization errors
  const handleFolderSelect = useCallback((folderId: string | null) => {
    setSelectedFolderId(folderId)
  }, [])

  const handleFolderCreate = useCallback((parentId?: string) => {
    setFolderModalMode('create')
    setParentFolderId(parentId)
    setEditingFolder(null)
    setIsFolderModalOpen(true)
  }, [])

  const handleFolderEdit = useCallback((folder: { id: string; name: string; parentId?: string }) => {
    setFolderModalMode('edit')
    setEditingFolder(folder)
    setParentFolderId(undefined)
    setIsFolderModalOpen(true)
  }, [])

  // Track if localStorage has been loaded
  const [isLocalStorageLoaded, setIsLocalStorageLoaded] = useState(false)

  // Load UI preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedViewMode = localStorage.getItem('items-view-mode') as ViewMode
      const savedGridColumns = localStorage.getItem('items-grid-columns')
      const savedSortBy = localStorage.getItem('items-sort-by')
      const savedSortOrder = localStorage.getItem('items-sort-order')
      const savedLimit = localStorage.getItem('items-limit')
      
      if (savedViewMode && (savedViewMode === 'grid' || savedViewMode === 'list')) {
        setViewMode(savedViewMode)
      }
      
      if (savedGridColumns) {
        const columns = parseInt(savedGridColumns)
        if (columns >= 1 && columns <= 4) {
          setGridColumns(columns as GridColumns)
        }
      }

      // Load sort and limit preferences
      setFilters(prev => ({
        ...prev,
        sortBy: savedSortBy && ['name', 'createdAt', 'updatedAt', 'price'].includes(savedSortBy) 
          ? savedSortBy as FilterOptions['sortBy'] 
          : prev.sortBy,
        sortOrder: savedSortOrder && ['asc', 'desc'].includes(savedSortOrder)
          ? savedSortOrder as FilterOptions['sortOrder']
          : prev.sortOrder,
        limit: savedLimit && [12, 24, 48, 96].includes(parseInt(savedLimit))
          ? parseInt(savedLimit)
          : prev.limit,
      }))
      
      // Mark localStorage as loaded
      setIsLocalStorageLoaded(true)
    }
  }, [])

  // Fetch items function
  const fetchItems = useCallback(async () => {
    if (isAuthLoading) return
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        sort: filters.sortBy,
        order: filters.sortOrder,
        ...(filters.search && { q: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.manufacturer && { manufacturer: filters.manufacturer }),
        ...(filters.folderId && { folderId: filters.folderId }),
      })


      const response = await fetch(`/api/items?${params}`)
      
      if (!response.ok) {
        throw new Error('アイテムの取得に失敗しました')
      }

      const data: ItemsResponse = await response.json()
      
      setItems(data.items || [])
      setTotal(data.pagination?.total || 0)
      setTotalPages(data.pagination?.totalPages || 0)
      setCategories(data.categories || [])
      setManufacturers(data.manufacturers || [])
      setFolders(data.folders || [])
    } catch (err) {
      console.error('Error fetching items:', err)
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [filters, isAuthenticated, isAuthLoading])

  // Fetch items when localStorage is loaded and filters change
  useEffect(() => {
    // Wait for localStorage to be loaded before making API calls
    if (!isLocalStorageLoaded) return
    if (isAuthLoading) return
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    
    fetchItems()
  }, [isLocalStorageLoaded, filters, isAuthenticated, isAuthLoading, fetchItems])

  // Handlers
  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
    
    // Save sort and limit preferences to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('items-sort-by', newFilters.sortBy)
      localStorage.setItem('items-sort-order', newFilters.sortOrder)
      localStorage.setItem('items-limit', newFilters.limit.toString())
    }
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleItemClick = (item: Item) => {
    router.push(`/items/${item.id}`)
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('items-view-mode', mode)
    }
  }

  const handleColumnsChange = (columns: GridColumns) => {
    setGridColumns(columns)
    if (typeof window !== 'undefined') {
      localStorage.setItem('items-grid-columns', columns.toString())
    }
  }



  // Update filters when selectedFolderId changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      folderId: selectedFolderId || '',
      page: 1
    }))
  }, [selectedFolderId])

  // More folder handlers (defined after fetchItems)
  const handleFolderDelete = useCallback(async (folder: { id: string; name: string }) => {
    try {
      const response = await fetch(`/api/folders/${folder.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        // APIからのエラーレスポンスを取得
        const errorData = await response.json()
        // エラーオブジェクトから message を取得
        const errorMessage = errorData.error?.message || errorData.error || 'フォルダの削除に失敗しました'
        throw new Error(errorMessage)
      }

      // Refresh items list to reflect changes
      fetchItems()
      
      // フォルダツリーを更新
      window.dispatchEvent(new Event('folder-updated'))
      
      // Clear selection if deleted folder was selected
      if (selectedFolderId === folder.id) {
        setSelectedFolderId(null)
      }
    } catch (err) {
      console.error('Error deleting folder:', err)
      // エラーメッセージをより見やすく表示
      const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました'
      
      // 複数行のエラーメッセージも見やすく表示
      if (errorMessage.includes('サブフォルダ')) {
        // サブフォルダ関連のエラーの場合、より詳細に表示
        alert(`フォルダの削除エラー:\n\n${errorMessage}`)
      } else {
        alert(errorMessage)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolderId])

  const handleFolderSave = async (folderData: { name: string; parentId?: string }) => {
    try {
      if (folderModalMode === 'create') {
        const response = await fetch('/api/folders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(folderData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'フォルダの作成に失敗しました')
        }
      } else if (folderModalMode === 'edit' && editingFolder) {
        const response = await fetch(`/api/folders/${editingFolder.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: folderData.name }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'フォルダの更新に失敗しました')
        }
      }

      // Refresh items list to get updated folder info
      fetchItems()
      
      // フォルダツリーを更新
      window.dispatchEvent(new Event('folder-updated'))
    } catch (err) {
      console.error('Error saving folder:', err)
      throw err
    }
  }

  // Drag and drop handlers
  const handleItemDragStart = (item: Item) => {
    setDraggedItem(item)
  }

  const handleItemDragEnd = () => {
    setDraggedItem(null)
  }

  const handleItemDrop = useCallback(async (itemData: Item, targetFolderId: string | null) => {
    console.log('[ItemsPage] handleItemDrop called:', {
      itemId: itemData.id,
      itemName: itemData.name,
      currentFolderId: itemData.folder?.id,
      targetFolderId,
      isSameFolder: itemData.folder?.id === targetFolderId || (!itemData.folder && !targetFolderId)
    })

    // アイテムが既に同じフォルダにある場合は何もしない
    if (itemData.folder?.id === targetFolderId || (!itemData.folder && !targetFolderId)) {
      console.log('[ItemsPage] Item already in target folder, skipping move')
      return
    }

    try {
      const moveData = {
        itemId: itemData.id,
        folderId: targetFolderId,
      }
      
      console.log('[ItemsPage] Sending move request:', moveData)
      
      const response = await fetch('/api/items/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moveData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[ItemsPage] Move API error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        })
        throw new Error(errorData.message || errorData.error?.message || 'アイテムの移動に失敗しました')
      }

      const result = await response.json()
      console.log('[ItemsPage] Move successful:', result)

      // アイテムの状態を即座に更新（楽観的更新）
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === itemData.id 
            ? { ...item, folder: targetFolderId ? { id: targetFolderId, name: result.moveDetails?.toFolder?.name || '' } : undefined, folderId: targetFolderId || undefined }
            : item
        )
      )
      
      // アイテムリストを再取得（確実に最新データを取得）
      setTimeout(() => {
        fetchItems()
      }, 100)
      
      // フォルダツリーを更新（アイテム数表示の更新）
      window.dispatchEvent(new Event('folder-updated'))
      
      // 成功メッセージを表示
      if (result.message) {
        // 一時的に成功メッセージを表示
        const tempMessage = document.createElement('div')
        tempMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
        tempMessage.textContent = result.message
        document.body.appendChild(tempMessage)
        
        // 3秒後にメッセージを削除
        setTimeout(() => {
          if (tempMessage.parentNode) {
            tempMessage.parentNode.removeChild(tempMessage)
          }
        }, 3000)
      }
    } catch (err) {
      console.error('[ItemsPage] Error moving item:', err)
      alert(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }, [fetchItems])

  // フォルダ移動ハンドラー
  const handleFolderMove = useCallback(async (folderId: string, newParentId: string | null) => {
    console.log('[ItemsPage] handleFolderMove called:', {
      folderId,
      newParentId,
      isRootLevel: newParentId === null
    })

    try {
      const requestBody = {
        parentId: newParentId,
      }
      
      console.log('[ItemsPage] Sending folder move request:', {
        url: `/api/folders/${folderId}`,
        method: 'PUT',
        body: requestBody
      })

      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('[ItemsPage] Folder move response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      })

      if (!response.ok) {
        // APIからのエラーレスポンスを取得
        const errorData = await response.json()
        console.error('[ItemsPage] Folder move API error:', errorData)
        const errorMessage = errorData.error?.message || errorData.error || 'フォルダの移動に失敗しました'
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('[ItemsPage] Folder move successful:', result)

      // フォルダツリーを更新
      window.dispatchEvent(new Event('folder-updated'))
      
      console.log('[ItemsPage] フォルダを移動しました')
    } catch (err) {
      console.error('[ItemsPage] Error moving folder:', err)
      // エラーメッセージをより見やすく表示
      const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました'
      alert(`フォルダの移動エラー:\n\n${errorMessage}`)
    }
  }, [])

  // Set folder props for sidebar on mount and update when selectedFolderId changes
  useEffect(() => {
    const folderProps = {
      selectedFolderId,
      onFolderSelect: handleFolderSelect,
      onFolderCreate: handleFolderCreate,
      onFolderEdit: handleFolderEdit,
      onFolderDelete: handleFolderDelete,
      onItemDrop: handleItemDrop,
      onFolderMove: handleFolderMove,
    }
    setFolderProps(folderProps)

    // Cleanup: remove folder props when leaving the page
    return () => {
      setFolderProps(null)
    }
  }, [selectedFolderId, handleFolderSelect, handleFolderCreate, handleFolderEdit, handleFolderDelete, handleItemDrop, handleFolderMove, setFolderProps])

  // Authentication check
  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">アイテム管理</h1>
          <p className="text-gray-600">持ち物を一覧表示・管理できます</p>
        </div>
        {/* Desktop button */}
        <button
          onClick={() => router.push('/items/new')}
          className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新しいアイテム
        </button>
        {/* Mobile button */}
        <button
          onClick={() => router.push('/items/new')}
          className="sm:hidden w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新しいアイテムを追加
        </button>
      </div>

      {/* Breadcrumb */}
      <Breadcrumb
        selectedFolderId={selectedFolderId}
        folders={folders}
        onFolderSelect={handleFolderSelect}
      />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <ItemFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          categories={categories}
          manufacturers={manufacturers}
          folders={folders}
          loading={loading}
        />
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <ResultsCounter
          total={total}
          currentPage={filters.page}
          itemsPerPage={filters.limit}
          loading={loading}
        />
        
        <ViewModeToggle
          viewMode={viewMode}
          columns={gridColumns}
          onViewModeChange={handleViewModeChange}
          onColumnsChange={handleColumnsChange}
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                エラーが発生しました
              </h3>
              <div className="mt-1 text-sm text-red-700">
                {error}
              </div>
              <div className="mt-2">
                <button
                  onClick={fetchItems}
                  className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200"
                >
                  再試行
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

          {/* Items grid */}
      <ItemGrid
        items={items}
        viewMode={viewMode}
        columns={gridColumns}
        loading={loading}
        onItemClick={handleItemClick}
        onItemDragStart={handleItemDragStart}
        onItemDragEnd={handleItemDragEnd}
        emptyStateMessage="アイテムが見つかりませんでした。新しいアイテムを追加してみてください。"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={filters.page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          loading={loading}
        />
      )}


      {/* Folder modal */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSave={handleFolderSave}
        folder={editingFolder}
        parentId={parentFolderId}
        mode={folderModalMode}
      />

    </div>
  )
}
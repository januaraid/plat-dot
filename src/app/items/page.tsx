'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ItemGrid, ViewMode, GridColumns } from '@/components/items/ItemGrid'
import { ItemFilters, FilterOptions, ResultsCounter } from '@/components/items/ItemFilters'
import { ViewModeToggle } from '@/components/items/ItemGrid'
import { Pagination } from '@/components/items/Pagination'
import { ItemDetailModal } from '@/components/items/ItemDetailModal'
import { Item } from '@/components/items/ItemCard'

interface ItemsResponse {
  items: Item[]
  total: number
  page: number
  limit: number
  totalPages: number
  categories: string[]
  folders: Array<{ id: string; name: string }>
}

export default function ItemsPage() {
  const { data: session, status } = useSession()
  
  // State
  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [categories, setCategories] = useState<string[]>([])
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI State with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [gridColumns, setGridColumns] = useState<GridColumns>(3)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    category: '',
    folderId: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 24,
  })

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
    }
  }, [])

  // Fetch items function
  const fetchItems = useCallback(async () => {
    if (status === 'loading') return
    if (!session || !session.hasSession) {
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
        ...(filters.folderId && { folderId: filters.folderId }),
      })

      const response = await fetch(`/api/items?${params}`)
      
      if (!response.ok) {
        throw new Error('アイテムの取得に失敗しました')
      }

      const data: ItemsResponse = await response.json()
      
      setItems(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setCategories(data.categories || [])
      setFolders(data.folders || [])
    } catch (err) {
      console.error('Error fetching items:', err)
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [filters, session, status])

  // Fetch items on filter change
  useEffect(() => {
    fetchItems()
  }, [fetchItems])

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
    setSelectedItem(item)
    setIsModalOpen(true)
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

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
  }

  const handleItemEdit = (item: Item) => {
    // TODO: Navigate to edit page or open edit modal
    console.log('Edit item:', item)
    setIsModalOpen(false)
  }

  const handleItemDelete = async (item: Item) => {
    if (!confirm('このアイテムを削除してもよろしいですか？')) {
      return
    }

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('アイテムの削除に失敗しました')
      }

      // Refresh items list
      fetchItems()
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error deleting item:', err)
      alert(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }

  // Authentication check
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || !session.hasSession) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">ログインが必要です</h3>
        <p className="text-gray-500 mb-6">アイテムを管理するにはログインしてください</p>
        <a
          href="/auth/signin"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          ログイン
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">アイテム管理</h1>
          <p className="text-gray-600">持ち物を一覧表示・管理できます</p>
        </div>
        <button
          onClick={() => window.location.href = '/items/new'}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新しいアイテム
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <ItemFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          categories={categories}
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

      {/* Item detail modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onEdit={handleItemEdit}
        onDelete={handleItemDelete}
      />
    </div>
  )
}
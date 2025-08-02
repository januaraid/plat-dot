'use client'

import { useState, useEffect } from 'react'

export interface FilterOptions {
  search: string
  category: string
  folderId: string
  sortBy: 'name' | 'createdAt' | 'updatedAt' | 'price'
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

interface ItemFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  categories?: string[]
  folders?: Array<{ id: string; name: string }>
  loading?: boolean
}

export function ItemFilters({
  filters,
  onFiltersChange,
  categories = [],
  folders = [],
  loading = false
}: ItemFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchValue, setSearchValue] = useState(filters.search)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({
          ...filters,
          search: searchValue,
          page: 1, // Reset to first page when searching
        })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchValue, filters, onFiltersChange])

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1, // Reset to first page when filtering
    })
  }

  const clearFilters = () => {
    const defaultFilters: FilterOptions = {
      search: '',
      category: '',
      folderId: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: filters.limit,
    }
    setSearchValue('')
    onFiltersChange(defaultFilters)
  }

  const hasActiveFilters = filters.search || filters.category || filters.folderId

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="アイテムを検索..."
          disabled={loading}
        />
      </div>

      {/* Filter controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Filter toggle button */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              hasActiveFilters ? 'ring-2 ring-blue-500 border-blue-500' : ''
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            フィルター
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                適用中
              </span>
            )}
          </button>

          {/* Sort selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">並び順:</label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                handleFilterChange('sortBy', sortBy)
                handleFilterChange('sortOrder', sortOrder)
              }}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="createdAt-desc">作成日時（新しい順）</option>
              <option value="createdAt-asc">作成日時（古い順）</option>
              <option value="updatedAt-desc">更新日時（新しい順）</option>
              <option value="updatedAt-asc">更新日時（古い順）</option>
              <option value="name-asc">名前（A-Z）</option>
              <option value="name-desc">名前（Z-A）</option>
              <option value="price-desc">価格（高い順）</option>
              <option value="price-asc">価格（安い順）</option>
            </select>
          </div>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            フィルターをクリア
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {isFilterOpen && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">すべてのカテゴリ</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Folder filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                フォルダ
              </label>
              <select
                value={filters.folderId}
                onChange={(e) => handleFilterChange('folderId', e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">すべてのフォルダ</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items per page */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              表示件数
            </label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value={12}>12件</option>
              <option value={24}>24件</option>
              <option value={48}>48件</option>
              <option value={96}>96件</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

// Results counter component
interface ResultsCounterProps {
  total: number
  currentPage: number
  itemsPerPage: number
  loading?: boolean
}

export function ResultsCounter({ 
  total, 
  currentPage, 
  itemsPerPage, 
  loading = false 
}: ResultsCounterProps) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
    )
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, total)

  return (
    <p className="text-sm text-gray-700">
      {total === 0 ? (
        'アイテムが見つかりませんでした'
      ) : (
        <>
          {startItem}-{endItem}件を表示 (全{total}件)
        </>
      )}
    </p>
  )
}
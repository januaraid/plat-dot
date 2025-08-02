'use client'

import { useState } from 'react'
import { ItemCard, Item } from './ItemCard'

export type ViewMode = 'grid' | 'list'
export type GridColumns = 1 | 2 | 3 | 4

interface ItemGridProps {
  items: Item[]
  viewMode?: ViewMode
  columns?: GridColumns
  loading?: boolean
  onItemClick?: (item: Item) => void
  emptyStateMessage?: string
}

export function ItemGrid({ 
  items, 
  viewMode = 'grid', 
  columns = 3,
  loading = false,
  onItemClick,
  emptyStateMessage = 'アイテムが見つかりませんでした'
}: ItemGridProps) {
  
  // Grid columns class mapping
  const getGridCols = () => {
    if (viewMode === 'list') return 'grid-cols-1'
    
    switch (columns) {
      case 1: return 'grid-cols-1'
      case 2: return 'grid-cols-1 sm:grid-cols-2'
      case 3: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      case 4: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className={`grid gap-4 ${getGridCols()}`}>
        {[...Array(6)].map((_, index) => (
          <div key={index} className="animate-pulse">
            {viewMode === 'list' ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex space-x-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4 space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">アイテムなし</h3>
        <p className="text-gray-500 mb-6">{emptyStateMessage}</p>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新しいアイテムを追加
        </button>
      </div>
    )
  }

  // Items grid
  return (
    <div className={`grid gap-4 ${getGridCols()}`}>
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          viewMode={viewMode}
          onClick={onItemClick}
        />
      ))}
    </div>
  )
}

// View mode toggle component
interface ViewModeToggleProps {
  viewMode: ViewMode
  columns: GridColumns
  onViewModeChange: (mode: ViewMode) => void
  onColumnsChange: (cols: GridColumns) => void
}

export function ViewModeToggle({ 
  viewMode, 
  columns, 
  onViewModeChange, 
  onColumnsChange 
}: ViewModeToggleProps) {
  return (
    <div className="flex items-center space-x-4">
      {/* View mode toggle */}
      <div className="flex items-center bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-2 rounded-md transition-colors ${
            viewMode === 'grid'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          aria-label="グリッド表示"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-2 rounded-md transition-colors ${
            viewMode === 'list'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          aria-label="リスト表示"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Grid columns selector (only for grid mode) */}
      {viewMode === 'grid' && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">列数:</span>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {[1, 2, 3, 4].map((col) => (
              <button
                key={col}
                onClick={() => onColumnsChange(col as GridColumns)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  columns === col
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {col}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
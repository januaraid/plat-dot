'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface FolderNode {
  id: string
  name: string
  description?: string
  parentId?: string
  depth: number
  hasChildren: boolean
  children: FolderNode[]
  _count?: {
    items: number
    children: number
  }
  createdAt: string
  updatedAt: string
}

interface FolderTreeResponse {
  tree: FolderNode[]
  statistics: {
    totalFolders: number
    depthDistribution: Array<{depth: number, count: number}>
    maxDepthAllowed: number
    currentMaxDepth: number
  }
  metadata: {
    includeItemCount: boolean
    maxDepth: number
    generatedAt: string
  }
}

export default function FolderTreeTestPage() {
  const { data: session, status } = useSession()
  const [folderTree, setFolderTree] = useState<FolderTreeResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [includeItemCount, setIncludeItemCount] = useState(true)
  const [maxDepth, setMaxDepth] = useState(3)
  
  // フォルダ移動用の状態
  const [moveFormData, setMoveFormData] = useState({
    folderId: '',
    targetParentId: '',
  })
  const [moveLoading, setMoveLoading] = useState(false)

  // フォルダツリーを取得
  const fetchFolderTree = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        includeItemCount: includeItemCount.toString(),
        maxDepth: maxDepth.toString(),
      })
      
      const response = await fetch(`/api/folders/tree?${params}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Error: ${response.status}`)
      }
      
      const data = await response.json()
      setFolderTree(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch folder tree')
    } finally {
      setLoading(false)
    }
  }

  // フォルダ移動
  const moveFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    setMoveLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/folders/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moveFormData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Error: ${response.status}`)
      }
      
      const result = await response.json()
      alert(result.message)
      
      // フォームをリセットしてツリーを更新
      setMoveFormData({ folderId: '', targetParentId: '' })
      fetchFolderTree()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move folder')
    } finally {
      setMoveLoading(false)
    }
  }

  // 初回ロード時にフォルダツリーを取得
  useEffect(() => {
    if (status === 'authenticated') {
      fetchFolderTree()
    }
  }, [status, includeItemCount, maxDepth])

  // フォルダノードを再帰的に描画
  const renderFolderNode = (node: FolderNode, level: number = 0) => {
    const indent = level * 24 // 24px per level
    
    return (
      <div key={node.id} className="border-l-2 border-gray-200">
        <div 
          className="flex items-center p-3 hover:bg-gray-50"
          style={{ marginLeft: `${indent}px` }}
        >
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {level === 0 ? '📁' : level === 1 ? '📂' : '📄'}
              </span>
              <span className="font-medium">{node.name}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                深度 {node.depth}
              </span>
              {node._count && (
                <span className="text-xs text-gray-500">
                  ({node._count.items}個のアイテム, {node._count.children}個の子フォルダ)
                </span>
              )}
            </div>
            {node.description && (
              <p className="text-sm text-gray-600 mt-1 ml-6">{node.description}</p>
            )}
            <div className="text-xs text-gray-400 ml-6">
              ID: {node.id}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setMoveFormData({ ...moveFormData, folderId: node.id })}
              className="text-blue-500 hover:underline text-sm"
            >
              移動
            </button>
            <button
              onClick={() => setMoveFormData({ ...moveFormData, targetParentId: node.id })}
              className="text-green-500 hover:underline text-sm"
            >
              移動先に設定
            </button>
          </div>
        </div>
        
        {/* 子フォルダを再帰的に描画 */}
        {node.children && node.children.length > 0 && (
          <div>
            {node.children.map(child => renderFolderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>
  }

  if (status === 'unauthenticated') {
    return (
      <div className="p-8">
        <p>このページを表示するにはログインが必要です。</p>
        <a href="/auth/signin" className="text-blue-500 underline">ログイン</a>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <Link href="/test/folders" className="text-blue-500 hover:underline">
          ← フォルダ管理テストに戻る
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">フォルダ階層ツリー テストページ</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左側: 設定とフォルダ移動 */}
        <div className="space-y-6">
          {/* 表示設定 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">表示設定</h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeItemCount}
                    onChange={(e) => setIncludeItemCount(e.target.checked)}
                    className="mr-2"
                  />
                  アイテム数を表示
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">最大階層深度</label>
                <select
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value={1}>1階層</option>
                  <option value={2}>2階層</option>
                  <option value={3}>3階層</option>
                </select>
              </div>
              
              <button
                onClick={fetchFolderTree}
                disabled={loading}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? '読み込み中...' : 'ツリーを更新'}
              </button>
            </div>
          </div>

          {/* フォルダ移動 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">フォルダ移動</h2>
            <form onSubmit={moveFolder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">移動するフォルダID *</label>
                <input
                  type="text"
                  required
                  value={moveFormData.folderId}
                  onChange={(e) => setMoveFormData({ ...moveFormData, folderId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="移動するフォルダのID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">移動先親フォルダID</label>
                <input
                  type="text"
                  value={moveFormData.targetParentId}
                  onChange={(e) => setMoveFormData({ ...moveFormData, targetParentId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="移動先の親フォルダID（ルートの場合は空白）"
                />
              </div>
              
              <button
                type="submit"
                disabled={moveLoading}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {moveLoading ? '移動中...' : 'フォルダを移動'}
              </button>
            </form>
            
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>使い方:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>ツリーの「移動」ボタンで移動するフォルダを選択</li>
                <li>ツリーの「移動先に設定」ボタンで移動先を選択</li>
                <li>循環参照や階層制限が自動チェックされます</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 中央: フォルダツリー */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">フォルダ階層ツリー</h2>
            
            {loading ? (
              <p>Loading...</p>
            ) : folderTree && folderTree.tree.length > 0 ? (
              <div className="border rounded-lg">
                <div className="p-4 bg-gray-50 border-b">
                  <h3 className="font-medium">ルートフォルダ</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {folderTree.tree.map(node => renderFolderNode(node))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">フォルダが見つかりません</p>
            )}
          </div>

          {/* 統計情報 */}
          {folderTree && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">フォルダ統計</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">基本情報</h3>
                  <ul className="text-sm space-y-1">
                    <li>総フォルダ数: <span className="font-mono">{folderTree.statistics.totalFolders}</span></li>
                    <li>最大階層深度: <span className="font-mono">{folderTree.statistics.currentMaxDepth}</span></li>
                    <li>制限階層深度: <span className="font-mono">{folderTree.statistics.maxDepthAllowed}</span></li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">階層別分布</h3>
                  <ul className="text-sm space-y-1">
                    {folderTree.statistics.depthDistribution.map((item) => (
                      <li key={item.depth}>
                        深度 {item.depth}: <span className="font-mono">{item.count}個</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                <p>生成日時: {new Date(folderTree.metadata.generatedAt).toLocaleString('ja-JP')}</p>
                <p>アイテム数表示: {folderTree.metadata.includeItemCount ? 'ON' : 'OFF'}</p>
                <p>表示階層深度: {folderTree.metadata.maxDepth}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
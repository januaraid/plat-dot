'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Folder {
  id: string
  name: string
  description?: string
  parentId?: string
  parent?: {
    id: string
    name: string
  }
  children?: Folder[]
  items?: Array<{
    id: string
    name: string
    description?: string
    category?: string
  }>
  _count?: {
    items: number
    children: number
  }
  createdAt: string
  updatedAt: string
}

export default function FoldersTestPage() {
  const { data: session, status } = useSession()
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentParentId, setCurrentParentId] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<Array<{id: string | null, name: string}>>([])
  
  // フォルダ作成・更新フォーム用の状態
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
  })
  
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // フォルダ一覧を取得
  const fetchFolders = async (parentId: string | null = null) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        includeItemCount: 'true',
        includeChildren: 'false',
        ...(parentId && { parentId }),
      })
      
      const response = await fetch(`/api/folders?${params}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Error: ${response.status}`)
      }
      
      const data = await response.json()
      setFolders(data.folders)
      setCurrentParentId(parentId)
      
      // パンくずナビゲーションを更新
      if (parentId === null) {
        setBreadcrumb([{ id: null, name: 'ルート' }])
      } else {
        // 親フォルダの情報を取得してパンくずを構築
        updateBreadcrumb(parentId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch folders')
    } finally {
      setLoading(false)
    }
  }

  // パンくずナビゲーションを更新
  const updateBreadcrumb = async (folderId: string) => {
    try {
      const response = await fetch(`/api/folders/${folderId}`)
      if (response.ok) {
        const folder = await response.json()
        const newBreadcrumb = [{ id: null, name: 'ルート' }]
        
        // 親フォルダの階層を追加
        if (folder.parent) {
          // 簡単のため2階層まで表示
          if (folder.parent.parentId) {
            newBreadcrumb.push({ id: folder.parent.parentId, name: '...' })
          }
          newBreadcrumb.push({ id: folder.parent.id, name: folder.parent.name })
        }
        
        newBreadcrumb.push({ id: folder.id, name: folder.name })
        setBreadcrumb(newBreadcrumb)
      }
    } catch (error) {
      console.error('Failed to update breadcrumb:', error)
    }
  }

  // 単一フォルダを取得
  const fetchFolder = async (id: string) => {
    setError(null)
    try {
      const response = await fetch(`/api/folders/${id}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Error: ${response.status}`)
      }
      
      const folder = await response.json()
      setSelectedFolder(folder)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch folder')
    }
  }

  // 初回ロード時にフォルダを取得
  useEffect(() => {
    if (status === 'authenticated') {
      fetchFolders()
    }
  }, [status])

  // フォルダを作成
  const createFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    try {
      const body: any = {
        name: formData.name,
      }
      
      if (formData.description) body.description = formData.description
      if (formData.parentId) body.parentId = formData.parentId

      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Error: ${response.status}`)
      }
      
      // フォームをリセットして一覧を更新
      setFormData({ name: '', description: '', parentId: '' })
      fetchFolders(currentParentId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder')
    }
  }

  // フォルダを更新
  const updateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    
    setError(null)
    
    try {
      const body: any = {}
      
      if (formData.name) body.name = formData.name
      if (formData.description !== undefined) body.description = formData.description || null
      if (formData.parentId !== undefined) body.parentId = formData.parentId || null

      const response = await fetch(`/api/folders/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Error: ${response.status}`)
      }
      
      // フォームをリセットして一覧を更新
      setFormData({ name: '', description: '', parentId: '' })
      setIsEditing(false)
      setEditingId(null)
      fetchFolders(currentParentId)
      if (selectedFolder && selectedFolder.id === editingId) {
        fetchFolder(editingId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update folder')
    }
  }

  // フォルダを削除
  const deleteFolder = async (id: string, name: string) => {
    if (!confirm(`フォルダ「${name}」を削除しますか？\n※フォルダ内のアイテムは未分類に移動されます。`)) return
    
    setError(null)
    
    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Error: ${response.status}`)
      }
      
      const result = await response.json()
      alert(`フォルダが削除されました。${result.movedItemsCount}個のアイテムを未分類に移動しました。`)
      
      fetchFolders(currentParentId)
      if (selectedFolder && selectedFolder.id === id) {
        setSelectedFolder(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete folder')
    }
  }

  // 編集開始
  const startEdit = (folder: Folder) => {
    setFormData({
      name: folder.name,
      description: folder.description || '',
      parentId: folder.parentId || '',
    })
    setIsEditing(true)
    setEditingId(folder.id)
  }

  // 編集キャンセル
  const cancelEdit = () => {
    setFormData({ name: '', description: '', parentId: '' })
    setIsEditing(false)
    setEditingId(null)
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
      <div className="mb-6 flex space-x-4">
        <Link href="/test" className="text-blue-500 hover:underline">
          ← テストページ一覧に戻る
        </Link>
        <Link href="/test/folders/tree" className="text-green-500 hover:underline">
          📊 階層ツリービューを開く
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">フォルダ管理API テストページ</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* パンくずナビゲーション */}
      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold mb-2">現在の場所</h2>
        <nav className="flex space-x-2">
          {breadcrumb.map((item, index) => (
            <span key={index} className="flex items-center">
              {index > 0 && <span className="mx-2 text-gray-500">/</span>}
              <button
                onClick={() => fetchFolders(item.id)}
                className={`${
                  index === breadcrumb.length - 1
                    ? 'text-gray-700 font-semibold'
                    : 'text-blue-500 hover:underline'
                }`}
                disabled={index === breadcrumb.length - 1}
              >
                {item.name}
              </button>
            </span>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左側: フォルダ作成・更新フォーム */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              {isEditing ? 'フォルダ更新' : 'フォルダ作成'}
            </h2>
            <form onSubmit={isEditing ? updateFolder : createFolder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">フォルダ名 *</label>
                <input
                  type="text"
                  required={!isEditing}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="フォルダ名を入力"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">説明</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="フォルダの説明（省略可）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">親フォルダID</label>
                <input
                  type="text"
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="親フォルダのID（ルートの場合は空白）"
                />
                <p className="text-sm text-gray-500 mt-1">
                  現在の場所: {currentParentId || 'ルート'}
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {isEditing ? '更新' : '作成'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    キャンセル
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* テスト用ボタン */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">テスト機能</h2>
            <div className="space-y-3">
              <button
                onClick={() => fetchFolders(null)}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                ルートフォルダを表示
              </button>
              <button
                onClick={() => {
                  setFormData({ name: 'テストフォルダ', description: 'テスト用のフォルダです', parentId: currentParentId || '' })
                }}
                className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                テストデータを入力
              </button>
            </div>
          </div>
        </div>

        {/* 右側: フォルダ一覧と詳細 */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">フォルダ一覧</h2>
            
            {loading ? (
              <p>Loading...</p>
            ) : folders.length === 0 ? (
              <p>フォルダがありません</p>
            ) : (
              <div className="space-y-3">
                {folders.map((folder) => (
                  <div key={folder.id} className="border rounded p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{folder.name}</h3>
                        {folder.description && (
                          <p className="text-gray-600 text-sm mt-1">{folder.description}</p>
                        )}
                        <div className="mt-2 text-sm text-gray-500 space-x-4">
                          <span>アイテム: {folder._count?.items || 0}個</span>
                          <span>子フォルダ: {folder._count?.children || 0}個</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          ID: {folder.id}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => fetchFolders(folder.id)}
                          className="text-green-500 hover:underline text-sm"
                        >
                          開く
                        </button>
                        <button
                          onClick={() => fetchFolder(folder.id)}
                          className="text-blue-500 hover:underline text-sm"
                        >
                          詳細
                        </button>
                        <button
                          onClick={() => startEdit(folder)}
                          className="text-yellow-500 hover:underline text-sm"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => deleteFolder(folder.id, folder.name)}
                          className="text-red-500 hover:underline text-sm"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* フォルダ詳細 */}
          {selectedFolder && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">フォルダ詳細</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">名前:</span> {selectedFolder.name}
                </div>
                {selectedFolder.description && (
                  <div>
                    <span className="font-medium">説明:</span> {selectedFolder.description}
                  </div>
                )}
                {selectedFolder.parent && (
                  <div>
                    <span className="font-medium">親フォルダ:</span> {selectedFolder.parent.name}
                  </div>
                )}
                <div>
                  <span className="font-medium">ID:</span> {selectedFolder.id}
                </div>
                <div>
                  <span className="font-medium">作成日:</span> {new Date(selectedFolder.createdAt).toLocaleString('ja-JP')}
                </div>
                <div>
                  <span className="font-medium">更新日:</span> {new Date(selectedFolder.updatedAt).toLocaleString('ja-JP')}
                </div>
                
                {selectedFolder.children && selectedFolder.children.length > 0 && (
                  <div>
                    <span className="font-medium">子フォルダ:</span>
                    <ul className="ml-4 mt-1 list-disc">
                      {selectedFolder.children.map((child) => (
                        <li key={child.id}>{child.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedFolder.items && selectedFolder.items.length > 0 && (
                  <div>
                    <span className="font-medium">アイテム:</span>
                    <ul className="ml-4 mt-1 list-disc">
                      {selectedFolder.items.map((item) => (
                        <li key={item.id}>{item.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
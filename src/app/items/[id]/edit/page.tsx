'use client'

import { useState, useEffect, useRef, useMemo, memo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ItemForm } from '@/components/items/ItemForm'
import { useItems } from '@/hooks/useItems'
import { useFoldersForForm } from '@/hooks/useFoldersForForm'
import { Item } from '@/components/items/ItemCard'

interface EditItemPageProps {
  params: Promise<{ id: string }>
}

const EditItemPage = memo(function EditItemPage({ params }: EditItemPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { updateItem, loading: itemOperationLoading } = useItems()
  const { folders } = useFoldersForForm()
  
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [itemId, setItemId] = useState<string | null>(null)

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

  // paramsを解決
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setItemId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  // 未ログインの場合はトップページにリダイレクト
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, isAuthLoading, router])

  // アイテムデータを取得（itemIdが変更された時のみ）
  useEffect(() => {
    let isCancelled = false

    const fetchItem = async () => {
      if (!itemId) {
        return
      }
      
      // 認証チェック
      if (isAuthLoading) {
        return
      }
      
      if (!isAuthenticated) {
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/items/${itemId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            !isCancelled && setError('アイテムが見つかりませんでした。')
          } else {
            throw new Error('アイテムの取得に失敗しました')
          }
          return
        }

        const itemData = await response.json()
        !isCancelled && setItem(itemData)
      } catch (err) {
        console.error('Error fetching item:', err)
        !isCancelled && setError(err instanceof Error ? err.message : 'エラーが発生しました')
      } finally {
        !isCancelled && setLoading(false)
      }
    }

    // 認証が完了し、itemIdがある場合のみ実行
    if (itemId && !isAuthLoading && isAuthenticated) {
      fetchItem()
    }

    return () => {
      isCancelled = true
    }
  }, [itemId, isAuthLoading, isAuthenticated]) // 必要な依存関係を追加

  const handleSave = async (itemData: any) => {
    if (!itemId) {
      throw new Error('アイテムIDが見つかりません')
    }
    await updateItem(itemId, itemData)
  }

  // 認証チェック中のローディング
  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // アイテム取得中のローディング
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // エラー状態
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
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
                    onClick={() => router.push('/items')}
                    className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200"
                  >
                    アイテム一覧に戻る
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // アイテムが見つからない場合
  if (!item) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">アイテムが見つかりません</h1>
            <p className="text-gray-600 mb-4">指定されたアイテムは存在しないか、削除された可能性があります。</p>
            <button
              onClick={() => router.push('/items')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              アイテム一覧に戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <ItemForm
        item={item}
        mode="edit"
        folders={folders || []}
        onSave={handleSave}
        loading={itemOperationLoading}
      />
    </div>
  )
})

export default EditItemPage
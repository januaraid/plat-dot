'use client'

import { useEffect, useRef, useMemo, memo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ItemForm } from '@/components/items/ItemForm'
import { useItems } from '@/hooks/useItems'
import { useFoldersForForm } from '@/hooks/useFoldersForForm'

const NewItemPage = memo(function NewItemPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { createItem, loading } = useItems()
  const { folders } = useFoldersForForm()

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

  const handleSave = async (itemData: any) => {
    const createdItem = await createItem(itemData)
    return createdItem
  }

  // 認証チェック中のローディング
  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <ItemForm
        mode="create"
        folders={folders || []}
        onSave={handleSave}
        loading={loading}
      />
    </div>
  )
})

export default NewItemPage
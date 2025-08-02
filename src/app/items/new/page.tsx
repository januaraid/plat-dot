'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ItemForm } from '@/components/items/ItemForm'
import { useItems } from '@/hooks/useItems'
import { useFoldersForForm } from '@/hooks/useFoldersForForm'

export default function NewItemPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { createItem, loading } = useItems()
  const { folders } = useFoldersForForm()

  // 未ログインの場合はトップページにリダイレクト
  useEffect(() => {
    if (status !== 'loading' && (!session || !session.hasSession)) {
      router.replace('/')
    }
  }, [session?.hasSession, status]) // routerを依存配列から除外

  const handleSave = async (itemData: any) => {
    const createdItem = await createItem(itemData)
    return createdItem
  }

  // 認証チェック中のローディング
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 未ログインの場合はリダイレクト処理中
  if (!session || !session.hasSession) {
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
}
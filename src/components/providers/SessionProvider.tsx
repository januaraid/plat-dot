'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface SessionProviderProps {
  children: ReactNode
}

export default function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider 
      refetchInterval={30} // 30秒ごとにセッションを確認（ログアウト検出を早く）
      refetchOnWindowFocus={true} // ウィンドウフォーカス時にセッション再取得
    >
      {children}
    </NextAuthSessionProvider>
  )
}
'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface SessionProviderProps {
  children: ReactNode
}

export default function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider 
      refetchInterval={0} // セッション自動更新を無効化（無限更新バグ対策）
      refetchOnWindowFocus={false} // ウィンドウフォーカス時の自動更新も無効化
    >
      {children}
    </NextAuthSessionProvider>
  )
}
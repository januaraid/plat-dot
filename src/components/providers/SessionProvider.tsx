'use client'

import { SessionProvider as NextAuthSessionProvider, useSession } from 'next-auth/react'
import { ReactNode, useEffect } from 'react'

interface SessionProviderProps {
  children: ReactNode
}

// セッション状態をモニタリングするコンポーネント
function SessionMonitor({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  
  useEffect(() => {
    console.log('[SessionProvider] Session state changed:', {
      status,
      hasSession: !!session?.hasSession,
      userId: session?.user?.id,
      timestamp: new Date().toISOString()
    })
  }, [status, session?.hasSession, session?.user?.id])
  
  return <>{children}</>
}

export default function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider 
      basePath="/api/auth"
      refetchInterval={0} // セッション自動更新を無効化（無限更新バグ対策）
      refetchOnWindowFocus={false} // ウィンドウフォーカス時の自動更新も無効化
      refetchWhenOffline={false} // オフライン復帰時の自動更新も無効化
    >
      <SessionMonitor>
        {children}
      </SessionMonitor>
    </NextAuthSessionProvider>
  )
}
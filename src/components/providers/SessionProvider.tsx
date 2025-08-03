'use client'

import { SessionProvider as NextAuthSessionProvider, useSession } from 'next-auth/react'
import { ReactNode, useEffect } from 'react'

interface SessionProviderProps {
  children: ReactNode
}

// セッション状態をモニタリングするコンポーネント
function SessionMonitor({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export default function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider 
      basePath="/api/auth"
      refetchInterval={300} // 5分間隔でセッション更新
      refetchOnWindowFocus={true} // ウィンドウフォーカス時の更新を有効化
      refetchWhenOffline={false} // オフライン復帰時の自動更新は無効化
    >
      <SessionMonitor>
        {children}
      </SessionMonitor>
    </NextAuthSessionProvider>
  )
}
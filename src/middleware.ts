import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { setSecurityHeaders, enforceHTTPS } from "@/lib/security"
import { checkRateLimit, rateLimitErrorResponse } from "@/lib/rate-limit"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { nextUrl } = req

  // HTTPS強制
  const httpsRedirect = enforceHTTPS(req)
  if (httpsRedirect) {
    return httpsRedirect
  }

  // APIルートのレート制限チェック（NextAuth.jsの内部エンドポイントは除外）
  if (nextUrl.pathname.startsWith('/api/') && 
      !nextUrl.pathname.startsWith('/api/auth/callback') &&
      !nextUrl.pathname.startsWith('/api/auth/csrf') &&
      !nextUrl.pathname.startsWith('/api/auth/providers')) {
    const userId = req.auth?.user?.id
    const { allowed, resetTime } = checkRateLimit(req, userId)
    
    if (!allowed) {
      return rateLimitErrorResponse(resetTime)
    }
  }

  // APIルート（認証関連を除く）は認証必須
  if (nextUrl.pathname.startsWith('/api/') && !nextUrl.pathname.startsWith('/api/auth/')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/auth/signin', nextUrl))
    }
  }
  
  // ダッシュボードは認証必須
  if (nextUrl.pathname.startsWith('/dashboard')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/auth/signin', nextUrl))
    }
  }

  // レスポンスにセキュリティヘッダーを設定
  const response = NextResponse.next()
  return setSecurityHeaders(response)
})

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
  ],
}
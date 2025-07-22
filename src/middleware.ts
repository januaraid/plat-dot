import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { nextUrl } = req

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

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
  ],
}
import { NextRequest, NextResponse } from 'next/server'

/**
 * セキュリティヘッダーを設定
 */
export function setSecurityHeaders(response: NextResponse): NextResponse {
  // HTTPS強制（Strict-Transport-Security）
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )

  // XSS対策
  response.headers.set(
    'X-Content-Type-Options',
    'nosniff'
  )

  // クリックジャッキング対策
  response.headers.set(
    'X-Frame-Options',
    'DENY'
  )

  // XSS対策（モダンブラウザ向け）
  response.headers.set(
    'X-XSS-Protection',
    '1; mode=block'
  )

  // リファラーポリシー
  response.headers.set(
    'Referrer-Policy',
    'strict-origin-when-cross-origin'
  )

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https://accounts.google.com; " +
    "frame-src 'self' https://accounts.google.com;"
  )

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  )

  return response
}

/**
 * HTTPS強制のチェック
 */
export function enforceHTTPS(request: NextRequest): NextResponse | null {
  const proto = request.headers.get('x-forwarded-proto')
  const host = request.headers.get('host')

  // 開発環境では強制しない
  if (process.env.NODE_ENV === 'development') {
    return null
  }

  // HTTPSでない場合はリダイレクト
  if (proto !== 'https' && host) {
    const httpsUrl = `https://${host}${request.nextUrl.pathname}${request.nextUrl.search}`
    return NextResponse.redirect(httpsUrl, 301)
  }

  return null
}

/**
 * CSRF対策用のトークン生成
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * CSRFトークンの検証
 */
export function validateCSRFToken(request: NextRequest, token: string | null): boolean {
  // GETリクエストは検証不要
  if (request.method === 'GET' || request.method === 'HEAD') {
    return true
  }

  if (!token) {
    return false
  }

  // ヘッダーまたはボディからトークンを取得
  const requestToken = request.headers.get('x-csrf-token') || 
                      request.headers.get('X-CSRF-Token')

  return requestToken === token
}
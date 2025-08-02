import { NextRequest, NextResponse } from 'next/server'

/**
 * レート制限設定
 */
export interface RateLimitConfig {
  interval: number // ミリ秒単位の時間間隔
  uniqueTokenPerInterval: number // 時間間隔内で許可される一意のトークン数
}

/**
 * デフォルトのレート制限設定
 */
export const defaultRateLimitConfig: RateLimitConfig = {
  interval: 60 * 1000, // 1分
  uniqueTokenPerInterval: 100, // 1分間に100リクエストまで
}

/**
 * API別のレート制限設定
 */
export const apiRateLimitConfigs: Record<string, RateLimitConfig> = {
  // 認証のセッション確認は緩めに（SessionProviderが頻繁にアクセスするため）
  '/api/auth/session': {
    interval: 60 * 1000, // 1分
    uniqueTokenPerInterval: 60, // 1分間に60回まで
  },
  // その他の認証関連は厳しめに制限
  '/api/auth/signin': {
    interval: 15 * 60 * 1000, // 15分
    uniqueTokenPerInterval: 5, // 15分間に5回まで
  },
  '/api/auth/signout': {
    interval: 5 * 60 * 1000, // 5分
    uniqueTokenPerInterval: 10, // 5分間に10回まで
  },
  // アップロード関連も制限
  '/api/upload': {
    interval: 60 * 1000, // 1分
    uniqueTokenPerInterval: 10, // 1分間に10回まで
  },
  // AI関連は厳しく制限
  '/api/ai': {
    interval: 60 * 60 * 1000, // 1時間
    uniqueTokenPerInterval: 20, // 1時間に20回まで
  },
}

/**
 * メモリベースのレート制限ストア
 * 本番環境ではRedisなどを使用することを推奨
 */
class RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map()

  /**
   * リクエストが制限内かチェック
   */
  check(key: string, config: RateLimitConfig): boolean {
    const now = Date.now()
    const record = this.store.get(key)

    // 新規または期限切れの場合
    if (!record || now > record.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + config.interval,
      })
      return true
    }

    // 制限内の場合
    if (record.count < config.uniqueTokenPerInterval) {
      record.count++
      return true
    }

    // 制限超過
    return false
  }

  /**
   * 古いエントリをクリーンアップ
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

// シングルトンインスタンス
const rateLimitStore = new RateLimitStore()

// 定期的にクリーンアップ（10分ごと）
if (typeof global !== 'undefined' && !global.rateLimitCleanupInterval) {
  global.rateLimitCleanupInterval = setInterval(() => {
    rateLimitStore.cleanup()
  }, 10 * 60 * 1000)
}

/**
 * IPアドレスまたはユーザーIDからレート制限キーを生成
 */
export function getRateLimitKey(request: NextRequest, userId?: string): string {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const path = request.nextUrl.pathname
  
  if (userId) {
    return `rate-limit:${path}:user:${userId}`
  }
  
  return `rate-limit:${path}:ip:${ip}`
}

/**
 * レート制限チェック
 */
export function checkRateLimit(
  request: NextRequest,
  userId?: string,
  customConfig?: RateLimitConfig
): { allowed: boolean; resetTime?: number } {
  const key = getRateLimitKey(request, userId)
  const path = request.nextUrl.pathname

  // パスに応じた設定を取得
  let config = customConfig || defaultRateLimitConfig
  for (const [prefix, prefixConfig] of Object.entries(apiRateLimitConfigs)) {
    if (path.startsWith(prefix)) {
      config = prefixConfig
      break
    }
  }

  const allowed = rateLimitStore.check(key, config)
  
  if (!allowed) {
    const record = rateLimitStore['store'].get(key)
    return {
      allowed: false,
      resetTime: record?.resetTime,
    }
  }

  return { allowed: true }
}

/**
 * レート制限エラーレスポンスを生成
 */
export function rateLimitErrorResponse(resetTime?: number): NextResponse {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (resetTime) {
    headers['X-RateLimit-Reset'] = new Date(resetTime).toISOString()
    headers['Retry-After'] = Math.ceil((resetTime - Date.now()) / 1000).toString()
  }

  return NextResponse.json(
    {
      error: 'Too many requests',
      message: 'レート制限に達しました。しばらくしてから再度お試しください。',
    },
    { 
      status: 429,
      headers,
    }
  )
}

// グローバル型定義
declare global {
  var rateLimitCleanupInterval: NodeJS.Timeout | undefined
}
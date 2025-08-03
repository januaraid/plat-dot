/**
 * AI機能のエラーハンドリング用ユーティリティ
 */

// エラーコード定義
export enum AIErrorCode {
  // 認証・認可エラー
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // バリデーションエラー
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_IMAGE_DATA = 'MISSING_IMAGE_DATA',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  
  // AI サービスエラー
  AI_EMPTY_RESPONSE = 'AI_EMPTY_RESPONSE',
  AI_RECOGNITION_FAILED = 'AI_RECOGNITION_FAILED',
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  AI_QUOTA_EXCEEDED = 'AI_QUOTA_EXCEEDED',
  
  // ネットワーク・システムエラー
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// カスタムエラークラス
export class AIError extends Error {
  public code: AIErrorCode
  public statusCode: number
  public details?: any

  constructor(
    message: string, 
    code: AIErrorCode, 
    statusCode: number = 500, 
    details?: any
  ) {
    super(message)
    this.name = 'AIError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

// エラー判定ユーティリティ
export function categorizeAIError(error: unknown): AIError {
  if (error instanceof AIError) {
    return error
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    // API制限・認証エラー
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return new AIError('認証に失敗しました', AIErrorCode.UNAUTHORIZED, 401)
    }
    
    if (message.includes('rate limit') || message.includes('quota')) {
      return new AIError('API制限に達しました', AIErrorCode.AI_QUOTA_EXCEEDED, 429)
    }
    
    // ネットワークエラー
    if (message.includes('network') || message.includes('fetch')) {
      return new AIError('ネットワークエラーが発生しました', AIErrorCode.NETWORK_ERROR, 502)
    }
    
    if (message.includes('timeout')) {
      return new AIError('タイムアウトが発生しました', AIErrorCode.TIMEOUT_ERROR, 504)
    }
    
    // AI応答エラー
    if (message.includes('ai応答が空') || message.includes('empty response')) {
      return new AIError('AI応答が空です', AIErrorCode.AI_EMPTY_RESPONSE, 502)
    }
    
    if (message.includes('ai認識に失敗') || message.includes('recognition failed')) {
      return new AIError('AI認識に失敗しました', AIErrorCode.AI_RECOGNITION_FAILED, 502)
    }
    
    return new AIError(error.message, AIErrorCode.INTERNAL_ERROR, 500)
  }
  
  return new AIError('不明なエラーが発生しました', AIErrorCode.INTERNAL_ERROR, 500)
}

// APIレスポンス用エラーフォーマッター
export function formatErrorResponse(error: AIError) {
  return {
    error: error.message,
    code: error.code,
    ...(error.details && { details: error.details })
  }
}

// ユーザー向けエラーメッセージ
export function getUserFriendlyMessage(code: AIErrorCode): string {
  switch (code) {
    case AIErrorCode.UNAUTHORIZED:
      return 'ログインが必要です'
    case AIErrorCode.RATE_LIMIT_EXCEEDED:
      return 'しばらく時間をおいて再度お試しください'
    case AIErrorCode.MISSING_IMAGE_DATA:
      return '画像データが不正です'
    case AIErrorCode.UNSUPPORTED_FORMAT:
      return 'サポートされていない画像形式です'
    case AIErrorCode.AI_EMPTY_RESPONSE:
      return 'AI認識結果を取得できませんでした'
    case AIErrorCode.AI_RECOGNITION_FAILED:
      return '画像認識に失敗しました。別の画像をお試しください'
    case AIErrorCode.AI_SERVICE_UNAVAILABLE:
      return 'AI機能が一時的に利用できません'
    case AIErrorCode.AI_QUOTA_EXCEEDED:
      return 'AI機能の利用制限に達しました'
    case AIErrorCode.NETWORK_ERROR:
      return 'ネットワークエラーが発生しました'
    case AIErrorCode.TIMEOUT_ERROR:
      return 'タイムアウトが発生しました。再度お試しください'
    default:
      return 'エラーが発生しました。管理者にお問い合わせください'
  }
}
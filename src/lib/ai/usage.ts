import { prisma } from '@/lib/db'

/**
 * AI使用履歴のタイプ
 */
export type AIUsageType = 'image_recognition' | 'price_search'

/**
 * AI使用履歴を記録する
 * @param userId ユーザーID（実際のDBのcuid）
 * @param type AI機能のタイプ
 * @param itemId 関連アイテムID（オプション）
 */
export async function logAIUsage(
  userId: string, 
  type: AIUsageType, 
  itemId?: string
): Promise<void> {
  try {
    await prisma.aiUsageLog.create({
      data: {
        userId,
        type,
        itemId
      }
    })
  } catch (error) {
    console.error('AI使用履歴の記録に失敗:', error)
    // エラーが発生してもAI機能の実行は継続する
  }
}

/**
 * ユーザーのAI使用状況を取得する
 * @param userId ユーザーID（実際のDBのcuid）
 * @param limit 期間制限（デフォルト: 今月）
 */
export async function getAIUsageStats(userId: string, limit: 'today' | 'month' | 'all' = 'month') {
  const now = new Date()
  let startDate: Date

  switch (limit) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'all':
      startDate = new Date(0) // 全期間
      break
  }

  const whereCondition = {
    userId,
    createdAt: {
      gte: startDate
    }
  }

  // 並行して各統計を取得
  const [
    totalUsage,
    imageRecognitionUsage,
    priceSearchUsage,
    recentLogs
  ] = await Promise.all([
    // 総使用回数
    prisma.aiUsageLog.count({
      where: whereCondition
    }),
    
    // 画像認識回数
    prisma.aiUsageLog.count({
      where: {
        ...whereCondition,
        type: 'image_recognition'
      }
    }),
    
    // 価格検索回数
    prisma.aiUsageLog.count({
      where: {
        ...whereCondition,
        type: 'price_search'
      }
    }),
    
    // 最近の使用履歴（最新10件）
    prisma.aiUsageLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        createdAt: true,
        item: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  ])

  return {
    totalUsage,
    imageRecognitionUsage,
    priceSearchUsage,
    recentLogs,
    period: limit,
    startDate
  }
}

/**
 * ユーザーIDを正規化する（emailの場合は実際のDBのIDに変換）
 * @param sessionUserId セッションのユーザーID
 * @param sessionEmail セッションのemail
 */
export async function normalizeUserId(sessionUserId: string, sessionEmail?: string): Promise<string> {
  // セッションのIDがemailの場合、実際のDBのIDを取得
  if (sessionUserId === sessionEmail) {
    const user = await prisma.user.findUnique({
      where: { email: sessionEmail },
      select: { id: true }
    })
    return user?.id || sessionUserId
  }
  
  return sessionUserId
}
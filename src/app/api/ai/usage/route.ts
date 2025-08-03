import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getAIUsageStats, normalizeUserId } from '@/lib/ai/usage'

export async function GET(req: NextRequest) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // デバッグ情報をログに出力
    console.log('=== SESSION DEBUG ===')
    console.log('Full session:', JSON.stringify(session, null, 2))
    console.log('Session user ID:', session.user.id)
    console.log('Session user email:', session.user.email)
    console.log('Session user ID type:', typeof session.user.id)
    
    // データベースの全ユーザーを取得してデバッグ
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true
      }
    })
    console.log('All users in DB:', allUsers)
    
    // セッションのuser.idがemailの場合があるため、emailで検索
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        aiUsageCount: true,
        aiUsageLimit: true,
        subscriptionTier: true
      }
    })

    console.log('Found user by session ID:', user)

    // IDで見つからない場合、emailで検索（NextAuthのID設定問題に対応）
    if (!user && session.user.email) {
      console.log('ID not found, trying email search...')
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          aiUsageCount: true,
          aiUsageLimit: true,
          subscriptionTier: true
        }
      })
      console.log('Found user by email:', user)
    }

    if (!user) {
      console.error('=== USER NOT FOUND ERROR ===')
      console.error('User not found by ID or email')
      console.error('Session ID:', session.user.id)
      console.error('Session email:', session.user.email)
      
      return Response.json({ 
        error: 'User not found',
        details: 'User not found by session ID or email. Check authentication configuration.',
        sessionUserId: session.user.id,
        sessionUserEmail: session.user.email,
        allUserIds: allUsers.map(u => u.id)
      }, { status: 404 })
    }

    // ユーザーIDを正規化
    const normalizedUserId = await normalizeUserId(session.user.id || '', session.user.email || '')
    console.log('Normalized user ID:', normalizedUserId)
    
    // AI使用状況を取得
    const usageStats = await getAIUsageStats(normalizedUserId, 'month')
    
    const now = new Date()
    return Response.json({
      currentUsage: usageStats.totalUsage,
      monthlyUsage: usageStats.totalUsage,
      imageRecognitionUsage: usageStats.imageRecognitionUsage,
      priceSearchUsage: usageStats.priceSearchUsage,
      usageLimit: user.aiUsageLimit,
      subscriptionTier: user.subscriptionTier,
      remainingQuota: Math.max(0, user.aiUsageLimit - usageStats.totalUsage),
      resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
      recentLogs: usageStats.recentLogs
    })

  } catch (error) {
    console.error('AI usage API error:', error)
    return Response.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
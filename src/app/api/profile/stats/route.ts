import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.hasSession || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Profile stats API - Session user:', {
      email: session.user.email,
      name: session.user.name,
      hasSession: session.hasSession
    })

    // 統計情報取得では読み取り専用アクセス（ユーザー情報は更新しない）
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // アイテム数を取得
    const totalItems = await prisma.item.count({
      where: { userId: dbUser.id }
    })

    // フォルダ数を取得
    const totalFolders = await prisma.folder.count({
      where: { userId: dbUser.id }
    })

    // 画像数を取得
    const totalImages = await prisma.itemImage.count({
      where: {
        item: {
          userId: dbUser.id
        }
      }
    })

    // AI使用回数を取得
    const aiUsageCount = await prisma.aiUsageLog.count({
      where: { userId: dbUser.id }
    })

    // 登録日を取得
    const registrationDate = dbUser.createdAt.toISOString()

    return NextResponse.json({
      totalItems,
      totalFolders,
      totalImages,
      aiUsageCount,
      registrationDate,
      displayName: dbUser.name || session.user.name || ''
    })

  } catch (error) {
    console.error('Error fetching profile stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
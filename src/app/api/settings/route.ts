import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// 設定専用: ユーザーを取得するが名前は上書きしない
async function getOrCreateUser(email: string, sessionName?: string | null, sessionImage?: string | null) {
  let user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    // ユーザーが存在しない場合のみ作成
    user = await prisma.user.create({
      data: {
        email,
        name: sessionName || '',
        image: sessionImage,
      },
    })
  } else {
    // 画像のみ更新（名前は保持）
    if (sessionImage && sessionImage !== user.image) {
      user = await prisma.user.update({
        where: { email },
        data: {
          image: sessionImage,
          updatedAt: new Date(),
        },
      })
    }
  }

  return user
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.hasSession || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getOrCreateUser(session.user.email, session.user.name, session.user.image)

    return NextResponse.json({
      displayName: dbUser.name || session.user.name || '',
      email: dbUser.email,
      aiUsageCount: dbUser.aiUsageCount,
      aiUsageLimit: dbUser.aiUsageLimit,
      subscriptionTier: dbUser.subscriptionTier,
    })

  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    console.log('Settings PUT - Session check:', {
      hasSession: session?.hasSession,
      email: session?.user?.email
    })
    
    if (!session?.hasSession || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { displayName } = body
    console.log('Settings PUT - Request body:', { displayName })

    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json(
        { error: '表示名が無効です' },
        { status: 400 }
      )
    }

    const dbUser = await getOrCreateUser(session.user.email, session.user.name, session.user.image)
    console.log('Settings PUT - DB user:', { id: dbUser.id, currentName: dbUser.name })

    // 表示名を更新
    console.log('Settings PUT - Before update:', { userId: dbUser.id, oldName: dbUser.name, newName: displayName })
    
    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        name: displayName,
        updatedAt: new Date(),
      },
    })
    console.log('Settings PUT - After update:', { id: updatedUser.id, newName: updatedUser.name, updatedAt: updatedUser.updatedAt })
    
    // 確認のため再度DBから取得
    const verifyUser = await prisma.user.findUnique({
      where: { id: dbUser.id },
      select: { id: true, name: true, updatedAt: true }
    })
    console.log('Settings PUT - Verification query result:', verifyUser)

    return NextResponse.json({
      displayName: updatedUser.name,
      email: updatedUser.email,
      aiUsageCount: updatedUser.aiUsageCount,
      aiUsageLimit: updatedUser.aiUsageLimit,
      subscriptionTier: updatedUser.subscriptionTier,
    })

  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ensureUserExists } from '@/lib/user-helper'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Debug API Test ===')
    
    // 認証テスト
    console.log('Testing auth...')
    const session = await auth()
    console.log('Session:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    })
    
    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'No authenticated user',
        session: session,
      }, { status: 401 })
    }

    // ユーザーをデータベースに確実に存在させる
    const dbUser = await ensureUserExists({
      id: session.user.id || '',
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    })
    
    // データベーステスト
    console.log('Testing database...')
    const userCount = await prisma.user.count()
    console.log('User count:', userCount)
    
    const itemCount = await prisma.item.count({
      where: { userId: dbUser.id }
    })
    console.log('Item count for user:', itemCount)
    
    // テストアイテム作成
    console.log('Creating test item...')
    const testItem = await prisma.item.create({
      data: {
        name: 'Debug Test Item',
        description: 'Created from debug endpoint',
        userId: dbUser.id,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            order: true,
          },
        },
      },
    })
    console.log('Test item created:', testItem.id)
    
    // アイテム一覧取得
    console.log('Fetching items...')
    const items = await prisma.item.findMany({
      where: { userId: dbUser.id },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    })
    console.log('Items found:', items.length)
    
    return NextResponse.json({
      success: true,
      session: {
        userId: dbUser.id,
        email: session.user?.email,
      },
      database: {
        userCount,
        itemCount: items.length,
      },
      testItem: {
        id: testItem.id,
        name: testItem.name,
      },
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        folder: item.folder,
        imageCount: item.images.length,
      })),
    })
    
  } catch (error) {
    console.error('Debug API Error:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    return NextResponse.json({
      error: 'Debug API failed',
      details: {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }, { status: 500 })
  }
}
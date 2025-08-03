import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureUserExists } from '@/lib/user-helper'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const dbUser = await ensureUserExists({
      id: session.user.id || '',
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'category' または 'manufacturer'
    const query = searchParams.get('query') || ''

    if (!type || !['category', 'manufacturer'].includes(type)) {
      return NextResponse.json(
        { error: 'typeパラメータは必須です（category または manufacturer）' },
        { status: 400 }
      )
    }

    // ユーザーの既存アイテムから該当フィールドの値を取得
    const field = type === 'category' ? 'category' : 'manufacturer'
    
    const suggestions = await prisma.item.findMany({
      where: {
        userId: dbUser.id,
        [field]: {
          not: null,
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        [field]: true
      },
      distinct: [field] as any,
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    })

    // 重複を除去し、空でない値のみを返す
    const uniqueSuggestions = [...new Set(
      suggestions
        .map(item => (item as any)[field] as string)
        .filter(value => value && value.trim())
    )]

    return NextResponse.json({
      suggestions: uniqueSuggestions
    })

  } catch (error) {
    console.error('Suggestions API error:', error)
    return NextResponse.json(
      { error: 'サジェスション取得に失敗しました' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPriceHistory } from '@/lib/ai/gemini'
import { prisma } from '@/lib/prisma'

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: Props) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const itemId = resolvedParams.id

    // クエリパラメータから limit を取得
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // アイテムの存在確認とアクセス権限チェック
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        user: {
          email: session.user.email
        }
      }
    })

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'アイテムが見つかりませんでした' },
        { status: 404 }
      )
    }

    // 価格履歴を取得
    const priceHistory = await getPriceHistory(itemId, session.user.email, limit)

    return NextResponse.json({
      success: true,
      data: priceHistory
    })

  } catch (error) {
    console.error('価格履歴取得エラー:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '価格履歴の取得中にエラーが発生しました'
      },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { searchItemPrices, savePriceHistory, checkRateLimit } from '@/lib/ai/gemini'
import { prisma } from '@/lib/prisma'

interface SearchPricesRequest {
  itemId: string
  itemName: string
  manufacturer?: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { itemId, itemName, manufacturer }: SearchPricesRequest = await req.json()

    if (!itemId || !itemName) {
      return NextResponse.json(
        { success: false, error: 'アイテムIDと商品名は必須です' },
        { status: 400 }
      )
    }

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

    // レート制限チェック
    if (!checkRateLimit(session.user.email)) {
      return NextResponse.json(
        { success: false, error: 'リクエストが多すぎます。1分後に再度お試しください。' },
        { status: 429 }
      )
    }

    // AI価格調査を実行
    const searchResult = await searchItemPrices(itemName, manufacturer)

    // 価格履歴として保存
    await savePriceHistory(itemId, searchResult, session.user.email)

    return NextResponse.json({
      success: true,
      data: {
        prices: searchResult.prices,
        summary: searchResult.summary,
        searchQuery: `${itemName}${manufacturer ? ` ${manufacturer}` : ''}`,
        searchDate: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('AI価格調査エラー:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'AI価格調査中にエラーが発生しました'
      },
      { status: 500 }
    )
  }
}
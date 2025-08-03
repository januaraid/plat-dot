import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Props {
  params: Promise<{ id: string; historyId: string }>
}

export async function DELETE(req: NextRequest, { params }: Props) {
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
    const historyId = resolvedParams.historyId

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

    // 価格履歴の存在確認とアクセス権限チェック
    const priceHistory = await prisma.priceHistory.findFirst({
      where: {
        id: historyId,
        itemId: itemId,
        item: {
          user: {
            email: session.user.email
          }
        }
      }
    })

    if (!priceHistory) {
      return NextResponse.json(
        { success: false, error: '価格履歴が見つかりませんでした' },
        { status: 404 }
      )
    }

    // 論理削除（isActiveをfalseに設定）
    await prisma.priceHistory.update({
      where: {
        id: historyId
      },
      data: {
        isActive: false
      }
    })

    return NextResponse.json({
      success: true,
      message: '価格履歴を削除しました'
    })

  } catch (error) {
    console.error('価格履歴削除エラー:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '価格履歴の削除中にエラーが発生しました'
      },
      { status: 500 }
    )
  }
}
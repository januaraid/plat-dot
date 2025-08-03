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

    // 全アイテムの購入価格合計
    const purchaseTotalResult = await prisma.item.aggregate({
      where: {
        userId: dbUser.id,
        purchasePrice: {
          not: null
        }
      },
      _sum: {
        purchasePrice: true
      }
    })

    // 最新の価格履歴データを取得
    const itemsWithLatestPrices = await prisma.item.findMany({
      where: {
        userId: dbUser.id
      },
      include: {
        priceHistory: {
          where: {
            isActive: true
          },
          orderBy: {
            searchDate: 'desc'
          },
          take: 1
        }
      }
    })

    // 現在価格の計算
    let currentTotalValue = 0
    let itemsWithPriceData = 0
    const topValueItems = []

    for (const item of itemsWithLatestPrices) {
      const latestPrice = item.priceHistory[0]
      if (latestPrice?.avgPrice) {
        const currentPrice = Number(latestPrice.avgPrice)
        currentTotalValue += currentPrice
        itemsWithPriceData++
        
        topValueItems.push({
          id: item.id,
          name: item.name,
          category: item.category,
          purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
          currentPrice,
          priceChangePercent: item.purchasePrice 
            ? ((currentPrice - Number(item.purchasePrice)) / Number(item.purchasePrice)) * 100 
            : null,
          lastUpdated: latestPrice.searchDate
        })
      }
    }

    // 価値の高いアイテムトップ10
    const topValueItemsSorted = topValueItems
      .sort((a, b) => b.currentPrice - a.currentPrice)
      .slice(0, 10)

    // 損益計算
    const purchaseTotal = purchaseTotalResult._sum.purchasePrice 
      ? Number(purchaseTotalResult._sum.purchasePrice) 
      : 0
    
    const profitLoss = currentTotalValue - purchaseTotal
    const profitLossPercent = purchaseTotal > 0 
      ? (profitLoss / purchaseTotal) * 100 
      : 0

    // カテゴリ別の価値分析
    const categoryValues = topValueItems.reduce((acc, item) => {
      const category = item.category || '未分類'
      if (!acc[category]) {
        acc[category] = {
          category,
          totalValue: 0,
          itemCount: 0,
          averageValue: 0
        }
      }
      acc[category].totalValue += item.currentPrice
      acc[category].itemCount++
      acc[category].averageValue = acc[category].totalValue / acc[category].itemCount
      return acc
    }, {} as Record<string, any>)

    // 最近の価格更新
    const recentPriceUpdates = await prisma.priceHistory.findMany({
      where: {
        item: {
          userId: dbUser.id
        },
        isActive: true
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      },
      orderBy: {
        searchDate: 'desc'
      },
      take: 5
    })

    return NextResponse.json({
      totalPurchaseValue: purchaseTotal,
      totalCurrentValue: currentTotalValue,
      profitLoss,
      profitLossPercent,
      itemsWithPriceData,
      totalItems: itemsWithLatestPrices.length,
      topValueItems: topValueItemsSorted,
      categoryValues: Object.values(categoryValues).sort((a: any, b: any) => b.totalValue - a.totalValue),
      recentPriceUpdates: recentPriceUpdates.map(update => ({
        itemId: update.item.id,
        itemName: update.item.name,
        category: update.item.category,
        minPrice: update.minPrice ? Number(update.minPrice) : null,
        avgPrice: update.avgPrice ? Number(update.avgPrice) : null,
        maxPrice: update.maxPrice ? Number(update.maxPrice) : null,
        updatedAt: update.searchDate,
        summary: update.summary
      }))
    })

  } catch (error) {
    console.error('Value summary API error:', error)
    return NextResponse.json(
      { error: '価値サマリーデータの取得に失敗しました' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureUserExists } from '@/lib/user-helper'
import { Decimal } from 'decimal.js'

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

    // 価格履歴データ取得（過去6ヶ月分）
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const priceHistories = await prisma.priceHistory.findMany({
      where: {
        item: {
          userId: dbUser.id
        },
        searchDate: {
          gte: sixMonthsAgo
        },
        isActive: true
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            category: true,
            purchasePrice: true
          }
        }
      },
      orderBy: {
        searchDate: 'asc'
      }
    })

    // アイテム別価格推移データの構築
    const itemTrends = priceHistories.reduce((acc, history) => {
      const itemId = history.itemId
      if (!acc[itemId]) {
        acc[itemId] = {
          itemId: history.item.id,
          itemName: history.item.name,
          category: history.item.category,
          purchasePrice: history.item.purchasePrice ? Number(history.item.purchasePrice) : null,
          priceData: []
        }
      }
      
      acc[itemId].priceData.push({
        date: history.searchDate.toISOString(),
        minPrice: history.minPrice ? Number(history.minPrice) : null,
        avgPrice: history.avgPrice ? Number(history.avgPrice) : null,
        maxPrice: history.maxPrice ? Number(history.maxPrice) : null,
        listingCount: history.listingCount
      })
      
      return acc
    }, {} as Record<string, any>)

    // カテゴリ別価格分布
    const categoryStats = await prisma.item.findMany({
      where: {
        userId: dbUser.id,
        priceHistory: {
          some: {
            isActive: true
          }
        }
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

    const categoryDistribution = categoryStats.reduce((acc, item) => {
      const category = item.category || '未分類'
      const latestPrice = item.priceHistory[0]?.avgPrice
      
      if (!acc[category]) {
        acc[category] = {
          category,
          itemCount: 0,
          totalValue: 0,
          items: []
        }
      }
      
      acc[category].itemCount++
      if (latestPrice) {
        acc[category].totalValue += Number(latestPrice)
        acc[category].items.push({
          id: item.id,
          name: item.name,
          currentPrice: Number(latestPrice),
          purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null
        })
      }
      
      return acc
    }, {} as Record<string, any>)

    // 価格トレンド（上昇・下降）
    const trendItems = Object.values(itemTrends).map((item: any) => {
      if (item.priceData.length < 2) return null
      
      const firstPrice = item.priceData[0].avgPrice
      const lastPrice = item.priceData[item.priceData.length - 1].avgPrice
      
      if (!firstPrice || !lastPrice) return null
      
      const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100
      
      return {
        itemId: item.itemId,
        itemName: item.itemName,
        category: item.category,
        firstPrice,
        lastPrice,
        changePercent,
        trend: changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable'
      }
    }).filter(Boolean)

    return NextResponse.json({
      itemTrends: Object.values(itemTrends),
      categoryDistribution: Object.values(categoryDistribution),
      trendItems: trendItems.sort((a, b) => Math.abs(b?.changePercent || 0) - Math.abs(a?.changePercent || 0)),
      summary: {
        totalItemsWithPriceData: Object.keys(itemTrends).length,
        totalCategories: Object.keys(categoryDistribution).length,
        upwardTrends: trendItems.filter(item => item?.trend === 'up').length,
        downwardTrends: trendItems.filter(item => item?.trend === 'down').length
      }
    })

  } catch (error) {
    console.error('Price trends API error:', error)
    return NextResponse.json(
      { error: '価格推移データの取得に失敗しました' },
      { status: 500 }
    )
  }
}
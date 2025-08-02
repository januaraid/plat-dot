import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureUserExists } from '@/lib/user-helper'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('Dashboard stats API called')
    
    const session = await auth()
    console.log('Session:', session ? 'exists' : 'null', session?.user?.email)
    
    if (!session?.user?.email) {
      console.log('No session or email, returning 401')
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    console.log('Ensuring user exists for:', session.user.email)
    // ユーザーの存在確認と作成
    const dbUser = await ensureUserExists({
      id: session.user.id || '',
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    })
    console.log('DB User created/found:', dbUser.id)
    
    console.log('Starting database queries...')
    // アイテム統計を取得
    const [itemCount, categoryStats, folderCount, recentItems, recentUpdatedItems, folderStats] = await Promise.all([
      // 総アイテム数
      prisma.item.count({
        where: { userId: dbUser.id }
      }),
      
      // カテゴリ別統計
      prisma.item.groupBy({
        by: ['category'],
        where: { 
          userId: dbUser.id,
          category: { not: null }
        },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } }
      }),
      
      // フォルダ数
      prisma.folder.count({
        where: { userId: dbUser.id }
      }),
      
      // 最近追加したアイテム（5件）
      prisma.item.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          folder: {
            select: { name: true }
          },
          images: {
            select: { filename: true },
            take: 1,
            orderBy: { order: 'asc' }
          }
        }
      }),
      
      // 最近更新したアイテム（5件）
      prisma.item.findMany({
        where: { 
          userId: dbUser.id,
          updatedAt: { not: { equals: prisma.item.fields.createdAt } }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          folder: {
            select: { name: true }
          },
          images: {
            select: { filename: true },
            take: 1,
            orderBy: { order: 'asc' }
          }
        }
      }),
      
      // フォルダ階層別統計
      prisma.$queryRaw<{depth: number, count: bigint}[]>`
        WITH RECURSIVE folder_depth AS (
          SELECT id, name, parentId, 1 as depth, userId
          FROM folders
          WHERE parentId IS NULL AND userId = ${dbUser.id}
          
          UNION ALL
          
          SELECT f.id, f.name, f.parentId, fd.depth + 1, f.userId
          FROM folders f
          INNER JOIN folder_depth fd ON f.parentId = fd.id
          WHERE f.userId = ${dbUser.id}
        )
        SELECT depth, COUNT(*) as count
        FROM folder_depth
        GROUP BY depth
        ORDER BY depth
      `
    ])
    console.log('Database queries completed')

    console.log('Getting uncategorized count...')
    // 未分類アイテム数を取得
    const uncategorizedCount = await prisma.item.count({
      where: { 
        userId: dbUser.id,
        folderId: null
      }
    })
    console.log('Uncategorized count:', uncategorizedCount)

    console.log('Processing folder stats...')
    // フォルダ階層統計の型変換（BigIntをNumberに変換）
    const processedFolderStats = folderStats.map(stat => ({
      depth: Number(stat.depth),
      count: Number(stat.count)
    }))
    console.log('Processed folder stats:', processedFolderStats)

    const response = {
      itemStats: {
        total: itemCount,
        uncategorized: uncategorizedCount,
        categories: categoryStats.map(stat => ({
          category: stat.category || '未分類',
          count: stat._count.category
        }))
      },
      folderStats: {
        total: folderCount,
        byDepth: processedFolderStats
      },
      recentItems: recentItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        folderName: item.folder?.name,
        createdAt: item.createdAt,
        image: item.images[0]?.filename
      })),
      recentUpdatedItems: recentUpdatedItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        folderName: item.folder?.name,
        updatedAt: item.updatedAt,
        image: item.images[0]?.filename
      }))
    }

    console.log('Returning response successfully')
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Dashboard stats error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: '統計情報の取得に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
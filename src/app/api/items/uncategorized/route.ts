import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  validationErrorResponse, 
  ErrorResponses,
  handleDatabaseError
} from '@/lib/validations'
import { ZodError } from 'zod'
import { ensureUserExists } from '@/lib/user-helper'
import { z } from 'zod'

export const runtime = 'nodejs'

/**
 * 未分類アイテム一覧取得時のバリデーションスキーマ
 */
const getUncategorizedItemsSchema = z.object({
  // ページネーション
  page: z.union([
    z.string().regex(/^\d+$/, '有効なページ番号を指定してください').transform(Number),
    z.number().int('ページ番号は整数で指定してください')
  ])
  .refine(val => val >= 1, 'ページ番号は1以上で指定してください')
  .refine(val => val <= 10000, 'ページ番号は10000以下で指定してください')
  .optional()
  .default(1),
  
  limit: z.union([
    z.string().regex(/^\d+$/, '有効な表示件数を指定してください').transform(Number),
    z.number().int('表示件数は整数で指定してください')
  ])
  .refine(val => val >= 1, '表示件数は1以上で指定してください')
  .refine(val => val <= 100, '表示件数は100以下で指定してください')
  .optional()
  .default(20),

  // ソート
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'category', 'purchasePrice'])
    .optional()
    .default('updatedAt'),
  
  sortOrder: z.enum(['asc', 'desc'])
    .optional()
    .default('desc'),

  // 検索
  q: z.string()
    .transform(val => val?.trim())
    .refine(val => !val || val.length <= 100, '検索キーワードは100文字以内で入力してください')
    .refine(val => !val || val.length >= 1, '検索キーワードは1文字以上で入力してください')
    .optional(),
  
  category: z.string()
    .transform(val => val?.trim())
    .refine(val => !val || val.length <= 50, 'カテゴリーは50文字以内で入力してください')
    .optional(),

  // 統計情報を含めるかどうか
  includeStats: z.union([
    z.string().transform(val => val === 'true'),
    z.boolean()
  ])
  .optional()
  .default(false),
})

/**
 * GET /api/items/uncategorized - 未分類アイテム一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session?.user?.email) {
      return ErrorResponses.unauthorized()
    }

    // ユーザーをデータベースに確実に存在させる
    const dbUser = await ensureUserExists({
      id: session.user.id || '',
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    })

    // クエリパラメータのバリデーション
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const params = getUncategorizedItemsSchema.parse(searchParams)

    // 未分類アイテム（folderId が null）の検索条件を構築
    const where: any = {
      userId: dbUser.id,
      folderId: null, // 未分類アイテムはfolderId が null
    }

    // 検索条件の追加（SQLite対応 - 大文字小文字区別なし）
    if (params.q) {
      const searchTerm = params.q.toLowerCase()
      where.OR = [
        { 
          name: { 
            contains: searchTerm 
          } 
        },
        { 
          description: { 
            contains: searchTerm 
          } 
        },
        { 
          category: { 
            contains: searchTerm 
          } 
        },
      ]
    }

    if (params.category) {
      where.category = {
        contains: params.category.toLowerCase()
      }
    }

    // ソート設定
    const orderBy: any = {}
    if (params.sortBy === 'purchasePrice') {
      orderBy.purchasePrice = params.sortOrder
    } else {
      orderBy[params.sortBy] = params.sortOrder
    }

    // ページネーション計算
    const skip = (params.page - 1) * params.limit

    // アイテム取得（ページネーション付き）
    const [items, totalCount] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy,
        skip,
        take: params.limit,
      }),
      prisma.item.count({ where }),
    ])

    // 統計情報の取得（オプション）
    let stats = null
    if (params.includeStats) {
      const [categoryStats, totalUncategorized] = await Promise.all([
        // カテゴリ別統計
        prisma.item.groupBy({
          by: ['category'],
          where: {
            userId: dbUser.id,
            folderId: null,
          },
          _count: {
            category: true,
          },
          orderBy: {
            _count: {
              category: 'desc',
            },
          },
          take: 10, // 上位10カテゴリ
        }),
        // 未分類アイテム総数
        prisma.item.count({
          where: {
            userId: dbUser.id,
            folderId: null,
          },
        }),
      ])

      stats = {
        totalUncategorized,
        categoryDistribution: categoryStats.map(stat => ({
          category: stat.category || '(カテゴリなし)',
          count: stat._count.category,
        })),
      }
    }

    // ページネーション情報の計算
    const totalPages = Math.ceil(totalCount / params.limit)
    const hasNext = params.page < totalPages
    const hasPrev = params.page > 1

    return NextResponse.json({
      items,
      stats,
      pagination: {
        currentPage: params.page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: params.limit,
        hasNext,
        hasPrev,
      },
      queryParams: {
        q: params.q,
        category: params.category,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        includeStats: params.includeStats,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error, '未分類アイテム一覧取得のパラメータに誤りがあります')
    }
    
    // データベースエラーの場合
    if (error && typeof error === 'object' && 'code' in error) {
      return handleDatabaseError(error)
    }
    
    console.error('GET /api/items/uncategorized error:', error)
    return ErrorResponses.internalError('未分類アイテム一覧の取得に失敗しました')
  }
}
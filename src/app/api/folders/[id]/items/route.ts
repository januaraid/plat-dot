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
 * フォルダ内アイテム一覧取得時のバリデーションスキーマ
 */
const getFolderItemsSchema = z.object({
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
})

/**
 * フォルダIDパラメータのバリデーション
 */
const folderIdParamSchema = z.object({
  id: z.string()
    .min(1, 'フォルダIDは必須です')
    .refine(val => {
      // UUIDまたはcuid形式のIDを許可
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      const cuidRegex = /^c[a-z0-9]{24,}$/i
      return uuidRegex.test(val) || cuidRegex.test(val)
    }, '有効なフォルダIDを指定してください'),
})

/**
 * GET /api/folders/[id]/items - フォルダ内アイテム一覧取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // フォルダIDのバリデーション
    const resolvedParams = await params
    const { id: folderId } = folderIdParamSchema.parse(resolvedParams)

    // クエリパラメータのバリデーション
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const queryParams = getFolderItemsSchema.parse(searchParams)

    // フォルダの存在と所有権をチェック
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: dbUser.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        parentId: true,
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!folder) {
      return ErrorResponses.notFound('指定されたフォルダが見つかりません')
    }

    // アイテム検索条件の構築
    const where: any = {
      userId: dbUser.id,
      folderId: folderId,
    }

    // 検索条件の追加（SQLite対応 - 大文字小文字区別なし）
    if (queryParams.q) {
      const searchTerm = queryParams.q.toLowerCase()
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

    if (queryParams.category) {
      where.category = {
        contains: queryParams.category.toLowerCase()
      }
    }

    // ソート設定
    const orderBy: any = {}
    if (queryParams.sortBy === 'purchasePrice') {
      orderBy.purchasePrice = queryParams.sortOrder
    } else {
      orderBy[queryParams.sortBy] = queryParams.sortOrder
    }

    // ページネーション計算
    const skip = (queryParams.page - 1) * queryParams.limit

    // アイテム取得（ページネーション付き）
    const [items, totalCount] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          folder: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy,
        skip,
        take: queryParams.limit,
      }),
      prisma.item.count({ where }),
    ])

    // ページネーション情報の計算
    const totalPages = Math.ceil(totalCount / queryParams.limit)
    const hasNext = queryParams.page < totalPages
    const hasPrev = queryParams.page > 1

    return NextResponse.json({
      folder,
      items,
      pagination: {
        currentPage: queryParams.page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: queryParams.limit,
        hasNext,
        hasPrev,
      },
      queryParams: {
        q: queryParams.q,
        category: queryParams.category,
        sortBy: queryParams.sortBy,
        sortOrder: queryParams.sortOrder,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error, 'フォルダ内アイテム一覧取得のパラメータに誤りがあります')
    }
    
    // データベースエラーの場合
    if (error && typeof error === 'object' && 'code' in error) {
      return handleDatabaseError(error)
    }
    
    console.error('GET /api/folders/[id]/items error:', error)
    return ErrorResponses.internalError('フォルダ内アイテム一覧の取得に失敗しました')
  }
}
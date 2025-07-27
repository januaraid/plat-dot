import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createItemSchema, searchItemsSchema, validationErrorResponse, errorResponse } from '@/lib/validations'
import { ZodError } from 'zod'
import { Decimal } from 'decimal.js'
import { ensureUserExists } from '@/lib/user-helper'

export const runtime = 'nodejs'

/**
 * GET /api/items - アイテム一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session?.user?.email) {
      return errorResponse('Unauthorized', 401)
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
    const params = searchItemsSchema.parse(searchParams)

    // Prismaクエリの構築
    const where: any = {
      userId: dbUser.id,
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
      where.category = params.category
    }

    if (params.folderId) {
      where.folderId = params.folderId
    }

    // ページネーション計算
    const skip = (params.page - 1) * params.limit

    // データ取得
    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: {
          [params.sort]: params.order,
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
            orderBy: {
              order: 'asc',
            },
          },
        },
      }),
      prisma.item.count({ where }),
    ])

    // レスポンスの構築
    const response = {
      items,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error)
    }
    
    console.error('GET /api/items error:', error)
    return errorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/items - アイテム新規作成
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session?.user?.email) {
      return errorResponse('Unauthorized', 401)
    }

    // ユーザーをデータベースに確実に存在させる
    const dbUser = await ensureUserExists({
      id: session.user.id || '',
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    })

    // リクエストボディのバリデーション
    const body = await request.json()
    const data = createItemSchema.parse(body)

    // フォルダの存在確認（指定されている場合）
    if (data.folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: data.folderId,
          userId: dbUser.id,
        },
      })

      if (!folder) {
        return errorResponse('Folder not found', 404)
      }
    }

    // Decimal型のフィールドを変換
    const itemData: any = {
      ...data,
      userId: dbUser.id,
    }
    
    // purchasePriceをDecimalに変換
    if (data.purchasePrice !== undefined) {
      itemData.purchasePrice = new Decimal(data.purchasePrice)
    }

    // アイテム作成
    const item = await prisma.item.create({
      data: itemData,
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

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error)
    }
    
    console.error('POST /api/items error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error', 
      500
    )
  }
}
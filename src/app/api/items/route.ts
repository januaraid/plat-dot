import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  createItemSchema, 
  searchItemsSchema, 
  validationErrorResponse, 
  ErrorResponses,
  handleDatabaseError
} from '@/lib/validations'
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
        { 
          manufacturer: { 
            contains: searchTerm 
          } 
        },
      ]
    }

    if (params.category) {
      where.category = params.category
    }

    if (params.manufacturer) {
      where.manufacturer = params.manufacturer
    }

    if (params.folderId) {
      where.folderId = params.folderId
    }

    // ページネーション計算
    const skip = (params.page - 1) * params.limit

    // データ取得
    const [items, total, categories, folders, manufacturers] = await Promise.all([
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
      // カテゴリ一覧を取得（ユニークな値のみ）
      prisma.item.findMany({
        where: { userId: dbUser.id },
        select: { category: true },
        distinct: ['category'],
      }).then(results => 
        results
          .map(item => item.category)
          .filter(category => category && category.trim() !== '')
          .sort()
      ),
      // フォルダ一覧を取得（階層構造を考慮したソート）
      prisma.folder.findMany({
        where: { userId: dbUser.id },
        select: {
          id: true,
          name: true,
          parentId: true,
        },
        orderBy: [
          { parentId: 'asc' }, // 親フォルダが先
          { name: 'asc' },     // 同レベルでは名前順
        ],
      }).then(folders => {
        // 階層構造でソートするヘルパー関数
        const sortFoldersHierarchically = (folders: any[]) => {
          const folderMap = new Map(folders.map(f => [f.id, f]))
          const result: any[] = []
          
          // ルートフォルダ（parentId が null）から開始
          const addFolderAndChildren = (folderId: string | null, level = 0) => {
            folders
              .filter(f => f.parentId === folderId)
              .sort((a, b) => a.name.localeCompare(b.name))
              .forEach(folder => {
                result.push({
                  id: folder.id,
                  name: folder.name,
                  displayName: '　'.repeat(level) + folder.name, // インデント表示用
                })
                addFolderAndChildren(folder.id, level + 1)
              })
          }
          
          addFolderAndChildren(null)
          return result
        }
        
        return sortFoldersHierarchically(folders)
      }),
      // メーカー一覧を取得（ユニークな値のみ）
      prisma.item.findMany({
        where: { userId: dbUser.id },
        select: { manufacturer: true },
        distinct: ['manufacturer'],
      }).then(results => 
        results
          .map(item => item.manufacturer)
          .filter(manufacturer => manufacturer && manufacturer.trim() !== '')
          .sort()
      ),
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
      categories,
      manufacturers,
      folders,
    }


    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error, 'アイテム検索のパラメータに誤りがあります')
    }
    
    // データベースエラーの場合
    if (error && typeof error === 'object' && 'code' in error) {
      return handleDatabaseError(error)
    }
    
    console.error('GET /api/items error:', error)
    return ErrorResponses.internalError('アイテムの取得に失敗しました')
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
      return ErrorResponses.unauthorized()
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
        return ErrorResponses.notFound('フォルダ')
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
      return validationErrorResponse(error, 'アイテムの作成データに誤りがあります')
    }
    
    // データベースエラーの場合
    if (error && typeof error === 'object' && 'code' in error) {
      return handleDatabaseError(error)
    }
    
    console.error('POST /api/items error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    return ErrorResponses.internalError('アイテムの作成に失敗しました')
  }
}
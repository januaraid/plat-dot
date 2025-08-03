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
 * フォルダツリー取得時のバリデーションスキーマ
 */
const getFolderTreeSchema = z.object({
  includeItemCount: z.union([
    z.string().transform(val => val === 'true'),
    z.boolean()
  ])
  .optional()
  .default(false),
  
  maxDepth: z.union([
    z.string().transform(val => parseInt(val, 10)),
    z.number()
  ])
  .refine(val => val >= 1 && val <= 3, '階層の深さは1-3の範囲で指定してください')
  .optional()
  .default(3),
})

/**
 * GET /api/folders/tree - フォルダ階層ツリー取得
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
    const params = getFolderTreeSchema.parse(searchParams)

    // 階層ツリーを再帰的に構築
    const buildFolderTree = async (parentId: string | null, currentDepth: number): Promise<any[]> => {
      if (currentDepth > params.maxDepth) {
        return []
      }

      const folders = await prisma.folder.findMany({
        where: {
          userId: dbUser.id,
          parentId: parentId,
        },
        select: {
          id: true,
          name: true,
          description: true,
          parentId: true,
          createdAt: true,
          updatedAt: true,
          _count: params.includeItemCount ? {
            select: {
              items: true,
              children: true,
            },
          } : undefined,
        },
        orderBy: {
          name: 'asc',
        },
      })

      const foldersWithChildren = await Promise.all(
        folders.map(async (folder) => {
          const children = await buildFolderTree(folder.id, currentDepth + 1)
          return {
            ...folder,
            children,
            depth: currentDepth,
            hasChildren: children.length > 0,
          }
        })
      )

      return foldersWithChildren
    }

    // ルートレベルから開始してツリーを構築
    const tree = await buildFolderTree(null, 1)

    // フォルダパス解決機能（任意のフォルダのパスを取得）
    const resolveFolderPath = async (folderId: string): Promise<string[]> => {
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId: dbUser.id,
        },
        select: {
          id: true,
          name: true,
          parentId: true,
        },
      })

      if (!folder) {
        return []
      }

      if (!folder.parentId) {
        return [folder.name]
      }

      const parentPath = await resolveFolderPath(folder.parentId)
      return [...parentPath, folder.name]
    }

    // 統計情報を計算
    const totalFolders = await prisma.folder.count({
      where: { userId: dbUser.id },
    })

    const depthStats = await prisma.$queryRaw<Array<{depth: bigint, count: bigint}>>`
      WITH RECURSIVE folder_depths AS (
        -- Base case: root folders (depth 1)
        SELECT "id", "name", "parentId", 1 as depth, "userId"
        FROM "folders"
        WHERE "parentId" IS NULL AND "userId" = ${dbUser.id}
        
        UNION ALL
        
        -- Recursive case: child folders
        SELECT f."id", f."name", f."parentId", fd.depth + 1, f."userId"
        FROM "folders" f
        INNER JOIN folder_depths fd ON f."parentId" = fd."id"
        WHERE fd.depth < 3 AND f."userId" = ${dbUser.id}
      )
      SELECT depth, COUNT(*) as count
      FROM folder_depths
      GROUP BY depth
      ORDER BY depth
    `
    
    // BigIntをnumberに変換
    const normalizedDepthStats = depthStats.map(stat => ({
      depth: Number(stat.depth),
      count: Number(stat.count)
    }))

    const response = {
      tree,
      statistics: {
        totalFolders,
        depthDistribution: normalizedDepthStats,
        maxDepthAllowed: 3,
        currentMaxDepth: Math.max(...normalizedDepthStats.map(d => d.depth), 0),
      },
      metadata: {
        includeItemCount: params.includeItemCount,
        maxDepth: params.maxDepth,
        generatedAt: new Date().toISOString(),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error, 'フォルダツリー取得のパラメータに誤りがあります')
    }
    
    // データベースエラーの場合
    if (error && typeof error === 'object' && 'code' in error) {
      return handleDatabaseError(error)
    }
    
    console.error('GET /api/folders/tree error:', error)
    return ErrorResponses.internalError('フォルダツリーの取得に失敗しました')
  }
}
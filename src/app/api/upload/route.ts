import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  validationErrorResponse, 
  ErrorResponses,
  handleDatabaseError
} from '@/lib/validations'
import { 
  uploadImageSchema, 
  validateImageFile,
  fileValidationConfig 
} from '@/lib/validations/upload'
import { ZodError } from 'zod'
import { ensureUserExists } from '@/lib/user-helper'
import { put } from '@vercel/blob'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

/**
 * ファイル名を生成（タイムスタンプ + ランダム文字列）
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now()
  const random = randomBytes(8).toString('hex')
  const extension = originalName.toLowerCase().match(/\.[^.]+$/)?.[0] || '.jpg'
  return `${timestamp}-${random}${extension}`
}

/**
 * Vercel Blob用のファイルパスを生成
 */
function getBlobPath(fileName: string, itemId: string): string {
  return `items/${itemId}/${fileName}`
}

/**
 * POST /api/upload - 画像アップロード
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

    // フォームデータの取得
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const itemId = formData.get('itemId') as string | null
    const order = formData.get('order') as string | null

    if (!file) {
      return ErrorResponses.badRequest('ファイルが選択されていません', 'file')
    }

    // ファイルバリデーション
    const fileError = validateImageFile(file)
    if (fileError) {
      return ErrorResponses.badRequest(fileError, 'file')
    }

    // フォームデータのバリデーション
    const validatedData = uploadImageSchema.parse({
      itemId,
      order: order ? parseInt(order, 10) : undefined,
    })

    // アイテムの存在と所有権をチェック
    const item = await prisma.item.findFirst({
      where: {
        id: validatedData.itemId,
        userId: dbUser.id,
      },
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    })

    if (!item) {
      return ErrorResponses.notFound('指定されたアイテムが見つかりません', 'itemId')
    }

    // 画像数制限チェック（1アイテムあたり最大10枚）
    if (item._count.images >= 10) {
      return ErrorResponses.badRequest(
        'このアイテムには既に10枚の画像が登録されています。新しい画像を追加する前に既存の画像を削除してください',
        'itemId'
      )
    }

    // ファイル名の生成
    const fileName = generateFileName(file.name)
    const blobPath = getBlobPath(fileName, validatedData.itemId)

    // Vercel Blobにファイルをアップロード
    const blob = await put(blobPath, file, {
      access: 'public',
      contentType: file.type,
    })

    // データベースに画像情報を保存
    const savedImage = await prisma.itemImage.create({
      data: {
        itemId: validatedData.itemId,
        url: blob.url,
        filename: fileName,
        size: file.size,
        mimeType: file.type,
        order: validatedData.order || item._count.images,
      },
      select: {
        id: true,
        url: true,
        filename: true,
        size: true,
        mimeType: true,
        order: true,
        item: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: '画像をアップロードしました',
      image: {
        ...savedImage,
        // クライアント側の互換性のため、キャメルケースのプロパティも追加
        fileName: savedImage.filename,
        fileSize: savedImage.size,
      },
      blob: {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
        contentDisposition: blob.contentDisposition,
      },
      uploadDetails: {
        originalName: file.name,
        savedName: fileName,
        size: file.size,
        sizeFormatted: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type,
        itemName: savedImage.item.name,
        blobPath: blobPath,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error, '画像アップロードのデータに誤りがあります')
    }
    
    // Vercel Blobエラー
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('blob')) {
      console.error('Vercel Blob upload error:', error)
      return ErrorResponses.internalError('ファイルのアップロードに失敗しました')
    }
    
    // データベースエラーの場合
    if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' && error.code.startsWith('P')) {
      return handleDatabaseError(error)
    }
    
    console.error('POST /api/upload error:', error)
    return ErrorResponses.internalError('画像のアップロードに失敗しました')
  }
}

/**
 * GET /api/upload - アップロード設定情報取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session?.user?.email) {
      return ErrorResponses.unauthorized()
    }

    // アップロード設定情報を返す
    return NextResponse.json({
      config: {
        maxFileSize: fileValidationConfig.maxSize,
        maxFileSizeMB: fileValidationConfig.maxSize / 1024 / 1024,
        acceptedFormats: fileValidationConfig.acceptedFormats,
        acceptedExtensions: fileValidationConfig.acceptedExtensions,
        maxImagesPerItem: 10,
      },
      usage: {
        uploadEndpoint: '/api/upload',
        requiredFields: ['file', 'itemId'],
        optionalFields: ['order'],
      },
    })
  } catch (error) {
    console.error('GET /api/upload error:', error)
    return ErrorResponses.internalError('アップロード設定情報の取得に失敗しました')
  }
}
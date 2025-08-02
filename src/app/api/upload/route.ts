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
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomBytes } from 'crypto'
import { generateAllThumbnails, getImageInfo } from '@/lib/image-utils'

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
 * アップロードディレクトリのパスを取得
 */
function getUploadDir(): string {
  // プロジェクトルートからの相対パス
  return join(process.cwd(), 'uploads')
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

    // ファイルの内容を読み取る
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // ファイル名の生成
    const fileName = generateFileName(file.name)
    const uploadDir = getUploadDir()
    const filePath = join(uploadDir, fileName)

    // アップロードディレクトリが存在しない場合は作成
    await mkdir(uploadDir, { recursive: true })

    // ファイルを保存
    await writeFile(filePath, buffer)

    // 画像情報を取得
    let imageInfo
    try {
      imageInfo = await getImageInfo(filePath)
    } catch (error) {
      console.warn('Failed to get image info:', error)
      imageInfo = null
    }

    // サムネイル生成
    let thumbnails
    try {
      thumbnails = await generateAllThumbnails(filePath, fileName)
    } catch (error) {
      console.warn('Failed to generate thumbnails:', error)
      thumbnails = {
        small: fileName,
        medium: fileName,
        large: fileName,
      }
    }

    // データベースに画像情報を保存
    const savedImage = await prisma.itemImage.create({
      data: {
        itemId: validatedData.itemId,
        url: `/uploads/${fileName}`,
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
      thumbnails: {
        small: `/api/uploads/thumbnails/small/${thumbnails.small}`,
        medium: `/api/uploads/thumbnails/medium/${thumbnails.medium}`,
        large: `/api/uploads/thumbnails/large/${thumbnails.large}`,
      },
      imageInfo: imageInfo ? {
        width: imageInfo.width,
        height: imageInfo.height,
        format: imageInfo.format,
        hasAlpha: imageInfo.hasAlpha,
        aspectRatio: imageInfo.width && imageInfo.height ? 
          (imageInfo.width / imageInfo.height).toFixed(2) : null,
      } : null,
      uploadDetails: {
        originalName: file.name,
        savedName: fileName,
        size: file.size,
        sizeFormatted: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type,
        itemName: savedImage.item.name,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error, '画像アップロードのデータに誤りがあります')
    }
    
    // ファイルシステムエラー
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'EACCES') {
        console.error('Upload directory permission error:', error)
        return ErrorResponses.internalError('ファイルの保存に失敗しました（権限エラー）')
      }
      if (error.code === 'ENOSPC') {
        console.error('Disk space error:', error)
        return ErrorResponses.internalError('ファイルの保存に失敗しました（ディスク容量不足）')
      }
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
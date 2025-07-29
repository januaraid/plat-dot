import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const runtime = 'nodejs'

/**
 * コンテンツタイプを拡張子から判定
 */
function getContentType(fileName: string): string {
  const extension = fileName.toLowerCase().match(/\.[^.]+$/)?.[0]
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    default:
      return 'application/octet-stream'
  }
}

/**
 * GET /api/uploads/[...path] - アップロードされた画像を提供
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const pathSegments = resolvedParams.path
    
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Not Found', { status: 404 })
    }

    // パスを結合（uploads/以降のパス）
    const fileName = pathSegments.join('/')
    
    // セキュリティチェック：パストラバーサル攻撃の防御
    if (fileName.includes('..') || fileName.includes('~')) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // ファイルパスの構築
    const uploadDir = join(process.cwd(), 'uploads')
    const filePath = join(uploadDir, fileName)

    // ファイルの存在確認
    if (!existsSync(filePath)) {
      return new NextResponse('Not Found', { status: 404 })
    }

    // ファイルを読み込む
    const fileBuffer = await readFile(filePath)
    
    // レスポンスヘッダーの設定
    const headers = new Headers()
    headers.set('Content-Type', getContentType(fileName))
    headers.set('Content-Length', fileBuffer.length.toString())
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    
    // ファイルを返す
    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('GET /api/uploads/[...path] error:', error)
    
    // ファイルシステムエラーの処理
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'ENOENT') {
        return new NextResponse('Not Found', { status: 404 })
      }
      if (error.code === 'EACCES') {
        return new NextResponse('Forbidden', { status: 403 })
      }
    }
    
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
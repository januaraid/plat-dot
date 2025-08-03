import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { put } from '@vercel/blob'

/**
 * サムネイルサイズの設定
 */
export const THUMBNAIL_SIZES = {
  small: { width: 150, height: 150 },
  medium: { width: 300, height: 300 },
  large: { width: 600, height: 600 },
} as const

export type ThumbnailSize = keyof typeof THUMBNAIL_SIZES

/**
 * サムネイルのディレクトリパスを取得
 */
export function getThumbnailDir(size: ThumbnailSize): string {
  return join(process.cwd(), 'uploads', 'thumbnails', size)
}

/**
 * サムネイルのファイル名を生成
 * オリジナルファイル名と同じ名前でサムネイルを生成
 */
export function getThumbnailFileName(originalFileName: string, size: ThumbnailSize): string {
  // サムネイルはサイズ別のディレクトリに分けるので、ファイル名は元と同じにする
  return originalFileName
}

/**
 * サムネイル画像を生成
 */
export async function generateThumbnail(
  inputPath: string,
  originalFileName: string,
  size: ThumbnailSize = 'medium'
): Promise<string> {
  try {
    const thumbnailDir = getThumbnailDir(size)
    const thumbnailFileName = getThumbnailFileName(originalFileName, size)
    const thumbnailPath = join(thumbnailDir, thumbnailFileName)

    // サムネイルディレクトリが存在しない場合は作成
    await mkdir(thumbnailDir, { recursive: true })

    // 既にサムネイルが存在する場合はスキップ
    if (existsSync(thumbnailPath)) {
      return thumbnailFileName
    }

    const { width, height } = THUMBNAIL_SIZES[size]

    // Sharpを使用してサムネイル生成
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'cover', // アスペクト比を保持してクロップ
        position: 'center',
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toFile(thumbnailPath)

    return thumbnailFileName
  } catch (error) {
    console.error('Failed to generate thumbnail:', error)
    throw new Error('サムネイルの生成に失敗しました')
  }
}

/**
 * 複数サイズのサムネイルを一括生成
 */
export async function generateAllThumbnails(
  inputPath: string,
  originalFileName: string
): Promise<Record<ThumbnailSize, string>> {
  const thumbnails = {} as Record<ThumbnailSize, string>

  // 並行してサムネイル生成
  const results = await Promise.allSettled([
    generateThumbnail(inputPath, originalFileName, 'small'),
    generateThumbnail(inputPath, originalFileName, 'medium'),
    generateThumbnail(inputPath, originalFileName, 'large'),
  ])

  const sizes: ThumbnailSize[] = ['small', 'medium', 'large']

  results.forEach((result, index) => {
    const size = sizes[index]
    if (result.status === 'fulfilled') {
      thumbnails[size] = result.value
    } else {
      console.error(`Failed to generate ${size} thumbnail:`, result.reason)
      // 失敗した場合は元ファイル名を使用
      thumbnails[size] = originalFileName
    }
  })

  return thumbnails
}

/**
 * 画像の最適化（品質調整、EXIF削除）
 */
export async function optimizeImage(
  inputPath: string,
  outputPath: string,
  quality: number = 85
): Promise<void> {
  try {
    await sharp(inputPath)
      .jpeg({
        quality,
        progressive: true,
      })
      .withMetadata({}) // EXIF削除
      .toFile(outputPath)
  } catch (error) {
    console.error('Failed to optimize image:', error)
    throw new Error('画像の最適化に失敗しました')
  }
}

/**
 * 画像の情報を取得（Buffer版）
 */
export async function getImageInfo(buffer: Buffer) {
  try {
    const metadata = await sharp(buffer).metadata()
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
    }
  } catch (error) {
    console.error('Failed to get image info:', error)
    throw new Error('画像情報の取得に失敗しました')
  }
}

/**
 * 画像の情報を取得（ファイルパス版）
 */
export async function getImageInfoFromFile(filePath: string) {
  try {
    const metadata = await sharp(filePath).metadata()
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
    }
  } catch (error) {
    console.error('Failed to get image info:', error)
    throw new Error('画像情報の取得に失敗しました')
  }
}

/**
 * Vercel Blob用サムネイル生成
 */
export async function generateBlobThumbnails(
  buffer: Buffer,
  originalFileName: string,
  itemId: string
): Promise<Record<ThumbnailSize, string>> {
  const thumbnails = {} as Record<ThumbnailSize, string>
  const sizes: ThumbnailSize[] = ['small', 'medium', 'large']

  try {
    // 並行してサムネイル生成
    const results = await Promise.allSettled(
      sizes.map(async (size) => {
        const { width, height } = THUMBNAIL_SIZES[size]
        
        // サムネイル画像を生成
        const thumbnailBuffer = await sharp(buffer)
          .resize(width, height, {
            fit: 'cover',
            position: 'center',
          })
          .jpeg({
            quality: 85,
            progressive: true,
          })
          .toBuffer()

        // Vercel Blobにアップロード
        const thumbnailPath = `items/${itemId}/thumbnails/${size}/${originalFileName}`
        const blob = await put(thumbnailPath, thumbnailBuffer, {
          access: 'public',
          contentType: 'image/jpeg',
        })

        return blob.url
      })
    )

    results.forEach((result, index) => {
      const size = sizes[index]
      if (result.status === 'fulfilled') {
        thumbnails[size] = result.value
      } else {
        console.error(`Failed to generate ${size} thumbnail:`, result.reason)
        // 失敗した場合は空文字（後でフォールバック処理）
        thumbnails[size] = ''
      }
    })

    return thumbnails
  } catch (error) {
    console.error('Failed to generate blob thumbnails:', error)
    throw new Error('サムネイルの生成に失敗しました')
  }
}
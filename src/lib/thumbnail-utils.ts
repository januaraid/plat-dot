/**
 * サムネイルサイズの定義
 */
export type ThumbnailSize = 'small' | 'medium' | 'large'

/**
 * Vercel BlobのURLからサムネイルURLを生成
 */
export function generateThumbnailUrl(
  originalUrl: string,
  size: ThumbnailSize,
  itemId?: string
): string {
  // Vercel BlobのURLでない場合は元のURLをそのまま返す
  if (!originalUrl.includes('blob.vercel-storage.com')) {
    return originalUrl
  }

  try {
    const url = new URL(originalUrl)
    const pathParts = url.pathname.split('/')
    
    // パスからファイル名を取得
    const fileName = pathParts[pathParts.length - 1]
    
    if (!fileName || !itemId) {
      return originalUrl
    }

    // サムネイルパスを構築
    const thumbnailPath = `/items/${itemId}/thumbnails/${size}/${fileName}`
    
    // 新しいURLを構築
    return `${url.protocol}//${url.host}${thumbnailPath}`
  } catch (error) {
    console.warn('Failed to generate thumbnail URL:', error)
    return originalUrl
  }
}

/**
 * 画像オブジェクトからサムネイルURLを取得
 */
export function getThumbnailUrl(
  image: { url: string; thumbnailSmall?: string; thumbnailMedium?: string; thumbnailLarge?: string },
  size: ThumbnailSize,
  itemId?: string
): string {
  // データベースにサムネイルURLが保存されている場合は優先して使用
  if (size === 'small' && image.thumbnailSmall) {
    return image.thumbnailSmall
  }
  if (size === 'medium' && image.thumbnailMedium) {
    return image.thumbnailMedium
  }
  if (size === 'large' && image.thumbnailLarge) {
    return image.thumbnailLarge
  }

  // サムネイルURLが保存されていない場合は元画像を使用（一時的な対応）
  console.log('No thumbnail URL found, using original image:', image.url)
  return image.url
  
  // TODO: サムネイルURLが保存されていない場合は動的に生成
  // return generateThumbnailUrl(image.url, size, itemId)
}

/**
 * ItemCardなどで使用するためのサムネイルURLのヘルパー関数
 */
export function getImageThumbnailUrls(
  image: { url: string; thumbnailSmall?: string; thumbnailMedium?: string; thumbnailLarge?: string },
  itemId: string
) {
  return {
    small: getThumbnailUrl(image, 'small', itemId),
    medium: getThumbnailUrl(image, 'medium', itemId),
    large: getThumbnailUrl(image, 'large', itemId),
  }
}
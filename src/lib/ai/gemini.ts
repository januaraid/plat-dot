import { GoogleGenAI } from '@google/genai'
import { prisma } from '@/lib/db'

/**
 * Google Generative AI クライアントを取得する
 */
function getAIClient() {
  return new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY!,
    fetch: fetch
  })
}

/**
 * 画像認識結果のインターフェース
 */
interface RecognitionResult {
  suggestions: string[]
  category?: string
  manufacturer?: string
  description?: string
}

/**
 * 画像からアイテム情報を認識する
 * @param imageBase64 Base64エンコードされた画像データ
 * @returns 商品名候補、カテゴリ、メーカー情報
 */
export async function recognizeItemFromImage(imageBase64: string): Promise<RecognitionResult> {
  try {
    const ai = getAIClient()
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [
      `この画像に写っている商品を分析してください。必ず以下のJSON形式のみで回答してください。他の説明文は不要です。

\`\`\`json
{
  "suggestions": ["商品名候補1", "商品名候補2", "商品名候補3"],
  "category": "カテゴリ名",
  "manufacturer": "メーカー名",
  "description": "商品の詳細な説明文"
}
\`\`\`

ルール：
1. suggestionsは必ず配列で3つの商品名候補を提供
2. categoryは家電、文房具、生活用品、キッチン用品、玩具、本・雑誌、衣類、スポーツ用品などの一般的な日本語カテゴリ
3. manufacturerはメーカー名が分からない場合はnull
4. descriptionは商品の特徴、用途、材質、サイズ感などを含む詳細な説明文（100-200文字程度）
5. 必ずJSONコードブロック（\`\`\`json〜\`\`\`）で囲む
6. JSON以外の説明文は絶対に含めない`,
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg'
          }
        }
      ]
    })
    
    const text = response.text.trim()
    if (!text) {
      throw new Error('AI応答が空です')
    }

    
    try {
      // JSONコードブロック内のJSONを抽出（```json...```の場合）
      let jsonText = text
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
      if (jsonMatch) {
        jsonText = jsonMatch[1]
      }
      
      const parsed = JSON.parse(jsonText)
      
      return {
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.filter(s => s && s.trim()) : [text.split('\n')[0] || '不明な商品'],
        category: parsed.category && parsed.category !== 'null' ? parsed.category : undefined,
        manufacturer: parsed.manufacturer && parsed.manufacturer !== 'null' ? parsed.manufacturer : undefined,
        description: parsed.description && parsed.description !== 'null' ? parsed.description : undefined
      }
    } catch (parseError) {
      // JSON解析に失敗した場合のフォールバック
      
      // シンプルなテキスト解析でフォールバック
      const lines = text.split('\n').filter(line => line.trim() && !line.includes('{') && !line.includes('}'))
      const filteredLines = lines.filter(line => 
        !line.startsWith('suggestions') && 
        !line.startsWith('category') && 
        !line.startsWith('manufacturer') &&
        line.length > 2
      )
      
      return {
        suggestions: filteredLines.slice(0, 3).length > 0 ? filteredLines.slice(0, 3) : ['認識できませんでした'],
        category: undefined,
        manufacturer: undefined,
        description: undefined
      }
    }
  } catch (error) {
    console.error('AI認識エラー:', error)
    throw new Error('AI認識に失敗しました')
  }
}

/**
 * レート制限チェック（15 RPM制限）
 */
const rateLimitCache = new Map<string, number[]>()

/**
 * レート制限キャッシュをクリア
 */
export function clearRateLimit(userId: string): void {
  rateLimitCache.delete(userId)
}

/**
 * ユーザーの現在のリクエスト数を取得
 */
export function getCurrentRequests(userId: string): number {
  const now = Date.now()
  const windowStart = now - 60 * 1000 // 1分前
  
  const userRequests = rateLimitCache.get(userId) || []
  const recentRequests = userRequests.filter(timestamp => timestamp > windowStart)
  
  return recentRequests.length
}

export function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const windowStart = now - 60 * 1000 // 1分前
  
  const userRequests = rateLimitCache.get(userId) || []
  const recentRequests = userRequests.filter(timestamp => timestamp > windowStart)
  
  if (recentRequests.length >= 15) {
    return false // レート制限に引っかかった
  }
  
  recentRequests.push(now)
  rateLimitCache.set(userId, recentRequests)
  
  return true
}

/**
 * 商品の価格情報を検索する（Google検索グラウンディング使用）
 * @param itemName 商品名
 * @param manufacturer メーカー名（オプション）
 * @returns 価格情報と販売サイト情報
 */
export async function searchItemPrices(itemName: string, manufacturer?: string): Promise<{
  prices: Array<{
    price: string
    site: string
    url: string
    condition: string
  }>
  summary: string
}> {
  try {
    const searchQuery = manufacturer 
      ? `${manufacturer} ${itemName} 価格 中古 フリマ メルカリ ヤフオク`
      : `${itemName} 価格 中古 フリマ メルカリ ヤフオク`

    const ai = getAIClient()
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [
        `以下の商品の価格情報を検索して、日本のフリマサイトやオークションサイトでの相場を調べてください：

商品名: ${itemName}
${manufacturer ? `メーカー: ${manufacturer}` : ''}

以下の形式でJSONで返してください：
{
  "prices": [
    {
      "price": "価格（例：¥1,500）",
      "site": "サイト名（例：メルカリ、ヤフオク）",
      "url": "商品ページURL",
      "condition": "商品状態（例：中古、新品）"
    }
  ],
  "summary": "価格相場の概要（例：中古品で1,000円〜3,000円程度が相場です）"
}

注意事項：
- 実際の検索結果から最新の価格情報を取得してください
- 複数のサイト（メルカリ、ヤフオク、ラクマなど）の情報を含めてください
- 価格は日本円で表示してください
- 必ずJSON形式で回答してください`
      ],
      config: {
        tools: [{
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: 'MODE_DYNAMIC',
              dynamicThreshold: 0.7
            }
          }
        }]
      }
    })
    
    const text = response.text.trim()
    if (!text) {
      throw new Error('AI応答が空です')
    }

    try {
      const parsed = JSON.parse(text)
      return {
        prices: Array.isArray(parsed.prices) ? parsed.prices : [],
        summary: parsed.summary || '価格情報を取得できませんでした'
      }
    } catch (parseError) {
      console.warn('JSON解析失敗、フォールバック処理:', parseError)
      return {
        prices: [],
        summary: text.length > 200 ? text.substring(0, 200) + '...' : text
      }
    }
  } catch (error) {
    console.error('価格検索エラー:', error)
    throw new Error('価格検索に失敗しました')
  }
}

/**
 * 価格検索結果をデータベースに保存する
 * @param itemId アイテムID
 * @param searchResult 価格検索結果
 * @param userId ユーザーID
 */
export async function savePriceHistory(
  itemId: string, 
  searchResult: {
    prices: Array<{
      price: string
      site: string
      url: string
      condition: string
    }>
    summary: string
  },
  userId: string
) {
  try {
    // 価格から数値を抽出してmin/max/avgを計算
    const priceNumbers = searchResult.prices
      .map(p => {
        const match = p.price.match(/[\d,]+/)
        return match ? parseInt(match[0].replace(/,/g, '')) : null
      })
      .filter((price): price is number => price !== null)

    const minPrice = priceNumbers.length > 0 ? Math.min(...priceNumbers) : null
    const maxPrice = priceNumbers.length > 0 ? Math.max(...priceNumbers) : null
    const avgPrice = priceNumbers.length > 0 
      ? Math.round(priceNumbers.reduce((sum, price) => sum + price, 0) / priceNumbers.length)
      : null

    // メイン価格履歴レコードを作成
    const priceHistory = await prisma.priceHistory.create({
      data: {
        itemId,
        source: 'AI検索',
        minPrice: minPrice ? minPrice.toString() : null,
        avgPrice: avgPrice ? avgPrice.toString() : null,
        maxPrice: maxPrice ? maxPrice.toString() : null,
        listingCount: searchResult.prices.length,
        summary: searchResult.summary,
        priceDetails: {
          create: searchResult.prices.map(price => ({
            site: price.site,
            price: price.price,
            url: price.url,
            condition: price.condition,
            title: `${price.site}での出品商品`
          }))
        }
      },
      include: {
        priceDetails: true
      }
    })

    return priceHistory
  } catch (error) {
    console.error('価格履歴保存エラー:', error)
    throw new Error('価格履歴の保存に失敗しました')
  }
}

/**
 * アイテムの価格推移を取得する
 * @param itemId アイテムID
 * @param userId ユーザーID
 * @param limit 取得件数（デフォルト: 10）
 */
export async function getPriceHistory(itemId: string, userId: string, limit: number = 10) {
  try {
    const history = await prisma.priceHistory.findMany({
      where: {
        itemId,
        item: {
          userId
        },
        isActive: true
      },
      include: {
        priceDetails: true
      },
      orderBy: {
        searchDate: 'desc'
      },
      take: limit
    })

    return history
  } catch (error) {
    console.error('価格履歴取得エラー:', error)
    throw new Error('価格履歴の取得に失敗しました')
  }
}
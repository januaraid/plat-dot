import { GoogleGenAI } from '@google/genai'
import { prisma } from '@/lib/db'

/**
 * Google Generative AI クライアントを取得する
 */
function getAIClient() {
  return new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY!
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
    
    const text = response.text?.trim() || ''
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
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.filter((s: any) => s && s.trim()) : [text.split('\n')[0] || '不明な商品'],
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
    const ai = getAIClient()
    
    // 検索クエリを最適化
    const productIdentifier = manufacturer ? `${manufacturer} ${itemName}` : itemName
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        `商品「${productIdentifier}」の中古品・新品の現在の相場価格を調査してください。

以下の日本の主要な売買サイトでの実際の販売価格を検索して分析してください：
- メルカリ
- ヤフオク  
- ラクマ
- Amazon（中古品）
- 楽天市場（中古品）

検索結果から、以下の条件で価格情報を抽出してください：
1. 実際に出品・販売されている商品の価格
2. 商品状態が明記されているもの
3. 信頼できる出品者からの情報
4. 最近の出品（できれば1ヶ月以内）

以下のJSON形式で回答してください：
{
  "prices": [
    {
      "price": "価格（例：¥2,980）",
      "site": "サイト名",
      "url": "商品ページのURL",
      "condition": "商品状態（新品/中古/ジャンク等）"
    }
  ],
  "summary": "価格相場の詳細な分析（以下の形式で記載）\n・平均価格: ¥X,XXX\n・価格帯: ¥X,XXX〜¥X,XXX\n・状態別価格: 新品¥X,XXX、中古¥X,XXX\n・市場動向: 詳細な分析"
}

重要な指示：
- 検索結果が見つからない場合でも、空の配列を返してください
- 価格は必ず日本円（¥記号付き）で記載してください
- summaryは以下の要素を含む読みやすい形式で記載してください：
  * 平均価格（例：平均価格: ¥8,500）
  * 価格帯（例：価格帯: ¥3,000〜¥15,000）
  * 状態別価格（例：新品: ¥12,000前後、中古良品: ¥8,000前後）
  * 市場の傾向（例：メルカリでの出品が多く、相場は安定しています）
- 各項目を改行（\n）で区切って見やすく整理してください
- 必ず有効なJSONフォーマットで回答してください`
      ],
      config: {
        tools: [{
          googleSearch: {}
        }]
      }
    })
    
    const text = response.text?.trim()
    if (!text) {
      throw new Error('AI応答が空です')
    }

    // JSON部分を抽出する（マークダウンコードブロック等を除去）
    let jsonText = text
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1]
    } else {
      // マークダウン形式でない場合、最初と最後の{}を探す
      const startIndex = text.indexOf('{')
      const lastIndex = text.lastIndexOf('}')
      if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
        jsonText = text.substring(startIndex, lastIndex + 1)
      }
    }

    try {
      const parsed = JSON.parse(jsonText)
      
      // データの検証と正規化
      const validatedPrices = Array.isArray(parsed.prices) 
        ? parsed.prices
            .filter((price: any) => price && typeof price === 'object')
            .map((price: any) => ({
              price: String(price.price || '価格不明'),
              site: String(price.site || '不明なサイト'),
              url: String(price.url || ''),
              condition: String(price.condition || '状態不明')
            }))
        : []

      const summary = typeof parsed.summary === 'string' && parsed.summary.trim() 
        ? parsed.summary.trim()
        : validatedPrices.length > 0 
          ? `${validatedPrices.length}件の価格情報を取得しました`
          : '価格情報を取得できませんでした'

      return {
        prices: validatedPrices,
        summary
      }
    } catch (parseError) {
      console.warn('JSON解析失敗、フォールバック処理:', parseError)
      console.warn('解析対象テキスト:', jsonText)
      
      // フォールバック：テキストから価格情報を抽出する試み
      const priceRegex = /¥[\d,]+/g
      const foundPrices = text.match(priceRegex) || []
      
      if (foundPrices.length > 0) {
        return {
          prices: foundPrices.slice(0, 5).map((price, index) => ({
            price,
            site: '検索結果より',
            url: '',
            condition: '詳細不明'
          })),
          summary: `テキスト解析により${foundPrices.length}件の価格を発見しました: ${foundPrices.slice(0, 3).join(', ')}など`
        }
      }

      return {
        prices: [],
        summary: text.length > 200 ? text.substring(0, 200) + '...' : text
      }
    }
  } catch (error) {
    console.error('価格検索エラー:', error)
    
    // より具体的なエラーメッセージを提供
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('limit')) {
        throw new Error('APIの利用制限に達しました。しばらく時間をおいてから再度お試しください。')
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        throw new Error('ネットワークエラーが発生しました。インターネット接続を確認してください。')
      } else if (error.message.includes('auth') || error.message.includes('key')) {
        throw new Error('API認証エラーが発生しました。設定を確認してください。')
      }
    }
    
    throw new Error('価格検索に失敗しました。しばらく時間をおいてから再度お試しください。')
  }
}

/**
 * 価格検索結果をデータベースに保存する
 * @param itemId アイテムID
 * @param searchResult 価格検索結果
 * @param userEmail ユーザーEmail
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
  userEmail: string
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
        minPrice: minPrice,
        avgPrice: avgPrice,
        maxPrice: maxPrice,
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
 * @param userEmail ユーザーEmail
 * @param limit 取得件数（デフォルト: 10）
 */
export async function getPriceHistory(itemId: string, userEmail: string, limit: number = 10) {
  try {
    const history = await prisma.priceHistory.findMany({
      where: {
        itemId,
        isActive: true,  // アクティブな履歴のみ取得
        item: {
          user: {
            email: userEmail
          }
        }
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
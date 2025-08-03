import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { GoogleGenAI } from '@google/genai'

export async function GET(req: NextRequest) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 環境変数チェック
    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ 
        status: 'error',
        message: 'GEMINI_API_KEY is not configured',
        apiKeyStatus: 'missing'
      }, { status: 500 })
    }

    // API接続テスト  
    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      fetch: fetch
    })

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [
        'テスト用のシンプルな挨拶を日本語で返してください。20文字以内で。'
      ]
    })

    const text = response.text.trim()
    
    return Response.json({
      status: 'success',
      message: 'Gemini API connection successful',
      testResponse: text || 'No response text',
      apiKeyStatus: 'configured',
      model: 'gemini-2.5-flash-lite'
    })

  } catch (error) {
    console.error('AI test API error:', error)
    
    let errorDetails = 'Unknown error'
    let statusCode = 500
    
    if (error instanceof Error) {
      errorDetails = error.message
      
      // エラーの種類に応じてステータスコードを調整
      if (errorDetails.includes('API key') || errorDetails.includes('unauthorized')) {
        statusCode = 401
      } else if (errorDetails.includes('quota') || errorDetails.includes('limit')) {
        statusCode = 429
      } else if (errorDetails.includes('network') || errorDetails.includes('fetch')) {
        statusCode = 502
      }
    }
    
    return Response.json({
      status: 'error',
      message: 'Gemini API connection failed',
      error: errorDetails,
      apiKeyStatus: process.env.GEMINI_API_KEY ? 'configured' : 'missing'
    }, { status: statusCode })
  }
}
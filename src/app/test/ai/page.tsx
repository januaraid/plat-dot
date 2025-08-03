'use client'

import { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AITestResult {
  status: 'success' | 'error'
  message: string
  testResponse?: string
  apiKeyStatus: string
  model?: string
  error?: string
}

interface AIUsage {
  currentUsage: number
  monthlyUsage: number
  usageLimit: number
  subscriptionTier: string
  remainingQuota: number
  resetDate: string
}

interface RecognizeResult {
  success: boolean
  data?: {
    suggestions: string[]
    category?: string
    manufacturer?: string
  }
  error?: string
  code?: string
}

const AITestPage = memo(function AITestPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [connectionTest, setConnectionTest] = useState<AITestResult | null>(null)
  const [usage, setUsage] = useState<AIUsage | null>(null)
  const [recognizeResult, setRecognizeResult] = useState<RecognizeResult | null>(null)
  const [testImageFile, setTestImageFile] = useState<File | null>(null)
  const [testImagePreview, setTestImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({})

  // 認証状態を安定化（一度認証されたら loading への変化を無視）
  const authStateRef = useRef({ isAuthenticated: false, hasBeenAuthenticated: false })
  
  const isAuthenticated = useMemo(() => {
    const currentAuth = status === 'authenticated' && session?.hasSession
    if (currentAuth) {
      authStateRef.current.hasBeenAuthenticated = true
    }
    // 一度認証されていて、現在loadingの場合は認証済みとして扱う
    if (authStateRef.current.hasBeenAuthenticated && status === 'loading') {
      return true
    }
    authStateRef.current.isAuthenticated = currentAuth
    return currentAuth
  }, [status, session?.hasSession])

  const isAuthLoading = useMemo(() => {
    // 一度も認証されていない場合のみloadingとして扱う
    return status === 'loading' && !authStateRef.current.hasBeenAuthenticated
  }, [status])

  // 未ログインの場合はトップページにリダイレクト
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, isAuthLoading, router])

  // 認証チェック中はローディング表示
  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const testConnection = useCallback(async () => {
    setLoading(prev => ({ ...prev, connection: true }))
    try {
      const response = await fetch('/api/ai/test')
      const data = await response.json()
      setConnectionTest(data)
    } catch (error) {
      setConnectionTest({
        status: 'error',
        message: 'API呼び出しに失敗しました',
        apiKeyStatus: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    setLoading(prev => ({ ...prev, connection: false }))
  }, [])

  const checkUsage = useCallback(async () => {
    setLoading(prev => ({ ...prev, usage: true }))
    try {
      const response = await fetch('/api/ai/usage')
      const data = await response.json()
      if (response.ok) {
        setUsage(data)
      } else {
        console.error('Usage check failed:', data)
      }
    } catch (error) {
      console.error('Usage API error:', error)
    }
    setLoading(prev => ({ ...prev, usage: false }))
  }, [])

  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    console.log('Selected file:', file)
    
    if (file) {
      // ファイルサイズチェック（10MB制限）
      if (file.size > 10 * 1024 * 1024) {
        alert('ファイルサイズが大きすぎます。10MB以下の画像を選択してください。')
        return
      }

      // ファイル形式チェック
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        alert('対応していないファイル形式です。JPEG、PNG、WebPファイルを選択してください。')
        return
      }

      setTestImageFile(file)
      console.log('File set successfully:', file.name, file.type, file.size)
      
      // プレビュー画像を作成
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        console.log('Preview created, length:', result?.length)
        setTestImagePreview(result)
      }
      reader.onerror = (e) => {
        console.error('FileReader error:', e)
        alert('画像の読み込みに失敗しました。')
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const testImageRecognition = useCallback(async () => {
    if (!testImageFile) {
      alert('画像ファイルが選択されていません。')
      return
    }

    console.log('Starting image recognition for:', testImageFile.name)
    setLoading(prev => ({ ...prev, recognize: true }))
    
    try {
      // ファイルをBase64に変換
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string
          if (!base64) {
            throw new Error('画像の読み込みに失敗しました')
          }
          
          const imageBase64 = base64.split(',')[1] // data:image/...;base64, を除去
          if (!imageBase64) {
            throw new Error('Base64変換に失敗しました')
          }

          console.log('Sending recognition request...')
          const response = await fetch('/api/ai/recognize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              imageBase64,
              mimeType: testImageFile.type
            })
          })

          console.log('Response status:', response.status)
          if (!response.ok) {
            const errorText = await response.text()
            console.error('API error response:', errorText)
            throw new Error(`API error: ${response.status} ${errorText}`)
          }

          const data = await response.json()
          console.log('Recognition result:', data)
          setRecognizeResult(data)
        } catch (apiError) {
          console.error('Recognition API error:', apiError)
          setRecognizeResult({
            success: false,
            error: apiError instanceof Error ? apiError.message : 'API呼び出しエラー'
          })
        } finally {
          setLoading(prev => ({ ...prev, recognize: false }))
        }
      }
      
      reader.onerror = () => {
        console.error('FileReader error during recognition')
        setRecognizeResult({
          success: false,
          error: 'ファイル読み込みエラー'
        })
        setLoading(prev => ({ ...prev, recognize: false }))
      }
      
      reader.readAsDataURL(testImageFile)
    } catch (error) {
      console.error('Image recognition error:', error)
      setRecognizeResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      setLoading(prev => ({ ...prev, recognize: false }))
    }
  }, [testImageFile])

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <Link href="/test" className="text-blue-500 hover:text-blue-600">
          ← テストページ一覧に戻る
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-purple-700">🤖 AI機能APIテスト</h1>
      
      <div className="space-y-8">
        {/* 接続テスト */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">1. Gemini API接続テスト</h2>
          <p className="text-gray-600 mb-4">
            Gemini 2.5 Flash-Liteとの接続状況を確認します。
          </p>
          
          <button
            onClick={testConnection}
            disabled={loading.connection}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading.connection ? '接続中...' : '接続テスト実行'}
          </button>

          {connectionTest && (
            <div className={`mt-4 p-4 rounded ${
              connectionTest.status === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <h3 className={`font-semibold ${
                connectionTest.status === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {connectionTest.status === 'success' ? '✅ 接続成功' : '❌ 接続失敗'}
              </h3>
              <p className="text-sm mt-2">{connectionTest.message}</p>
              {connectionTest.testResponse && (
                <p className="text-sm mt-2">
                  <strong>AI応答:</strong> {connectionTest.testResponse}
                </p>
              )}
              <div className="text-xs mt-2 space-y-1">
                <p><strong>APIキー:</strong> {connectionTest.apiKeyStatus}</p>
                {connectionTest.model && <p><strong>モデル:</strong> {connectionTest.model}</p>}
                {connectionTest.error && <p><strong>エラー:</strong> {connectionTest.error}</p>}
              </div>
            </div>
          )}
        </div>

        {/* 使用量チェック */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">2. AI使用量チェック</h2>
          <p className="text-gray-600 mb-4">
            現在のAI機能使用状況と制限を確認します。
          </p>
          
          <button
            onClick={checkUsage}
            disabled={loading.usage}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading.usage ? '取得中...' : '使用量チェック'}
          </button>

          {usage && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-semibold text-blue-700">📊 使用状況</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3 text-sm">
                <div>
                  <p className="text-gray-600">現在の使用量</p>
                  <p className="font-semibold">{usage.currentUsage} / {usage.usageLimit}</p>
                </div>
                <div>
                  <p className="text-gray-600">今月の使用量</p>
                  <p className="font-semibold">{usage.monthlyUsage} 回</p>
                </div>
                <div>
                  <p className="text-gray-600">残り回数</p>
                  <p className="font-semibold">{usage.remainingQuota} 回</p>
                </div>
                <div>
                  <p className="text-gray-600">プラン</p>
                  <p className="font-semibold">{usage.subscriptionTier}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-600">リセット日</p>
                  <p className="font-semibold">{new Date(usage.resetDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 画像認識テスト */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">3. 画像認識テスト</h2>
          <p className="text-gray-600 mb-4">
            商品画像をアップロードして、AI認識機能をテストします。
          </p>
          
          <div className="space-y-4">
            {/* ドラッグ&ドロップエリア */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const files = e.dataTransfer.files
                if (files && files.length > 0) {
                  const file = files[0]
                  handleImageSelect({ target: { files: [file] } } as any)
                }
              }}
            >
              <div className="space-y-3">
                <svg className="mx-auto w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                </svg>
                
                <p className="text-base text-gray-600">
                  画像をドラッグ&ドロップするか、
                  <button
                    type="button"
                    onClick={useCallback(() => {
                      console.log('File select button clicked')
                      const fileInput = document.getElementById('ai-test-file-input') as HTMLInputElement
                      console.log('File input element:', fileInput)
                      if (fileInput) {
                        console.log('Triggering file input click')
                        fileInput.click()
                      } else {
                        console.error('File input element not found')
                      }
                    }, [])}
                    className="text-purple-500 hover:text-purple-600 underline ml-1"
                  >
                    ファイルを選択
                  </button>
                  してください
                </p>
                
                <p className="text-xs text-gray-500">
                  対応形式: JPEG, PNG, WebP (最大10MB)
                </p>
              </div>
              
              {/* 隠しファイルインプット */}
              <input
                id="ai-test-file-input"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {testImagePreview && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">プレビュー:</p>
                <img 
                  src={testImagePreview} 
                  alt="テスト画像" 
                  className="max-w-xs max-h-64 object-contain border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ファイル: {testImageFile?.name} ({Math.round((testImageFile?.size || 0) / 1024)}KB)
                </p>
              </div>
            )}

            <button
              onClick={testImageRecognition}
              disabled={!testImageFile || loading.recognize}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.recognize ? '認識中...' : '画像認識実行'}
            </button>
          </div>

          {recognizeResult && (
            <div className={`mt-4 p-4 rounded ${
              recognizeResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <h3 className={`font-semibold ${
                recognizeResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {recognizeResult.success ? '✅ 認識成功' : '❌ 認識失敗'}
              </h3>
              
              {recognizeResult.success && recognizeResult.data && (
                <div className="mt-3 text-sm space-y-2">
                  <div>
                    <p className="font-medium">商品名候補:</p>
                    <ul className="list-disc list-inside ml-2">
                      {recognizeResult.data.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                  {recognizeResult.data.category && (
                    <p><strong>カテゴリ:</strong> {recognizeResult.data.category}</p>
                  )}
                  {recognizeResult.data.manufacturer && (
                    <p><strong>メーカー:</strong> {recognizeResult.data.manufacturer}</p>
                  )}
                </div>
              )}
              
              {!recognizeResult.success && (
                <div className="mt-2 text-sm">
                  <p><strong>エラー:</strong> {recognizeResult.error}</p>
                  {recognizeResult.code && (
                    <p><strong>エラーコード:</strong> {recognizeResult.code}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 技術情報 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🔧 技術情報</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold mb-2">AIモデル情報</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• モデル: Gemini 2.5 Flash-Lite</li>
                <li>• 機能: 画像認識、Google検索グラウンディング</li>
                <li>• レート制限: 15 RPM（1分間あたり15リクエスト）</li>
                <li>• 対応画像: JPEG, PNG, WebP</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">実装済みエンドポイント</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• <code>POST /api/ai/recognize</code></li>
                <li>• <code>GET /api/ai/usage</code></li>
                <li>• <code>GET /api/ai/test</code></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default AITestPage
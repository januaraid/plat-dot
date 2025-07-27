'use client'

import { useState } from 'react'
import Link from 'next/link'

type ErrorResponse = {
  error: string
  type?: string
  details?: Record<string, string[]>
  timestamp?: string
}

export default function ItemValidationTestPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    purchaseDate: '',
    purchasePrice: '',
    purchaseLocation: '',
    condition: '',
    notes: '',
    folderId: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // リアルタイムエラークリア
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent, endpoint: string, method: string) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setResponse(null)

    try {
      const body = method === 'GET' ? undefined : JSON.stringify(formData)
      const url = method === 'GET' 
        ? `/api/items?${new URLSearchParams(formData as any).toString()}`
        : '/api/items'
      
      const res = await fetch(url, {
        method,
        headers: method === 'GET' ? {} : {
          'Content-Type': 'application/json',
        },
        body,
      })

      const data = await res.json()
      
      if (!res.ok) {
        const errorData = data as ErrorResponse
        if (errorData.details) {
          setErrors(errorData.details)
        } else {
          setErrors({ _general: [errorData.error || 'Unknown error'] })
        }
      } else {
        setResponse(data)
      }
    } catch (error) {
      setErrors({ _general: ['ネットワークエラーが発生しました'] })
    } finally {
      setLoading(false)
    }
  }

  const renderFieldError = (fieldName: string) => {
    const fieldErrors = errors[fieldName]
    if (!fieldErrors?.length) return null
    
    return (
      <div className="mt-1">
        {fieldErrors.map((error, index) => (
          <p key={index} className="text-sm text-red-600">
            {error}
          </p>
        ))}
      </div>
    )
  }

  const renderGeneralError = () => {
    const generalErrors = errors._general || errors._root
    if (!generalErrors?.length) return null
    
    return (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
        {generalErrors.map((error, index) => (
          <p key={index} className="text-sm text-red-600">
            {error}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/test/items" className="text-blue-500 hover:underline">
          ← アイテム管理テストに戻る
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">バリデーション・エラーハンドリングテスト</h1>
      
      {renderGeneralError()}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* フォーム */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">アイテムデータ入力</h2>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  商品名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="商品名を入力"
                />
                {renderFieldError('name')}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="商品の説明"
                />
                {renderFieldError('description')}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリー
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="カテゴリー"
                />
                {renderFieldError('category')}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  購入日
                </label>
                <input
                  type="datetime-local"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.purchaseDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {renderFieldError('purchaseDate')}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  購入価格
                </label>
                <input
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.purchasePrice ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {renderFieldError('purchasePrice')}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  購入場所
                </label>
                <input
                  type="text"
                  name="purchaseLocation"
                  value={formData.purchaseLocation}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.purchaseLocation ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="購入場所"
                />
                {renderFieldError('purchaseLocation')}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  状態
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.condition ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">選択してください</option>
                  <option value="新品">新品</option>
                  <option value="ほぼ新品">ほぼ新品</option>
                  <option value="良好">良好</option>
                  <option value="使用感あり">使用感あり</option>
                  <option value="要修理">要修理</option>
                </select>
                {renderFieldError('condition')}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メモ
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.notes ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="メモ"
                />
                {renderFieldError('notes')}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  フォルダID（テスト用）
                </label>
                <input
                  type="text"
                  name="folderId"
                  value={formData.folderId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.folderId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="UUID形式のフォルダID（空白可）"
                />
                {renderFieldError('folderId')}
              </div>
            </form>
          </div>

          {/* テストボタン */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">バリデーションテスト</h2>
            
            <div className="space-y-3">
              <button
                onClick={(e) => handleSubmit(e, '/api/items', 'POST')}
                disabled={loading}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? '実行中...' : 'アイテム作成テスト'}
              </button>
              
              <button
                onClick={(e) => handleSubmit(e, '/api/items', 'GET')}
                disabled={loading}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? '実行中...' : '検索バリデーションテスト'}
              </button>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <h3 className="font-semibold mb-2">テストシナリオ：</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>空の商品名でアイテム作成（必須エラー）</li>
                <li>100文字超過の商品名（長さエラー）</li>
                <li>不正なUUID形式のフォルダID（形式エラー）</li>
                <li>未来の購入日（ビジネスルールエラー）</li>
                <li>価格のみ設定して購入日なし（関連エラー）</li>
                <li>負の価格（範囲エラー）</li>
                <li>小数点3桁以上の価格（精度エラー）</li>
              </ul>
            </div>
          </div>
        </div>

        {/* レスポンス表示 */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">レスポンス・エラー表示</h2>
            
            {errors && Object.keys(errors).length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-red-600 mb-2">バリデーションエラー：</h3>
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  {Object.entries(errors).map(([field, fieldErrors]) => (
                    <div key={field} className="mb-2">
                      <span className="font-medium text-red-700">
                        {field === '_general' || field === '_root' ? '全般' : field}:
                      </span>
                      <ul className="ml-4 list-disc">
                        {fieldErrors.map((error, index) => (
                          <li key={index} className="text-red-600 text-sm">{error}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {response && (
              <div>
                <h3 className="font-semibold text-green-600 mb-2">成功レスポンス：</h3>
                <pre className="bg-green-50 border border-green-200 rounded-md p-4 text-sm overflow-auto">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}
            
            {!errors && !response && (
              <p className="text-gray-500">テストを実行してください</p>
            )}
          </div>

          {/* サンプルエラーテスト */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">サンプルエラーテスト</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setFormData({
                    name: '',
                    description: '',
                    category: '',
                    purchaseDate: '',
                    purchasePrice: '',
                    purchaseLocation: '',
                    condition: '',
                    notes: '',
                    folderId: '',
                  })
                }}
                className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                必須エラーテスト（全項目クリア）
              </button>
              
              <button
                onClick={() => {
                  setFormData({
                    name: 'a'.repeat(101),
                    description: 'a'.repeat(1001),
                    category: 'a'.repeat(51),
                    purchaseDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                    purchasePrice: '-100',
                    purchaseLocation: 'a'.repeat(201),
                    condition: 'a'.repeat(51),
                    notes: 'a'.repeat(2001),
                    folderId: 'invalid-uuid',
                  })
                }}
                className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                文字数・形式エラーテスト
              </button>
              
              <button
                onClick={() => {
                  setFormData({
                    name: 'テスト商品',
                    description: '',
                    category: '',
                    purchaseDate: '',
                    purchasePrice: '1000.123',
                    purchaseLocation: '',
                    condition: '',
                    notes: '',
                    folderId: '',
                  })
                }}
                className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                ビジネスルールエラーテスト
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
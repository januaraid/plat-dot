'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserSettings {
  displayName: string
  email: string
  aiUsageCount: number
  aiUsageLimit: number
  subscriptionTier: string
}

const SettingsPage = memo(function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // 認証状態を安定化（一度認証されたら loading への変化を無視）
  const authStateRef = useRef({ isAuthenticated: false, hasBeenAuthenticated: false })
  
  const isAuthenticated = useMemo(() => {
    const currentAuth = !!(status === 'authenticated' && session?.hasSession && session?.user?.email)
    if (currentAuth) {
      authStateRef.current.hasBeenAuthenticated = true
    }
    // 一度認証されていて、現在loadingの場合は認証済みとして扱う
    if (authStateRef.current.hasBeenAuthenticated && status === 'loading') {
      return true
    }
    authStateRef.current.isAuthenticated = currentAuth
    return currentAuth
  }, [status, session?.hasSession, session?.user?.email])

  const isAuthLoading = useMemo(() => {
    // 一度も認証されていない場合のみloadingとして扱う
    return status === 'loading' && !authStateRef.current.hasBeenAuthenticated
  }, [status])
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [displayNameInput, setDisplayNameInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // 表示設定
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)

  // ローカルストレージから設定を読み込み
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem('darkMode') === 'true'
      const savedNotifications = localStorage.getItem('notifications') !== 'false'
      setDarkMode(savedDarkMode)
      setNotifications(savedNotifications)
    }
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings')
      if (!response.ok) {
        throw new Error('設定の取得に失敗しました')
      }
      const data = await response.json()
      setSettings(data)
      setDisplayNameInput(data.displayName) // 入力フィールドにも設定
    } catch (error) {
      console.error('Error fetching settings:', error)
      setError(error instanceof Error ? error.message : '設定の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (isAuthenticated) {
      fetchSettings()
    }
  }, [isAuthenticated, fetchSettings])

  // 表示名更新処理
  const handleSaveDisplayName = useCallback(async () => {
    if (!settings || displayNameInput.trim() === settings.displayName) {
      console.log('Settings - Save skipped:', {
        hasSettings: !!settings,
        input: displayNameInput.trim(),
        current: settings?.displayName,
        same: displayNameInput.trim() === settings?.displayName
      })
      return
    }

    console.log('Settings - Starting save:', {
      input: displayNameInput.trim(),
      current: settings.displayName
    })

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const requestData = { displayName: displayNameInput.trim() }
      console.log('Settings - Sending request:', requestData)

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      console.log('Settings - Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.log('Settings - Error response:', errorData)
        throw new Error(errorData.error || '設定の更新に失敗しました')
      }

      const updatedData = await response.json()
      console.log('Settings - Updated data received:', updatedData)
      
      setSettings(updatedData)
      setDisplayNameInput(updatedData.displayName)
      setSuccessMessage('表示名を更新しました')
      
      // 成功メッセージを3秒後に消す
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error updating display name:', error)
      setError(error instanceof Error ? error.message : '設定の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }, [settings, displayNameInput])

  const handleDarkModeChange = useCallback((enabled: boolean) => {
    setDarkMode(enabled)
    localStorage.setItem('darkMode', enabled.toString())
    // ダークモードの実装は将来のタスクとして保留
    if (enabled) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const handleNotificationsChange = useCallback((enabled: boolean) => {
    setNotifications(enabled)
    localStorage.setItem('notifications', enabled.toString())
  }, [])

  const handleExportData = useCallback(() => {
    // データエクスポート機能は将来実装予定
    alert('データエクスポート機能は現在準備中です。\n\n実装予定:\n- アイテム・フォルダ・画像データの一括出力\n- CSV/JSON形式での出力\n- プライバシー保護機能')
  }, [])

  const handleDeleteAccount = useCallback(() => {
    // アカウント削除機能は将来実装予定
    alert('アカウント削除機能は現在準備中です。\n\n実装予定:\n- 確認手続き付きアカウント削除\n- 全データの完全削除\n- エクスポート機能との連携\n\nお急ぎの場合はサポートまでお問い合わせください。')
  }, [])

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/profile"
              className="text-blue-600 hover:text-blue-500 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              プロフィールに戻る
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">設定</h1>
          <p className="text-gray-600 mt-2">アカウント設定とプリファレンスを管理します</p>
        </div>

        {/* エラー・成功メッセージ */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-600">{successMessage}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* アカウント情報 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">アカウント情報</h2>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ) : settings ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    表示名
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <input
                      type="text"
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !saving && displayNameInput.trim() !== settings.displayName && displayNameInput.trim() !== '') {
                          handleSaveDisplayName()
                        }
                      }}
                      disabled={saving}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="表示名を入力してください"
                    />
                    <button
                      onClick={handleSaveDisplayName}
                      disabled={saving || displayNameInput.trim() === settings.displayName || displayNameInput.trim() === ''}
                      className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          保存中
                        </>
                      ) : (
                        '保存'
                      )}
                    </button>
                  </div>
                  {displayNameInput !== settings.displayName && displayNameInput.trim() !== '' && (
                    <p className="text-xs text-gray-500 mt-1">
                      変更を保存するには「保存」ボタンをタップしてください
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    メールアドレスはGoogle OAuth認証により管理されています
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {/* AI機能設定 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">AI機能</h2>
            
            {settings && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-blue-900">使用状況</h3>
                    <p className="text-sm text-blue-700">
                      {settings.aiUsageCount} / {settings.aiUsageLimit} 回使用
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-blue-900">
                      {settings.subscriptionTier === 'free' ? '無料プラン' : 'プレミアムプラン'}
                    </span>
                  </div>
                </div>
                
                {settings.subscriptionTier === 'free' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="font-medium text-orange-900 mb-2">制限について</h3>
                    <p className="text-sm text-orange-700 mb-3">
                      無料プランでは月20回までAI機能をご利用いただけます。
                    </p>
                    <button
                      className="bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-500 transition-colors"
                      onClick={() => alert('プレミアムアップグレード機能は現在準備中です。\n\n実装予定:\n- AI機能無制限利用\n- 価格変動通知機能\n- 優先サポート\n- データ容量拡張')}
                    >
                      準備中
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 表示設定 */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">表示設定</h2>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900">ダークモード</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">暗いテーマで表示します（準備中）</p>
                </div>
                <button
                  onClick={() => handleDarkModeChange(!darkMode)}
                  className={`relative inline-flex h-5 w-10 sm:h-6 sm:w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                    darkMode ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                      darkMode ? 'translate-x-6 sm:translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* 通知設定 */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">通知設定</h2>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900">価格変動通知</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">価格が大きく変動した際に通知します（準備中）</p>
                </div>
                <button
                  onClick={() => handleNotificationsChange(!notifications)}
                  className={`relative inline-flex h-5 w-10 sm:h-6 sm:w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                    notifications ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                      notifications ? 'translate-x-6 sm:translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* データ管理 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">データ管理</h2>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900">データエクスポート</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                      アイテム、フォルダ、画像情報をJSONファイルでダウンロード（準備中）
                    </p>
                  </div>
                  <button
                    onClick={handleExportData}
                    className="bg-gray-400 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-gray-500 transition-colors whitespace-nowrap"
                  >
                    準備中
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900">プライバシーポリシー</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                      データの取り扱いについて
                    </p>
                  </div>
                  <Link
                    href="/privacy"
                    className="bg-gray-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-gray-700 transition-colors whitespace-nowrap inline-block"
                  >
                    確認
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* アカウント管理 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">アカウント管理</h2>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg bg-gray-50 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900">アカウント削除</h3>
                    <p className="text-xs sm:text-sm text-gray-700 mt-0.5">
                      アカウントと全てのデータを完全に削除します（準備中）
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    className="bg-gray-400 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-gray-500 transition-colors whitespace-nowrap"
                  >
                    準備中
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default SettingsPage
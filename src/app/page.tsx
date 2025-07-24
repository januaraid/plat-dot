export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="flex-1 text-center">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">
            plat-dot
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI機能付き持ち物管理システム
          </p>
          <p className="text-gray-500 mb-4">
            プロジェクト基盤構築完了 ✅
          </p>
          <p className="text-gray-500 mb-4">
            データベース設計完了 ✅
          </p>
          <p className="text-gray-500 mb-4">
            認証システム構築完了 ✅
          </p>
          <p className="text-gray-500 mb-8">
            セキュリティ機能実装完了 ✅
          </p>
          <p className="text-gray-500 mb-8">
            アイテム管理API実装完了 ✅
          </p>
          
          <div className="mt-8 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">認証・ユーザー機能</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a 
                  href="/auth/signin" 
                  className="bg-green-500 text-white px-4 py-3 rounded hover:bg-green-600 text-center block"
                >
                  🔐 サインイン
                </a>
                <a 
                  href="/test-auth" 
                  className="bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600 text-center block"
                >
                  👤 認証テストページ
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">API機能テスト</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a 
                  href="/test" 
                  className="bg-indigo-500 text-white px-4 py-3 rounded hover:bg-indigo-600 text-center block"
                >
                  🧪 API テストページ
                </a>
                <a 
                  href="/test/items" 
                  className="bg-orange-500 text-white px-4 py-3 rounded hover:bg-orange-600 text-center block"
                >
                  📦 アイテム管理テスト
                </a>
                <a 
                  href="/debug" 
                  className="bg-red-500 text-white px-4 py-3 rounded hover:bg-red-600 text-center block"
                >
                  🐛 デバッグページ
                </a>
                <a 
                  href="/api/auth/session" 
                  className="bg-purple-500 text-white px-4 py-3 rounded hover:bg-purple-600 text-center block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🔍 セッション情報 (API)
                </a>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">開発状況</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>✅ フェーズ1: プロジェクト基盤とセットアップ</p>
                <p>✅ フェーズ2: 認証システムとセキュリティ</p>
                <p>✅ フェーズ3: 基本アイテム管理CRUD (タスク5完了)</p>
                <p>🔄 フェーズ3: アイテム検索・フィルタリング機能 (次のタスク)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
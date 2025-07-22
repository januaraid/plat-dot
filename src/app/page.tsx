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
          <p className="text-gray-500 mb-8">
            認証システム構築完了 ✅
          </p>
          
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">利用可能なページ</h3>
            <div className="flex flex-col space-y-3">
              <a 
                href="/auth/signin" 
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-center"
              >
                🔐 サインイン
              </a>
              <a 
                href="/test-auth" 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-center"
              >
                👤 認証テストページ
              </a>
              <a 
                href="/api/auth/session" 
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 text-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                🔍 セッション情報 (API)
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
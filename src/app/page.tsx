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
          <p className="text-gray-500">
            データベース設計完了 ✅
          </p>
          <div className="mt-8">
            <a 
              href="/api/test/db" 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              target="_blank"
              rel="noopener noreferrer"
            >
              データベース接続テスト
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
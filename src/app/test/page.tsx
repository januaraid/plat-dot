import Link from 'next/link'

export default function TestIndexPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">API テストページ</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link 
          href="/test/items" 
          className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">アイテム管理API</h2>
          <p className="text-gray-600">
            アイテムの作成、取得、更新、削除機能をテストできます。
          </p>
          <div className="mt-4 text-sm text-blue-500">
            → テストページを開く
          </div>
        </Link>
        
        <Link 
          href="/test/folders" 
          className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">フォルダ管理API</h2>
          <p className="text-gray-600">
            フォルダの作成、階層管理、アイテム分類機能をテストできます。
          </p>
          <div className="mt-4 text-sm text-blue-500">
            → テストページを開く
          </div>
        </Link>
        
        <div className="bg-gray-100 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-500">画像アップロードAPI</h2>
          <p className="text-gray-500">
            画像アップロード機能は今後実装予定です。
          </p>
          <div className="mt-4 text-sm text-gray-400">
            Coming soon...
          </div>
        </div>
      </div>
      
      <div className="mt-12 bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">開発者向け情報</h2>
        <div className="space-y-2 text-sm">
          <p><strong>認証:</strong> Google OAuth（NextAuth.js）</p>
          <p><strong>データベース:</strong> SQLite（開発環境）</p>
          <p><strong>API仕様:</strong> REST API with Zod validation</p>
          <p><strong>テストファイル:</strong> 
            <code className="bg-gray-100 px-2 py-1 rounded ml-2">test-items-api.md</code>
          </p>
        </div>
        
        <div className="mt-4">
          <h3 className="font-semibold mb-2">実装済みエンドポイント:</h3>
          <div className="text-sm space-y-3">
            <div>
              <h4 className="font-medium text-gray-800">アイテム管理API:</h4>
              <ul className="text-gray-600 space-y-1 ml-4">
                <li>• <code>GET /api/items</code> - アイテム一覧取得（検索・ページネーション対応）</li>
                <li>• <code>POST /api/items</code> - アイテム新規作成</li>
                <li>• <code>GET /api/items/[id]</code> - 単一アイテム取得</li>
                <li>• <code>PUT /api/items/[id]</code> - アイテム更新</li>
                <li>• <code>DELETE /api/items/[id]</code> - アイテム削除</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">フォルダ管理API:</h4>
              <ul className="text-gray-600 space-y-1 ml-4">
                <li>• <code>GET /api/folders</code> - フォルダ一覧取得（階層・カウント対応）</li>
                <li>• <code>POST /api/folders</code> - フォルダ新規作成（階層制限・重複チェック）</li>
                <li>• <code>GET /api/folders/[id]</code> - 単一フォルダ取得</li>
                <li>• <code>PUT /api/folders/[id]</code> - フォルダ更新（循環参照チェック）</li>
                <li>• <code>DELETE /api/folders/[id]</code> - フォルダ削除（アイテム移動処理）</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
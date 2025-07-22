import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function TestAuthPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">認証テストページ（サーバーサイド）</h1>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">ログイン情報</h2>
        <p>名前: {session.user?.name || 'なし'}</p>
        <p>メール: {session.user?.email || 'なし'}</p>
        <p>ID: {session.user?.id || 'なし'}</p>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">完全なセッション情報</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <a
        href="/api/auth/signout"
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        サインアウト
      </a>
    </div>
  )
}
import Link from 'next/link'

export default function TestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/test" className="text-lg font-semibold">
                API テスト
              </Link>
              <Link 
                href="/test/items" 
                className="text-gray-600 hover:text-gray-900"
              >
                アイテム
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900"
              >
                ホーム
              </Link>
              <Link 
                href="/auth/signin" 
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                ログイン
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      <main>
        {children}
      </main>
    </div>
  )
}
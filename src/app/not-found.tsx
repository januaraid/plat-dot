import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* plat-dot logo icon */}
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-md flex items-center justify-center mb-6">
            <svg className="w-10 h-10" viewBox="0 0 32 32" fill="none">
              <g transform="translate(6, 6)">
                {/* Main box */}
                <path d="M2 8L10 4L18 8V18L10 22L2 18V8Z" fill="#ffffff" stroke="#e5e7eb" strokeWidth="0.5"/>
                
                {/* Box lines for 3D effect */}
                <path d="M2 8L10 12L18 8" stroke="#cbd5e1" strokeWidth="1" fill="none"/>
                <path d="M10 12V22" stroke="#cbd5e1" strokeWidth="1"/>
                
                {/* Small dots representing items */}
                <circle cx="6" cy="10" r="1" fill="#60a5fa"/>
                <circle cx="14" cy="10" r="1" fill="#60a5fa"/>
                <circle cx="10" cy="15" r="1" fill="#60a5fa"/>
              </g>
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">ページが見つかりません</h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            お探しのページは存在しないか、移動または削除された可能性があります。
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            ホームページに戻る
          </Link>
          
          <Link
            href="/items"
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            アイテム管理に移動
          </Link>

          <Link
            href="/auth/signin"
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            ログインページに移動
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            問題が続く場合は、
            <a 
              href="mailto:support@plat-dot.com" 
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              サポートまでお問い合わせください
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
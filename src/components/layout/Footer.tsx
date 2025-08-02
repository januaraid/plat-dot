import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-12 bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Compact footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Company info */}
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center mr-2 p-1">
              {/* plat-dot logo icon */}
              <svg className="w-full h-full" viewBox="0 0 32 32" fill="none">
                {/* Box/package icon representing inventory management */}
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
            <span className="font-medium text-gray-900 mr-4">plat-dot</span>
            <span className="text-gray-500 text-sm">
              © {currentYear} All rights reserved.
            </span>
          </div>

          {/* Quick links */}
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <Link href="/help" className="hover:text-blue-600 transition-colors">
              ヘルプ
            </Link>
            <Link href="/privacy" className="hover:text-blue-600 transition-colors">
              プライバシー
            </Link>
            <Link href="/terms" className="hover:text-blue-600 transition-colors">
              利用規約
            </Link>
            <span className="text-xs text-gray-500">v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
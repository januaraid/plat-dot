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
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center mr-2">
              <span className="text-white font-bold text-sm">P</span>
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
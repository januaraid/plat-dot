'use client'

import { signIn, getProviders } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Provider {
  id: string
  name: string
  type: string
  signinUrl: string
  callbackUrl: string
}

export default function SignInPage() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        console.log('Fetching providers...')
        const res = await getProviders()
        console.log('Providers:', res)
        setProviders(res)
      } catch (err) {
        console.error('Error fetching providers:', err)
        setError('プロバイダーの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }
    fetchProviders()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            plat-dot にログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            AI技術を活用した持ち物管理システム
          </p>
        </div>
        <div className="mt-8 space-y-6">
          {loading && (
            <p className="text-center text-gray-600">読み込み中...</p>
          )}
          {error && (
            <p className="text-center text-red-600">{error}</p>
          )}
          {!loading && !error && !providers && (
            <p className="text-center text-gray-600">プロバイダーが見つかりません</p>
          )}
          {providers &&
            Object.values(providers).map((provider) => (
              <div key={provider.name}>
                <button
                  onClick={() => signIn(provider.id, { callbackUrl: '/' })}
                  className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span className="flex items-center">
                    {provider.id === 'google' && (
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )}
                    {provider.name}でサインイン
                  </span>
                </button>
              </div>
            ))}
          
          {/* プライバシーポリシー同意文 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              ログインすることで、当サービスの
              <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline mx-1">
                プライバシーポリシー
              </Link>
              および
              <Link href="/terms" className="text-blue-600 hover:text-blue-800 underline mx-1">
                利用規約
              </Link>
              に同意したものとみなされます。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
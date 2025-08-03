'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Line, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface DashboardStats {
  itemStats: {
    total: number
    uncategorized: number
    categories: { category: string; count: number }[]
  }
  folderStats: {
    total: number
    byDepth: { depth: number; count: number }[]
  }
  recentItems: {
    id: string
    name: string
    category: string | null
    folderName: string | null
    createdAt: string
    updatedAt?: string
    image: string | null
    thumbnailSmall?: string | null
    thumbnailMedium?: string | null
  }[]
  recentUpdatedItems: {
    id: string
    name: string
    category: string | null
    folderName: string | null
    createdAt: string
    updatedAt: string
    image: string | null
    thumbnailSmall?: string | null
    thumbnailMedium?: string | null
  }[]
}

interface ValueSummary {
  totalPurchaseValue: number
  totalCurrentValue: number
  profitLoss: number
  profitLossPercent: number
  itemsWithPriceData: number
  totalItems: number
  topValueItems: {
    id: string
    name: string
    category: string | null
    purchasePrice: number | null
    currentPrice: number
    priceChangePercent: number | null
    lastUpdated: string
  }[]
  categoryValues: {
    category: string
    totalValue: number
    itemCount: number
    averageValue: number
  }[]
}

interface PriceTrendsData {
  itemTrends: {
    itemId: string
    itemName: string
    category: string | null
    purchasePrice: number | null
    priceData: {
      date: string
      minPrice: number | null
      avgPrice: number | null
      maxPrice: number | null
      listingCount: number
    }[]
  }[]
  categoryDistribution: {
    category: string
    itemCount: number
    totalValue: number
  }[]
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [valueSummary, setValueSummary] = useState<ValueSummary | null>(null)
  const [trendData, setTrendData] = useState<PriceTrendsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<string>('')
  
  // 認証状態を安定化（一度認証されたら loading への変化を無視）
  const authStateRef = useRef({ isAuthenticated: false, hasBeenAuthenticated: false })
  
  const isAuthenticated = useMemo(() => {
    const currentAuth = status === 'authenticated' && session?.hasSession
    if (currentAuth) {
      authStateRef.current.hasBeenAuthenticated = true
    }
    // 一度認証されていて、現在loadingの場合は認証済みとして扱う
    if (authStateRef.current.hasBeenAuthenticated && status === 'loading') {
      return true
    }
    authStateRef.current.isAuthenticated = currentAuth
    return currentAuth
  }, [status, session?.hasSession])

  const isAuthLoading = useMemo(() => {
    // 一度も認証されていない場合のみloadingとして扱う
    return status === 'loading' && !authStateRef.current.hasBeenAuthenticated
  }, [status])

  const fetchData = useCallback(async () => {
    try {
      console.log('Dashboard: fetchData() started')
      setLoading(true)
      const [statsResponse, valueResponse, trendsResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/value-summary'),
        fetch('/api/dashboard/price-trends')
      ])
      
      if (!statsResponse.ok) {
        throw new Error('統計情報の取得に失敗しました')
      }
      
      const statsData = await statsResponse.json()
      setStats(statsData)
      
      // 価格データは任意（エラーでも続行）
      if (valueResponse.ok && trendsResponse.ok) {
        const [valueData, trendsData] = await Promise.all([
          valueResponse.json(),
          trendsResponse.json()
        ])
        setValueSummary(valueData)
        setTrendData(trendsData)
        if (trendsData.itemTrends.length > 0) {
          setSelectedItem(trendsData.itemTrends[0].itemId)
        }
      }
      
      console.log('Dashboard: fetchData() completed successfully')
    } catch (err) {
      console.error('Dashboard: fetchData() error:', err)
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  // コンポーネントマウント・アンマウント追跡
  useEffect(() => {
    console.log('Dashboard: Component mounted')
    return () => {
      console.log('Dashboard: Component unmounted')
    }
  }, [])

  // 認証チェック
  useEffect(() => {
    console.log('Dashboard: Auth check useEffect triggered', { 
      isAuthenticated,
      isAuthLoading
    })
    if (!isAuthLoading && !isAuthenticated) {
      console.log('Dashboard: Redirecting to home due to no session')
      router.replace('/')
    }
  }, [isAuthenticated, isAuthLoading, router])

  // データ取得（初回のみ）
  useEffect(() => {
    console.log('Dashboard: Data fetch useEffect triggered', { 
      isAuthenticated,
      isAuthLoading,
      hasStats: !!stats
    })
    // 既にデータ取得済みの場合は何もしない
    if (stats) return
    
    if (isAuthenticated && !isAuthLoading) {
      console.log('Dashboard: Calling fetchData()')
      fetchData()
    }
  }, [isAuthenticated, isAuthLoading]) // statsとfetchDataを依存配列から除外

  if (isAuthLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  // チャート用のヘルパー関数
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', { 
      style: 'currency', 
      currency: 'JPY',
      maximumFractionDigits: 0 
    }).format(price)
  }

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`
  }

  // 全アイテム合計の価格推移グラフデータ
  const totalPriceData = trendData ? (() => {
    // 日付ごとにグループ化して合計値を計算
    const dateGroups: Record<string, { total: number; count: number; date: string }> = {}
    
    trendData.itemTrends.forEach(item => {
      item.priceData.forEach(data => {
        const date = data.date.split('T')[0] // YYYY-MM-DD形式
        if (!dateGroups[date]) {
          dateGroups[date] = { total: 0, count: 0, date }
        }
        if (data.avgPrice) {
          dateGroups[date].total += data.avgPrice
          dateGroups[date].count++
        }
      })
    })
    
    // 日付順にソートして最新20日分を取得
    const sortedData = Object.values(dateGroups)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-20)
    
    return sortedData
  })() : null

  const lineChartData = totalPriceData ? {
    labels: totalPriceData.map(data => 
      new Date(data.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: '全アイテム合計価値',
        data: totalPriceData.map(data => data.total),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        fill: true
      }
    ]
  } : null

  // カテゴリ分布パイチャートデータ
  const pieChartData = trendData ? {
    labels: trendData.categoryDistribution.slice(0, 5).map(cat => cat.category),
    datasets: [
      {
        data: trendData.categoryDistribution.slice(0, 5).map(cat => cat.totalValue),
        backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  } : null

  const StatCard = ({ title, value, icon, color = 'blue' }: {
    title: string
    value: number | string
    icon: React.ReactNode
    color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red'
  }) => {
    const colorClasses = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
      red: { bg: 'bg-red-100', text: 'text-red-600' }
    }
    
    const colors = colorClasses[color]
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-md ${colors.bg}`}>
            <div className={`w-6 h-6 ${colors.text}`}>
              {icon}
            </div>
          </div>
          <div className="ml-4">
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-600">{title}</div>
          </div>
        </div>
      </div>
    )
  }

  const ItemCard = ({ item, showUpdatedAt = false }: {
    item: DashboardStats['recentItems'][0] | DashboardStats['recentUpdatedItems'][0]
    showUpdatedAt?: boolean
  }) => (
    <Link
      href={`/items?highlight=${item.id}`}
      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center space-x-3">
        {item.image ? (
          <img
            src={item.thumbnailSmall || item.image}
            alt={item.name}
            className="w-12 h-12 object-cover rounded-md"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
          <div className="text-xs text-gray-500">
            {item.category || '未分類'} • {item.folderName || '未分類'}
          </div>
          <div className="text-xs text-gray-400">
            {showUpdatedAt && item.updatedAt
              ? new Date(item.updatedAt).toLocaleDateString('ja-JP')
              : new Date(item.createdAt).toLocaleDateString('ja-JP')
            }
          </div>
        </div>
      </div>
    </Link>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-gray-600 mt-2">あなたの持ち物管理の概要</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="総アイテム数"
          value={stats.itemStats.total}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          color="blue"
        />
        <StatCard
          title="フォルダ数"
          value={stats.folderStats.total}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          }
          color="green"
        />
        <StatCard
          title="未分類アイテム"
          value={stats.itemStats.uncategorized}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="yellow"
        />
        <StatCard
          title="カテゴリ数"
          value={stats.itemStats.categories.length}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
          color="purple"
        />
      </div>

      {/* 価値サマリーカード（価格データがある場合のみ表示） */}
      {valueSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="現在の総価値"
            value={formatPrice(valueSummary.totalCurrentValue)}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            color="green"
          />
          <StatCard
            title="損益"
            value={formatPrice(valueSummary.profitLoss)}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            color={valueSummary.profitLoss >= 0 ? 'green' : 'red'}
          />
          <StatCard
            title="価格データ有りアイテム"
            value={`${valueSummary.itemsWithPriceData}/${valueSummary.totalItems}`}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
            color="blue"
          />
        </div>
      )}

      {/* 価格推移グラフ（価格データがある場合は全幅表示） */}
      {trendData && lineChartData && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">全アイテム合計価値の推移</h2>
          <div className="h-64">
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top' as const
                  }
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    ticks: {
                      callback: function(value) {
                        return formatPrice(Number(value))
                      }
                    }
                  },
                  x: {
                    ticks: { maxTicksLimit: 10 }
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* カテゴリ別統計 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">カテゴリ別分布</h2>
          {stats.itemStats.categories.length > 0 ? (
            <div className="space-y-3">
              {stats.itemStats.categories.slice(0, 5).map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">{category.category}</div>
                  <div className="text-sm font-medium text-gray-900">{category.count}件</div>
                </div>
              ))}
              {stats.itemStats.categories.length > 5 && (
                <div className="text-xs text-gray-500 text-center pt-2">
                  その他 {stats.itemStats.categories.length - 5} カテゴリ
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              まだカテゴリがありません
            </div>
          )}
        </div>

        {/* カテゴリ価値分布または フォルダ階層統計 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          {trendData && pieChartData ? (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">カテゴリ価値分布</h2>
              <div className="h-48">
                <Pie
                  data={pieChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                        labels: {
                          boxWidth: 12,
                          padding: 8,
                          font: { size: 10 }
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || ''
                            const value = formatPrice(Number(context.parsed))
                            return `${label}: ${value}`
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">フォルダ階層</h2>
              {stats.folderStats.byDepth.length > 0 ? (
                <div className="space-y-3">
                  {stats.folderStats.byDepth.map((depth) => (
                    <div key={depth.depth} className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">{depth.depth}階層目</div>
                      <div className="text-sm font-medium text-gray-900">{depth.count}個</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  まだフォルダがありません
                </div>
              )}
            </>
          )}
        </div>

        {/* 高価値アイテムまたはクイックアクション */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          {valueSummary && valueSummary.topValueItems.length > 0 ? (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">高価値アイテム</h2>
              <div className="space-y-3">
                {valueSummary.topValueItems.slice(0, 5).map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 truncate max-w-32">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500">{item.category || '未分類'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">{formatPrice(item.currentPrice)}</div>
                      {item.priceChangePercent !== null && (
                        <div className={`text-xs ${item.priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(item.priceChangePercent)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h2>
              <div className="space-y-3">
                <Link
                  href="/items/new"
                  className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  新しいアイテムを追加
                </Link>
                <Link
                  href="/items"
                  className="block w-full text-center px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  アイテム一覧を見る
                </Link>
                {stats.itemStats.uncategorized > 0 && (
                  <Link
                    href="/items?folder=uncategorized"
                    className="block w-full text-center px-4 py-3 border border-yellow-300 text-yellow-700 bg-yellow-50 rounded-md hover:bg-yellow-100 transition-colors"
                  >
                    未分類アイテムを整理 ({stats.itemStats.uncategorized}件)
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 最近のアイテム */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 最近追加したアイテム */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">最近追加したアイテム</h2>
            <Link
              href="/items?sort=newest"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              すべて見る
            </Link>
          </div>
          {stats.recentItems.length > 0 ? (
            <div className="space-y-3">
              {stats.recentItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              まだアイテムがありません
            </div>
          )}
        </div>

        {/* 最近更新したアイテム */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">最近更新したアイテム</h2>
            <Link
              href="/items?sort=updated"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              すべて見る
            </Link>
          </div>
          {stats.recentUpdatedItems.length > 0 ? (
            <div className="space-y-3">
              {stats.recentUpdatedItems.map((item) => (
                <ItemCard key={item.id} item={item} showUpdatedAt />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              最近更新されたアイテムはありません
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
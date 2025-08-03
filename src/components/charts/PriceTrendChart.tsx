'use client'

import { memo, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// Chart.jsのコンポーネントを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface PriceHistoryData {
  id: string
  searchDate: string
  minPrice?: number | null
  avgPrice?: number | null
  maxPrice?: number | null
  listingCount: number
  summary?: string
}

interface PriceTrendChartProps {
  priceHistory: PriceHistoryData[]
  className?: string
}

export const PriceTrendChart = memo(function PriceTrendChart({ 
  priceHistory, 
  className = '' 
}: PriceTrendChartProps) {
  
  const chartData = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) {
      return null
    }

    // 日付順にソート（古い順）
    const sortedHistory = [...priceHistory].sort((a, b) => 
      new Date(a.searchDate).getTime() - new Date(b.searchDate).getTime()
    )

    const labels = sortedHistory.map(item => 
      new Date(item.searchDate).toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric'
      })
    )

    const avgPrices = sortedHistory.map(item => 
      item.avgPrice ? Number(item.avgPrice) : null
    )

    const minPrices = sortedHistory.map(item => 
      item.minPrice ? Number(item.minPrice) : null
    )

    const maxPrices = sortedHistory.map(item => 
      item.maxPrice ? Number(item.maxPrice) : null
    )

    return {
      labels,
      datasets: [
        {
          label: '平均価格',
          data: avgPrices,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.3,
          fill: true,
        },
        {
          label: '最高価格',
          data: maxPrices,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          borderWidth: 2,
          pointBackgroundColor: 'rgb(239, 68, 68)',
          pointBorderColor: 'white',
          pointBorderWidth: 1,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.3,
          borderDash: [5, 5],
        },
        {
          label: '最低価格',
          data: minPrices,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.05)',
          borderWidth: 2,
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: 'white',
          pointBorderWidth: 1,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.3,
          borderDash: [5, 5],
        },
      ],
    }
  }, [priceHistory])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: '価格推移',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(156, 163, 175, 0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            if (value !== null) {
              return `${label}: ¥${value.toLocaleString()}`
            }
            return undefined
          },
          afterBody: function(context: any) {
            if (context.length > 0) {
              const dataIndex = context[0].dataIndex
              const historyItem = priceHistory[dataIndex]
              if (historyItem?.listingCount) {
                return [`出品件数: ${historyItem.listingCount}件`]
              }
            }
            return []
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '調査日',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: '価格 (円)',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        ticks: {
          callback: function(value: any) {
            return '¥' + value.toLocaleString()
          },
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    elements: {
      point: {
        hoverBorderWidth: 3,
      },
    },
  }), [priceHistory])

  if (!chartData) {
    return (
      <div className={`bg-gray-50 rounded-lg border border-gray-200 p-8 text-center ${className}`}>
        <svg className="mx-auto w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-base font-medium text-gray-900 mb-1">価格推移データなし</h3>
        <p className="text-sm text-gray-500">
          価格調査を複数回実行すると、価格の推移をグラフで確認できます
        </p>
      </div>
    )
  }

  if (priceHistory.length === 1) {
    return (
      <div className={`bg-blue-50 rounded-lg border border-blue-200 p-6 text-center ${className}`}>
        <svg className="mx-auto w-10 h-10 text-blue-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-base font-medium text-blue-900 mb-1">価格調査を追加で実行してください</h3>
        <p className="text-sm text-blue-700">
          現在1回の調査結果のみです。推移を表示するには2回以上の調査が必要です
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div style={{ height: '320px' }}>
        <Line data={chartData} options={options} />
      </div>
      
      {/* グラフの説明 */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>平均価格（実線）</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-1 bg-red-500 mr-2" style={{ borderStyle: 'dashed', borderWidth: '1px 0' }}></div>
            <span>最高価格（破線）</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-1 bg-green-500 mr-2" style={{ borderStyle: 'dashed', borderWidth: '1px 0' }}></div>
            <span>最低価格（破線）</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          グラフポイントにマウスを合わせると詳細情報が表示されます
        </p>
      </div>
    </div>
  )
})
'use client'

import { useEffect, useState } from 'react'
import { performanceProfiler } from '@/hooks/usePerformanceProfiler'

interface ComponentMetrics {
  renderCount: number
  averageRenderTime: number
  lastRenderTime: number
  maxRenderTime: number
  totalRenderTime: number
}

export function PerformanceMonitor() {
  const [isOpen, setIsOpen] = useState(false)
  const [metrics, setMetrics] = useState<Map<string, ComponentMetrics>>(new Map())
  const [refreshInterval, setRefreshInterval] = useState(1000)

  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setMetrics(new Map(performanceProfiler.getMetrics()))
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [isOpen, refreshInterval])

  const slowComponents = Array.from(metrics.entries())
    .filter(([_, metrics]) => metrics.averageRenderTime > 16 || metrics.maxRenderTime > 50)
    .sort(([, a], [, b]) => b.averageRenderTime - a.averageRenderTime)

  const allComponents = Array.from(metrics.entries())
    .sort(([, a], [, b]) => b.renderCount - a.renderCount)

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-red-600 text-white px-3 py-2 rounded-full shadow-lg hover:bg-red-700 text-sm font-mono"
          title="Open Performance Monitor"
        >
          🔍 Perf
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl w-96 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b px-4 py-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Performance Monitor</h3>
        <div className="flex items-center space-x-2">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="text-xs border rounded px-2 py-1"
          >
            <option value={500}>500ms</option>
            <option value={1000}>1s</option>
            <option value={2000}>2s</option>
          </select>
          <button
            onClick={() => performanceProfiler.reset()}
            className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
          >
            Reset
          </button>
          <button
            onClick={() => performanceProfiler.printReport()}
            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
          >
            Log
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-80 overflow-y-auto">
        {/* Slow Components Warning */}
        {slowComponents.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-red-600 mb-2">⚠️ Slow Components</h4>
            <div className="space-y-1">
              {slowComponents.slice(0, 5).map(([name, metrics]) => (
                <div
                  key={name}
                  className="text-xs bg-red-50 border border-red-200 rounded px-2 py-1"
                >
                  <div className="font-mono text-red-800">{name}</div>
                  <div className="text-red-600">
                    Avg: {metrics.averageRenderTime.toFixed(1)}ms | 
                    Max: {metrics.maxRenderTime.toFixed(1)}ms |
                    Renders: {metrics.renderCount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Components */}
        <div>
          <h4 className="text-xs font-semibold text-gray-600 mb-2">📊 All Components</h4>
          <div className="space-y-1">
            {allComponents.slice(0, 10).map(([name, metrics]) => (
              <div
                key={name}
                className={`text-xs rounded px-2 py-1 ${
                  metrics.averageRenderTime > 16
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="font-mono text-gray-800">{name}</div>
                <div className="text-gray-600">
                  Avg: {metrics.averageRenderTime.toFixed(1)}ms |
                  Max: {metrics.maxRenderTime.toFixed(1)}ms |
                  Count: {metrics.renderCount}
                </div>
              </div>
            ))}
          </div>
        </div>

        {metrics.size === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            No performance data yet.<br />
            Navigate around the app to see metrics.
          </div>
        )}
      </div>
    </div>
  )
}
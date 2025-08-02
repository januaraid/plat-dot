'use client'

import { useEffect, useRef } from 'react'

interface PerformanceEntry {
  name: string
  duration: number
  timestamp: number
  stack?: string
}

interface ComponentMetrics {
  renderCount: number
  averageRenderTime: number
  lastRenderTime: number
  maxRenderTime: number
  totalRenderTime: number
}

class PerformanceProfiler {
  private static instance: PerformanceProfiler
  private metrics: Map<string, ComponentMetrics> = new Map()
  private entries: PerformanceEntry[] = []
  private isEnabled = true

  static getInstance(): PerformanceProfiler {
    if (!PerformanceProfiler.instance) {
      PerformanceProfiler.instance = new PerformanceProfiler()
    }
    return PerformanceProfiler.instance
  }

  startMeasure(name: string): string {
    if (!this.isEnabled) return ''
    const measureId = `${name}_${Date.now()}_${Math.random()}`
    performance.mark(`${measureId}_start`)
    return measureId
  }

  endMeasure(measureId: string, componentName: string): number {
    if (!this.isEnabled || !measureId) return 0
    
    const endMark = `${measureId}_end`
    const startMark = `${measureId}_start`
    
    performance.mark(endMark)
    performance.measure(measureId, startMark, endMark)
    
    const entries = performance.getEntriesByName(measureId)
    const duration = entries[0]?.duration || 0
    
    // Clean up marks
    performance.clearMarks(startMark)
    performance.clearMarks(endMark)
    performance.clearMeasures(measureId)
    
    this.updateMetrics(componentName, duration)
    this.entries.push({
      name: componentName,
      duration,
      timestamp: Date.now(),
      stack: new Error().stack
    })
    
    return duration
  }

  private updateMetrics(componentName: string, duration: number) {
    const existing = this.metrics.get(componentName) || {
      renderCount: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      maxRenderTime: 0,
      totalRenderTime: 0
    }

    existing.renderCount++
    existing.lastRenderTime = duration
    existing.totalRenderTime += duration
    existing.averageRenderTime = existing.totalRenderTime / existing.renderCount
    existing.maxRenderTime = Math.max(existing.maxRenderTime, duration)

    this.metrics.set(componentName, existing)
  }

  getMetrics(): Map<string, ComponentMetrics> {
    return new Map(this.metrics)
  }

  getSlowComponents(threshold = 16): Array<{ name: string, metrics: ComponentMetrics }> {
    const slow: Array<{ name: string, metrics: ComponentMetrics }> = []
    
    this.metrics.forEach((metrics, name) => {
      if (metrics.averageRenderTime > threshold || metrics.maxRenderTime > threshold) {
        slow.push({ name, metrics })
      }
    })
    
    return slow.sort((a, b) => b.metrics.averageRenderTime - a.metrics.averageRenderTime)
  }

  getRecentEntries(limit = 100): PerformanceEntry[] {
    return this.entries.slice(-limit)
  }

  printReport() {
    console.group('🔍 Performance Profile Report')
    
    const slowComponents = this.getSlowComponents()
    if (slowComponents.length > 0) {
      console.group('⚠️ Slow Components (>16ms)')
      slowComponents.forEach(({ name, metrics }) => {
        console.log(`${name}:`, {
          renderCount: metrics.renderCount,
          avgTime: `${metrics.averageRenderTime.toFixed(2)}ms`,
          maxTime: `${metrics.maxRenderTime.toFixed(2)}ms`,
          totalTime: `${metrics.totalRenderTime.toFixed(2)}ms`
        })
      })
      console.groupEnd()
    }

    console.group('📊 All Component Metrics')
    this.metrics.forEach((metrics, name) => {
      console.log(`${name}:`, {
        renders: metrics.renderCount,
        avg: `${metrics.averageRenderTime.toFixed(2)}ms`,
        max: `${metrics.maxRenderTime.toFixed(2)}ms`
      })
    })
    console.groupEnd()

    const recentSlow = this.getRecentEntries(20).filter(entry => entry.duration > 16)
    if (recentSlow.length > 0) {
      console.group('🚨 Recent Slow Renders')
      recentSlow.forEach(entry => {
        console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms at ${new Date(entry.timestamp).toLocaleTimeString()}`)
      })
      console.groupEnd()
    }

    console.groupEnd()
  }

  reset() {
    this.metrics.clear()
    this.entries = []
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }
}

export function usePerformanceProfiler(componentName: string, enabled = true) {
  const profiler = PerformanceProfiler.getInstance()
  const renderStartRef = useRef<string>('')
  const renderCountRef = useRef(0)

  useEffect(() => {
    profiler.setEnabled(enabled)
  }, [enabled, profiler])

  // Start measuring render
  useEffect(() => {
    if (!enabled) return
    renderStartRef.current = profiler.startMeasure(`${componentName}_render`)
    renderCountRef.current++
  })

  // End measuring render
  useEffect(() => {
    if (!enabled || !renderStartRef.current) return
    
    const duration = profiler.endMeasure(renderStartRef.current, componentName)
    
    // Log slow renders immediately
    if (duration > 16) {
      console.warn(`🐌 Slow render detected: ${componentName} took ${duration.toFixed(2)}ms (render #${renderCountRef.current})`)
    }
    
    return () => {
      renderStartRef.current = ''
    }
  })

  return {
    getMetrics: () => profiler.getMetrics(),
    getSlowComponents: (threshold?: number) => profiler.getSlowComponents(threshold),
    printReport: () => profiler.printReport(),
    reset: () => profiler.reset()
  }
}

// Global performance monitoring utilities
export const performanceProfiler = PerformanceProfiler.getInstance()

// Add to window for debugging
if (typeof window !== 'undefined') {
  ;(window as any).__performanceProfiler = performanceProfiler
}
'use client'

import { useEffect, useCallback, useRef, useMemo } from 'react'
import { usePerformanceProfiler } from '@/hooks/usePerformanceProfiler'

interface UseFormPersistenceOptions {
  key: string
  data: any
  exclude?: string[]
  debounceMs?: number
  saveFocus?: boolean
}

export function useFormPersistence({
  key,
  data,
  exclude = [],
  debounceMs = 300,
  saveFocus = false
}: UseFormPersistenceOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  // Performance profiling
  usePerformanceProfiler('useFormPersistence')
  const initializedRef = useRef(false)
  const focusKeyPrefix = `${key}-focus`

  // ローカルストレージからデータを復元
  const loadFromStorage = useCallback((): any => {
    if (typeof window === 'undefined') return null
    
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed
      }
    } catch (error) {
      console.error(`[FormPersistence] Error loading data for key: ${key}`, error)
    }
    return null
  }, [key])

  // ローカルストレージにデータを保存
  const saveToStorage = useCallback((dataToSave: any) => {
    if (typeof window === 'undefined') return
    
    try {
      // 除外フィールドを除いたデータを作成
      const filteredData = { ...dataToSave }
      exclude.forEach(field => {
        delete filteredData[field]
      })
      
      const serialized = JSON.stringify(filteredData)
      localStorage.setItem(key, serialized)
    } catch (error) {
      console.error(`[FormPersistence] Error saving data for key: ${key}`, error)
    }
  }, [key, exclude])

  // フォーカス位置を保存
  const saveFocusPosition = useCallback((elementId: string) => {
    if (!saveFocus || typeof window === 'undefined') return
    
    try {
      localStorage.setItem(focusKeyPrefix, elementId)
    } catch (error) {
      console.error(`[FormPersistence] Error saving focus position:`, error)
    }
  }, [focusKeyPrefix, saveFocus])

  // フォーカス位置を復元
  const restoreFocusPosition = useCallback(() => {
    if (!saveFocus || typeof window === 'undefined') return null
    
    try {
      const savedFocus = localStorage.getItem(focusKeyPrefix)
      if (savedFocus) {
        return savedFocus
      }
    } catch (error) {
      console.error(`[FormPersistence] Error loading focus position:`, error)
    }
    return null
  }, [focusKeyPrefix, saveFocus])

  // フォーカス位置をクリア
  const clearFocusPosition = useCallback(() => {
    if (!saveFocus || typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(focusKeyPrefix)
    } catch (error) {
      console.error(`[FormPersistence] Error clearing focus position:`, error)
    }
  }, [focusKeyPrefix, saveFocus])

  // ローカルストレージからデータを削除
  const clearStorage = useCallback(() => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(key)
      if (saveFocus) {
        localStorage.removeItem(focusKeyPrefix)
      }
    } catch (error) {
      console.error(`[FormPersistence] Error clearing data for key: ${key}`, error)
    }
  }, [key, saveFocus, focusKeyPrefix])

  // デバウンスされた保存
  const debouncedSave = useCallback((dataToSave: any) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      saveToStorage(dataToSave)
    }, debounceMs)
  }, [saveToStorage, debounceMs])

  // データの変更を検知するためのメモ化（より軽量な比較）
  const dataStringified = useMemo(() => {
    if (!data || typeof data !== 'object') return JSON.stringify(data)
    
    // 除外フィールドを除いたデータでのみ比較
    const filteredData = { ...data }
    exclude.forEach(field => {
      delete filteredData[field]
    })
    return JSON.stringify(filteredData)
  }, [data, exclude])
  
  const previousDataRef = useRef<string>()
  
  // データが実際に変更された時の自動保存
  useEffect(() => {
    // 初期化が完了し、実際にデータが変更された場合のみ保存
    if (initializedRef.current && data && dataStringified !== previousDataRef.current) {
      previousDataRef.current = dataStringified
      debouncedSave(data)
    }
  }, [dataStringified, data, debouncedSave])

  // 初期化フラグを設定
  useEffect(() => {
    initializedRef.current = true
  }, [])

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    loadFromStorage,
    saveToStorage,
    clearStorage,
    debouncedSave,
    saveFocusPosition,
    restoreFocusPosition,
    clearFocusPosition
  }
}
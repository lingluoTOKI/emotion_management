/**
 * 数据管理工具
 * Data Management Utility
 */

export interface StorageItem<T = any> {
  data: T
  timestamp: number
  version: string
  expiry?: number
}

/**
 * 数据管理器
 */
export class DataManager {
  private static readonly VERSION = '1.0.0'
  private static readonly DEFAULT_EXPIRY = 24 * 60 * 60 * 1000 // 24小时

  /**
   * 保存数据到LocalStorage（带过期时间和版本控制）
   */
  static setItem<T>(key: string, data: T, expiryHours: number = 24): void {
    try {
      const item: StorageItem<T> = {
        data,
        timestamp: Date.now(),
        version: this.VERSION,
        expiry: Date.now() + (expiryHours * 60 * 60 * 1000)
      }
      
      localStorage.setItem(key, JSON.stringify(item))
    } catch (error) {
      console.warn(`Failed to save data to localStorage: ${key}`, error)
    }
  }

  /**
   * 从LocalStorage获取数据（自动检查过期和版本）
   */
  static getItem<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return null

      const item: StorageItem<T> = JSON.parse(stored)
      
      // 检查版本
      if (item.version !== this.VERSION) {
        console.warn(`Data version mismatch for ${key}, clearing...`)
        this.removeItem(key)
        return null
      }

      // 检查过期时间
      if (item.expiry && Date.now() > item.expiry) {
        console.warn(`Data expired for ${key}, clearing...`)
        this.removeItem(key)
        return null
      }

      return item.data
    } catch (error) {
      console.warn(`Failed to get data from localStorage: ${key}`, error)
      return null
    }
  }

  /**
   * 删除LocalStorage中的数据
   */
  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Failed to remove data from localStorage: ${key}`, error)
    }
  }

  /**
   * 清理过期数据
   */
  static cleanExpiredData(): void {
    try {
      const keys = Object.keys(localStorage)
      
      for (const key of keys) {
        try {
          const stored = localStorage.getItem(key)
          if (!stored) continue

          const item: StorageItem = JSON.parse(stored)
          
          // 如果有过期时间且已过期，则删除
          if (item.expiry && Date.now() > item.expiry) {
            localStorage.removeItem(key)
            console.log(`Cleaned expired data: ${key}`)
          }
        } catch (error) {
          // 忽略解析错误，可能是其他非结构化数据
          continue
        }
      }
    } catch (error) {
      console.warn('Failed to clean expired data', error)
    }
  }

  /**
   * 获取数据大小（估算）
   */
  static getStorageSize(): number {
    let total = 0
    try {
      for (const key of Object.keys(localStorage)) {
        const value = localStorage.getItem(key)
        if (value) {
          total += key.length + value.length
        }
      }
    } catch (error) {
      console.warn('Failed to calculate storage size', error)
    }
    return total
  }

  /**
   * 检查存储空间使用情况
   */
  static checkStorageHealth(): {
    size: number
    sizeFormatted: string
    itemCount: number
    expiredCount: number
  } {
    const size = this.getStorageSize()
    const itemCount = Object.keys(localStorage).length
    let expiredCount = 0

    try {
      for (const key of Object.keys(localStorage)) {
        try {
          const stored = localStorage.getItem(key)
          if (!stored) continue

          const item: StorageItem = JSON.parse(stored)
          if (item.expiry && Date.now() > item.expiry) {
            expiredCount++
          }
        } catch (error) {
          // 忽略解析错误
          continue
        }
      }
    } catch (error) {
      console.warn('Failed to check storage health', error)
    }

    return {
      size,
      sizeFormatted: this.formatBytes(size),
      itemCount,
      expiredCount
    }
  }

  /**
   * 格式化字节数
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

/**
 * AI评估数据管理
 */
export class AIAssessmentDataManager {
  private static readonly KEY_PREFIX = 'ai_assessment_'

  /**
   * 保存AI评估结果
   */
  static saveAssessmentResult(sessionId: string, result: any): void {
    const key = `${this.KEY_PREFIX}${sessionId}`
    DataManager.setItem(key, result, 168) // 保存7天
  }

  /**
   * 获取AI评估结果
   */
  static getAssessmentResult(sessionId: string): any | null {
    const key = `${this.KEY_PREFIX}${sessionId}`
    return DataManager.getItem(key)
  }

  /**
   * 删除AI评估结果
   */
  static removeAssessmentResult(sessionId: string): void {
    const key = `${this.KEY_PREFIX}${sessionId}`
    DataManager.removeItem(key)
  }

  /**
   * 获取所有AI评估结果
   */
  static getAllAssessmentResults(): Record<string, any> {
    const results: Record<string, any> = {}
    
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith(this.KEY_PREFIX)) {
          const sessionId = key.replace(this.KEY_PREFIX, '')
          const result = DataManager.getItem(key)
          if (result) {
            results[sessionId] = result
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get all assessment results', error)
    }
    
    return results
  }

  /**
   * 清理所有AI评估数据
   */
  static clearAllAssessmentData(): void {
    try {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith(this.KEY_PREFIX)) {
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.warn('Failed to clear assessment data', error)
    }
  }
}

/**
 * 传统评估数据管理
 */
export class TraditionalAssessmentDataManager {
  private static readonly KEY_PREFIX = 'traditional_assessment_'

  /**
   * 保存传统评估结果
   */
  static saveAssessmentResult(assessmentId: string, result: any): void {
    const key = `${this.KEY_PREFIX}${assessmentId}`
    DataManager.setItem(key, result, 168) // 保存7天
  }

  /**
   * 获取传统评估结果
   */
  static getAssessmentResult(assessmentId: string): any | null {
    const key = `${this.KEY_PREFIX}${assessmentId}`
    return DataManager.getItem(key)
  }

  /**
   * 删除传统评估结果
   */
  static removeAssessmentResult(assessmentId: string): void {
    const key = `${this.KEY_PREFIX}${assessmentId}`
    DataManager.removeItem(key)
  }
}

// 初始化时清理过期数据
if (typeof window !== 'undefined') {
  // 页面加载时清理过期数据
  DataManager.cleanExpiredData()
  
  // 定期清理过期数据（每小时）
  setInterval(() => {
    DataManager.cleanExpiredData()
  }, 60 * 60 * 1000)
}

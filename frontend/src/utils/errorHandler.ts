/**
 * 统一错误处理工具
 * Unified Error Handling Utility
 */

export interface ErrorInfo {
  message: string
  code?: string
  details?: any
}

export class AppError extends Error {
  public code?: string
  public details?: any

  constructor(message: string, code?: string, details?: any) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
  }
}

/**
 * 错误处理器
 */
export class ErrorHandler {
  /**
   * 显示错误通知
   */
  static showError(error: Error | string, context?: string): void {
    const errorMessage = typeof error === 'string' ? error : error.message
    
    // 在控制台记录详细错误信息
    if (typeof error === 'object') {
      console.error(`[${context || 'Error'}]`, error)
    } else {
      console.error(`[${context || 'Error'}]`, errorMessage)
    }

    // 显示用户友好的错误信息
    this.displayUserFriendlyError(errorMessage, context)
  }

  /**
   * 显示用户友好的错误信息
   */
  private static displayUserFriendlyError(message: string, context?: string): void {
    // 这里可以集成Toast通知库，目前使用简单的alert
    const friendlyMessage = this.getFriendlyMessage(message, context)
    
    // 可以替换为Toast通知
    if (typeof window !== 'undefined') {
      // 创建一个简单的错误提示
      this.showToast(friendlyMessage, 'error')
    }
  }

  /**
   * 获取用户友好的错误信息
   */
  private static getFriendlyMessage(message: string, context?: string): string {
    // 常见错误映射
    const errorMappings: Record<string, string> = {
      'Failed to fetch': '网络连接失败，请检查网络连接',
      'Network request failed': '网络请求失败，请稍后重试',
      '401': '认证失败，请重新登录',
      '403': '权限不足，无法访问该资源',
      '404': '请求的资源不存在',
      '500': '服务器内部错误，请稍后重试',
      '检测到测试token': '请使用真实账号登录以获得完整功能',
      '当前使用临时登录模式': '后端服务未运行，功能受限'
    }

    // 查找匹配的错误映射
    for (const [key, value] of Object.entries(errorMappings)) {
      if (message.includes(key)) {
        return value
      }
    }

    // 根据上下文提供更具体的错误信息
    if (context) {
      switch (context) {
        case 'AI聊天':
          return `AI聊天功能暂时不可用：${message}`
        case '评估':
          return `评估功能出现问题：${message}`
        case '登录':
          return `登录失败：${message}`
        default:
          return `${context}出现错误：${message}`
      }
    }

    return message
  }

  /**
   * 简单的Toast通知实现
   */
  private static showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    // 创建Toast元素
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`
    
    // 根据类型设置样式
    const styles = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      warning: 'bg-yellow-500 text-white',
      info: 'bg-blue-500 text-white'
    }
    
    toast.className += ` ${styles[type]}`
    toast.textContent = message
    
    // 添加到DOM
    document.body.appendChild(toast)
    
    // 动画显示
    setTimeout(() => {
      toast.classList.remove('translate-x-full')
    }, 100)
    
    // 自动隐藏
    setTimeout(() => {
      toast.classList.add('translate-x-full')
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 300)
    }, 5000)
  }

  /**
   * 处理API错误
   */
  static handleApiError(error: any, context?: string): void {
    if (error?.response?.status) {
      const status = error.response.status
      const message = error.response.data?.message || error.message
      this.showError(`HTTP ${status}: ${message}`, context)
    } else if (error?.message) {
      this.showError(error.message, context)
    } else {
      this.showError('未知错误', context)
    }
  }

  /**
   * 处理表单验证错误
   */
  static handleValidationError(errors: Record<string, string>): void {
    const firstError = Object.values(errors)[0]
    if (firstError) {
      this.showError(firstError, '表单验证')
    }
  }

  /**
   * 显示成功信息
   */
  static showSuccess(message: string): void {
    this.showToast(message, 'success')
  }

  /**
   * 显示警告信息
   */
  static showWarning(message: string): void {
    this.showToast(message, 'warning')
  }

  /**
   * 显示信息提示
   */
  static showInfo(message: string): void {
    this.showToast(message, 'info')
  }
}

/**
 * 便捷的错误处理函数
 */
export const handleError = (error: Error | string, context?: string) => {
  ErrorHandler.showError(error, context)
}

export const handleApiError = (error: any, context?: string) => {
  ErrorHandler.handleApiError(error, context)
}

export const showSuccess = (message: string) => {
  ErrorHandler.showSuccess(message)
}

export const showWarning = (message: string) => {
  ErrorHandler.showWarning(message)
}

export const showInfo = (message: string) => {
  ErrorHandler.showInfo(message)
}

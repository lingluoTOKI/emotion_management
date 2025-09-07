'use client'

import { useEffect } from 'react'
import { preventExtensionConflicts, protectGlobalObjects } from '@/utils/browser-extension-compatibility'

export function BrowserExtensionHandler() {
  useEffect(() => {
    // 初始化浏览器扩展兼容性处理
    preventExtensionConflicts()
    protectGlobalObjects()
    
    // 添加全局错误处理器
    const handleGlobalError = (event: ErrorEvent) => {
      const message = event.message || ''
      const filename = event.filename || ''
      
      // 忽略扩展脚本错误
      if (filename.includes('content_scripts') || 
          filename.includes('extension') ||
          message.includes('Cannot read properties of null') ||
          message.includes('Cannot read properties of undefined')) {
        event.preventDefault()
        event.stopPropagation()
        return false
      }
      
      return true
    }
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.toString() || ''
      
      // 忽略扩展相关的Promise拒绝
      if (reason.includes('content_scripts') || 
          reason.includes('extension') ||
          reason.includes('Cannot read properties of null')) {
        event.preventDefault()
        return false
      }
      
      return true
    }
    
    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])
  
  return null // 这是一个逻辑组件，不渲染任何UI
}

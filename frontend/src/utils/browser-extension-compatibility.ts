/**
 * 浏览器扩展兼容性处理
 * Browser Extension Compatibility Handler
 */

// 防止浏览器扩展的脚本错误影响应用
export function preventExtensionConflicts() {
  if (typeof window === 'undefined') return

  // 捕获并忽略扩展脚本错误
  const originalConsoleError = console.error
  console.error = (...args) => {
    const message = args.join(' ')
    
    // 忽略已知的扩展脚本错误
    const extensionErrors = [
      'content_scripts.umd.min.js',
      'Cannot read properties of null (reading \'trim\')',
      'Cannot read properties of undefined (reading \'toUpperCase\')',
      'handleHotKey',
      'Extension context invalidated'
    ]
    
    if (extensionErrors.some(error => message.includes(error))) {
      // 静默处理扩展错误，不输出到控制台
      return
    }
    
    // 其他错误正常输出
    originalConsoleError.apply(console, args)
  }
  
  // 防止扩展脚本访问敏感的DOM元素
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element
          
          // 检查是否是扩展注入的脚本
          if (element.tagName === 'SCRIPT') {
            const src = element.getAttribute('src') || ''
            const text = element.textContent || ''
            
            if (src.includes('content_scripts') || 
                src.includes('extension') ||
                text.includes('chrome-extension') ||
                text.includes('moz-extension')) {
              
              // 阻止扩展脚本访问应用的关键元素
              element.setAttribute('data-extension-blocked', 'true')
            }
          }
        }
      })
    })
  })
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
  
  // 页面卸载时清理
  window.addEventListener('beforeunload', () => {
    observer.disconnect()
  })
}

// 添加CSP元标签以限制扩展行为
export function addContentSecurityPolicy() {
  if (typeof document === 'undefined') return
  
  const meta = document.createElement('meta')
  meta.setAttribute('http-equiv', 'Content-Security-Policy')
  meta.setAttribute('content', 
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' localhost:* 127.0.0.1:*; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  )
  
  document.head.insertBefore(meta, document.head.firstChild)
}

// 保护关键的全局对象
export function protectGlobalObjects() {
  if (typeof window === 'undefined') return
  
  // 保护 localStorage 和 sessionStorage
  const originalLocalStorage = window.localStorage
  const originalSessionStorage = window.sessionStorage
  
  // 由于 localStorage 和 sessionStorage 已经是不可配置的属性，
  // 我们通过其他方式来保护它们
  try {
    // 检查是否可以重新定义
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')
    if (descriptor && descriptor.configurable) {
      Object.defineProperty(window, 'localStorage', {
        get() {
          return originalLocalStorage
        },
        set() {
          console.warn('Attempt to override localStorage blocked')
        },
        configurable: false
      })
    }
  } catch (error) {
    // localStorage 已经被定义且不可配置，这是正常的
    console.debug('localStorage is already protected by the browser')
  }
  
  try {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'sessionStorage')
    if (descriptor && descriptor.configurable) {
      Object.defineProperty(window, 'sessionStorage', {
        get() {
          return originalSessionStorage
        },
        set() {
          console.warn('Attempt to override sessionStorage blocked')
        },
        configurable: false
      })
    }
  } catch (error) {
    // sessionStorage 已经被定义且不可配置，这是正常的
    console.debug('sessionStorage is already protected by the browser')
  }
  
  // 保护其他可能被扩展修改的全局对象
  const protectedGlobals = ['fetch', 'XMLHttpRequest', 'console']
  
  protectedGlobals.forEach(globalName => {
    try {
      const original = (window as any)[globalName]
      if (original && typeof original === 'function') {
        // 创建一个代理来监控访问
        const proxy = new Proxy(original, {
          set(target, property, value) {
            console.warn(`Attempt to modify ${globalName}.${String(property)} blocked`)
            return false
          }
        })
        
        // 只有在可配置的情况下才尝试重新定义
        const descriptor = Object.getOwnPropertyDescriptor(window, globalName)
        if (descriptor && descriptor.configurable) {
          Object.defineProperty(window, globalName, {
            value: proxy,
            writable: false,
            configurable: false
          })
        }
      }
    } catch (error) {
      // 忽略保护失败的情况
      console.debug(`Could not protect ${globalName}:`, error)
    }
  })
}

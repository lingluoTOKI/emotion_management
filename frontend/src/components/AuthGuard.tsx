'use client'

/**
 * 认证保护组件
 * Authentication Guard Component
 */

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, Lock, AlertCircle } from 'lucide-react'
import { getUserInfo, getDefaultDashboardPath } from '@/lib/auth'
import { requiresAuth, checkRoleAccess } from '@/lib/navigation'
import type { UserInfo } from '@/lib/auth'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserInfo['role']
  fallbackPath?: string
}

export default function AuthGuard({ 
  children, 
  requiredRole,
  fallbackPath 
}: AuthGuardProps) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = () => {
      try {
        const userInfo = getUserInfo()
        
        // 检查是否需要认证
        if (requiresAuth(pathname) && !userInfo) {
          router.push('/')
          return
        }
        
        // 检查角色权限
        if (userInfo && requiredRole && userInfo.role !== requiredRole && userInfo.role !== 'admin') {
          setError(`无权限访问此页面，需要${requiredRole}角色`)
          setTimeout(() => {
            router.push(getDefaultDashboardPath(userInfo.role))
          }, 2000)
          return
        }
        
        // 检查路径权限
        if (userInfo && !checkRoleAccess(pathname, userInfo.role)) {
          setError('无权限访问此页面')
          setTimeout(() => {
            router.push(getDefaultDashboardPath(userInfo.role))
          }, 2000)
          return
        }
        
        setUser(userInfo)
        setError(null)
      } catch (err) {
        console.error('认证检查失败:', err)
        setError('认证检查失败')
        router.push('/')
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [pathname, requiredRole, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">正在验证身份...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md mx-4"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">访问受限</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>正在重定向...</span>
          </div>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * 需要特定角色的页面包装器
 */
export function RequireRole({ 
  role, 
  children 
}: { 
  role: UserInfo['role']
  children: React.ReactNode 
}) {
  return (
    <AuthGuard requiredRole={role}>
      {children}
    </AuthGuard>
  )
}

/**
 * 需要登录的页面包装器
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  )
}

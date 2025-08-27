'use client'

/**
 * 仪表板布局组件
 * Dashboard Layout Component
 */

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, X, LogOut, Search, User, Settings,
  ChevronRight, Home, ChevronDown, ChevronUp
} from 'lucide-react'
import { getUserInfo, logout } from '@/lib/auth'
import { getNavigationForRole, generateBreadcrumbs, getPageTitle } from '@/lib/navigation'
import type { UserInfo } from '@/lib/auth'
import type { NavigationItem, BreadcrumbItem } from '@/lib/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  
  const router = useRouter()
  const pathname = usePathname()
  
  const breadcrumbs = generateBreadcrumbs(pathname)
  const pageTitle = title || getPageTitle(pathname)

  useEffect(() => {
    const userInfo = getUserInfo()
    setUser(userInfo)
  }, [])

  useEffect(() => {
    // 自动展开当前路径的父级菜单
    const pathSegments = pathname.split('/').filter(Boolean)
    if (pathSegments.length > 1) {
      setExpandedItems([pathSegments[0]])
    }
  }, [pathname])

  const navigation = user ? getNavigationForRole(user.role) : []

  const handleLogout = () => {
    logout()
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const navigateToItem = (item: NavigationItem) => {
    if (item.children && item.children.length > 0) {
      toggleExpanded(item.label)
    } else {
      router.push(item.href)
      setSidebarOpen(false)
    }
  }

  // 检查菜单项是否激活（包括子菜单）
  const isItemActive = (item: NavigationItem): boolean => {
    if (pathname === item.href) return true
    if (item.children) {
      return item.children.some(child => pathname === child.href)
    }
    return false
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 侧边栏 */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* 遮罩层 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            />
            
            {/* 侧边栏内容 */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 lg:hidden"
            >
            <SidebarContent 
              navigation={navigation}
              expandedItems={expandedItems}
              pathname={pathname}
              user={user}
              onNavigate={navigateToItem}
              onClose={() => setSidebarOpen(false)}
              isItemActive={isItemActive}
            />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 桌面端侧边栏 */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-30">
        <SidebarContent 
          navigation={navigation}
          expandedItems={expandedItems}
          pathname={pathname}
          user={user}
          onNavigate={navigateToItem}
          isItemActive={isItemActive}
        />
      </div>

      {/* 主内容区域 */}
      <div className="lg:ml-64">
        {/* 顶部导航栏 */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* 左侧：菜单按钮和面包屑 */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleSidebar}
                  className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
                >
                  <Menu className="w-6 h-6" />
                </button>
                
                <nav className="hidden sm:flex items-center space-x-2 text-sm">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.href || index} className="flex items-center">
                      {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />}
                      {crumb.href && index < breadcrumbs.length - 1 ? (
                        <button
                          onClick={() => router.push(crumb.href!)}
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          {crumb.label}
                        </button>
                      ) : (
                        <span className="text-gray-900 font-medium">{crumb.label}</span>
                      )}
                    </div>
                  ))}
                </nav>
              </div>

              {/* 右侧：用户菜单 */}
              <div className="flex items-center space-x-4">
                {/* 用户菜单 */}
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.name || user?.username}</p>
                    <p className="text-xs text-gray-500">
                      {user?.role === 'admin' ? '管理员' : 
                       user?.role === 'student' ? '学生' : 
                       user?.role === 'counselor' ? '咨询师' : '用户'}
                    </p>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">退出</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 页面标题 */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          </div>
        </div>

        {/* 主要内容 */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

// 侧边栏内容组件
function SidebarContent({ 
  navigation, 
  expandedItems, 
  pathname, 
  user, 
  onNavigate, 
  onClose,
  isItemActive
}: {
  navigation: NavigationItem[]
  expandedItems: string[]
  pathname: string
  user: UserInfo | null
  onNavigate: (item: NavigationItem) => void
  onClose?: () => void
  isItemActive: (item: NavigationItem) => boolean
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo区域 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">心</span>
          </div>
          <span className="font-bold text-gray-900">情绪管理系统</span>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => (
          <NavigationItemComponent
            key={item.label}
            item={item}
            isExpanded={expandedItems.includes(item.label)}
            isActive={isItemActive(item)}
            onClick={() => onNavigate(item)}
          />
        ))}
      </nav>

      {/* 用户信息 */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || user?.username}
            </p>
            <p className="text-xs text-gray-500">
              {user?.role === 'admin' ? '管理员' : 
               user?.role === 'student' ? '学生' : 
               user?.role === 'counselor' ? '咨询师' : '用户'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// 导航项组件
function NavigationItemComponent({ 
  item, 
  isExpanded, 
  isActive, 
  onClick 
}: {
  item: NavigationItem
  isExpanded: boolean
  isActive: boolean
  onClick: () => void
}) {
  const hasChildren = item.children && item.children.length > 0
  const router = useRouter()
  const pathname = usePathname()

  const handleChildClick = (href: string) => {
    router.push(href)
  }

  return (
    <div>
      <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
          isActive 
            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <span className="font-medium">{item.label}</span>
        {hasChildren && (
          isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* 子菜单 */}
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-4 mt-2 space-y-1 overflow-hidden"
          >
            {item.children!.map((child) => (
              <button
                key={child.href}
                onClick={() => handleChildClick(child.href)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  pathname === child.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {child.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

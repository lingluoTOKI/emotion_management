/**
 * 导航配置和路由工具
 * Navigation Configuration and Route Utilities
 */

import { UserInfo, getDefaultDashboardPath } from './auth'

export interface NavigationItem {
  label: string
  href: string
  icon?: string
  description?: string
  roles: UserInfo['role'][]
  children?: NavigationItem[]
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

/**
 * 系统导航配置
 */
export const NAVIGATION_CONFIG: NavigationItem[] = [
  {
    label: '仪表板',
    href: '/dashboard',
    icon: 'dashboard',
    roles: ['admin', 'student', 'counselor']
  },
  
  // 学生导航 - 仅学生可见
  {
    label: '心理评估',
    href: '/student',
    icon: 'brain',
    roles: ['student'],
    children: [
      {
        label: 'AI智能评估',
        href: '/student/ai-assessment',
        description: '多模态AI心理健康评估',
        roles: ['student']
      },
      {
        label: '评估历史',
        href: '/student/assessment-history',
        description: '查看历史评估记录和趋势',
        roles: ['student']
      },
      {
        label: '传统量表评估',
        href: '/student/assessment',
        description: '标准心理健康量表',
        roles: ['student']
      }
    ]
  },
  {
    label: '心理支持',
    href: '/support',
    icon: 'heart',
    roles: ['student'],
    children: [
      {
        label: 'AI心理辅导',
        href: '/student/ai-chat',
        description: '24/7智能心理支持',
        roles: ['student']
      },
      {
        label: '咨询师匹配',
        href: '/student/consultation-matching',
        description: '智能匹配专业咨询师',
        roles: ['student']
      },
      {
        label: '匿名咨询',
        href: '/student/anonymous-consultation',
        description: '安全私密的匿名心理咨询',
        roles: ['student']
      }
    ]
  },
  {
    label: '咨询管理',
    href: '/consultation',
    icon: 'calendar',
    roles: ['student'],
    children: [
      {
        label: '我的咨询',
        href: '/student/consultation',
        description: '查看咨询记录和预约',
        roles: ['student']
      },
      {
        label: '咨询记录',
        href: '/student/consultation-records',
        description: '历史咨询记录和反馈',
        roles: ['student']
      }
    ]
  },
  {
    label: '学习资源',
    href: '/resources',
    icon: 'book',
    roles: ['student'],
    children: [
      {
        label: '心理健康知识',
        href: '/student/resources',
        description: '心理健康科普和自助工具',
        roles: ['student']
      },
      {
        label: '冥想练习',
        href: '/student/meditation',
        description: '引导式冥想和放松练习',
        roles: ['student']
      }
    ]
  },
  
  // 咨询师导航 - 仅咨询师可见
  {
    label: '工作台',
    href: '/counselor',
    icon: 'users',
    roles: ['counselor'],
    children: [
      {
        label: '咨询会话',
        href: '/counselor/consultations',
        description: '管理当前和历史咨询会话',
        roles: ['counselor']
      },
      {
        label: '匿名咨询',
        href: '/counselor/anonymous',
        description: '匿名咨询服务管理',
        roles: ['counselor']
      },
      {
        label: '学生评估',
        href: '/counselor/assessments',
        description: '查看学生评估结果',
        roles: ['counselor']
      }
    ]
  },
  {
    label: '个人中心',
    href: '/counselor/profile',
    icon: 'user',
    roles: ['counselor'],
    children: [
      {
        label: '个人资料',
        href: '/counselor/profile',
        description: '管理个人信息和专业资质',
        roles: ['counselor']
      },
      {
        label: '工作统计',
        href: '/counselor/statistics',
        description: '查看个人工作数据和反馈',
        roles: ['counselor']
      }
    ]
  },
  
  // 管理员导航
  {
    label: '数据分析',
    href: '/admin',
    icon: 'chart',
    roles: ['admin'],
    children: [
      {
        label: '可视化大屏',
        href: '/admin/analytics',
        description: '全校心理健康数据分析',
        roles: ['admin']
      },
      {
        label: '危机监控',
        href: '/admin/crisis-monitoring',
        description: '高风险用户实时监控',
        roles: ['admin']
      }
    ]
  },
  {
    label: '用户管理',
    href: '/admin/users',
    icon: 'users',
    roles: ['admin'],
    children: [
      {
        label: '学生管理',
        href: '/admin/students',
        description: '查看和管理学生账号及数据',
        roles: ['admin']
      },
      {
        label: '咨询师管理',
        href: '/admin/counselors',
        description: '管理咨询师资质和排班',
        roles: ['admin']
      },
      {
        label: '系统用户',
        href: '/admin/users',
        description: '管理系统用户账号',
        roles: ['admin']
      }
    ]
  },
  {
    label: '系统设置',
    href: '/admin/settings',
    icon: 'settings',
    roles: ['admin'],
    children: [
      {
        label: '基础配置',
        href: '/admin/settings',
        description: '系统基础参数配置',
        roles: ['admin']
      }
    ]
  }
]

/**
 * 根据用户角色过滤导航项
 */
export function getNavigationForRole(role: UserInfo['role']): NavigationItem[] {
  return NAVIGATION_CONFIG.filter(item => 
    item.roles.includes(role)
  ).map(item => ({
    ...item,
    href: item.href === '/dashboard' ? getDefaultDashboardPath(role) : item.href,
    children: item.children?.filter(child => child.roles.includes(role))
  }))
}

/**
 * 生成面包屑导航
 */
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: '首页', href: '/' }
  ]
  
  const pathSegments = pathname.split('/').filter(Boolean)
  
  // 根据路径生成面包屑
  let currentPath = ''
  
  for (const segment of pathSegments) {
    currentPath += `/${segment}`
    
    let label = segment
    
    // 路径映射
    const pathMap: Record<string, string> = {
      'student': '学生中心',
      'counselor': '咨询师工作台', 
      'admin': '管理后台',
      'dashboard': '仪表板',
      'ai-assessment': 'AI智能评估',
      'assessment': '心理评估',
      'assessment-history': '评估历史',
      'consultation-matching': '咨询师匹配',
      'consultation': '咨询管理',
      'consultation-records': '咨询记录',
      'anonymous-consultation': '匿名咨询',
      'consultations': '咨询会话',
      'anonymous': '匿名咨询管理',
      'assessments': '学生评估',
      'profile': '个人资料',
      'statistics': '工作统计',
      'analytics': '可视化大屏',
      'crisis-monitoring': '危机监控',
      'users': '用户管理',
      'students': '学生管理',
      'counselors': '咨询师管理',
      'settings': '系统设置',
      'resources': '心理健康知识',
      'meditation': '冥想练习',
      'ai-chat': 'AI心理辅导'
    }
    
    label = pathMap[segment] || segment
    
    breadcrumbs.push({
      label,
      href: currentPath
    })
  }
  
  return breadcrumbs
}

/**
 * 获取页面标题
 */
export function getPageTitle(pathname: string): string {
  const breadcrumbs = generateBreadcrumbs(pathname)
  const lastCrumb = breadcrumbs[breadcrumbs.length - 1]
  
  if (breadcrumbs.length > 1) {
    return `${lastCrumb.label} - 情绪管理系统`
  }
  
  return '情绪管理系统 - 智能心理健康咨询平台'
}

/**
 * 检查路径是否需要认证
 */
export function requiresAuth(pathname: string): boolean {
  const publicPaths = ['/', '/login', '/register', '/about']
  return !publicPaths.includes(pathname)
}

/**
 * 检查路径是否有角色权限
 */
export function checkRoleAccess(pathname: string, userRole: UserInfo['role']): boolean {
  if (userRole === 'admin') return true

  const baseAccessMap: Record<UserInfo['role'], string[]> = {
    student: ['/student'],
    counselor: ['/counselor'],
    admin: ['/admin']
  }

  const allowedBases = baseAccessMap[userRole] || []
  if (allowedBases.some(base => pathname === base || pathname.startsWith(`${base}/`))) {
    return true
  }

  const commonPaths = ['/ai-chat', '/dashboard']
  if (commonPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) return true

  return false
}

/**
 * 认证工具库
 * Authentication Utilities
 */

export interface UserInfo {
  username: string
  role: 'student' | 'counselor' | 'admin'
  name?: string
  access_token: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: UserInfo | null
  loading: boolean
}

/**
 * 从localStorage获取用户信息
 */
export function getUserInfo(): UserInfo | null {
  if (typeof window === 'undefined') return null
  
  try {
    const username = localStorage.getItem('username')
    const role = localStorage.getItem('user_role') as UserInfo['role']
    const access_token = localStorage.getItem('access_token')
    
    if (!username || !role || !access_token) {
      return null
    }
    
    return {
      username,
      role,
      access_token,
      name: username // 可以从后端获取真实姓名
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}

/**
 * 检查用户是否已登录
 */
export function isAuthenticated(): boolean {
  return getUserInfo() !== null
}

/**
 * 检查用户是否有访问指定角色页面的权限
 */
export function hasRoleAccess(requiredRole: UserInfo['role']): boolean {
  const user = getUserInfo()
  if (!user) return false
  
  // 管理员可以访问所有角色页面
  if (user.role === 'admin') return true
  
  // 其他角色只能访问自己的页面
  return user.role === requiredRole
}

/**
 * 退出登录
 */
export function logout(): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('access_token')
  localStorage.removeItem('user_role')
  localStorage.removeItem('username')
  localStorage.removeItem('last_login_time')
  
  // 重定向到登录页
  window.location.href = '/'
}

/**
 * 根据用户角色获取默认仪表板路径
 */
export function getDefaultDashboardPath(role: UserInfo['role']): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'student':
      return '/student/dashboard'
    case 'counselor':
      return '/counselor/dashboard'
    default:
      return '/'
  }
}

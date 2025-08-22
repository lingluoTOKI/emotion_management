'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Eye, EyeOff, Lock, User, Brain, Heart, Shield, 
  AlertCircle, CheckCircle, Loader2, UserCheck,
  Key, Clock, RefreshCw
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FormErrors {
  username?: string
  password?: string
  general?: string
}

interface TestAccount {
  username: string
  password: string
  role: 'student' | 'counselor' | 'admin'
  name: string
  description: string
}

const TEST_ACCOUNTS: TestAccount[] = [
  {
    username: 'student1',
    password: '123456',
    role: 'student',
    name: '学生测试账号',
    description: '体验学生端所有功能'
  },
  {
    username: 'counselor1', 
    password: '123456',
    role: 'counselor',
    name: '咨询师测试账号',
    description: '体验咨询师工作台'
  },
  {
    username: 'admin1',
    password: '123456', 
    role: 'admin',
    name: '管理员测试账号',
    description: '体验管理后台和数据分析'
  }
]

export default function HomePage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'student' as 'student' | 'counselor' | 'admin',
    rememberMe: false
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [showTestAccounts, setShowTestAccounts] = useState(false)
  const [lastLoginTime, setLastLoginTime] = useState<string | null>(null)
  const router = useRouter()

  // 初始化：检查是否有保存的登录信息
  useEffect(() => {
    const savedUsername = localStorage.getItem('saved_username')
    const savedRole = localStorage.getItem('saved_role') as 'student' | 'counselor' | 'admin'
    const lastLogin = localStorage.getItem('last_login_time')
    
    if (savedUsername && savedRole) {
      setFormData(prev => ({
        ...prev,
        username: savedUsername,
        role: savedRole,
        rememberMe: true
      }))
    }
    
    if (lastLogin) {
      setLastLoginTime(new Date(lastLogin).toLocaleString())
    }
  }, [])

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名'
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少3个字符'
    } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(formData.username)) {
      newErrors.username = '用户名只能包含字母、数字、下划线和中文'
    }
    
    if (!formData.password.trim()) {
      newErrors.password = '请输入密码'
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6个字符'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 模拟登录（当后端不可用时）
  const simulateLogin = async (): Promise<{success: boolean, userData?: any}> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 只检查用户名和密码，不考虑角色选择
        const testAccount = TEST_ACCOUNTS.find(
          acc => acc.username === formData.username && 
                 acc.password === formData.password
        )
        
        if (testAccount) {
          resolve({
            success: true,
            userData: {
              access_token: `mock_token_${Date.now()}`,
              user_role: testAccount.role,  // 使用账号的真实角色
              username: testAccount.username,
              name: testAccount.name
            }
          })
        } else {
          resolve({ success: false })
        }
      }, 1500) // 模拟网络延迟
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 清除之前的错误
    setErrors({})
    
    // 表单验证
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    
    try {
      // 尝试调用后端API
      const formDataToSend = new FormData()
      formDataToSend.append('username', formData.username)
      formDataToSend.append('password', formData.password)
      
      let loginSuccessful = false
      let userData: any = null
      
      try {
        const response = await fetch('http://localhost:8000/api/auth/login', {
          method: 'POST',
          body: formDataToSend,
          headers: {
            'Accept': 'application/json',
          }
        })

        if (response.ok) {
          userData = await response.json()
          loginSuccessful = true
        } else {
          const errorData = await response.json()
          throw new Error(errorData.detail || '登录失败')
        }
      } catch (apiError) {
        console.log('API不可用，使用模拟登录:', apiError)
        
        // 后端不可用时使用模拟登录
        const mockResult = await simulateLogin()
        loginSuccessful = mockResult.success
        userData = mockResult.userData
      }

      if (loginSuccessful && userData) {
        // 显示成功动画
        setLoginSuccess(true)
        
        // 保存用户信息
        localStorage.setItem('access_token', userData.access_token)
        localStorage.setItem('user_role', userData.user_role)
        localStorage.setItem('username', userData.username)
        localStorage.setItem('last_login_time', new Date().toISOString())
        
        // 保存登录信息（如果选择了记住我）
        if (formData.rememberMe) {
          localStorage.setItem('saved_username', formData.username)
          localStorage.setItem('saved_role', formData.role)
        } else {
          localStorage.removeItem('saved_username')
          localStorage.removeItem('saved_role')
        }
        
        // 延迟跳转以显示成功动画
        setTimeout(async () => {
          // 使用统一的导航逻辑
          const { getDefaultDashboardPath } = await import('@/lib/auth')
          
          // 优先根据用户偏好进行跳转
          const preferredRole = formData.role
          const actualRole = userData.user_role
          
          let targetRole = actualRole
          
          // 如果偏好角色与实际角色一致，或管理员选择其他角色
          if (preferredRole === actualRole || actualRole === 'admin') {
            targetRole = preferredRole
          }
          
          // 跳转到对应的仪表板
          router.push(getDefaultDashboardPath(targetRole))
        }, 1500)
        
      } else {
        setErrors({ general: '用户名或密码错误，请检查后重试' })
      }
    } catch (error) {
      console.error('登录错误:', error)
      setErrors({ general: error instanceof Error ? error.message : '登录失败，请稍后重试' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    // 清除对应字段的错误
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    })
  }

  // 快速登录测试账号
  const quickLogin = (account: TestAccount) => {
    setFormData({
      username: account.username,
      password: account.password,
      role: account.role, // 设置为账号的真实角色作为偏好
      rememberMe: false
    })
    setShowTestAccounts(false)
    
    // 清除错误
    setErrors({})
    
    // 添加视觉反馈
    setTimeout(() => {
      const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement
      if (submitButton) {
        submitButton.focus()
      }
    }, 100)
  }

  // 清除表单
  const clearForm = () => {
    setFormData({
      username: '',
      password: '',
      role: 'student',
      rememberMe: false
    })
    setErrors({})
    setLoginSuccess(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="flex justify-center items-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Brain className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            情绪管理系统
          </h1>
          <p className="text-gray-600">
            基于AI的智能心理健康咨询平台
          </p>
        </motion.div>

        {/* 上次登录信息 */}
        {lastLoginTime && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center space-x-2"
          >
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700">上次登录: {lastLoginTime}</span>
          </motion.div>
        )}

        {/* 登录表单 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* 成功状态 */}
          <AnimatePresence>
            {loginSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center mb-6"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">登录成功！</h3>
                <p className="text-gray-600">正在跳转到您的工作台...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 通用错误信息 */}
          <AnimatePresence>
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-center space-x-2"
              >
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700">{errors.general}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 角色选择（影响登录跳转） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                账号类型偏好
                <span className="text-xs text-gray-500 ml-2">（实际角色由您的账号权限决定）</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                disabled={isLoading || loginSuccess}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isLoading || loginSuccess ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              >
                <option value="student">学生用户</option>
                <option value="counselor">心理咨询师</option>
                <option value="admin">系统管理员</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                💡 此选择会影响登录，系统会根据您的账号自动跳转相应的角色进行登录
              </p>
            </div>

            {/* 用户名输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={isLoading || loginSuccess}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.username
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                  } ${isLoading || loginSuccess ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="请输入用户名"
                />
              </div>
              {errors.username && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-sm mt-1 flex items-center space-x-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.username}</span>
                </motion.p>
              )}
            </div>

            {/* 密码输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading || loginSuccess}
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.password
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                  } ${isLoading || loginSuccess ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || loginSuccess}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-sm mt-1 flex items-center space-x-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.password}</span>
                </motion.p>
              )}
            </div>

            {/* 记住我 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                id="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                disabled={isLoading || loginSuccess}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                记住登录信息
              </label>
            </div>

            {/* 登录按钮 */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading || loginSuccess}
                className={`w-full py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ${
                  isLoading || loginSuccess
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transform hover:scale-105'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>登录中...</span>
                  </div>
                ) : loginSuccess ? (
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>登录成功</span>
                  </div>
                ) : (
                  '登录'
                )}
              </button>

              {/* 操作按钮 */}
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTestAccounts(!showTestAccounts)}
                  disabled={isLoading || loginSuccess}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center justify-center space-x-1"
                >
                  <Key className="h-4 w-4" />
                  <span>测试账号</span>
                </button>
                
                <button
                  type="button"
                  onClick={clearForm}
                  disabled={isLoading || loginSuccess}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center justify-center space-x-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>清除</span>
                </button>
              </div>
            </div>
          </form>

          {/* 测试账号区域 */}
          <AnimatePresence>
            {showTestAccounts && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-gray-200"
              >
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                  <UserCheck className="h-4 w-4" />
                  <span>测试账号（一键登录）</span>
                </h3>
                <div className="space-y-2">
                  {TEST_ACCOUNTS.map((account, index) => (
                    <motion.button
                      key={account.username}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => quickLogin(account)}
                      className="w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="font-medium text-gray-900 text-sm">{account.name}</div>
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              account.role === 'student' ? 'bg-blue-100 text-blue-800' :
                              account.role === 'counselor' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {account.role === 'student' ? '学生' :
                               account.role === 'counselor' ? '咨询师' : '管理员'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">{account.description}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            👤 {account.username} · 🔑 {account.password}
                          </div>
                        </div>
                        <div className="ml-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-gray-500 text-center">
                    💡 点击任意测试账号可快速填入登录信息
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="text-xs text-yellow-800">
                      <div className="font-medium mb-1">🔍 登录说明：</div>
                      <ul className="space-y-1 text-left">
                        <li>• 登录时需要<strong>用户名</strong>和<strong>密码</strong>正确</li>
                        <li>• <strong>账号类型偏好</strong>会影响登录后的跳转页面</li>
                        <li>• 管理员账号可以选择以任何角色身份登录</li>
                        <li>• 其他账号会根据权限和偏好智能跳转</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 功能说明 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">系统功能</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center">
                <Heart className="h-4 w-4 text-red-500 mr-2" />
                <span>AI心理评估与情绪识别</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 text-green-500 mr-2" />
                <span>智能咨询师匹配系统</span>
              </div>
              <div className="flex items-center">
                <Brain className="h-4 w-4 text-blue-500 mr-2" />
                <span>实时风险评估与预警</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 底部信息 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-sm text-gray-500"
        >
          <p>© 2025 情绪管理系统. 保护您的心理健康.</p>
        </motion.div>
      </div>
    </div>
  )
}

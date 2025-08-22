'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users,
  Brain, 
  Heart, 
  Shield, 
  BarChart3,
  PieChart,
  TrendingUp,
  AlertTriangle,
  Activity,
  Eye,
  Database,
  Clock,
  MessageCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'
import { getUserInfo } from '@/lib/auth'
import type { UserInfo } from '@/lib/auth'

export default function AdminDashboard() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const router = useRouter()

  useEffect(() => {
    const user = getUserInfo()
    setUserInfo(user)
  }, [])

  // 示例统计数据
  const systemStats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalAssessments: 3456,
    riskUsers: 23,
    totalCounselors: 45,
    activeSessions: 156
  }

  const recentAlerts = [
    { id: 1, type: 'high-risk', user: 'user_***123', message: '检测到高风险用户', time: '10分钟前', handled: false },
    { id: 2, type: 'system', user: 'system', message: 'AI服务响应时间过长', time: '1小时前', handled: true },
    { id: 3, type: 'medium-risk', user: 'user_***456', message: '中等风险用户需要关注', time: '2小时前', handled: false }
  ]

  const quickActions = [
    {
      title: '查看数据分析',
      description: '详细的系统数据报表',
      icon: BarChart3,
      color: 'blue',
      href: '/admin/analytics'
    },
    {
      title: '危机监控',
      description: '高风险用户实时监控',
      icon: AlertTriangle,
      color: 'red',
      href: '/admin/crisis-monitoring'
    },
    {
      title: '用户管理',
      description: '管理系统用户账号',
      icon: Users,
      color: 'green',
      href: '/admin/users'
    },
    {
      title: '系统设置',
      description: '配置系统参数',
      icon: Database,
      color: 'gray',
      href: '/admin/settings'
    }
  ]

  return (
    <RequireRole role="admin">
      <DashboardLayout title="管理员仪表板">
    <div className="space-y-6">
          {/* 欢迎信息 */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  管理员控制台
                </h2>
                <p className="text-purple-100 mb-4">
                  监控系统状态，确保为用户提供最佳的心理健康服务
                </p>
                {/* 主要操作按钮 */}
          <button 
            onClick={() => router.push('/admin/analytics')}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
          >
                  <BarChart3 className="w-5 h-5" />
            <span>查看全校咨询状况</span>
          </button>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{systemStats.activeUsers}</div>
                <div className="text-purple-100 text-sm">活跃用户</div>
              </div>
            </div>
          </div>
          
          {/* 系统状态统计 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="总用户数"
              value={systemStats.totalUsers}
              icon={Users}
              color="blue"
              change="+12%"
              changeType="positive"
            />
            <StatCard
              title="活跃用户"
              value={systemStats.activeUsers}
              icon={Activity}
              color="green"
              change="+8%"
              changeType="positive"
            />
            <StatCard
              title="评估总数"
              value={systemStats.totalAssessments}
              icon={Brain}
              color="purple"
              change="+15%"
              changeType="positive"
            />
            <StatCard
              title="风险用户"
              value={systemStats.riskUsers}
              icon={AlertTriangle}
              color="red"
              change="-3%"
              changeType="negative"
            />
            <StatCard
              title="咨询师数量"
              value={systemStats.totalCounselors}
              icon={Heart}
              color="pink"
              change="+2%"
              changeType="positive"
            />
            <StatCard
              title="活跃会话"
              value={systemStats.activeSessions}
              icon={MessageCircle}
              color="indigo"
              change="+25%"
              changeType="positive"
            />
          </div>

          {/* 快速操作 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">快速操作</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(action.href)}
                  className={`
                    relative overflow-hidden rounded-xl p-6 cursor-pointer
                    bg-gradient-to-br transition-all duration-200 hover:shadow-lg
                    ${action.color === 'blue' ? 'from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200' :
                      action.color === 'red' ? 'from-red-50 to-red-100 hover:from-red-100 hover:to-red-200' :
                      action.color === 'green' ? 'from-green-50 to-green-100 hover:from-green-100 hover:to-green-200' :
                      'from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">{action.title}</h4>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                    <action.icon className={`
                      w-8 h-8 
                      ${action.color === 'blue' ? 'text-blue-600' :
                        action.color === 'red' ? 'text-red-600' :
                        action.color === 'green' ? 'text-green-600' :
                        'text-gray-600'}
                    `} />
                    </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 实时警报 */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">实时警报</h3>
                <span className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${recentAlerts.filter(a => !a.handled).length > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
                `}>
                  {recentAlerts.filter(a => !a.handled).length} 待处理
                </span>
              </div>
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className={`
                    p-4 rounded-lg border-l-4
                    ${alert.type === 'high-risk' ? 'border-red-500 bg-red-50' :
                      alert.type === 'medium-risk' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'}
                  `}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{alert.message}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {alert.user !== 'system' && `用户: ${alert.user} • `}
                          {alert.time}
                        </p>
                </div>
                      <div className={`
                        px-2 py-1 rounded text-xs font-medium
                        ${alert.handled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      `}>
                        {alert.handled ? '已处理' : '待处理'}
              </div>
            </div>
          </div>
                ))}
              </div>
            </div>
            
            {/* 系统健康状况 */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">系统状态</h3>
            <div className="space-y-4">
                <SystemHealthItem
                  label="AI服务状态"
                  status="healthy"
                  value="99.8%"
                  description="响应时间正常"
                />
                <SystemHealthItem
                  label="数据库连接"
                  status="healthy"
                  value="100%"
                  description="连接稳定"
                />
                <SystemHealthItem
                  label="API响应"
                  status="warning"
                  value="95.2%"
                  description="轻微延迟"
                />
                <SystemHealthItem
                  label="存储空间"
                  status="healthy"
                  value="65%"
                  description="使用正常"
                />
              </div>
            </div>
          </div>

          {/* 今日概览 */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">今日系统概览</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                    <span className="text-gray-600">新增用户:</span>
                    <span className="ml-2 font-semibold text-green-700">+24</span>
              </div>
                <div>
                    <span className="text-gray-600">完成评估:</span>
                    <span className="ml-2 font-semibold text-blue-700">+156</span>
          </div>
          <div>
                    <span className="text-gray-600">咨询会话:</span>
                    <span className="ml-2 font-semibold text-purple-700">+89</span>
              </div>
                </div>
              </div>
            </div>
          </div>
          </div>
      </DashboardLayout>
    </RequireRole>
  )
}

// 统计卡片组件
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  change,
  changeType
}: {
  title: string
  value: number
  icon: any
  color: string
  change: string
  changeType: 'positive' | 'negative'
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${color === 'blue' ? 'bg-blue-100' :
            color === 'green' ? 'bg-green-100' :
            color === 'purple' ? 'bg-purple-100' :
            color === 'red' ? 'bg-red-100' :
            color === 'pink' ? 'bg-pink-100' :
            color === 'indigo' ? 'bg-indigo-100' : 'bg-gray-100'}
        `}>
          <Icon className={`
            w-5 h-5
            ${color === 'blue' ? 'text-blue-600' :
              color === 'green' ? 'text-green-600' :
              color === 'purple' ? 'text-purple-600' :
              color === 'red' ? 'text-red-600' :
              color === 'pink' ? 'text-pink-600' :
              color === 'indigo' ? 'text-indigo-600' : 'text-gray-600'}
          `} />
        </div>
        <span className={`
          text-xs font-medium px-2 py-1 rounded
          ${changeType === 'positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
        `}>
          {change}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </div>
  )
}

// 系统健康状况项组件
function SystemHealthItem({
  label,
  status,
  value,
  description
}: {
  label: string
  status: 'healthy' | 'warning' | 'error'
  value: string
  description: string
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className={`
          w-3 h-3 rounded-full
          ${status === 'healthy' ? 'bg-green-500' :
            status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}
        `} />
        <div>
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  )
}
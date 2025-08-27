'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  AlertTriangle, 
  Users, 
  Clock, 
  Eye,
  Phone,
  Mail,
  MapPin,
  Shield,
  Activity,
  TrendingUp,
  TrendingDown,
  Filter,
  RefreshCw,
  Bell
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'

export default function AdminCrisisMonitoring() {
  const [activeTab, setActiveTab] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [isLoading, setIsLoading] = useState(false)

  // 模拟高风险用户数据
  const riskUsers = [
    {
      id: 1,
      userId: 'user_***123',
      name: '张同学',
      riskLevel: 'high',
      riskScore: 85,
      lastActivity: '10分钟前',
      alerts: [
        { type: 'suicide_risk', message: '检测到自杀倾向关键词', time: '5分钟前' },
        { type: 'depression', message: '抑郁指数持续升高', time: '1小时前' }
      ],
      contact: {
        phone: '138****1234',
        email: 'zhang***@university.edu.cn',
        department: '计算机学院'
      },
      status: 'active',
      counselor: '李心理师'
    },
    {
      id: 2,
      userId: 'user_***456',
      name: '李同学',
      riskLevel: 'medium',
      riskScore: 65,
      lastActivity: '30分钟前',
      alerts: [
        { type: 'anxiety', message: '焦虑症状明显', time: '2小时前' }
      ],
      contact: {
        phone: '139****5678',
        email: 'li***@university.edu.cn',
        department: '经济学院'
      },
      status: 'monitoring',
      counselor: '王心理师'
    },
    {
      id: 3,
      userId: 'user_***789',
      name: '王同学',
      riskLevel: 'high',
      riskScore: 92,
      lastActivity: '5分钟前',
      alerts: [
        { type: 'suicide_risk', message: '多次提及轻生想法', time: '3分钟前' },
        { type: 'isolation', message: '社交孤立行为', time: '1天前' }
      ],
      contact: {
        phone: '137****9012',
        email: 'wang***@university.edu.cn',
        department: '医学院'
      },
      status: 'urgent',
      counselor: '张心理师'
    }
  ]

  const filteredUsers = riskUsers.filter(user => {
    return activeTab === 'all' || user.riskLevel === activeTab
  })

  const stats = {
    totalRiskUsers: riskUsers.length,
    highRiskUsers: riskUsers.filter(u => u.riskLevel === 'high').length,
    mediumRiskUsers: riskUsers.filter(u => u.riskLevel === 'medium').length,
    lowRiskUsers: riskUsers.filter(u => u.riskLevel === 'low').length,
    activeAlerts: riskUsers.reduce((sum, user) => sum + user.alerts.length, 0),
    avgResponseTime: '2.3分钟'
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLevelText = (level: string) => {
    switch (level) {
      case 'high': return '高风险'
      case 'medium': return '中风险'
      case 'low': return '低风险'
      default: return '未知'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'active': return 'bg-yellow-100 text-yellow-800'
      case 'monitoring': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const refreshData = async () => {
    setIsLoading(true)
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const handleEmergencyContact = (user: any) => {
    // 模拟紧急联系功能
    alert(`正在联系 ${user.name} (${user.contact.phone})`)
  }

  return (
    <RequireRole role="admin">
      <DashboardLayout title="危机监控">
        <div className="space-y-6">
          {/* 统计概览 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
          <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalRiskUsers}</h3>
                  <p className="text-sm text-gray-600">风险用户总数</p>
          </div>
        </div>
          </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-600" />
        </div>
          <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.highRiskUsers}</h3>
                  <p className="text-sm text-gray-600">高风险用户</p>
          </div>
        </div>
    </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-6 h-6 text-yellow-600" />
        </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.activeAlerts}</h3>
                  <p className="text-sm text-gray-600">活跃警报</p>
      </div>
    </div>
      </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}</h3>
                  <p className="text-sm text-gray-600">平均响应时间</p>
                    </div>
                    </div>
                </div>
              </div>

          {/* 控制面板 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">风险用户监控</h3>
                <div className="flex space-x-2">
                  {(['all', 'high', 'medium', 'low'] as const).map((tab) => (
                  <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === tab
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tab === 'all' && '全部'}
                      {tab === 'high' && '高风险'}
                      {tab === 'medium' && '中风险'}
                      {tab === 'low' && '低风险'}
                </button>
        ))}
      </div>
    </div>
              <div className="flex items-center space-x-3">
          <button
                  onClick={refreshData}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>刷新</span>
          </button>
              </div>
            </div>
        </div>

          {/* 风险用户列表 */}
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-red-600" />
              </div>
              <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-600">用户ID: {user.userId}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(user.riskLevel)}`}>
                          {getRiskLevelText(user.riskLevel)}
                </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status === 'urgent' ? '紧急' : user.status === 'active' ? '活跃' : '监控中'}
                </span>
              </div>
              </div>
                </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">{user.riskScore}</div>
                    <div className="text-sm text-gray-500">风险评分</div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                      <Clock className="w-4 h-4" />
                      <span>{user.lastActivity}</span>
                </div>
            </div>
          </div>

                {/* 警报信息 */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">警报信息</h4>
            <div className="space-y-2">
                    {user.alerts.map((alert, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <div className="flex-1">
                          <p className="text-sm text-red-800">{alert.message}</p>
                          <p className="text-xs text-red-600">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

                {/* 联系信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
                    <h4 className="font-medium text-gray-900 mb-2">联系信息</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{user.contact.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{user.contact.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{user.contact.department}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">负责咨询师</h4>
                    <p className="text-sm text-gray-600">{user.counselor}</p>
              </div>
          </div>

          {/* 操作按钮 */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>查看详情</span>
            </button>
            <button
                    onClick={() => handleEmergencyContact(user)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
                    <Phone className="w-4 h-4" />
                    <span>紧急联系</span>
            </button>
                  {user.riskLevel === 'high' && (
                    <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span>启动干预</span>
            </button>
                  )}
        </div>
      </motion.div>
            ))}
            </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">暂无风险用户</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  Plus,
  Download,
  Mail,
  Phone,
  Shield,
  Calendar,
  Activity,
  Lock,
  Unlock
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'admin' | 'counselor' | 'student'>('all')

  // 模拟系统用户数据
  const users = [
    {
      id: 1,
      userId: 'admin001',
      name: '系统管理员',
      email: 'admin@university.edu.cn',
      phone: '138****0001',
      role: 'admin',
      status: 'active',
      lastLogin: '2025-01-21 16:30',
      loginCount: 156,
      permissions: ['系统管理', '用户管理', '数据分析', '危机监控'],
      department: '信息技术中心'
    },
    {
      id: 2,
      userId: 'counselor001',
      name: '张心理咨询师',
      email: 'zhang.counselor@university.edu.cn',
      phone: '138****1234',
      role: 'counselor',
      status: 'active',
      lastLogin: '2025-01-21 14:30',
      loginCount: 89,
      permissions: ['咨询管理', '学生评估', '报告查看'],
      department: '心理健康教育中心'
    },
    {
      id: 3,
      userId: 'student001',
      name: '李同学',
      email: 'li.student@university.edu.cn',
      phone: '139****5678',
      role: 'student',
      status: 'active',
      lastLogin: '2025-01-21 12:15',
      loginCount: 45,
      permissions: ['心理评估', '在线咨询', '匿名咨询'],
      department: '计算机学院'
    }
  ]

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.userId.includes(searchTerm) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === 'all' || user.role === activeTab
    return matchesSearch && matchesTab
  })

  const stats = {
    totalUsers: users.length,
    adminUsers: users.filter(u => u.role === 'admin').length,
    counselorUsers: users.filter(u => u.role === 'counselor').length,
    studentUsers: users.filter(u => u.role === 'student').length
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'counselor': return 'bg-blue-100 text-blue-800'
      case 'student': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return '管理员'
      case 'counselor': return '咨询师'
      case 'student': return '学生'
      default: return '未知'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'locked': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <RequireRole role="admin">
      <DashboardLayout title="系统用户管理">
        <div className="space-y-6">
          {/* 统计概览 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsers}</h3>
                  <p className="text-sm text-gray-600">总用户数</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.adminUsers}</h3>
                  <p className="text-sm text-gray-600">管理员</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.counselorUsers}</h3>
                  <p className="text-sm text-gray-600">咨询师</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.studentUsers}</h3>
                  <p className="text-sm text-gray-600">学生</p>
                </div>
              </div>
            </div>
          </div>

          {/* 控制面板 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">用户列表</h3>
                <div className="flex space-x-2">
                  {(['all', 'admin', 'counselor', 'student'] as const).map((tab) => (
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
                      {tab === 'admin' && '管理员'}
                      {tab === 'counselor' && '咨询师'}
                      {tab === 'student' && '学生'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索用户姓名、ID或邮箱..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>添加用户</span>
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>导出数据</span>
                </button>
              </div>
            </div>
          </div>

          {/* 用户列表 */}
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
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      user.role === 'admin' ? 'bg-red-100' :
                      user.role === 'counselor' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <Users className={`w-6 h-6 ${
                        user.role === 'admin' ? 'text-red-600' :
                        user.role === 'counselor' ? 'text-blue-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-600">ID: {user.userId}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleText(user.role)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status === 'active' ? '活跃' : user.status === 'inactive' ? '非活跃' : '已锁定'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Activity className="w-4 h-4" />
                      <span>登录 {user.loginCount} 次</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{user.lastLogin}</div>
                  </div>
                </div>

                {/* 联系信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">联系信息</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{user.phone}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">部门:</span> {user.department}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">权限信息</h4>
                    <div className="flex flex-wrap gap-2">
                      {user.permissions.map((permission, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>查看详情</span>
                  </button>
                  <button className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center space-x-2">
                    <Edit className="w-4 h-4" />
                    <span>编辑信息</span>
                  </button>
                  <button className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>权限管理</span>
                  </button>
                  {user.status === 'active' ? (
                    <button className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>锁定账户</span>
                    </button>
                  ) : (
                    <button className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center space-x-2">
                      <Unlock className="w-4 h-4" />
                      <span>解锁账户</span>
                    </button>
                  )}
                  <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-2">
                    <Trash2 className="w-4 h-4" />
                    <span>删除用户</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">暂无用户数据</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}

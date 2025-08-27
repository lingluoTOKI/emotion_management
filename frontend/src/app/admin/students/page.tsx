'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  Plus,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  AlertTriangle
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'

export default function AdminStudents() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive' | 'risk'>('all')

  // 模拟学生数据
  const students = [
    {
      id: 1,
      studentId: '2021001',
      name: '张同学',
      email: 'zhang@university.edu.cn',
      phone: '138****1234',
      department: '计算机学院',
      major: '软件工程',
      grade: '2021级',
      status: 'active',
      riskLevel: 'low',
      lastLogin: '2025-01-21 14:30',
      assessmentCount: 5,
      consultationCount: 2
    },
    {
      id: 2,
      studentId: '2021002',
      name: '李同学',
      email: 'li@university.edu.cn',
      phone: '139****5678',
      department: '经济学院',
      major: '金融学',
      grade: '2021级',
      status: 'active',
      riskLevel: 'medium',
      lastLogin: '2025-01-21 12:15',
      assessmentCount: 8,
      consultationCount: 5
    },
    {
      id: 3,
      studentId: '2021003',
      name: '王同学',
      email: 'wang@university.edu.cn',
      phone: '137****9012',
      department: '医学院',
      major: '临床医学',
      grade: '2021级',
      status: 'inactive',
      riskLevel: 'high',
      lastLogin: '2025-01-15 09:45',
      assessmentCount: 12,
      consultationCount: 8
    }
  ]

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.includes(searchTerm) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'active' && student.status === 'active') ||
      (activeTab === 'inactive' && student.status === 'inactive') ||
      (activeTab === 'risk' && student.riskLevel === 'high')
    return matchesSearch && matchesTab
  })

  const stats = {
    totalStudents: students.length,
    activeStudents: students.filter(s => s.status === 'active').length,
    inactiveStudents: students.filter(s => s.status === 'inactive').length,
    riskStudents: students.filter(s => s.riskLevel === 'high').length
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

  return (
    <RequireRole role="admin">
      <DashboardLayout title="学生管理">
        <div className="space-y-6">
          {/* 统计概览 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalStudents}</h3>
                  <p className="text-sm text-gray-600">总学生数</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.activeStudents}</h3>
                  <p className="text-sm text-gray-600">活跃学生</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.inactiveStudents}</h3>
                  <p className="text-sm text-gray-600">非活跃学生</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.riskStudents}</h3>
                  <p className="text-sm text-gray-600">高风险学生</p>
                </div>
              </div>
            </div>
          </div>

          {/* 控制面板 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">学生列表</h3>
                <div className="flex space-x-2">
                  {(['all', 'active', 'inactive', 'risk'] as const).map((tab) => (
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
                      {tab === 'active' && '活跃'}
                      {tab === 'inactive' && '非活跃'}
                      {tab === 'risk' && '高风险'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索学生姓名、学号或邮箱..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>添加学生</span>
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>导出数据</span>
                </button>
              </div>
            </div>
          </div>

          {/* 学生列表 */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      学生信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      学院专业
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      风险等级
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      使用统计
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      最后登录
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.studentId}</div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                              <Mail className="w-3 h-3" />
                              <span>{student.email}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <Phone className="w-3 h-3" />
                              <span>{student.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.department}</div>
                        <div className="text-sm text-gray-500">{student.major}</div>
                        <div className="text-sm text-gray-500">{student.grade}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                          {student.status === 'active' ? '活跃' : '非活跃'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(student.riskLevel)}`}>
                          {getRiskLevelText(student.riskLevel)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>评估: {student.assessmentCount}次</div>
                        <div>咨询: {student.consultationCount}次</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.lastLogin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>查看</span>
                          </button>
                          <button className="text-green-600 hover:text-green-900 flex items-center space-x-1">
                            <Edit className="w-4 h-4" />
                            <span>编辑</span>
                          </button>
                          <button className="text-red-600 hover:text-red-900 flex items-center space-x-1">
                            <Trash2 className="w-4 h-4" />
                            <span>删除</span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">暂无学生数据</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}

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
  MapPin,
  Calendar,
  Star,
  MessageCircle,
  Award,
  Clock
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'

export default function AdminCounselors() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive' | 'expert'>('all')

  // 模拟咨询师数据
  const counselors = [
    {
      id: 1,
      counselorId: 'C001',
      name: '张心理咨询师',
      email: 'zhang.counselor@university.edu.cn',
      phone: '138****1234',
      department: '心理健康教育中心',
      specialization: '认知行为疗法、人际关系咨询',
      experience: '8年',
      education: '心理学硕士',
      status: 'active',
      rating: 4.8,
      totalSessions: 156,
      completedSessions: 142,
      satisfactionRate: 95,
      certifications: ['国家二级心理咨询师', '认知行为治疗师'],
      lastActive: '2025-01-21 14:30'
    },
    {
      id: 2,
      counselorId: 'C002',
      name: '李心理咨询师',
      email: 'li.counselor@university.edu.cn',
      phone: '139****5678',
      department: '心理健康教育中心',
      specialization: '人本主义疗法、情感咨询',
      experience: '5年',
      education: '心理学硕士',
      status: 'active',
      rating: 4.6,
      totalSessions: 98,
      completedSessions: 89,
      satisfactionRate: 92,
      certifications: ['国家二级心理咨询师'],
      lastActive: '2025-01-21 12:15'
    },
    {
      id: 3,
      counselorId: 'C003',
      name: '王心理咨询师',
      email: 'wang.counselor@university.edu.cn',
      phone: '137****9012',
      department: '心理健康教育中心',
      specialization: '精神分析疗法、危机干预',
      experience: '12年',
      education: '心理学博士',
      status: 'active',
      rating: 4.9,
      totalSessions: 234,
      completedSessions: 228,
      satisfactionRate: 98,
      certifications: ['国家一级心理咨询师', '精神分析师', '危机干预师'],
      lastActive: '2025-01-21 16:45'
    }
  ]

  const filteredCounselors = counselors.filter(counselor => {
    const matchesSearch = counselor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         counselor.counselorId.includes(searchTerm) ||
                         counselor.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'active' && counselor.status === 'active') ||
      (activeTab === 'inactive' && counselor.status === 'inactive') ||
      (activeTab === 'expert' && counselor.experience.includes('10') || counselor.experience.includes('12'))
    return matchesSearch && matchesTab
  })

  const stats = {
    totalCounselors: counselors.length,
    activeCounselors: counselors.filter(c => c.status === 'active').length,
    expertCounselors: counselors.filter(c => c.experience.includes('10') || c.experience.includes('12')).length,
    avgRating: (counselors.reduce((sum, c) => sum + c.rating, 0) / counselors.length).toFixed(1)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <RequireRole role="admin">
      <DashboardLayout title="咨询师管理">
        <div className="space-y-6">
          {/* 统计概览 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalCounselors}</h3>
                  <p className="text-sm text-gray-600">总咨询师数</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.activeCounselors}</h3>
                  <p className="text-sm text-gray-600">活跃咨询师</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.expertCounselors}</h3>
                  <p className="text-sm text-gray-600">专家咨询师</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.avgRating}</h3>
                  <p className="text-sm text-gray-600">平均评分</p>
                </div>
              </div>
            </div>
          </div>

          {/* 控制面板 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">咨询师列表</h3>
                <div className="flex space-x-2">
                  {(['all', 'active', 'inactive', 'expert'] as const).map((tab) => (
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
                      {tab === 'expert' && '专家'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索咨询师姓名、ID或邮箱..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>添加咨询师</span>
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>导出数据</span>
                </button>
              </div>
            </div>
          </div>

          {/* 咨询师列表 */}
          <div className="space-y-4">
            {filteredCounselors.map((counselor) => (
              <motion.div
                key={counselor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {counselor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{counselor.name}</h3>
                      <p className="text-sm text-gray-600">ID: {counselor.counselorId}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(counselor.status)}`}>
                          {counselor.status === 'active' ? '活跃' : '非活跃'}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm text-gray-600">{counselor.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{counselor.lastActive}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">最后活跃</div>
                  </div>
                </div>

                {/* 联系信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">联系信息</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{counselor.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{counselor.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{counselor.department}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">专业信息</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>经验: {counselor.experience}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">专业方向:</span> {counselor.specialization}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">学历:</span> {counselor.education}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 工作统计 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">总咨询次数</span>
                      <span className="font-semibold text-gray-900">{counselor.totalSessions}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">完成率</span>
                      <span className="font-semibold text-gray-900">
                        {Math.round((counselor.completedSessions / counselor.totalSessions) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">满意度</span>
                      <span className="font-semibold text-gray-900">{counselor.satisfactionRate}%</span>
                    </div>
                  </div>
                </div>

                {/* 专业认证 */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">专业认证</h4>
                  <div className="flex flex-wrap gap-2">
                    {counselor.certifications.map((cert, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {cert}
                      </span>
                    ))}
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
                    <Calendar className="w-4 h-4" />
                    <span>排班管理</span>
                  </button>
                  <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-2">
                    <Trash2 className="w-4 h-4" />
                    <span>删除</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredCounselors.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">暂无咨询师数据</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}

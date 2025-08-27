'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageCircle, Calendar, Clock, User, 
  Video, Phone, Star, Filter, Search
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'

export default function CounselorConsultations() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const consultations = [
    {
      id: 1,
      student: '张同学',
      type: '在线咨询',
      date: '2025-01-21',
      time: '14:00',
      status: '已完成',
      rating: 5,
      duration: '60分钟',
      notes: '学生反映学习压力较大，建议进行放松训练'
    },
    {
      id: 2,
      student: '李同学',
      type: '面对面',
      date: '2025-01-20',
      time: '09:00',
      status: '已完成',
      rating: 4,
      duration: '45分钟',
      notes: '人际关系问题，已提供沟通技巧建议'
    },
    {
      id: 3,
      student: '王同学',
      type: '匿名咨询',
      date: '2025-01-19',
      time: '16:00',
      status: '进行中',
      rating: null,
      duration: '30分钟',
      notes: '情绪低落，需要持续关注'
    }
  ]

  const filteredConsultations = consultations.filter(consultation => {
    const matchesSearch = consultation.student.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'pending' && consultation.status === '进行中') ||
      (activeTab === 'completed' && consultation.status === '已完成')
    return matchesSearch && matchesTab
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case '在线咨询': return <Video className="w-4 h-4" />
      case '面对面': return <User className="w-4 h-4" />
      case '匿名咨询': return <MessageCircle className="w-4 h-4" />
      default: return <MessageCircle className="w-4 h-4" />
    }
  }

  return (
    <RequireRole role="counselor">
      <DashboardLayout title="咨询会话管理">
        <div className="space-y-6">
          {/* 搜索和筛选 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索学生姓名..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>筛选</span>
                </button>
              </div>
            </div>
          </div>

          {/* 标签页 */}
          <div className="bg-white rounded-2xl shadow-sm border p-1">
            <div className="flex">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                全部会话
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                进行中
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === 'completed'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                已完成
              </button>
            </div>
          </div>

          {/* 咨询会话列表 */}
          <div className="space-y-4">
            {filteredConsultations.map((consultation) => (
              <motion.div
                key={consultation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      {getTypeIcon(consultation.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{consultation.student}</h3>
                      <p className="text-sm text-gray-600">{consultation.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{consultation.date}</span>
                      <Clock className="w-4 h-4" />
                      <span>{consultation.time}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        consultation.status === '已完成' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {consultation.status}
                      </span>
                      {consultation.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm text-gray-600">{consultation.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>咨询时长: {consultation.duration}</span>
                  </div>
                  <p className="text-gray-700">{consultation.notes}</p>
                </div>

                <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
                  <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    查看详情
                  </button>
                  {consultation.status === '进行中' && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      继续咨询
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {filteredConsultations.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">暂无咨询会话</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}

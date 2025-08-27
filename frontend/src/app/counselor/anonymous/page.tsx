'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageCircle, Clock, AlertTriangle, 
  CheckCircle, Eye, Reply, Filter
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'

export default function CounselorAnonymous() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'replied'>('all')

  const anonymousMessages = [
    {
      id: 1,
      content: '最近总是感到焦虑，晚上睡不着觉，白天也没有精神学习...',
      timestamp: '2025-01-21 14:30',
      status: 'pending',
      riskLevel: 'medium',
      reply: null
    },
    {
      id: 2,
      content: '我和室友关系很紧张，感觉被孤立了，不知道该怎么办...',
      timestamp: '2025-01-21 12:15',
      status: 'replied',
      riskLevel: 'low',
      reply: '我理解你的感受。人际关系问题确实会让人感到困扰。建议你可以尝试主动沟通，或者寻求辅导员帮助。如果需要进一步咨询，可以预约面对面咨询。'
    },
    {
      id: 3,
      content: '我觉得生活没有意义，有时候会想一些不好的事情...',
      timestamp: '2025-01-21 10:45',
      status: 'pending',
      riskLevel: 'high',
      reply: null
    }
  ]

  const filteredMessages = anonymousMessages.filter(message => {
    return activeTab === 'all' || message.status === activeTab
  })

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
    <RequireRole role="counselor">
      <DashboardLayout title="匿名咨询管理">
        <div className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {anonymousMessages.length}
                  </h3>
                  <p className="text-sm text-gray-600">总消息数</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {anonymousMessages.filter(m => m.status === 'pending').length}
                  </h3>
                  <p className="text-sm text-gray-600">待回复</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {anonymousMessages.filter(m => m.riskLevel === 'high').length}
                  </h3>
                  <p className="text-sm text-gray-600">高风险</p>
                </div>
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
                全部消息
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                待回复
              </button>
              <button
                onClick={() => setActiveTab('replied')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === 'replied'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                已回复
              </button>
            </div>
          </div>

          {/* 消息列表 */}
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">匿名用户</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(message.riskLevel)}`}>
                          {getRiskLevelText(message.riskLevel)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                        <Clock className="w-4 h-4" />
                        <span>{message.timestamp}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {message.status === 'replied' && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">已回复</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700">{message.content}</p>
                </div>

                {message.reply && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Reply className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">咨询师回复</span>
                    </div>
                    <p className="text-blue-700">{message.reply}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>查看详情</span>
                  </button>
                  {message.status === 'pending' && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                      <Reply className="w-4 h-4" />
                      <span>回复</span>
                    </button>
                  )}
                  {message.riskLevel === 'high' && (
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>紧急处理</span>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {filteredMessages.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">暂无匿名消息</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}

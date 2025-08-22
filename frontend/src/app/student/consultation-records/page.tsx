'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar,
  Clock,
  Star,
  MessageCircle,
  Video,
  Phone,
  User,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Filter,
  Search,
  ExternalLink,
  Download,
  CheckCircle,
  AlertCircle,
  PlayCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'

interface ConsultationRecord {
  id: string
  counselorName: string
  counselorTitle: string
  date: string
  startTime: string
  endTime: string
  duration: number // minutes
  type: 'face-to-face' | 'video' | 'phone' | 'anonymous'
  status: 'completed' | 'cancelled' | 'no-show'
  topic: string
  summary?: string
  rating?: number
  feedback?: string
  satisfied: boolean | null
  followUpDate?: string
  hasRecording?: boolean
  hasNotes?: boolean
  nextAppointment?: string
}

// 模拟数据
const mockConsultationRecords: ConsultationRecord[] = [
  {
    id: '1',
    counselorName: '张心理师',
    counselorTitle: '国家二级心理咨询师',
    date: '2024-08-20',
    startTime: '14:00',
    endTime: '15:00',
    duration: 60,
    type: 'video',
    status: 'completed',
    topic: '学习焦虑与压力管理',
    summary: '讨论了学习压力的来源，学习了呼吸放松技巧和时间管理方法。咨询师建议继续练习正念冥想。',
    rating: 5,
    feedback: '咨询师很专业，给出的建议很实用，感觉压力有所缓解。',
    satisfied: true,
    followUpDate: '2024-08-27',
    hasRecording: false,
    hasNotes: true,
    nextAppointment: '2024-08-27 14:00'
  },
  {
    id: '2',
    counselorName: '李心理师',
    counselorTitle: '临床心理学博士',
    date: '2024-08-15',
    startTime: '10:00',
    endTime: '11:30',
    duration: 90,
    type: 'face-to-face',
    status: 'completed',
    topic: '人际关系困扰',
    summary: '深入探讨了与室友的关系问题，分析了沟通模式，制定了改善计划。',
    rating: 4,
    feedback: '咨询过程很深入，但有些建议实施起来比较困难。',
    satisfied: true,
    hasRecording: false,
    hasNotes: true
  },
  {
    id: '3',
    counselorName: '匿名咨询师',
    counselorTitle: '专业心理咨询师',
    date: '2024-08-10',
    startTime: '20:00',
    endTime: '21:00',
    duration: 60,
    type: 'anonymous',
    status: 'completed',
    topic: '情感困扰',
    summary: '匿名咨询，探讨了情感问题，获得了情绪支持和应对策略。',
    rating: 5,
    satisfied: true,
    hasRecording: false,
    hasNotes: false
  },
  {
    id: '4',
    counselorName: '王心理师',
    counselorTitle: '家庭治疗师',
    date: '2024-08-05',
    startTime: '16:00',
    endTime: '17:00',
    duration: 60,
    type: 'phone',
    status: 'cancelled',
    topic: '家庭关系',
    hasRecording: false,
    hasNotes: false,
    satisfied: null
  }
]

export default function ConsultationRecords() {
  const [records, setRecords] = useState<ConsultationRecord[]>(mockConsultationRecords)
  const [filteredRecords, setFilteredRecords] = useState<ConsultationRecord[]>(records)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFeedbackModal, setShowFeedbackModal] = useState<string | null>(null)
  const [feedbackData, setFeedbackData] = useState({ rating: 5, feedback: '', satisfied: true })
  const router = useRouter()

  useEffect(() => {
    let filtered = records

    if (selectedType !== 'all') {
      filtered = filtered.filter(record => record.type === selectedType)
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(record => record.status === selectedStatus)
    }

    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.counselorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.summary?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredRecords(filtered)
  }, [selectedType, selectedStatus, searchTerm, records])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video
      case 'phone': return Phone
      case 'face-to-face': return User
      case 'anonymous': return MessageCircle
      default: return MessageCircle
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return '视频咨询'
      case 'phone': return '电话咨询'
      case 'face-to-face': return '面对面'
      case 'anonymous': return '匿名咨询'
      default: return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'no-show': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'cancelled': return '已取消'
      case 'no-show': return '缺席'
      default: return status
    }
  }

  const submitFeedback = (recordId: string) => {
    setRecords(prev => prev.map(record => 
      record.id === recordId 
        ? { ...record, ...feedbackData }
        : record
    ))
    setShowFeedbackModal(null)
    setFeedbackData({ rating: 5, feedback: '', satisfied: true })
  }

  const exportRecords = () => {
    const data = {
      exported_at: new Date().toISOString(),
      records: filteredRecords,
      summary: {
        total: records.length,
        completed: records.filter(r => r.status === 'completed').length,
        averageRating: records.filter(r => r.rating).reduce((sum, r) => sum + (r.rating || 0), 0) / records.filter(r => r.rating).length
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `consultation-records-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <RequireRole role="student">
      <DashboardLayout title="咨询记录">
        <div className="space-y-6">
          {/* 统计概览 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总咨询次数</p>
                  <p className="text-2xl font-bold text-gray-900">{records.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">已完成</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {records.filter(r => r.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">平均评分</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(records.filter(r => r.rating).reduce((sum, r) => sum + (r.rating || 0), 0) / 
                      records.filter(r => r.rating).length || 0).toFixed(1)}
                  </p>
                </div>
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">满意度</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round((records.filter(r => r.satisfied === true).length / 
                     records.filter(r => r.satisfied !== null).length || 0) * 100)}%
                  </p>
                </div>
                <ThumbsUp className="w-8 h-8 text-pink-600" />
              </div>
            </div>
          </div>

          {/* 筛选和操作 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold text-gray-900">咨询记录</h2>
              <div className="flex space-x-3">
                <button
                  onClick={exportRecords}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>导出记录</span>
                </button>
                <button
                  onClick={() => router.push('/student/consultation-matching')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span>预约咨询</span>
                </button>
              </div>
            </div>

            {/* 筛选器 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索咨询记录..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有类型</option>
                <option value="face-to-face">面对面</option>
                <option value="video">视频咨询</option>
                <option value="phone">电话咨询</option>
                <option value="anonymous">匿名咨询</option>
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有状态</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
                <option value="no-show">缺席</option>
              </select>
            </div>

            {/* 记录列表 */}
            <div className="space-y-4">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">暂无符合条件的咨询记录</p>
                  <button
                    onClick={() => router.push('/student/consultation-matching')}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    开始咨询
                  </button>
                </div>
              ) : (
                filteredRecords.map((record) => {
                  const TypeIcon = getTypeIcon(record.type)
                  
                  return (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <TypeIcon className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{record.topic}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{record.counselorName} • {record.counselorTitle}</span>
                              <span>{getTypeLabel(record.type)}</span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{record.date}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{record.startTime} - {record.endTime}</span>
                              </span>
                              <span>{record.duration}分钟</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                            {getStatusLabel(record.status)}
                          </span>
                          
                          {record.rating && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium">{record.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {record.summary && (
                        <p className="text-gray-700 mb-4">{record.summary}</p>
                      )}

                      {record.feedback && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">我的反馈</h4>
                          <p className="text-sm text-gray-700">{record.feedback}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {record.hasNotes && (
                            <span className="flex items-center space-x-1 text-sm text-gray-500">
                              <FileText className="w-4 h-4" />
                              <span>有咨询笔记</span>
                            </span>
                          )}
                          
                          {record.hasRecording && (
                            <span className="flex items-center space-x-1 text-sm text-gray-500">
                              <PlayCircle className="w-4 h-4" />
                              <span>有录音</span>
                            </span>
                          )}
                          
                          {record.nextAppointment && (
                            <span className="flex items-center space-x-1 text-sm text-blue-600">
                              <Calendar className="w-4 h-4" />
                              <span>下次预约: {record.nextAppointment}</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          {record.status === 'completed' && !record.rating && (
                            <button
                              onClick={() => setShowFeedbackModal(record.id)}
                              className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                            >
                              评价咨询
                            </button>
                          )}
                          
                          {record.status === 'completed' && record.type !== 'anonymous' && (
                            <button
                              onClick={() => router.push(`/student/consultation-matching?counselor=${record.counselorName}`)}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                            >
                              再次预约
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>

          {/* 反馈模态框 */}
          <AnimatePresence>
            {showFeedbackModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={() => setShowFeedbackModal(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white rounded-2xl p-6 max-w-md w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">评价本次咨询</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        咨询满意度
                      </label>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setFeedbackData(prev => ({ ...prev, rating: star }))}
                            className={`p-1 ${star <= feedbackData.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            <Star className="w-6 h-6 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        整体满意度
                      </label>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setFeedbackData(prev => ({ ...prev, satisfied: true }))}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                            feedbackData.satisfied ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span>满意</span>
                        </button>
                        <button
                          onClick={() => setFeedbackData(prev => ({ ...prev, satisfied: false }))}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                            feedbackData.satisfied === false ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <ThumbsDown className="w-4 h-4" />
                          <span>不满意</span>
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        反馈意见 (可选)
                      </label>
                      <textarea
                        value={feedbackData.feedback}
                        onChange={(e) => setFeedbackData(prev => ({ ...prev, feedback: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="请分享您的咨询体验..."
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={() => setShowFeedbackModal(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => submitFeedback(showFeedbackModal)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      提交评价
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}

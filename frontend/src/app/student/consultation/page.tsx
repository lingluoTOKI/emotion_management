'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  User, 
  MapPin, 
  Phone, 
  Video, 
  Star,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Search,
  Filter,
  CalendarDays,
  Clock3,
  FileText,
  Download,
  Plus,
  AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'

interface Counselor {
  id: string
  name: string
  avatar: string
  specialty: string[]
  rating: number
  experience: string
  availableSlots: TimeSlot[]
  consultationTypes: ('face-to-face' | 'online' | 'phone')[]
  location?: string
  description: string
}

interface TimeSlot {
  id: string
  date: string
  time: string
  available: boolean
  type: 'face-to-face' | 'online' | 'phone'
}

interface Appointment {
  id: string
  counselorId: string
  counselorName: string
  date: string
  time: string
  type: 'face-to-face' | 'online' | 'phone'
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt: Date
}

export default function ConsultationPage() {
  const [activeTab, setActiveTab] = useState<'book' | 'my-appointments'>('book')
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | 'face-to-face' | 'online' | 'phone'>('all')
  const [userInfo, setUserInfo] = useState({ username: '', role: '' })
  const router = useRouter()

  // 模拟咨询师数据
  const counselors: Counselor[] = [
    {
      id: '1',
      name: '张心理咨询师',
      avatar: '张',
      specialty: ['焦虑症', '抑郁症', '人际关系'],
      rating: 4.8,
      experience: '8年心理咨询经验',
      availableSlots: [
        { id: '1', date: '2025-01-21', time: '09:00', available: true, type: 'face-to-face' },
        { id: '2', date: '2025-01-21', time: '14:00', available: true, type: 'online' },
        { id: '3', date: '2025-01-22', time: '10:00', available: true, type: 'face-to-face' },
        { id: '4', date: '2025-01-22', time: '15:00', available: false, type: 'online' }
      ],
      consultationTypes: ['face-to-face', 'online', 'phone'],
      location: '心理健康中心A栋201室',
      description: '专注于认知行为疗法，擅长处理焦虑、抑郁等情绪问题。'
    },
    {
      id: '2',
      name: '李心理健康师',
      avatar: '李',
      specialty: ['学习压力', '职业规划', '家庭关系'],
      rating: 4.6,
      experience: '6年心理咨询经验',
      availableSlots: [
        { id: '5', date: '2025-01-21', time: '11:00', available: true, type: 'online' },
        { id: '6', date: '2025-01-21', time: '16:00', available: true, type: 'phone' },
        { id: '7', date: '2025-01-22', time: '09:00', available: true, type: 'face-to-face' }
      ],
      consultationTypes: ['face-to-face', 'online', 'phone'],
      location: '心理健康中心B栋105室',
      description: '擅长青少年心理健康咨询，对学习压力和职业规划有丰富经验。'
    },
    {
      id: '3',
      name: '王情绪管理师',
      avatar: '王',
      specialty: ['情绪管理', '压力缓解', '冥想指导'],
      rating: 4.9,
      experience: '10年心理咨询经验',
      availableSlots: [
        { id: '8', date: '2025-01-21', time: '13:00', available: true, type: 'face-to-face' },
        { id: '9', date: '2025-01-22', time: '14:00', available: true, type: 'online' }
      ],
      consultationTypes: ['face-to-face', 'online'],
      location: '心理健康中心A栋301室',
      description: '专注于情绪管理和压力缓解，提供冥想和放松技巧指导。'
    }
  ]

  // 模拟预约数据
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: '1',
      counselorId: '1',
      counselorName: '张心理咨询师',
      date: '2025-01-21',
      time: '14:00',
      type: 'online',
      status: 'confirmed',
      createdAt: new Date('2025-01-20')
    },
    {
      id: '2',
      counselorId: '2',
      counselorName: '李心理健康师',
      date: '2025-01-23',
      time: '09:00',
      type: 'face-to-face',
      status: 'pending',
      createdAt: new Date('2025-01-19')
    }
  ])

  // --- 新增：统计概览数据 ---
  const calculateStats = () => {
    return {
      totalCounselors: counselors.length,
      upcomingAppointments: appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length,
      completedAppointments: appointments.filter(a => a.status === 'completed').length,
      avgRating: (counselors.reduce((sum, c) => sum + c.rating, 0) / counselors.length).toFixed(1)
    }
  }
  const stats = calculateStats()

  // --- 新增：导出预约数据功能 ---
  const exportAppointments = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: userInfo.username,
      stats,
      appointments: appointments.map(a => ({
        ...a,
        createdAt: a.createdAt.toLocaleString('zh-CN'),
        typeText: getTypeText(a.type),
        statusText: getStatusText(a.status)
      }))
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `我的预约记录_${new Date().toLocaleDateString()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    const username = localStorage.getItem('username')
    const role = localStorage.getItem('user_role')
    if (!username || !role) {
      router.push('/')
      return
    }
    setUserInfo({ username, role })
  }, [router])

  const filteredCounselors = counselors.filter(counselor => {
    const matchesSearch = counselor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         counselor.specialty.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = selectedType === 'all' || counselor.consultationTypes.includes(selectedType as any)
    return matchesSearch && matchesType
  })

  const handleBookAppointment = () => {
    if (!selectedCounselor || !selectedSlot) return
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      counselorId: selectedCounselor.id,
      counselorName: selectedCounselor.name,
      date: selectedSlot.date,
      time: selectedSlot.time,
      type: selectedSlot.type,
      status: 'pending',
      createdAt: new Date()
    }
    setAppointments(prev => [newAppointment, ...prev])
    setSelectedCounselor(null)
    setSelectedSlot(null)
    setActiveTab('my-appointments')
  }

  const handleCancelAppointment = (appointmentId: string) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
    ))
  }

  const handleBack = () => {
    router.push('/student/dashboard')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待确认'
      case 'confirmed': return '已确认'
      case 'completed': return '已完成'
      case 'cancelled': return '已取消'
      default: return '未知'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'face-to-face': return <User className="h-4 w-4" />
      case 'online': return <Video className="h-4 w-4" />
      case 'phone': return <Phone className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'face-to-face': return '面对面'
      case 'online': return '在线咨询'
      case 'phone': return '电话咨询'
      default: return '未知'
    }
  }

  return (
    <RequireRole role="student">
      {/* 统一使用DashboardLayout的title属性，保持页面标题一致性 */}
      <DashboardLayout title="预约咨询">
        <div className="space-y-6">
          {/* --- 新增：概览统计卡片（参考AssessmentHistory风格）--- */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">咨询师总数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCounselors}</p>
                </div>
                <User className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">待进行预约</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">已完成预约</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedAppointments}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">平均好评率</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgRating}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500 fill-current" />
              </div>
            </div>
          </div>

          {/* 标签页：优化样式，与概览卡片视觉统一 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            {/* 标签切换 + 操作按钮（导出/新建） */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setActiveTab('book')}
                  className={`flex-1 py-2 px-6 font-medium transition-colors ${
                    activeTab === 'book'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  预约咨询
                </button>
                <button
                  onClick={() => setActiveTab('my-appointments')}
                  className={`flex-1 py-2 px-6 font-medium transition-colors ${
                    activeTab === 'my-appointments'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  我的预约
                </button>
              </div>

              {/* 我的预约页显示导出按钮，与AssessmentHistory保持一致 */}
              {activeTab === 'my-appointments' && (
                <button
                  onClick={exportAppointments}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>导出预约记录</span>
                </button>
              )}
            </div>

            {/* 预约咨询标签内容 */}
            {activeTab === 'book' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* 搜索和筛选：优化布局，与AssessmentHistory筛选栏对齐 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索咨询师姓名或专长..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">所有类型</option>
                    <option value="face-to-face">面对面</option>
                    <option value="online">在线咨询</option>
                    <option value="phone">电话咨询</option>
                  </select>
                  
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <span>筛选</span>
                  </button>
                  
                  {/* 新增：快速返回按钮，提升操作便捷性 */}
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span>返回仪表盘</span>
                  </button>
                </div>

                {/* 咨询师列表：优化卡片样式，增加hover动效和统一圆角 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCounselors.map((counselor) => (
                    <motion.div
                      key={counselor.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedCounselor(counselor)}
                    >
                      <div className="p-6">
                        {/* 咨询师头像+基本信息：左对齐，提升信息层级 */}
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                            {counselor.avatar}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{counselor.name}</h3>
                            <div className="flex items-center space-x-1 mt-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm text-gray-600">{counselor.rating} · {counselor.experience}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* 咨询师描述：增加文字截断，保持卡片高度统一 */}
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{counselor.description}</p>
                        
                        {/* 专长领域：优化标签样式，与AssessmentHistory标签统一 */}
                        <div className="mb-4">
                          <h4 className="text-xs font-medium text-gray-500 mb-2">专长领域</h4>
                          <div className="flex flex-wrap gap-2">
                            {counselor.specialty.map((spec) => (
                              <span key={spec} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {/* 咨询方式+地点：用图标提升可读性 */}
                        <div className="flex flex-col gap-2 text-sm">
                          <div className="flex items-center space-x-2 text-gray-700">
                            <span className="font-medium">咨询方式：</span>
                            <div className="flex space-x-2">
                              {counselor.consultationTypes.includes('face-to-face') && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full flex items-center space-x-1">
                                  <User className="h-3 w-3" />
                                  <span>面对面</span>
                                </span>
                              )}
                              {counselor.consultationTypes.includes('online') && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center space-x-1">
                                  <Video className="h-3 w-3" />
                                  <span>在线</span>
                                </span>
                              )}
                              {counselor.consultationTypes.includes('phone') && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center space-x-1">
                                  <Phone className="h-3 w-3" />
                                  <span>电话</span>
                                </span>
                              )}
                            </div>
                          </div>
                          {counselor.location && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{counselor.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* 时间选择面板：优化标题栏和按钮样式 */}
                {selectedCounselor && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm border p-6 mt-8"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">
                        选择 {selectedCounselor.name} 的咨询时间
                      </h3>
                      <button
                        onClick={() => setSelectedCounselor(null)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {/* 时间槽：优化选中状态，增加hover反馈 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {selectedCounselor.availableSlots
                        .filter(slot => slot.available)
                        .map((slot) => (
                          <motion.button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-4 border rounded-lg text-left transition-all duration-200 ${
                              selectedSlot?.id === slot.id
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <CalendarDays className="h-4 w-4 text-gray-600" />
                              <span className="font-medium text-gray-900">{slot.date}</span>
                            </div>
                            <div className="flex items-center space-x-2 mb-2">
                              <Clock3 className="h-4 w-4 text-gray-600" />
                              <span className="text-gray-700">{slot.time}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(slot.type)}
                              <span className="text-sm text-gray-600">{getTypeText(slot.type)}</span>
                            </div>
                          </motion.button>
                        ))}
                    </div>
                    
                    {/* 预约确认：优化背景色和按钮样式，与AssessmentHistory操作按钮统一 */}
                    {selectedSlot && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">预约确认</h4>
                        <p className="text-blue-700 mb-4">
                          您选择了 <span className="font-medium">{selectedCounselor.name}</span> 的 
                          <span className="font-medium">{slot.date} {slot.time}</span> 
                          <span className="font-medium">{getTypeText(slot.type)}</span> 咨询
                        </p>
                        <button
                          onClick={handleBookAppointment}
                          className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          确认预约
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* 我的预约标签内容：优化列表样式，与AssessmentHistory记录卡片统一 */}
            {activeTab === 'my-appointments' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* 新增：快速预约按钮，提升转化效率 */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setActiveTab('book')}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>新增预约</span>
                  </button>
                </div>

                {/* 预约列表：优化卡片结构，增加详情感 */}
                {appointments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">暂无预约记录</p>
                    <button
                      onClick={() => setActiveTab('book')}
                      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      立即预约
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <motion.div
                        key={appointment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: appointment.id === '1' ? 0 : 0.1 }}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                      >
                        {/* 预约基本信息：左右分栏，提升信息密度 */}
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                          <div className="flex items-center space-x-4 mb-4 md:mb-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              {getTypeIcon(appointment.type)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{appointment.counselorName}</h3>
                              <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-1">
                                <span className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{appointment.date}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Clock3 className="w-4 h-4" />
                                  <span>{appointment.time}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  {getTypeIcon(appointment.type)}
                                  <span>{getTypeText(appointment.type)}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            {/* 状态标签：优化样式，与AssessmentHistory风险标签统一 */}
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                              {getStatusText(appointment.status)}
                            </span>
                            {/* 预约时间：补充信息，提升透明度 */}
                            <div className="text-right text-sm">
                              <div className="text-gray-500">预约于</div>
                              <div className="text-gray-700 font-medium">{appointment.createdAt.toLocaleDateString('zh-CN')}</div>
                            </div>
                          </div>
                        </div>

                        {/* 操作按钮：根据状态显示不同按钮，提升交互合理性 */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                          {appointment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleCancelAppointment(appointment.id)}
                                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                              >
                                取消预约
                              </button>
                              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                                修改时间
                              </button>
                            </>
                          )}
                          {appointment.status === 'confirmed' && (
                            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                              查看详情
                            </button>
                          )}
                          {appointment.status === 'completed' && (
                            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                              查看报告
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}
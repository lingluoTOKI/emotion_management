'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Video, 
  MessageCircle,
  Star,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Plus,
  Search,
  Filter,
  CalendarDays,
  Clock3
} from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  const [userInfo, setUserInfo] = useState({
    username: '',
    role: ''
  })
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

    // 这里需要调用后端API创建预约
    // 🔴 需要AI模型的地方：智能匹配咨询师和预约时间
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
    
    // 重置选择
    setSelectedCounselor(null)
    setSelectedSlot(null)
    
    // 切换到我的预约标签
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
      default: return <MessageCircle className="h-4 w-4" />
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">预约咨询</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* 标签页 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg p-1 mb-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab('book')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'book'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              预约咨询
            </button>
            <button
              onClick={() => setActiveTab('my-appointments')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'my-appointments'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              我的预约
            </button>
          </div>
        </div>

        {activeTab === 'book' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 搜索和筛选 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
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
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">所有类型</option>
                    <option value="face-to-face">面对面</option>
                    <option value="online">在线咨询</option>
                    <option value="phone">电话咨询</option>
                  </select>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <span>筛选</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 咨询师列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCounselors.map((counselor) => (
                <motion.div
                  key={counselor.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => setSelectedCounselor(counselor)}
                >
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {counselor.avatar}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{counselor.name}</h3>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm text-gray-600">{counselor.rating}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{counselor.description}</p>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">专长领域</h4>
                      <div className="flex flex-wrap gap-2">
                        {counselor.specialty.map((spec) => (
                          <span key={spec} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">咨询方式</h4>
                      <div className="flex space-x-2">
                        {counselor.consultationTypes.includes('face-to-face') && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>面对面</span>
                          </span>
                        )}
                        {counselor.consultationTypes.includes('online') && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center space-x-1">
                            <Video className="h-3 w-3" />
                            <span>在线</span>
                          </span>
                        )}
                        {counselor.consultationTypes.includes('phone') && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>电话</span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {counselor.location && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                        <MapPin className="h-4 w-4" />
                        <span>{counselor.location}</span>
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-500">{counselor.experience}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 选择咨询师后的时间选择 */}
            {selectedCounselor && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedCounselor.availableSlots
                    .filter(slot => slot.available)
                    .map((slot) => (
                      <motion.button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                          selectedSlot?.id === slot.id
                            ? 'border-blue-500 bg-blue-50'
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
                
                {selectedSlot && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">预约确认</h4>
                    <p className="text-blue-700">
                      您选择了 {selectedCounselor.name} 的 {selectedSlot.date} {selectedSlot.time} 
                      {getTypeText(selectedSlot.type)}咨询
                    </p>
                    <button
                      onClick={handleBookAppointment}
                      className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      确认预约
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'my-appointments' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">我的预约记录</h3>
              
              {appointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">暂无预约记录</p>
                  <button
                    onClick={() => setActiveTab('book')}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    立即预约
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            {getTypeIcon(appointment.type)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{appointment.counselorName}</h4>
                            <p className="text-sm text-gray-600">
                              {appointment.date} {appointment.time} • {getTypeText(appointment.type)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                            {getStatusText(appointment.status)}
                          </span>
                          {appointment.status === 'pending' && (
                            <button
                              onClick={() => handleCancelAppointment(appointment.id)}
                              className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              取消
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>预约时间: {appointment.createdAt.toLocaleString('zh-CN')}</span>
                        {appointment.status === 'confirmed' && (
                          <button className="text-blue-600 hover:text-blue-700 transition-colors">
                            查看详情
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

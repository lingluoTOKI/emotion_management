'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Video, 
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock3,
  ArrowLeft,
  Search,
  Filter,
  Eye,
  Edit,
  FileText,
  Star
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Appointment {
  id: string
  studentId: string
  studentName: string
  studentAvatar: string
  date: string
  time: string
  type: 'face-to-face' | 'online' | 'phone'
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  reason: string
  notes?: string
  createdAt: Date
}

export default function ConsultationsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [userInfo, setUserInfo] = useState({
    username: '',
    role: ''
  })
  const router = useRouter()

  // 模拟预约数据
  useEffect(() => {
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        studentId: '1',
        studentName: '王同学',
        studentAvatar: '王',
        date: '2025-01-21',
        time: '14:00',
        type: 'online',
        status: 'confirmed',
        reason: '学习压力大，感到焦虑，希望得到专业建议',
        notes: '学生表现积极，愿意配合治疗',
        createdAt: new Date('2025-01-20')
      },
      {
        id: '2',
        studentId: '2',
        studentName: '李同学',
        studentAvatar: '李',
        date: '2025-01-22',
        time: '09:00',
        type: 'face-to-face',
        status: 'pending',
        reason: '人际关系问题，与室友相处困难',
        createdAt: new Date('2025-01-19')
      },
      {
        id: '3',
        studentId: '3',
        studentName: '张同学',
        studentAvatar: '张',
        date: '2025-01-21',
        time: '16:00',
        type: 'phone',
        status: 'completed',
        reason: '睡眠质量差，经常失眠',
        notes: '建议进行睡眠卫生教育，必要时考虑转介',
        createdAt: new Date('2025-01-18')
      }
    ]
    setAppointments(mockAppointments)
    setFilteredAppointments(mockAppointments)
  }, [])

  useEffect(() => {
    const username = localStorage.getItem('username')
    const role = localStorage.getItem('user_role')
    
    if (!username || !role) {
      router.push('/')
      return
    }
    
    setUserInfo({ username, role })
  }, [router])

  // 筛选预约
  useEffect(() => {
    let filtered = appointments
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === selectedStatus)
    }
    
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.reason.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredAppointments(filtered)
  }, [appointments, selectedStatus, searchTerm])

  const handleStatusChange = (appointmentId: string, newStatus: Appointment['status']) => {
    // 这里需要调用后端API更新预约状态
    // 🔴 需要AI模型的地方：智能分析学生问题，提供咨询建议
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId ? { ...apt, status: newStatus } : apt
    ))
  }

  const handleAddNotes = (appointmentId: string, notes: string) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId ? { ...apt, notes } : apt
    ))
  }

  const handleBack = () => {
    router.push('/counselor/dashboard')
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

  const getStatusActions = (appointment: Appointment) => {
    switch (appointment.status) {
      case 'pending':
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleStatusChange(appointment.id, 'confirmed')}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
            >
              <CheckCircle className="h-3 w-3" />
              <span>确认</span>
            </button>
            <button
              onClick={() => handleStatusChange(appointment.id, 'cancelled')}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1"
            >
              <XCircle className="h-3 w-3" />
              <span>拒绝</span>
            </button>
          </div>
        )
      case 'confirmed':
        return (
          <button
            onClick={() => handleStatusChange(appointment.id, 'completed')}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
          >
            <CheckCircle className="h-3 w-3" />
            <span>完成</span>
          </button>
        )
      default:
        return null
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
              <h1 className="text-xl font-semibold text-gray-900">咨询管理</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock3 className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => apt.status === 'pending').length}
                </h3>
                <p className="text-sm text-gray-600">待处理预约</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => apt.status === 'confirmed').length}
                </h3>
                <p className="text-sm text-gray-600">已确认预约</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => apt.status === 'completed').length}
                </h3>
                <p className="text-sm text-gray-600">已完成咨询</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => apt.status === 'completed').length}
                </h3>
                <p className="text-sm text-gray-600">本月咨询</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索学生姓名或咨询原因..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有状态</option>
                <option value="pending">待确认</option>
                <option value="confirmed">已确认</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>筛选</span>
              </button>
            </div>
          </div>
        </div>

        {/* 预约列表 */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-900">预约列表</h3>
          </div>
          
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">暂无预约记录</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAppointments.map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {appointment.studentAvatar}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{appointment.studentName}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {getStatusText(appointment.status)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{appointment.date}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{appointment.time}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {getTypeIcon(appointment.type)}
                            <span>{getTypeText(appointment.type)}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{appointment.reason}</p>
                        
                        {appointment.notes && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <span className="font-medium">咨询笔记:</span> {appointment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      {getStatusActions(appointment)}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedAppointment(appointment)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          title="查看详情"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setSelectedAppointment(appointment)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="添加笔记"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors" title="生成报告">
                          <FileText className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 预约详情/编辑模态框 */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">预约详情</h3>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学生姓名</label>
                  <p className="text-gray-900">{selectedAppointment.studentName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">预约时间</label>
                  <p className="text-gray-900">{selectedAppointment.date} {selectedAppointment.time}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">咨询方式</label>
                  <p className="text-gray-900">{getTypeText(selectedAppointment.type)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">当前状态</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                    {getStatusText(selectedAppointment.status)}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">咨询原因</label>
                <p className="text-gray-900">{selectedAppointment.reason}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">咨询笔记</label>
                <textarea
                  value={selectedAppointment.notes || ''}
                  onChange={(e) => handleAddNotes(selectedAppointment.id, e.target.value)}
                  placeholder="添加咨询笔记..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

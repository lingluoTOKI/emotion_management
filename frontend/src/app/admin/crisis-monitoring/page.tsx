'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, Phone, Mail, MessageCircle, MapPin,
  Clock, User, Activity, TrendingUp, Shield, Bell,
  CheckCircle, XCircle, RefreshCw, Search, Filter,
  Eye, EyeOff, Download, Calendar, BarChart3,
  Heart, Brain, Target, Users, Zap, Star
} from 'lucide-react'

interface CrisisAlert {
  id: string
  studentId: string
  studentName: string // 实际中会是加密/脱敏的
  riskLevel: 'medium' | 'high' | 'critical'
  triggerType: 'keyword' | 'assessment' | 'behavior' | 'report'
  content: string
  timestamp: Date
  status: 'pending' | 'handling' | 'resolved' | 'escalated'
  assignedTo?: string
  location?: string
  emergencyContacts: {
    name: string
    relation: string
    phone: string
    notified: boolean
  }[]
  interventions: {
    type: 'call' | 'visit' | 'counseling' | 'medical'
    timestamp: Date
    description: string
    outcome: string
  }[]
  followUp: {
    scheduled: Date
    completed: boolean
    notes?: string
  }[]
}

interface CrisisStats {
  total: number
  pending: number
  resolved: number
  critical: number
  responseTime: number
  resolutionRate: number
}

// 模拟危机预警数据
const MOCK_CRISIS_ALERTS: CrisisAlert[] = [
  {
    id: 'crisis_001',
    studentId: 'stu_001',
    studentName: '学生A',
    riskLevel: 'critical',
    triggerType: 'keyword',
    content: '在匿名咨询中检测到高危关键词',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    status: 'handling',
    assignedTo: '张心理师',
    location: '宿舍楼A栋302',
    emergencyContacts: [
      { name: '王妈妈', relation: '母亲', phone: '13800138001', notified: true },
      { name: '李辅导员', relation: '辅导员', phone: '13800138002', notified: true }
    ],
    interventions: [
      {
        type: 'call',
        timestamp: new Date(Date.now() - 20 * 60 * 1000),
        description: '电话联系学生，确认安全状况',
        outcome: '学生接听，情绪稳定，同意面谈'
      }
    ],
    followUp: [
      {
        scheduled: new Date(Date.now() + 2 * 60 * 60 * 1000),
        completed: false
      }
    ]
  },
  {
    id: 'crisis_002',
    studentId: 'stu_002',
    studentName: '学生B',
    riskLevel: 'high',
    triggerType: 'assessment',
    content: 'PHQ-9评估分数达到22分，建议立即关注',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'pending',
    location: '图书馆三楼',
    emergencyContacts: [
      { name: '李爸爸', relation: '父亲', phone: '13800138003', notified: false },
      { name: '陈辅导员', relation: '辅导员', phone: '13800138004', notified: false }
    ],
    interventions: [],
    followUp: []
  },
  {
    id: 'crisis_003',
    studentId: 'stu_003',
    studentName: '学生C',
    riskLevel: 'medium',
    triggerType: 'behavior',
    content: '连续3天未出现在课堂，宿舍管理员报告异常',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    status: 'resolved',
    assignedTo: '李心理师',
    location: '宿舍楼B栋205',
    emergencyContacts: [
      { name: '赵妈妈', relation: '母亲', phone: '13800138005', notified: true }
    ],
    interventions: [
      {
        type: 'visit',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        description: '上门探访，了解情况',
        outcome: '学生身体不适，已陪同就医'
      }
    ],
    followUp: [
      {
        scheduled: new Date(Date.now() + 24 * 60 * 60 * 1000),
        completed: false
      }
    ]
  }
]

export default function CrisisMonitoring() {
  const [alerts, setAlerts] = useState<CrisisAlert[]>(MOCK_CRISIS_ALERTS)
  const [selectedAlert, setSelectedAlert] = useState<CrisisAlert | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterRisk, setFilterRisk] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showEmergencyProtocol, setShowEmergencyProtocol] = useState(false)
  const [stats, setStats] = useState<CrisisStats>({
    total: 15,
    pending: 3,
    resolved: 10,
    critical: 2,
    responseTime: 12, // minutes
    resolutionRate: 87 // percentage
  })

  // 实时更新
  useEffect(() => {
    const interval = setInterval(() => {
      // 模拟新的危机预警
      if (Math.random() < 0.1) { // 10% 概率
        const newAlert: CrisisAlert = {
          id: `crisis_${Date.now()}`,
          studentId: `stu_${Math.random().toString(36).substr(2, 9)}`,
          studentName: `学生${Math.random().toString(36).substr(2, 2).toUpperCase()}`,
          riskLevel: ['medium', 'high', 'critical'][Math.floor(Math.random() * 3)] as any,
          triggerType: ['keyword', 'assessment', 'behavior'][Math.floor(Math.random() * 3)] as any,
          content: '检测到新的风险信号',
          timestamp: new Date(),
          status: 'pending',
          location: `${['宿舍楼', '教学楼', '图书馆'][Math.floor(Math.random() * 3)]}`,
          emergencyContacts: [],
          interventions: [],
          followUp: []
        }
        setAlerts(prev => [newAlert, ...prev])
      }
    }, 30000) // 30秒检查一次

    return () => clearInterval(interval)
  }, [])

  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus
    const matchesRisk = filterRisk === 'all' || alert.riskLevel === filterRisk
    const matchesSearch = searchTerm === '' || 
      alert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.content.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesRisk && matchesSearch
  })

  const handleAssignAlert = (alertId: string, counselor: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, assignedTo: counselor, status: 'handling' }
        : alert
    ))
  }

  const handleUpdateStatus = (alertId: string, status: CrisisAlert['status']) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status } : alert
    ))
  }

  const handleAddIntervention = (alertId: string, intervention: CrisisAlert['interventions'][0]) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, interventions: [...alert.interventions, intervention] }
        : alert
    ))
  }

  const notifyEmergencyContact = (alertId: string, contactIndex: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? {
            ...alert,
            emergencyContacts: alert.emergencyContacts.map((contact, index) =>
              index === contactIndex ? { ...contact, notified: true } : contact
            )
          }
        : alert
    ))
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-red-600 bg-red-100'
      case 'handling': return 'text-blue-600 bg-blue-100'
      case 'resolved': return 'text-green-600 bg-green-100'
      case 'escalated': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-4 rounded-xl shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">总预警</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <AlertTriangle className="h-8 w-8 text-gray-600" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-4 rounded-xl shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">待处理</p>
            <p className="text-2xl font-bold text-red-600">{stats.pending}</p>
          </div>
          <Clock className="h-8 w-8 text-red-600" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-4 rounded-xl shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">已解决</p>
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-4 rounded-xl shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">危急情况</p>
            <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
          </div>
          <Shield className="h-8 w-8 text-red-600" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white p-4 rounded-xl shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">响应时间</p>
            <p className="text-2xl font-bold text-blue-600">{stats.responseTime}分</p>
          </div>
          <Activity className="h-8 w-8 text-blue-600" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white p-4 rounded-xl shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">解决率</p>
            <p className="text-2xl font-bold text-green-600">{stats.resolutionRate}%</p>
          </div>
          <TrendingUp className="h-8 w-8 text-green-600" />
        </div>
      </motion.div>
    </div>
  )

  const renderFiltersAndSearch = () => (
    <div className="bg-white p-4 rounded-xl shadow-lg mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索学生或内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">所有状态</option>
          <option value="pending">待处理</option>
          <option value="handling">处理中</option>
          <option value="resolved">已解决</option>
          <option value="escalated">已升级</option>
        </select>

        <select
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">所有风险等级</option>
          <option value="medium">中风险</option>
          <option value="high">高风险</option>
          <option value="critical">危急</option>
        </select>

        <button
          onClick={() => setShowEmergencyProtocol(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          应急预案
        </button>

        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          导出报告
        </button>
      </div>
    </div>
  )

  const renderAlertsList = () => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">危机预警列表</h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {filteredAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => setSelectedAlert(alert)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(alert.riskLevel)}`}>
                    {alert.riskLevel === 'critical' ? '危急' :
                     alert.riskLevel === 'high' ? '高风险' : '中风险'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                    {alert.status === 'pending' ? '待处理' :
                     alert.status === 'handling' ? '处理中' :
                     alert.status === 'resolved' ? '已解决' : '已升级'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {alert.timestamp.toLocaleString()}
                  </span>
                </div>
                
                <h4 className="font-medium text-gray-900 mb-1">
                  {alert.studentName} - {alert.triggerType === 'keyword' ? '关键词触发' :
                   alert.triggerType === 'assessment' ? '评估预警' : '行为异常'}
                </h4>
                
                <p className="text-sm text-gray-600 mb-2">{alert.content}</p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {alert.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{alert.location}</span>
                    </div>
                  )}
                  {alert.assignedTo && (
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>负责人: {alert.assignedTo}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                {alert.status === 'pending' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAssignAlert(alert.id, '张心理师')
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    分配处理
                  </button>
                )}
                
                <button className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200">
                  查看详情
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )

  const renderAlertDetail = () => {
    if (!selectedAlert) return null

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">预警详情</h3>
          <button
            onClick={() => setSelectedAlert(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">学生姓名:</span>
                <span className="ml-2 font-medium">{selectedAlert.studentName}</span>
              </div>
              <div>
                <span className="text-gray-600">风险等级:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${getRiskColor(selectedAlert.riskLevel)}`}>
                  {selectedAlert.riskLevel === 'critical' ? '危急' :
                   selectedAlert.riskLevel === 'high' ? '高风险' : '中风险'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">触发类型:</span>
                <span className="ml-2 font-medium">
                  {selectedAlert.triggerType === 'keyword' ? '关键词检测' :
                   selectedAlert.triggerType === 'assessment' ? '评估预警' : '行为异常'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">当前状态:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(selectedAlert.status)}`}>
                  {selectedAlert.status === 'pending' ? '待处理' :
                   selectedAlert.status === 'handling' ? '处理中' : '已解决'}
                </span>
              </div>
              {selectedAlert.location && (
                <div>
                  <span className="text-gray-600">位置信息:</span>
                  <span className="ml-2 font-medium">{selectedAlert.location}</span>
                </div>
              )}
              {selectedAlert.assignedTo && (
                <div>
                  <span className="text-gray-600">负责人:</span>
                  <span className="ml-2 font-medium">{selectedAlert.assignedTo}</span>
                </div>
              )}
            </div>
          </div>

          {/* 紧急联系人 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">紧急联系人</h4>
            <div className="space-y-2">
              {selectedAlert.emergencyContacts.map((contact, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">{contact.name}</span>
                    <span className="text-gray-600 ml-2">({contact.relation})</span>
                    <span className="text-gray-600 ml-2">{contact.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {contact.notified ? (
                      <span className="text-green-600 text-sm">已通知</span>
                    ) : (
                      <button
                        onClick={() => notifyEmergencyContact(selectedAlert.id, index)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        立即通知
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 干预记录 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">干预记录</h4>
            {selectedAlert.interventions.length > 0 ? (
              <div className="space-y-3">
                {selectedAlert.interventions.map((intervention, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {intervention.type === 'call' ? '电话联系' :
                         intervention.type === 'visit' ? '实地探访' :
                         intervention.type === 'counseling' ? '心理咨询' : '医疗介入'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {intervention.timestamp.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mb-1">{intervention.description}</p>
                    <p className="text-sm text-gray-600">结果: {intervention.outcome}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">暂无干预记录</p>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-3 pt-4 border-t">
            <button
              onClick={() => handleUpdateStatus(selectedAlert.id, 'handling')}
              disabled={selectedAlert.status !== 'pending'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              开始处理
            </button>
            <button
              onClick={() => handleUpdateStatus(selectedAlert.id, 'resolved')}
              disabled={selectedAlert.status === 'resolved'}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
            >
              标记已解决
            </button>
            <button
              onClick={() => handleUpdateStatus(selectedAlert.id, 'escalated')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              升级处理
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  const renderEmergencyProtocol = () => (
    <AnimatePresence>
      {showEmergencyProtocol && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEmergencyProtocol(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white p-6 rounded-xl max-w-2xl w-full max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-red-600">应急处理预案</h3>
              <button
                onClick={() => setShowEmergencyProtocol(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">危急情况 (Critical)</h4>
                <ol className="text-sm text-red-700 space-y-1 list-decimal list-inside">
                  <li>立即联系学生确认安全状况 (2分钟内)</li>
                  <li>同时通知校园安保和医务室</li>
                  <li>联系紧急联系人和辅导员</li>
                  <li>如无法联系，立即派人实地查看</li>
                  <li>必要时报警 (110) 或叫急救车 (120)</li>
                  <li>全程记录处理过程</li>
                </ol>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-2">高风险情况 (High)</h4>
                <ol className="text-sm text-orange-700 space-y-1 list-decimal list-inside">
                  <li>15分钟内联系学生</li>
                  <li>安排心理咨询师介入</li>
                  <li>通知辅导员和紧急联系人</li>
                  <li>制定后续跟进计划</li>
                  <li>每日跟踪学生状况</li>
                </ol>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">中等风险 (Medium)</h4>
                <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                  <li>2小时内联系学生</li>
                  <li>评估具体情况</li>
                  <li>安排合适的咨询师</li>
                  <li>定期跟进</li>
                </ol>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">重要联系方式</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>校园安保: 5555 (内线) / 0571-12345678</p>
                  <p>医务室: 6666 (内线) / 0571-12345679</p>
                  <p>心理咨询中心: 7777 (内线)</p>
                  <p>学工处: 8888 (内线)</p>
                  <p>危机干预热线: 400-161-9995</p>
                  <p>紧急报警: 110</p>
                  <p>急救电话: 120</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-6">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">危机干预监控中心</h1>
        <p className="text-gray-600">实时监控学生心理危机，及时干预和预警</p>
      </div>

      {/* 统计卡片 */}
      {renderStatsCards()}

      {/* 筛选和搜索 */}
      {renderFiltersAndSearch()}

      {/* 主要内容 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 预警列表 */}
        <div className="lg:col-span-2">
          {renderAlertsList()}
        </div>

        {/* 详情面板 */}
        <div>
          {selectedAlert ? renderAlertDetail() : (
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">选择一个预警查看详细信息</p>
            </div>
          )}
        </div>
      </div>

      {/* 应急预案模态框 */}
      {renderEmergencyProtocol()}
    </div>
  )
}

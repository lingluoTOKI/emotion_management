'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield,
  MessageSquare,
  AlertTriangle,
  Send,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Lock,
  UserX,
  Heart,
  ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'
import { getUserInfo } from '@/lib/auth'
import type { UserInfo } from '@/lib/auth'

interface AnonymousMessage {
  id: string
  content: string
  timestamp: Date
  sender: 'student' | 'counselor'
  riskLevel?: 'low' | 'medium' | 'high'
  isRead: boolean
}

interface AnonymousSession {
  id: string
  studentId: string // 加密的学生ID
  counselorId?: string
  status: 'waiting' | 'active' | 'ended'
  riskLevel: 'low' | 'medium' | 'high'
  createdAt: Date
  lastActivity: Date
  messages: AnonymousMessage[]
  emergency?: {
    triggered: boolean
    reason: string
    timestamp: Date
  }
}

// 模拟风险检测关键词
const riskKeywords = {
  high: ['自杀', '死亡', '结束生命', '不想活', '轻生', '伤害自己'],
  medium: ['痛苦', '绝望', '无助', '孤独', '没有希望', '想消失'],
  low: ['焦虑', '担心', '压力', '难过', '困惑', '疲惫']
}

export default function AnonymousConsultation() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [currentStep, setCurrentStep] = useState<'intro' | 'agreement' | 'chat'>('intro')
  const [anonymousSession, setAnonymousSession] = useState<AnonymousSession | null>(null)
  const [currentMessage, setCurrentMessage] = useState('')
  const [isOnline, setIsOnline] = useState(false)
  const [counselorTyping, setCounselorTyping] = useState(false)
  const [showRiskWarning, setShowRiskWarning] = useState(false)
  const [riskWarningType, setRiskWarningType] = useState<'medium' | 'high'>('medium')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const user = getUserInfo()
    setUserInfo(user)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [anonymousSession?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const detectRiskLevel = (message: string): 'low' | 'medium' | 'high' => {
    const lowerMessage = message.toLowerCase()
    
    for (const keyword of riskKeywords.high) {
      if (lowerMessage.includes(keyword)) {
      return 'high'
      }
    }
    
    for (const keyword of riskKeywords.medium) {
      if (lowerMessage.includes(keyword)) {
      return 'medium'
      }
    }
    
    for (const keyword of riskKeywords.low) {
      if (lowerMessage.includes(keyword)) {
        return 'low'
      }
    }
    
    return 'low'
  }

  const startAnonymousSession = () => {
    const sessionId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    const encryptedStudentId = btoa(userInfo?.username || 'anonymous') + '_masked'
    
    const newSession: AnonymousSession = {
      id: sessionId,
      studentId: encryptedStudentId,
      status: 'waiting',
      riskLevel: 'low',
      createdAt: new Date(),
      lastActivity: new Date(),
      messages: []
    }
    
    setAnonymousSession(newSession)
    setCurrentStep('chat')
    setIsOnline(true)
    
    // 模拟系统欢迎消息
    setTimeout(() => {
      addSystemMessage('欢迎来到匿名心理咨询！您的身份完全保密，请放心分享您的困扰。咨询师将很快与您连接...')
    }, 1000)
    
    // 模拟咨询师连接
    setTimeout(() => {
      addCounselorMessage('您好，我是您的匿名咨询师。感谢您选择寻求帮助，这需要很大的勇气。请告诉我，是什么让您想要寻求支持呢？')
      setAnonymousSession(prev => prev ? { ...prev, status: 'active', counselorId: 'counselor_anon_' + Math.random().toString(36).substr(2, 5) } : prev)
    }, 3000)
  }

  const addSystemMessage = (content: string) => {
    const message: AnonymousMessage = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      sender: 'counselor',
      isRead: false
    }
    
    setAnonymousSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, message],
      lastActivity: new Date()
    } : prev)
  }

  const addCounselorMessage = (content: string) => {
    setCounselorTyping(false)
    const message: AnonymousMessage = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      sender: 'counselor',
      isRead: false
    }
    
    setAnonymousSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, message],
      lastActivity: new Date()
    } : prev)
  }

  const sendMessage = () => {
    if (!currentMessage.trim() || !anonymousSession) return
    
    const riskLevel = detectRiskLevel(currentMessage)
    
    const message: AnonymousMessage = {
      id: Date.now().toString(),
      content: currentMessage,
      timestamp: new Date(),
      sender: 'student',
      riskLevel,
      isRead: false
    }
    
    setAnonymousSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, message],
      lastActivity: new Date(),
      riskLevel: riskLevel === 'high' ? 'high' : prev.riskLevel
    } : prev)
    
    setCurrentMessage('')
    
    // 处理风险等级
    if (riskLevel === 'high') {
      setRiskWarningType('high')
      setShowRiskWarning(true)
      
      // 模拟紧急情况处理
      setTimeout(() => {
        setAnonymousSession(prev => prev ? {
          ...prev,
          emergency: {
            triggered: true,
            reason: '检测到自伤风险',
            timestamp: new Date()
          }
        } : prev)
        
        addSystemMessage('⚠️ 系统检测到您可能面临危机情况。我们已经通知了专业团队，您的安全是我们最优先的考虑。')
      }, 2000)
    } else if (riskLevel === 'medium') {
      setRiskWarningType('medium')
      setShowRiskWarning(true)
    }
    
    // 模拟咨询师回复
    setCounselorTyping(true)
    setTimeout(() => {
      const responses = {
        high: [
          '我很担心您现在的状况。能告诉我现在周围有什么人可以支持您吗？',
          '您的感受我能理解，现在最重要的是确保您的安全。我们一起想想有什么办法可以帮助您度过这个困难时刻。',
          '我希望您知道，即使在最黑暗的时刻，也总有希望和出路。让我们一起找到适合您的帮助方式。'
        ],
        medium: [
          '听起来您正在经历很大的痛苦。这种感受一定很不容易承受。',
          '我能感受到您的困扰。您愿意和我分享更多关于这种感受的细节吗？',
          '感谢您信任我，与我分享这些深层的感受。让我们一起探索如何让您感觉好一些。'
        ],
        low: [
          '我理解您的担忧。这些感受都是很正常的人类情感。',
          '感谢您的分享。能具体说说什么情况让您有这样的感受吗？',
          '我听到了您的困扰。让我们一起看看有什么方法可以帮助您应对这些挑战。'
        ]
      }
      
      const responseList = responses[riskLevel]
      const response = responseList[Math.floor(Math.random() * responseList.length)]
      addCounselorMessage(response)
    }, 2000 + Math.random() * 3000)
  }

  const endSession = () => {
    setSessionEnded(true)
    setAnonymousSession(prev => prev ? { ...prev, status: 'ended' } : prev)
    addSystemMessage('咨询会话已结束。感谢您的信任。如果需要进一步帮助，请随时寻求专业支持。记住，您永远不是一个人。')
  }

  if (currentStep === 'intro') {
    return (
      <RequireRole role="student">
        <DashboardLayout title="匿名心理咨询">
          <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border p-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">匿名心理咨询</h1>
                <p className="text-gray-600">完全匿名、安全私密的心理支持服务</p>
        </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-green-600" />
                    </div>
            <div>
                      <h3 className="font-semibold text-gray-900">完全匿名</h3>
                      <p className="text-sm text-gray-600">您和咨询师都不知道对方的真实身份，确保隐私安全</p>
            </div>
          </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">即时对话</h3>
                      <p className="text-sm text-gray-600">专业咨询师实时在线，提供即时心理支持</p>
                    </div>
          </div>
          
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">安全监控</h3>
                      <p className="text-sm text-gray-600">智能检测危险情况，必要时会联系专业团队</p>
          </div>
          </div>
        </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">适合人群</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• 非常内向，不愿意面对面咨询的学生</li>
                    <li>• 担心身份暴露影响学业或人际关系</li>
                    <li>• 希望在安全环境中初步探索心理问题</li>
                    <li>• 需要即时心理支持但无法预约咨询</li>
                    <li>• 处于心理危机需要紧急帮助</li>
                  </ul>
                </div>
      </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-2">重要提醒</h3>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• 本服务仅用于心理支持，不能替代专业医疗诊断</li>
                      <li>• 如检测到自伤或危险行为，系统会自动定位并联系相关部门</li>
                      <li>• 对话记录会在24小时后自动删除，但紧急情况记录会保留</li>
                      <li>• 请诚实表达您的感受，这有助于获得更好的帮助</li>
                    </ul>
                  </div>
      </div>
    </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => router.push('/student/dashboard')}
                  className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>返回</span>
                </button>
                
                <button
                  onClick={() => setCurrentStep('agreement')}
                  className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Shield className="w-5 h-5" />
                  <span>开始匿名咨询</span>
                </button>
              </div>
            </motion.div>
            </div>
        </DashboardLayout>
      </RequireRole>
    )
  }

  if (currentStep === 'agreement') {
    return (
      <RequireRole role="student">
        <DashboardLayout title="服务协议">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border p-8"
            >
              <h1 className="text-2xl font-bold text-gray-900 mb-6">匿名心理咨询服务协议</h1>
              
              <div className="prose prose-gray max-w-none mb-8">
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">隐私保护条款</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>1. 您的真实身份对咨询师完全保密，系统只分配匿名编号</li>
                    <li>2. 对话内容经过加密传输，确保数据安全</li>
                    <li>3. 所有对话记录将在24小时后自动删除</li>
                    <li>4. 咨询师受专业保密协议约束，不会泄露任何信息</li>
                  </ul>
                </div>

                <div className="bg-red-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-4">紧急情况处理</h3>
                  <ul className="space-y-2 text-sm text-red-800">
                    <li>1. 如果系统检测到自伤、自杀或伤害他人的风险</li>
                    <li>2. 我们会立即启动紧急干预流程</li>
                    <li>3. 在此情况下，您的身份信息可能会被解密</li>
                    <li>4. 相关部门将联系您提供及时帮助</li>
                    <li>5. 这是为了保护您和他人的安全</li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">服务限制</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>1. 本服务不能替代专业医疗诊断和治疗</li>
                    <li>2. 不提供药物处方或医疗建议</li>
                    <li>3. 严重心理疾病需要寻求专业医疗机构帮助</li>
                    <li>4. 单次咨询时间不超过2小时</li>
                  </ul>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">使用规范</h3>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li>1. 请诚实、尊重地与咨询师交流</li>
                    <li>2. 禁止发送与心理咨询无关的内容</li>
                    <li>3. 禁止骚扰、威胁或不当行为</li>
                    <li>4. 违反规定将终止服务并可能承担相应责任</li>
                  </ul>
            </div>
          </div>

              <div className="border-t pt-6">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">
                    我已仔细阅读并完全理解上述服务协议，自愿接受所有条款和条件。
                    我理解在紧急情况下为了安全考虑，我的身份可能会被解密。
                  </span>
                </label>
              </div>

              <div className="flex justify-between mt-8">
            <button
                  onClick={() => setCurrentStep('intro')}
                  className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>返回</span>
            </button>
            
            <button
                  onClick={startAnonymousSession}
                  disabled={!agreedToTerms}
                  className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>同意并开始咨询</span>
                </button>
              </div>
            </motion.div>
          </div>
        </DashboardLayout>
      </RequireRole>
    )
  }

  if (currentStep === 'chat') {
    return (
      <RequireRole role="student">
        <DashboardLayout title="匿名咨询中">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              {/* 聊天头部 */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <UserX className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">匿名心理咨询</h2>
                      <div className="flex items-center space-x-4 text-purple-100 text-sm">
                        <span>会话ID: {anonymousSession?.id.slice(-8)}</span>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          {isOnline ? (
                            <>
                              <div className="w-2 h-2 bg-green-400 rounded-full" />
                              <span>在线</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-gray-400 rounded-full" />
                              <span>离线</span>
                            </>
                          )}
                        </div>
                        <span>•</span>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          anonymousSession?.riskLevel === 'high' ? 'bg-red-500' :
                          anonymousSession?.riskLevel === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}>
                          {anonymousSession?.riskLevel === 'high' ? '高风险' :
                           anonymousSession?.riskLevel === 'medium' ? '中风险' : '低风险'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
            <button
              onClick={endSession}
                      disabled={sessionEnded}
                      className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors disabled:opacity-50"
            >
              结束咨询
            </button>
                  </div>
          </div>
        </div>

              {/* 紧急状况警告 */}
              {anonymousSession?.emergency?.triggered && (
                <div className="bg-red-600 text-white p-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5" />
                    <div>
                      <p className="font-semibold">紧急情况已触发</p>
                      <p className="text-sm text-red-100">
                        检测到危险信号，专业团队已被通知。您的安全是我们最优先考虑的。
              </p>
            </div>
                  </div>
                </div>
              )}

              {/* 聊天消息区域 */}
              <div 
                ref={chatContainerRef}
                className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50"
              >
                {anonymousSession?.messages.map((message) => (
          <motion.div
            key={message.id}
                    initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.sender === 'student' ? 'justify-end' : 'justify-start'}`}
          >
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl relative ${
                  message.sender === 'student'
                    ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}>
                <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-2">
                  <p className={`text-xs ${
                          message.sender === 'student' ? 'text-purple-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                  
                        {message.sender === 'student' && message.riskLevel && (
                          <div className={`ml-2 w-2 h-2 rounded-full ${
                            message.riskLevel === 'high' ? 'bg-red-400' :
                            message.riskLevel === 'medium' ? 'bg-yellow-400' :
                            'bg-green-400'
                      }`} />
                        )}
              </div>
            </div>
          </motion.div>
        ))}

                {counselorTyping && (
          <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
                    <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl">
                      <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                        <span className="text-xs text-gray-500">咨询师正在输入...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
              <div className="border-t p-4 bg-white">
                {!sessionEnded ? (
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="请输入您想说的话..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 pr-12"
                        disabled={anonymousSession?.status !== 'active'}
                      />
                      
                      {currentMessage && (
                        <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full ${
                          detectRiskLevel(currentMessage) === 'high' ? 'bg-red-500' :
                          detectRiskLevel(currentMessage) === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} />
                      )}
          </div>
          
          <button
            onClick={sendMessage}
                      disabled={!currentMessage.trim() || anonymousSession?.status !== 'active'}
                      className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
                      <Send className="w-4 h-4" />
                      <span>发送</span>
          </button>
        </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center space-x-2 text-gray-500 mb-4">
                      <CheckCircle className="w-5 h-5" />
                      <span>咨询会话已结束</span>
          </div>
                    <div className="flex justify-center space-x-4">
        <button
          onClick={() => router.push('/student/dashboard')}
                        className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        返回主页
                      </button>
                      <button
                        onClick={() => router.push('/ai-chat')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        转到AI咨询
        </button>
      </div>
                  </div>
                )}
              </div>
      </div>

            {/* 风险警告模态框 */}
            <AnimatePresence>
              {showRiskWarning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                  onClick={() => setShowRiskWarning(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl p-6 max-w-md w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        riskWarningType === 'high' ? 'bg-red-100' : 'bg-yellow-100'
                      }`}>
                        <AlertTriangle className={`w-8 h-8 ${
                          riskWarningType === 'high' ? 'text-red-600' : 'text-yellow-600'
                        }`} />
      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {riskWarningType === 'high' ? '检测到危险信号' : '关注您的情绪状态'}
                      </h3>
                      
                      <p className="text-gray-600 mb-6">
                        {riskWarningType === 'high' 
                          ? '我们检测到您可能有自伤的倾向。请记住，您的生命很珍贵，总有人愿意帮助您。如果情况紧急，我们建议您立即寻求专业帮助。'
                          : '我们注意到您正在经历困难时期。虽然这些感受很痛苦，但请相信这是可以改善的。继续与咨询师交流会对您有帮助。'
                        }
                      </p>

                      {riskWarningType === 'high' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                          <h4 className="font-semibold text-red-900 mb-2">紧急求助热线</h4>
                          <div className="text-sm text-red-800 space-y-1">
                            <p>全国心理危机干预热线：400-161-9995</p>
                            <p>北京危机干预热线：400-161-9995</p>
                            <p>校医院心理科：010-62756789</p>
          </div>
        </div>
      )}

                      <button
                        onClick={() => setShowRiskWarning(false)}
                        className={`w-full px-4 py-2 rounded-lg transition-colors ${
                          riskWarningType === 'high' 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        }`}
                      >
                        我明白了
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

  return null
}
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Mic, 
  MicOff, 
  MessageCircle, 
  TrendingDown,
  TrendingUp,
  ArrowLeft,
  Play,
  Pause,
  BarChart3,
  Heart,
  AlertTriangle,
  CheckCircle,
  FileText,
  Volume2,
  VolumeX,
  Users,
  Shield
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'
import { getUserInfo } from '@/lib/auth'
import type { UserInfo } from '@/lib/auth'

interface AssessmentResult {
  emotionalState: {
    dominant: string
    intensity: number
    trend: 'improving' | 'stable' | 'declining'
  }
  problemTypes: string[]
  depressionIndex: {
    current: number
    history: { date: string; value: number }[]
  }
  phq9Score: number
  gad7Score: number
  riskLevel: 'low' | 'medium' | 'high'
  recommendations: string[]
}

// 模拟PHQ-9和GAD-7问题集
const assessmentQuestions = [
  {
    id: 'phq9_1',
    type: 'phq9',
    question: '在过去的两周里，您有多少天感到做事时缺乏兴趣或乐趣？',
    options: ['完全没有', '几天', '一半以上的天数', '几乎每天']
  },
  {
    id: 'phq9_2', 
    type: 'phq9',
    question: '在过去的两周里，您有多少天感到心情低落、沮丧或绝望？',
    options: ['完全没有', '几天', '一半以上的天数', '几乎每天']
  },
  {
    id: 'gad7_1',
    type: 'gad7', 
    question: '在过去的两周里，您有多少天感到紧张、焦虑或急躁？',
    options: ['完全没有', '几天', '一半以上的天数', '几乎每天']
  },
  {
    id: 'gad7_2',
    type: 'gad7',
    question: '在过去的两周里，您有多少天无法停止或控制担忧？',
    options: ['完全没有', '几天', '一半以上的天数', '几乎每天']
  }
  // 实际应用中会有完整的PHQ-9(9题)和GAD-7(7题)
]

export default function StudentAIAssessment() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [currentStep, setCurrentStep] = useState<'intro' | 'conversation' | 'questions' | 'result'>('intro')
  const [isRecording, setIsRecording] = useState(false)
  const [conversationMode, setConversationMode] = useState<'text' | 'voice'>('text')
  const [messages, setMessages] = useState<Array<{id: string, type: 'user' | 'ai', content: string, timestamp: Date}>>([])
  const [currentInput, setCurrentInput] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, number>>({})
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [reportAccuracy, setReportAccuracy] = useState<'accurate' | 'inaccurate' | null>(null)
  const [audioEnabled, setAudioEnabled] = useState(true)
  
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  useEffect(() => {
    const user = getUserInfo()
    setUserInfo(user)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 开始AI对话评估
  const startConversation = (mode: 'text' | 'voice') => {
    setConversationMode(mode)
    setCurrentStep('conversation')
    
    const welcomeMessage = {
      id: Date.now().toString(),
      type: 'ai' as const,
      content: `您好！我是您的AI心理评估助手。接下来我将通过温和的对话来了解您的心理状态。请放松心情，诚实地与我分享您的感受。${mode === 'voice' ? '您可以通过语音与我交流。' : ''}`,
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
    
    // 开始引导式对话
    setTimeout(() => {
      addAIMessage('首先，能告诉我您最近的心情怎么样吗？有什么特别的感受或困扰吗？')
    }, 1000)
  }

  const addAIMessage = (content: string) => {
    const message = {
      id: Date.now().toString(),
      type: 'ai' as const,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
    
    // 语音播放（如果启用）
    if (audioEnabled && conversationMode === 'voice') {
      speakText(content)
    }
  }

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      utterance.rate = 0.9
      speechSynthesis.speak(utterance)
    }
  }

  // 处理文本输入
  const handleTextSubmit = async () => {
    if (!currentInput.trim()) return
    
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: currentInput,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setCurrentInput('')
    
    // 模拟AI分析和回复
    setTimeout(() => {
    const responses = [
        '我理解您的感受。能具体说说是什么让您感到这种情绪吗？',
        '这听起来确实不容易。在什么情况下您会感到更好一些？',
        '感谢您的分享。这种状况持续多久了？',
        '您有尝试过什么方法来改善这种情况吗？',
        '非常感谢您诚实的分享。现在让我们进入一些标准化的评估问题，这将帮助我更准确地了解您的状况。'
      ]
      
      if (messages.length >= 8) {
        // 对话足够多，进入问卷阶段
        addAIMessage(responses[4])
        setTimeout(() => setCurrentStep('questions'), 2000)
      } else {
        addAIMessage(responses[Math.min(Math.floor(messages.length / 2), responses.length - 2)])
      }
    }, 1500)
  }

  // 语音录制
  const toggleRecording = async () => {
    if (isRecording) {
      // 停止录制
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
      setIsRecording(false)
    } else {
      // 开始录制
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        
        const audioChunks: BlobPart[] = []
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data)
        }
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
          // 这里可以添加语音转文字的逻辑
          setCurrentInput('语音输入已识别（模拟）')
        }
        
        mediaRecorder.start()
        setIsRecording(true)
      } catch (error) {
        console.error('无法访问麦克风:', error)
        alert('无法访问麦克风，请检查权限设置')
      }
    }
  }

  // 处理问卷回答
  const handleQuestionAnswer = (answer: number) => {
    const currentQuestion = assessmentQuestions[questionIndex]
    setQuestionAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }))
    
    if (questionIndex < assessmentQuestions.length - 1) {
      setQuestionIndex(questionIndex + 1)
    } else {
      // 问卷完成，开始分析
      setIsAnalyzing(true)
      setTimeout(() => {
        const mockResult: AssessmentResult = {
          emotionalState: {
            dominant: '轻度焦虑',
            intensity: 3,
            trend: 'stable'
          },
          problemTypes: ['学业压力', '人际关系'],
          depressionIndex: {
            current: 5,
            history: [
              { date: '2024-01-01', value: 4 },
              { date: '2024-01-15', value: 6 },
              { date: '2024-02-01', value: 5 }
            ]
          },
          phq9Score: 8,
          gad7Score: 6,
          riskLevel: 'low',
          recommendations: [
            '建议保持规律的作息时间',
            '尝试每天进行30分钟的运动',
            '练习深呼吸和放松技巧',
            '如果症状持续，建议寻求专业帮助'
          ]
        }
        
        setAssessmentResult(mockResult)
        setCurrentStep('result')
        setIsAnalyzing(false)
      }, 3000)
    }
  }

  const submitAccuracyFeedback = async (accurate: boolean) => {
    setReportAccuracy(accurate ? 'accurate' : 'inaccurate')
    
    // 提交反馈到后端
    try {
      // 这里调用后端API记录反馈
      console.log('反馈已提交:', { accurate, userId: userInfo?.username })
    } catch (error) {
      console.error('提交反馈失败:', error)
    }
  }

  return (
    <RequireRole role="student">
      <DashboardLayout title={currentStep === 'intro' ? 'AI智能心理评估' : 
                              currentStep === 'conversation' ? 'AI对话评估' :
                              currentStep === 'questions' ? '标准化评估' : '评估结果'}>
        {currentStep === 'intro' && (
          <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border p-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">AI智能心理评估</h1>
                <p className="text-gray-600">基于大模型的温和引导式对话，科学评估您的心理状态</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-blue-50 rounded-xl">
                  <h3 className="font-semibold text-blue-900 mb-3">评估特色</h3>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li>• 🤖 智能AI引导对话</li>
                    <li>• 📊 标准PHQ-9/GAD-7量表</li>
                    <li>• 📈 情绪趋势分析</li>
                    <li>• 🎯 个性化建议</li>
                  </ul>
                </div>
                
                <div className="p-6 bg-green-50 rounded-xl">
                  <h3 className="font-semibold text-green-900 mb-3">隐私保护</h3>
                  <ul className="text-sm text-green-800 space-y-2">
                    <li>• 🔒 数据安全加密</li>
                    <li>• 👤 匿名化处理</li>
                    <li>• 🚫 不记录敏感信息</li>
                    <li>• ⏰ 自动删除临时数据</li>
                  </ul>
                </div>
              </div>

              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">选择评估方式</h3>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => startConversation('text')}
                    className="flex items-center justify-center space-x-3 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>文本对话评估</span>
                  </button>
                  
                  <button
                    onClick={() => startConversation('voice')}
                    className="flex items-center justify-center space-x-3 px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                  >
                    <Mic className="w-5 h-5" />
                    <span>语音对话评估</span>
                  </button>
                </div>
                
                <p className="text-sm text-gray-500 mt-4">
                  评估时间约10-15分钟，建议在安静环境中完成
                </p>
      </div>
            </motion.div>
    </div>
        )}

        {currentStep === 'conversation' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              {/* 对话头部 */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <Brain className="w-6 h-6" />
                    </div>
              <div>
                      <h2 className="text-xl font-bold">AI心理评估师</h2>
                      <p className="text-blue-100">
                        {conversationMode === 'voice' ? '语音对话模式' : '文本对话模式'}
                      </p>
              </div>
            </div>
                  
            <div className="flex items-center space-x-2">
                    {conversationMode === 'voice' && (
                      <button
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                      >
                        {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
              )}
              <button
                      onClick={() => setCurrentStep('intro')}
                      className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
              >
                      <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

              {/* 对话区域 */}
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <motion.div
              key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      message.type === 'user' 
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
                  </motion.div>
          ))}
                <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="border-t p-4">
                {conversationMode === 'text' ? (
                  <div className="flex items-center space-x-4">
              <input
                type="text"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
                      placeholder="请输入您的回答..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                      onClick={handleTextSubmit}
                      disabled={!currentInput.trim()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                发送
              </button>
            </div>
          ) : (
                  <div className="flex items-center justify-center space-x-4">
                    <input
                      type="text"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      placeholder="语音转换的文字将显示在这里..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
              <button
                      onClick={toggleRecording}
                      className={`px-6 py-3 rounded-xl transition-colors ${
                  isRecording 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <Pause className="w-5 h-5" />
                          <span>停止录音</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-5 h-5" />
                          <span>开始录音</span>
                        </>
                      )}
              </button>
            </div>
          )}
        </div>
            </div>
          </div>
        )}

        {currentStep === 'questions' && (
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border p-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-green-600" />
              </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">标准化评估</h1>
                <p className="text-gray-600">请回答以下问题，帮助我们更准确地评估您的心理状态</p>
        </div>

          <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">进度</span>
                  <span className="text-sm font-medium text-gray-900">
                    {questionIndex + 1} / {assessmentQuestions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((questionIndex + 1) / assessmentQuestions.length) * 100}%` }}
              />
            </div>
          </div>

              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {assessmentQuestions[questionIndex]?.question}
                </h2>
              <div className="space-y-3">
                  {assessmentQuestions[questionIndex]?.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuestionAnswer(index)}
                      className="w-full p-4 text-left border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{option}</span>
                    </button>
                ))}
              </div>
            </div>

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  您的回答将被严格保密，仅用于评估目的
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {currentStep === 'result' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 分析中状态 */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow-sm border p-8 text-center"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">正在分析您的心理状态...</h2>
                <p className="text-gray-600">请稍候，AI正在为您生成个性化评估报告</p>
              </motion.div>
            )}

            {/* 评估结果 */}
            {assessmentResult && !isAnalyzing && (
              <>
                {/* 情绪状态 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm border p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">情绪状态分析</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <h3 className="font-medium text-blue-900 mb-2">主要情绪</h3>
                      <p className="text-2xl font-bold text-blue-600">{assessmentResult.emotionalState.dominant}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl">
                      <h3 className="font-medium text-green-900 mb-2">情绪强度</h3>
                      <p className="text-2xl font-bold text-green-600">{assessmentResult.emotionalState.intensity}/10</p>
            </div>
                    <div className="p-4 bg-purple-50 rounded-xl">
                      <h3 className="font-medium text-purple-900 mb-2">变化趋势</h3>
                      <div className="flex items-center space-x-2">
                        {assessmentResult.emotionalState.trend === 'improving' ? (
                          <TrendingUp className="w-6 h-6 text-green-600" />
                        ) : assessmentResult.emotionalState.trend === 'declining' ? (
                          <TrendingDown className="w-6 h-6 text-red-600" />
                        ) : (
                          <BarChart3 className="w-6 h-6 text-blue-600" />
                        )}
                        <span className="text-lg font-semibold text-purple-600">
                          {assessmentResult.emotionalState.trend === 'improving' ? '改善中' :
                           assessmentResult.emotionalState.trend === 'declining' ? '下降中' : '稳定'}
                        </span>
          </div>
        </div>
      </div>
                </motion.div>

                {/* 问题类型 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-sm border p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">问题类型识别</h2>
                  <div className="flex flex-wrap gap-2">
                    {assessmentResult.problemTypes.map((type, index) => (
                      <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                        {type}
                      </span>
                    ))}
        </div>
                </motion.div>

          {/* 量表得分 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-sm border p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">标准化量表得分</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-red-50 rounded-xl">
                      <h3 className="font-medium text-red-900 mb-2">PHQ-9 抑郁量表</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-red-600">{assessmentResult.phq9Score}</span>
                        <span className="text-sm text-red-700">/ 27分</span>
                </div>
                      <p className="text-sm text-red-600 mt-2">
                        {assessmentResult.phq9Score <= 4 ? '无抑郁症状' :
                         assessmentResult.phq9Score <= 9 ? '轻度抑郁' :
                         assessmentResult.phq9Score <= 14 ? '中度抑郁' : '重度抑郁'}
                </p>
              </div>
                    <div className="p-4 bg-yellow-50 rounded-xl">
                      <h3 className="font-medium text-yellow-900 mb-2">GAD-7 焦虑量表</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-yellow-600">{assessmentResult.gad7Score}</span>
                        <span className="text-sm text-yellow-700">/ 21分</span>
                </div>
                      <p className="text-sm text-yellow-600 mt-2">
                        {assessmentResult.gad7Score <= 4 ? '无焦虑症状' :
                         assessmentResult.gad7Score <= 9 ? '轻度焦虑' :
                         assessmentResult.gad7Score <= 14 ? '中度焦虑' : '重度焦虑'}
                </p>
              </div>
                  </div>
                </motion.div>

                {/* 抑郁指数趋势图 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-sm border p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">抑郁指数趋势</h2>
                  <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">图表区域 - 显示抑郁指数变化趋势</p>
                      <p className="text-sm text-gray-400">横坐标：时间（日），纵坐标：抑郁指数</p>
                    </div>
                  </div>
                </motion.div>

                {/* 风险等级 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-2xl shadow-sm border p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">风险评估</h2>
                  <div className={`p-4 rounded-xl ${
                    assessmentResult.riskLevel === 'low' ? 'bg-green-50 border border-green-200' :
                    assessmentResult.riskLevel === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      {assessmentResult.riskLevel === 'low' ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : assessmentResult.riskLevel === 'medium' ? (
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      )}
                      <div>
                        <h3 className={`font-semibold ${
                          assessmentResult.riskLevel === 'low' ? 'text-green-900' :
                          assessmentResult.riskLevel === 'medium' ? 'text-yellow-900' :
                          'text-red-900'
                        }`}>
                          风险等级：{assessmentResult.riskLevel === 'low' ? '低风险' :
                                    assessmentResult.riskLevel === 'medium' ? '中风险' : '高风险'}
                        </h3>
                        <p className={`text-sm ${
                          assessmentResult.riskLevel === 'low' ? 'text-green-700' :
                          assessmentResult.riskLevel === 'medium' ? 'text-yellow-700' :
                          'text-red-700'
                        }`}>
                          {assessmentResult.riskLevel === 'low' ? '当前状态良好，建议继续保持' :
                           assessmentResult.riskLevel === 'medium' ? '需要关注，建议寻求适当支持' :
                           '需要立即关注，建议寻求专业帮助'}
                        </p>
                </div>
              </div>
            </div>
                </motion.div>

                {/* 建议 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-green-50 border border-green-200 rounded-2xl p-6"
                >
                  <h2 className="text-xl font-semibold text-green-900 mb-4">个性化建议</h2>
                  <div className="space-y-3">
                    {assessmentResult.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <span className="text-green-800">{recommendation}</span>
          </div>
                    ))}
          </div>
                </motion.div>

                {/* 反馈区域 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6"
                >
                  <h2 className="text-xl font-semibold text-yellow-900 mb-4">报告准确性反馈</h2>
                  <p className="text-yellow-800 mb-4">
                    您认为该评估报告是否符合您的心理状况？您的反馈将帮助我们改进评估准确性。
                  </p>
                  
                  {reportAccuracy === null ? (
          <div className="flex space-x-4">
                      <button
                        onClick={() => submitAccuracyFeedback(true)}
                        className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>符合</span>
            </button>
                      <button
                        onClick={() => submitAccuracyFeedback(false)}
                        className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <AlertTriangle className="w-5 h-5" />
                        <span>不符合</span>
            </button>
          </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      <span>感谢您的反馈！</span>
        </div>
                  )}
                </motion.div>

                {/* 下一步操作 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white rounded-2xl shadow-sm border p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">下一步建议</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
                      onClick={() => router.push('/ai-chat')}
                      className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
                    >
                      <MessageCircle className="w-6 h-6 text-blue-600 mb-2" />
                      <h3 className="font-medium text-blue-900">AI心理辅导</h3>
                      <p className="text-sm text-blue-700">获得即时的AI心理支持</p>
            </button>
            
            <button 
              onClick={() => router.push('/student/consultation-matching')}
                      className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
                    >
                      <Users className="w-6 h-6 text-green-600 mb-2" />
                      <h3 className="font-medium text-green-900">咨询师匹配</h3>
                      <p className="text-sm text-green-700">寻找合适的专业咨询师</p>
            </button>
            
            <button 
              onClick={() => router.push('/student/anonymous-consultation')}
                      className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
                    >
                      <Shield className="w-6 h-6 text-purple-600 mb-2" />
                      <h3 className="font-medium text-purple-900">匿名咨询</h3>
                      <p className="text-sm text-purple-700">安全私密的心理咨询</p>
            </button>
          </div>
                </motion.div>
              </>
            )}
        </div>
        )}
      </DashboardLayout>
    </RequireRole>
  )
}
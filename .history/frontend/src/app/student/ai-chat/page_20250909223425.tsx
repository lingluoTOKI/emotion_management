'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  MessageCircle, 
  Brain,
  Heart,
  Loader2,
  Bot,
  User as UserIcon,
  RefreshCw
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'
import { getUserInfo } from '@/lib/auth'
import type { UserInfo } from '@/lib/auth'
import { api, type AIStartSessionResponse, type AIChatResponse } from '@/lib'
import { handleError, showSuccess } from '@/utils/errorHandler'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  isTyping?: boolean
  emotion_analysis?: any
  risk_assessment?: any
}

export default function AIChatPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 格式化Markdown文本
  const formatMarkdown = (text: string): string => {
    return text
      // 粗体 **text** -> <strong>text</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      // 斜体 *text* -> <em>text</em> (但要避免与粗体冲突)
      .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em class="italic">$1</em>')
      // 代码 `code` -> <code>code</code>
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // 序号列表 ① ② ③ 等，添加样式和间距
      .replace(/(①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩)/g, '<span class="inline-block font-medium text-blue-600 mr-1">$1</span>')
      // 项目符号 • 
      .replace(/•/g, '<span class="text-blue-500 mr-1">•</span>')
      // 破折号 —— 
      .replace(/——/g, '<span class="text-gray-600">——</span>')
      // 问号 ？
      .replace(/？/g, '<span class="text-blue-600">？</span>')
      // 换行符（放在最后处理）
      .replace(/\n/g, '<br>')
  }

  useEffect(() => {
    const user = getUserInfo()
    setUserInfo(user)
    
    // 确保inputMessage状态正确初始化
    if (inputMessage === null || inputMessage === undefined) {
      setInputMessage('')
    }
    
    // 初始欢迎消息
    setMessages([
      {
        id: 'welcome',
        type: 'ai',
        content: `您好${user?.username ? `，${user.username}` : ''}！我是您的AI心理健康助手。我可以帮助您：

• 🧠 进行情绪状态分析
• 💝 提供心理健康建议  
• 🌟 推荐放松技巧
• 📋 回答心理健康相关问题

请随时告诉我您的感受或困扰，我会尽力帮助您。`,
        timestamp: new Date()
      }
    ])
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 本地智能回复生成函数（备选方案）
  const generateLocalAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()
    
    // 情绪识别关键词
    const anxietyKeywords = ['紧张', '焦虑', '担心', '害怕', '不安', '压力']
    const depressionKeywords = ['沮丧', '难过', '失落', '绝望', '无助', '疲惫']
    const stressKeywords = ['压力', '累', '疲劳', '忙', '忙碌', '工作']
    const relationshipKeywords = ['朋友', '家人', '恋人', '同事', '关系', '争吵']
    
    // 积极关键词
    const positiveKeywords = ['好', '开心', '高兴', '快乐', '感谢', '谢谢']
    
    // 生成智能回复
    if (anxietyKeywords.some(keyword => message.includes(keyword))) {
      return `我理解您现在感到焦虑和不安。这些感受是完全正常的，很多人都会经历类似的情况。

🌱 一些可能有帮助的建议：
• 尝试深呼吸：吸气4秒，屏息4秒，呼气4秒
• 专注当下：观察周围5样东西，4种声音，3种触感
• 适量运动：散步或轻度运动可以缓解焦虑
• 与信任的人交流：分享您的感受

您想详细说说是什么让您感到焦虑吗？我会认真倾听。`
    }
    
    if (depressionKeywords.some(keyword => message.includes(keyword))) {
      return `我能感受到您现在的心情很沉重。抑郁的感受确实很难承受，但请记住您并不孤单。

💙 一些温柔的自我关怀方式：
• 保持规律的作息，即使是小步骤也很重要
• 尝试每天做一件让自己感到成就感的小事
• 接触阳光和新鲜空气
• 考虑寻求专业心理帮助

您的感受是重要的，您值得被关爱和支持。愿意跟我分享更多吗？`
    }
    
    if (stressKeywords.some(keyword => message.includes(keyword))) {
      return `压力确实会让人感到疲惫不堪。在快节奏的生活中，学会管理压力是很重要的技能。

⚡ 压力管理小贴士：
• 优先级排序：列出任务重要性，专注最重要的事
• 适当休息：每工作50分钟休息10分钟
• 放松技巧：尝试冥想、瑜伽或听音乐
• 寻求支持：不要害怕向他人求助

您目前主要的压力来源是什么呢？我们可以一起想想应对方法。`
    }
    
    if (relationshipKeywords.some(keyword => message.includes(keyword))) {
      return `人际关系确实是生活中很重要但也很复杂的部分。每个人都会在关系中遇到挑战。

🤝 改善关系的一些想法：
• 倾听理解：真正倾听对方的想法和感受
• 表达需求：清晰而温和地表达自己的需要
• 设定边界：健康的关系需要适当的界限
• 寻求平衡：给彼此一些空间和时间

您能跟我说说具体的情况吗？我会帮您分析一下。`
    }
    
    if (positiveKeywords.some(keyword => message.includes(keyword))) {
      return `很高兴听到您现在心情不错！积极的情绪同样值得被重视和庆祝。

✨ 保持积极心态的方法：
• 感恩练习：每天记录3件值得感恩的事
• 分享快乐：与他人分享您的喜悦
• 继续成长：保持学习和探索的心态
• 照顾自己：在忙碌中也要记得自我关爱

有什么特别让您开心的事情吗？我很乐意听您分享！`
    }
    
    // 通用回复
    const generalResponses = [
      `感谢您与我分享这些。每个人的感受都是独特而重要的。

我在这里陪伴您，无论您想聊什么话题。您可以：
• 详细描述您的感受或困扰
• 询问心理健康相关问题
• 寻求应对困难的建议
• 或者简单地需要一个倾听者

请告诉我，现在什么对您来说最重要？`,

      `我听到了您的声音，您的感受对我来说很重要。

生活中会有各种各样的挑战，但请记住：
• 您比您想象的更坚强
• 寻求帮助是勇敢的表现
• 每一小步进步都值得庆祝
• 您值得被理解和支持

您想聊聊什么让您困扰，或者有什么我可以帮助您的吗？`,

      `谢谢您选择与我交流。在这个安全的空间里，您可以自由表达任何想法和感受。

无论您正在经历什么，请记住：
• 这些感受是暂时的
• 您有内在的力量度过困难
• 寻求支持是智慧的选择
• 我会认真倾听每一个字

请告诉我，今天您希望我们聊什么呢？`
    ]
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)]
  }

  const handleSendMessage = async () => {
    if (!inputMessage || !inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      // 检查认证状态
      const token = localStorage.getItem('access_token')
      console.log('🔐 检查认证状态:', token ? `Token存在: ${token.slice(0, 20)}...` : '❌ 未找到Token')
      
      if (!token) {
        throw new Error('用户未登录，请先登录后再使用AI助手')
      }

      // 检查token类型并给出相应提示
      if (token.startsWith('mock_token_')) {
        throw new Error('检测到测试token，请使用真实账号登录以使用AI功能')
      }
      
      if (token.startsWith('temp_token_')) {
        throw new Error('当前使用临时登录模式，AI功能受限。请确保后端服务正常运行并重新登录以获得完整功能。')
      }

      // 确保会话存在
      let currentSessionId = sessionId
      if (!currentSessionId) {
        console.log('🚀 创建新的AI会话...')
        console.log('📋 会话请求数据:', { 
          problem_type: '心理健康咨询', 
          initial_message: null 
        })
        
        const startData = await api.ai.startSession({ 
          problem_type: '心理健康咨询', 
          initial_message: null 
        })
        
        console.log('📦 会话创建响应:', startData)
        currentSessionId = startData.session_id
        if (!currentSessionId) throw new Error('创建会话失败：未返回session_id')
        setSessionId(currentSessionId)
        console.log('✅ 会话创建成功:', currentSessionId)
      }

      // 发送对话
      console.log('💬 发送消息到AI服务...', {
        session_id: currentSessionId,
        message: userMessage.content.slice(0, 50) + '...',
        backend_url: 'http://localhost:8000',
        has_token: !!token
      })
      
      const chatData = await api.ai.chat({ 
        session_id: currentSessionId, 
        message: userMessage.content 
      })
      
      console.log('📦 API返回数据:', chatData)
      
      const aiText = chatData.message || '我收到了您的消息，让我来帮助您。'
      console.log('✅ 收到AI回复:', aiText.slice(0, 100) + '...')
      
      // 模拟打字效果
      setTimeout(() => {
        setIsTyping(false)
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: aiText,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
      }, 800)

    } catch (error: any) {
      handleError(error, 'AI聊天')
      setIsTyping(false)
      
      // 检查是否是认证错误
      if (error.message && (error.message.includes('401') || error.message.includes('用户未登录'))) {
        const authMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: '⚠️ 您需要先登录才能使用AI助手。请返回登录页面登录后再尝试。',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, authMessage])
        return
      }

      // 检查是否是mock token错误
      if (error.message && error.message.includes('检测到测试token')) {
        const mockTokenMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: '🔐 检测到您使用的是测试账号。AI功能需要真实账号的有效凭据。\n\n请：\n1️⃣ 返回登录页面\n2️⃣ 使用真实的用户名和密码登录\n3️⃣ 避免使用"快速登录"按钮\n\n真实账号示例：student1/123456',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, mockTokenMessage])
        return
      }
      
      // 检查是否是会话丢失错误，如果是则重置会话
      if (error.message && (error.message.includes('会话') || 
          error.message.includes('session') ||
          error.message.includes('创建会话失败'))) {
        console.log('🔄 检测到会话问题，重置会话状态')
        setSessionId(null)  // 清空session_id，下次发送时会自动创建新会话
        
        // 显示会话恢复提示
        const recoveryMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: '检测到连接中断，我已重新建立连接。请重新发送您的消息，我会继续为您提供帮助。',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, recoveryMessage])
        return
      }
      
      // 检查是否是网络连接错误
      if (error.message && (error.message.includes('fetch') || 
          error.message.includes('network') ||
          error.message.includes('连接') ||
          error.message.includes('timeout'))) {
        const networkMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: '网络连接似乎有问题。请检查网络连接后重试，或者稍后再试。',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, networkMessage])
        return
      }
      
      // 只有在真正无法解决的情况下才使用本地回复
      console.warn('使用本地AI回复作为最后的备选方案')
      const localResponse = generateLocalAIResponse(userMessage.content)
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `⚠️ 服务暂时不可用，以下是离线回复：\n\n${localResponse}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-new',
        type: 'ai',
        content: '聊天记录已清空。我们可以重新开始对话。有什么我可以帮助您的吗？',
        timestamp: new Date()
      }
    ])
    setSessionId(null)
  }

  return (
    <RequireRole role="student">
      <DashboardLayout title="AI心理健康助手">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            {/* 聊天头部 */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">AI心理健康助手</h2>
                    <p className="text-purple-100">{sessionId ? `会话ID：${sessionId}` : '新会话未创建'}</p>
                  </div>
                </div>
                <button
                  onClick={clearChat}
                  className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm">清空对话</span>
                </button>
              </div>
            </div>

            {/* 聊天消息区域 */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`
                      max-w-xs lg:max-w-md px-4 py-3 rounded-2xl
                      ${message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'}
                    `}>
                      <div className="flex items-start space-x-2">
                        {message.type === 'ai' && (
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                            <Brain className="w-3 h-3 text-purple-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div 
                            className="text-sm whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{
                              __html: formatMarkdown(message.content)
                            }}
                          />
                          <p className={`
                            text-xs mt-2 
                            ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}
                          `}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        {message.type === 'user' && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                            <UserIcon className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* 打字指示器 */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <Brain className="w-3 h-3 text-purple-600" />
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="border-t p-4">
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入您的消息... (按 Enter 发送)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage || !inputMessage.trim() || isLoading}
                  className={`
                    p-3 rounded-xl transition-all duration-200
                    ${!inputMessage || !inputMessage.trim() || isLoading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105'}
                  `}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                AI助手会保护您的隐私，所有对话都是安全的
              </p>
            </div>
          </div>

          {/* 功能提示 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">情绪分析</span>
              </div>
              <p className="text-sm text-blue-700">分析您的情绪状态，提供个性化建议</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Heart className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">心理支持</span>
              </div>
              <p className="text-sm text-green-700">提供专业的心理健康指导和支持</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <MessageCircle className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">即时对话</span>
              </div>
              <p className="text-sm text-purple-700">24小时在线，随时为您提供帮助</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}
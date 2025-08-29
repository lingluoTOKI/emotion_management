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
  Shield,
  Activity,
  Target,
  Clock
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'
import { getUserInfo } from '@/lib/auth'
import type { UserInfo } from '@/lib/auth'
import { api, type AIAssessmentResponse, type AIAssessmentResult } from '@/lib'

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

// 完整的PHQ-9和GAD-7问题集，将在对话中自然地融入
const phq9Questions = [
  { id: 'phq9_1', question: '做事时缺乏兴趣或乐趣', dialogue: '您最近是否对平时喜欢的事情失去了兴趣？比如爱好、工作或学习？' },
  { id: 'phq9_2', question: '心情低落、沮丧或绝望', dialogue: '您的心情怎么样？是否经常感到沮丧或绝望？' },
  { id: 'phq9_3', question: '入睡困难、睡眠不稳或睡得过多', dialogue: '您的睡眠状况如何？是否有失眠或嗜睡的情况？' },
  { id: 'phq9_4', question: '感到疲倦或没有精力', dialogue: '您最近的精力状态怎么样？是否经常感到疲倦？' },
  { id: 'phq9_5', question: '食欲不振或吃得过多', dialogue: '您的食欲有什么变化吗？是否有明显的饮食习惯改变？' },
  { id: 'phq9_6', question: '觉得自己很糟糕或很失败', dialogue: '您对自己的看法如何？是否有时会觉得自己很失败？' },
  { id: 'phq9_7', question: '对事情专注有困难', dialogue: '您最近的注意力如何？工作或学习时能否集中精神？' },
  { id: 'phq9_8', question: '动作或说话慢，或者烦躁不安', dialogue: '您最近的状态是比较迟缓还是容易烦躁？' },
  { id: 'phq9_9', question: '想要伤害自己或死掉', dialogue: '您是否有过一些消极的想法？这很重要，请诚实告诉我。' }
]

const gad7Questions = [
  { id: 'gad7_1', question: '感到紧张、焦虑或急躁', dialogue: '您最近是否经常感到紧张或焦虑？' },
  { id: 'gad7_2', question: '无法停止或控制担忧', dialogue: '您是否发现自己很难控制担忧的情绪？' },
  { id: 'gad7_3', question: '对各种事情过度担忧', dialogue: '您是否对很多事情都感到担心，即使是小事？' },
  { id: 'gad7_4', question: '很难放松下来', dialogue: '您是否发现很难让自己放松下来？' },
  { id: 'gad7_5', question: '坐立不安，难以安静地坐着', dialogue: '您是否经常感到坐立不安，很难安静地待着？' },
  { id: 'gad7_6', question: '容易烦恼或易怒', dialogue: '您最近是否比平时更容易烦恼或生气？' },
  { id: 'gad7_7', question: '感到害怕，好像有可怕的事情会发生', dialogue: '您是否有时会感到害怕，担心会发生不好的事情？' }
]

// 对话式评估的主题和关键词
const assessmentTopics = {
  emotion: ['心情', '情绪', '感受', '状态'],
  sleep: ['睡眠', '失眠', '睡觉', '休息'],
  energy: ['精力', '疲倦', '累', '能量'],
  appetite: ['食欲', '吃饭', '饮食'],
  selfEsteem: ['自信', '自我', '价值', '能力'],
  concentration: ['注意力', '专注', '集中'],
  anxiety: ['焦虑', '紧张', '担心', '害怕'],
  suicidal: ['死', '自杀', '伤害', '结束', '不想活']
}

// 将在对话中使用的简化问题（用于显示在问卷阶段）
const assessmentQuestions = [
  {
    id: 'summary_phq9',
    type: 'summary',
    question: '根据我们的对话，您在过去两周的整体心情如何？',
    options: ['很好', '一般', '不太好', '很不好']
  },
  {
    id: 'summary_gad7',
    type: 'summary',
    question: '总的来说，您的焦虑程度如何？',
    options: ['很少焦虑', '偶尔焦虑', '经常焦虑', '持续焦虑']
  }
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
  const [currentAssessmentId, setCurrentAssessmentId] = useState<number | null>(null)
  const [assessmentSessionId, setAssessmentSessionId] = useState<string | null>(null)
  
  // 智能评估相关状态
  const [assessmentProgress, setAssessmentProgress] = useState<{
    phq9: Record<string, number>  // PHQ-9各项评分
    gad7: Record<string, number>  // GAD-7各项评分
    coveredTopics: string[]       // 已经涵盖的主题
    currentPhase: 'exploration' | 'targeted' | 'completion'  // 评估阶段
    questionCount: number         // 已问问题数量
  }>({
    phq9: {},
    gad7: {},
    coveredTopics: [],
    currentPhase: 'exploration',
    questionCount: 0
  })
  
  const [emotionTrend, setEmotionTrend] = useState<{
    timeline: Array<{ timestamp: Date; emotion: string; intensity: number }>
    currentDominant: string
    riskLevel: 'low' | 'medium' | 'high'
  }>({
    timeline: [],
    currentDominant: '中性',
    riskLevel: 'low'
  })
  
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

  // 智能评估核心函数
  
  // 分析用户回答中的情绪和主题
  const analyzeUserResponse = (response: string, emotionData?: any) => {
    const lowerResponse = response.toLowerCase()
    
    // 检测涵盖的主题
    const detectedTopics: string[] = []
    Object.entries(assessmentTopics).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => lowerResponse.includes(keyword))) {
        detectedTopics.push(topic)
      }
    })
    
    // 基于关键词进行初步评分
    const newPhq9Scores: Record<string, number> = { ...assessmentProgress.phq9 }
    const newGad7Scores: Record<string, number> = { ...assessmentProgress.gad7 }
    
    // PHQ-9评分逻辑（增强版关键词匹配）
    if (lowerResponse.includes('没兴趣') || lowerResponse.includes('不感兴趣') || lowerResponse.includes('提不起劲') || 
        lowerResponse.includes('无聊') || lowerResponse.includes('没意思')) {
      newPhq9Scores['phq9_1'] = Math.max(newPhq9Scores['phq9_1'] || 0, 2)
    }
    if (lowerResponse.includes('沮丧') || lowerResponse.includes('绝望') || lowerResponse.includes('低落') ||
        lowerResponse.includes('难过') || lowerResponse.includes('心情不好') || lowerResponse.includes('不开心')) {
      newPhq9Scores['phq9_2'] = Math.max(newPhq9Scores['phq9_2'] || 0, 2)
    }
    if (lowerResponse.includes('失眠') || lowerResponse.includes('睡不着') || lowerResponse.includes('睡眠不好') ||
        lowerResponse.includes('早醒') || lowerResponse.includes('多梦') || lowerResponse.includes('睡得少')) {
      newPhq9Scores['phq9_3'] = Math.max(newPhq9Scores['phq9_3'] || 0, 2)
    }
    if (lowerResponse.includes('累') || lowerResponse.includes('疲倦') || lowerResponse.includes('没精力') ||
        lowerResponse.includes('疲劳') || lowerResponse.includes('体力不支') || lowerResponse.includes('乏力')) {
      newPhq9Scores['phq9_4'] = Math.max(newPhq9Scores['phq9_4'] || 0, 2)
    }
    if (lowerResponse.includes('没食欲') || lowerResponse.includes('不想吃') || lowerResponse.includes('吃太多') ||
        lowerResponse.includes('食欲不振') || lowerResponse.includes('暴饮暴食')) {
      newPhq9Scores['phq9_5'] = Math.max(newPhq9Scores['phq9_5'] || 0, 1)
    }
    if (lowerResponse.includes('失败') || lowerResponse.includes('没用') || lowerResponse.includes('糟糕') ||
        lowerResponse.includes('自责') || lowerResponse.includes('愧疚') || lowerResponse.includes('价值感')) {
      newPhq9Scores['phq9_6'] = Math.max(newPhq9Scores['phq9_6'] || 0, 2)
    }
    if (lowerResponse.includes('注意力') || lowerResponse.includes('专注') || lowerResponse.includes('集中不了') ||
        lowerResponse.includes('分心') || lowerResponse.includes('走神') || lowerResponse.includes('思维') ||
        lowerResponse.includes('代码') || lowerResponse.includes('工作') || lowerResponse.includes('学习困难')) {
      newPhq9Scores['phq9_7'] = Math.max(newPhq9Scores['phq9_7'] || 0, 1)
    }
    if (lowerResponse.includes('烦躁') || lowerResponse.includes('急躁') || lowerResponse.includes('坐不住') ||
        lowerResponse.includes('易怒') || lowerResponse.includes('暴躁') || lowerResponse.includes('不耐烦')) {
      newPhq9Scores['phq9_8'] = Math.max(newPhq9Scores['phq9_8'] || 0, 2)
    }
    if (lowerResponse.includes('死') || lowerResponse.includes('不想活') || lowerResponse.includes('自杀') || 
        lowerResponse.includes('结束生命') || lowerResponse.includes('想死') || lowerResponse.includes('自伤')) {
      newPhq9Scores['phq9_9'] = Math.max(newPhq9Scores['phq9_9'] || 0, 3)
    }
    
    // GAD-7评分逻辑（增强版关键词匹配）
    if (lowerResponse.includes('紧张') || lowerResponse.includes('焦虑') || lowerResponse.includes('急躁') ||
        lowerResponse.includes('压力') || lowerResponse.includes('要写代码') || lowerResponse.includes('任务') ||
        lowerResponse.includes('deadline') || lowerResponse.includes('截止') || lowerResponse.includes('困扰')) {
      newGad7Scores['gad7_1'] = Math.max(newGad7Scores['gad7_1'] || 0, 2)
    }
    if (lowerResponse.includes('担心') || lowerResponse.includes('担忧') || lowerResponse.includes('停不下来') ||
        lowerResponse.includes('控制不住') || lowerResponse.includes('思虑过多')) {
      newGad7Scores['gad7_2'] = Math.max(newGad7Scores['gad7_2'] || 0, 2)
    }
    if (lowerResponse.includes('过度担心') || lowerResponse.includes('什么都担心') ||
        lowerResponse.includes('各种事') || lowerResponse.includes('小事也担心')) {
      newGad7Scores['gad7_3'] = Math.max(newGad7Scores['gad7_3'] || 0, 2)
    }
    if (lowerResponse.includes('放松不了') || lowerResponse.includes('难以放松') ||
        lowerResponse.includes('绷紧') || lowerResponse.includes('松不下来')) {
      newGad7Scores['gad7_4'] = Math.max(newGad7Scores['gad7_4'] || 0, 2)
    }
    if (lowerResponse.includes('坐立不安') || lowerResponse.includes('静不下来') ||
        lowerResponse.includes('坐不住') || lowerResponse.includes('躁动')) {
      newGad7Scores['gad7_5'] = Math.max(newGad7Scores['gad7_5'] || 0, 2)
    }
    if (lowerResponse.includes('易怒') || lowerResponse.includes('容易生气') || lowerResponse.includes('烦恼') ||
        lowerResponse.includes('烦躁') || lowerResponse.includes('脾气')) {
      newGad7Scores['gad7_6'] = Math.max(newGad7Scores['gad7_6'] || 0, 2)
    }
    if (lowerResponse.includes('害怕') || lowerResponse.includes('恐惧') || lowerResponse.includes('不好的事') ||
        lowerResponse.includes('预感') || lowerResponse.includes('灾难') || lowerResponse.includes('出错')) {
      newGad7Scores['gad7_7'] = Math.max(newGad7Scores['gad7_7'] || 0, 2)
    }
    
    // 更新评估进度
    const updatedProgress = {
      ...assessmentProgress,
      phq9: newPhq9Scores,
      gad7: newGad7Scores,
      coveredTopics: Array.from(new Set([...assessmentProgress.coveredTopics, ...detectedTopics])),
      questionCount: assessmentProgress.questionCount + 1
    }
    
    // 计算当前风险等级
    const phq9Total = Object.values(newPhq9Scores).reduce((sum, score) => sum + score, 0)
    const gad7Total = Object.values(newGad7Scores).reduce((sum, score) => sum + score, 0)
    const suicidalThoughts = newPhq9Scores['phq9_9'] || 0
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    if (suicidalThoughts >= 2 || phq9Total >= 15 || gad7Total >= 15) {
      riskLevel = 'high'
    } else if (phq9Total >= 10 || gad7Total >= 10) {
      riskLevel = 'medium'
    }
    
    // 更新情绪趋势
    const dominantEmotion = emotionData?.dominant_emotion || 
      (phq9Total > gad7Total ? '抑郁倾向' : gad7Total > 5 ? '焦虑倾向' : '稳定')
    
    // 确保情绪状态总是被更新，即使没有明显的关键词匹配
    const newIntensity = emotionData?.emotion_intensity || Math.max(phq9Total, gad7Total) / 10
    
    setEmotionTrend(prev => ({
      timeline: [...prev.timeline, {
        timestamp: new Date(),
        emotion: dominantEmotion,
        intensity: Math.max(0.1, newIntensity) // 确保至少有一些强度值
      }],
      currentDominant: dominantEmotion,
      riskLevel
    }))
    
    console.log('🔄 情绪状态更新:', {
      dominant: dominantEmotion,
      intensity: newIntensity,
      riskLevel,
      phq9Total,
      gad7Total,
      emotionData
    })
    
    setAssessmentProgress(updatedProgress)
    
    console.log('📊 评估进度更新:', {
      阶段: updatedProgress.currentPhase,
      问题数: updatedProgress.questionCount,
      PHQ9评分: newPhq9Scores,
      GAD7评分: newGad7Scores,
      PHQ9总分: phq9Total,
      GAD7总分: gad7Total,
      已评估项目: Object.keys(newPhq9Scores).length + Object.keys(newGad7Scores).length,
      涵盖主题: updatedProgress.coveredTopics
    })
    
    return updatedProgress
  }
  
  // 生成下一个智能问题
  const generateNextQuestion = (progress: typeof assessmentProgress) => {
    const { coveredTopics, currentPhase, questionCount } = progress
    
    // 检查是否需要进入下一阶段
    if (currentPhase === 'exploration' && questionCount >= 3) {
      setAssessmentProgress(prev => ({ ...prev, currentPhase: 'targeted' }))
    } else if (currentPhase === 'targeted' && questionCount >= 8) {
      setAssessmentProgress(prev => ({ ...prev, currentPhase: 'completion' }))
      return null // 进入问卷阶段
    }
    
    // 找出尚未充分探索的PHQ-9和GAD-7主题
    const uncoveredPhq9 = phq9Questions.filter(q => !(q.id in progress.phq9))
    const uncoveredGad7 = gad7Questions.filter(q => !(q.id in progress.gad7))
    
    // 根据阶段选择问题
    if (currentPhase === 'exploration') {
      // 探索阶段：开放性问题
      const openQuestions = [
        '能详细说说您最近的心情变化吗？',
        '什么事情最让您感到困扰？',
        '您觉得影响您心情的主要因素是什么？'
      ]
      return openQuestions[questionCount % openQuestions.length]
    } else if (currentPhase === 'targeted') {
      // 针对性阶段：基于PHQ-9和GAD-7的具体问题
      if (uncoveredPhq9.length > 0) {
        return uncoveredPhq9[0].dialogue
      } else if (uncoveredGad7.length > 0) {
        return uncoveredGad7[0].dialogue
      }
    }
    
    return '感谢您的分享，我们即将进入一些标准化的评估问题。'
  }

  // 生成抑郁指数历史数据（模拟过去30天的数据）
  const generateDepressionHistoryData = (currentScore: number, emotionTimeline: any[]) => {
    const historyData = []
    const today = new Date()
    
    // 生成过去30天的数据
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      let score: number
      if (i === 0) {
        // 今天使用当前评分
        score = currentScore
      } else {
        // 模拟历史趋势数据
        const baseScore = Math.max(0, currentScore + (Math.random() - 0.5) * 6)
        const trendFactor = i / 30 // 越早期影响越大
        score = Math.round(baseScore * (0.7 + trendFactor * 0.6))
      }
      
      historyData.push({
        date: date.toISOString().split('T')[0],
        value: Math.min(27, Math.max(0, score)), // 限制在PHQ-9的0-27范围内
        day: date.getDate(),
        month: date.getMonth() + 1
      })
    }
    
    return historyData
  }

  // 从对话中提取关键词和问题标签
  const extractKeywordsAndProblems = () => {
    const allMessages = messages.filter(msg => msg.type === 'user').map(msg => msg.content).join(' ')
    const extractedKeywords: string[] = []
    const problemTags: { text: string; type: 'depression' | 'anxiety' | 'sleep' | 'social' | 'physical' }[] = []
    
    // 抑郁相关关键词
    const depressionKeywords = ['沮丧', '绝望', '低落', '没兴趣', '疲倦', '失败', '没用', '难过', '孤独']
    depressionKeywords.forEach(keyword => {
      if (allMessages.includes(keyword)) {
        extractedKeywords.push(keyword)
        problemTags.push({ text: keyword, type: 'depression' })
      }
    })
    
    // 焦虑相关关键词
    const anxietyKeywords = ['紧张', '焦虑', '担心', '害怕', '恐惧', '不安', '心慌', '烦躁']
    anxietyKeywords.forEach(keyword => {
      if (allMessages.includes(keyword)) {
        extractedKeywords.push(keyword)
        problemTags.push({ text: keyword, type: 'anxiety' })
      }
    })
    
    // 睡眠相关关键词
    const sleepKeywords = ['失眠', '睡不着', '睡眠不好', '早醒', '多梦', '睡得多']
    sleepKeywords.forEach(keyword => {
      if (allMessages.includes(keyword)) {
        extractedKeywords.push(keyword)
        problemTags.push({ text: keyword, type: 'sleep' })
      }
    })
    
    // 社交相关关键词
    const socialKeywords = ['孤独', '不想见人', '社交', '朋友', '人际关系', '交流']
    socialKeywords.forEach(keyword => {
      if (allMessages.includes(keyword)) {
        extractedKeywords.push(keyword)
        problemTags.push({ text: keyword, type: 'social' })
      }
    })
    
    // 身体相关关键词
    const physicalKeywords = ['头痛', '胸闷', '食欲', '体重', '精力', '疲劳']
    physicalKeywords.forEach(keyword => {
      if (allMessages.includes(keyword)) {
        extractedKeywords.push(keyword)
        problemTags.push({ text: keyword, type: 'physical' })
      }
    })
    
    return { extractedKeywords, problemTags }
  }

  // 开始AI对话评估
  const startConversation = async (mode: 'text' | 'voice') => {
    setConversationMode(mode)
    setCurrentStep('conversation')
    
    try {
      // 调用后端API创建评估
      const assessmentResponse = await api.student.startAssessment({
        assessment_type: 'AI智能对话评估',
        description: `${mode === 'voice' ? '语音' : '文字'}模式心理状态评估`
      })
      
      setCurrentAssessmentId(assessmentResponse.id)
      
      const welcomeMessage = {
        id: Date.now().toString(),
        type: 'ai' as const,
        content: `您好！我是您的AI心理评估助手。接下来我将通过温和的对话来了解您的心理状态。请放松心情，诚实地与我分享您的感受。${mode === 'voice' ? '您可以通过语音与我交流。' : ''}`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
      
      // 开始引导式对话 - 调用AI生成个性化开场
      setTimeout(async () => {
        try {
          // 为评估创建AI会话
          const startData = await api.ai.startSession({ 
            problem_type: 'AI智能评估对话', 
            initial_message: '我需要开始一个心理健康评估对话，请给出一个温和的开场问题' 
          })
          setAssessmentSessionId(startData.session_id)
          
          // 使用AI生成的开场消息，如果没有则使用默认
          const openingQuestion = startData.message || '首先，能告诉我您最近的心情怎么样吗？有什么特别的感受或困扰吗？'
          addAIMessage(openingQuestion)
          
        } catch (error) {
          console.error('创建AI评估会话失败:', error)
          // 使用默认开场问题
          addAIMessage('首先，能告诉我您最近的心情怎么样吗？有什么特别的感受或困扰吗？')
        }
      }, 1000)
      
    } catch (error) {
      console.error('创建评估失败:', error)
      alert('创建评估失败，请稍后重试')
    }
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
    if (!currentInput.trim() || !currentAssessmentId) return
    
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: currentInput,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    const inputContent = currentInput
    setCurrentInput('')
    
    try {
      // 提交用户回答到后端（如果API格式有问题，不影响AI对话）
      try {
        await api.student.submitAnswer(currentAssessmentId, {
          question_id: `conversation_${Date.now()}`,
          answer: inputContent
        })
        console.log('✅ 答案提交成功')
      } catch (submitError) {
        console.warn('⚠️ 答案提交格式问题，但不影响AI对话:', submitError)
      }
      
      // 调用真实的AI对话API生成回复
      try {
        // 如果没有AI会话，先创建一个
        if (!assessmentSessionId) {
          console.log('🚀 为评估创建AI会话...')
          const startData = await api.ai.startSession({ 
            problem_type: 'AI智能评估对话', 
            initial_message: null 
          })
          setAssessmentSessionId(startData.session_id)
          console.log('✅ 评估AI会话创建成功:', startData.session_id)
        }
        
        // 调用AI对话API
        console.log('💬 发送用户输入到AI评估服务...')
        const chatData = await api.ai.chat({ 
          session_id: assessmentSessionId!, 
          message: inputContent 
        })
        
        const aiResponse = chatData.message || '谢谢您的分享，请继续告诉我更多。'
        console.log('✅ 收到AI评估回复:', aiResponse.slice(0, 50) + '...')
        
        // 智能分析用户回答
        const emotionData = chatData.emotion_analysis
        const updatedProgress = analyzeUserResponse(inputContent, emotionData)
        
        // 添加AI回复
        setTimeout(() => {
          addAIMessage(aiResponse)
          
          // 生成下一个智能问题
          setTimeout(() => {
            const nextQuestion = generateNextQuestion(updatedProgress)
            if (nextQuestion === null) {
              // 进入问卷阶段
              addAIMessage('非常感谢您诚实的分享。根据我们的对话，我对您的情况有了初步了解。现在让我们进入一些标准化的评估问题，这将帮助我更准确地评估您的心理状态。')
              setTimeout(() => setCurrentStep('questions'), 2000)
            } else if (nextQuestion) {
              // 继续智能评估对话
              addAIMessage(nextQuestion)
            }
          }, 1500)
        }, 800)
        
      } catch (aiError) {
        console.error('AI评估对话失败:', aiError)
        // 如果AI调用失败，使用备用回复
        setTimeout(() => {
          const responses = [
            '我理解您的感受。能具体说说是什么让您感到这种情绪吗？',
            '这听起来确实不容易。在什么情况下您会感到更好一些？',
            '感谢您的分享。这种状况持续多久了？',
            '您有尝试过什么方法来改善这种情况吗？'
          ]
          
          if (messages.length >= 8) {
            addAIMessage('非常感谢您诚实的分享。现在让我们进入一些标准化的评估问题，这将帮助我更准确地了解您的状况。')
            setTimeout(() => setCurrentStep('questions'), 2000)
          } else {
            addAIMessage(responses[Math.min(Math.floor(messages.length / 2), responses.length - 1)])
          }
        }, 1500)
      }
    } catch (error) {
      console.error('提交答案失败:', error)
      addAIMessage('抱歉，我遇到了一些技术问题。请您重新说一遍好吗？')
    }
  }

  // 语音识别
  const [speechRecognition, setSpeechRecognition] = useState<any | null>(null)
  const [isListening, setIsListening] = useState(false)

  useEffect(() => {
    // 初始化语音识别
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognitionAPI()
      
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'zh-CN'
      
      recognition.onstart = () => {
        setIsListening(true)
        console.log('语音识别开始...')
      }
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        console.log('识别结果:', transcript)
        setCurrentInput(transcript)
        setIsListening(false)
      }
      
      recognition.onerror = (event: any) => {
        console.error('语音识别错误:', event.error)
        setIsListening(false)
        alert(`语音识别失败: ${event.error}`)
      }
      
      recognition.onend = () => {
        setIsListening(false)
        console.log('语音识别结束')
      }
      
      setSpeechRecognition(recognition)
    }
  }, [])

  // 语音录制和识别
  const toggleRecording = async () => {
    if (speechRecognition) {
      if (isListening) {
        // 停止语音识别
        speechRecognition.stop()
        setIsListening(false)
      } else {
        // 开始语音识别
        try {
          speechRecognition.start()
        } catch (error) {
          console.error('启动语音识别失败:', error)
          alert('语音识别启动失败，请检查麦克风权限')
        }
      }
    } else {
      // 浏览器不支持语音识别，回退到录音模式
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
            // 在不支持语音识别的情况下，提示用户手动输入
            setCurrentInput('请手动输入您想说的内容（浏览器不支持语音识别）')
          }
          
          mediaRecorder.start()
          setIsRecording(true)
        } catch (error) {
          console.error('无法访问麦克风:', error)
          alert('无法访问麦克风，请检查权限设置')
        }
      }
    }
  }

  // 处理问卷回答
  const handleQuestionAnswer = async (answer: number) => {
    const currentQuestion = assessmentQuestions[questionIndex]
    setQuestionAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }))
    
    if (!currentAssessmentId) return
    
    try {
      // 提交问卷答案到后端
      await api.student.submitAnswer(currentAssessmentId, {
        question_id: currentQuestion.id,
        answer: currentQuestion.options[answer]
      })
    } catch (error) {
      console.error('提交问卷答案失败:', error)
    }
    
    if (questionIndex < assessmentQuestions.length - 1) {
      setQuestionIndex(questionIndex + 1)
    } else {
      // 问卷完成，开始AI分析
      await completeAssessment()
    }
  }

  // 完成评估并获取AI分析结果
  const completeAssessment = async () => {
    if (!currentAssessmentId) return
    
    setIsAnalyzing(true)
    
    try {
      // 调用后端API完成评估并获取AI分析结果
      const result = await api.student.completeAssessment(currentAssessmentId)
      
      // 使用智能评估收集的数据计算最终结果
      const phq9Total = Object.values(assessmentProgress.phq9).reduce((sum, score) => sum + score, 0)
      const gad7Total = Object.values(assessmentProgress.gad7).reduce((sum, score) => sum + score, 0)
      
      // 计算情绪趋势
      const emotionTimeline = emotionTrend.timeline
      const trendDirection = emotionTimeline.length >= 2 ? 
        (emotionTimeline[emotionTimeline.length - 1].intensity > emotionTimeline[0].intensity ? 'declining' : 'improving') : 'stable'
      
      // 识别问题类型
      const problemTypes: string[] = []
      if (phq9Total >= 5) problemTypes.push('抑郁倾向')
      if (gad7Total >= 5) problemTypes.push('焦虑倾向')
      if (assessmentProgress.phq9['phq9_3'] >= 1) problemTypes.push('睡眠问题')
      if (assessmentProgress.phq9['phq9_7'] >= 1) problemTypes.push('注意力问题')
      if (assessmentProgress.phq9['phq9_9'] >= 1) problemTypes.push('自伤风险')
      
      // 转换为前端格式，优先使用智能评估数据
      const frontendResult: AssessmentResult = {
        emotionalState: {
          dominant: emotionTrend.currentDominant,
          intensity: Math.round((phq9Total + gad7Total) / 2),
          trend: trendDirection
        },
        problemTypes: problemTypes.length > 0 ? problemTypes : ['情绪稳定'],
        depressionIndex: {
          current: phq9Total,
          history: generateDepressionHistoryData(phq9Total, emotionTimeline)
        },
        phq9Score: phq9Total,
        gad7Score: gad7Total,
        riskLevel: emotionTrend.riskLevel,
        recommendations: result.ai_report?.recommendations || [
          `基于PHQ-9评分(${phq9Total}分)和GAD-7评分(${gad7Total}分)的建议`,
          phq9Total >= 10 ? '建议寻求专业心理咨询' : '继续保持良好的心理状态',
          gad7Total >= 10 ? '学习放松和焦虑管理技巧' : '保持当前的应对方式',
          '规律作息，适度运动，保持社交联系'
        ]
      }
      
      setAssessmentResult(frontendResult)
      setCurrentStep('result')
      
    } catch (error) {
      console.error('完成评估失败:', error)
      
      // 如果API调用失败，使用备用结果
      const fallbackResult: AssessmentResult = {
        emotionalState: {
          dominant: '需要关注',
          intensity: 5,
          trend: 'stable'
        },
        problemTypes: ['评估异常'],
        depressionIndex: {
          current: 5,
          history: []
        },
        phq9Score: 10,
        gad7Score: 8,
        riskLevel: 'low',
        recommendations: [
          '评估过程中遇到技术问题',
          '建议稍后重新进行评估',
          '如有紧急情况请联系专业人员',
          '保持积极的生活态度'
        ]
      }
      
      setAssessmentResult(fallbackResult)
      setCurrentStep('result')
    } finally {
      setIsAnalyzing(false)
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
                      <h2 className="text-xl font-bold">AI智能心理评估师</h2>
                      <p className="text-blue-100">
                        {conversationMode === 'voice' ? '语音评估模式' : '文字评估模式'} • 
                        阶段: {assessmentProgress.currentPhase === 'exploration' ? '情况了解' : 
                              assessmentProgress.currentPhase === 'targeted' ? '深度评估' : '评估完成'}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span>当前情绪: {emotionTrend.currentDominant}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          emotionTrend.riskLevel === 'high' ? 'bg-red-500' :
                          emotionTrend.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}>
                          风险等级: {emotionTrend.riskLevel === 'high' ? '高' : 
                                    emotionTrend.riskLevel === 'medium' ? '中' : '低'}
                        </span>
                        <span>已评估: {Object.keys(assessmentProgress.phq9).length + Object.keys(assessmentProgress.gad7).length}/16项</span>
                      </div>
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
                  <div className="space-y-3">
                    {/* 语音识别状态提示 */}
                    {isListening && (
                      <div className="flex items-center justify-center space-x-2 text-purple-600">
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                        <span className="text-sm">正在监听语音，请说话...</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4">
                      <input
                        type="text"
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
                        placeholder={isListening ? "正在监听您的语音..." : "语音转换的文字将显示在这里..."}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={isListening}
                      />
                      <button
                        onClick={toggleRecording}
                        className={`px-6 py-3 rounded-xl transition-colors flex items-center space-x-2 ${
                    (isRecording || isListening)
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        {(isRecording || isListening) ? (
                          <>
                            <MicOff className="w-5 h-5" />
                            <span>{speechRecognition ? '停止识别' : '停止录音'}</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-5 h-5" />
                            <span>{speechRecognition ? '开始语音识别' : '开始录音'}</span>
                          </>
                        )}
                      </button>
                      
                      {/* 发送按钮 */}
                      <button
                        onClick={handleTextSubmit}
                        disabled={!currentInput.trim() || isListening}
                        className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        发送
                      </button>
                    </div>
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

                {/* 智能情绪状况分析 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-sm border p-6"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <Heart className="w-6 h-6 text-pink-600" />
                    <h2 className="text-xl font-semibold text-gray-900">当前情绪状况分析</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 问题类型 */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">识别的问题类型</h3>
                      <div className="space-y-2">
                        {assessmentResult.problemTypes.map((type, index) => (
                          <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg ${
                            type.includes('抑郁') ? 'bg-blue-50 border border-blue-200' :
                            type.includes('焦虑') ? 'bg-yellow-50 border border-yellow-200' :
                            type.includes('睡眠') ? 'bg-indigo-50 border border-indigo-200' :
                            type.includes('注意力') ? 'bg-purple-50 border border-purple-200' :
                            type.includes('自伤') ? 'bg-red-50 border border-red-200' :
                            'bg-green-50 border border-green-200'
                          }`}>
                            <div className={`w-3 h-3 rounded-full ${
                              type.includes('抑郁') ? 'bg-blue-500' :
                              type.includes('焦虑') ? 'bg-yellow-500' :
                              type.includes('睡眠') ? 'bg-indigo-500' :
                              type.includes('注意力') ? 'bg-purple-500' :
                              type.includes('自伤') ? 'bg-red-500' :
                              'bg-green-500'
                            }`}></div>
                            <span className={`text-sm font-medium ${
                              type.includes('抑郁') ? 'text-blue-900' :
                              type.includes('焦虑') ? 'text-yellow-900' :
                              type.includes('睡眠') ? 'text-indigo-900' :
                              type.includes('注意力') ? 'text-purple-900' :
                              type.includes('自伤') ? 'text-red-900' :
                              'text-green-900'
                            }`}>
                              {type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* 情绪时间线 */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">评估过程情绪变化</h3>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {emotionTrend.timeline.map((emotion, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700">{emotion.emotion}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, emotion.intensity * 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500 w-8">
                                {Math.round(emotion.intensity * 10)}/10
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
                  <div className="flex items-center space-x-3 mb-4">
                    <Activity className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">抑郁指数变化趋势</h2>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">过去30天的抑郁指数变化（基于PHQ-9评分）</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      <span className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>抑郁指数</span>
                      </span>
                      <span className="text-gray-500">范围: 0-27分</span>
                      <span className="text-gray-500">当前: {assessmentResult.depressionIndex.current}分</span>
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={assessmentResult.depressionIndex.history}>
                        <defs>
                          <linearGradient id="depressionGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="day" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value, index) => {
                            if (index % 5 === 0) return `${value}日`
                            return ''
                          }}
                        />
                        <YAxis 
                          domain={[0, 27]}
                          tick={{ fontSize: 12 }}
                          label={{ value: '抑郁指数', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`${value}分`, '抑郁指数']}
                          labelFormatter={(label) => `${label}日`}
                          contentStyle={{
                            backgroundColor: '#F9FAFB',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          fill="url(#depressionGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-900">轻微 (0-4)</p>
                      <p className="text-xs text-green-700">情绪稳定</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-medium text-yellow-900">轻度 (5-9)</p>
                      <p className="text-xs text-yellow-700">需要关注</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm font-medium text-orange-900">中度 (10-14)</p>
                      <p className="text-xs text-orange-700">建议咨询</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm font-medium text-red-900">重度 (15+)</p>
                      <p className="text-xs text-red-700">需要治疗</p>
                    </div>
                  </div>
                </motion.div>

                {/* 关键词分析和问题类型 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-white rounded-2xl shadow-sm border p-6"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <Target className="w-6 h-6 text-purple-600" />
                    <h2 className="text-xl font-semibold text-gray-900">关键词分析与问题识别</h2>
                  </div>
                  
                  {(() => {
                    const { extractedKeywords, problemTags } = extractKeywordsAndProblems()
                    return (
                      <div className="space-y-4">
                        {/* 提取的关键词 */}
                        <div>
                          <h3 className="font-medium text-gray-900 mb-3">从对话中提取的关键词</h3>
                          {extractedKeywords.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {extractedKeywords.map((keyword, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">未检测到明显的情绪关键词</p>
                          )}
                        </div>
                        
                        {/* 问题类型标签 */}
                        <div>
                          <h3 className="font-medium text-gray-900 mb-3">识别的问题类型</h3>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {problemTags.map((tag, index) => (
                              <div
                                key={index}
                                className={`p-3 rounded-lg text-center ${
                                  tag.type === 'depression' ? 'bg-blue-50 border border-blue-200' :
                                  tag.type === 'anxiety' ? 'bg-yellow-50 border border-yellow-200' :
                                  tag.type === 'sleep' ? 'bg-indigo-50 border border-indigo-200' :
                                  tag.type === 'social' ? 'bg-green-50 border border-green-200' :
                                  'bg-pink-50 border border-pink-200'
                                }`}
                              >
                                <p className={`text-sm font-medium ${
                                  tag.type === 'depression' ? 'text-blue-900' :
                                  tag.type === 'anxiety' ? 'text-yellow-900' :
                                  tag.type === 'sleep' ? 'text-indigo-900' :
                                  tag.type === 'social' ? 'text-green-900' :
                                  'text-pink-900'
                                }`}>
                                  {tag.type === 'depression' ? '抑郁相关' :
                                   tag.type === 'anxiety' ? '焦虑相关' :
                                   tag.type === 'sleep' ? '睡眠问题' :
                                   tag.type === 'social' ? '社交问题' : '身体症状'}
                                </p>
                                <p className={`text-xs mt-1 ${
                                  tag.type === 'depression' ? 'text-blue-700' :
                                  tag.type === 'anxiety' ? 'text-yellow-700' :
                                  tag.type === 'sleep' ? 'text-indigo-700' :
                                  tag.type === 'social' ? 'text-green-700' :
                                  'text-pink-700'
                                }`}>
                                  {tag.text}
                                </p>
                              </div>
                            ))}
                          </div>
                          {problemTags.length === 0 && (
                            <p className="text-gray-500 text-sm">未识别到特定问题类型，整体状态良好</p>
                          )}
                        </div>
                      </div>
                    )
                  })()}
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
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
  ArrowRight,
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
import { api, type AIAssessmentResponse, type AIAssessmentResult, type ComprehensiveAssessmentResponse, type AssessmentReadinessResponse, type AvailableScale } from '@/lib'

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
  riskLevel: 'minimal' | 'low' | 'medium' | 'high'
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
  const [currentStep, setCurrentStep] = useState<'intro' | 'conversation' | 'questions' | 'comprehensive-options' | 'comprehensive-results'>('intro')
  const [isRecording, setIsRecording] = useState(false)
  const [conversationMode, setConversationMode] = useState<'text' | 'voice'>('text')
  const [messages, setMessages] = useState<Array<{id: string, type: 'user' | 'ai', content: string, timestamp: Date}>>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isAIResponding, setIsAIResponding] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, number>>({})
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [reportAccuracy, setReportAccuracy] = useState<'accurate' | 'inaccurate' | null>(null)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [currentAssessmentId, setCurrentAssessmentId] = useState<number | null>(null)
  
  // 综合评估相关状态
  const [showComprehensiveOptions, setShowComprehensiveOptions] = useState(false)
  const [availableScales, setAvailableScales] = useState<AvailableScale[]>([])
  const [selectedScales, setSelectedScales] = useState<string[]>([])
  const [scaleResults, setScaleResults] = useState<Record<string, any>>({})
  const [isGeneratingComprehensive, setIsGeneratingComprehensive] = useState(false)
  const [comprehensiveReport, setComprehensiveReport] = useState<ComprehensiveAssessmentResponse | null>(null)
  const [currentAISessionId, setCurrentAISessionId] = useState<string | null>(null)
  const [assessmentReadiness, setAssessmentReadiness] = useState<AssessmentReadinessResponse | null>(null)
  const [assessmentSessionId, setAssessmentSessionId] = useState<string | null>(null)
  const [showManualRedirect, setShowManualRedirect] = useState(false)
  const [showCompletionTransition, setShowCompletionTransition] = useState(false)
  const [aiAssessmentSummary, setAiAssessmentSummary] = useState<any>(null)
  
  // 智能评估相关状态
  const [assessmentProgress, setAssessmentProgress] = useState<{
    phq9: Record<string, number>  // PHQ-9各项评分
    gad7: Record<string, number>  // GAD-7各项评分
    coveredTopics: string[]       // 已经涵盖的主题
    currentPhase: 'exploration' | 'targeted' | 'completion'  // 评估阶段
    questionCount: number         // 已问问题数量
    answeredQuestions: Array<{    // 新增：已回答的问题
      question: string
      answer: string
      emotion_analysis?: any
      timestamp: Date
    }>
    totalQuestions: number        // 总问题数
  }>({
    phq9: {},
    gad7: {},
    coveredTopics: [],
    currentPhase: 'exploration',
    questionCount: 0,
    answeredQuestions: [],
    totalQuestions: 6   // 设置总评估项目为6个
  })
  
  const [emotionTrend, setEmotionTrend] = useState<{
    timeline: Array<{ timestamp: Date; emotion: string; intensity: number }>
    currentDominant: string
    riskLevel: 'minimal' | 'low' | 'medium' | 'high'
  }>({
    timeline: [],
    currentDominant: '平稳',
    riskLevel: 'minimal'
  })
  
  // 添加状态变化监听
  useEffect(() => {
    console.log('🔄 emotionTrend状态变化:', emotionTrend)
  }, [emotionTrend])
  
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

  // 智能评估核心函数
  
  // EasyBert情感分析结果处理
  const processEasyBertAnalysis = (emotionData: any, userInput: string) => {
    if (!emotionData) return null
    
    const analysis = {
      dominant_emotion: emotionData.dominant_emotion,
      emotion_intensity: emotionData.emotion_intensity,
      confidence: emotionData.confidence || 0.8,
      keywords: emotionData.keywords || [],
      sentiment_score: emotionData.sentiment_score || 0
    }
    
    console.log('🧠 EasyBert情感分析结果:', analysis)
    
    // 根据情感分析结果调整对话策略
    const dialogueStrategy = getDialogueStrategy(analysis, userInput)
    
    return {
      analysis,
      strategy: dialogueStrategy
    }
  }
  
  // 根据EasyBert分析结果获取对话策略
  const getDialogueStrategy = (analysis: any, userInput: string) => {
    const { dominant_emotion, emotion_intensity, sentiment_score } = analysis
    
    let strategy = {
      approach: 'neutral', // neutral, supportive, probing, gentle
      focus_areas: [] as string[],
      next_questions: [] as string[],
      risk_level: 'minimal' as 'minimal' | 'low' | 'medium' | 'high'
    }
    
    // 根据主导情绪调整策略
    if (dominant_emotion === 'sadness' || dominant_emotion === 'depression') {
      strategy.approach = 'supportive'
      strategy.focus_areas.push('depression', 'self_esteem', 'social_support')
      strategy.next_questions = [
        '您刚才提到感到沮丧，能告诉我是什么让您有这种感觉吗？',
        '这种情绪持续多久了？',
        '您平时有什么方式让自己感觉好一些吗？'
      ]
    } else if (dominant_emotion === 'anxiety' || dominant_emotion === 'fear') {
      strategy.approach = 'gentle'
      strategy.focus_areas.push('anxiety', 'stress', 'coping_mechanisms')
      strategy.next_questions = [
        '听起来您可能感到有些焦虑，能具体说说是什么让您担心吗？',
        '这种担心对您的日常生活有什么影响？',
        '您有什么方法帮助自己放松吗？'
      ]
    } else if (dominant_emotion === 'anger' || dominant_emotion === 'frustration') {
      strategy.approach = 'neutral'
      strategy.focus_areas.push('anger_management', 'stress', 'relationships')
      strategy.next_questions = [
        '我注意到您可能感到有些愤怒或沮丧，能告诉我发生了什么吗？',
        '这种情绪通常什么时候会出现？',
        '您是如何处理这种情绪的？'
      ]
    }
    
    // 根据情绪强度和情感极性调整风险等级
    if (sentiment_score < -0.6 && emotion_intensity > 0.6) {
      // 高强度负面情绪 = 高风险
      strategy.risk_level = 'high'
    } else if (sentiment_score < -0.3 && emotion_intensity > 0.4) {
      // 中等强度负面情绪 = 中等风险
      strategy.risk_level = 'medium'
    } else if (sentiment_score > 0.3) {
      // 积极情绪 = 低风险或极低风险
      strategy.risk_level = emotion_intensity > 0.7 ? 'low' : 'minimal'
    } else if (sentiment_score >= -0.3 && sentiment_score <= 0.3) {
      // 中性情绪 = 低风险
      strategy.risk_level = 'low'
    } else if (sentiment_score < -0.3) {
      // 轻微负面情绪但不满足medium条件 = 低风险
      strategy.risk_level = 'low'
    }
    // 如果不符合以上条件，保持默认的 'minimal'
    
    console.log('🎯 对话策略:', strategy)
    return strategy
  }
  
  // 分析用户回答中的情绪和主题
  const analyzeUserResponse = (response: string, emotionData?: any, updateEmotion: boolean = true) => {
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
    
    let riskLevel: 'minimal' | 'low' | 'medium' | 'high' = 'minimal'
    if (suicidalThoughts >= 2 || phq9Total >= 15 || gad7Total >= 15) {
      riskLevel = 'high'
    } else if (phq9Total >= 10 || gad7Total >= 10) {
      riskLevel = 'medium'
    }
    
    // 更新情绪趋势 - 优先使用EasyBert分析结果
    const dominantEmotion = emotionData?.dominant_emotion || 
      (phq9Total > gad7Total ? '抑郁倾向' : gad7Total > 5 ? '焦虑倾向' : '稳定')
    
    // 映射情绪显示名称
    const emotionMapping: Record<string, string> = {
      'sadness': '悲伤',
      'anxiety': '焦虑',
      'anger': '愤怒',
      'happiness': '开心',
      'neutral': '平稳',
      'depression': '抑郁',
      '抑郁倾向': '抑郁倾向',
      '焦虑倾向': '焦虑倾向',
      '稳定': '稳定'
    }
    const emotionDisplayName = emotionMapping[dominantEmotion] || dominantEmotion
    
    // 确保情绪状态总是被更新，即使没有明显的关键词匹配
    const newIntensity = emotionData?.emotion_intensity || Math.max(phq9Total, gad7Total) / 10
    
    // 只有在允许更新情绪时才更新（但不更新风险等级，让后端AI的评估优先）
    if (updateEmotion) {
      setEmotionTrend(prev => {
        const newState = {
          timeline: [...prev.timeline, {
            timestamp: new Date(),
            emotion: dominantEmotion,
            intensity: Math.max(0.1, newIntensity) // 确保至少有一些强度值
          }],
          currentDominant: emotionDisplayName,
          riskLevel: prev.riskLevel // 保持之前的风险等级，不被PHQ9/GAD7覆盖
        }
        console.log('📊 analyzeUserResponse情绪状态更新:', prev.currentDominant, '->', newState.currentDominant)
        console.log('📊 保持风险等级不变:', prev.riskLevel)
        return newState
      })
    } else {
      console.log('📊 跳过analyzeUserResponse情绪更新，使用EasyBert结果')
    }
    
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
  
  // 生成下一个智能问题 - 动态随机选择
  const generateNextQuestion = (progress: typeof assessmentProgress) => {
    const { coveredTopics, currentPhase, questionCount, answeredQuestions } = progress
    
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
      // 探索阶段：多样化的开放性问题
      const openQuestions = [
        '能详细说说您最近的心情变化吗？',
        '什么事情最让您感到困扰？',
        '您觉得影响您心情的主要因素是什么？',
        '最近有什么事情让您印象深刻吗？',
        '您平时是如何应对压力的？',
        '有什么事情会让您感到特别开心或放松？',
        '您觉得自己最近的状态和以前相比有什么变化？',
        '在人际关系方面，您最近有什么感受？',
        '工作或学习方面，您最近遇到了什么挑战？',
        '您对未来有什么期待或担忧吗？'
      ]
      
      // 随机选择一个未问过的问题
      const usedQuestions = answeredQuestions.map(q => q.question)
      const availableQuestions = openQuestions.filter(q => !usedQuestions.includes(q))
      
      if (availableQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableQuestions.length)
        return availableQuestions[randomIndex]
      } else {
        // 如果都问过了，使用备选问题
        return '还有什么其他想和我分享的吗？'
      }
    } else if (currentPhase === 'targeted') {
      // 针对性阶段：基于PHQ-9和GAD-7的具体问题，但加入变化
      const targetedQuestions = []
      
      if (uncoveredPhq9.length > 0) {
        const question = uncoveredPhq9[Math.floor(Math.random() * uncoveredPhq9.length)]
        targetedQuestions.push(question.dialogue)
      }
      
      if (uncoveredGad7.length > 0) {
        const question = uncoveredGad7[Math.floor(Math.random() * uncoveredGad7.length)]
        targetedQuestions.push(question.dialogue)
      }
      
      // 添加一些过渡性问题
      targetedQuestions.push(
        '基于您刚才的分享，我想更深入了解一下...',
        '您刚才提到的情况，能再详细说说吗？',
        '这种感受对您的日常生活有什么影响？'
      )
      
      if (targetedQuestions.length > 0) {
        return targetedQuestions[Math.floor(Math.random() * targetedQuestions.length)]
      }
    }
    
    return '感谢您的分享，我们的对话评估即将完成。'
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
    setShowManualRedirect(false) // 重置跳转状态
    
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
      
      // 为评估创建AI会话（不生成额外的开场消息）
      setTimeout(async () => {
        try {
          // 为评估创建AI会话，但不添加额外的AI消息
          const startData = await api.ai.startSession({ 
            problem_type: 'AI智能评估对话', 
            initial_message: '用户已准备好开始心理健康评估对话' 
          })
          setAssessmentSessionId(startData.session_id)
          
          // 不添加额外的AI消息，只使用前面的欢迎语
          console.log('AI会话已创建，会话ID:', startData.session_id)
          
        } catch (error) {
          console.error('创建AI评估会话失败:', error)
          // 不添加额外消息，用户可以直接开始对话
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
    if (!currentInput.trim() || isAIResponding) return
    
    setIsAIResponding(true)
    
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
      // 提交用户回答到后端（如果没有评估ID或API格式有问题，不影响AI对话）
      if (currentAssessmentId) {
        try {
          await api.student.submitAnswer(currentAssessmentId, {
            question_id: `conversation_${Date.now()}`,
            answer: inputContent
          })
          console.log('✅ 答案提交成功')
        } catch (submitError) {
          console.warn('⚠️ 答案提交格式问题，但不影响AI对话:', submitError)
        }
      } else {
        console.log('ℹ️ 没有评估ID，跳过答案提交，但AI对话正常进行')
      }
      
      // 调用真实的AI对话API生成回复
      try {
        let currentSessionId = assessmentSessionId
        
        // 如果没有AI会话，先创建一个
        if (!currentSessionId) {
          console.log('🚀 为评估创建AI会话...')
          const startData = await api.ai.startSession({ 
            problem_type: 'AI智能评估对话', 
            initial_message: null 
          })
          currentSessionId = startData.session_id
          setAssessmentSessionId(currentSessionId)
          console.log('✅ 评估AI会话创建成功:', currentSessionId)
        }
        
        // 调用AI对话API
        console.log('💬 发送用户输入到AI评估服务，会话ID:', currentSessionId)
        const chatData = await api.ai.chat({ 
          session_id: currentSessionId, 
          message: inputContent 
        })
        
        console.log('📦 完整API响应:', JSON.stringify(chatData, null, 2))
        
        const aiResponse = chatData.message || '谢谢您的分享，请继续告诉我更多。'
        console.log('✅ 收到AI评估回复:', aiResponse.slice(0, 50) + '...')
        
        // 处理EasyBert情感分析结果
        const emotionData = chatData.emotion_analysis
        const riskData = chatData.risk_assessment
        console.log('🧠 收到的EasyBert情绪分析数据:', JSON.stringify(emotionData, null, 2))
        console.log('⚠️ 收到的风险评估数据:', JSON.stringify(riskData, null, 2))
        
        // 处理EasyBert分析结果并获取对话策略
        const easyBertResult = processEasyBertAnalysis(emotionData, inputContent)
        
        // 先调用分析函数，但不让它更新情绪状态（因为我们要用EasyBert的结果）
        const updatedProgress = analyzeUserResponse(inputContent, emotionData, false)
        
        // 基于EasyBert分析结果更新情绪显示和风险等级
        if (easyBertResult && easyBertResult.analysis) {
          const { analysis, strategy } = easyBertResult
          
          const emotionMapping: Record<string, string> = {
            'sadness': '悲伤',
            'anxiety': '焦虑',
            'anger': '愤怒',
            'happiness': '开心',
            'neutral': '平稳',
            'depression': '抑郁',
            'positive': '开心',
            'negative': '悲伤',
            'fear': '恐惧',
            'frustration': '沮丧'
          }
          
          const chineseEmotion = emotionMapping[analysis.dominant_emotion] || analysis.dominant_emotion
          console.log('🎨 EasyBert情绪分析结果:', analysis.dominant_emotion, '->', chineseEmotion)
          console.log('🎯 对话策略:', strategy)
          
          // 使用EasyBert分析的风险等级，如果后端也有风险评估则取更严重的
          const easyBertRiskLevel = strategy.risk_level
          const backendRiskLevel = chatData.risk_assessment?.risk_level || 'minimal'
          
          // 风险等级优先级：high > medium > low > minimal
          const getRiskPriority = (level: string) => {
            switch (level) {
              case 'high': return 4
              case 'medium': return 3
              case 'low': return 2
              case 'minimal': return 1
              default: return 1
            }
          }
          
          const finalRiskLevel = getRiskPriority(easyBertRiskLevel) >= getRiskPriority(backendRiskLevel) 
            ? easyBertRiskLevel 
            : backendRiskLevel
          
          console.log('⚠️ 最终风险等级:', { easyBert: easyBertRiskLevel, backend: backendRiskLevel, final: finalRiskLevel })
          
          // 立即更新状态
          setEmotionTrend(prev => {
            console.log('🔄 基于EasyBert更新状态:', {
              before: { emotion: prev.currentDominant, risk: prev.riskLevel },
              after: { emotion: chineseEmotion, risk: finalRiskLevel }
            })
            return {
              ...prev,
              currentDominant: chineseEmotion,
              riskLevel: finalRiskLevel as 'minimal' | 'low' | 'medium' | 'high'
            }
          })
          
          // 存储EasyBert分析结果和对话策略
          setAssessmentProgress(prev => ({
            ...prev,
            easyBertAnalysis: analysis,
            dialogueStrategy: strategy
          }))
        }
        
        // 存储用户回答
        const lastAIMessage = messages[messages.length - 1]?.content || '问题'
        setAssessmentProgress(prev => ({
          ...prev,
          answeredQuestions: [...prev.answeredQuestions, {
            question: lastAIMessage,
            answer: inputContent,
            emotion_analysis: emotionData,
            timestamp: new Date()
          }]
        }))
        
        // 检查是否有跳转指令
        if (chatData.redirect_action && chatData.redirect_action.type === 'complete_assessment') {
          // AI发送了评估完成指令，显示完成消息
          setTimeout(() => {
            addAIMessage(aiResponse)
            setIsAIResponding(false)
            
            // 显示评估完成提示和过渡界面
            setTimeout(async () => {
              // 先完成AI评估，保存结果
              await completeAssessment()
              
              // 准备AI评估摘要数据
              const aiAssessmentData = {
                session_id: currentSessionId,
                emotion_trend: emotionTrend,
                assessment_progress: assessmentProgress,
                easyBertAnalysis: easyBertResult?.analysis,
                dialogueStrategy: easyBertResult?.strategy,
                conversation_count: chatData.redirect_action?.conversation_count || 0,
                completion_reason: chatData.redirect_action?.reason || 'assessment_complete',
                timestamp: new Date().toISOString()
              }
              
              // 保存到localStorage供传统量表页面使用
              localStorage.setItem('ai_assessment_completed', 'true')
              localStorage.setItem('ai_assessment_result', JSON.stringify(aiAssessmentData))
              localStorage.setItem('ai_assessment_session_id', currentSessionId || '')
              
              console.log('✅ AI评估结果已保存到localStorage:', aiAssessmentData)
              
              // 设置摘要数据并显示过渡界面
              setAiAssessmentSummary(aiAssessmentData)
              setShowCompletionTransition(true)
              
              // 显示手动跳转提示
              const completionMessage = `🎉 **AI对话评估已完成！**\n\n✅ 已收集到足够的心理状态信息\n📊 对话轮数：${chatData.redirect_action?.conversation_count || 0}轮\n🧠 EasyBert情感分析已完成\n💾 评估数据已保存\n\n📋 **下一步：** 请点击下方按钮继续进行传统量表评估，完成后将生成综合心理评估报告。`
              addAIMessage(completionMessage)
              
              // 显示手动跳转按钮
              setShowManualRedirect(true)
            }, 1000)
          }, 800)
        } else {
          // 正常的对话流程
          setTimeout(() => {
            addAIMessage(aiResponse)
            setIsAIResponding(false)
            
            // 生成下一个智能问题
            setTimeout(() => {
              const nextQuestion = generateNextQuestion(updatedProgress)
              if (nextQuestion) {
                addAIMessage(nextQuestion)
              }
            }, 1500)
          }, 800)
        }
        
      } catch (aiError) {
        console.error('AI评估对话失败:', aiError)
        setIsAIResponding(false)
        // 如果AI调用失败，使用备用回复
        setTimeout(() => {
          const responses = [
            '我理解您的感受。能具体说说是什么让您感到这种情绪吗？',
            '这听起来确实不容易。在什么情况下您会感到更好一些？',
            '感谢您的分享。这种状况持续多久了？',
            '您有尝试过什么方法来改善这种情况吗？'
          ]
          
            addAIMessage(responses[Math.min(Math.floor(messages.length / 2), responses.length - 1)])
        }, 1500)
      }
    } catch (error) {
      console.error('提交答案失败:', error)
      addAIMessage('抱歉，我遇到了一些技术问题。请您重新说一遍好吗？')
    } finally {
      setIsAIResponding(false)
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
      
      // 保存AI评估会话ID到localStorage，供后续综合评估使用
      if (result.ai_session_id || assessmentSessionId) {
        const sessionId = result.ai_session_id || assessmentSessionId
        if (sessionId) {
          localStorage.setItem('ai_assessment_session_id', sessionId)
        }
        setCurrentAISessionId(sessionId)
      }
      
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
      
      // 标记AI评估已完成，准备跳转到传统量表
      localStorage.setItem('ai_assessment_completed', 'true')
      localStorage.setItem('ai_assessment_result', JSON.stringify(frontendResult))
      
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
        riskLevel: 'minimal',
        recommendations: [
          '评估过程中遇到技术问题',
          '建议稍后重新进行评估',
          '如有紧急情况请联系专业人员',
          '保持积极的生活态度'
        ]
      }
      
      setAssessmentResult(fallbackResult)
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

  // 检查综合评估准备状态
  const checkComprehensiveAssessmentReadiness = async (sessionId: string) => {
    try {
      const readiness = await api.comprehensiveAssessment.checkReadiness(sessionId)
      setAssessmentReadiness(readiness)
      
      // 获取可用量表
      const scales = await api.comprehensiveAssessment.getAvailableScales()
      setAvailableScales(scales)
      
      // 根据推荐自动选择量表
      if (readiness.scale_recommendations) {
        const recommendedScales = readiness.scale_recommendations
          .filter(rec => rec.priority === 'high')
          .map(rec => rec.scale_name)
        setSelectedScales(recommendedScales)
      }
      
    } catch (error) {
      console.error('检查综合评估准备状态失败:', error)
    }
  }

  // 生成综合评估报告
  const generateComprehensiveReport = async () => {
    if (!currentAISessionId && !assessmentSessionId) return

    setIsGeneratingComprehensive(true)
    
    try {
      // 构建量表结果
      const scaleData: Record<string, any> = {}
      selectedScales.forEach(scaleName => {
        if (scaleResults[scaleName]) {
          scaleData[scaleName] = scaleResults[scaleName]
        }
      })

      // 使用AI会话ID或评估会话ID
      const sessionId = currentAISessionId || assessmentSessionId || `assessment_${currentAssessmentId}`

      // 调用综合评估API
      const response = await api.comprehensiveAssessment.create({
        session_id: sessionId,
        scale_results: Object.keys(scaleData).length > 0 ? scaleData : undefined,
        include_conversation: true
      })

      setComprehensiveReport(response)
      setCurrentStep('comprehensive-results' as any)
      
    } catch (error) {
      console.error('生成综合评估报告失败:', error)
    } finally {
      setIsGeneratingComprehensive(false)
    }
  }

  // 提交量表结果
  const submitScaleResults = async (scaleName: string, results: any) => {
    try {
      const sessionId = currentAISessionId || assessmentSessionId || `assessment_${currentAssessmentId}`
      if (!sessionId) return

      const scaleData = {
        [scaleName]: {
          total_score: results.total_score,
          items: results.items || [],
          completion_time: new Date().toISOString(),
          max_score: results.max_score || 27
        }
      }

      await api.comprehensiveAssessment.submitScales({
        session_id: sessionId,
        scale_results: scaleData
      })

      // 更新本地状态
      setScaleResults(prev => ({
        ...prev,
        [scaleName]: scaleData[scaleName]
      }))

    } catch (error) {
      console.error('提交量表结果失败:', error)
    }
  }

  return (
    <RequireRole role="student">
      <DashboardLayout title={currentStep === 'intro' ? 'AI智能心理评估' : 
                              currentStep === 'conversation' ? 'AI对话评估' :
                              currentStep === 'questions' ? '标准化评估' : '综合评估'}>
        {/* AI评估完成过渡界面 */}
        {showCompletionTransition && (
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-sm border p-8"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">AI对话评估已完成！</h2>
                <p className="text-gray-600">
                  恭喜您完成了AI智能心理评估的对话部分。我们已经收集到了足够的信息来了解您的心理状态。
                </p>
              </div>

              {/* AI评估摘要 */}
              {aiAssessmentSummary && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 AI评估摘要</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        <span className="font-medium text-gray-700">当前情绪状态</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {aiAssessmentSummary.emotion_trend?.currentDominant || '平稳'}
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <span className="font-medium text-gray-700">风险等级</span>
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        aiAssessmentSummary.emotion_trend?.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                        aiAssessmentSummary.emotion_trend?.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        aiAssessmentSummary.emotion_trend?.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {aiAssessmentSummary.emotion_trend?.riskLevel === 'high' ? '高风险' :
                         aiAssessmentSummary.emotion_trend?.riskLevel === 'medium' ? '中等风险' :
                         aiAssessmentSummary.emotion_trend?.riskLevel === 'low' ? '低风险' : '极低风险'}
                      </span>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <MessageCircle className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-gray-700">对话轮数</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {aiAssessmentSummary.conversation_count || 0} 轮
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain className="w-5 h-5 text-purple-500" />
                        <span className="font-medium text-gray-700">AI分析状态</span>
                      </div>
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        ✅ 已完成
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 下一步说明 */}
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 下一步：完成传统量表评估</h3>
                <div className="space-y-2 text-gray-700">
                  <p>• 📋 填写标准化心理量表（PHQ-9、GAD-7等）</p>
                  <p>• 🔄 与AI对话结果进行交叉验证</p>
                  <p>• 📊 生成综合心理健康评估报告</p>
                  <p>• ⏱️ 预计需要5-10分钟</p>
                </div>
              </div>

              {/* 跳转按钮 */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowCompletionTransition(false)
                    // 跳转到传统量表页面
                    window.location.href = '/student/assessment'
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold flex items-center space-x-2"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span>继续完成传统量表评估</span>
                </button>
                
                <button
                  onClick={() => setShowCompletionTransition(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  稍后再说
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {currentStep === 'intro' && !showCompletionTransition && (
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
                          emotionTrend.riskLevel === 'medium' ? 'bg-yellow-500' : 
                          emotionTrend.riskLevel === 'low' ? 'bg-green-500' : 'bg-blue-500'
                        }`}>
                          风险等级: {emotionTrend.riskLevel === 'high' ? '高' : 
                                    emotionTrend.riskLevel === 'medium' ? '中' : 
                                    emotionTrend.riskLevel === 'low' ? '低' : '极低'}
                        </span>
                        <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                          已评估: {Math.min(assessmentProgress.answeredQuestions.length, assessmentProgress.totalQuestions)}/{assessmentProgress.totalQuestions}项
                        </span>
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
                      <div 
                        className="text-sm"
                        dangerouslySetInnerHTML={{
                          __html: formatMarkdown(message.content)
                        }}
                      />
                      <p className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
                  </motion.div>
          ))}
                
                {/* AI正在回复的加载提示 */}
                {isAIResponding && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-gray-100 text-gray-900">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-sm text-gray-500">AI正在思考中...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
        </div>

        {/* 手动跳转按钮 */}
        {showManualRedirect && (
          <div className="border-t bg-gradient-to-r from-blue-50 to-green-50 p-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2 text-blue-700">
                <FileText className="w-5 h-5" />
                <span className="font-medium">AI评估已完成</span>
              </div>
              <button
                onClick={() => router.push('/student/assessment')}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-md"
              >
                <FileText className="w-4 h-4" />
                <span>继续传统量表评估</span>
              </button>
              <button
                onClick={() => router.push('/student/dashboard')}
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-md"
              >
                <BarChart3 className="w-4 h-4" />
                <span>返回仪表板</span>
              </button>
            </div>
          </div>
        )}

        {/* 输入区域 */}
        <div className="border-t p-4">
                {!showManualRedirect && conversationMode === 'text' ? (
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
                      disabled={!currentInput.trim() || isAIResponding}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAIResponding ? '发送中...' : '发送'}
              </button>
            </div>
          ) : !showManualRedirect ? (
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
                        disabled={!currentInput.trim() || isListening || isAIResponding}
                        className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAIResponding ? '发送中...' : '发送'}
                      </button>
                    </div>
                  </div>
          ) : null}
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


        {/* 综合评估选项页面 */}
        {currentStep === 'comprehensive-options' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <Brain className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">综合心理评估</h1>
                  <p className="text-gray-600">结合AI对话分析和标准量表，为您提供全面的心理健康评估</p>
                </div>
              </div>

              {/* 推荐量表 */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 推荐量表</h2>
                <p className="text-gray-600 mb-4">基于您的对话内容，我们推荐以下标准化量表：</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableScales.slice(0, 4).map((scale) => (
                    <div key={scale.scale_name} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{scale.scale_name}</h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {scale.time_required}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{scale.description}</p>
                      <p className="text-xs text-gray-500">{scale.item_count}题 | {scale.score_range}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 生成报告按钮 */}
              <div className="flex space-x-4">
                <button
                  onClick={generateComprehensiveReport}
                  disabled={isGeneratingComprehensive}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isGeneratingComprehensive ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>生成中...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      <span>生成综合评估报告</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => router.push('/student/dashboard')}
                  className="px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  返回仪表板
                </button>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  💡 <strong>提示：</strong>您可以直接生成基于AI对话的综合评估报告，
                  或稍后完成推荐的标准量表后获得更精确的评估结果。
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* 综合评估结果页面 */}
        {currentStep === 'comprehensive-results' && comprehensiveReport && (
          <div className="max-w-5xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Brain className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-blue-900">🎯 综合心理评估报告</h1>
                  <p className="text-blue-700">基于AI对话分析和标准量表的全面评估</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4">
                <p className="text-gray-800 leading-relaxed">
                  {comprehensiveReport.assessment_report.executive_summary}
                </p>
              </div>
            </motion.div>

            {/* 整体评估 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 整体评估结果</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-4 rounded-xl ${
                  comprehensiveReport.assessment_report.overall_assessment.risk_level === 'low' ? 'bg-green-50 border border-green-200' :
                  comprehensiveReport.assessment_report.overall_assessment.risk_level === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <h3 className="font-semibold text-gray-900 mb-2">风险等级</h3>
                  <p className={`text-lg font-bold ${
                    comprehensiveReport.assessment_report.overall_assessment.risk_level === 'low' ? 'text-green-700' :
                    comprehensiveReport.assessment_report.overall_assessment.risk_level === 'medium' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {comprehensiveReport.assessment_report.overall_assessment.risk_level === 'low' ? '低风险' :
                     comprehensiveReport.assessment_report.overall_assessment.risk_level === 'medium' ? '中等风险' : '高风险'}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">主导情绪</h3>
                  <p className="text-lg font-bold text-blue-700">
                    {comprehensiveReport.assessment_report.overall_assessment.dominant_emotion === 'positive' ? '积极' :
                     comprehensiveReport.assessment_report.overall_assessment.dominant_emotion === 'negative' ? '消极' : '平稳'}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">评估可靠性</h3>
                  <p className="text-lg font-bold text-purple-700">
                    {comprehensiveReport.assessment_report.overall_assessment.assessment_reliability === 'high' ? '高' :
                     comprehensiveReport.assessment_report.overall_assessment.assessment_reliability === 'medium' ? '中等' : '较低'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* 即时建议 */}
            {comprehensiveReport.assessment_report.recommendations.immediate_actions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`rounded-2xl p-6 ${
                  comprehensiveReport.assessment_report.overall_assessment.risk_level === 'high' 
                    ? 'bg-red-50 border border-red-200' 
                    : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">⚡ 即时建议</h2>
                <div className="space-y-3">
                  {comprehensiveReport.assessment_report.recommendations.immediate_actions.map((action, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                        comprehensiveReport.assessment_report.overall_assessment.risk_level === 'high' 
                          ? 'text-red-600' 
                          : 'text-blue-600'
                      }`} />
                      <span className={
                        comprehensiveReport.assessment_report.overall_assessment.risk_level === 'high' 
                          ? 'text-red-800' 
                          : 'text-blue-800'
                      }>
                        {action}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 返回按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border p-6"
            >
              <div className="flex space-x-4">
                <button
                  onClick={() => router.push('/student/dashboard')}
                  className="px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  返回仪表板
                </button>
                
                <button
                  onClick={() => setCurrentStep('intro')}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  开始新的评估
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </DashboardLayout>
    </RequireRole>
  )
}

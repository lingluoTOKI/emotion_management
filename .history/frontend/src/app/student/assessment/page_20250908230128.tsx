'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Heart, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Download,
  Share2,
  ArrowLeft,
  FileText,
  BarChart3,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Users,
  Shield
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'
import { api, type ComprehensiveAssessmentResponse } from '@/lib'

interface AssessmentQuestion {
  id: number
  question: string
  category: 'depression' | 'anxiety' | 'stress'
  options: {
    value: number
    label: string
    description: string
  }[]
}

interface AssessmentResult {
  overallScore: number
  categories: {
    name: string
    rawScore: number
    standardScore: number
    level: 'normal' | 'mild' | 'moderate' | 'severe' | 'extremely_severe'
    description: string
    suggestions: string[]
  }[]
  riskLevel: 'minimal' | 'low' | 'medium' | 'high'
  recommendations: string[]
  timestamp: Date
}

// 风险等级样式和标签工具函数
const getRiskColor = (risk: 'minimal' | 'low' | 'medium' | 'high') => {
  switch (risk) {
    case 'minimal': return 'bg-blue-100 text-blue-800'
    case 'low': return 'bg-green-100 text-green-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'high': return 'bg-red-100 text-red-800'
  }
}

const getRiskLabel = (risk: 'minimal' | 'low' | 'medium' | 'high') => {
  switch (risk) {
    case 'minimal': return '极低风险'
    case 'low': return '低风险'
    case 'medium': return '中等风险'
    case 'high': return '高风险'
  }
}

// DASS-21等级样式和标签工具函数
const getDassLevelColor = (level: 'normal' | 'mild' | 'moderate' | 'severe' | 'extremely_severe') => {
  switch (level) {
    case 'normal': return 'bg-green-100 text-green-800'
    case 'mild': return 'bg-blue-100 text-blue-800'
    case 'moderate': return 'bg-yellow-100 text-yellow-800'
    case 'severe': return 'bg-orange-100 text-orange-800'
    case 'extremely_severe': return 'bg-red-100 text-red-800'
  }
}

const getDassLevelLabel = (level: 'normal' | 'mild' | 'moderate' | 'severe' | 'extremely_severe') => {
  switch (level) {
    case 'normal': return '正常范围'
    case 'mild': return '轻度'
    case 'moderate': return '中度'
    case 'severe': return '重度'
    case 'extremely_severe': return '极重度'
  }
}

export default function AssessmentPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [result, setResult] = useState<AssessmentResult | null>(null)
  // 新增：存储报告反馈状态
  const [reportFeedback, setReportFeedback] = useState<boolean | null>(null)
  const router = useRouter()
  
  // AI评估相关状态
  const [hasAIAssessment, setHasAIAssessment] = useState(false)
  const [aiAssessmentResult, setAIAssessmentResult] = useState<any>(null)
  const [aiSessionId, setAISessionId] = useState<string | null>(null)
  const [isGeneratingComprehensive, setIsGeneratingComprehensive] = useState(false)
  const [comprehensiveReport, setComprehensiveReport] = useState<ComprehensiveAssessmentResponse | null>(null)
  const [showComprehensiveReport, setShowComprehensiveReport] = useState(false)

  // DASS-21评估问题数据
  // 检查是否有AI评估结果
  useEffect(() => {
    const aiCompleted = localStorage.getItem('ai_assessment_completed')
    const aiResult = localStorage.getItem('ai_assessment_result')
    const sessionId = localStorage.getItem('ai_assessment_session_id')
    
    if (aiCompleted === 'true' && aiResult && sessionId) {
      setHasAIAssessment(true)
      const parsedResult = JSON.parse(aiResult)
      setAIAssessmentResult(parsedResult)
      setAISessionId(sessionId)
      console.log('✅ 检测到AI评估结果:', parsedResult)
      
      // 显示AI评估完成提示
      console.log('🎯 AI评估已完成，当前情绪:', parsedResult.emotion_trend?.currentDominant)
      console.log('⚠️ AI评估风险等级:', parsedResult.emotion_trend?.riskLevel)
      console.log('💬 对话轮数:', parsedResult.conversation_count)
      console.log('🧠 EasyBert情感分析:', parsedResult.easyBertAnalysis)
      console.log('🎯 对话策略:', parsedResult.dialogueStrategy)
    }
  }, [])

  const questions: AssessmentQuestion[] = [
    // 抑郁维度问题
    { id: 1, question: "我感到情绪低落和沮丧", category: "depression", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 2, question: "我感到神经过敏和紧张", category: "anxiety", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 3, question: "我感到难以容忍任何阻碍我前进的事情", category: "stress", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 4, question: "我对平时喜欢的事情提不起兴趣", category: "depression", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 5, question: "我感到一阵阵头晕", category: "anxiety", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 6, question: "我感到易怒且容易被激怒", category: "stress", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 7, question: "我觉得自己是个失败者", category: "depression", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 8, question: "我感到心跳得很厉害", category: "anxiety", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 9, question: "我感到难以放松", category: "stress", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 10, question: "我感到做任何事都很费力", category: "depression", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 11, question: "我感到紧张不安，无法放松", category: "anxiety", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 12, question: "我感到无法应对生活中的压力", category: "stress", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 13, question: "我对自己感到失望", category: "depression", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 14, question: "我感到莫名的恐惧", category: "anxiety", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 15, question: "我感到自己快要崩溃了", category: "stress", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 16, question: "我感到前途渺茫", category: "depression", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 17, question: "我感到难以呼吸", category: "anxiety", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 18, question: "我感到过度警觉", category: "stress", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 19, question: "我觉得自己毫无价值", category: "depression", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 20, question: "我感到害怕", category: "anxiety", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]},
    { id: 21, question: "我感到很难冷静下来", category: "stress", options: [
      { value: 0, label: "从不", description: "完全没有这种感受" },
      { value: 1, label: "有时", description: "偶尔会有这种感受" },
      { value: 2, label: "经常", description: "经常会有这种感受" },
      { value: 3, label: "总是", description: "几乎总是有这种感受" }
    ]}
  ]

  // 用户权限验证
  useEffect(() => {
    const username = localStorage.getItem('username')
    const role = localStorage.getItem('user_role')
    
    if (!username || !role) {
      alert('请先登录后再进行心理评估')
      router.push('/')
      return
    }
    
    if (role !== 'student') {
      alert('只有学生用户才能进行心理评估')
      router.push('/')
      return
    }
  }, [router])

  // 导出完整报告功能
  const exportFullReport = () => {
    if (!result) return
    const reportData = {
      studentName: localStorage.getItem('username') || '匿名用户',
      assessmentDate: result.timestamp.toLocaleString('zh-CN'),
      overallScore: result.overallScore,
      riskLevel: result.riskLevel,
      riskLabel: getRiskLabel(result.riskLevel),
      // 新增：将反馈状态加入导出报告
      reportFeedback: reportFeedback === true ? '符合' : reportFeedback === false ? '不符合' : '未反馈',
      categoryDetails: result.categories.map(cat => ({
        name: cat.name,
        rawScore: cat.rawScore,
        standardScore: cat.standardScore,
        level: cat.level,
        levelLabel: getDassLevelLabel(cat.level),
        description: cat.description,
        suggestions: cat.suggestions
      })),
      comprehensiveRecommendations: result.recommendations,
      completedQuestions: questions.map(q => ({
        question: q.question,
        category: q.category,
        selectedAnswer: answers[q.id] 
          ? q.options.find(o => o.value === answers[q.id])?.label 
          : '未回答'
      }))
    }
    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `心理评估完整报告_${new Date().toLocaleDateString()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // 答案处理
  const handleAnswer = (questionId: number, value: number) => {
    if (value < 0 || value > 3) {
      console.error('无效的答案值:', value)
      return
    }
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  // 导航控制
  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
 
  // 完成评估处理
  const handleComplete = async () => {
    const unansweredQuestions = questions.filter(q => answers[q.id] === undefined)
    
    if (unansweredQuestions.length > 0) {
      alert(`请回答所有问题后再完成评估。还有 ${unansweredQuestions.length} 个问题未回答。`)
      return
    }
    
    try {
      const mockResult: AssessmentResult = {
        overallScore: calculateOverallScore(),
        categories: generateCategoryResults(),
        riskLevel: calculateRiskLevel(),
        recommendations: generateRecommendations(),
        timestamp: new Date()
      }
      
      setResult(mockResult)
      setIsCompleted(true)
      
      // 如果有AI评估结果，自动生成综合报告
      if (hasAIAssessment && aiSessionId) {
        await generateComprehensiveReport(mockResult)
      }
    } catch (error) {
      console.error('生成评估结果时出错:', error)
      alert('生成评估结果时出现错误，请重试。')
    }
  }

  // 生成综合评估报告
  const generateComprehensiveReport = async (scaleResult: AssessmentResult) => {
    if (!aiSessionId) return

    setIsGeneratingComprehensive(true)
    
    try {
      console.log('🎯 开始生成综合评估报告...')
      console.log('AI评估数据:', aiAssessmentResult)
      console.log('量表评估数据:', scaleResult)
      
      // 构建量表结果数据
      const scaleData = {
        "DASS-21": {
          total_score: scaleResult.overallScore,
          categories: scaleResult.categories.map(cat => ({
            name: cat.name,
            raw_score: cat.rawScore,
            standard_score: cat.standardScore,
            level: cat.level
          })),
          completion_time: new Date().toISOString(),
          risk_level: scaleResult.riskLevel
        }
      }

      // 构建AI评估数据，包含EasyBert分析结果
      const aiData = aiAssessmentResult ? {
        emotion_trend: aiAssessmentResult.emotion_trend,
        assessment_progress: aiAssessmentResult.assessment_progress,
        easyBertAnalysis: aiAssessmentResult.easyBertAnalysis,
        dialogueStrategy: aiAssessmentResult.dialogueStrategy,
        conversation_count: aiAssessmentResult.conversation_count,
        completion_reason: aiAssessmentResult.completion_reason,
        timestamp: aiAssessmentResult.timestamp
      } : null

      console.log('📊 发送综合评估数据:', {
        session_id: aiSessionId,
        scale_results: scaleData,
        ai_assessment: aiData,
        include_conversation: true
      })

      // 调用综合评估API
      const response = await api.comprehensiveAssessment.create({
        session_id: aiSessionId,
        scale_results: scaleData,
        ai_assessment: aiData,
        include_conversation: true
      })

      setComprehensiveReport(response)
      setShowComprehensiveReport(true)
      
      // 清理localStorage中的AI评估数据
      localStorage.removeItem('ai_assessment_completed')
      localStorage.removeItem('ai_assessment_result')
      localStorage.removeItem('ai_assessment_session_id')
      
      console.log('✅ 综合评估报告生成完成')
      
    } catch (error) {
      console.error('生成综合评估报告失败:', error)
      // 即使综合报告失败，也显示传统评估结果
    } finally {
      setIsGeneratingComprehensive(false)
    }
  }

  // 新增：处理报告反馈选择
  const handleReportFeedback = (isMatch: boolean) => {
    setReportFeedback(isMatch)
    // 可选：反馈选择后可添加提示（如“感谢您的反馈！”）
    alert(isMatch ? '感谢您的认可，我们将继续优化评估服务！' : '感谢您的反馈，我们将努力改进评估准确性！')
  }

  // DASS-21计分工具函数
  const calculateDimensionScore = (category: 'depression' | 'anxiety' | 'stress') => {
    const categoryQuestions = questions.filter(q => q.category === category)
    const rawScore = categoryQuestions.reduce((sum, q) => sum + (answers[q.id] || 0), 0)
    const standardScore = rawScore * 2  // DASS-21标准分 = 原始分 × 2
    return { rawScore, standardScore }
  }

  const getDimensionLevel = (standardScore: number, dimension: 'depression' | 'anxiety' | 'stress'): 'normal' | 'mild' | 'moderate' | 'severe' | 'extremely_severe' => {
    const thresholds = {
      depression: { mild: 10, moderate: 14, severe: 21, extremely_severe: 28 },
      anxiety: { mild: 8, moderate: 10, severe: 15, extremely_severe: 20 },
      stress: { mild: 15, moderate: 19, severe: 26, extremely_severe: 34 }
    }
    
    const t = thresholds[dimension]
    if (standardScore >= t.extremely_severe) return 'extremely_severe'
    if (standardScore >= t.severe) return 'severe'
    if (standardScore >= t.moderate) return 'moderate'
    if (standardScore >= t.mild) return 'mild'
    return 'normal'
  }

  // 总体分数计算（用于风险评估）
  const calculateOverallScore = () => {
    const depression = calculateDimensionScore('depression')
    const anxiety = calculateDimensionScore('anxiety')
    const stress = calculateDimensionScore('stress')
    // 返回三个维度标准分的平均值
    return Math.round((depression.standardScore + anxiety.standardScore + stress.standardScore) / 3)
  }

  // 生成各维度结果（DASS-21）
  const generateCategoryResults = () => {
    const dimensions: Array<{key: 'depression' | 'anxiety' | 'stress', name: string}> = [
      { key: 'depression', name: '抑郁' },
      { key: 'anxiety', name: '焦虑' }, 
      { key: 'stress', name: '压力' }
    ]
    
    return dimensions.map(dim => {
      const scores = calculateDimensionScore(dim.key)
      const level = getDimensionLevel(scores.standardScore, dim.key)
      
      return {
        name: dim.name,
        rawScore: scores.rawScore,
        standardScore: scores.standardScore,
        level,
        description: getDassCategoryDescription(dim.key, level),
        suggestions: getDassCategorySuggestions(dim.key, level)
      }
    })
  }

  // DASS-21维度描述
  const getDassCategoryDescription = (dimension: 'depression' | 'anxiety' | 'stress', level: 'normal' | 'mild' | 'moderate' | 'severe' | 'extremely_severe') => {
    const descriptions = {
      depression: {
        normal: '您的情绪状态良好，没有明显的抑郁症状',
        mild: '您可能存在轻度的情绪低落，但仍在可控范围内',
        moderate: '您的抑郁症状达到中度水平，建议关注并寻求支持',
        severe: '您的抑郁症状较为严重，强烈建议寻求专业心理咨询',
        extremely_severe: '您的抑郁症状非常严重，需要立即寻求专业治疗'
      },
      anxiety: {
        normal: '您的焦虑水平正常，能够有效应对日常压力',
        mild: '您可能存在轻度焦虑，但基本不影响日常生活',
        moderate: '您的焦虑症状达到中度水平，建议学习放松技巧',
        severe: '您的焦虑症状较为严重，建议寻求专业心理咨询',
        extremely_severe: '您的焦虑症状非常严重，需要立即寻求专业治疗'
      },
      stress: {
        normal: '您的压力管理能力良好，能够有效应对生活挑战',
        mild: '您可能感受到一定程度的压力，但仍能正常应对',
        moderate: '您的压力水平较高，建议学习压力管理技巧',
        severe: '您承受的压力很大，强烈建议寻求专业指导',
        extremely_severe: '您的压力水平极高，需要立即寻求专业帮助'
      }
    }
    return descriptions[dimension][level]
  }

  // DASS-21维度建议
  const getDassCategorySuggestions = (dimension: 'depression' | 'anxiety' | 'stress', level: 'normal' | 'mild' | 'moderate' | 'severe' | 'extremely_severe') => {
    const suggestions = {
      depression: {
        normal: ['保持良好的生活习惯', '继续参与喜欢的活动', '定期运动'],
        mild: ['增加户外活动', '保持社交联系', '规律作息', '进行适度运动'],
        moderate: ['寻求朋友家人支持', '考虑心理咨询', '建立日常正念练习', '参加兴趣小组'],
        severe: ['立即寻求专业心理咨询', '考虑认知行为疗法', '建立强有力的支持网络', '必要时考虑药物治疗'],
        extremely_severe: ['紧急寻求心理健康专业人士帮助', '考虑住院治疗', '建立24小时支持系统', '立即开始药物治疗']
      },
      anxiety: {
        normal: ['继续当前的压力管理方法', '保持规律运动', '维持充足睡眠'],
        mild: ['学习深呼吸技巧', '尝试渐进式肌肉放松', '减少咖啡因摄入', '保持规律作息'],
        moderate: ['学习正念冥想', '考虑瑜伽或太极', '限制刺激性活动', '寻求朋友支持'],
        severe: ['寻求专业心理咨询', '学习认知重构技巧', '考虑抗焦虑治疗', '建立应急应对计划'],
        extremely_severe: ['立即寻求心理健康专业人士帮助', '考虑药物治疗', '建立危机干预计划', '避免独处时间过长']
      },
      stress: {
        normal: ['保持工作生活平衡', '继续现有的放松活动', '定期评估压力源'],
        mild: ['学习时间管理技巧', '设定合理目标', '增加休息时间', '培养兴趣爱好'],
        moderate: ['重新评估优先级', '学习说"不"', '寻求工作或学习支持', '建立放松例程'],
        severe: ['寻求专业压力管理指导', '考虑减少责任', '建立强大支持网络', '学习问题解决技巧'],
        extremely_severe: ['立即寻求专业帮助', '考虑暂时减少工作学习负担', '建立紧急支持系统', '必要时考虑药物辅助']
      }
    }
    return suggestions[dimension][level]
  }

  // 计算风险等级（基于DASS-21）
  const calculateRiskLevel = (): 'minimal' | 'low' | 'medium' | 'high' => {
    try {
      const depression = calculateDimensionScore('depression')
      const anxiety = calculateDimensionScore('anxiety')
      const stress = calculateDimensionScore('stress')
      
      const depLevel = getDimensionLevel(depression.standardScore, 'depression')
      const anxLevel = getDimensionLevel(anxiety.standardScore, 'anxiety')
      const stressLevel = getDimensionLevel(stress.standardScore, 'stress')
      
      // 如果任一维度达到重度或极重度，判定为高风险
      if (depLevel === 'severe' || depLevel === 'extremely_severe' ||
          anxLevel === 'severe' || anxLevel === 'extremely_severe' ||
          stressLevel === 'severe' || stressLevel === 'extremely_severe') {
        return 'high'
      }
      
      // 如果任一维度达到中度，或多个维度达到轻度，判定为中等风险
      if (depLevel === 'moderate' || anxLevel === 'moderate' || stressLevel === 'moderate' ||
          [depLevel, anxLevel, stressLevel].filter(level => level === 'mild').length >= 2) {
        return 'medium'
      }
      
      // 其他情况判定为低风险
      return 'low'
    } catch (error) {
      console.error('计算风险等级时出错:', error)
      return 'medium'
    }
  }

  // 生成综合建议
  const generateRecommendations = () => {
    try {
      const riskLevel = calculateRiskLevel()
      const baseRecommendations = [
        '定期进行心理健康评估',
        '保持规律的作息时间',
        '培养健康的兴趣爱好',
        '与朋友家人保持联系'
      ]
      
      if (riskLevel === 'high') {
        return [
          '建议尽快寻求专业心理咨询',
          '考虑联系学校心理健康中心',
          '与信任的人分享您的感受',
          '保持规律的作息和运动',
          ...baseRecommendations
        ]
      } else if (riskLevel === 'medium') {
        return [
          '建议定期进行心理健康检查',
          '学习压力管理和放松技巧',
          '增加户外活动和运动',
          ...baseRecommendations
        ]
      } else {
        return [
          '继续保持当前的健康状态',
          '定期进行心理健康评估',
          '帮助身边需要支持的人',
          ...baseRecommendations
        ]
      }
    } catch (error) {
      console.error('生成建议时出错:', error)
      return [
        '建议咨询专业人士获取个性化建议',
        '保持规律的作息时间',
        '与朋友家人保持联系'
      ]
    }
  }

  // 返回处理
  const handleBack = () => {
    if (Object.keys(answers).length > 0) {
      const confirmed = window.confirm('您有未完成的评估，确定要离开吗？')
      if (!confirmed) return
    }
    router.push('/student/dashboard')
  }

  // 计算进度百分比
  const getProgressPercentage = () => {
    if (questions.length === 0) return 0
    return ((currentStep + 1) / questions.length) * 100
  }

  // 评估结果页
  if (isCompleted && result) {
    return (
      <RequireRole role="student">
        {/* 通过DashboardLayout的title属性设置页面标题，避免重复 */}
        <DashboardLayout title="心理评估结果">
          <div className="space-y-8">
            {/* 如果有综合报告，主要展示综合结果 */}
            {showComprehensiveReport && comprehensiveReport ? (
              <>
            {/* 综合评估报告 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                  className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border border-purple-200/50 rounded-3xl p-8 shadow-xl overflow-hidden"
                >
                  {/* 背景装饰 */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-200/30 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-8">
                      <div className="relative p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                        <Brain className="w-8 h-8 text-white" />
                        <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-md">
                          <BarChart3 className="w-3 h-3 text-purple-600" />
                        </div>
                      </div>
                  <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-900 to-pink-900 bg-clip-text text-transparent">
                          🎯 综合心理评估报告
                        </h2>
                        <p className="text-purple-700/80 text-lg">融合AI智能分析与标准化量表的综合评估</p>
                      </div>
                  </div>
                </div>
                
                  {/* 综合分析摘要 */}
                  <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-white/50">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">📄 综合分析摘要</h3>
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-xl p-5 border-l-4 border-purple-500">
                      <p className="text-gray-800 leading-relaxed text-lg">
                    {comprehensiveReport.assessment_report.executive_summary}
                  </p>
                    </div>
                  </div>
                  
                  {/* EasyBert情感分析结果 */}
                  {aiAssessmentResult?.easyBertAnalysis && (
                    <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-white/50">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl">
                          <Brain className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">🧠 EasyBert情感分析结果</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-r from-green-50 to-teal-50/50 rounded-xl p-5 border-l-4 border-green-500">
                          <h4 className="font-semibold text-gray-900 mb-3">主导情绪</h4>
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl font-bold text-green-600">
                              {aiAssessmentResult.easyBertAnalysis.dominant_emotion}
                            </span>
                            <span className="text-sm text-gray-600">
                              强度: {(aiAssessmentResult.easyBertAnalysis.emotion_intensity * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-xl p-5 border-l-4 border-blue-500">
                          <h4 className="font-semibold text-gray-900 mb-3">情感倾向</h4>
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl font-bold text-blue-600">
                              {aiAssessmentResult.easyBertAnalysis.sentiment_score > 0 ? '积极' : 
                               aiAssessmentResult.easyBertAnalysis.sentiment_score < 0 ? '消极' : '中性'}
                            </span>
                            <span className="text-sm text-gray-600">
                              得分: {aiAssessmentResult.easyBertAnalysis.sentiment_score.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {aiAssessmentResult.easyBertAnalysis.keywords && aiAssessmentResult.easyBertAnalysis.keywords.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-900 mb-3">关键词分析</h4>
                          <div className="flex flex-wrap gap-2">
                            {aiAssessmentResult.easyBertAnalysis.keywords.map((keyword: string, index: number) => (
                              <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 对话策略分析 */}
                  {aiAssessmentResult?.dialogueStrategy && (
                    <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-white/50">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">🎯 对话策略分析</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50/50 rounded-xl p-4 border-l-4 border-purple-500">
                          <h4 className="font-semibold text-gray-900 mb-2">对话方式</h4>
                          <span className="text-lg font-bold text-purple-600">
                            {aiAssessmentResult.dialogueStrategy.approach === 'supportive' ? '支持性' :
                             aiAssessmentResult.dialogueStrategy.approach === 'gentle' ? '温和型' :
                             aiAssessmentResult.dialogueStrategy.approach === 'probing' ? '探索性' : '中性'}
                          </span>
                        </div>
                        <div className="bg-gradient-to-r from-orange-50 to-red-50/50 rounded-xl p-4 border-l-4 border-orange-500">
                          <h4 className="font-semibold text-gray-900 mb-2">风险等级</h4>
                          <span className={`text-lg font-bold ${
                            aiAssessmentResult.dialogueStrategy.risk_level === 'high' ? 'text-red-600' :
                            aiAssessmentResult.dialogueStrategy.risk_level === 'medium' ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {aiAssessmentResult.dialogueStrategy.risk_level === 'high' ? '高风险' :
                             aiAssessmentResult.dialogueStrategy.risk_level === 'medium' ? '中等风险' : '低风险'}
                          </span>
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-xl p-4 border-l-4 border-blue-500">
                          <h4 className="font-semibold text-gray-900 mb-2">关注领域</h4>
                          <div className="flex flex-wrap gap-1">
                            {aiAssessmentResult.dialogueStrategy.focus_areas?.slice(0, 2).map((area: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 核心评估指标 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className={`relative group hover:scale-105 transition-all duration-300 ${
                        comprehensiveReport.assessment_report.overall_assessment.risk_level === 'low' ? 'bg-gradient-to-br from-green-50 to-emerald-100' :
                        comprehensiveReport.assessment_report.overall_assessment.risk_level === 'medium' ? 'bg-gradient-to-br from-yellow-50 to-orange-100' :
                        'bg-gradient-to-br from-red-50 to-pink-100'
                      } rounded-2xl p-6 shadow-lg border border-white/50 backdrop-blur-sm`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-xl ${
                              comprehensiveReport.assessment_report.overall_assessment.risk_level === 'low' ? 'bg-green-500' :
                              comprehensiveReport.assessment_report.overall_assessment.risk_level === 'medium' ? 'bg-yellow-500' :
                              'bg-red-500'
                            } shadow-lg`}>
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                            </div>
                            <h4 className="font-bold text-gray-900">🚨 综合风险等级</h4>
                          </div>
                          <div className={`w-3 h-3 rounded-full animate-pulse ${
                            comprehensiveReport.assessment_report.overall_assessment.risk_level === 'low' ? 'bg-green-500' :
                            comprehensiveReport.assessment_report.overall_assessment.risk_level === 'medium' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}></div>
                        </div>
                        <p className={`text-3xl font-black mb-3 ${
                      comprehensiveReport.assessment_report.overall_assessment.risk_level === 'low' ? 'text-green-700' :
                      comprehensiveReport.assessment_report.overall_assessment.risk_level === 'medium' ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      {comprehensiveReport.assessment_report.overall_assessment.risk_level === 'low' ? '低风险' :
                       comprehensiveReport.assessment_report.overall_assessment.risk_level === 'medium' ? '中等风险' : '高风险'}
                    </p>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white/50 rounded-lg p-2">
                            <Brain className="w-4 h-4 text-blue-600" />
                            <span>AI分析: {aiAssessmentResult?.emotion_trend?.riskLevel === 'high' ? '高风险' : aiAssessmentResult?.emotion_trend?.riskLevel === 'medium' ? '中风险' : '低风险'}</span>
                  </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white/50 rounded-lg p-2">
                            <BarChart3 className="w-4 h-4 text-green-600" />
                            <span>量表评估: {getRiskLabel(result.riskLevel)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="relative group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-100 rounded-2xl p-6 shadow-lg border border-white/50 backdrop-blur-sm"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-500 rounded-xl shadow-lg">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </div>
                            <h4 className="font-bold text-gray-900">💭 综合情绪评估</h4>
                          </div>
                          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                        </div>
                        <p className="text-3xl font-black text-blue-700 mb-3">
                          {comprehensiveReport.assessment_report.overall_assessment.dominant_emotion === 'positive' ? '积极倾向' :
                           comprehensiveReport.assessment_report.overall_assessment.dominant_emotion === 'negative' ? '需要关注' : '相对平稳'}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white/50 rounded-lg p-2">
                            <Brain className="w-4 h-4 text-blue-600" />
                            <span>AI识别: {aiAssessmentResult?.emotion_trend?.currentDominant || '平稳'}</span>
                  </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white/50 rounded-lg p-2">
                            <BarChart3 className="w-4 h-4 text-green-600" />
                            <span>量表总分: {result.overallScore}/42</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="relative group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-indigo-50 to-purple-100 rounded-2xl p-6 shadow-lg border border-white/50 backdrop-blur-sm"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-500 rounded-xl shadow-lg">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            <h4 className="font-bold text-gray-900">📈 评估可靠性</h4>
                          </div>
                          <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
                        </div>
                        <p className="text-3xl font-black text-indigo-700 mb-3">
                      {comprehensiveReport.assessment_report.overall_assessment.assessment_reliability === 'high' ? '高' :
                       comprehensiveReport.assessment_report.overall_assessment.assessment_reliability === 'medium' ? '中等' : '较低'}
                    </p>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white/50 rounded-lg p-2">
                            <Brain className="w-4 h-4 text-blue-600" />
                            <span>对话轮数: {aiAssessmentResult?.conversation_count || 0} 轮</span>
                  </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white/50 rounded-lg p-2">
                            <BarChart3 className="w-4 h-4 text-green-600" />
                            <span>量表维度: {result.categories.length} 项</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                </div>

                  {/* 个性化建议方案 */}
                {comprehensiveReport.assessment_report.recommendations.immediate_actions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-200/20 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                          <h4 className="text-xl font-bold text-gray-900">⚡ 个性化建议方案</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {comprehensiveReport.assessment_report.recommendations.immediate_actions.slice(0, 4).map((action, index) => (
                            <motion.div 
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + index * 0.1 }}
                              className="group hover:scale-105 transition-all duration-300"
                            >
                              <div className="flex items-start space-x-3 p-4 bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 rounded-xl border border-orange-200/50 shadow-sm hover:shadow-md transition-all">
                                <div className="p-1.5 bg-orange-500 rounded-lg shadow-sm">
                                  <AlertCircle className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <span className="text-gray-800 text-sm leading-relaxed font-medium">{action}</span>
                                </div>
                              </div>
                            </motion.div>
                      ))}
                    </div>
                  </div>
                    </motion.div>
                  )}
                </motion.div>

                {/* 详细数据折叠面板 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-6">
                    <details className="group">
                      <summary className="flex items-center justify-between cursor-pointer list-none hover:bg-gray-50/50 rounded-xl p-3 -m-3 transition-all duration-200">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-md">
                            <BarChart3 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">查看详细评估数据</h3>
                            <p className="text-sm text-gray-600">点击展开原始AI分析和量表数据</p>
                          </div>
                        </div>
                        <div className="group-open:rotate-180 transition-transform duration-300 p-2 bg-gray-100 rounded-full">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </summary>
                      
                      <div className="mt-6 space-y-6">
                        {/* AI评估详情 */}
                        {hasAIAssessment && aiAssessmentResult && (
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="relative p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200/50 overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-200/20 rounded-full -translate-y-8 translate-x-8"></div>
                            <div className="relative z-10">
                              <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-blue-500 rounded-xl shadow-md">
                                  <Brain className="w-5 h-5 text-white" />
                                </div>
                                <h4 className="text-lg font-bold text-blue-900">🤖 AI智能评估详情</h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-blue-200/50">
                                  <div className="text-sm text-gray-600 mb-1">情绪状态</div>
                                  <div className="text-lg font-bold text-blue-700">{aiAssessmentResult?.emotion_trend?.currentDominant || '平稳'}</div>
                                </div>
                                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-blue-200/50">
                                  <div className="text-sm text-gray-600 mb-1">置信度</div>
                                  <div className="text-lg font-bold text-blue-700">{Math.round((aiAssessmentResult?.emotion_trend?.confidence || 0.8) * 100)}%</div>
                                </div>
                                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-blue-200/50">
                                  <div className="text-sm text-gray-600 mb-1">对话轮数</div>
                                  <div className="text-lg font-bold text-blue-700">{aiAssessmentResult?.conversation_count || 0} 轮</div>
                                </div>
                              </div>
                            </div>
              </motion.div>
            )}

                        {/* DASS-21详情 */}
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          className="relative p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200/50 overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 w-16 h-16 bg-green-200/20 rounded-full -translate-y-8 -translate-x-8"></div>
                          <div className="relative z-10">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="p-2 bg-green-500 rounded-xl shadow-md">
                                <BarChart3 className="w-5 h-5 text-white" />
                              </div>
                              <h4 className="text-lg font-bold text-green-900">📊 DASS-21量表详情</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-green-200/50">
                                  <div className="text-sm text-gray-600 mb-2">总体评分</div>
                                  <div className="text-2xl font-bold text-green-700">{result.overallScore}<span className="text-sm text-gray-600">/42</span></div>
                                </div>
                                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-green-200/50">
                                  <div className="text-sm text-gray-600 mb-2">风险等级</div>
                                  <div className="text-lg font-bold text-green-700">{getRiskLabel(result.riskLevel)}</div>
                                </div>
                              </div>
                              <div className="space-y-3">
                                {result.categories.map((category, index) => (
                                  <div key={index} className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-green-200/50">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium text-gray-800">{category.name}</span>
                                      <div className="text-right">
                                        <div className="text-sm font-bold text-gray-900">{category.rawScore}/14</div>
                                        <div className={`text-xs font-medium ${
                                          category.level === 'normal' ? 'text-green-600' :
                                          category.level === 'mild' ? 'text-yellow-600' :
                                          category.level === 'moderate' ? 'text-orange-600' : 'text-red-600'
                                        }`}>
                                          {category.level === 'normal' ? '正常' :
                                           category.level === 'mild' ? '轻度' :
                                           category.level === 'moderate' ? '中度' : 
                                           category.level === 'severe' ? '重度' : '极重度'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </details>
                  </div>
                </motion.div>
              </>
            ) : (
              /* 如果没有综合报告，显示单独的评估结果 */
              <>
                {/* AI评估结果 */}
                {hasAIAssessment && aiAssessmentResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6"
              >
                    <div className="flex items-center space-x-3 mb-6">
                      <Brain className="w-8 h-8 text-blue-600" />
                  <div>
                        <h2 className="text-2xl font-bold text-blue-900">🤖 AI智能评估结果</h2>
                        <p className="text-blue-700">基于自然语言对话的情感分析和心理状态评估</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
                        <h4 className="font-semibold text-gray-900 mb-2">情绪状态</h4>
                        <p className="text-xl font-bold text-blue-600">
                          {aiAssessmentResult?.emotion_trend?.currentDominant || '平稳'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          置信度: {Math.round((aiAssessmentResult?.emotion_trend?.confidence || 0.8) * 100)}%
                    </p>
                  </div>

                      <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
                        <h4 className="font-semibold text-gray-900 mb-2">AI风险评估</h4>
                        <p className={`text-xl font-bold ${
                          aiAssessmentResult?.emotion_trend?.riskLevel === 'high' ? 'text-red-600' :
                          aiAssessmentResult?.emotion_trend?.riskLevel === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {aiAssessmentResult?.emotion_trend?.riskLevel === 'high' ? '高风险' :
                           aiAssessmentResult?.emotion_trend?.riskLevel === 'medium' ? '中等风险' : '低风险'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">基于对话内容分析</p>
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
                        <h4 className="font-semibold text-gray-900 mb-2">对话质量</h4>
                        <p className="text-xl font-bold text-purple-600">
                          {aiAssessmentResult?.conversation_count || 0} 轮
                        </p>
                        <p className="text-sm text-gray-600 mt-1">深度交流评估</p>
                  </div>
                </div>
              </motion.div>
            )}

                {/* DASS-21量表结果 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <BarChart3 className="w-8 h-8 text-green-600" />
                  <div>
                      <h2 className="text-2xl font-bold text-green-900">📊 DASS-21量表评估结果</h2>
                      <p className="text-green-700">标准化心理健康量表评估</p>
                  </div>
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-2">总体评分</h4>
                      <p className="text-2xl font-bold text-purple-600">{result.overallScore}</p>
                      <p className="text-sm text-gray-600 mt-1">满分42分</p>
              </div>
              
                    <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-2">风险等级</h4>
                      <p className={`text-xl font-bold ${
                      result.riskLevel === 'low' ? 'text-green-600' :
                      result.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {getRiskLabel(result.riskLevel)}
                    </p>
                      <p className="text-sm text-gray-600 mt-1">基于量表分析</p>
                  </div>

                    <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-2">评估维度</h4>
                      <p className="text-xl font-bold text-blue-600">{result.categories.length}</p>
                      <p className="text-sm text-gray-600 mt-1">抑郁/焦虑/压力</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-2">评估时间</h4>
                      <p className="text-sm font-semibold text-gray-700">
                        {result.timestamp.toLocaleDateString('zh-CN')}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">完成日期</p>
                </div>
              </div>
              
                  {/* 量表详细结果 */}
                  <div className="bg-white rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">📈 各维度详细分析</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {result.categories.map((category, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-800">{category.name}</span>
                            <span className={`text-sm font-semibold ${
                              category.level === 'normal' ? 'text-green-600' :
                              category.level === 'mild' ? 'text-yellow-600' :
                              category.level === 'moderate' ? 'text-orange-600' : 'text-red-600'
                            }`}>
                              {category.level === 'normal' ? '正常' :
                               category.level === 'mild' ? '轻度' :
                               category.level === 'moderate' ? '中度' : 
                               category.level === 'severe' ? '重度' : '极重度'}
                            </span>
                  </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                category.level === 'normal' ? 'bg-green-500' :
                                category.level === 'mild' ? 'bg-yellow-500' :
                                category.level === 'moderate' ? 'bg-orange-500' : 'bg-red-500'
                              } ${category.rawScore > 14 ? 'animate-pulse' : ''}`}
                              style={{ width: `${Math.min((category.rawScore / 14) * 100, 100)}%` }}
                            ></div>
                            {/* 超出指示器 */}
                            {category.rawScore > 14 && (
                              <div className="absolute right-0 top-0 h-2 w-1 bg-red-800 rounded-r-full"></div>
                            )}
                </div>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-sm text-gray-600">{category.rawScore}/14分</p>
                            {category.rawScore > 14 && (
                              <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                                超出量表范围
                              </span>
                            )}
              </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </>
            )}

            {/* 生成综合报告中的提示 */}
            {isGeneratingComprehensive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50 rounded-2xl p-8 shadow-xl overflow-hidden"
              >
                {/* 背景动画装饰 */}
                <div className="absolute inset-0">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-blue-200/20 rounded-full animate-pulse"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-purple-200/20 rounded-full animate-pulse delay-500"></div>
                </div>
                
                <div className="relative z-10 flex items-center space-x-6">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 shadow-lg"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Brain className="w-6 h-6 text-blue-600 animate-pulse" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
                      🔄 正在生成综合评估报告...
                    </h3>
                    <p className="text-blue-700/80 text-lg leading-relaxed">
                      正在结合AI对话分析和量表结果，为您生成全面的心理健康评估报告
                    </p>
                    <div className="mt-4 flex items-center space-x-4">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
                  </div>
                      <span className="text-sm text-blue-600 font-medium">处理中...</span>
                </div>
              </div>
            </div>
              </motion.div>
            )}

            {/* 主体内容容器 */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              {/* 顶部操作栏 */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleBack}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h2 className="text-xl font-semibold text-gray-900">心理评估报告</h2>
                </div>
                
                <div className="flex space-x-3">
                  <button 
                    onClick={exportFullReport}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>导出完整报告</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: '心理评估结果',
                          text: `我刚完成了心理健康评估，总分：${result.overallScore}分，风险等级：${getRiskLabel(result.riskLevel)}`,
                          url: window.location.href
                        })
                      } else {
                        navigator.clipboard.writeText(
                          `我刚完成了心理健康评估，总分：${result.overallScore}分，风险等级：${getRiskLabel(result.riskLevel)}，评估时间：${result.timestamp.toLocaleDateString('zh-CN')}`
                        )
                        alert('结果已复制到剪贴板')
                      }
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>分享结果</span>
                  </button>
                </div>
              </div>

              {/* 1. 总体评分模块 */}
              <div className="text-center mb-12">
                <h3 className="text-lg font-medium text-gray-500 mb-4">总体心理健康评分</h3>
                <div className="relative inline-block mb-6">
                  <div className="w-36 h-36 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-5xl font-bold">
                    {result.overallScore}
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex flex items-center justify-center shadow shadow-sm border">
                    {result.riskLevel === 'low' ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : result.riskLevel === 'medium' ? (
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getRiskColor(result.riskLevel)}`}>
                  {getRiskLabel(result.riskLevel)}
                </span>
                <p className="text-gray-500 mt-3">评估时间: {result.timestamp.toLocaleString('zh-CN')}</p>
              </div>

              {/* 2. 各维度分析 */}
              <div className="mb-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                  各维度详细分析
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {result.categories.map((category, index) => (
                    <motion.div
                      key={category.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">{category.name}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getDassLevelColor(category.level)
                        }`}>
                          {getDassLevelLabel(category.level)}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">标准分</span>
                          <span className="text-lg font-bold text-gray-900">{category.standardScore}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-500">原始分</span>
                          <span className="text-sm text-gray-700">{category.rawScore}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              category.level === 'normal' ? 'bg-green-500' :
                              category.level === 'mild' ? 'bg-blue-500' :
                              category.level === 'moderate' ? 'bg-yellow-500' :
                              category.level === 'severe' ? 'bg-orange-500' : 'bg-red-500'
                            } ${category.standardScore > 40 ? 'animate-pulse' : ''}`}
                            style={{ width: `${Math.min((category.standardScore / 40) * 100, 100)}%` }}
                          ></div>
                          {/* 超出指示器 */}
                          {category.standardScore > 40 && (
                            <div className="absolute right-0 top-0 h-2 w-1 bg-red-800 rounded-r-full"></div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{category.description}</p>
                      
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-700">改善建议:</p>
                        {category.suggestions.map((suggestion, idx) => (
                          <p key={idx} className="text-xs text-gray-600 flex items-start space-x-1.5">
                            <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{suggestion}</span>
                          </p>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 3. 综合建议 */}
              <div className="mb-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Heart className="h-5 w-5 text-red-600 mr-2" />
                  综合健康建议
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-xl p-5">
                    <h4 className="font-medium text-gray-900 mb-4">健康行动建议</h4>
                    <ul className="space-y-3">
                      {result.recommendations.slice(0, Math.ceil(result.recommendations.length / 2)).map((rec, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-5">
                    <h4 className="font-medium text-gray-900 mb-4">长期改善方向</h4>
                    <ul className="space-y-3">
                      {result.recommendations.slice(Math.ceil(result.recommendations.length / 2)).map((rec, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 新增：4. 报告反馈模块 */}
              <div className="mb-12 border border-gray-200 rounded-2xl p-6 bg-gray-50">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                  报告反馈
                </h3>
                <div className="flex flex-col items-center justify-center space-y-6">
                  <p className="text-lg text-gray-700 text-center max-w-lg">
                    您认为该评估报告是否符合您的心理状况？
                  </p>
                  <div className="flex space-x-8">
                    {/* 是 - 符合按钮 */}
                    <motion.button
                      onClick={() => handleReportFeedback(true)}
                      className={`flex flex-col items-center justify-center space-y-2 px-8 py-6 rounded-xl transition-all ${
                        reportFeedback === true 
                          ? 'bg-green-100 border-green-500 text-green-700 shadow-sm' 
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      } border w-48`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ThumbsUp className={`h-8 w-8 ${reportFeedback === true ? 'text-green-600' : 'text-gray-500'}`} />
                      <span className="font-medium">是</span>
                    </motion.button>

                    {/* 否 - 不符合按钮 */}
                    <motion.button
                      onClick={() => handleReportFeedback(false)}
                      className={`flex flex-col items-center justify-center space-y-2 px-8 py-6 rounded-xl transition-all ${
                        reportFeedback === false 
                          ? 'bg-red-100 border-red-500 text-red-700 shadow-sm' 
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      } border w-48`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ThumbsDown className={`h-8 w-8 ${reportFeedback === false ? 'text-red-600' : 'text-gray-500'}`} />
                      <span className="font-medium">否</span>
                    </motion.button>
                  </div>
                  {/* 反馈状态提示 */}
                  {reportFeedback !== null && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`text-sm ${reportFeedback === true ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {reportFeedback === true 
                        ? '您已确认报告符合您的心理状况' 
                        : '您已反馈报告不符合您的心理状况'}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* 5. 下一步行动 */}
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">🎯 下一步选择</h3>
                <p className="text-gray-600 mb-6">基于您的评估结果，选择最适合的心理支持方式</p>
                
                {/* 主要心理支持选项 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-5xl mx-auto mb-6">
                  {/* AI心理辅导 */}
                  <button 
                    onClick={() => router.push('/student/consultation')}
                    className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Brain className="w-8 h-8 mb-3" />
                    <span className="font-semibold text-lg mb-1">AI心理辅导</span>
                    <span className="text-xs opacity-90 text-center">基于评估结果提供个性化心理支持</span>
                    <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full mt-2">推荐</span>
                  </button>
                  
                  {/* 专业咨询师 */}
                  <button 
                    onClick={() => router.push('/student/consultation-matching')}
                    className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-600 to-teal-600 text-white rounded-xl hover:from-green-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Users className="w-8 h-8 mb-3" />
                    <span className="font-semibold text-lg mb-1">专业咨询师</span>
                    <span className="text-xs opacity-90 text-center">智能匹配最适合的心理咨询师</span>
                  </button>
                  
                  {/* 匿名咨询 */}
                  <button 
                    onClick={() => router.push('/student/anonymous-consultation')}
                    className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Shield className="w-8 h-8 mb-3" />
                    <span className="font-semibold text-lg mb-1">匿名咨询</span>
                    <span className="text-xs opacity-90 text-center">保护隐私的心理健康咨询</span>
                  </button>
                </div>
                
                {/* 其他选项 */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto mb-6">
                  <button 
                    onClick={() => router.push('/student/dashboard')}
                    className="flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                  >
                    <BarChart3 className="w-5 h-5 mr-2" />
                    <span className="font-medium">返回仪表板</span>
                  </button>
                  
                  <button 
                    onClick={() => window.location.reload()}
                    className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    <span className="font-medium">重新评估</span>
                  </button>
                </div>
                
              </div>
            </div>
          </div>
        </DashboardLayout>
      </RequireRole>
    );
  } 
  // 评估问卷页
  else {
    return (
      <RequireRole role="student">
        {/* 通过DashboardLayout的title属性设置页面标题，避免重复 */}
        <DashboardLayout title="DASS-21心理评估">
          <div className="space-y-6">
            {/* AI评估状态提示 */}
            {!hasAIAssessment && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-gray-900">建议先进行AI智能评估</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  为了获得更准确的心理健康评估，建议您先完成AI智能对话评估，然后再进行传统量表评估。
                  这样可以生成更全面的综合评估报告。
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => router.push('/student/ai-assessment')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Brain className="w-4 h-4" />
                    <span>前往AI智能评估</span>
                  </button>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    继续传统评估
                  </button>
                </div>
              </motion.div>
            )}
            
            {hasAIAssessment && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6"
              >
                {/* 标题区域 */}
                <div className="flex items-center space-x-3 mb-6">
                  <Brain className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">AI评估已完成</h3>
                </div>
                
                {/* 评估结果展示 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-600">当前情绪状态</p>
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    </div>
                    <p className="text-xl font-bold text-blue-600">
                      {aiAssessmentResult?.emotion_trend?.currentDominant || '平稳'}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-600">风险等级</p>
                      <div className={`w-2 h-2 rounded-full ${
                        aiAssessmentResult?.emotion_trend?.riskLevel === 'high' ? 'bg-red-500' :
                        aiAssessmentResult?.emotion_trend?.riskLevel === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}></div>
                    </div>
                    <p className={`text-xl font-bold ${
                      aiAssessmentResult?.emotion_trend?.riskLevel === 'high' ? 'text-red-600' :
                      aiAssessmentResult?.emotion_trend?.riskLevel === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {aiAssessmentResult?.emotion_trend?.riskLevel === 'high' ? '高风险' :
                       aiAssessmentResult?.emotion_trend?.riskLevel === 'medium' ? '中风险' : '低风险'}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-600">对话轮数</p>
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    </div>
                    <p className="text-xl font-bold text-purple-600">
                      {aiAssessmentResult?.conversation_count || 0} 轮
                    </p>
                  </div>
                </div>
                
                {/* 完成状态提示 */}
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">AI对话评估已完成</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                      完成本次量表评估后，系统将自动结合AI对话分析结果，为您生成综合心理评估报告
                    </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* 进度条 */}
            <div className="bg-white border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgressPercentage()}%` }}
                      transition={{ duration: 0.5 }}
                    ></motion.div>
                  </div>
                  <p className="text-right text-xs text-gray-500 mt-2">
                    完成度: {Math.round(getProgressPercentage())}%
                  </p>
                </div>
              </div>
            </div>

            {/* 问卷主体 */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl shadow-sm border p-8"
              >
                {/* 问题分类标签 */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Brain className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-800 text-xs rounded-full font-medium">
                      {questions[currentStep].category}
                    </span>
                  </div>
                  {/* 问题文本 */}
                  <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
                    {currentStep + 1}. {questions[currentStep].question}
                  </h2>
                </div>

                {/* 选项列表 */}
                <div className="space-y-3 mb-8">
                  {questions[currentStep].options.map((option) => (
                    <motion.button
                      key={option.value}
                      onClick={() => handleAnswer(questions[currentStep].id, option.value)}
                      className={`w-full p-4 text-left border rounded-xl transition-all duration-200 ${
                        answers[questions[currentStep].id] === option.value
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-1">
                            {option.label}
                          </div>
                          <div className="text-sm text-gray-600">
                            {option.description}
                          </div>
                        </div>
                        {answers[questions[currentStep].id] === option.value && (
                          <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-between">
                  <button
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    上一题
                  </button>

                  {currentStep === questions.length - 1 ? (
                    <button
                      onClick={handleComplete}
                      disabled={questions.some(q => answers[q.id] === undefined)}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      提交评估
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      disabled={answers[questions[currentStep].id] === undefined}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      下一题
                    </button>
                  )}
                </div>
              </motion.div>

              {/* 提示文本 */}
              <div className="mt-6 text-center">
                                  <p className="text-sm text-gray-500 flex items-center justify-center">
                  <FileText className="h-4 w-4 mr-1.5" />
                  DASS-21量表：请根据过去一周内您的感受和体验，选择最符合的选项
                </p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </RequireRole>
    );
  }
}
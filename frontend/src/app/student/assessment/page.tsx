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
  ThumbsDown
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'

interface AssessmentQuestion {
  id: number
  question: string
  category: string
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
    score: number
    level: 'low' | 'medium' | 'high'
    description: string
    suggestions: string[]
  }[]
  riskLevel: 'low' | 'medium' | 'high'
  recommendations: string[]
  timestamp: Date
}

// 风险等级样式和标签工具函数
const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
  switch (risk) {
    case 'low': return 'bg-green-100 text-green-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'high': return 'bg-red-100 text-red-800'
  }
}

const getRiskLabel = (risk: 'low' | 'medium' | 'high') => {
  switch (risk) {
    case 'low': return '低风险'
    case 'medium': return '中等风险'
    case 'high': return '高风险'
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

  // 评估问题数据
  const questions: AssessmentQuestion[] = [
    {
      id: 1,
      question: "最近一周，您感到焦虑或紧张的程度如何？",
      category: "焦虑",
      options: [
        { value: 1, label: "完全没有", description: "感觉平静放松" },
        { value: 2, label: "轻微", description: "偶尔感到轻微紧张" },
        { value: 3, label: "中等", description: "经常感到焦虑" },
        { value: 4, label: "严重", description: "持续感到强烈焦虑" },
        { value: 5, label: "极度", description: "焦虑严重影响生活" }
      ]
    },
    {
      id: 2,
      question: "您对日常活动的兴趣和愉悦感如何？",
      category: "抑郁",
      options: [
        { value: 1, label: "完全正常", description: "享受各种活动" },
        { value: 2, label: "轻微减少", description: "兴趣略有下降" },
        { value: 3, label: "明显减少", description: "对大多数活动失去兴趣" },
        { value: 4, label: "显著减少", description: "几乎对所有活动失去兴趣" },
        { value: 5, label: "完全失去", description: "完全无法感受快乐" }
      ]
    },
    {
      id: 3,
      question: "您的睡眠质量如何？",
      category: "睡眠",
      options: [
        { value: 1, label: "很好", description: "睡眠充足质量高" },
        { value: 2, label: "良好", description: "睡眠基本正常" },
        { value: 3, label: "一般", description: "偶尔失眠或质量一般" },
        { value: 4, label: "较差", description: "经常失眠或质量差" },
        { value: 5, label: "很差", description: "严重失眠或质量极差" }
      ]
    },
    {
      id: 4,
      question: "您处理压力的能力如何？",
      category: "压力管理",
      options: [
        { value: 1, label: "很强", description: "能很好应对压力" },
        { value: 2, label: "较强", description: "通常能处理压力" },
        { value: 3, label: "一般", description: "压力处理能力中等" },
        { value: 4, label: "较弱", description: "压力处理能力较差" },
        { value: 5, label: "很弱", description: "难以应对压力" }
      ]
    },
    {
      id: 5,
      question: "您的人际关系满意度如何？",
      category: "人际关系",
      options: [
        { value: 1, label: "很满意", description: "人际关系和谐" },
        { value: 2, label: "满意", description: "人际关系良好" },
        { value: 3, label: "一般", description: "人际关系一般" },
        { value: 4, label: "不满意", description: "人际关系较差" },
        { value: 5, label: "很不满意", description: "人际关系紧张" }
      ]
    }
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
        score: cat.score,
        level: cat.level,
        levelLabel: getRiskLabel(cat.level as 'low' | 'medium' | 'high'),
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
    if (value < 1 || value > 5) {
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
  const handleComplete = () => {
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
    } catch (error) {
      console.error('生成评估结果时出错:', error)
      alert('生成评估结果时出现错误，请重试。')
    }
  }

  // 新增：处理报告反馈选择
  const handleReportFeedback = (isMatch: boolean) => {
    setReportFeedback(isMatch)
    // 可选：反馈选择后可添加提示（如“感谢您的反馈！”）
    alert(isMatch ? '感谢您的认可，我们将继续优化评估服务！' : '感谢您的反馈，我们将努力改进评估准确性！')
  }

  // 分数计算
  const calculateOverallScore = () => {
    const answeredQuestions = questions.filter(q => answers[q.id] !== undefined)
    if (answeredQuestions.length === 0) return 0
    const total = answeredQuestions.reduce((sum, q) => sum + (answers[q.id] || 0), 0)
    return Math.round((total / answeredQuestions.length) * 20)
  }

  // 生成各维度结果
  const generateCategoryResults = () => {
    const categories = ['焦虑', '抑郁', '睡眠', '压力管理', '人际关系']
    return categories.map(category => {
      const categoryQuestions = questions.filter(q => q.category === category)
      if (categoryQuestions.length === 0) {
        return {
          name: category,
          score: 0,
          level: 'low' as const,
          description: '暂无相关评估数据',
          suggestions: ['建议完成相关评估问题']
        }
      }
      
      const categoryScore = categoryQuestions.reduce((sum, q) => {
        const answer = answers[q.id]
        return sum + (answer || 3)
      }, 0) / categoryQuestions.length
      
      const score = Math.round((categoryScore / 5) * 100)
      let level: 'low' | 'medium' | 'high' = 'medium'
      if (score <= 40) level = 'low'
      else if (score >= 70) level = 'high'
      
      return {
        name: category,
        score,
        level,
        description: getCategoryDescription(category, level),
        suggestions: getCategorySuggestions(category, level)
      }
    })
  }

  // 获取维度描述
  const getCategoryDescription = (category: string, level: 'low' | 'medium' | 'high') => {
    const descriptions: Record<string, Record<'low' | 'medium' | 'high', string>> = {
      '焦虑': {
        low: '您的焦虑水平较低，情绪状态稳定',
        medium: '您的焦虑水平适中，建议关注情绪变化',
        high: '您的焦虑水平较高，建议寻求专业帮助'
      },
      '抑郁': {
        low: '您的情绪状态良好，生活积极向上',
        medium: '您的情绪状态一般，建议增加积极活动',
        high: '您的情绪状态需要关注，建议寻求专业支持'
      },
      '睡眠': {
        low: '您的睡眠质量良好，作息规律',
        medium: '您的睡眠质量一般，建议改善睡眠习惯',
        high: '您的睡眠质量较差，建议寻求专业帮助'
      },
      '压力管理': {
        low: '您的压力管理能力很强，能很好应对挑战',
        medium: '您的压力管理能力一般，建议学习放松技巧',
        high: '您的压力管理能力需要提升，建议寻求指导'
      },
      '人际关系': {
        low: '您的人际关系和谐，社交能力良好',
        medium: '您的人际关系一般，建议改善沟通技巧',
        high: '您的人际关系需要关注，建议寻求社交支持'
      }
    }
    return descriptions[category]?.[level] || '暂无相关描述信息'
  }

  // 获取维度建议
  const getCategorySuggestions = (category: string, level: 'low' | 'medium' | 'high') => {
    const suggestions: Record<string, Record<'low' | 'medium' | 'high', string[]>> = {
      '焦虑': {
        low: ['保持当前状态', '继续放松练习'],
        medium: ['学习深呼吸技巧', '尝试冥想练习', '规律运动'],
        high: ['寻求专业心理咨询', '学习认知行为疗法', '考虑药物治疗']
      },
      '抑郁': {
        low: ['保持积极心态', '继续兴趣爱好'],
        medium: ['增加户外活动', '与朋友多交流', '培养新爱好'],
        high: ['寻求专业心理治疗', '考虑药物治疗', '建立支持网络']
      },
      '睡眠': {
        low: ['保持良好习惯', '规律作息'],
        medium: ['避免咖啡因', '睡前放松', '固定睡眠时间'],
        high: ['咨询睡眠专家', '检查睡眠环境', '考虑睡眠治疗']
      },
      '压力管理': {
        low: ['继续当前方法', '分享经验给他人'],
        medium: ['学习时间管理', '练习放松技巧', '寻求支持'],
        high: ['学习压力管理技巧', '寻求专业指导', '建立健康习惯']
      },
      '人际关系': {
        low: ['保持良好关系', '继续社交活动'],
        medium: ['改善沟通技巧', '参加社交活动', '寻求反馈'],
        high: ['学习社交技巧', '寻求专业指导', '建立支持网络']
      }
    }
    return suggestions[category]?.[level] || ['建议咨询专业人士获取个性化建议']
  }

  // 计算风险等级
  const calculateRiskLevel = (): 'low' | 'medium' | 'high' => {
    try {
      const score = calculateOverallScore()
      if (score <= 40) return 'low'
      if (score >= 70) return 'high'
      return 'medium'
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
          <div className="space-y-6">
            {/* 结果概览统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">总体健康评分</p>
                    <p className="text-2xl font-bold text-gray-900">{result.overallScore}</p>
                  </div>
                  <Brain className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">风险等级</p>
                    <p className={`text-sm font-semibold ${
                      result.riskLevel === 'low' ? 'text-green-600' :
                      result.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {getRiskLabel(result.riskLevel)}
                    </p>
                  </div>
                  {result.riskLevel === 'low' ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : result.riskLevel === 'medium' ? (
                    <AlertCircle className="w-8 h-8 text-yellow-600" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  )}
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">评估维度</p>
                    <p className="text-2xl font-bold text-gray-900">{result.categories.length}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">评估时间</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {result.timestamp.toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-gray-600" />
                </div>
              </div>
            </div>

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
                          getRiskColor(category.level as 'low' | 'medium' | 'high')
                        }`}>
                          {getRiskLabel(category.level as 'low' | 'medium' | 'high')}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">维度得分</span>
                          <span className="text-lg font-bold text-gray-900">{category.score}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              category.level === 'low' ? 'bg-green-500' :
                              category.level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${category.score}%` }}
                          ></div>
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
                <h3 className="text-xl font-semibold text-gray-900 mb-6">下一步行动</h3>
                <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <button 
                    onClick={() => router.push('/student/dashboard')}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    返回仪表板
                  </button>
                  <button 
                    onClick={() => router.push('/student/consultation-matching')}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    智能匹配咨询师
                  </button>
                  <button 
                    onClick={() => router.push('/student/ai-assessment')}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    AI深度评估
                  </button>
                  <button 
                    onClick={() => router.push('/student/anonymous-consultation')}
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    匿名咨询
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
        <DashboardLayout title="心理评估测试">
          <div className="space-y-6">
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
                  请根据您最近一周的真实感受选择最符合的选项，答案无对错之分
                </p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </RequireRole>
    );
  }
}
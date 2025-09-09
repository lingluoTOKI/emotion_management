'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  Eye,
  Download,
  Filter,
  Search,
  Brain,
  Heart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Smile,
  Frown,
  Meh
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'

interface AssessmentRecord {
  id: string
  date: string
  type: 'ai-assessment' | 'phq9' | 'gad7' | 'comprehensive'
  score: number
  maxScore: number
  riskLevel: 'minimal' | 'low' | 'medium' | 'high'
  status: 'completed' | 'in-progress' | 'pending'
  summary: string
  recommendations: string[]
  emotionTrend: 'improving' | 'stable' | 'declining'
  emotionStatus: 'positive' | 'neutral' | 'negative'
  keywords: string[]
  depressionIndex: number
}

// 模拟数据
const mockAssessmentHistory: AssessmentRecord[] = [
  {
    id: '1',
    date: '2024-08-22',
    type: 'ai-assessment',
    score: 72,
    maxScore: 100,
    riskLevel: 'medium',
    status: 'completed',
    summary: '中度焦虑情绪，主要与学习压力相关',
    recommendations: ['保持规律作息', '增加运动', '寻求社会支持'],
    emotionTrend: 'improving',
    emotionStatus: 'neutral',
    keywords: ['学习压力', '焦虑', '注意力不集中'],
    depressionIndex: 65
  },
  {
    id: '2',
    date: '2024-08-15',
    type: 'comprehensive',
    score: 68,
    maxScore: 100,
    riskLevel: 'medium',
    status: 'completed',
    summary: '轻度抑郁症状，人际关系困扰',
    recommendations: ['改善睡眠质量', '练习放松技巧', '考虑专业咨询'],
    emotionTrend: 'stable',
    emotionStatus: 'neutral',
    keywords: ['人际关系', '失眠', '情绪低落'],
    depressionIndex: 72
  },
  {
    id: '3',
    date: '2024-08-08',
    type: 'phq9',
    score: 15,
    maxScore: 27,
    riskLevel: 'high',
    status: 'completed',
    summary: '中重度抑郁症状，需要专业关注',
    recommendations: ['立即寻求专业帮助', '告知信任的人', '避免独处'],
    emotionTrend: 'declining',
    emotionStatus: 'negative',
    keywords: ['抑郁', '自我否定', '社交回避'],
    depressionIndex: 85
  },
  {
    id: '4',
    date: '2024-08-01',
    type: 'gad7',
    score: 8,
    maxScore: 21,
    riskLevel: 'low',
    status: 'completed',
    summary: '轻度焦虑，整体状态良好',
    recommendations: ['保持现有生活节奏', '适量运动', '定期自我检查'],
    emotionTrend: 'improving',
    emotionStatus: 'positive',
    keywords: ['状态良好', '轻度焦虑', '适应良好'],
    depressionIndex: 42
  },
  {
    id: '5',
    date: '2024-07-25',
    type: 'ai-assessment',
    score: 75,
    maxScore: 100,
    riskLevel: 'medium',
    status: 'completed',
    summary: '情绪波动较大，需要关注',
    recommendations: ['保持规律生活', '记录情绪变化', '寻求支持'],
    emotionTrend: 'stable',
    emotionStatus: 'neutral',
    keywords: ['情绪波动', '压力', '适应困难'],
    depressionIndex: 68
  },
  {
    id: '6',
    date: '2024-07-18',
    type: 'comprehensive',
    score: 62,
    maxScore: 100,
    riskLevel: 'medium',
    status: 'completed',
    summary: '整体状态平稳，偶有焦虑',
    recommendations: ['继续当前策略', '定期评估', '保持社交'],
    emotionTrend: 'improving',
    emotionStatus: 'neutral',
    keywords: ['状态平稳', '偶发焦虑', '社交良好'],
    depressionIndex: 58
  }
]

// 改进的折线图组件
const DepressionChart = ({ data }: { data: AssessmentRecord[] }) => {
  // 按日期排序数据
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  
  const depressionValues = sortedData.map(d => d.depressionIndex)
  const maxDepression = Math.max(...depressionValues)
  const minDepression = Math.min(...depressionValues)
  const chartHeight = 200
  const chartWidth = Math.max(600, sortedData.length * 100)
  const padding = { top: 20, right: 30, bottom: 40, left: 50 }
  
  // 计算Y轴刻度
  const yTicks = [minDepression, Math.round((maxDepression + minDepression) / 2), maxDepression]
  
  // 计算数据点在图表中的位置
  const getPointPosition = (index: number, value: number) => {
    const x = padding.left + (index * (chartWidth - padding.left - padding.right)) / (sortedData.length - 1)
    const y = padding.top + chartHeight - padding.bottom - ((value - minDepression) / (maxDepression - minDepression)) * (chartHeight - padding.top - padding.bottom)
    return { x, y }
  }
  
  // 生成折线路径
  const pathData = sortedData.map((d, i) => {
    const { x, y } = getPointPosition(i, d.depressionIndex)
    return `${i === 0 ? 'M' : 'L'} ${x},${y}`
  }).join(' ')

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border mt-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          抑郁指数趋势图
        </h3>
        <div className="text-sm text-gray-500">
          时间范围: {sortedData[0]?.date} 至 {sortedData[sortedData.length - 1]?.date}
        </div>
      </div>
      
      <div className="relative" style={{ height: chartHeight + padding.top + padding.bottom }}>
        <svg 
          width="100%" 
          height={chartHeight + padding.top + padding.bottom}
          viewBox={`0 0 ${chartWidth} ${chartHeight + padding.top + padding.bottom}`}
          className="w-full"
        >
          {/* Y轴网格线 */}
          {yTicks.map((tick, i) => {
            const y = padding.top + chartHeight - padding.bottom - ((tick - minDepression) / (maxDepression - minDepression)) * (chartHeight - padding.top - padding.bottom)
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                >
                  {tick}
                </text>
              </g>
            )
          })}
          
          {/* X轴网格线 (日期) */}
          {sortedData.map((d, i) => {
            const { x } = getPointPosition(i, minDepression)
            return (
              <line
                key={i}
                x1={x}
                y1={padding.top}
                x2={x}
                y2={chartHeight - padding.bottom + padding.top}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            )
          })}
          
          {/* 折线 */}
          <path
            d={pathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* 数据点 */}
          {sortedData.map((d, i) => {
            const { x, y } = getPointPosition(i, d.depressionIndex)
            const riskColor = 
              d.depressionIndex >= 70 ? '#ef4444' : 
              d.depressionIndex >= 50 ? '#f59e0b' : 
              '#10b981'
            
            return (
              <g key={d.id}>
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill={riskColor}
                  stroke="#fff"
                  strokeWidth="2"
                  className="cursor-pointer transition-all hover:r-8"
                />
                <title>
                  {d.date}: 抑郁指数 {d.depressionIndex} ({d.riskLevel === 'high' ? '高风险' : d.riskLevel === 'medium' ? '中等风险' : '低风险'})
                </title>
              </g>
            )
          })}
          
          {/* X轴日期标签 */}
          {sortedData.map((d, i) => {
            const { x } = getPointPosition(i, minDepression)
            return (
              <text
                key={d.id}
                x={x}
                y={chartHeight + padding.top + 20}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {d.date.split('-').slice(1).join('/')}
              </text>
            )
          })}
          
          {/* Y轴标签 */}
          <text
            x={-chartHeight / 2}
            y="15"
            transform="rotate(-90)"
            textAnchor="middle"
            className="text-sm fill-gray-700 font-medium"
          >
            抑郁指数
          </text>
          
          {/* X轴标签 */}
          <text
            x={chartWidth / 2}
            y={chartHeight + padding.top + 35}
            textAnchor="middle"
            className="text-sm fill-gray-700 font-medium"
          >
            评估日期
          </text>
        </svg>
        
        {/* 风险区域指示 */}
        <div className="absolute right-6 top-6 bg-white p-3 rounded-lg shadow-sm border text-sm">
          <div className="font-medium mb-2">风险区间</div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span>0-49: 低风险</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
            <span>50-69: 中等风险</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
            <span>70-100: 高风险</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AssessmentHistory() {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>(mockAssessmentHistory)
  const [filteredAssessments, setFilteredAssessments] = useState<AssessmentRecord[]>(assessments)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedRisk, setSelectedRisk] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetails, setShowDetails] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let filtered = assessments

    // 按类型筛选
    if (selectedType !== 'all') {
      filtered = filtered.filter(assessment => assessment.type === selectedType)
    }

    // 按风险等级筛选
    if (selectedRisk !== 'all') {
      filtered = filtered.filter(assessment => assessment.riskLevel === selectedRisk)
    }

    // 按搜索词筛选
    if (searchTerm) {
      filtered = filtered.filter(assessment => 
        assessment.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.recommendations.some(rec => rec.toLowerCase().includes(searchTerm.toLowerCase())) ||
        assessment.keywords.some(kw => kw.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredAssessments(filtered)
  }, [selectedType, selectedRisk, searchTerm, assessments])

  // 计算趋势数据
  const calculateTrends = () => {
    const scores = assessments.map(a => a.score)
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const lastScore = scores[0]
    const previousScore = scores[1]
    
    const trend = lastScore > previousScore ? 'improving' : 
                 lastScore < previousScore ? 'declining' : 'stable'
    
    // 获取最新情绪状态
    const latestEmotion = assessments[0]?.emotionStatus || 'neutral'
    
    return { 
      avgScore: avgScore.toFixed(1), 
      trend, 
      lastScore,
      emotionStatus: latestEmotion
    }
  }

  const trends = calculateTrends()

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'ai-assessment': 'AI智能评估',
      'phq9': 'PHQ-9抑郁量表',
      'gad7': 'GAD-7焦虑量表',
      'comprehensive': '综合评估'
    }
    return labels[type] || type
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'low': return '低风险'
      case 'medium': return '中等风险'
      case 'high': return '高风险'
      default: return '未知'
    }
  }

  const getEmotionIcon = (status: string) => {
    switch (status) {
      case 'positive': return <Smile className="w-6 h-6 text-green-600" />
      case 'negative': return <Frown className="w-6 h-6 text-red-600" />
      default: return <Meh className="w-6 h-6 text-yellow-600" />
    }
  }

  const getEmotionLabel = (status: string) => {
    switch (status) {
      case 'positive': return '情绪积极'
      case 'negative': return '情绪低落'
      default: return '情绪平稳'
    }
  }

  const exportData = () => {
    const data = {
      exported_at: new Date().toISOString(),
      assessments: filteredAssessments,
      summary: trends
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `assessment-history-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <RequireRole role="student">
      <DashboardLayout title="评估历史">
        <div className="space-y-6">
          {/* 概览统计 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总评估次数</p>
                  <p className="text-2xl font-bold text-gray-900">{assessments.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">平均得分</p>
                  <p className="text-2xl font-bold text-gray-900">{trends.avgScore}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">最新得分</p>
                  <p className="text-2xl font-bold text-gray-900">{trends.lastScore}</p>
                </div>
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">情绪趋势</p>
                  <p className="text-sm font-semibold">
                    {trends.trend === 'improving' ? '改善中' :
                     trends.trend === 'declining' ? '需要关注' : '保持稳定'}
                  </p>
                </div>
                {trends.trend === 'improving' ? (
                  <TrendingUp className="w-8 h-8 text-green-600" />
                ) : trends.trend === 'declining' ? (
                  <TrendingDown className="w-8 h-8 text-red-600" />
                ) : (
                  <Heart className="w-8 h-8 text-blue-600" />
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">当前情绪</p>
                  <p className="text-sm font-semibold">{getEmotionLabel(trends.emotionStatus)}</p>
                </div>
                {getEmotionIcon(trends.emotionStatus)}
              </div>
            </div>
          </div>

          {/* 抑郁指数图表 */}
          <DepressionChart data={assessments} />

          {/* 筛选和搜索 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold text-gray-900">评估记录</h2>
              <button
                onClick={exportData}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>导出数据</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索评估记录..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有类型</option>
                <option value="ai-assessment">AI智能评估</option>
                <option value="phq9">PHQ-9抑郁量表</option>
                <option value="gad7">GAD-7焦虑量表</option>
                <option value="comprehensive">综合评估</option>
              </select>
              
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有风险等级</option>
                <option value="low">低风险</option>
                <option value='medium'>中等风险</option>
                <option value="high">高风险</option>
              </select>
              
              <button
                onClick={() => router.push('/student/ai-assessment')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                新建评估
              </button>
            </div>

            {/* 评估记录列表 */}
            <div className="space-y-4">
              {filteredAssessments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">暂无符合条件的评估记录</p>
                </div>
              ) : (
                filteredAssessments.map((assessment) => (
                  <motion.div
                    key={assessment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Brain className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{getTypeLabel(assessment.type)}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{assessment.date}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{assessment.status === 'completed' ? '已完成' : '进行中'}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(assessment.riskLevel)}`}>
                          {getRiskLabel(assessment.riskLevel)}
                        </span>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {assessment.score}/{assessment.maxScore}
                          </div>
                          <div className="text-sm text-gray-500">得分</div>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{assessment.summary}</p>
                    
                    {/* 关键词标签 */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {assessment.keywords.map((keyword, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-md">
                          #{keyword}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 text-sm">
                          {assessment.emotionTrend === 'improving' ? (
                            <>
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <span className="text-green-600">情绪改善</span>
                            </>
                          ) : assessment.emotionTrend === 'declining' ? (
                            <>
                              <TrendingDown className="w-4 h-4 text-red-600" />
                              <span className="text-red-600">需要关注</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                              <span className="text-blue-600">保持稳定</span>
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1 text-sm">
                          {getEmotionIcon(assessment.emotionStatus)}
                          <span>{getEmotionLabel(assessment.emotionStatus)}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setShowDetails(showDetails === assessment.id ? null : assessment.id)}
                        className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{showDetails === assessment.id ? '收起详情' : '查看详情'}</span>
                      </button>
                    </div>

                    {/* 详情展开 */}
                    {showDetails === assessment.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200"
                      >
                        <h4 className="font-medium text-gray-900 mb-3">个性化建议</h4>
                        <ul className="space-y-2">
                          {assessment.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <span className="text-gray-700 text-sm">{rec}</span>
                            </li>
                          ))}
                        </ul>
                        
                        <div className="mt-4 flex space-x-3">
                          <button
                            onClick={() => router.push('/student/ai-assessment')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            重新评估
                          </button>
                          <button
                            onClick={() => router.push('/student/consultation-matching')}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                          >
                            寻求专业帮助
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}
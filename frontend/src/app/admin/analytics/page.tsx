'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  PieChart, 
  Cloud, 
  TrendingUp,
  Users,
  MessageCircle,
  ArrowLeft,
  Download,
  RefreshCw,
  Filter
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'

// 模拟数据 - 在实际应用中从API获取
const mockData = {
  // 词云数据 - 学生问题关键词
  wordCloud: [
    { text: '焦虑', value: 120, category: 'emotion' },
    { text: '抑郁', value: 98, category: 'emotion' },
    { text: '学习压力', value: 85, category: 'academic' },
    { text: '人际关系', value: 76, category: 'social' },
    { text: '失眠', value: 65, category: 'physical' },
    { text: '考试恐惧', value: 58, category: 'academic' },
    { text: '孤独感', value: 52, category: 'emotion' },
    { text: '家庭矛盾', value: 45, category: 'family' },
    { text: '自卑', value: 42, category: 'emotion' },
    { text: '拖延症', value: 38, category: 'behavior' },
    { text: '社交恐惧', value: 35, category: 'social' },
    { text: '情感困扰', value: 32, category: 'emotion' }
  ],
  
  // 南丁格尔玫瑰图数据 - 咨询师流派被咨询次数
  therapyTypes: [
    { name: '认知行为疗法', value: 145, color: '#FF6B6B' },
    { name: '人本主义疗法', value: 132, color: '#4ECDC4' },
    { name: '精神分析疗法', value: 98, color: '#45B7D1' },
    { name: '家庭系统疗法', value: 76, color: '#96CEB4' },
    { name: '正念疗法', value: 65, color: '#FECA57' },
    { name: '艺术疗法', value: 43, color: '#FF9FF3' },
    { name: '行为疗法', value: 38, color: '#54A0FF' }
  ],
  
  // 饼状图数据 - 评估报告准确率
  assessmentAccuracy: {
    accurate: 847,
    inaccurate: 153,
    total: 1000
  },
  
  // 条形图数据 - 咨询师问题解决率
  counselorEffectiveness: [
    { name: '张心理师', satisfactionRate: 94.5, totalSessions: 156 },
    { name: '李心理师', satisfactionRate: 91.2, totalSessions: 142 },
    { name: '王心理师', satisfactionRate: 89.7, totalSessions: 134 },
    { name: '刘心理师', satisfactionRate: 88.3, totalSessions: 128 },
    { name: '陈心理师', satisfactionRate: 86.9, totalSessions: 119 },
    { name: '赵心理师', satisfactionRate: 85.4, totalSessions: 98 },
    { name: '孙心理师', satisfactionRate: 83.1, totalSessions: 87 },
    { name: '周心理师', satisfactionRate: 81.7, totalSessions: 76 }
  ]
}

export default function AdminAnalytics() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('month')
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const router = useRouter()

  const refreshData = async () => {
    setIsLoading(true)
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLastUpdated(new Date())
    setIsLoading(false)
  }

  const exportData = () => {
    // 模拟导出功能
    const data = {
      generated_at: new Date().toISOString(),
      time_range: selectedTimeRange,
      ...mockData
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-report-${selectedTimeRange}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <RequireRole role="admin">
      <DashboardLayout title="咨询状况可视化分析">
        <div className="space-y-6">
          {/* 控制面板 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/admin/dashboard')}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>返回仪表板</span>
                </button>
                
                <div className="h-6 w-px bg-gray-300" />
                
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select 
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="week">最近一周</option>
                    <option value="month">最近一月</option>
                    <option value="quarter">最近一季度</option>
                    <option value="year">最近一年</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">
                  最后更新: {lastUpdated.toLocaleTimeString()}
                </span>
                
                <button
                  onClick={refreshData}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>刷新数据</span>
                </button>
                
                <button
                  onClick={exportData}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>导出报告</span>
                </button>
              </div>
            </div>
          </div>

          {/* 核心指标概览 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="总咨询次数"
              value="2,847"
              change="+12.5%"
              changeType="positive"
              icon={MessageCircle}
              color="blue"
            />
            <MetricCard
              title="活跃咨询师"
              value="45"
              change="+2"
              changeType="positive"
              icon={Users}
              color="green"
            />
            <MetricCard
              title="平均满意度"
              value="87.3%"
              change="+3.2%"
              changeType="positive"
              icon={TrendingUp}
              color="purple"
            />
            <MetricCard
              title="报告准确率"
              value="84.7%"
              change="+1.8%"
              changeType="positive"
              icon={BarChart3}
              color="orange"
            />
          </div>

          {/* 可视化图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 词云图 */}
            <ChartCard 
              title="学生问题关键词分析"
              description="基于咨询记录的问题关键词统计"
              icon={Cloud}
            >
              <WordCloudChart data={mockData.wordCloud} />
            </ChartCard>

            {/* 南丁格尔玫瑰图 */}
            <ChartCard 
              title="咨询师流派受欢迎程度"
              description="不同心理咨询流派的咨询次数统计"
              icon={PieChart}
            >
              <RoseChart data={mockData.therapyTypes} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 饼状图 */}
            <ChartCard 
              title="评估报告准确率"
              description="学生对评估报告准确性的反馈统计"
              icon={PieChart}
            >
              <AccuracyPieChart data={mockData.assessmentAccuracy} />
            </ChartCard>

            {/* 条形图 */}
            <ChartCard 
              title="咨询师问题解决率"
              description="基于学生满意度调查的咨询师效果排名"
              icon={BarChart3}
            >
              <CounselorBarChart data={mockData.counselorEffectiveness} />
            </ChartCard>
          </div>

          {/* 洞察和建议 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 数据洞察与建议</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">🎯 培训重点建议</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 加强认知行为疗法和人本主义疗法培训</li>
                  <li>• 重点关注焦虑、抑郁情绪的处理技巧</li>
                  <li>• 提升学习压力和人际关系咨询能力</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-purple-900 mb-2">📈 优化方向</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• 评估报告准确率有待提升至90%以上</li>
                  <li>• 可考虑增加艺术疗法和正念疗法资源</li>
                  <li>• 建议为低满意度咨询师提供专项培训</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}

// 指标卡片组件
function MetricCard({ title, value, change, changeType, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center
          ${color === 'blue' ? 'bg-blue-100' :
            color === 'green' ? 'bg-green-100' :
            color === 'purple' ? 'bg-purple-100' :
            'bg-orange-100'}`}>
          <Icon className={`w-5 h-5
            ${color === 'blue' ? 'text-blue-600' :
              color === 'green' ? 'text-green-600' :
              color === 'purple' ? 'text-purple-600' :
              'text-orange-600'}`} />
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded
          ${changeType === 'positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {change}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </div>
  )
}

// 图表卡片组件
function ChartCard({ title, description, icon: Icon, children }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

// 词云图组件（简化版）
function WordCloudChart({ data }: { data: any[] }) {
  const maxValue = Math.max(...data.map(item => item.value))
  
  return (
    <div className="relative h-64 flex flex-wrap items-center justify-center gap-2 p-4">
      {data.map((word, index) => {
        const size = Math.max(12, (word.value / maxValue) * 32)
        const colors = {
          emotion: 'text-red-500',
          academic: 'text-blue-500', 
          social: 'text-green-500',
          physical: 'text-purple-500',
          family: 'text-orange-500',
          behavior: 'text-indigo-500'
        }
        
        return (
          <motion.span
            key={index}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`font-bold cursor-pointer hover:scale-110 transition-transform ${colors[word.category as keyof typeof colors] || 'text-gray-500'}`}
            style={{ fontSize: `${size}px` }}
            title={`${word.text}: ${word.value}次`}
          >
            {word.text}
          </motion.span>
        )
      })}
    </div>
  )
}

// 南丁格尔玫瑰图组件（简化版）
function RoseChart({ data }: { data: any[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  return (
    <div className="h-64 flex items-center justify-center">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100
            const startAngle = data.slice(0, index).reduce((sum, prev) => sum + (prev.value / total) * 360, 0)
            const endAngle = startAngle + (item.value / total) * 360
            
            const x1 = 100 + 70 * Math.cos((startAngle - 90) * Math.PI / 180)
            const y1 = 100 + 70 * Math.sin((startAngle - 90) * Math.PI / 180)
            const x2 = 100 + 70 * Math.cos((endAngle - 90) * Math.PI / 180)
            const y2 = 100 + 70 * Math.sin((endAngle - 90) * Math.PI / 180)
            
            const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
            
            return (
              <g key={index}>
                <path
                  d={`M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                  fill={item.color}
                  opacity={0.8}
                  className="hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <title>{item.name}: {item.value}次 ({percentage.toFixed(1)}%)</title>
                </path>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="ml-6 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-700">{item.name}</span>
            <span className="text-gray-500">({item.value})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 准确率饼状图组件
function AccuracyPieChart({ data }: { data: any }) {
  const accuratePercentage = (data.accurate / data.total) * 100
  const inaccuratePercentage = (data.inaccurate / data.total) * 100
  
  return (
    <div className="h-64 flex items-center justify-center">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r="80" fill="#10B981" opacity={0.8} />
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="transparent"
            stroke="#EF4444"
            strokeWidth="160"
            strokeDasharray={`${inaccuratePercentage * 5.03} ${accuratePercentage * 5.03}`}
            strokeDashoffset="125.75"
            opacity={0.8}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{accuratePercentage.toFixed(1)}%</span>
          <span className="text-sm text-gray-500">准确率</span>
        </div>
      </div>
      <div className="ml-6 space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-gray-700">准确</span>
          <span className="text-sm text-gray-500">({data.accurate})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-gray-700">不准确</span>
          <span className="text-sm text-gray-500">({data.inaccurate})</span>
        </div>
      </div>
    </div>
  )
}

// 咨询师效果条形图组件
function CounselorBarChart({ data }: { data: any[] }) {
  const maxRate = Math.max(...data.map(item => item.satisfactionRate))
  
  return (
    <div className="h-64 space-y-3 overflow-y-auto">
      {data.map((counselor, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center space-x-3"
        >
          <div className="w-16 text-sm text-gray-700 text-right">{counselor.name}</div>
          <div className="flex-1 relative">
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                style={{ width: `${(counselor.satisfactionRate / maxRate) * 100}%` }}
              >
                <span className="text-xs text-white font-medium">
                  {counselor.satisfactionRate}%
                </span>
              </div>
            </div>
          </div>
          <div className="w-12 text-xs text-gray-500 text-center">
            {counselor.totalSessions}次
          </div>
        </motion.div>
      ))}
    </div>
  )
}
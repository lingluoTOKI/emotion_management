'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, Calendar, Clock,
  Users, MessageCircle, Star, Activity,
  BarChart3, PieChart, LineChart, Download
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'

export default function CounselorStatistics() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  // 统计数据
  const stats = {
    totalSessions: 156,
    completedSessions: 142,
    pendingSessions: 14,
    averageRating: 4.8,
    totalStudents: 89,
    thisMonthSessions: 23,
    satisfactionRate: 95,
    averageSessionDuration: 45,
    responseTime: 2.3
  }

  // 趋势数据
  const trends = {
    sessions: [
      { month: '1月', count: 18 },
      { month: '2月', count: 22 },
      { month: '3月', count: 19 },
      { month: '4月', count: 25 },
      { month: '5月', count: 23 },
      { month: '6月', count: 28 }
    ],
    ratings: [
      { month: '1月', rating: 4.6 },
      { month: '2月', rating: 4.7 },
      { month: '3月', rating: 4.8 },
      { month: '4月', rating: 4.9 },
      { month: '5月', rating: 4.8 },
      { month: '6月', rating: 4.9 }
    ]
  }

  // 问题类型分布
  const problemTypes = [
    { type: '学业压力', count: 45, percentage: 29 },
    { type: '人际关系', count: 38, percentage: 24 },
    { type: '情感问题', count: 32, percentage: 21 },
    { type: '焦虑抑郁', count: 25, percentage: 16 },
    { type: '其他', count: 16, percentage: 10 }
  ]

  // 学生满意度分布
  const satisfactionData = [
    { rating: '5星', count: 85, percentage: 60 },
    { rating: '4星', count: 42, percentage: 30 },
    { rating: '3星', count: 10, percentage: 7 },
    { rating: '2星', count: 3, percentage: 2 },
    { rating: '1星', count: 2, percentage: 1 }
  ]

  // 月度对比
  const monthlyComparison = [
    { metric: '咨询次数', current: 23, previous: 20, change: '+15%' },
    { metric: '平均评分', current: 4.8, previous: 4.7, change: '+2.1%' },
    { metric: '满意度', current: 95, previous: 92, change: '+3.3%' },
    { metric: '响应时间', current: 2.3, previous: 2.8, change: '-17.9%' }
  ]

  const getChangeColor = (change: string) => {
    return change.startsWith('+') ? 'text-green-600' : 'text-red-600'
  }

  const getChangeIcon = (change: string) => {
    return change.startsWith('+') ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
  }

  return (
    <RequireRole role="counselor">
      <DashboardLayout title="工作统计">
        <div className="space-y-6">
          {/* 时间范围选择 */}
          <div className="bg-white rounded-2xl shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">数据统计</h3>
              <div className="flex space-x-2">
                {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {range === 'week' && '本周'}
                    {range === 'month' && '本月'}
                    {range === 'quarter' && '本季度'}
                    {range === 'year' && '本年'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 核心统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">咨询次数</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalSessions}</p>
                  <p className="text-sm text-gray-600">总咨询次数</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">+12%</span>
                  </div>
                  <p className="text-xs text-gray-500">较上月</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm text-gray-500">平均评分</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.averageRating}</p>
                  <p className="text-sm text-gray-600">学生评分</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">+0.2</span>
                  </div>
                  <p className="text-xs text-gray-500">较上月</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
                <span className="text-sm text-gray-500">服务学生</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
                  <p className="text-sm text-gray-600">累计学生</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">+8</span>
                  </div>
                  <p className="text-xs text-gray-500">较上月</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm text-gray-500">满意度</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.satisfactionRate}%</p>
                  <p className="text-sm text-gray-600">学生满意度</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">+3%</span>
                  </div>
                  <p className="text-xs text-gray-500">较上月</p>
                </div>
              </div>
            </div>
          </div>

          {/* 月度对比 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">月度对比</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>导出报告</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {monthlyComparison.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{item.metric}</span>
                    <div className={`flex items-center space-x-1 ${getChangeColor(item.change)}`}>
                      {getChangeIcon(item.change)}
                      <span className="text-sm">{item.change}</span>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold text-gray-900">{item.current}</p>
                    <p className="text-sm text-gray-500">上月: {item.previous}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 咨询趋势图 */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">咨询趋势</h3>
                <div className="flex space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <LineChart className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {trends.sessions.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 w-8">{item.month}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(item.count / 30) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 问题类型分布 */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">问题类型分布</h3>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <PieChart className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                {problemTypes.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-gray-700">{item.type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 满意度分布 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">学生满意度分布</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {satisfactionData.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < 5 - index ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                  <p className="text-sm text-gray-600">{item.percentage}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* 详细指标 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.averageSessionDuration}</h3>
                  <p className="text-sm text-gray-600">平均咨询时长(分钟)</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.responseTime}</h3>
                  <p className="text-sm text-gray-600">平均响应时间(小时)</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.thisMonthSessions}</h3>
                  <p className="text-sm text-gray-600">本月咨询次数</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}

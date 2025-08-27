'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, TrendingUp, AlertTriangle, 
  CheckCircle, Eye, FileText, Filter,
  Calendar, Clock, User, Activity
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'

export default function CounselorAssessments() {
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'high-risk'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const assessments = [
    {
      id: 1,
      student: '张同学',
      studentId: '2021001',
      assessmentType: 'AI智能评估',
      date: '2025-01-21',
      status: 'completed',
      riskLevel: 'medium',
      depressionScore: 12,
      anxietyScore: 8,
      overallScore: 65,
      recommendations: ['建议进行放松训练', '可考虑短期咨询'],
      notes: '学生反映学习压力较大，情绪状态需要关注'
    },
    {
      id: 2,
      student: '李同学',
      studentId: '2021002',
      assessmentType: 'PHQ-9量表',
      date: '2025-01-20',
      status: 'completed',
      riskLevel: 'high',
      depressionScore: 18,
      anxietyScore: 15,
      overallScore: 85,
      recommendations: ['建议立即咨询', '需要密切观察'],
      notes: '存在抑郁倾向，需要专业干预'
    },
    {
      id: 3,
      student: '王同学',
      studentId: '2021003',
      assessmentType: 'GAD-7量表',
      date: '2025-01-19',
      status: 'completed',
      riskLevel: 'low',
      depressionScore: 6,
      anxietyScore: 5,
      overallScore: 35,
      recommendations: ['保持良好作息', '适当运动'],
      notes: '情绪状态良好，建议保持'
    }
  ]

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.studentId.includes(searchTerm)
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'recent' && assessment.date === '2025-01-21') ||
      (activeTab === 'high-risk' && assessment.riskLevel === 'high')
    return matchesSearch && matchesTab
  })

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLevelText = (level: string) => {
    switch (level) {
      case 'high': return '高风险'
      case 'medium': return '中风险'
      case 'low': return '低风险'
      default: return '未知'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <RequireRole role="counselor">
      <DashboardLayout title="学生评估管理">
        <div className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {assessments.length}
                  </h3>
                  <p className="text-sm text-gray-600">总评估数</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {assessments.filter(a => a.status === 'completed').length}
                  </h3>
                  <p className="text-sm text-gray-600">已完成</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {assessments.filter(a => a.riskLevel === 'high').length}
                  </h3>
                  <p className="text-sm text-gray-600">高风险</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {Math.round(assessments.reduce((sum, a) => sum + a.overallScore, 0) / assessments.length)}
                  </h3>
                  <p className="text-sm text-gray-600">平均分</p>
                </div>
              </div>
            </div>
          </div>

          {/* 搜索和筛选 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索学生姓名或学号..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>筛选</span>
                </button>
              </div>
            </div>
          </div>

          {/* 标签页 */}
          <div className="bg-white rounded-2xl shadow-sm border p-1">
            <div className="flex">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                全部评估
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === 'recent'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                最近评估
              </button>
              <button
                onClick={() => setActiveTab('high-risk')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === 'high-risk'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                高风险
              </button>
            </div>
          </div>

          {/* 评估列表 */}
          <div className="space-y-4">
            {filteredAssessments.map((assessment) => (
              <motion.div
                key={assessment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Brain className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{assessment.student}</h3>
                      <p className="text-sm text-gray-600">学号: {assessment.studentId}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-500">{assessment.assessmentType}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(assessment.riskLevel)}`}>
                          {getRiskLevelText(assessment.riskLevel)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{assessment.date}</span>
                    </div>
                    <div className={`text-2xl font-bold mt-1 ${getScoreColor(assessment.overallScore)}`}>
                      {assessment.overallScore}
                    </div>
                    <div className="text-sm text-gray-500">总分</div>
                  </div>
                </div>

                {/* 评分详情 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">抑郁指数</span>
                      <span className={`font-semibold ${assessment.depressionScore >= 15 ? 'text-red-600' : 'text-gray-900'}`}>
                        {assessment.depressionScore}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">焦虑指数</span>
                      <span className={`font-semibold ${assessment.anxietyScore >= 10 ? 'text-red-600' : 'text-gray-900'}`}>
                        {assessment.anxietyScore}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">评估状态</span>
                      <span className="text-green-600 font-semibold">已完成</span>
                    </div>
                  </div>
                </div>

                {/* 建议和备注 */}
                <div className="space-y-3 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">建议措施</h4>
                    <div className="flex flex-wrap gap-2">
                      {assessment.recommendations.map((rec, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {rec}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">备注</h4>
                    <p className="text-gray-700 text-sm">{assessment.notes}</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>查看详情</span>
                  </button>
                  <button className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>生成报告</span>
                  </button>
                  {assessment.riskLevel === 'high' && (
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>紧急处理</span>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {filteredAssessments.length === 0 && (
            <div className="text-center py-12">
              <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">暂无评估记录</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}

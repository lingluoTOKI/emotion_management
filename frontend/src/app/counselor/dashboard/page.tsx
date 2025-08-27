'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, MessageCircle, FileText, Calendar, 
  TrendingUp, Activity, Clock, Star
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'
import { getUserInfo } from '@/lib/auth'
import type { UserInfo } from '@/lib/auth'

export default function CounselorDashboard() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  useEffect(() => {
    const user = getUserInfo()
    setUserInfo(user)
  }, [])

  // 示例统计数据
  const stats = {
    totalSessions: 156,
    completedSessions: 142,
    pendingSessions: 14,
    averageRating: 4.8,
    totalStudents: 89,
    thisMonthSessions: 23
  }

  const recentSessions = [
    { id: 1, student: '张同学', type: '在线咨询', date: '2025-01-21', status: '已完成', rating: 5 },
    { id: 2, student: '李同学', type: '面对面', date: '2025-01-20', status: '已完成', rating: 4 },
    { id: 3, student: '王同学', type: '匿名咨询', date: '2025-01-19', status: '进行中', rating: null }
  ]

  return (
    <RequireRole role="counselor">
      <DashboardLayout title="咨询师工作台">
        <div className="space-y-6">
          {/* 欢迎信息 */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  欢迎回来，{userInfo?.name || userInfo?.username}
                </h2>
                <p className="text-green-100 mb-4">
                  今天有 {stats.pendingSessions} 个咨询会话等待处理
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.totalSessions}</div>
                <div className="text-green-100 text-sm">总咨询次数</div>
              </div>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="本月咨询"
              value={stats.thisMonthSessions}
              icon={Calendar}
              color="blue"
              change="+12%"
              changeType="positive"
            />
            <StatCard
              title="完成率"
              value={`${Math.round((stats.completedSessions / stats.totalSessions) * 100)}%`}
              icon={TrendingUp}
              color="green"
              change="+5%"
              changeType="positive"
            />
            <StatCard
              title="平均评分"
              value={stats.averageRating}
              icon={Star}
              color="yellow"
              change="+0.2"
              changeType="positive"
            />
            <StatCard
              title="服务学生"
              value={stats.totalStudents}
              icon={Users}
              color="purple"
              change="+8"
              changeType="positive"
            />
          </div>

          {/* 最近咨询会话 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">最近咨询会话</h3>
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{session.student}</h4>
                      <p className="text-sm text-gray-600">
                        {session.type} • {session.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      session.status === '已完成' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.status}
                    </span>
                    {session.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">{session.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 快速操作 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionCard
              title="查看咨询会话"
              description="管理当前和历史咨询会话"
              icon={MessageCircle}
              href="/counselor/consultations"
              color="blue"
            />
            <QuickActionCard
              title="匿名咨询管理"
              description="处理匿名咨询请求"
              icon={FileText}
              href="/counselor/anonymous"
              color="green"
            />
            <QuickActionCard
              title="学生评估"
              description="查看学生评估结果"
              icon={Activity}
              href="/counselor/assessments"
              color="purple"
            />
          </div>
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}

// 统计卡片组件
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  change,
  changeType
}: {
  title: string
  value: string | number
  icon: any
  color: string
  change: string
  changeType: 'positive' | 'negative'
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center
          ${color === 'blue' ? 'bg-blue-100' :
            color === 'green' ? 'bg-green-100' :
            color === 'yellow' ? 'bg-yellow-100' :
            'bg-purple-100'}`}>
          <Icon className={`w-5 h-5
            ${color === 'blue' ? 'text-blue-600' :
              color === 'green' ? 'text-green-600' :
              color === 'yellow' ? 'text-yellow-600' :
              'text-purple-600'}`} />
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

// 快速操作卡片组件
function QuickActionCard({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  color 
}: {
  title: string
  description: string
  icon: any
  href: string
  color: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white rounded-xl shadow-sm border p-6 cursor-pointer transition-all duration-200 hover:shadow-lg
        ${color === 'blue' ? 'hover:border-blue-300' :
          color === 'green' ? 'hover:border-green-300' :
          'hover:border-purple-300'}`}
      onClick={() => window.location.href = href}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <Icon className={`w-8 h-8 
          ${color === 'blue' ? 'text-blue-600' :
            color === 'green' ? 'text-green-600' :
            'text-purple-600'}`} />
      </div>
    </motion.div>
  )
}

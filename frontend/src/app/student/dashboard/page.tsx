'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  MessageCircle, 
  Brain, 
  Heart, 
  Shield, 
  Clock,
  BookOpen,
  TrendingUp,
  FileText,
  Plus,
  CheckCircle,
  AlertCircle,
  Star,
  Users,
  Zap
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'
import { getUserInfo } from '@/lib/auth'
import type { UserInfo } from '@/lib/auth'

export default function StudentDashboard() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const router = useRouter()

  useEffect(() => {
    const user = getUserInfo()
    setUserInfo(user)
  }, [])

  // 示例数据
  const stats = {
    assessmentCount: 5,
    consultationCount: 2,
    aiChatCount: 12,
    lastAssessmentScore: 85
  }

  const recentActivities = [
    { id: 1, type: 'assessment', title: 'AI智能评估完成', time: '2小时前', status: 'completed' },
    { id: 2, type: 'consultation', title: '预约咨询 - 张咨询师', time: '1天前', status: 'scheduled' },
    { id: 3, type: 'ai-chat', title: 'AI助手对话', time: '2天前', status: 'completed' }
  ]

  const quickActions = [
    {
      title: 'AI智能评估',
      description: '快速了解您的心理状态',
      icon: Brain,
      color: 'blue',
      href: '/student/ai-assessment'
    },
    {
      title: '咨询师匹配',
      description: '寻找合适的专业咨询师',
      icon: Users,
      color: 'green', 
      href: '/student/consultation-matching'
    },
    {
      title: '匿名咨询',
      description: '安全私密的心理咨询',
      icon: Shield,
      color: 'purple',
      href: '/student/anonymous-consultation'
    },
    {
      title: 'AI助手',
      description: '24/7在线心理支持',
      icon: MessageCircle,
      color: 'indigo',
      href: '/ai-chat'
    }
  ]

      return (
    <RequireRole role="student">
      <DashboardLayout title="学生仪表板">
    <div className="space-y-6">
          {/* 欢迎信息 */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6">
            <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold mb-2">
                  欢迎回来，{userInfo?.name || userInfo?.username}！
                </h2>
                <p className="text-blue-100">
                  今天是新的一天，让我们一起关注您的心理健康
                </p>
            </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.lastAssessmentScore}</div>
                <div className="text-blue-100 text-sm">最新评估得分</div>
        </div>
      </div>
    </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="评估次数"
              value={stats.assessmentCount}
              icon={Brain}
              color="blue"
              description="本月完成"
            />
            <StatCard
              title="咨询预约"
              value={stats.consultationCount}
              icon={Calendar}
              color="green"
              description="进行中"
            />
            <StatCard
              title="AI对话"
              value={stats.aiChatCount}
              icon={MessageCircle}
              color="purple"
              description="本周次数"
            />
            <StatCard
              title="健康指数"
              value={stats.lastAssessmentScore}
              icon={Heart}
              color="red"
              description="综合评分"
            />
            </div>

          {/* 核心心理健康服务 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">心理健康支持服务</h3>
            <p className="text-gray-600 mb-6">根据您的内向程度和舒适度，选择最适合的心理支持方式</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* AI心理辅导 - 轻度内向 */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/ai-chat')}
                className="border-2 border-blue-200 rounded-xl p-6 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
              >
            <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">AI心理辅导</h4>
                      <p className="text-xs text-blue-600 font-medium">适合：轻度内向 😊</p>
            </div>
          </div>
                  <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">24/7</div>
                    </div>
                <p className="text-sm text-gray-600 mb-4">
                  智能AI咨询师提供专业心理辅导，模拟真实咨询师的共情表达和心理教育，轻松开始心理健康之旅
                </p>
                <ul className="text-xs text-gray-500 space-y-1 mb-4">
                  <li>• 🤖 模拟专业心理咨询技巧</li>
                  <li>• 🔍 智能情绪识别和分析</li>
                  <li>• ⚠️ 自动风险评估和预警</li>
                  <li>• 📋 个性化心理康复建议</li>
                </ul>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  立即开始AI辅导
                </button>
              </motion.div>

              {/* 智能咨询师匹配 - 中度内向 */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/student/consultation-matching')}
                className="border-2 border-green-200 rounded-xl p-6 cursor-pointer hover:border-green-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
                      <h4 className="font-semibold text-gray-900">智能咨询师匹配</h4>
                      <p className="text-xs text-green-600 font-medium">适合：中度内向 🤔</p>
            </div>
          </div>
                  <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">专业</div>
          </div>
                <p className="text-sm text-gray-600 mb-4">
                  基于您的个人偏好和问题类型，智能匹配最适合的专业心理咨询师，包含流派科普和预约服务
                </p>
                <ul className="text-xs text-gray-500 space-y-1 mb-4">
                  <li>• 🎯 多维度智能匹配算法</li>
                  <li>• 📚 心理咨询流派详细科普</li>
                  <li>• 👥 个性化咨询师推荐</li>
                  <li>• 📅 灵活预约和咨询方式选择</li>
                </ul>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                  开始匹配咨询师
          </button>
              </motion.div>

              {/* 匿名心理咨询 - 重度内向 */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/student/anonymous-consultation')}
                className="border-2 border-purple-200 rounded-xl p-6 cursor-pointer hover:border-purple-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-purple-600" />
      </div>
            <div>
                      <h4 className="font-semibold text-gray-900">匿名心理咨询</h4>
                      <p className="text-xs text-purple-600 font-medium">适合：重度内向 😌</p>
            </div>
          </div>
                  <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">私密</div>
            </div>
                <p className="text-sm text-gray-600 mb-4">
                  完全匿名的心理咨询服务，您和咨询师都不知道对方身份，专业心理支持与隐私保护并重
                </p>
                <ul className="text-xs text-gray-500 space-y-1 mb-4">
                  <li>• 🔒 双向匿名身份保护</li>
                  <li>• 🚨 智能危险行为检测定位</li>
                  <li>• 👨‍⚕️ 专业咨询师实时在线</li>
                  <li>• 🆘 紧急情况自动干预机制</li>
            </ul>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                  开始匿名咨询
          </button>
              </motion.div>
      </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                  <p className="text-sm font-medium text-gray-900">建议先进行心理健康评估</p>
                  <p className="text-xs text-gray-600">了解自己的心理状态后，选择最适合的支持方式效果更佳</p>
            </div>
            <button 
                  onClick={() => router.push('/student/ai-assessment')}
                  className="ml-auto px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
              >
                  去评估
              </button>
            </div>
          </div>
        </div>

          {/* 最近活动 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">最近活动</h3>
        <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${activity.status === 'completed' ? 'bg-green-100' :
                      activity.status === 'scheduled' ? 'bg-blue-100' : 'bg-gray-100'}
                  `}>
                    {activity.type === 'assessment' && <Brain className="w-5 h-5 text-blue-600" />}
                    {activity.type === 'consultation' && <Users className="w-5 h-5 text-green-600" />}
                    {activity.type === 'ai-chat' && <MessageCircle className="w-5 h-5 text-purple-600" />}
            </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-500">{activity.time}</p>
            </div>
                  <div className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                      activity.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}
                  `}>
                    {activity.status === 'completed' ? '已完成' :
                     activity.status === 'scheduled' ? '已安排' : '进行中'}
            </div>
          </div>
              ))}
            </div>
          </div>

          {/* 今日建议 */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
          </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">今日心理健康建议</h3>
                <p className="text-gray-700 mb-4">
                  保持规律的作息时间，尝试每天进行10分钟的冥想练习，这有助于减少焦虑和提高专注力。
                </p>
                <button className="text-yellow-700 hover:text-yellow-800 font-medium text-sm">
                  了解更多 →
            </button>
          </div>
        </div>
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
  description 
}: {
  title: string
  value: number
  icon: any
  color: string
  description: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
              </div>
        <div className={`
          w-12 h-12 rounded-lg flex items-center justify-center
          ${color === 'blue' ? 'bg-blue-100' :
            color === 'green' ? 'bg-green-100' :
            color === 'purple' ? 'bg-purple-100' :
            color === 'red' ? 'bg-red-100' : 'bg-gray-100'}
        `}>
          <Icon className={`
            w-6 h-6
            ${color === 'blue' ? 'text-blue-600' :
              color === 'green' ? 'text-green-600' :
              color === 'purple' ? 'text-purple-600' :
              color === 'red' ? 'text-red-600' : 'text-gray-600'}
          `} />
        </div>
      </div>
    </div>
  )
}

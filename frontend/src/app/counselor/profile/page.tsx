'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, Mail, Phone, MapPin, Calendar,
  Edit, Save, X, Camera, Award, BookOpen,
  Star, Clock, Users, MessageCircle, CheckCircle
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'
import { getUserInfo } from '@/lib/auth'
import type { UserInfo } from '@/lib/auth'

export default function CounselorProfile() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '张心理咨询师',
    email: 'counselor@university.edu.cn',
    phone: '138-0013-8000',
    department: '心理健康教育中心',
    position: '资深心理咨询师',
    specialization: '认知行为疗法、人际关系咨询',
    experience: '8年',
    education: '心理学硕士',
    certifications: ['国家二级心理咨询师', '认知行为治疗师'],
    bio: '专注于大学生心理健康咨询，擅长处理学业压力、人际关系、情感问题等。具有丰富的个体咨询和团体辅导经验。'
  })

  useEffect(() => {
    const user = getUserInfo()
    setUserInfo(user)
  }, [])

  const stats = {
    totalSessions: 156,
    completedSessions: 142,
    averageRating: 4.8,
    totalStudents: 89,
    thisMonthSessions: 23,
    satisfactionRate: 95
  }

  const recentAchievements = [
    {
      id: 1,
      title: '优秀咨询师',
      description: '2024年度优秀心理咨询师',
      date: '2024-12-31',
      type: 'award'
    },
    {
      id: 2,
      title: '专业认证',
      description: '获得认知行为治疗师认证',
      date: '2024-06-15',
      type: 'certification'
    },
    {
      id: 3,
      title: '培训完成',
      description: '完成危机干预培训课程',
      date: '2024-03-20',
      type: 'training'
    }
  ]

  const handleSave = () => {
    // 这里应该调用API保存数据
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'award': return <Award className="w-5 h-5 text-yellow-600" />
      case 'certification': return <BookOpen className="w-5 h-5 text-blue-600" />
      case 'training': return <Star className="w-5 h-5 text-green-600" />
      default: return <Award className="w-5 h-5 text-gray-600" />
    }
  }

  return (
    <RequireRole role="counselor">
      <DashboardLayout title="个人资料">
        <div className="space-y-6">
          {/* 个人信息卡片 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {editForm.name.charAt(0)}
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <Camera className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{editForm.name}</h2>
                  <p className="text-gray-600 mb-1">{editForm.position}</p>
                  <p className="text-gray-500 text-sm">{editForm.department}</p>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{stats.averageRating}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{stats.totalStudents} 名学生</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <MessageCircle className="w-4 h-4" />
                      <span>{stats.totalSessions} 次咨询</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>编辑资料</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>保存</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>取消</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 联系信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-3">联系信息</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{editForm.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{editForm.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">心理健康教育中心 3楼</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-3">专业信息</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">从业经验: {editForm.experience}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{editForm.education}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Award className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">专业方向: {editForm.specialization}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 个人简介 */}
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">个人简介</h3>
              <p className="text-gray-700 leading-relaxed">{editForm.bio}</p>
            </div>

            {/* 专业认证 */}
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">专业认证</h3>
              <div className="flex flex-wrap gap-2">
                {editForm.certifications.map((cert, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 工作统计 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalSessions}</h3>
                  <p className="text-sm text-gray-600">总咨询次数</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.satisfactionRate}%</h3>
                  <p className="text-sm text-gray-600">满意度</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.averageRating}</h3>
                  <p className="text-sm text-gray-600">平均评分</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalStudents}</h3>
                  <p className="text-sm text-gray-600">服务学生</p>
                </div>
              </div>
            </div>
          </div>

          {/* 最近成就 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">最近成就</h3>
            <div className="space-y-4">
              {recentAchievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    {getAchievementIcon(achievement.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                  </div>
                  <div className="text-sm text-gray-500">{achievement.date}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}

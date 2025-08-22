'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users,
  ChevronRight,
  ChevronLeft,
  Star,
  MapPin,
  Clock,
  Award,
  Play,
  User,
  Heart,
  Brain,
  Shield,
  CheckCircle,
  Calendar,
  MessageCircle,
  Phone,
  Video
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'

// 心理咨询流派数据
const therapySchools = {
  'cognitive-behavioral': {
    name: '认知行为疗法 (CBT)',
    description: '通过改变不良的思维模式和行为习惯来改善情绪和心理状态',
    videoUrl: '/videos/cbt-intro.mp4',
    characteristics: ['注重实用性', '短期目标导向', '结构化治疗', '家庭作业练习'],
    suitableFor: ['焦虑症', '抑郁症', '强迫症', '恐惧症'],
    color: 'blue'
  },
  'humanistic': {
    name: '人本主义疗法',
    description: '强调个人的内在价值和自我实现能力，创造温暖、接纳的治疗环境',
    videoUrl: '/videos/humanistic-intro.mp4',
    characteristics: ['以来访者为中心', '无条件积极关注', '真诚一致', '共情理解'],
    suitableFor: ['自我认知问题', '人际关系困扰', '自尊问题', '个人成长'],
    color: 'green'
  },
  'psychodynamic': {
    name: '精神分析疗法',
    description: '探索无意识的心理冲突和早期经历对当前问题的影响',
    videoUrl: '/videos/psychodynamic-intro.mp4',
    characteristics: ['深度探索', '分析防御机制', '移情关系', '梦境分析'],
    suitableFor: ['人格障碍', '创伤后应激', '慢性抑郁', '关系模式问题'],
    color: 'purple'
  },
  'family-systems': {
    name: '家庭系统疗法',
    description: '将问题视为家庭系统的功能失调，通过改善家庭关系来解决问题',
    videoUrl: '/videos/family-systems-intro.mp4',
    characteristics: ['系统观念', '家庭动力学', '结构重组', '沟通训练'],
    suitableFor: ['家庭矛盾', '亲子关系', '婚姻问题', '青少年问题'],
    color: 'orange'
  },
  'mindfulness': {
    name: '正念疗法',
    description: '通过正念冥想和觉察练习来改善情绪调节和心理健康',
    videoUrl: '/videos/mindfulness-intro.mp4',
    characteristics: ['当下觉察', '非评判性接纳', '呼吸练习', '身心统一'],
    suitableFor: ['焦虑症', '慢性疼痛', '注意力问题', '情绪调节困难'],
    color: 'indigo'
  },
  'art-therapy': {
    name: '艺术疗法',
    description: '通过艺术创作过程来表达情感、探索内心世界和促进心理康复',
    videoUrl: '/videos/art-therapy-intro.mp4',
    characteristics: ['非言语表达', '创造性治疗', '象征性探索', '情感释放'],
    suitableFor: ['创伤康复', '情感表达困难', '儿童心理问题', '自我探索'],
    color: 'pink'
  }
}

// 模拟咨询师数据
const mockCounselors = [
  {
    id: 1,
    name: '张心理师',
    title: '国家二级心理咨询师',
    specialties: ['cognitive-behavioral', 'mindfulness'],
    gender: 'female',
    personality: 'warm',
    isTeacher: true,
    location: '校内咨询中心',
    rating: 4.9,
    experience: 8,
    totalSessions: 1200,
    successRate: 94.5,
    nextAvailable: '2024-08-23 10:00',
    avatar: '/avatars/counselor1.jpg',
    introduction: '专注于焦虑和抑郁症的认知行为治疗，结合正念技术帮助学生改善情绪调节。',
    education: ['北京师范大学心理学硕士', '中科院心理所进修'],
    languages: ['普通话', '英语'],
    consultationModes: ['face-to-face', 'video', 'phone']
  },
  {
    id: 2,
    name: '李心理师',
    title: '临床心理学博士',
    specialties: ['humanistic', 'psychodynamic'],
    gender: 'male',
    personality: 'calm',
    isTeacher: false,
    location: '校外合作机构',
    rating: 4.8,
    experience: 12,
    totalSessions: 1500,
    successRate: 91.2,
    nextAvailable: '2024-08-23 14:00',
    avatar: '/avatars/counselor2.jpg',
    introduction: '擅长深度心理分析和人本主义治疗，帮助来访者进行自我探索和个人成长。',
    education: ['清华大学心理学博士', '美国APA认证'],
    languages: ['普通话', '英语', '法语'],
    consultationModes: ['face-to-face', 'video']
  },
  {
    id: 3,
    name: '王心理师',
    title: '家庭治疗师',
    specialties: ['family-systems', 'art-therapy'],
    gender: 'female',
    personality: 'empathetic',
    isTeacher: true,
    location: '校内咨询中心',
    rating: 4.7,
    experience: 6,
    totalSessions: 800,
    successRate: 89.7,
    nextAvailable: '2024-08-24 09:00',
    avatar: '/avatars/counselor3.jpg',
    introduction: '专业家庭治疗师，善于处理家庭关系问题，同时运用艺术治疗技术。',
    education: ['华东师范大学心理学硕士', '家庭治疗国际认证'],
    languages: ['普通话'],
    consultationModes: ['face-to-face', 'video', 'phone']
  }
]

interface MatchingPreferences {
  gender?: 'male' | 'female' | 'no-preference'
  personality?: 'warm' | 'calm' | 'empathetic' | 'professional' | 'no-preference'
  problemArea?: string
  therapySchool?: string
  isTeacher?: boolean | null
  consultationMode?: 'face-to-face' | 'video' | 'phone' | 'no-preference'
}

export default function CounselorMatching() {
  const [currentStep, setCurrentStep] = useState<'preferences' | 'schools' | 'results'>('preferences')
  const [preferences, setPreferences] = useState<MatchingPreferences>({})
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null)
  const [matchedCounselors, setMatchedCounselors] = useState<any[]>([])
  const [isMatching, setIsMatching] = useState(false)
  const [selectedCounselor, setSelectedCounselor] = useState<any>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  
  const router = useRouter()

  const handlePreferenceChange = (key: keyof MatchingPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const proceedToSchools = () => {
    setCurrentStep('schools')
  }

  const selectSchool = (schoolKey: string) => {
    setSelectedSchool(schoolKey)
    setPreferences(prev => ({ ...prev, therapySchool: schoolKey }))
  }

  const startMatching = () => {
    setIsMatching(true)
    setCurrentStep('results')
    
    // 模拟匹配算法
    setTimeout(() => {
      const filtered = mockCounselors.filter(counselor => {
    let score = 0

        // 性别匹配
        if (preferences.gender && preferences.gender !== 'no-preference') {
          if (counselor.gender === preferences.gender) score += 20
        } else {
          score += 10
        }
        
        // 性格匹配
        if (preferences.personality && preferences.personality !== 'no-preference') {
          if (counselor.personality === preferences.personality) score += 20
        } else {
          score += 10
        }
        
        // 流派匹配
        if (preferences.therapySchool) {
          if (counselor.specialties.includes(preferences.therapySchool)) score += 30
        }
        
        // 职业角色匹配
        if (preferences.isTeacher !== null) {
          if (counselor.isTeacher === preferences.isTeacher) score += 15
        } else {
          score += 10
        }
        
        // 咨询方式匹配
        if (preferences.consultationMode && preferences.consultationMode !== 'no-preference') {
          if (counselor.consultationModes.includes(preferences.consultationMode)) score += 15
        } else {
          score += 10
        }
        
        return score >= 50 // 基础匹配分数
      })
      
      // 按评分和匹配度排序
      const sorted = filtered.sort((a, b) => b.rating - a.rating)
      setMatchedCounselors(sorted)
      setIsMatching(false)
    }, 2000)
  }

  const bookConsultation = (counselor: any) => {
    setSelectedCounselor(counselor)
    setShowBookingModal(true)
  }

  if (currentStep === 'preferences') {
    return (
      <RequireRole role="student">
        <DashboardLayout title="咨询师匹配">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border p-8"
            >
      <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
      </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">智能咨询师匹配</h1>
                <p className="text-gray-600">
                  请告诉我们您的偏好，我们将为您匹配最合适的心理咨询师
                </p>
      </div>

              <div className="space-y-8">
                {/* 性别偏好 */}
        <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">咨询师性别偏好</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: 'female', label: '女性咨询师', icon: '👩‍⚕️' },
                      { value: 'male', label: '男性咨询师', icon: '👨‍⚕️' },
                      { value: 'no-preference', label: '无偏好', icon: '🤝' }
            ].map((option) => (
              <button
                key={option.value}
                        onClick={() => handlePreferenceChange('gender', option.value)}
                        className={`p-4 border-2 rounded-xl transition-all ${
                          preferences.gender === option.value
                            ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                        <div className="text-2xl mb-2">{option.icon}</div>
                        <div className="font-medium text-gray-900">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

                {/* 性格偏好 */}
        <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">咨询师性格偏好</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: 'warm', label: '温暖亲和', description: '温柔细心，善于倾听' },
                      { value: 'calm', label: '沉稳理性', description: '冷静客观，逻辑清晰' },
                      { value: 'empathetic', label: '共情能力强', description: '善于理解他人情感' },
                      { value: 'professional', label: '专业严谨', description: '经验丰富，技术精湛' },
                      { value: 'no-preference', label: '无特殊偏好', description: '根据其他条件匹配' }
                    ].map((option) => (
              <button
                        key={option.value}
                        onClick={() => handlePreferenceChange('personality', option.value)}
                        className={`p-4 border-2 rounded-xl text-left transition-all ${
                          preferences.personality === option.value
                            ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                        <div className="font-medium text-gray-900 mb-1">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

                {/* 问题领域 */}
        <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">主要问题领域</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { value: 'anxiety', label: '焦虑情绪', icon: '😰' },
                      { value: 'depression', label: '抑郁情绪', icon: '😔' },
                      { value: 'stress', label: '学习压力', icon: '📚' },
                      { value: 'relationships', label: '人际关系', icon: '👥' },
                      { value: 'family', label: '家庭问题', icon: '👨‍👩‍👧‍👦' },
                      { value: 'self-esteem', label: '自信心问题', icon: '💪' },
                      { value: 'trauma', label: '创伤经历', icon: '🩹' },
                      { value: 'other', label: '其他问题', icon: '❓' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handlePreferenceChange('problemArea', option.value)}
                        className={`p-4 border-2 rounded-xl transition-all flex items-center space-x-3 ${
                          preferences.problemArea === option.value
                            ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
                      >
                        <span className="text-2xl">{option.icon}</span>
                        <span className="font-medium text-gray-900">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 职业角色偏好 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">咨询师角色偏好</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: true, label: '校内教师咨询师', description: '熟悉校园环境和学生问题' },
                      { value: false, label: '专业心理咨询师', description: '专职从事心理咨询工作' },
                      { value: null, label: '无偏好', description: '根据专业能力匹配' }
                    ].map((option) => (
                <button
                        key={String(option.value)}
                        onClick={() => handlePreferenceChange('isTeacher', option.value)}
                        className={`p-4 border-2 rounded-xl text-left transition-all ${
                          preferences.isTeacher === option.value
                            ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                        <div className="font-medium text-gray-900 mb-1">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                </button>
                    ))}
          </div>
        </div>

                {/* 咨询方式偏好 */}
        <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">咨询方式偏好</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { value: 'face-to-face', label: '面对面', icon: Users, description: '线下面谈' },
                      { value: 'video', label: '视频通话', icon: Video, description: '在线视频' },
                      { value: 'phone', label: '电话咨询', icon: Phone, description: '语音通话' },
                      { value: 'no-preference', label: '灵活选择', icon: CheckCircle, description: '多种方式' }
            ].map((option) => (
              <button
                key={option.value}
                        onClick={() => handlePreferenceChange('consultationMode', option.value)}
                        className={`p-4 border-2 rounded-xl text-center transition-all ${
                          preferences.consultationMode === option.value
                            ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                        <option.icon className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                        <div className="font-medium text-gray-900 mb-1">{option.label}</div>
                        <div className="text-xs text-gray-600">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

                <div className="flex justify-end">
                  <button
                    onClick={proceedToSchools}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span>下一步：选择心理咨询流派</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
      </div>
    </div>
            </motion.div>
          </div>
        </DashboardLayout>
      </RequireRole>
    )
  }

  if (currentStep === 'schools') {
    return (
      <RequireRole role="student">
        <DashboardLayout title="选择咨询流派">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border p-8"
            >
      <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">选择心理咨询流派</h1>
                <p className="text-gray-600">
                  了解不同的心理咨询理论和方法，选择最适合您的治疗方式
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {Object.entries(therapySchools).map(([key, school]) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className={`border-2 rounded-2xl p-6 cursor-pointer transition-all ${
                      selectedSchool === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => selectSchool(key)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        school.color === 'blue' ? 'bg-blue-100' :
                        school.color === 'green' ? 'bg-green-100' :
                        school.color === 'purple' ? 'bg-purple-100' :
                        school.color === 'orange' ? 'bg-orange-100' :
                        school.color === 'indigo' ? 'bg-indigo-100' :
                        'bg-pink-100'
                      }`}>
                        <Brain className={`w-6 h-6 ${
                          school.color === 'blue' ? 'text-blue-600' :
                          school.color === 'green' ? 'text-green-600' :
                          school.color === 'purple' ? 'text-purple-600' :
                          school.color === 'orange' ? 'text-orange-600' :
                          school.color === 'indigo' ? 'text-indigo-600' :
                          'text-pink-600'
                        }`} />
                      </div>
                      
                      {selectedSchool === key && (
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                      )}
      </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{school.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{school.description}</p>

                    <div className="space-y-3">
        <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">特点</h4>
          <div className="flex flex-wrap gap-2">
                          {school.characteristics.map((char, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              {char}
              </span>
            ))}
          </div>
        </div>

        <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">适用问题</h4>
                        <div className="flex flex-wrap gap-2">
                          {school.suitableFor.map((problem, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 text-xs rounded-full ${
                                school.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                                school.color === 'green' ? 'bg-green-100 text-green-700' :
                                school.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                                school.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                                school.color === 'indigo' ? 'bg-indigo-100 text-indigo-700' :
                                'bg-pink-100 text-pink-700'
                              }`}
                            >
                              {problem}
                            </span>
                          ))}
          </div>
        </div>

                      <div className="pt-3 border-t border-gray-100">
                        <button className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700">
                          <Play className="w-4 h-4" />
                          <span>观看科普视频</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
        </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep('preferences')}
                  className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>返回上一步</span>
                </button>

        <button
                  onClick={startMatching}
                  disabled={!selectedSchool}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
                  <span>开始匹配咨询师</span>
                  <ChevronRight className="w-5 h-5" />
        </button>
      </div>
            </motion.div>
    </div>
        </DashboardLayout>
      </RequireRole>
    )
  }

  if (currentStep === 'results') {
    return (
      <RequireRole role="student">
        <DashboardLayout title="匹配结果">
          <div className="max-w-6xl mx-auto">
            {isMatching ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow-sm border p-8 text-center"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Users className="w-8 h-8 text-blue-600" />
                  </motion.div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">正在为您匹配合适的咨询师</h2>
                <p className="text-gray-600 mb-6">
                  根据您的偏好和需求，我们正在从专业咨询师库中为您筛选最佳匹配...
                </p>
                <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto">
                  <motion.div
                    className="h-2 bg-blue-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2 }}
                  />
                </div>
              </motion.div>
            ) : (
          <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">为您找到 {matchedCounselors.length} 位匹配的咨询师</h1>
                      <p className="text-gray-600">根据您的偏好排序，匹配度越高排序越靠前</p>
      </div>
                    <button
                      onClick={() => setCurrentStep('preferences')}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      重新匹配
                    </button>
      </div>

                  <div className="grid grid-cols-1 gap-6">
        {matchedCounselors.map((counselor, index) => (
          <motion.div
            key={counselor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start space-x-6">
                          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-10 h-10 text-gray-500" />
              </div>
              
              <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-xl font-semibold text-gray-900">{counselor.name}</h3>
                                <p className="text-gray-600">{counselor.title}</p>
                                <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">{counselor.rating}</span>
                    </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">{counselor.experience}年经验</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">{counselor.location}</span>
                  </div>
                  </div>
                </div>

                              <div className="text-right">
                                <div className="text-lg font-semibold text-green-600">{counselor.successRate}%</div>
                                <div className="text-sm text-gray-500">问题解决率</div>
                    </div>
                  </div>
                  
                            <p className="text-gray-700 mb-4">{counselor.introduction}</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">擅长流派</h4>
                                <div className="flex flex-wrap gap-1">
                                  {counselor.specialties.map((specialty: string) => (
                                    <span
                                      key={specialty}
                                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                    >
                                      {therapySchools[specialty as keyof typeof therapySchools]?.name.split(' ')[0]}
                                    </span>
                                  ))}
                  </div>
                </div>

                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">咨询方式</h4>
                                <div className="flex flex-wrap gap-1">
                                  {counselor.consultationModes.map((mode: string) => (
                                    <span
                                      key={mode}
                                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                    >
                                      {mode === 'face-to-face' ? '面对面' :
                                       mode === 'video' ? '视频' : '电话'}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">最近可约</h4>
                                <p className="text-sm text-gray-600">{counselor.nextAvailable}</p>
                    </div>
                  </div>
                  
                            <div className="flex space-x-3">
                    <button
                                onClick={() => bookConsultation(counselor)}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                                <Calendar className="w-4 h-4" />
                                <span>预约咨询</span>
                    </button>
                              
                              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                <MessageCircle className="w-4 h-4" />
                                <span>查看详情</span>
                    </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>

                {/* 预约模态框 */}
      <AnimatePresence>
                  {showBookingModal && selectedCounselor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                      onClick={() => setShowBookingModal(false)}
          >
            <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          预约 {selectedCounselor.name}
                        </h3>
                        
                        <div className="space-y-4 mb-6">
                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              咨询方式
                            </label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                              {selectedCounselor.consultationModes.map((mode: string) => (
                                <option key={mode} value={mode}>
                                  {mode === 'face-to-face' ? '面对面咨询' :
                                   mode === 'video' ? '视频咨询' : '电话咨询'}
                                </option>
                              ))}
                            </select>
                </div>

                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              预约时间
                            </label>
                            <input
                              type="datetime-local"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min={new Date().toISOString().slice(0, 16)}
                            />
                </div>

                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              咨询问题简述 (可选)
                            </label>
                            <textarea
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={3}
                              placeholder="请简单描述您的咨询需求..."
                            />
                  </div>
                </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => setShowBookingModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            取消
                          </button>
                  <button 
                    onClick={() => {
                              // 处理预约逻辑
                              setShowBookingModal(false)
                              alert('预约请求已提交，咨询师将在24小时内与您联系确认！')
                            }}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            确认预约
                  </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
              </motion.div>
            )}
    </div>
        </DashboardLayout>
      </RequireRole>
  )
}

  return null
}
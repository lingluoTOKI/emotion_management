'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  Heart,
  Waves,
  Wind,
  Sun,
  Moon,
  Leaf,
  Mountain,
  Calendar,
  Star,
  CheckCircle,
  BarChart3
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'

interface MeditationSession {
  id: string
  title: string
  description: string
  duration: number // minutes
  type: 'breathing' | 'mindfulness' | 'relaxation' | 'sleep' | 'focus'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  instructor: string
  audioUrl?: string
  backgroundSound?: 'nature' | 'ocean' | 'forest' | 'rain' | 'silence'
  benefits: string[]
  guidance: string[]
}

interface PracticeRecord {
  id: string
  sessionId: string
  date: string
  duration: number
  completed: boolean
  mood_before: number
  mood_after: number
  notes?: string
}

const meditationSessions: MeditationSession[] = [
  {
    id: '1',
    title: '初学者呼吸冥想',
    description: '适合初学者的基础呼吸练习，学习觉察呼吸，培养专注力。',
    duration: 10,
    type: 'breathing',
    difficulty: 'beginner',
    instructor: '李冥想师',
    backgroundSound: 'nature',
    benefits: ['减少焦虑', '改善专注力', '提升自我觉察'],
    guidance: [
      '找一个安静舒适的地方坐下',
      '闭上眼睛，专注于自然呼吸',
      '当注意力分散时，温和地将其带回呼吸',
      '不要评判任何想法，只是观察'
    ]
  },
  {
    id: '2',
    title: '正念身体扫描',
    description: '通过系统地扫描身体各部位，培养身体觉察和放松能力。',
    duration: 20,
    type: 'mindfulness',
    difficulty: 'intermediate',
    instructor: '王正念师',
    backgroundSound: 'ocean',
    benefits: ['深度放松', '减少肌肉紧张', '提升身体觉察'],
    guidance: [
      '平躺在舒适的表面上',
      '从脚趾开始，逐步扫描全身',
      '注意每个部位的感觉',
      '允许紧张的部位自然放松'
    ]
  },
  {
    id: '3',
    title: '压力释放冥想',
    description: '专门设计的练习，帮助释放日常积累的压力和紧张情绪。',
    duration: 15,
    type: 'relaxation',
    difficulty: 'beginner',
    instructor: '张放松师',
    backgroundSound: 'forest',
    benefits: ['释放压力', '情绪平静', '恢复精力'],
    guidance: [
      '舒适地坐着或躺着',
      '深呼吸三次，每次呼气时释放紧张',
      '想象压力如云雾般从身体中飘走',
      '感受轻松和平静填满整个身体'
    ]
  },
  {
    id: '4',
    title: '睡前放松冥想',
    description: '帮助放松身心，准备进入深度睡眠的晚间练习。',
    duration: 25,
    type: 'sleep',
    difficulty: 'beginner',
    instructor: '赵睡眠师',
    backgroundSound: 'rain',
    benefits: ['改善睡眠质量', '快速入睡', '深度放松'],
    guidance: [
      '在床上找一个舒适的姿势',
      '放松面部肌肉和双肩',
      '让呼吸变得缓慢而深沉',
      '释放一天的所有担忧和紧张'
    ]
  },
  {
    id: '5',
    title: '专注力训练冥想',
    description: '通过专注练习提升注意力和心理清晰度，提高学习效率。',
    duration: 12,
    type: 'focus',
    difficulty: 'intermediate',
    instructor: '陈专注师',
    backgroundSound: 'silence',
    benefits: ['提升专注力', '增强记忆力', '提高学习效率'],
    guidance: [
      '选择一个专注对象（如呼吸或声音）',
      '保持注意力在选定对象上',
      '注意到分心时，温和地拉回注意力',
      '逐渐延长专注的时间'
    ]
  }
]

const mockPracticeRecords: PracticeRecord[] = [
  {
    id: '1',
    sessionId: '1',
    date: '2024-08-21',
    duration: 10,
    completed: true,
    mood_before: 3,
    mood_after: 7,
    notes: '感觉很放松，心情明显改善'
  },
  {
    id: '2',
    sessionId: '2',
    date: '2024-08-20',
    duration: 20,
    completed: true,
    mood_before: 4,
    mood_after: 8
  },
  {
    id: '3',
    sessionId: '3',
    date: '2024-08-19',
    duration: 15,
    completed: true,
    mood_before: 2,
    mood_after: 6,
    notes: '压力释放效果很好'
  }
]

export default function StudentMeditation() {
  const [selectedSession, setSelectedSession] = useState<MeditationSession | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [customDuration, setCustomDuration] = useState(10)
  const [moodBefore, setMoodBefore] = useState(5)
  const [moodAfter, setMoodAfter] = useState(5)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [sessionCompleted, setSessionCompleted] = useState(false)
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>(mockPracticeRecords)
  const [selectedType, setSelectedType] = useState<string>('all')
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const sessionStartTime = useRef<Date>(new Date())
  const router = useRouter()

  useEffect(() => {
    if (selectedSession) {
      setTotalTime(selectedSession.duration * 60) // Convert to seconds
      setCurrentTime(0)
    }
  }, [selectedSession])

  useEffect(() => {
    if (isPlaying && selectedSession) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= totalTime) {
            setIsPlaying(false)
            setSessionCompleted(true)
            return totalTime
          }
          return prev + 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPlaying, totalTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startSession = () => {
    setSessionStarted(true)
    setIsPlaying(true)
    setCurrentTime(0)
    setSessionCompleted(false)
  }

  const pauseSession = () => {
    setIsPlaying(false)
  }

  const resetSession = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    setSessionStarted(false)
    setSessionCompleted(false)
  }

  const completeSession = () => {
    if (selectedSession) {
      const newRecord: PracticeRecord = {
        id: Date.now().toString(),
        sessionId: selectedSession.id,
        date: new Date().toISOString().split('T')[0],
        duration: Math.floor(currentTime / 60),
        completed: true,
        mood_before: moodBefore,
        mood_after: moodAfter
      }
      setPracticeRecords(prev => [newRecord, ...prev])
      setSelectedSession(null)
      resetSession()
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'breathing': return Wind
      case 'mindfulness': return Leaf
      case 'relaxation': return Waves
      case 'sleep': return Moon
      case 'focus': return Sun
      default: return Heart
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'breathing': return '呼吸冥想'
      case 'mindfulness': return '正念练习'
      case 'relaxation': return '放松练习'
      case 'sleep': return '睡眠辅助'
      case 'focus': return '专注训练'
      default: return type
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getBackgroundSoundIcon = (sound: string) => {
    switch (sound) {
      case 'nature': return Leaf
      case 'ocean': return Waves
      case 'forest': return Mountain
      case 'rain': return Wind
      default: return VolumeX
    }
  }

  const filteredSessions = selectedType === 'all' 
    ? meditationSessions 
    : meditationSessions.filter(session => session.type === selectedType)

  return (
    <RequireRole role="student">
      <DashboardLayout title="冥想练习">
        <div className="space-y-6">
          {!selectedSession ? (
            <>
              {/* 练习统计 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">总练习次数</p>
                      <p className="text-2xl font-bold text-gray-900">{practiceRecords.length}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">总练习时长</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {practiceRecords.reduce((sum, record) => sum + record.duration, 0)}分钟
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">连续练习</p>
                      <p className="text-2xl font-bold text-gray-900">7天</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">心情改善</p>
                      <p className="text-2xl font-bold text-gray-900">
                        +{(practiceRecords.reduce((sum, record) => sum + (record.mood_after - record.mood_before), 0) / practiceRecords.length).toFixed(1)}
                      </p>
                    </div>
                    <Heart className="w-8 h-8 text-pink-600" />
                  </div>
                </div>
              </div>

              {/* 类型筛选 */}
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">选择练习类型</h3>
                <div className="flex flex-wrap gap-3 mb-6">
                  <button
                    onClick={() => setSelectedType('all')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      selectedType === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    <span>全部练习</span>
                  </button>
                  
                  {[
                    { type: 'breathing', label: '呼吸冥想', icon: Wind },
                    { type: 'mindfulness', label: '正念练习', icon: Leaf },
                    { type: 'relaxation', label: '放松练习', icon: Waves },
                    { type: 'sleep', label: '睡眠辅助', icon: Moon },
                    { type: 'focus', label: '专注训练', icon: Sun }
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => setSelectedType(item.type)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        selectedType === item.type ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* 冥想会话列表 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSessions.map((session, index) => {
                    const TypeIcon = getTypeIcon(session.type)
                    const SoundIcon = getBackgroundSoundIcon(session.backgroundSound || 'silence')
                    
                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setSelectedSession(session)}
                        className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <TypeIcon className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(session.difficulty)}`}>
                              {session.difficulty === 'beginner' ? '初级' :
                               session.difficulty === 'intermediate' ? '中级' : '高级'}
                            </span>
                            <span className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{session.duration}分钟</span>
                            </span>
                          </div>
                        </div>

                        <h3 className="font-semibold text-gray-900 mb-2">{session.title}</h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{session.description}</p>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                          <span>{session.instructor}</span>
                          <div className="flex items-center space-x-1">
                            <SoundIcon className="w-3 h-3" />
                            <span>{session.backgroundSound === 'silence' ? '静音' : '背景音'}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-4">
                          {session.benefits.slice(0, 2).map((benefit, benefitIndex) => (
                            <span
                              key={benefitIndex}
                              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs"
                            >
                              {benefit}
                            </span>
                          ))}
                          {session.benefits.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{session.benefits.length - 2}
                            </span>
                          )}
                        </div>

                        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          <Play className="w-4 h-4" />
                          <span>开始练习</span>
                        </button>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* 最近练习记录 */}
              {practiceRecords.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">最近练习记录</h3>
                    <button
                      onClick={() => router.push('/student/meditation/history')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      查看全部 →
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {practiceRecords.slice(0, 3).map((record) => {
                      const session = meditationSessions.find(s => s.id === record.sessionId)
                      return (
                        <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Heart className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{session?.title}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>{record.date}</span>
                                <span>{record.duration}分钟</span>
                                <span>心情: {record.mood_before} → {record.mood_after}</span>
                              </div>
                            </div>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* 冥想会话界面 */
            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-sm border p-8"
              >
                {/* 会话头部 */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {React.createElement(getTypeIcon(selectedSession.type), { className: "w-10 h-10 text-blue-600" })}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedSession.title}</h2>
                  <p className="text-gray-600 mb-4">{selectedSession.description}</p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{selectedSession.duration}分钟</span>
                    </span>
                    <span>•</span>
                    <span>{selectedSession.instructor}</span>
                    <span>•</span>
                    <span>{getTypeLabel(selectedSession.type)}</span>
                  </div>
                </div>

                {!sessionStarted ? (
                  /* 准备阶段 */
                  <>
                    <div className="mb-8">
                      <h3 className="font-semibold text-gray-900 mb-4">练习指导</h3>
                      <ul className="space-y-2">
                        {selectedSession.guidance.map((guide, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                            <span className="text-sm text-gray-700">{guide}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-8">
                      <h3 className="font-semibold text-gray-900 mb-4">练习前心情评分</h3>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-sm text-gray-600">很差</span>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                          <button
                            key={score}
                            onClick={() => setMoodBefore(score)}
                            className={`w-8 h-8 rounded-full border-2 transition-colors ${
                              score <= moodBefore ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-500'
                            }`}
                          >
                            {score}
                          </button>
                        ))}
                        <span className="text-sm text-gray-600">很好</span>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={() => setSelectedSession(null)}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        返回选择
                      </button>
                      <button
                        onClick={startSession}
                        className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Play className="w-5 h-5" />
                        <span>开始练习</span>
                      </button>
                    </div>
                  </>
                ) : sessionCompleted ? (
                  /* 完成阶段 */
                  <>
                    <div className="text-center mb-8">
                      <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">练习完成！</h3>
                      <p className="text-gray-600">恭喜您完成了 {Math.floor(currentTime / 60)} 分钟的冥想练习</p>
                    </div>

                    <div className="mb-8">
                      <h3 className="font-semibold text-gray-900 mb-4">练习后心情评分</h3>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-sm text-gray-600">很差</span>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                          <button
                            key={score}
                            onClick={() => setMoodAfter(score)}
                            className={`w-8 h-8 rounded-full border-2 transition-colors ${
                              score <= moodAfter ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 text-gray-500'
                            }`}
                          >
                            {score}
                          </button>
                        ))}
                        <span className="text-sm text-gray-600">很好</span>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 mb-8">
                      <h4 className="font-medium text-green-900 mb-2">本次练习收获</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        {selectedSession.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <Star className="w-4 h-4" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={resetSession}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        重新练习
                      </button>
                      <button
                        onClick={completeSession}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        保存记录
                      </button>
                    </div>
                  </>
                ) : (
                  /* 练习阶段 */
                  <>
                    {/* 计时器 */}
                    <div className="text-center mb-8">
                      <div className="relative w-48 h-48 mx-auto mb-6">
                        <svg className="transform -rotate-90 w-48 h-48">
                          <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-gray-200"
                          />
                          <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={`${2 * Math.PI * 88}`}
                            strokeDashoffset={`${2 * Math.PI * 88 * (1 - currentTime / totalTime)}`}
                            className="text-blue-600 transition-all duration-1000"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-gray-900">
                              {formatTime(totalTime - currentTime)}
                            </div>
                            <div className="text-sm text-gray-500">剩余时间</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-center space-x-4">
                        <button
                          onClick={resetSession}
                          className="p-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <RotateCcw className="w-6 h-6" />
                        </button>
                        
                        <button
                          onClick={isPlaying ? pauseSession : startSession}
                          className="p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                        >
                          {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                        </button>
                        
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="p-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                        </button>
                      </div>
                    </div>

                    {/* 练习提示 */}
                    <div className="text-center mb-8">
                      <p className="text-lg text-gray-700 mb-2">专注于你的呼吸</p>
                      <p className="text-sm text-gray-500">
                        {isPlaying ? '让思绪自然流动，不做评判' : '暂停中...'}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedSession(null)}
                      className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      结束练习
                    </button>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}

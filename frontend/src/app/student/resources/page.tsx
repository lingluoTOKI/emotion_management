'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen,
  Play,
  Download,
  ExternalLink,
  Heart,
  Brain,
  Lightbulb,
  Shield,
  Clock,
  Users,
  Star,
  Search,
  Filter,
  Headphones,
  Video,
  FileText,
  CheckCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'

interface Resource {
  id: string
  title: string
  description: string
  type: 'article' | 'video' | 'audio' | 'tool' | 'guide'
  category: 'anxiety' | 'depression' | 'stress' | 'relationships' | 'sleep' | 'general'
  duration?: number // minutes
  rating: number
  downloads: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  thumbnail?: string
  url?: string
  author: string
  publishDate: string
  tags: string[]
}

const mockResources: Resource[] = [
  {
    id: '1',
    title: '焦虑情绪的认知行为疗法自助指南',
    description: '学习如何识别和改变导致焦虑的思维模式，包含实用的练习和工作表。',
    type: 'guide',
    category: 'anxiety',
    duration: 30,
    rating: 4.8,
    downloads: 1250,
    difficulty: 'beginner',
    author: '张心理师',
    publishDate: '2024-08-01',
    tags: ['认知行为疗法', 'CBT', '自助练习', '焦虑管理']
  },
  {
    id: '2',
    title: '深度放松冥想引导音频',
    description: '20分钟的引导冥想练习，帮助放松身心，减少压力和焦虑。',
    type: 'audio',
    category: 'stress',
    duration: 20,
    rating: 4.9,
    downloads: 2100,
    difficulty: 'beginner',
    author: '李冥想师',
    publishDate: '2024-07-28',
    tags: ['冥想', '放松', '正念', '音频引导']
  },
  {
    id: '3',
    title: '改善睡眠质量的科学方法',
    description: '基于科学研究的睡眠改善策略，包括睡眠卫生、环境优化等。',
    type: 'article',
    category: 'sleep',
    duration: 15,
    rating: 4.7,
    downloads: 890,
    difficulty: 'intermediate',
    author: '王睡眠专家',
    publishDate: '2024-07-25',
    tags: ['睡眠', '失眠', '睡眠卫生', '健康习惯']
  },
  {
    id: '4',
    title: '人际关系沟通技巧视频课程',
    description: '学习有效的沟通技巧，改善人际关系，建立健康的社交网络。',
    type: 'video',
    category: 'relationships',
    duration: 45,
    rating: 4.6,
    downloads: 670,
    difficulty: 'intermediate',
    author: '刘沟通专家',
    publishDate: '2024-07-20',
    tags: ['人际关系', '沟通技巧', '社交', '视频课程']
  },
  {
    id: '5',
    title: '情绪调节自我评估工具',
    description: '互动式工具，帮助您了解自己的情绪模式和调节策略。',
    type: 'tool',
    category: 'general',
    duration: 10,
    rating: 4.5,
    downloads: 1500,
    difficulty: 'beginner',
    author: '陈情绪专家',
    publishDate: '2024-07-15',
    tags: ['情绪调节', '自我评估', '互动工具', '心理测试']
  },
  {
    id: '6',
    title: '抑郁情绪应对策略手册',
    description: '全面的抑郁情绪应对指南，包含认知重构、行为激活等策略。',
    type: 'guide',
    category: 'depression',
    duration: 40,
    rating: 4.8,
    downloads: 980,
    difficulty: 'advanced',
    author: '赵心理治疗师',
    publishDate: '2024-07-10',
    tags: ['抑郁', '应对策略', '认知重构', '行为激活']
  }
]

export default function StudentResources() {
  const [resources, setResources] = useState<Resource[]>(mockResources)
  const [filteredResources, setFilteredResources] = useState<Resource[]>(resources)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'rating' | 'downloads' | 'date'>('rating')
  const router = useRouter()

  const filterResources = () => {
    let filtered = resources

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => resource.category === selectedCategory)
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(resource => resource.type === selectedType)
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(resource => resource.difficulty === selectedDifficulty)
    }

    if (searchTerm) {
      filtered = filtered.filter(resource => 
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'downloads':
          return b.downloads - a.downloads
        case 'date':
          return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
        default:
          return 0
      }
    })

    setFilteredResources(filtered)
  }

  useEffect(() => {
    filterResources()
  }, [selectedCategory, selectedType, selectedDifficulty, searchTerm, sortBy, resources])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return FileText
      case 'video': return Video
      case 'audio': return Headphones
      case 'tool': return Lightbulb
      case 'guide': return BookOpen
      default: return FileText
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'article': return '文章'
      case 'video': return '视频'
      case 'audio': return '音频'
      case 'tool': return '工具'
      case 'guide': return '指南'
      default: return type
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'anxiety': return '焦虑管理'
      case 'depression': return '抑郁应对'
      case 'stress': return '压力缓解'
      case 'relationships': return '人际关系'
      case 'sleep': return '睡眠改善'
      case 'general': return '综合健康'
      default: return category
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

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '初级'
      case 'intermediate': return '中级'
      case 'advanced': return '高级'
      default: return difficulty
    }
  }

  return (
    <RequireRole role="student">
      <DashboardLayout title="心理健康资源">
        <div className="space-y-6">
          {/* 页面介绍 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">心理健康知识库</h2>
                <p className="text-gray-700 mb-4">
                  精选的心理健康资源，包含科普文章、实用工具、音视频内容，帮助您提升心理健康素养，掌握自我调节技能。
                </p>
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>{resources.filter(r => r.type === 'article').length} 篇文章</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4" />
                    <span>{resources.filter(r => r.type === 'video').length} 个视频</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Headphones className="w-4 h-4" />
                    <span>{resources.filter(r => r.type === 'audio').length} 个音频</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="w-4 h-4" />
                    <span>{resources.filter(r => r.type === 'tool').length} 个工具</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 筛选和搜索 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索资源..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有分类</option>
                <option value="anxiety">焦虑管理</option>
                <option value="depression">抑郁应对</option>
                <option value="stress">压力缓解</option>
                <option value="relationships">人际关系</option>
                <option value="sleep">睡眠改善</option>
                <option value="general">综合健康</option>
              </select>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有类型</option>
                <option value="article">文章</option>
                <option value="video">视频</option>
                <option value="audio">音频</option>
                <option value="tool">工具</option>
                <option value="guide">指南</option>
              </select>
              
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有难度</option>
                <option value="beginner">初级</option>
                <option value="intermediate">中级</option>
                <option value="advanced">高级</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'rating' | 'downloads' | 'date')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="rating">按评分排序</option>
                <option value="downloads">按下载量排序</option>
                <option value="date">按发布时间排序</option>
              </select>
            </div>

            {/* 快速分类 */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { id: 'anxiety', label: '焦虑管理', icon: Brain, color: 'blue' },
                { id: 'depression', label: '抑郁应对', icon: Heart, color: 'purple' },
                { id: 'stress', label: '压力缓解', icon: Shield, color: 'green' },
                { id: 'relationships', label: '人际关系', icon: Users, color: 'orange' },
                { id: 'sleep', label: '睡眠改善', icon: Clock, color: 'indigo' }
              ].map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? `bg-${category.color}-100 text-${category.color}-800`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  <span className="text-sm">{category.label}</span>
                </button>
              ))}
            </div>

            {/* 资源列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">暂无符合条件的资源</p>
                </div>
              ) : (
                filteredResources.map((resource, index) => {
                  const TypeIcon = getTypeIcon(resource.type)
                  
                  return (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <TypeIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(resource.difficulty)}`}>
                            {getDifficultyLabel(resource.difficulty)}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {getTypeLabel(resource.type)}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{resource.title}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{resource.description}</p>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span>{getCategoryLabel(resource.category)}</span>
                        {resource.duration && (
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{resource.duration}分钟</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{resource.rating}</span>
                          </div>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">{resource.downloads} 下载</span>
                        </div>
                        <span className="text-xs text-gray-500">{resource.author}</span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {resource.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {resource.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{resource.tags.length - 3}
                          </span>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                          {resource.type === 'video' ? <Play className="w-4 h-4" /> :
                           resource.type === 'audio' ? <Play className="w-4 h-4" /> :
                           <Download className="w-4 h-4" />}
                          <span>
                            {resource.type === 'video' ? '观看' :
                             resource.type === 'audio' ? '收听' :
                             resource.type === 'tool' ? '使用' : '下载'}
                          </span>
                        </button>
                        
                        {resource.url && (
                          <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>

          {/* 推荐专题 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">精选专题</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                <Brain className="w-8 h-8 text-blue-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">考试焦虑应对</h4>
                <p className="text-sm text-gray-600 mb-4">专门针对学生考试焦虑的应对策略和技巧</p>
                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                  查看专题 →
                </button>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                <Heart className="w-8 h-8 text-green-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">情绪管理技巧</h4>
                <p className="text-sm text-gray-600 mb-4">学习识别、理解和调节各种情绪状态</p>
                <button className="text-green-600 text-sm font-medium hover:text-green-700">
                  查看专题 →
                </button>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                <Users className="w-8 h-8 text-purple-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">人际关系建设</h4>
                <p className="text-sm text-gray-600 mb-4">提升社交技能，建立健康的人际关系</p>
                <button className="text-purple-600 text-sm font-medium hover:text-purple-700">
                  查看专题 →
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}

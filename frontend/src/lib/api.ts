/**
 * API 调用配置和接口定义
 * API Configuration and Interface Definitions
 */

import { request } from '@/utils/request'

// API 响应类型定义
export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
  success: boolean
}

// AI 相关接口类型定义
export interface AIStartSessionResponse {
  session_id: string
  message: string
  session_data?: any
}

export interface AIChatResponse {
  message: string
  emotion_analysis?: {
    dominant_emotion: string
    emotion_intensity: number
    confidence: number
  }
  risk_assessment?: {
    risk_level: string
    risk_score: number
    recommendations: string[]
  }
  session_id: string
  emergency_alert?: any
  redirect_action?: {
    type: string
    message: string
    redirect_to: string
    reason: string
    conversation_count: number
    delay: number
  }
}

export interface AIAssessmentResponse {
  id: number
  assessment_type: string
  status: string
  created_at: string
}

// 综合评估相关接口
export interface ComprehensiveAssessmentRequest {
  session_id: string
  scale_results?: Record<string, any>
  ai_assessment?: any
  include_conversation?: boolean
}

export interface ComprehensiveAssessmentResponse {
  success: boolean
  message: string
  assessment_report: {
    assessment_id: string
    assessment_date: string
    session_id: string
    executive_summary: string
    overall_assessment: {
      risk_level: string
      risk_score: number
      dominant_emotion: string
      assessment_reliability: string
      data_completeness: string
    }
    detailed_findings: {
      conversation_insights: any
      scale_results: any
      risk_factors: Array<{
        factor: string
        source: string
        severity: string
      }>
      protective_factors: Array<{
        factor: string
        source: string
        strength: string
      }>
    }
    recommendations: {
      immediate_actions: string[]
      short_term_goals: string[]
      long_term_strategies: string[]
      referral_suggestions: Array<{
        type: string
        service: string
        urgency: string
        reason: string
      }>
    }
    follow_up_plan: {
      follow_up_schedule: string[]
      next_comprehensive_assessment: string
      monitoring_indicators: string[]
      emergency_contacts: string[]
    }
  }
  meta: {
    session_id: string
    has_conversation_data: boolean
    has_scale_data: boolean
    risk_level: string
  }
}

export interface AssessmentReadinessResponse {
  ready_for_assessment: boolean
  optimal_for_assessment: boolean
  conversation_available: boolean
  conversation_analysis: {
    message_count: number
    quality_score: number
    engagement_level: string
    conversation_depth: string
  }
  scale_recommendations: Array<{
    scale_name: string
    priority: string
    reason: string
  }>
  assessment_quality_prediction: {
    expected_reliability: string
    recommended_improvements: string[]
  }
  recommendations: {
    immediate_actions: string[]
    suggested_scales: string[]
  }
}

export interface ScaleSubmissionRequest {
  session_id: string
  scale_results: Record<string, {
    total_score: number
    items?: any[]
    completion_time?: string
    max_score?: number
  }>
}

export interface ScaleSubmissionResponse {
  success: boolean
  message: string
  scale_report: {
    submission_time: string
    session_id: string
    user_id: number
    scale_results: Record<string, any>
    analysis: any
    summary: any
  }
  next_steps: {
    can_generate_comprehensive_report: boolean
    recommended_action: string
    additional_scales_suggested: any[]
  }
}

export interface AvailableScale {
  scale_name: string
  full_name: string
  type: string
  description: string
  item_count: number
  time_required: string
  score_range: string
  interpretations?: Record<string, string>
  recommended_for: string[]
}

export interface AIAssessmentResult {
  emotion_analysis: {
    dominant_emotion: string
    emotion_intensity: number
    depression_index: number
    anxiety_index: number
    confidence: number
  }
  ai_report: {
    summary: string
    detailed_analysis: any
    recommendations: string[]
    risk_assessment: {
      level: string
      description: string
    }
  }
  ai_session_id?: string  // 添加AI会话ID字段
}

// API 调用函数
export const api = {
  // 认证相关
  auth: {
    login: (credentials: { username: string; password: string }) =>
      request<{ access_token: string; token_type: string; user_role: string; username: string }>(
        '/api/auth/login',
        {
          method: 'POST',
          body: new URLSearchParams(credentials), // OAuth2PasswordRequestForm 需要 form data
        }
      ),

    register: (userData: {
      username: string
      password: string
      email: string
      role: string
      real_name?: string
    }) =>
      request<any>('/api/auth/register', {
        method: 'POST',
        body: userData,
      }),

    getProfile: () =>
      request<any>('/api/auth/me', {
        auth: true,
      }),
  },

  // AI 心理辅导相关
  ai: {
    // 开始 AI 辅导会话
    startSession: (data: { problem_type?: string | null; initial_message?: string | null }) =>
      request<AIStartSessionResponse>('/api/ai/session/start', {
        method: 'POST',
        body: data,
        auth: true,
      }),

    // AI 对话
    chat: (data: { session_id: string; message: string }) =>
      request<AIChatResponse>('/api/ai/session/chat', {
        method: 'POST',
        body: data,
        auth: true,
      }),

    // 结束 AI 会话
    endSession: (sessionId: string) =>
      request<any>('/api/ai/session/end', {
        method: 'POST',
        body: { session_id: sessionId },
        auth: true,
      }),

    // 获取会话总结
    getSessionSummary: (sessionId: string) =>
      request<any>(`/api/ai/session/${sessionId}/summary`, {
        auth: true,
      }),

    // 获取会话历史
    getHistory: (limit: number = 10) =>
      request<any>(`/api/ai/sessions/history?limit=${limit}`, {
        auth: true,
      }),
  },

  // 学生评估相关
  student: {
    // 开始评估
    startAssessment: (data: {
      assessment_type: string
      description?: string
    }) =>
      request<AIAssessmentResponse>('/api/student/assessment/start', {
        method: 'POST',
        body: data,
        auth: true,
      }),

    // 提交评估答案
    submitAnswer: (assessmentId: number, data: {
      question_id: string
      answer: string
    }) =>
      request<any>(`/api/student/assessment/${assessmentId}/submit`, {
        method: 'POST',
        body: data,
        auth: true,
      }),

    // 完成评估
    completeAssessment: (assessmentId: number) =>
      request<AIAssessmentResult>(`/api/student/assessment/${assessmentId}/complete`, {
        method: 'POST',
        auth: true,
      }),

    // 获取评估历史
    getAssessmentHistory: () =>
      request<any>('/api/student/assessment/history', {
        auth: true,
      }),

    // 获取仪表板统计数据
    getDashboardStats: () =>
      request<{
        assessmentCount: number
        consultationCount: number
        aiChatCount: number
        lastAssessmentScore: number
      }>('/api/student/dashboard-stats', {
        auth: true,
      }),
  },

  // 系统状态相关
  system: {
    // 健康检查
    health: () =>
      request<{ status: string; service: string }>('/health'),

    // AI 服务状态
    aiServiceStatus: () =>
      request<{
        service_status: {
          xfyun: {
            available: boolean
            error?: string
          }
        }
      }>('/api/ai-service/status'),
  },

  // 管理员数据可视化相关
  admin: {
    // 获取综合仪表板数据
    getDashboardData: (timeRange: string = 'last_30_days', departmentFilter?: string) =>
      request<{
        wordcloud: {
          words: Array<{
            word: string
            count: number
            weight: number
            font_size: number
            color: string
          }>
          total_keywords: number
          update_time: string
          time_range: string
          shape_mask?: string
          dominant_emotion?: string
        }
        rose_chart: any
        accuracy_pie: any
        success_bar: any
        overall_stats: any
        meta: any
      }>(`/api/admin/visualization/dashboard?time_range=${timeRange}${departmentFilter ? `&department_filter=${departmentFilter}` : ''}`, {
        auth: true
      })
  },

  // 情绪形状相关
  emotionShapes: {
    // 获取可用情绪形状
    getAvailableShapes: () =>
      request<{
        available_emotions: Array<{
          emotion: string
          name: string
          description: string
          keywords: string[]
        }>
        total_count: number
        description: string
      }>('/api/emotion-shapes/shapes/available'),

    // 生成情绪形状
    generateShape: (emotion: string, keywords?: string[]) =>
      request<{
        emotion: string
        shape_mask: string
        mask_size: number[]
        keywords_used: string[]
        success: boolean
      }>('/api/emotion-shapes/shapes/generate', {
        method: 'POST',
        body: { emotion, keywords }
      }),

    // 检测情绪
    detectEmotion: (keywords: string[]) =>
      request<{
        keywords: string[]
        detected_emotion: string
        shape_mask: string
        confidence: string
        success: boolean
      }>('/api/emotion-shapes/shapes/detect-emotion', {
        method: 'POST',
        body: { keywords }
      }),

    // 获取演示数据
    getDemo: () =>
      request<{
        demo_results: Array<{
          case_name: string
          keywords: string[]
          detected_emotion: string
          expected_emotion: string
          match: boolean
          shape_mask: string
        }>
        success_rate: number
        total_cases: number
        description: string
      }>('/api/emotion-shapes/shapes/demo')
  },

  // 综合心理评估相关接口
  comprehensiveAssessment: {
    // 创建综合评估报告
    create: (data: ComprehensiveAssessmentRequest) =>
      request<ComprehensiveAssessmentResponse>('/api/comprehensive-assessment/create-comprehensive-report', {
        method: 'POST',
        body: data
      }),

    // 检查评估准备状态
    checkReadiness: (sessionId: string) =>
      request<AssessmentReadinessResponse>(`/api/comprehensive-assessment/assessment-readiness/${sessionId}`),

    // 提交量表结果
    submitScales: (data: ScaleSubmissionRequest) =>
      request<ScaleSubmissionResponse>('/api/comprehensive-assessment/submit-scale-results', {
        method: 'POST',
        body: data
      }),

    // 获取可用量表
    getAvailableScales: () =>
      request<AvailableScale[]>('/api/comprehensive-assessment/available-scales')
  }
}
// 类型已经通过interface导出，不需要重复导出


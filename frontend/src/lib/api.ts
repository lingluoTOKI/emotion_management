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
}

export interface AIAssessmentResponse {
  id: number
  assessment_type: string
  status: string
  created_at: string
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

    // 结束会话
    endSession: (data: { session_id: string }) =>
      request<any>('/api/ai/session/end', {
        method: 'POST',
        body: data,
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
}

// 导出类型
export type {
  ApiResponse,
  AIStartSessionResponse,
  AIChatResponse,
  AIAssessmentResponse,
  AIAssessmentResult,
}

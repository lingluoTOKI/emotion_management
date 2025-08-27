'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Save, 
  Database, 
  Shield, 
  Bell,
  Globe,
  Lock,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mail,
  Phone
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { RequireRole } from '@/components/AuthGuard'

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'ai' | 'notification'>('general')
  const [isSaving, setIsSaving] = useState(false)

  // 模拟系统配置数据
  const [settings, setSettings] = useState({
    general: {
      systemName: '心理健康管理系统',
      systemVersion: 'v2.1.0',
      maintenanceMode: false,
      maxFileSize: 10,
      sessionTimeout: 30,
      language: 'zh-CN'
    },
    security: {
      passwordMinLength: 8,
      requireSpecialChar: true,
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      enableTwoFactor: false,
      sessionTimeout: 30
    },
    ai: {
      enableAIAssessment: true,
      enableAIChat: true,
      aiModel: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7,
      enableRiskDetection: true,
      riskThreshold: 0.8
    },
    notification: {
      enableEmailNotifications: true,
      enableSMSNotifications: false,
      enableSystemAlerts: true,
      crisisAlertEmail: 'crisis@university.edu.cn',
      dailyReportEmail: 'admin@university.edu.cn',
      weeklyReportEmail: 'admin@university.edu.cn'
    }
  })

  const handleSave = async () => {
    setIsSaving(true)
    // 模拟保存操作
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    // 这里应该调用API保存设置
  }

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }))
  }

  const systemStatus = {
    database: 'healthy',
    aiService: 'healthy',
    emailService: 'warning',
    smsService: 'error'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'error': return <XCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  return (
    <RequireRole role="admin">
      <DashboardLayout title="系统设置">
        <div className="space-y-6">
          {/* 系统状态 */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">系统状态</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Database className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">数据库</p>
                  <div className={`flex items-center space-x-1 text-xs ${getStatusColor(systemStatus.database)}`}>
                    {getStatusIcon(systemStatus.database)}
                    <span>正常</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Globe className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">AI服务</p>
                  <div className={`flex items-center space-x-1 text-xs ${getStatusColor(systemStatus.aiService)}`}>
                    {getStatusIcon(systemStatus.aiService)}
                    <span>正常</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">邮件服务</p>
                  <div className={`flex items-center space-x-1 text-xs ${getStatusColor(systemStatus.emailService)}`}>
                    {getStatusIcon(systemStatus.emailService)}
                    <span>警告</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">短信服务</p>
                  <div className={`flex items-center space-x-1 text-xs ${getStatusColor(systemStatus.smsService)}`}>
                    {getStatusIcon(systemStatus.smsService)}
                    <span>错误</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 设置标签页 */}
          <div className="bg-white rounded-2xl shadow-sm border">
            <div className="border-b">
              <div className="flex space-x-8 px-6">
                {(['general', 'security', 'ai', 'notification'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'general' && '基础设置'}
                    {tab === 'security' && '安全设置'}
                    {tab === 'ai' && 'AI设置'}
                    {tab === 'notification' && '通知设置'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {/* 基础设置 */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        系统名称
                      </label>
                      <input
                        type="text"
                        value={settings.general.systemName}
                        onChange={(e) => updateSetting('general', 'systemName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        系统版本
                      </label>
                      <input
                        type="text"
                        value={settings.general.systemVersion}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        维护模式
                      </label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.general.maintenanceMode}
                          onChange={(e) => updateSetting('general', 'maintenanceMode', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">启用维护模式</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        会话超时时间 (分钟)
                      </label>
                      <input
                        type="number"
                        value={settings.general.sessionTimeout}
                        onChange={(e) => updateSetting('general', 'sessionTimeout', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 安全设置 */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        密码最小长度
                      </label>
                      <input
                        type="number"
                        value={settings.security.passwordMinLength}
                        onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        最大登录尝试次数
                      </label>
                      <input
                        type="number"
                        value={settings.security.maxLoginAttempts}
                        onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        锁定时间 (分钟)
                      </label>
                      <input
                        type="number"
                        value={settings.security.lockoutDuration}
                        onChange={(e) => updateSetting('security', 'lockoutDuration', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        安全选项
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.security.requireSpecialChar}
                            onChange={(e) => updateSetting('security', 'requireSpecialChar', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-600">要求特殊字符</span>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.security.enableTwoFactor}
                            onChange={(e) => updateSetting('security', 'enableTwoFactor', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-600">启用双因素认证</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI设置 */}
              {activeTab === 'ai' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        AI模型
                      </label>
                      <select
                        value={settings.ai.aiModel}
                        onChange={(e) => updateSetting('ai', 'aiModel', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        <option value="claude-3">Claude-3</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        最大Token数
                      </label>
                      <input
                        type="number"
                        value={settings.ai.maxTokens}
                        onChange={(e) => updateSetting('ai', 'maxTokens', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        温度参数
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={settings.ai.temperature}
                        onChange={(e) => updateSetting('ai', 'temperature', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        风险检测阈值
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={settings.ai.riskThreshold}
                        onChange={(e) => updateSetting('ai', 'riskThreshold', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI功能开关
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.ai.enableAIAssessment}
                          onChange={(e) => updateSetting('ai', 'enableAIAssessment', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">启用AI评估</span>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.ai.enableAIChat}
                          onChange={(e) => updateSetting('ai', 'enableAIChat', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">启用AI聊天</span>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.ai.enableRiskDetection}
                          onChange={(e) => updateSetting('ai', 'enableRiskDetection', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">启用风险检测</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 通知设置 */}
              {activeTab === 'notification' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        危机警报邮箱
                      </label>
                      <input
                        type="email"
                        value={settings.notification.crisisAlertEmail}
                        onChange={(e) => updateSetting('notification', 'crisisAlertEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        日报邮箱
                      </label>
                      <input
                        type="email"
                        value={settings.notification.dailyReportEmail}
                        onChange={(e) => updateSetting('notification', 'dailyReportEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        周报邮箱
                      </label>
                      <input
                        type="email"
                        value={settings.notification.weeklyReportEmail}
                        onChange={(e) => updateSetting('notification', 'weeklyReportEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      通知选项
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notification.enableEmailNotifications}
                          onChange={(e) => updateSetting('notification', 'enableEmailNotifications', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">启用邮件通知</span>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notification.enableSMSNotifications}
                          onChange={(e) => updateSetting('notification', 'enableSMSNotifications', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">启用短信通知</span>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notification.enableSystemAlerts}
                          onChange={(e) => updateSetting('notification', 'enableSystemAlerts', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">启用系统警报</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 保存按钮 */}
              <div className="flex justify-end pt-6 border-t">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? '保存中...' : '保存设置'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}

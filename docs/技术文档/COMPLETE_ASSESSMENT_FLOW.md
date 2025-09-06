# 完整心理评估流程文档

## 评估流程概述

本系统实现了基于EasyBert的完整心理评估流程，包含以下四个主要阶段：

### 1. EasyBert情感分析阶段
- **位置**: `backend/app/services/easybert_adapter.py`
- **功能**: 使用您的bert.ckpt模型进行实时情感分析
- **分析内容**:
  - 危机关键词检测 (自杀、死亡等)
  - 严重负面情绪识别 (绝望、痛苦等)
  - 一般负面情绪识别 (难过、焦虑等)
  - 积极情绪识别 (开心、满足等)
- **输出**: 主导情绪、置信度、详细得分

### 2. AI对话评估阶段
- **位置**: `frontend/src/app/student/ai-assessment/page.tsx`
- **功能**: 基于EasyBert分析结果进行智能对话
- **流程**:
  - 用户输入文本 → EasyBert情感分析 → AI根据情感调整回复
  - 实时显示EasyBert分析结果
  - 记录对话历史和情感变化趋势
  - 达到6轮对话或评估维度充分时完成
- **跳转条件**: 对话轮数≥6轮 或 涵盖多种情绪状态且≥5轮

### 3. 传统量表评估阶段
- **位置**: `frontend/src/app/student/assessment/page.tsx`
- **功能**: DASS-21标准化心理量表评估
- **特点**:
  - 显示AI评估完成状态
  - 展示EasyBert分析的情绪状态和风险等级
  - 完成21道标准化问题
  - 自动生成综合评估报告

### 4. 综合评估报告阶段
- **位置**: `backend/app/services/comprehensive_assessment_service.py`
- **功能**: 整合AI对话分析和传统量表结果
- **内容**:
  - AI评估结果 (情绪趋势、风险等级、对话分析)
  - 传统量表结果 (DASS-21得分、各维度评估)
  - 综合风险等级和建议
  - 个性化干预方案

## 技术实现细节

### EasyBert模型集成
```python
# 配置优先级
BERT_MODEL_PREFERENCE = 'easybert'  # 优先使用EasyBert
TASK_MODEL_MAPPING = {
    'emotion_analysis': 'easybert',  # 情感分析使用EasyBert
    'problem_classification': 'modern',  # 问题分类使用现代化BERT
}
```

### 前端数据流
```typescript
// AI评估完成后的数据保存
const aiAssessmentData = {
  session_id: assessmentSessionId,
  emotion_trend: emotionTrend,
  assessment_progress: assessmentProgress,
  conversation_count: chatData.redirect_action.conversation_count,
  completion_reason: chatData.redirect_action.reason,
  timestamp: new Date().toISOString()
}

localStorage.setItem('ai_assessment_completed', 'true')
localStorage.setItem('ai_assessment_result', JSON.stringify(aiAssessmentData))
localStorage.setItem('ai_assessment_session_id', assessmentSessionId)
```

### 后端API流程
```python
# AI咨询服务中的评估完成检查
def _check_assessment_completion(self, session, emotion_analysis, risk_assessment):
    user_message_count = len([msg for msg in conversation_history if msg.get("role") == "user"])
    
    if user_message_count >= 6:
        return {
            "type": "complete_assessment",
            "message": "评估完成消息",
            "redirect_to": "/student/assessment",
            "reason": "达到预设对话轮数",
            "conversation_count": user_message_count,
            "delay": 3000
        }
```

## 用户体验流程

### 1. 开始评估
- 用户访问 `/student/ai-assessment`
- 选择文本或语音模式
- 系统创建AI会话

### 2. 对话评估
- 用户输入 → EasyBert分析 → AI回复
- 实时显示情绪状态和风险等级
- 显示EasyBert分析详情和置信度

### 3. 自动跳转
- AI判断评估完成
- 显示完成消息和倒计时
- 自动跳转到传统量表页面

### 4. 量表评估
- 显示AI评估完成状态
- 展示EasyBert分析结果
- 完成DASS-21量表

### 5. 综合报告
- 自动生成综合评估报告
- 整合AI和量表结果
- 提供个性化建议

## 关键特性

### EasyBert优势
- ✅ 使用您的预训练bert.ckpt模型
- ✅ 专门优化的中文情感分析
- ✅ 危机检测和风险评估
- ✅ 实时分析和高置信度

### 智能对话
- ✅ 基于情感分析调整AI回复
- ✅ 自然语言对话体验
- ✅ 自动评估完成判断
- ✅ 无缝跳转到传统量表

### 综合评估
- ✅ 双重验证 (AI + 量表)
- ✅ 更准确的评估结果
- ✅ 个性化干预建议
- ✅ 完整的评估报告

## 文件结构

```
backend/
├── app/services/
│   ├── easybert_adapter.py          # EasyBert模型适配器
│   ├── ai_counseling_service.py     # AI咨询服务
│   └── comprehensive_assessment_service.py  # 综合评估服务
├── app/core/
│   └── bert_config.py               # BERT模型配置
└── app/api/
    └── ai_counseling.py             # AI咨询API

frontend/
├── src/app/student/
│   ├── ai-assessment/page.tsx       # AI评估页面
│   └── assessment/page.tsx          # 传统量表页面
└── src/lib/
    └── api.ts                       # API接口定义
```

## 测试验证

运行测试脚本验证EasyBert功能：
```bash
cd backend
python test_easybert.py
```

测试结果应显示：
- ✅ EasyBert模型加载成功
- ✅ 情感分析功能正常
- ✅ 危机检测准确
- ✅ 置信度计算正确

## 总结

这个完整的评估流程实现了：
1. **EasyBert情感分析** → 实时、准确的中文情感识别
2. **AI智能对话** → 基于情感分析的个性化对话
3. **传统量表验证** → 标准化心理评估
4. **综合报告生成** → 整合多种评估结果

整个流程充分利用了您的EasyBert模型，提供了科学、准确、个性化的心理健康评估服务。

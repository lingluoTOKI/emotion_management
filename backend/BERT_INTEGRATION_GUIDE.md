# BERT集成指南

## 概述

本文档介绍了如何将EasyBert项目集成到情感管理系统中，为系统添加基于BERT的高级文本分析功能。

## 集成内容

### 1. 核心功能模块

#### 1.1 情感分析 (Sentiment Analysis)
- **文件**: `EasyBert/Sentiment.py`
- **功能**: 分析文本的情感倾向（积极、消极、中性）
- **应用**: 改进现有的关键词匹配情感分析，提供更准确的情感识别

#### 1.2 文本分类 (Text Classification)  
- **文件**: `EasyBert/TextClassifier.py`
- **功能**: 自动分类文本内容（体育、军事、娱乐、政治、教育等）
- **应用**: 智能识别学生咨询问题的类型，优化问题分类

#### 1.3 命名实体识别 (Named Entity Recognition)
- **文件**: `EasyBert/NER.py` 
- **功能**: 识别文本中的人名、地名、组织机构等实体
- **应用**: 提取咨询内容中的关键信息，增强上下文理解

#### 1.4 文本相似度 (Text Similarity)
- **文件**: `EasyBert/TextMatch.py`
- **功能**: 计算两个文本之间的相似度
- **应用**: 匹配相似咨询案例，推荐相关资源

### 2. 集成架构

```
情感管理系统
├── EasyBert/                    # EasyBert项目代码
│   ├── Sentiment/              # 情感分析模块
│   ├── TextClassifier/         # 文本分类模块  
│   ├── NER/                   # 命名实体识别模块
│   └── TextMatch/             # 文本匹配模块
├── app/
│   ├── services/
│   │   ├── bert_text_analyzer.py     # BERT分析服务封装
│   │   └── ai_counseling_service.py  # 集成BERT的AI咨询服务
│   └── api/
│       └── bert_analysis.py         # BERT分析API端点
└── test_bert_integration.py        # 集成测试脚本
```

### 3. 主要文件说明

#### 3.1 `bert_text_analyzer.py`
BERT文本分析器的主要封装类，提供以下功能：
- `analyze_emotion()`: 情感分析
- `classify_problem_type()`: 问题类型分类
- `extract_entities()`: 实体识别
- `calculate_text_similarity()`: 文本相似度计算
- `comprehensive_analysis()`: 综合分析

#### 3.2 `ai_counseling_service.py` (已修改)
在原有AI咨询服务基础上集成BERT功能：
- 优先使用BERT进行情感分析
- 支持BERT综合分析
- 保留关键词匹配作为后备方案

#### 3.3 `bert_analysis.py`
提供BERT分析的API端点：
- `POST /api/bert/emotion-analysis`: 情感分析
- `POST /api/bert/problem-classification`: 问题分类  
- `POST /api/bert/entity-extraction`: 实体识别
- `POST /api/bert/text-similarity`: 文本相似度
- `POST /api/bert/comprehensive-analysis`: 综合分析
- `GET /api/bert/status`: 服务状态检查

## 使用方法

### 1. 后端测试

运行集成测试脚本：
```bash
cd backend
python test_bert_integration.py
```

### 2. API测试

启动后端服务后，可以通过以下方式测试：

#### 情感分析
```bash
curl -X POST "http://localhost:8000/api/bert/emotion-analysis" \
     -H "Content-Type: application/json" \
     -d '{"text": "我今天心情很好！"}'
```

#### 问题分类
```bash
curl -X POST "http://localhost:8000/api/bert/problem-classification" \
     -H "Content-Type: application/json" \
     -d '{"text": "我学习压力很大，不知道怎么办。"}'
```

#### 综合分析
```bash
curl -X POST "http://localhost:8000/api/bert/comprehensive-analysis" \
     -H "Content-Type: application/json" \
     -d '{"text": "我最近感觉很焦虑，学习压力好大。"}'
```

### 3. 前端界面

访问管理员面板的BERT分析页面：
```
http://localhost:3000/admin/bert-analysis
```

该页面提供：
- BERT服务状态监控
- 文本分析测试界面
- 分析结果可视化展示

## 配置说明

### 1. 依赖安装

BERT功能需要以下Python包：
```txt
torch>=2.1.1
transformers>=4.36.2
jieba>=0.42.1
regex>=2020.2.20
```

### 2. 模型文件

EasyBert需要预训练模型文件：
- 情感分析模型：`EasyBert/Sentiment/bert_pretrain/`
- 文本分类模型：`EasyBert/TextClassifier/bert_pretrain/`
- NER模型：`EasyBert/NER/prev_trained_model/bert-base/`

**注意**: 由于模型文件较大，当前版本在缺少模型时会自动回退到基于规则的方法。

### 3. 回退机制

当BERT模型不可用时，系统会自动使用后备方案：
- 情感分析：关键词匹配
- 问题分类：关键词规则分类
- 实体识别：返回空结果
- 文本相似度：词汇重叠计算

## 扩展功能

### 1. 自定义情感词典

可以在`bert_text_analyzer.py`中扩展情感关键词：
```python
emotion_keywords = {
    "depression": ["难过", "痛苦", "绝望", "不想活"],
    "anxiety": ["焦虑", "紧张", "担心", "害怕"],
    # 添加更多关键词...
}
```

### 2. 问题类型映射

可以自定义问题类型映射关系：
```python
problem_type_mapping = {
    '教育': 'academic_pressure',
    '社会': 'social_anxiety',
    '娱乐': 'lifestyle',
    # 添加更多映射...
}
```

### 3. 风险评估规则

可以调整风险评估的关键词和评分：
```python
danger_keywords = ['自杀', '死亡', '伤害', '绝望']
# 每个关键词增加3分风险评分
```

## 性能监控

### 1. 服务状态检查

```python
# 检查BERT分析器状态
status = bert_analyzer.get_status()
print(f"可用性: {status['available']}")
print(f"支持功能: {status['supported_features']}")
```

### 2. 分析方法标识

每个分析结果都包含`analysis_method`字段：
- `bert`: 使用BERT模型分析
- `keyword_fallback`: 使用关键词回退
- `fallback`: 使用基础回退方案

### 3. 日志监控

系统会记录详细的操作日志：
```
2025-09-05 13:32:01.496 | INFO | BERT综合分析完成
2025-09-05 13:32:01.496 | WARNING | BERT情感分析不可用，使用关键词匹配
```

## 故障排除

### 1. 模块加载失败

错误信息：`No module named 'pytorch_pretrained'`

解决方案：
1. 确保安装了所有依赖包
2. 检查EasyBert目录结构完整性
3. 确认Python路径配置正确

### 2. 模型文件缺失

现象：BERT分析器可用性为False

解决方案：
1. 下载对应的预训练模型文件
2. 系统会自动使用后备方案，功能依然可用

### 3. API调用失败

检查项：
1. 后端服务是否正常运行
2. API路由是否正确注册
3. 请求格式是否符合要求

## 未来改进

1. **模型优化**: 使用更轻量级的BERT模型
2. **缓存机制**: 添加分析结果缓存提高性能
3. **批量处理**: 支持批量文本分析
4. **自定义训练**: 基于心理咨询数据微调模型
5. **实时更新**: 支持模型热更新

## 总结

通过集成EasyBert，情感管理系统获得了更强大的文本分析能力。该集成方案具有以下优势：

1. **渐进式升级**: 保留原有功能，逐步增强分析能力
2. **高可用性**: 多层回退机制确保服务稳定
3. **模块化设计**: 便于维护和扩展
4. **完整的API**: 提供全面的分析接口
5. **监控和调试**: 完善的状态监控和日志系统

这为构建更智能的心理健康咨询系统奠定了坚实的技术基础。

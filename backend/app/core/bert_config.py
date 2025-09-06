"""
BERT模型配置
用于选择和配置不同的BERT模型
"""

from typing import Literal

# BERT模型选择配置 - 优先使用EasyBert
BERT_MODEL_PREFERENCE: Literal['auto', 'modern', 'easybert', 'mixed'] = 'easybert'

# 配置说明:
# 'auto': 自动选择最佳可用模型（现代化BERT > EasyBert > 后备）
# 'modern': 强制使用现代化BERT
# 'easybert': 优先使用您的EasyBert模型
# 'mixed': 混合使用（情感分析用EasyBert，分类用现代化BERT）

# 任务特定配置
TASK_MODEL_MAPPING = {
    'emotion_analysis': 'easybert',  # 情感分析使用EasyBert（效果更好）
    'problem_classification': 'modern',  # 问题分类使用现代化BERT
    'entity_extraction': 'jieba',  # 实体识别使用jieba
    'text_similarity': 'jieba'  # 文本相似度使用jieba
}

# EasyBert模型路径配置
EASYBERT_MODEL_PATHS = {
    'sentiment': 'EasyBert/Sentiment/saved_dict/bert.ckpt',
    'classifier': 'EasyBert/TextClassifier/THUCNews/saved_dict/bert.ckpt',
    'ner': 'EasyBert/NER/outputs/cner_output/bert/pytorch_model.bin'
}

def get_preferred_model_for_task(task: str) -> str:
    """获取特定任务的首选模型"""
    if BERT_MODEL_PREFERENCE == 'mixed':
        return TASK_MODEL_MAPPING.get(task, 'auto')
    else:
        return BERT_MODEL_PREFERENCE

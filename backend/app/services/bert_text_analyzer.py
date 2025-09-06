"""
BERT文本分析服务
基于EasyBert项目的BERT模型集成服务
"""

import os
import sys
import json
import torch
import numpy as np
from typing import Dict, List, Any, Optional
from loguru import logger
from datetime import datetime
from app.core.bert_config import get_preferred_model_for_task, BERT_MODEL_PREFERENCE

# 添加EasyBert到Python路径
sys.path.append(os.path.join(os.path.dirname(__file__), '../../EasyBert'))

try:
    from app.services.modern_bert_analyzer import modern_bert_analyzer
    MODERN_BERT_AVAILABLE = True
    logger.info("现代化BERT模块加载成功")
except ImportError as e:
    logger.warning(f"现代化BERT模块加载失败: {e}")
    MODERN_BERT_AVAILABLE = False

# 尝试加载EasyBert适配器
try:
    from app.services.easybert_adapter import analyze_emotion_with_easybert
    # 测试适配器是否工作
    test_result = analyze_emotion_with_easybert("测试")
    EASYBERT_ADAPTER_AVAILABLE = True
    logger.info("新版EasyBert适配器加载成功")
except Exception as e:
    logger.warning(f"新版EasyBert适配器加载失败: {e}")
    EASYBERT_ADAPTER_AVAILABLE = False

# 保留原EasyBert尝试作为备选
try:
    from Sentiment import Config as SentimentConfig, predict as sentiment_predict
    from TextClassifier import Config as ClassifierConfig, predict as classifier_predict
    from NER import Config as NERConfig, predict as ner_predict
    from TextMatch import main as text_match_main
    EASYBERT_AVAILABLE = True
    logger.info("原始EasyBert模块加载成功")
except ImportError as e:
    logger.warning(f"原始EasyBert模块加载失败: {e}")
    EASYBERT_AVAILABLE = False


class BertTextAnalyzer:
    """BERT文本分析器"""
    
    def __init__(self):
        # 优先级：现代化BERT > EasyBert适配器 > 原始EasyBert > 后备方案
        if MODERN_BERT_AVAILABLE:
            self.available = True
            self.models_loaded = True
            self.analyzer = modern_bert_analyzer
            self.mode = 'modern'
            logger.info("使用现代化BERT分析器")
        elif EASYBERT_ADAPTER_AVAILABLE:
            self.available = True
            self.models_loaded = True
            self.analyzer = easybert_adapter
            self.mode = 'easybert_adapter'
            logger.info("使用您的EasyBert预训练模型（适配器模式）")
        elif EASYBERT_AVAILABLE:
            self.available = EASYBERT_AVAILABLE
            self.models_loaded = False
            self.analyzer = None
            self.mode = 'easybert_original'
            self._initialize_models()
        else:
            self.available = False
            self.models_loaded = False
            self.analyzer = None
            self.mode = 'fallback'
            logger.warning("所有BERT模块不可用，使用后备方案")
    
    def _initialize_models(self):
        """初始化BERT模型"""
        try:
            # 初始化情感分析配置
            self.sentiment_config = SentimentConfig()
            logger.info("情感分析模型配置初始化成功")
            
            # 初始化文本分类配置
            self.classifier_config = ClassifierConfig()
            logger.info("文本分类模型配置初始化成功")
            
            # 初始化命名实体识别配置
            self.ner_config = NERConfig()
            logger.info("命名实体识别模型配置初始化成功")
            
            self.models_loaded = True
            
        except Exception as e:
            logger.error(f"BERT模型初始化失败: {e}")
            self.models_loaded = False
    
    def analyze_emotion(self, text: str) -> Dict[str, Any]:
        """
        使用BERT进行情感分析 - 支持混合模式
        
        Args:
            text: 输入文本
            
        Returns:
            情感分析结果
        """
        # 检查是否为混合模式，且情感分析优先使用EasyBert
        preferred_model = get_preferred_model_for_task('emotion_analysis')
        
        if preferred_model == 'easybert' and EASYBERT_ADAPTER_AVAILABLE:
            logger.info("混合模式：使用新版EasyBert进行情感分析")
            return analyze_emotion_with_easybert(text)
        elif preferred_model == 'modern' and MODERN_BERT_AVAILABLE:
            logger.info("混合模式：使用现代化BERT进行情感分析")
            return modern_bert_analyzer.analyze_emotion(text)
        
        # 原有逻辑作为后备
        if self.mode == 'modern' and self.analyzer:
            return self.analyzer.analyze_emotion(text)
        elif self.mode == 'easybert_adapter' and self.analyzer:
            return self.analyzer.analyze_emotion_with_easybert(text)
        elif self.mode == 'easybert_original' and self.available and self.models_loaded:
            try:
                # 使用EasyBert的情感分析
                result = sentiment_predict([text])
                
                if result and len(result) > 0:
                    prediction = result[0]
                    
                    # 转换为标准格式
                    emotion_mapping = {
                        '积极': 'positive',
                        '消极': 'negative', 
                        '中性': 'neutral'
                    }
                    
                    dominant_emotion = emotion_mapping.get(prediction['label'], 'neutral')
                    confidence = prediction.get('confidence', 0.8)
                    
                    return {
                        'dominant_emotion': dominant_emotion,
                        'confidence': confidence,
                        'raw_prediction': prediction,
                        'analysis_method': 'easybert',
                        'timestamp': datetime.utcnow().isoformat()
                    }
                else:
                    logger.warning("EasyBert情感分析返回空结果")
                    return self._fallback_emotion_analysis(text)
                    
            except Exception as e:
                logger.error(f"EasyBert情感分析失败: {e}")
                return self._fallback_emotion_analysis(text)
        else:
            return self._fallback_emotion_analysis(text)
    
    def classify_problem_type(self, text: str) -> Dict[str, Any]:
        """
        使用BERT进行问题类型分类 - 支持混合模式
        
        Args:
            text: 输入文本
            
        Returns:
            分类结果
        """
        # 检查混合模式配置
        preferred_model = get_preferred_model_for_task('problem_classification')
        
        if preferred_model == 'modern' and MODERN_BERT_AVAILABLE:
            logger.info("混合模式：使用现代化BERT进行问题分类")
            return modern_bert_analyzer.classify_problem_type(text)
        elif preferred_model == 'easybert' and EASYBERT_ADAPTER_AVAILABLE:
            logger.info("混合模式：使用EasyBert进行问题分类")
            # 使用后备分类方法，因为EasyBert适配器主要专注于情感分析
            return self._fallback_classification(text)
        
        # 原有逻辑作为后备
        if self.mode == 'modern' and self.analyzer:
            return self.analyzer.classify_problem_type(text)
        elif self.mode == 'easybert_adapter' and self.analyzer:
            # EasyBert适配器主要专注于情感分析，问题分类使用后备方法
            return self._fallback_classification(text)
        elif self.mode == 'easybert_original' and self.available and self.models_loaded:
            try:
                # 使用EasyBert的文本分类
                result = classifier_predict([text])
                
                if result and len(result) > 0:
                    prediction = result[0]
                    
                    # 将原始分类映射到心理咨询相关类别
                    problem_type_mapping = {
                        '教育': 'academic_pressure',
                        '社会': 'social_anxiety', 
                        '娱乐': 'lifestyle',
                        '体育': 'physical_health',
                        '政治': 'social_issues',
                        '财经': 'career_anxiety',
                        '科技': 'technology_stress',
                        '军事': 'stress',
                        '灾难': 'trauma',
                        '违法': 'behavioral_issues'
                    }
                    
                    raw_category = prediction['label']
                    problem_type = problem_type_mapping.get(raw_category, 'general')
                    confidence = prediction.get('confidence', 0.7)
                    
                    return {
                        'problem_type': problem_type,
                        'raw_category': raw_category,
                        'confidence': confidence,
                        'analysis_method': 'easybert',
                        'timestamp': datetime.utcnow().isoformat()
                    }
                else:
                    return self._fallback_classification(text)
                    
            except Exception as e:
                logger.error(f"EasyBert问题分类失败: {e}")
                return self._fallback_classification(text)
        else:
            return self._fallback_classification(text)
    
    def extract_entities(self, text: str) -> Dict[str, Any]:
        """
        使用BERT进行命名实体识别
        
        Args:
            text: 输入文本
            
        Returns:
            实体识别结果
        """
        if self.mode == 'modern' and self.analyzer:
            return self.analyzer.extract_entities(text)
        elif self.mode == 'easybert' and self.available and self.models_loaded:
            try:
                # 使用EasyBert的命名实体识别
                result = ner_predict([text])
                
                if result and len(result) > 0:
                    entities = result[0].get('label', {})
                    
                    # 转换为心理咨询相关的实体类型
                    relevant_entities = {
                        'persons': entities.get('name', []),
                        'organizations': entities.get('organization', []) + entities.get('company', []),
                        'locations': entities.get('address', []),
                        'positions': entities.get('position', []),
                        'emotions': [],  # 需要自定义情感词实体
                        'relationships': []  # 需要自定义关系词实体
                    }
                    
                    return {
                        'entities': relevant_entities,
                        'raw_entities': entities,
                        'analysis_method': 'easybert',
                        'timestamp': datetime.utcnow().isoformat()
                    }
                else:
                    return self._fallback_ner(text)
                    
            except Exception as e:
                logger.error(f"EasyBert实体识别失败: {e}")
                return self._fallback_ner(text)
        else:
            return self._fallback_ner(text)
    
    def calculate_text_similarity(self, text1: str, text2: str) -> Dict[str, Any]:
        """
        使用BERT计算文本相似度
        
        Args:
            text1: 第一个文本
            text2: 第二个文本
            
        Returns:
            相似度结果
        """
        if self.mode == 'modern' and self.analyzer:
            return self.analyzer.calculate_text_similarity(text1, text2)
        elif self.mode == 'easybert' and self.available and self.models_loaded:
            try:
                # 使用EasyBert的文本匹配
                result = text_match_main([[text1, text2]])
                
                if result and len(result) > 0:
                    similarity_result = result[0]
                    
                    # 解析相似度结果
                    is_similar = similarity_result[2] == '相似'
                    similarity_score = 0.8 if is_similar else 0.3  # EasyBert返回的是分类结果，需要转换为数值
                    
                    return {
                        'similarity_score': similarity_score,
                        'is_similar': is_similar,
                        'raw_result': similarity_result,
                        'analysis_method': 'easybert',
                        'timestamp': datetime.utcnow().isoformat()
                    }
                else:
                    return self._fallback_similarity(text1, text2)
                    
            except Exception as e:
                logger.error(f"EasyBert文本相似度计算失败: {e}")
                return self._fallback_similarity(text1, text2)
        else:
            return self._fallback_similarity(text1, text2)
    
    def comprehensive_analysis(self, text: str) -> Dict[str, Any]:
        """
        综合文本分析
        
        Args:
            text: 输入文本
            
        Returns:
            综合分析结果
        """
        # 对于综合分析，始终使用混合模式或组合分析以获得最佳效果
        if BERT_MODEL_PREFERENCE == 'mixed' or True:  # 优先使用混合分析
            logger.info("使用混合模式进行综合分析")
            results = {
                'text': text,
                'timestamp': datetime.utcnow().isoformat(),
                'analysis_method': 'mixed_comprehensive'
            }
            
            # 情感分析 - 使用配置的首选方法
            emotion_result = self.analyze_emotion(text)
            results['emotion_analysis'] = emotion_result
            
            # 问题类型分类 - 使用配置的首选方法
            classification_result = self.classify_problem_type(text)
            results['problem_classification'] = classification_result
            
            # 实体识别
            entity_result = self.extract_entities(text)
            results['entity_extraction'] = entity_result
            
            # 综合风险评估
            risk_assessment = self._assess_comprehensive_risk(
                emotion_result, classification_result, entity_result, text
            )
            results['risk_assessment'] = risk_assessment
            
            return results
        
        elif self.mode == 'modern' and self.analyzer:
            return self.analyzer.comprehensive_analysis(text)
        elif self.mode == 'easybert_adapter' and self.analyzer:
            return self.analyzer.comprehensive_analysis(text)
        else:
            # 使用组合分析
            results = {
                'text': text,
                'timestamp': datetime.utcnow().isoformat(),
                'analysis_method': f'{self.mode}_comprehensive'
            }
            
            # 情感分析
            emotion_result = self.analyze_emotion(text)
            results['emotion_analysis'] = emotion_result
            
            # 问题类型分类
            classification_result = self.classify_problem_type(text)
            results['problem_classification'] = classification_result
            
            # 实体识别
            entity_result = self.extract_entities(text)
            results['entity_extraction'] = entity_result
            
            # 综合风险评估
            risk_assessment = self._assess_comprehensive_risk(
                emotion_result, classification_result, entity_result, text
            )
            results['risk_assessment'] = risk_assessment
            
            return results
    
    def _assess_comprehensive_risk(self, emotion: Dict, classification: Dict, 
                                 entities: Dict, text: str) -> Dict[str, Any]:
        """综合风险评估"""
        risk_score = 0
        risk_factors = []
        
        # 基于情感分析的风险
        if emotion.get('dominant_emotion') == 'negative':
            risk_score += 2
            risk_factors.append('负面情绪')
        
        # 基于问题类型的风险
        high_risk_types = ['trauma', 'behavioral_issues', 'social_anxiety']
        if classification.get('problem_type') in high_risk_types:
            risk_score += 2
            risk_factors.append('高风险问题类型')
        
        # 基于实体识别的风险（检查是否提到危险词汇）
        danger_keywords = ['自杀', '死亡', '伤害', '绝望', '痛苦']
        for keyword in danger_keywords:
            if keyword in text:
                risk_score += 3
                risk_factors.append(f'危险关键词: {keyword}')
        
        # 确定风险等级
        if risk_score >= 5:
            risk_level = 'high'
        elif risk_score >= 3:
            risk_level = 'medium'
        elif risk_score >= 1:
            risk_level = 'low'
        else:
            risk_level = 'minimal'
        
        return {
            'risk_level': risk_level,
            'risk_score': risk_score,
            'risk_factors': risk_factors,
            'confidence': emotion.get('confidence', 0.7)
        }
    
    def _fallback_emotion_analysis(self, text: str) -> Dict[str, Any]:
        """后备情感分析方法"""
        # 简单的关键词情感分析
        negative_words = ['难过', '痛苦', '绝望', '焦虑', '害怕', '愤怒']
        positive_words = ['开心', '快乐', '高兴', '满足', '喜欢']
        
        negative_count = sum(1 for word in negative_words if word in text)
        positive_count = sum(1 for word in positive_words if word in text)
        
        if negative_count > positive_count:
            emotion = 'negative'
        elif positive_count > negative_count:
            emotion = 'positive'
        else:
            emotion = 'neutral'
        
        return {
            'dominant_emotion': emotion,
            'confidence': 0.6,
            'analysis_method': 'keyword_fallback',
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def _fallback_classification(self, text: str) -> Dict[str, Any]:
        """后备分类方法"""
        # 基于关键词的简单分类
        keywords_mapping = {
            'academic_pressure': ['学习', '考试', '成绩', '作业', '压力'],
            'social_anxiety': ['朋友', '社交', '人际关系', '孤独'],
            'family_issues': ['家庭', '父母', '家人', '亲情'],
            'emotional_issues': ['感情', '爱情', '分手', '恋爱']
        }
        
        for problem_type, keywords in keywords_mapping.items():
            if any(keyword in text for keyword in keywords):
                return {
                    'problem_type': problem_type,
                    'confidence': 0.5,
                    'analysis_method': 'keyword_fallback',
                    'timestamp': datetime.utcnow().isoformat()
                }
        
        return {
            'problem_type': 'general',
            'confidence': 0.3,
            'analysis_method': 'keyword_fallback',
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def _fallback_ner(self, text: str) -> Dict[str, Any]:
        """后备实体识别方法"""
        return {
            'entities': {
                'persons': [],
                'organizations': [],
                'locations': [],
                'positions': [],
                'emotions': [],
                'relationships': []
            },
            'analysis_method': 'fallback',
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def _fallback_similarity(self, text1: str, text2: str) -> Dict[str, Any]:
        """后备相似度计算方法"""
        # 简单的词汇重叠相似度
        words1 = set(text1.split())
        words2 = set(text2.split())
        
        if len(words1) == 0 and len(words2) == 0:
            similarity = 1.0
        elif len(words1) == 0 or len(words2) == 0:
            similarity = 0.0
        else:
            intersection = words1.intersection(words2)
            union = words1.union(words2)
            similarity = len(intersection) / len(union)
        
        return {
            'similarity_score': similarity,
            'is_similar': similarity > 0.5,
            'analysis_method': 'word_overlap_fallback',
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def get_status(self) -> Dict[str, Any]:
        """获取分析器状态"""
        base_status = {
            'available': self.available,
            'models_loaded': self.models_loaded,
            'mode': self.mode,
            'model_preference': BERT_MODEL_PREFERENCE,
            'modern_bert_available': MODERN_BERT_AVAILABLE,
            'easybert_adapter_available': EASYBERT_ADAPTER_AVAILABLE,
            'easybert_original_available': EASYBERT_AVAILABLE,
            'task_assignments': {
                'emotion_analysis': get_preferred_model_for_task('emotion_analysis'),
                'problem_classification': get_preferred_model_for_task('problem_classification'),
                'entity_extraction': get_preferred_model_for_task('entity_extraction'),
                'text_similarity': get_preferred_model_for_task('text_similarity')
            },
            'supported_features': [
                'emotion_analysis',
                'problem_classification', 
                'entity_extraction',
                'text_similarity',
                'comprehensive_analysis'
            ] if self.available else ['fallback_methods']
        }
        
        if self.mode == 'modern' and self.analyzer:
            # 获取现代化BERT的详细状态
            modern_status = self.analyzer.get_status()
            base_status.update({
                'detailed_status': modern_status
            })
        
        return base_status


# 创建全局实例
bert_analyzer = BertTextAnalyzer()

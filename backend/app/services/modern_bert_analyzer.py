"""
现代化BERT文本分析服务
使用最新的transformers库和预训练模型
"""

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
from typing import Dict, List, Any, Optional
from loguru import logger
from datetime import datetime
import jieba
import re
import numpy as np

class ModernBertAnalyzer:
    """现代化BERT文本分析器"""
    
    def __init__(self):
        self.available = False
        self.models_loaded = False
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # 模型配置
        self.models = {
            'sentiment': None,
            'classifier': None
        }
        
        self._initialize_models()
    
    def _initialize_models(self):
        """初始化BERT模型"""
        try:
            logger.info("开始初始化现代化BERT模型...")
            
            # 尝试加载中文情感分析模型
            try:
                self.sentiment_pipeline = pipeline(
                    "sentiment-analysis",
                    model="uer/roberta-base-finetuned-cluener2020-chinese",
                    tokenizer="uer/roberta-base-finetuned-cluener2020-chinese",
                    device=0 if torch.cuda.is_available() else -1
                )
                logger.info("情感分析模型加载成功")
            except Exception as e:
                logger.warning(f"专业情感分析模型加载失败，使用通用模型: {e}")
                try:
                    # 尝试使用通用的中文BERT模型
                    self.sentiment_pipeline = pipeline(
                        "sentiment-analysis",
                        model="bert-base-chinese",
                        device=0 if torch.cuda.is_available() else -1
                    )
                    logger.info("通用BERT情感分析模型加载成功")
                except Exception as e2:
                    logger.error(f"所有情感分析模型加载失败: {e2}")
                    self.sentiment_pipeline = None
            
            # 尝试加载文本分类模型
            try:
                self.classification_pipeline = pipeline(
                    "zero-shot-classification",
                    model="facebook/bart-large-mnli",
                    device=0 if torch.cuda.is_available() else -1
                )
                logger.info("文本分类模型加载成功")
            except Exception as e:
                logger.warning(f"文本分类模型加载失败: {e}")
                self.classification_pipeline = None
            
            # 检查模型状态
            if self.sentiment_pipeline or self.classification_pipeline:
                self.available = True
                self.models_loaded = True
                logger.info("现代化BERT模型初始化完成")
            else:
                logger.warning("所有BERT模型加载失败，将使用后备方案")
                
        except Exception as e:
            logger.error(f"现代化BERT模型初始化失败: {e}")
            self.available = False
            self.models_loaded = False
    
    def analyze_emotion(self, text: str) -> Dict[str, Any]:
        """
        使用现代化BERT进行情感分析
        """
        if not text.strip():
            return self._fallback_emotion_analysis(text)
        
        try:
            if self.sentiment_pipeline:
                # 使用transformers pipeline进行情感分析
                result = self.sentiment_pipeline(text)
                
                if isinstance(result, list) and len(result) > 0:
                    prediction = result[0]
                    
                    # 标准化情感标签
                    label_mapping = {
                        'POSITIVE': 'positive',
                        'NEGATIVE': 'negative', 
                        'NEUTRAL': 'neutral',
                        'POS': 'positive',
                        'NEG': 'negative'
                    }
                    
                    raw_label = prediction.get('label', 'NEUTRAL').upper()
                    dominant_emotion = label_mapping.get(raw_label, 'neutral')
                    confidence = prediction.get('score', 0.8)
                    
                    return {
                        'dominant_emotion': dominant_emotion,
                        'confidence': confidence,
                        'raw_prediction': prediction,
                        'analysis_method': 'modern_bert',
                        'timestamp': datetime.utcnow().isoformat()
                    }
            
            # 如果BERT模型不可用，使用后备方案
            return self._fallback_emotion_analysis(text)
            
        except Exception as e:
            logger.error(f"现代化BERT情感分析失败: {e}")
            return self._fallback_emotion_analysis(text)
    
    def classify_problem_type(self, text: str) -> Dict[str, Any]:
        """
        使用现代化BERT进行问题类型分类
        """
        if not text.strip():
            return self._fallback_classification(text)
        
        try:
            if self.classification_pipeline:
                # 定义心理咨询相关的候选标签
                candidate_labels = [
                    "学习压力", "人际关系", "情感问题", "家庭矛盾", 
                    "职业发展", "身体健康", "心理健康", "生活方式"
                ]
                
                result = self.classification_pipeline(text, candidate_labels)
                
                if result and 'labels' in result and 'scores' in result:
                    top_label = result['labels'][0]
                    confidence = result['scores'][0]
                    
                    # 映射到标准问题类型
                    problem_type_mapping = {
                        '学习压力': 'academic_pressure',
                        '人际关系': 'social_anxiety',
                        '情感问题': 'emotional_issues',
                        '家庭矛盾': 'family_issues',
                        '职业发展': 'career_anxiety',
                        '身体健康': 'physical_health',
                        '心理健康': 'mental_health',
                        '生活方式': 'lifestyle'
                    }
                    
                    problem_type = problem_type_mapping.get(top_label, 'general')
                    
                    return {
                        'problem_type': problem_type,
                        'raw_category': top_label,
                        'confidence': confidence,
                        'all_predictions': dict(zip(result['labels'], result['scores'])),
                        'analysis_method': 'modern_bert',
                        'timestamp': datetime.utcnow().isoformat()
                    }
            
            # 如果BERT模型不可用，使用后备方案
            return self._fallback_classification(text)
            
        except Exception as e:
            logger.error(f"现代化BERT问题分类失败: {e}")
            return self._fallback_classification(text)
    
    def extract_entities(self, text: str) -> Dict[str, Any]:
        """
        使用jieba和规则进行简单的实体识别
        """
        try:
            # 使用jieba进行分词
            words = list(jieba.cut(text))
            
            # 简单的实体识别规则
            entities = {
                'persons': [],
                'organizations': [],
                'locations': [],
                'positions': [],
                'emotions': [],
                'relationships': []
            }
            
            # 识别常见的人名模式
            person_pattern = re.compile(r'[张王李赵刘陈杨黄周吴徐孙马朱胡郭何高林罗郑梁谢宋唐许韩冯邓曹彭曾肖田董袁潘于蒋蔡余杜叶程魏薛阎余万顾孟平]\w{1,2}')
            persons = person_pattern.findall(text)
            entities['persons'] = list(set(persons))
            
            # 识别学校和组织
            org_keywords = ['大学', '学院', '公司', '学校', '医院', '银行']
            for word in words:
                for keyword in org_keywords:
                    if keyword in word and len(word) > 2:
                        entities['organizations'].append(word)
            
            # 识别地点
            location_keywords = ['市', '省', '县', '区', '路', '街', '村']
            for word in words:
                for keyword in location_keywords:
                    if keyword in word and len(word) > 2:
                        entities['locations'].append(word)
            
            # 识别情感词
            emotion_words = ['开心', '难过', '焦虑', '紧张', '愤怒', '害怕', '担心', '兴奋', '沮丧', '绝望']
            for word in words:
                if word in emotion_words:
                    entities['emotions'].append(word)
            
            # 识别关系词
            relationship_words = ['朋友', '同学', '老师', '父母', '家人', '室友', '同事', '恋人', '伴侣']
            for word in words:
                if word in relationship_words:
                    entities['relationships'].append(word)
            
            # 去重
            for key in entities:
                entities[key] = list(set(entities[key]))
            
            return {
                'entities': entities,
                'raw_words': words,
                'analysis_method': 'jieba_rules',
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"实体识别失败: {e}")
            return self._fallback_ner(text)
    
    def calculate_text_similarity(self, text1: str, text2: str) -> Dict[str, Any]:
        """
        计算文本相似度 - 使用词向量或词汇重叠
        """
        try:
            # 使用jieba分词
            words1 = set(jieba.cut(text1))
            words2 = set(jieba.cut(text2))
            
            # 计算Jaccard相似度
            intersection = words1.intersection(words2)
            union = words1.union(words2)
            
            if len(union) == 0:
                jaccard_similarity = 0.0
            else:
                jaccard_similarity = len(intersection) / len(union)
            
            # 计算余弦相似度（基于词频）
            all_words = list(union)
            vec1 = [1 if word in words1 else 0 for word in all_words]
            vec2 = [1 if word in words2 else 0 for word in all_words]
            
            dot_product = sum(a * b for a, b in zip(vec1, vec2))
            magnitude1 = sum(a * a for a in vec1) ** 0.5
            magnitude2 = sum(b * b for b in vec2) ** 0.5
            
            if magnitude1 == 0 or magnitude2 == 0:
                cosine_similarity = 0.0
            else:
                cosine_similarity = dot_product / (magnitude1 * magnitude2)
            
            # 综合相似度
            combined_similarity = (jaccard_similarity + cosine_similarity) / 2
            
            return {
                'similarity_score': combined_similarity,
                'jaccard_similarity': jaccard_similarity,
                'cosine_similarity': cosine_similarity,
                'is_similar': combined_similarity > 0.5,
                'common_words': list(intersection),
                'analysis_method': 'jieba_similarity',
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"现代化文本相似度计算失败: {e}")
            return self._fallback_similarity(text1, text2)
    
    def comprehensive_analysis(self, text: str) -> Dict[str, Any]:
        """
        综合文本分析
        """
        results = {
            'text': text,
            'timestamp': datetime.utcnow().isoformat(),
            'analysis_method': 'modern_bert_comprehensive'
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
        high_risk_types = ['mental_health', 'emotional_issues']
        if classification.get('problem_type') in high_risk_types:
            risk_score += 2
            risk_factors.append('高风险问题类型')
        
        # 基于实体识别的风险
        emotion_entities = entities.get('entities', {}).get('emotions', [])
        negative_emotions = ['难过', '焦虑', '绝望', '沮丧', '害怕']
        for emotion_word in emotion_entities:
            if emotion_word in negative_emotions:
                risk_score += 1
                risk_factors.append(f'负面情绪词: {emotion_word}')
        
        # 基于危险关键词的风险
        danger_keywords = ['自杀', '死亡', '伤害', '绝望', '痛苦', '不想活']
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
        negative_words = ['难过', '痛苦', '绝望', '焦虑', '害怕', '愤怒', '沮丧', '悲伤']
        positive_words = ['开心', '快乐', '高兴', '满足', '喜欢', '兴奋', '愉快']
        
        negative_count = sum(1 for word in negative_words if word in text)
        positive_count = sum(1 for word in positive_words if word in text)
        
        if negative_count > positive_count:
            emotion = 'negative'
            confidence = min(0.8, 0.5 + negative_count * 0.1)
        elif positive_count > negative_count:
            emotion = 'positive'
            confidence = min(0.8, 0.5 + positive_count * 0.1)
        else:
            emotion = 'neutral'
            confidence = 0.6
        
        return {
            'dominant_emotion': emotion,
            'confidence': confidence,
            'analysis_method': 'keyword_fallback',
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def _fallback_classification(self, text: str) -> Dict[str, Any]:
        """后备分类方法"""
        keywords_mapping = {
            'academic_pressure': ['学习', '考试', '成绩', '作业', '压力', '学校'],
            'social_anxiety': ['朋友', '社交', '人际关系', '孤独', '交流'],
            'family_issues': ['家庭', '父母', '家人', '亲情', '家里'],
            'emotional_issues': ['感情', '爱情', '分手', '恋爱', '情感'],
            'mental_health': ['抑郁', '焦虑', '心理', '精神', '情绪']
        }
        
        scores = {}
        for problem_type, keywords in keywords_mapping.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                scores[problem_type] = score / len(keywords)
        
        if scores:
            best_type = max(scores, key=scores.get)
            confidence = scores[best_type]
        else:
            best_type = 'general'
            confidence = 0.3
        
        return {
            'problem_type': best_type,
            'confidence': confidence,
            'all_scores': scores,
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
        return {
            'available': self.available,
            'models_loaded': self.models_loaded,
            'device': self.device,
            'models_status': {
                'sentiment_pipeline': self.sentiment_pipeline is not None,
                'classification_pipeline': self.classification_pipeline is not None
            },
            'supported_features': [
                'emotion_analysis',
                'problem_classification', 
                'entity_extraction',
                'text_similarity',
                'comprehensive_analysis'
            ]
        }


# 创建全局实例
modern_bert_analyzer = ModernBertAnalyzer()

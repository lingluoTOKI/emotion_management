"""
匿名咨询安全干预服务
Anonymous Consultation Safety Intervention Service
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import hashlib
import json
import asyncio
from dataclasses import dataclass
from sqlalchemy.orm import Session
from loguru import logger
import requests
from cryptography.fernet import Fernet

from app.core.config import settings
from app.core.exceptions import RiskAssessmentError, BusinessLogicError
from app.models.anonymous import AnonymousMessage
from app.models.user import Student


@dataclass
class SafetyRiskLevel:
    """安全风险等级"""
    level: str              # 风险等级: minimal/low/moderate/high/critical
    confidence: float       # 置信度 (0-1)
    risk_factors: List[str] # 风险因素
    intervention_required: bool  # 是否需要干预
    urgency_score: int      # 紧急程度 (1-10)


@dataclass
class LocationData:
    """位置数据"""
    latitude: float
    longitude: float
    accuracy: float
    timestamp: datetime
    address: str
    emergency_contacts: List[str]


@dataclass
class InterventionAction:
    """干预行动"""
    action_type: str        # 行动类型
    description: str        # 描述
    priority: int          # 优先级
    responsible_party: str  # 负责方
    timeline: str          # 时间线
    contact_info: Dict[str, str]  # 联系信息


class AnonymousSafetyService:
    """匿名咨询安全干预服务类"""
    
    def __init__(self, db: Session):
        self.db = db
        
        # 加密密钥用于保护敏感信息
        self.encryption_key = Fernet.generate_key()
        self.cipher_suite = Fernet(self.encryption_key)
        
        # 风险关键词配置
        self.risk_keywords = {
            'critical': {
                'self_harm': ['自杀', '自残', '死', '结束生命', '割腕', '跳楼', '上吊'],
                'violence': ['杀', '伤害他人', '暴力', '报复'],
                'substance': ['吸毒', '过量服药', '酗酒']
            },
            'high': {
                'despair': ['绝望', '没有希望', '看不到未来', '无意义'],
                'isolation': ['没人理解', '完全孤独', '被抛弃', '无助'],
                'planning': ['计划', '准备', '方法', '时间']
            },
            'moderate': {
                'depression': ['抑郁', '难过', '痛苦', '沮丧'],
                'anxiety': ['焦虑', '恐惧', '担心', '紧张'],
                'stress': ['压力大', '承受不了', '崩溃']
            }
        }
        
        # 紧急联系人配置
        self.emergency_contacts = {
            'crisis_hotline': '400-161-9995',  # 全国心理危机干预热线
            'emergency_services': '120',       # 急救服务
            'campus_security': settings.CAMPUS_SECURITY_NUMBER if hasattr(settings, 'CAMPUS_SECURITY_NUMBER') else '110',
            'counseling_center': settings.COUNSELING_CENTER_NUMBER if hasattr(settings, 'COUNSELING_CENTER_NUMBER') else '400-161-9995'
        }
    
    async def analyze_message_risk(
        self,
        message_content: str,
        user_session_token: str,
        context: Dict[str, Any] = None
    ) -> SafetyRiskLevel:
        """
        分析匿名消息的安全风险
        
        Args:
            message_content: 消息内容
            user_session_token: 用户会话令牌（用于关联但不暴露身份）
            context: 上下文信息（历史消息、时间等）
            
        Returns:
            SafetyRiskLevel: 风险评估结果
        """
        
        try:
            logger.info(f"开始分析匿名消息安全风险")
            
            # 1. 关键词风险检测
            keyword_risk = self._analyze_keyword_risk(message_content)
            
            # 2. 语义风险分析
            semantic_risk = await self._analyze_semantic_risk(message_content)
            
            # 3. 历史行为模式分析
            behavioral_risk = await self._analyze_behavioral_pattern(
                user_session_token, context
            )
            
            # 4. 时间模式风险分析
            temporal_risk = self._analyze_temporal_pattern(context)
            
            # 5. 综合风险评估
            overall_risk = self._calculate_overall_risk(
                keyword_risk, semantic_risk, behavioral_risk, temporal_risk
            )
            
            # 6. 生成风险等级
            risk_level = self._determine_risk_level(overall_risk)
            
            # 7. 记录风险评估日志（不包含敏感信息）
            await self._log_risk_assessment(user_session_token, risk_level)
            
            logger.info(f"风险分析完成，等级: {risk_level.level}")
            return risk_level
            
        except Exception as e:
            logger.error(f"风险分析失败: {str(e)}")
            # 出错时返回高风险，确保安全
            return SafetyRiskLevel(
                level="high",
                confidence=0.5,
                risk_factors=["analysis_error"],
                intervention_required=True,
                urgency_score=7
            )
    
    async def trigger_safety_intervention(
        self,
        risk_level: SafetyRiskLevel,
        user_session_token: str,
        message_content: str = None
    ) -> List[InterventionAction]:
        """
        触发安全干预机制
        
        Args:
            risk_level: 风险等级
            user_session_token: 用户会话令牌
            message_content: 消息内容（可选，用于上下文）
            
        Returns:
            List[InterventionAction]: 执行的干预行动列表
        """
        
        if not risk_level.intervention_required:
            return []
        
        try:
            logger.warning(f"触发安全干预，风险等级: {risk_level.level}")
            
            actions = []
            
            # 1. 获取用户位置信息（仅在高风险时）
            location_data = None
            if risk_level.level in ['high', 'critical']:
                location_data = await self._attempt_location_acquisition(user_session_token)
            
            # 2. 根据风险等级执行不同干预措施
            if risk_level.level == 'critical':
                actions.extend(await self._execute_critical_intervention(
                    user_session_token, location_data, risk_level
                ))
            elif risk_level.level == 'high':
                actions.extend(await self._execute_high_risk_intervention(
                    user_session_token, location_data, risk_level
                ))
            elif risk_level.level == 'moderate':
                actions.extend(await self._execute_moderate_risk_intervention(
                    user_session_token, risk_level
                ))
            
            # 3. 记录干预行动
            await self._log_intervention_actions(user_session_token, actions)
            
            # 4. 通知相关人员
            await self._notify_responsible_parties(actions, risk_level)
            
            logger.info(f"安全干预完成，执行了 {len(actions)} 个行动")
            return actions
            
        except Exception as e:
            logger.error(f"安全干预执行失败: {str(e)}")
            # 确保至少执行基础干预
            return await self._execute_fallback_intervention(user_session_token)
    
    def _analyze_keyword_risk(self, message_content: str) -> Dict[str, Any]:
        """关键词风险分析"""
        
        content_lower = message_content.lower()
        detected_risks = {}
        
        for risk_level, categories in self.risk_keywords.items():
            detected_risks[risk_level] = {}
            
            for category, keywords in categories.items():
                matches = [kw for kw in keywords if kw in content_lower]
                if matches:
                    detected_risks[risk_level][category] = matches
        
        # 计算风险分数
        risk_score = 0
        if detected_risks.get('critical'):
            risk_score += 10
        if detected_risks.get('high'):
            risk_score += 7
        if detected_risks.get('moderate'):
            risk_score += 4
        
        return {
            'score': min(10, risk_score),
            'detected_risks': detected_risks,
            'confidence': 0.8 if detected_risks else 0.3
        }
    
    async def _analyze_semantic_risk(self, message_content: str) -> Dict[str, Any]:
        """语义风险分析"""
        
        try:
            # 使用AI模型进行深度语义分析
            analysis_prompt = f"""
请分析以下文本的心理健康风险，返回JSON格式：
{{
    "risk_indicators": ["具体的风险指标"],
    "emotional_state": "情绪状态描述",
    "urgency_level": "紧急程度(1-10)",
    "intervention_needed": "是否需要干预(true/false)",
    "risk_factors": ["风险因素列表"],
    "protective_factors": ["保护因素列表"]
}}

文本内容：{message_content}
"""

            # 这里应该调用专业的心理健康风险评估模型
            # 临时使用基础分析
            semantic_analysis = await self._basic_semantic_analysis(message_content)
            
            return semantic_analysis
            
        except Exception as e:
            logger.error(f"语义分析失败: {str(e)}")
            return {'score': 5, 'confidence': 0.3}
    
    async def _analyze_behavioral_pattern(
        self,
        user_session_token: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """行为模式分析"""
        
        # 分析用户的历史消息模式
        historical_messages = context.get('historical_messages', [])
        
        if not historical_messages:
            return {'score': 0, 'confidence': 0.2}
        
        # 分析模式
        patterns = {
            'message_frequency': len(historical_messages),
            'avg_message_length': sum(len(msg.get('content', '')) for msg in historical_messages) / len(historical_messages),
            'time_intervals': self._calculate_time_intervals(historical_messages),
            'escalation_trend': self._detect_escalation_trend(historical_messages)
        }
        
        # 计算行为风险分数
        risk_score = 0
        
        # 频繁求助
        if patterns['message_frequency'] > 10:
            risk_score += 2
        
        # 消息长度异常
        if patterns['avg_message_length'] > 500 or patterns['avg_message_length'] < 10:
            risk_score += 1
        
        # 检测到恶化趋势
        if patterns['escalation_trend']:
            risk_score += 3
        
        return {
            'score': min(10, risk_score),
            'patterns': patterns,
            'confidence': 0.6
        }
    
    def _analyze_temporal_pattern(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """时间模式风险分析"""
        
        current_time = datetime.now()
        hour = current_time.hour
        day_of_week = current_time.weekday()
        
        risk_score = 0
        
        # 深夜时间（凌晨1-5点）风险较高
        if 1 <= hour <= 5:
            risk_score += 2
        
        # 周末深夜风险更高
        if day_of_week >= 5 and (hour >= 23 or hour <= 5):
            risk_score += 1
        
        return {
            'score': risk_score,
            'time_factors': {
                'hour': hour,
                'day_of_week': day_of_week,
                'is_weekend': day_of_week >= 5,
                'is_late_night': hour >= 23 or hour <= 5
            },
            'confidence': 0.4
        }
    
    def _calculate_overall_risk(
        self,
        keyword_risk: Dict[str, Any],
        semantic_risk: Dict[str, Any],
        behavioral_risk: Dict[str, Any],
        temporal_risk: Dict[str, Any]
    ) -> Dict[str, Any]:
        """计算综合风险"""
        
        # 权重配置
        weights = {
            'keyword': 0.4,
            'semantic': 0.3,
            'behavioral': 0.2,
            'temporal': 0.1
        }
        
        # 计算加权平均风险分数
        total_score = (
            keyword_risk['score'] * weights['keyword'] +
            semantic_risk['score'] * weights['semantic'] +
            behavioral_risk['score'] * weights['behavioral'] +
            temporal_risk['score'] * weights['temporal']
        )
        
        # 计算综合置信度
        total_confidence = (
            keyword_risk['confidence'] * weights['keyword'] +
            semantic_risk['confidence'] * weights['semantic'] +
            behavioral_risk['confidence'] * weights['behavioral'] +
            temporal_risk['confidence'] * weights['temporal']
        )
        
        return {
            'total_score': total_score,
            'confidence': total_confidence,
            'component_scores': {
                'keyword': keyword_risk['score'],
                'semantic': semantic_risk['score'],
                'behavioral': behavioral_risk['score'],
                'temporal': temporal_risk['score']
            }
        }
    
    def _determine_risk_level(self, overall_risk: Dict[str, Any]) -> SafetyRiskLevel:
        """确定风险等级"""
        
        score = overall_risk['total_score']
        confidence = overall_risk['confidence']
        
        # 根据分数确定等级
        if score >= 8:
            level = "critical"
            intervention_required = True
            urgency_score = 10
        elif score >= 6:
            level = "high"
            intervention_required = True
            urgency_score = 8
        elif score >= 4:
            level = "moderate"
            intervention_required = True
            urgency_score = 5
        elif score >= 2:
            level = "low"
            intervention_required = False
            urgency_score = 3
        else:
            level = "minimal"
            intervention_required = False
            urgency_score = 1
        
        # 提取风险因素
        risk_factors = []
        component_scores = overall_risk.get('component_scores', {})
        
        if component_scores.get('keyword', 0) >= 7:
            risk_factors.append("high_risk_keywords_detected")
        if component_scores.get('semantic', 0) >= 6:
            risk_factors.append("concerning_emotional_state")
        if component_scores.get('behavioral', 0) >= 5:
            risk_factors.append("escalating_behavior_pattern")
        if component_scores.get('temporal', 0) >= 2:
            risk_factors.append("high_risk_timing")
        
        return SafetyRiskLevel(
            level=level,
            confidence=confidence,
            risk_factors=risk_factors,
            intervention_required=intervention_required,
            urgency_score=urgency_score
        )
    
    async def _attempt_location_acquisition(self, user_session_token: str) -> Optional[LocationData]:
        """尝试获取用户位置（仅在紧急情况下）"""
        
        try:
            logger.info("尝试获取用户位置信息用于紧急干预")
            
            # 这里应该实现安全的位置获取机制
            # 1. 通过IP地址获取大概位置
            # 2. 如果用户之前授权过位置服务，使用精确位置
            # 3. 通过学校网络定位到具体区域
            
            # 临时实现：返回校园默认位置
            campus_location = LocationData(
                latitude=39.9042,   # 示例坐标
                longitude=116.4074,
                accuracy=1000.0,    # 1公里精度
                timestamp=datetime.now(),
                address="校园区域",
                emergency_contacts=list(self.emergency_contacts.values())
            )
            
            # 加密存储位置信息
            encrypted_location = self._encrypt_sensitive_data({
                'session_token': user_session_token,
                'location': campus_location.__dict__,
                'purpose': 'emergency_intervention',
                'timestamp': datetime.now().isoformat()
            })
            
            # 临时存储（用于紧急情况下的快速访问）
            await self._store_emergency_location(user_session_token, encrypted_location)
            
            return campus_location
            
        except Exception as e:
            logger.error(f"位置获取失败: {str(e)}")
            return None
    
    async def _execute_critical_intervention(
        self,
        user_session_token: str,
        location_data: Optional[LocationData],
        risk_level: SafetyRiskLevel
    ) -> List[InterventionAction]:
        """执行危急情况干预"""
        
        actions = []
        
        # 1. 立即通知紧急服务
        actions.append(InterventionAction(
            action_type="emergency_notification",
            description="立即通知校园安全部门和心理危机干预团队",
            priority=1,
            responsible_party="crisis_intervention_team",
            timeline="立即执行",
            contact_info=self.emergency_contacts
        ))
        
        # 2. 向用户发送紧急支持信息
        actions.append(InterventionAction(
            action_type="immediate_support",
            description="向用户提供即时的心理支持和专业帮助联系方式",
            priority=1,
            responsible_party="system",
            timeline="立即执行",
            contact_info={"crisis_hotline": self.emergency_contacts['crisis_hotline']}
        ))
        
        # 3. 如果有位置信息，通知现场救援
        if location_data:
            actions.append(InterventionAction(
                action_type="location_based_response",
                description=f"根据位置信息{location_data.address}派遣现场支援",
                priority=1,
                responsible_party="campus_security",
                timeline="15分钟内",
                contact_info={"security": self.emergency_contacts['campus_security']}
            ))
        
        # 4. 启动危机跟踪协议
        actions.append(InterventionAction(
            action_type="crisis_tracking",
            description="启动24小时危机跟踪和支持协议",
            priority=2,
            responsible_party="counseling_center",
            timeline="持续24小时",
            contact_info={"center": self.emergency_contacts['counseling_center']}
        ))
        
        return actions
    
    async def _execute_high_risk_intervention(
        self,
        user_session_token: str,
        location_data: Optional[LocationData],
        risk_level: SafetyRiskLevel
    ) -> List[InterventionAction]:
        """执行高风险干预"""
        
        actions = []
        
        # 1. 通知心理咨询中心
        actions.append(InterventionAction(
            action_type="counseling_alert",
            description="通知心理咨询中心，安排紧急咨询师对接",
            priority=1,
            responsible_party="counseling_center",
            timeline="1小时内",
            contact_info={"center": self.emergency_contacts['counseling_center']}
        ))
        
        # 2. 发送专业支持资源
        actions.append(InterventionAction(
            action_type="resource_provision",
            description="向用户提供专业心理健康资源和自助工具",
            priority=2,
            responsible_party="system",
            timeline="立即执行",
            contact_info={"hotline": self.emergency_contacts['crisis_hotline']}
        ))
        
        # 3. 安排follow-up
        actions.append(InterventionAction(
            action_type="follow_up_scheduling",
            description="安排24小时内的专业follow-up咨询",
            priority=2,
            responsible_party="counseling_center",
            timeline="24小时内",
            contact_info={"center": self.emergency_contacts['counseling_center']}
        ))
        
        return actions
    
    async def _execute_moderate_risk_intervention(
        self,
        user_session_token: str,
        risk_level: SafetyRiskLevel
    ) -> List[InterventionAction]:
        """执行中等风险干预"""
        
        actions = []
        
        # 1. 提供心理健康资源
        actions.append(InterventionAction(
            action_type="resource_sharing",
            description="分享心理健康自助资源和专业联系方式",
            priority=3,
            responsible_party="system",
            timeline="立即执行",
            contact_info={"hotline": self.emergency_contacts['crisis_hotline']}
        ))
        
        # 2. 建议寻求专业帮助
        actions.append(InterventionAction(
            action_type="professional_referral",
            description="建议用户寻求专业心理咨询，提供预约方式",
            priority=3,
            responsible_party="system",
            timeline="48小时内",
            contact_info={"center": self.emergency_contacts['counseling_center']}
        ))
        
        return actions
    
    def _encrypt_sensitive_data(self, data: Dict[str, Any]) -> bytes:
        """加密敏感数据"""
        json_data = json.dumps(data, default=str)
        return self.cipher_suite.encrypt(json_data.encode())
    
    def _decrypt_sensitive_data(self, encrypted_data: bytes) -> Dict[str, Any]:
        """解密敏感数据"""
        decrypted_data = self.cipher_suite.decrypt(encrypted_data)
        return json.loads(decrypted_data.decode())
    
    async def _store_emergency_location(self, session_token: str, encrypted_data: bytes):
        """存储紧急位置信息（临时）"""
        # 这里应该实现安全的临时存储机制
        # 数据应该在一定时间后自动删除
        pass
    
    async def _log_risk_assessment(self, session_token: str, risk_level: SafetyRiskLevel):
        """记录风险评估日志"""
        # 记录风险评估结果，但不包含可识别的个人信息
        pass
    
    async def _log_intervention_actions(self, session_token: str, actions: List[InterventionAction]):
        """记录干预行动日志"""
        # 记录执行的干预行动，用于效果评估和改进
        pass
    
    async def _notify_responsible_parties(self, actions: List[InterventionAction], risk_level: SafetyRiskLevel):
        """通知相关负责方"""
        # 实现向相关人员发送通知的逻辑
        pass
    
    async def _execute_fallback_intervention(self, session_token: str) -> List[InterventionAction]:
        """执行备用干预措施"""
        return [
            InterventionAction(
                action_type="basic_support",
                description="提供基础心理支持信息",
                priority=5,
                responsible_party="system",
                timeline="立即执行",
                contact_info={"hotline": self.emergency_contacts['crisis_hotline']}
            )
        ]
    
    # 辅助方法
    async def _basic_semantic_analysis(self, text: str) -> Dict[str, Any]:
        """基础语义分析"""
        # 简化的语义分析实现
        return {'score': 5, 'confidence': 0.5}
    
    def _calculate_time_intervals(self, messages: List[Dict]) -> List[float]:
        """计算消息时间间隔"""
        # 计算消息之间的时间间隔
        return [1.0]  # 临时实现
    
    def _detect_escalation_trend(self, messages: List[Dict]) -> bool:
        """检测情况恶化趋势"""
        # 分析消息内容的恶化趋势
        return False  # 临时实现

"""
风险评估服务模块
Risk Assessment Service Module
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
import openai
from loguru import logger
from app.core.config import settings
from app.core.exceptions import RiskAssessmentError

class RiskAssessmentService:
    """风险评估服务类"""
    
    def __init__(self):
        self.risk_records = {}
    
    async def assess_risk(self, student_id: int, assessment_data: Dict[str, Any]) -> Dict[str, Any]:
        """综合风险评估"""
        # 文本风险评估
        text_risk = await self._assess_text_risk(assessment_data.get("text_content", ""))
        
        # 语音风险评估
        voice_risk = await self._assess_voice_risk(assessment_data.get("voice_data"))
        
        # 行为风险评估
        behavior_risk = await self._assess_behavior_risk(assessment_data.get("behavior_patterns", []))
        
        # 历史风险评估
        history_risk = await self._assess_history_risk(student_id)
        
        # 综合风险计算
        overall_risk = self._calculate_overall_risk([
            text_risk, voice_risk, behavior_risk, history_risk
        ])
        
        # 生成风险评估报告
        risk_report = await self._generate_risk_report(
            student_id, overall_risk, {
                "text_risk": text_risk,
                "voice_risk": voice_risk,
                "behavior_risk": behavior_risk,
                "history_risk": history_risk
            }
        )
        
        # 记录风险评估
        self._record_risk_assessment(student_id, overall_risk, risk_report)
        
        return {
            "risk_level": overall_risk["level"],
            "risk_score": overall_risk["score"],
            "risk_factors": overall_risk["factors"],
            "recommendations": overall_risk["recommendations"],
            "risk_report": risk_report,
            "assessment_timestamp": datetime.utcnow()
        }
    
    async def _assess_text_risk(self, text_content: str) -> Dict[str, Any]:
        """文本风险评估"""
        if not text_content:
            return {"level": "minimal", "score": 0.0, "factors": []}
        
        text_lower = text_content.lower()
        risk_score = 0.0
        risk_factors = []
        
        # 高风险关键词
        high_risk_keywords = [
            "自杀", "死亡", "不想活", "结束生命", "结束一切",
            "伤害自己", "自残", "割腕", "上吊", "跳楼",
            "没有意义", "活着没意思", "解脱"
        ]
        
        # 中风险关键词
        medium_risk_keywords = [
            "绝望", "痛苦", "没有希望", "看不到未来",
            "没人理解", "孤独", "被抛弃", "想消失",
            "压力太大", "承受不了", "崩溃"
        ]
        
        # 低风险关键词
        low_risk_keywords = [
            "难过", "伤心", "沮丧", "失落", "焦虑",
            "担心", "害怕", "紧张", "不安", "烦躁"
        ]
        
        # 检查高风险关键词
        for keyword in high_risk_keywords:
            if keyword in text_lower:
                risk_score += 0.4
                risk_factors.append(f"高风险关键词: {keyword}")
        
        # 检查中风险关键词
        for keyword in medium_risk_keywords:
            if keyword in text_lower:
                risk_score += 0.2
                risk_factors.append(f"中风险关键词: {keyword}")
        
        # 检查低风险关键词
        for keyword in low_risk_keywords:
            if keyword in text_lower:
                risk_score += 0.1
                risk_factors.append(f"低风险关键词: {keyword}")
        
        # 文本长度和复杂度分析
        if len(text_content) > 1000:
            risk_score += 0.1  # 长文本可能表示深度困扰
            risk_factors.append("文本内容较长，可能存在深度困扰")
        
        # 确定风险等级
        if risk_score >= 0.8:
            level = "high"
        elif risk_score >= 0.5:
            level = "medium"
        elif risk_score >= 0.2:
            level = "low"
        else:
            level = "minimal"
        
        return {
            "level": level,
            "score": min(risk_score, 1.0),
            "factors": risk_factors
        }
    
    async def _assess_voice_risk(self, voice_data: Optional[bytes]) -> Dict[str, Any]:
        """语音风险评估"""
        if not voice_data:
            return {"level": "minimal", "score": 0.0, "factors": []}
        
        # 模拟语音风险评估，实际应该使用语音分析模型
        # 这里返回基础风险评估
        return {
            "level": "minimal",
            "score": 0.1,
            "factors": ["语音内容需要进一步分析"]
        }
    
    async def _assess_behavior_risk(self, behavior_patterns: List[Dict[str, Any]]) -> Dict[str, Any]:
        """行为风险评估"""
        if not behavior_patterns:
            return {"level": "minimal", "score": 0.0, "factors": []}
        
        risk_score = 0.0
        risk_factors = []
        
        for behavior in behavior_patterns:
            behavior_type = behavior.get("type", "")
            frequency = behavior.get("frequency", 0)
            severity = behavior.get("severity", 0)
            
            # 根据行为类型和频率计算风险
            if behavior_type == "isolation":
                risk_score += min(frequency * 0.1, 0.3)
                if frequency > 5:
                    risk_factors.append("社交隔离行为频繁")
            
            elif behavior_type == "sleep_disturbance":
                risk_score += min(frequency * 0.08, 0.25)
                if frequency > 3:
                    risk_factors.append("睡眠问题持续存在")
            
            elif behavior_type == "appetite_change":
                risk_score += min(frequency * 0.06, 0.2)
                if frequency > 3:
                    risk_factors.append("食欲变化明显")
            
            elif behavior_type == "self_harm":
                risk_score += min(severity * 0.3, 0.8)
                risk_factors.append("存在自伤行为")
        
        # 确定风险等级
        if risk_score >= 0.6:
            level = "high"
        elif risk_score >= 0.3:
            level = "medium"
        elif risk_score >= 0.1:
            level = "low"
        else:
            level = "minimal"
        
        return {
            "level": level,
            "score": min(risk_score, 1.0),
            "factors": risk_factors
        }
    
    async def _assess_history_risk(self, student_id: int) -> Dict[str, Any]:
        """历史风险评估"""
        # 模拟历史风险评估，实际应该查询数据库
        # 这里返回基础风险评估
        return {
            "level": "minimal",
            "score": 0.1,
            "factors": ["需要查看历史记录进行完整评估"]
        }
    
    def _calculate_overall_risk(self, risk_assessments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """计算综合风险"""
        # 权重分配
        weights = {
            "text_risk": 0.4,
            "voice_risk": 0.2,
            "behavior_risk": 0.25,
            "history_risk": 0.15
        }
        
        # 计算加权平均分
        total_score = 0.0
        total_weight = 0.0
        all_factors = []
        
        for i, (risk_type, weight) in enumerate(weights.items()):
            if i < len(risk_assessments):
                risk_assessment = risk_assessments[i]
                total_score += risk_assessment["score"] * weight
                total_weight += weight
                all_factors.extend(risk_assessment["factors"])
        
        overall_score = total_score / total_weight if total_weight > 0 else 0.0
        
        # 确定综合风险等级
        if overall_score >= 0.7:
            level = "high"
            recommendations = self._get_high_risk_recommendations()
        elif overall_score >= 0.4:
            level = "medium"
            recommendations = self._get_medium_risk_recommendations()
        elif overall_score >= 0.2:
            level = "low"
            recommendations = self._get_low_risk_recommendations()
        else:
            level = "minimal"
            recommendations = self._get_minimal_risk_recommendations()
        
        return {
            "level": level,
            "score": overall_score,
            "factors": all_factors,
            "recommendations": recommendations
        }
    
    def _get_high_risk_recommendations(self) -> List[str]:
        """高风险建议"""
        return [
            "立即寻求专业心理危机干预",
            "联系家人朋友获得支持",
            "避免独处",
            "前往医院急诊科",
            "拨打心理危机干预热线"
        ]
    
    def _get_medium_risk_recommendations(self) -> List[str]:
        """中风险建议"""
        return [
            "寻求专业心理咨询",
            "与信任的人分享感受",
            "保持规律作息",
            "学习情绪管理技巧",
            "定期进行风险评估"
        ]
    
    def _get_low_risk_recommendations(self) -> List[str]:
        """低风险建议"""
        return [
            "继续关注情绪变化",
            "学习压力管理技巧",
            "保持积极的生活方式",
            "定期进行心理健康检查"
        ]
    
    def _get_minimal_risk_recommendations(self) -> List[str]:
        """最小风险建议"""
        return [
            "继续保持当前状态",
            "定期关注心理健康",
            "学习心理健康知识"
        ]
    
    async def _generate_risk_report(self, student_id: int, overall_risk: Dict[str, Any], 
                                  detailed_risks: Dict[str, Any]) -> Dict[str, Any]:
        """生成风险评估报告"""
        report = {
            "student_id": student_id,
            "assessment_date": datetime.utcnow(),
            "overall_risk": overall_risk,
            "detailed_risks": detailed_risks,
            "risk_trend": self._analyze_risk_trend(student_id),
            "intervention_plan": self._generate_intervention_plan(overall_risk["level"]),
            "follow_up_schedule": self._generate_follow_up_schedule(overall_risk["level"])
        }
        
        return report
    
    def _analyze_risk_trend(self, student_id: int) -> Dict[str, Any]:
        """分析风险趋势"""
        # 模拟风险趋势分析，实际应该查询历史数据
        return {
            "trend": "stable",
            "change_rate": 0.0,
            "period": "30天",
            "description": "风险水平相对稳定"
        }
    
    def _generate_intervention_plan(self, risk_level: str) -> Dict[str, Any]:
        """生成干预计划"""
        plans = {
            "high": {
                "immediate_actions": [
                    "24小时内联系学生",
                    "通知家长和辅导员",
                    "安排专业心理评估",
                    "制定安全计划"
                ],
                "short_term_goals": [
                    "确保学生安全",
                    "建立支持网络",
                    "开始专业治疗"
                ],
                "long_term_goals": [
                    "改善心理健康状况",
                    "建立应对机制",
                    "恢复正常生活"
                ]
            },
            "medium": {
                "immediate_actions": [
                    "48小时内联系学生",
                    "评估支持需求",
                    "推荐专业资源"
                ],
                "short_term_goals": [
                    "提供情感支持",
                    "连接专业资源",
                    "监控风险变化"
                ],
                "long_term_goals": [
                    "改善心理健康",
                    "学习应对技能",
                    "建立支持系统"
                ]
            },
            "low": {
                "immediate_actions": [
                    "一周内联系学生",
                    "提供心理健康资源"
                ],
                "short_term_goals": [
                    "预防风险升级",
                    "提供教育支持"
                ],
                "long_term_goals": [
                    "促进心理健康",
                    "建立预防机制"
                ]
            },
            "minimal": {
                "immediate_actions": [
                    "提供心理健康教育"
                ],
                "short_term_goals": [
                    "维持良好状态"
                ],
                "long_term_goals": [
                    "促进持续发展"
                ]
            }
        }
        
        return plans.get(risk_level, plans["minimal"])
    
    def _generate_follow_up_schedule(self, risk_level: str) -> Dict[str, Any]:
        """生成随访计划"""
        schedules = {
            "high": {
                "frequency": "daily",
                "duration": "2周",
                "methods": ["电话", "面对面", "在线"],
                "responsible_person": "专业心理咨询师"
            },
            "medium": {
                "frequency": "weekly",
                "duration": "1个月",
                "methods": ["电话", "在线"],
                "responsible_person": "辅导员"
            },
            "low": {
                "frequency": "biweekly",
                "duration": "2个月",
                "methods": ["在线"],
                "responsible_person": "辅导员"
            },
            "minimal": {
                "frequency": "monthly",
                "duration": "3个月",
                "methods": ["在线"],
                "responsible_person": "系统自动"
            }
        }
        
        return schedules.get(risk_level, schedules["minimal"])
    
    def _record_risk_assessment(self, student_id: int, overall_risk: Dict[str, Any], 
                               risk_report: Dict[str, Any]) -> None:
        """记录风险评估"""
        record = {
            "student_id": student_id,
            "assessment_timestamp": datetime.utcnow(),
            "risk_level": overall_risk["level"],
            "risk_score": overall_risk["score"],
            "risk_factors": overall_risk["factors"],
            "risk_report": risk_report
        }
        
        if student_id not in self.risk_records:
            self.risk_records[student_id] = []
        
        self.risk_records[student_id].append(record)
    
    async def get_risk_history(self, student_id: int) -> List[Dict[str, Any]]:
        """获取风险历史记录"""
        return self.risk_records.get(student_id, [])
    
    async def get_risk_statistics(self) -> Dict[str, Any]:
        """获取风险统计信息"""
        total_assessments = 0
        risk_levels = {"high": 0, "medium": 0, "low": 0, "minimal": 0}
        
        for student_records in self.risk_records.values():
            for record in student_records:
                total_assessments += 1
                risk_level = record.get("risk_level", "minimal")
                risk_levels[risk_level] += 1
        
        return {
            "total_assessments": total_assessments,
            "risk_levels": risk_levels,
            "high_risk_percentage": (risk_levels["high"] / total_assessments * 100) if total_assessments > 0 else 0,
            "medium_risk_percentage": (risk_levels["medium"] / total_assessments * 100) if total_assessments > 0 else 0
        }

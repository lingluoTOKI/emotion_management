"""
咨询师智能匹配服务
Intelligent Counselor Matching Service
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from dataclasses import dataclass
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from loguru import logger

from app.models.user import Counselor, CounselorSchool, Student
from app.models.consultation import Consultation, ConsultationStatus
from app.models.assessment import Assessment
from app.core.exceptions import BusinessLogicError


@dataclass
class MatchingCriteria:
    """匹配条件"""
    gender_preference: Optional[str] = None      # 性别偏好 (male/female/no_preference)
    personality_preference: str = "empathetic"   # 性格偏好 (empathetic/rational/gentle/energetic)
    problem_types: List[str] = None             # 问题类型
    therapy_schools: List[str] = None           # 治疗流派偏好
    counselor_role_preference: Optional[str] = None  # 是否偏好辅导员 (counselor/therapist/no_preference)
    schedule_flexibility: str = "flexible"       # 时间灵活性 (flexible/strict)
    experience_preference: str = "experienced"   # 经验偏好 (junior/experienced/senior)
    communication_style: str = "supportive"     # 沟通风格偏好


@dataclass
class CounselorProfile:
    """咨询师档案"""
    counselor_id: int
    name: str
    gender: str
    therapy_school: str
    specialties: List[str]
    experience_years: int
    personality_traits: List[str]
    communication_style: str
    success_rate: float
    availability_score: float
    student_feedback_avg: float
    is_counselor: bool  # 是否为辅导员
    current_workload: int
    preferred_case_types: List[str]


@dataclass
class MatchingResult:
    """匹配结果"""
    counselor: CounselorProfile
    match_score: float              # 匹配分数 (0-1)
    match_reasons: List[str]        # 匹配理由
    compatibility_breakdown: Dict[str, float]  # 各维度兼容性分解
    estimated_effectiveness: float  # 预估咨询效果
    recommended_session_type: str   # 推荐咨询类型
    scheduling_priority: int        # 排班优先级


class CounselorMatchingService:
    """咨询师智能匹配服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
        # 匹配权重配置
        self.matching_weights = {
            'specialty_match': 0.25,        # 专业匹配度
            'personality_compatibility': 0.20,  # 性格兼容性
            'experience_match': 0.15,       # 经验匹配度
            'availability': 0.15,           # 可用性
            'success_rate': 0.10,           # 成功率
            'workload_balance': 0.10,       # 工作负载平衡
            'preference_alignment': 0.05    # 偏好对齐度
        }
        
        # 问题类型与专业领域映射
        self.problem_specialty_mapping = {
            '抑郁情绪': ['情感障碍', '抑郁症治疗', '认知行为疗法'],
            '焦虑压力': ['焦虑障碍', '压力管理', '放松训练'],
            '人际关系': ['人际关系治疗', '社交技能训练', '家庭治疗'],
            '学业压力': ['学业咨询', '时间管理', '目标设定'],
            '情感问题': ['情感咨询', '恋爱关系', '分离焦虑'],
            '家庭矛盾': ['家庭治疗', '系统治疗', '沟通技巧'],
            '自我认知': ['自我探索', '人格发展', '价值观澄清'],
            '创伤后应激': ['创伤治疗', 'PTSD治疗', '危机干预']
        }
        
        # 治疗流派特点
        self.therapy_school_characteristics = {
            '认知行为疗法': {
                'suitable_problems': ['抑郁情绪', '焦虑压力', '负面思维'],
                'approach': '结构化、目标导向',
                'duration': '短期(8-20次)',
                'focus': '认知重构、行为改变'
            },
            '精神分析': {
                'suitable_problems': ['深层心理冲突', '人格问题', '早期创伤'],
                'approach': '深度分析、洞察导向',
                'duration': '长期(6个月以上)',
                'focus': '无意识探索、人格分析'
            },
            '人本主义': {
                'suitable_problems': ['自我认知', '个人成长', '价值观困惑'],
                'approach': '以人为中心、非指导性',
                'duration': '中期(10-30次)',
                'focus': '自我实现、个人潜能'
            },
            '系统家庭治疗': {
                'suitable_problems': ['家庭矛盾', '人际关系', '沟通问题'],
                'approach': '系统观、关系导向',
                'duration': '中期(10-25次)',
                'focus': '家庭动力、关系改善'
            },
            '格式塔疗法': {
                'suitable_problems': ['情绪表达', '身心整合', '当下体验'],
                'approach': '体验式、整体性',
                'duration': '中期(12-30次)',
                'focus': '觉察提升、情绪整合'
            }
        }
    
    async def find_best_matches(
        self,
        student_id: int,
        criteria: MatchingCriteria,
        num_matches: int = 3
    ) -> List[MatchingResult]:
        """
        为学生找到最佳匹配的咨询师
        
        Args:
            student_id: 学生ID
            criteria: 匹配条件
            num_matches: 返回匹配结果数量
            
        Returns:
            List[MatchingResult]: 按匹配度排序的咨询师列表
        """
        
        try:
            logger.info(f"开始为学生 {student_id} 匹配咨询师")
            
            # 1. 获取学生信息和评估历史
            student_profile = await self._get_student_profile(student_id)
            
            # 2. 获取可用咨询师列表
            available_counselors = await self._get_available_counselors()
            
            # 3. 为每个咨询师计算匹配分数
            matching_results = []
            
            for counselor in available_counselors:
                match_result = await self._calculate_match_score(
                    student_profile, counselor, criteria
                )
                matching_results.append(match_result)
            
            # 4. 排序并返回最佳匹配
            matching_results.sort(key=lambda x: x.match_score, reverse=True)
            
            # 5. 优化排班考虑
            optimized_results = await self._optimize_scheduling(
                matching_results[:num_matches * 2]  # 取更多候选进行优化
            )
            
            logger.info(f"为学生 {student_id} 找到 {len(optimized_results)} 个匹配咨询师")
            return optimized_results[:num_matches]
            
        except Exception as e:
            logger.error(f"咨询师匹配失败: {str(e)}")
            raise BusinessLogicError(f"咨询师匹配失败: {str(e)}")
    
    async def _get_student_profile(self, student_id: int) -> Dict[str, Any]:
        """获取学生档案信息"""
        
        student = self.db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise BusinessLogicError("学生信息不存在")
        
        # 获取最近的评估结果
        recent_assessment = self.db.query(Assessment).filter(
            Assessment.student_id == student_id,
            Assessment.status == "completed"
        ).order_by(Assessment.created_at.desc()).first()
        
        # 获取咨询历史
        consultation_history = self.db.query(Consultation).filter(
            Consultation.student_id == student_id
        ).all()
        
        profile = {
            'student_id': student_id,
            'name': student.name,
            'major': student.major,
            'grade': student.grade,
            'recent_assessment': recent_assessment,
            'consultation_count': len(consultation_history),
            'problem_types': recent_assessment.keywords if recent_assessment else [],
            'risk_level': recent_assessment.risk_level if recent_assessment else 'low',
            'emotional_state': self._extract_emotional_state(recent_assessment),
            'previous_counselors': [c.counselor_id for c in consultation_history],
            'satisfaction_history': [c.student_feedback for c in consultation_history if c.student_feedback is not None]
        }
        
        return profile
    
    async def _get_available_counselors(self) -> List[CounselorProfile]:
        """获取可用咨询师列表"""
        
        counselors = self.db.query(Counselor).filter(
            Counselor.is_available == True
        ).all()
        
        profiles = []
        for counselor in counselors:
            # 计算咨询师统计信息
            stats = await self._calculate_counselor_stats(counselor.id)
            
            profile = CounselorProfile(
                counselor_id=counselor.id,
                name=counselor.name,
                gender=self._extract_gender_from_name(counselor.name),  # 假设方法
                therapy_school=counselor.school.value,
                specialties=self._parse_specialties(counselor.specialties),
                experience_years=counselor.experience_years or 0,
                personality_traits=self._infer_personality_traits(counselor),
                communication_style=self._infer_communication_style(counselor),
                success_rate=stats['success_rate'],
                availability_score=stats['availability_score'],
                student_feedback_avg=stats['feedback_avg'],
                is_counselor=counselor.is_counselor,
                current_workload=stats['current_workload'],
                preferred_case_types=self._infer_preferred_cases(counselor)
            )
            profiles.append(profile)
        
        return profiles
    
    async def _calculate_match_score(
        self,
        student_profile: Dict[str, Any],
        counselor: CounselorProfile,
        criteria: MatchingCriteria
    ) -> MatchingResult:
        """计算学生与咨询师的匹配分数"""
        
        # 1. 专业匹配度
        specialty_score = self._calculate_specialty_match(
            student_profile['problem_types'], counselor.specialties
        )
        
        # 2. 性格兼容性
        personality_score = self._calculate_personality_compatibility(
            criteria.personality_preference, counselor.personality_traits
        )
        
        # 3. 经验匹配度
        experience_score = self._calculate_experience_match(
            student_profile['risk_level'], counselor.experience_years
        )
        
        # 4. 可用性评分
        availability_score = counselor.availability_score
        
        # 5. 成功率评分
        success_rate_score = counselor.success_rate
        
        # 6. 工作负载平衡
        workload_score = self._calculate_workload_score(counselor.current_workload)
        
        # 7. 偏好对齐度
        preference_score = self._calculate_preference_alignment(criteria, counselor)
        
        # 综合评分
        total_score = (
            specialty_score * self.matching_weights['specialty_match'] +
            personality_score * self.matching_weights['personality_compatibility'] +
            experience_score * self.matching_weights['experience_match'] +
            availability_score * self.matching_weights['availability'] +
            success_rate_score * self.matching_weights['success_rate'] +
            workload_score * self.matching_weights['workload_balance'] +
            preference_score * self.matching_weights['preference_alignment']
        )
        
        # 生成匹配理由
        match_reasons = self._generate_match_reasons(
            specialty_score, personality_score, experience_score,
            counselor, criteria
        )
        
        # 兼容性分解
        compatibility_breakdown = {
            'specialty_match': specialty_score,
            'personality_compatibility': personality_score,
            'experience_match': experience_score,
            'availability': availability_score,
            'success_rate': success_rate_score,
            'workload_balance': workload_score,
            'preference_alignment': preference_score
        }
        
        # 预估咨询效果
        estimated_effectiveness = self._estimate_consultation_effectiveness(
            total_score, student_profile, counselor
        )
        
        # 推荐咨询类型
        recommended_session_type = self._recommend_session_type(
            student_profile, counselor, criteria
        )
        
        return MatchingResult(
            counselor=counselor,
            match_score=total_score,
            match_reasons=match_reasons,
            compatibility_breakdown=compatibility_breakdown,
            estimated_effectiveness=estimated_effectiveness,
            recommended_session_type=recommended_session_type,
            scheduling_priority=self._calculate_scheduling_priority(total_score, counselor)
        )
    
    def _calculate_specialty_match(
        self, 
        problem_types: List[str], 
        counselor_specialties: List[str]
    ) -> float:
        """计算专业匹配度"""
        
        if not problem_types:
            return 0.5  # 默认中等匹配
        
        total_match = 0
        for problem in problem_types:
            relevant_specialties = self.problem_specialty_mapping.get(problem, [])
            
            # 检查咨询师专长是否匹配
            specialty_match = any(
                specialty in counselor_specialties 
                for specialty in relevant_specialties
            )
            
            if specialty_match:
                total_match += 1
        
        return min(1.0, total_match / len(problem_types))
    
    def _calculate_personality_compatibility(
        self, 
        preferred_personality: str, 
        counselor_traits: List[str]
    ) -> float:
        """计算性格兼容性"""
        
        compatibility_matrix = {
            'empathetic': ['温和', '共情', '理解', '耐心'],
            'rational': ['理性', '逻辑', '客观', '分析'],
            'gentle': ['温柔', '细心', '轻声', '体贴'],
            'energetic': ['活力', '积极', '乐观', '鼓励']
        }
        
        preferred_traits = compatibility_matrix.get(preferred_personality, [])
        
        match_count = sum(
            1 for trait in preferred_traits 
            if trait in counselor_traits
        )
        
        return min(1.0, match_count / len(preferred_traits)) if preferred_traits else 0.5
    
    def _calculate_experience_match(self, risk_level: str, experience_years: int) -> float:
        """计算经验匹配度"""
        
        # 根据风险等级需要不同经验水平
        required_experience = {
            'minimal': 1,   # 最小风险需要1年以上经验
            'low': 2,       # 低风险需要2年以上经验
            'moderate': 3,  # 中等风险需要3年以上经验
            'high': 5,      # 高风险需要5年以上经验
            'critical': 8   # 严重风险需要8年以上经验
        }
        
        min_required = required_experience.get(risk_level, 3)
        
        if experience_years >= min_required:
            # 经验足够，额外经验有加分但收益递减
            excess_experience = experience_years - min_required
            bonus = min(0.3, excess_experience * 0.05)
            return min(1.0, 0.8 + bonus)
        else:
            # 经验不足，按比例扣分
            return experience_years / min_required
    
    def _calculate_workload_score(self, current_workload: int) -> float:
        """计算工作负载评分"""
        
        # 假设理想工作负载为20个案例
        ideal_workload = 20
        
        if current_workload <= ideal_workload:
            return 1.0
        else:
            # 超出理想负载，评分递减
            overload_factor = (current_workload - ideal_workload) / ideal_workload
            return max(0.3, 1.0 - overload_factor * 0.5)
    
    def _calculate_preference_alignment(
        self, 
        criteria: MatchingCriteria, 
        counselor: CounselorProfile
    ) -> float:
        """计算偏好对齐度"""
        
        alignment_score = 0
        total_preferences = 0
        
        # 性别偏好
        if criteria.gender_preference and criteria.gender_preference != 'no_preference':
            total_preferences += 1
            if counselor.gender == criteria.gender_preference:
                alignment_score += 1
        
        # 治疗流派偏好
        if criteria.therapy_schools:
            total_preferences += 1
            if counselor.therapy_school in criteria.therapy_schools:
                alignment_score += 1
        
        # 辅导员偏好
        if criteria.counselor_role_preference and criteria.counselor_role_preference != 'no_preference':
            total_preferences += 1
            if (criteria.counselor_role_preference == 'counselor' and counselor.is_counselor) or \
               (criteria.counselor_role_preference == 'therapist' and not counselor.is_counselor):
                alignment_score += 1
        
        return alignment_score / total_preferences if total_preferences > 0 else 1.0
    
    async def _optimize_scheduling(self, candidates: List[MatchingResult]) -> List[MatchingResult]:
        """优化排班考虑"""
        
        # 考虑咨询师的时间安排，避免过度集中
        optimized = []
        counselor_assignments = {}
        
        for result in candidates:
            counselor_id = result.counselor.counselor_id
            current_assignments = counselor_assignments.get(counselor_id, 0)
            
            # 如果该咨询师已经分配过多，降低优先级
            if current_assignments >= 2:
                result.match_score *= 0.8
                result.scheduling_priority -= 1
            
            optimized.append(result)
            counselor_assignments[counselor_id] = current_assignments + 1
        
        # 重新排序
        optimized.sort(key=lambda x: (x.match_score, x.scheduling_priority), reverse=True)
        return optimized
    
    # 辅助方法实现...
    async def _calculate_counselor_stats(self, counselor_id: int) -> Dict[str, Any]:
        """计算咨询师统计信息"""
        
        consultations = self.db.query(Consultation).filter(
            Consultation.counselor_id == counselor_id
        ).all()
        
        completed_consultations = [
            c for c in consultations 
            if c.status == ConsultationStatus.COMPLETED
        ]
        
        # 成功率计算
        positive_feedback = sum(
            1 for c in completed_consultations 
            if c.student_feedback == True
        )
        success_rate = positive_feedback / len(completed_consultations) if completed_consultations else 0.5
        
        # 可用性评分（基于最近的工作安排）
        recent_consultations = [
            c for c in consultations 
            if c.scheduled_time >= datetime.utcnow() - timedelta(days=30)
        ]
        availability_score = max(0.3, 1.0 - len(recent_consultations) / 30)
        
        # 学生反馈平均分
        feedback_scores = [
            c.student_feedback for c in completed_consultations 
            if c.student_feedback is not None
        ]
        feedback_avg = np.mean([1 if f else 0 for f in feedback_scores]) if feedback_scores else 0.5
        
        # 当前工作负载
        active_consultations = [
            c for c in consultations 
            if c.status in [ConsultationStatus.SCHEDULED, ConsultationStatus.IN_PROGRESS]
        ]
        current_workload = len(active_consultations)
        
        return {
            'success_rate': success_rate,
            'availability_score': availability_score,
            'feedback_avg': feedback_avg,
            'current_workload': current_workload
        }
    
    def _extract_gender_from_name(self, name: str) -> str:
        """从姓名推断性别（简化实现）"""
        # 这里可以使用更复杂的性别识别算法
        return 'unknown'  # 临时实现
    
    def _parse_specialties(self, specialties_text: str) -> List[str]:
        """解析专长文本"""
        if not specialties_text:
            return []
        return [s.strip() for s in specialties_text.split(',')]
    
    def _infer_personality_traits(self, counselor: Counselor) -> List[str]:
        """推断咨询师性格特质"""
        # 基于治疗流派和描述推断性格特质
        traits = []
        
        if counselor.school == CounselorSchool.HUMANISTIC:
            traits.extend(['温和', '共情', '理解'])
        elif counselor.school == CounselorSchool.COGNITIVE_BEHAVIORAL:
            traits.extend(['理性', '结构化', '目标导向'])
        elif counselor.school == CounselorSchool.PSYCHOANALYTIC:
            traits.extend(['深度', '洞察', '分析'])
        
        return traits
    
    def _generate_match_reasons(
        self,
        specialty_score: float,
        personality_score: float,
        experience_score: float,
        counselor: CounselorProfile,
        criteria: MatchingCriteria
    ) -> List[str]:
        """生成匹配理由"""
        
        reasons = []
        
        if specialty_score > 0.7:
            reasons.append(f"专业领域高度匹配，擅长处理您遇到的问题类型")
        
        if personality_score > 0.7:
            reasons.append(f"咨询风格符合您的偏好")
        
        if experience_score > 0.8:
            reasons.append(f"具有{counselor.experience_years}年丰富经验，能够有效处理各类情况")
        
        if counselor.success_rate > 0.8:
            reasons.append(f"咨询成功率高达{counselor.success_rate*100:.0f}%")
        
        if counselor.is_counselor and criteria.counselor_role_preference == 'counselor':
            reasons.append("同时担任辅导员角色，更了解学生情况")
        
        return reasons

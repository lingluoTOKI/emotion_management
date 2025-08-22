"""
学生服务模块
Student Service Module
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from app.models.user import Student
from app.models.assessment import Assessment, AssessmentRecord, EmotionRecord

class StudentService:
    """学生服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def start_assessment(self, user_id: int, assessment_data: Dict[str, Any]) -> Assessment:
        """开始心理评估"""
        from loguru import logger
        
        try:
            logger.debug(f"开始评估: user_id={user_id}, assessment_data={assessment_data}")
            
            # 从user_id获取实际的student_id
            student = self.db.query(Student).filter(Student.user_id == user_id).first()
            logger.debug(f"查询学生信息: student={student}")
            
            if not student:
                logger.error(f"用户不是学生或学生信息不存在: user_id={user_id}")
                raise ValueError("用户不是学生或学生信息不存在")
            
            logger.debug(f"学生信息: student_id={student.id}, name={student.name}")
            
            # 创建新的评估记录
            assessment = Assessment(
                student_id=student.id,  # 使用Student表的id，不是user_id
                assessment_type=assessment_data.assessment_type,
                status="in_progress"
            )
            logger.debug(f"创建评估对象: {assessment}")
            
            self.db.add(assessment)
            logger.debug("评估对象已添加到数据库会话")
            
            self.db.commit()
            logger.debug("数据库提交成功")
            
            self.db.refresh(assessment)
            logger.debug(f"评估对象刷新成功: id={assessment.id}")
            
            return assessment
            
        except Exception as e:
            logger.error(f"start_assessment方法执行失败: {str(e)}")
            logger.error(f"错误类型: {type(e).__name__}")
            import traceback
            logger.error(f"错误堆栈: {traceback.format_exc()}")
            raise
    
    async def submit_answer(self, assessment_id: int, question_id: str, answer_text: str, user_id: int, answer_score: float = None) -> AssessmentRecord:
        """提交评估答案"""
        # 验证用户是否有权限操作这个评估
        student = self.db.query(Student).filter(Student.user_id == user_id).first()
        if not student:
            raise ValueError("用户不是学生或学生信息不存在")
        
        # 验证评估是否属于该学生
        assessment = self.db.query(Assessment).filter(
            Assessment.id == assessment_id,
            Assessment.student_id == student.id
        ).first()
        if not assessment:
            raise ValueError("评估不存在或无权限访问")
        
        record = AssessmentRecord(
            assessment_id=assessment_id,
            question_id=question_id,
            answer_text=answer_text,
            answer_score=answer_score
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record
    
    async def complete_assessment(self, assessment_id: int, user_id: int, total_score: float = None, risk_level: str = None, keywords: List[str] = None) -> Assessment:
        """完成评估"""
        # 验证用户是否有权限操作这个评估
        student = self.db.query(Student).filter(Student.user_id == user_id).first()
        if not student:
            raise ValueError("用户不是学生或学生信息不存在")
        
        # 验证评估是否属于该学生
        assessment = self.db.query(Assessment).filter(
            Assessment.id == assessment_id,
            Assessment.student_id == student.id
        ).first()
        if not assessment:
            raise ValueError("评估不存在或无权限访问")
        
        if assessment:
            assessment.end_time = datetime.utcnow()
            assessment.status = "completed"
            if total_score is not None:
                assessment.total_score = total_score
            if risk_level is not None:
                assessment.risk_level = risk_level
            if keywords is not None:
                assessment.keywords = keywords
            self.db.commit()
            self.db.refresh(assessment)
        return assessment
    
    async def record_emotion(self, assessment_id: int, emotion_data: Dict[str, Any]) -> EmotionRecord:
        """记录情绪数据"""
        emotion_record = EmotionRecord(
            assessment_id=assessment_id,
            depression_index=emotion_data.get("depression_index", 0.0),
            anxiety_index=emotion_data.get("anxiety_index", 0.0),
            stress_index=emotion_data.get("stress_index", 0.0),
            overall_mood=emotion_data.get("overall_mood", 0.0),
            dominant_emotion=emotion_data.get("dominant_emotion", ""),
            emotion_intensity=emotion_data.get("emotion_intensity", 0.0)
        )
        self.db.add(emotion_record)
        self.db.commit()
        self.db.refresh(emotion_record)
        return emotion_record
    
    async def get_assessment_report(self, assessment_id: int) -> Dict[str, Any]:
        """获取评估报告"""
        assessment = self.db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            return None
        
        # 获取情绪记录
        emotion_records = self.db.query(EmotionRecord).filter(
            EmotionRecord.assessment_id == assessment_id
        ).order_by(EmotionRecord.timestamp).all()
        
        # 构建报告数据
        report = {
            "assessment_id": assessment.id,
            "assessment_type": assessment.assessment_type,
            "total_score": assessment.total_score,
            "risk_level": assessment.risk_level,
            "keywords": assessment.keywords or [],
            "emotion_trend": [
                {
                    "timestamp": record.timestamp.isoformat(),
                    "depression_index": record.depression_index,
                    "anxiety_index": record.anxiety_index,
                    "stress_index": record.stress_index,
                    "overall_mood": record.overall_mood
                }
                for record in emotion_records
            ]
        }
        
        return report
    
    async def get_emotion_trends(self, student_id: int, days: int = 30) -> List[Dict[str, Any]]:
        """获取情绪趋势"""
        # 获取指定天数内的情绪记录
        start_date = datetime.utcnow() - timedelta(days=days)
        
        assessments = self.db.query(Assessment).filter(
            Assessment.student_id == student_id,
            Assessment.created_at >= start_date
        ).all()
        
        emotion_trends = []
        for assessment in assessments:
            emotion_records = self.db.query(EmotionRecord).filter(
                EmotionRecord.assessment_id == assessment.id
            ).order_by(EmotionRecord.timestamp).all()
            
            for record in emotion_records:
                emotion_trends.append({
                    "timestamp": record.timestamp.isoformat(),
                    "depression_index": record.depression_index,
                    "anxiety_index": record.anxiety_index,
                    "stress_index": record.stress_index,
                    "overall_mood": record.overall_mood
                })
        
        return emotion_trends
    
    async def get_assessment_history(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """获取评估历史记录"""
        student = self.db.query(Student).filter(Student.user_id == user_id).first()
        if not student:
            return []
        
        assessments = self.db.query(Assessment).filter(
            Assessment.student_id == student.id
        ).order_by(Assessment.created_at.desc()).limit(limit).all()
        
        history = []
        for assessment in assessments:
            history.append({
                "id": assessment.id,
                "assessment_type": assessment.assessment_type,
                "status": assessment.status,
                "start_time": assessment.start_time.isoformat() if assessment.start_time else None,
                "end_time": assessment.end_time.isoformat() if assessment.end_time else None,
                "total_score": assessment.total_score,
                "risk_level": assessment.risk_level
            })
        
        return history
    
    async def get_student_profile(self, user_id: int) -> Dict[str, Any]:
        """获取学生个人信息"""
        student = self.db.query(Student).filter(Student.user_id == user_id).first()
        if not student:
            return None
        
        return {
            "id": student.id,
            "student_id": student.student_id,
            "name": student.name,
            "major": student.major,
            "grade": student.grade,
            "phone": student.phone,
            "emergency_contact": student.emergency_contact,
            "emergency_phone": student.emergency_phone
        }
    
    async def submit_assessment_feedback(self, assessment_id: int, is_accurate: bool, feedback_comment: str = None, user_id: int = None) -> Dict[str, Any]:
        """提交评估报告准确性反馈"""
        # 这里可以添加反馈记录逻辑
        # 暂时返回简单的确认信息
        return {
            "message": "反馈提交成功",
            "assessment_id": assessment_id,
            "is_accurate": is_accurate,
            "feedback_comment": feedback_comment
        }

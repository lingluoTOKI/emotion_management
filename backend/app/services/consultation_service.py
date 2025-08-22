"""
咨询管理服务模块
Consultation Management Service Module
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from app.models.user import Counselor, CounselorSchool, Student
from app.models.consultation import Consultation, Appointment, ConsultationStatus

class ConsultationService:
    """咨询管理服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def create_appointment(self, student_id: int, counselor_id: int, appointment_time: datetime, 
                               consultation_type: str, description: str = None) -> Appointment:
        """创建咨询预约"""
        # 检查咨询师是否可用
        counselor = self.db.query(Counselor).filter(Counselor.id == counselor_id).first()
        if not counselor or not counselor.is_available:
            raise ValueError("咨询师不可用")
        
        # 检查时间冲突
        existing_appointment = self.db.query(Appointment).filter(
            and_(
                Appointment.counselor_id == counselor_id,
                Appointment.appointment_time == appointment_time,
                Appointment.status.in_(["pending", "confirmed"])
            )
        ).first()
        
        if existing_appointment:
            raise ValueError("该时间段已被预约")
        
        # 创建预约
        appointment = Appointment(
            student_id=student_id,
            counselor_id=counselor_id,
            appointment_time=appointment_time,
            consultation_type=consultation_type,
            description=description,
            status="pending"
        )
        
        self.db.add(appointment)
        self.db.commit()
        self.db.refresh(appointment)
        return appointment
    
    async def get_available_counselors(self, problem_type: str = None, school: CounselorSchool = None, 
                                     gender: str = None, is_counselor: bool = None) -> List[Dict[str, Any]]:
        """获取可用咨询师列表"""
        query = self.db.query(Counselor).filter(Counselor.is_available == True)
        
        if problem_type:
            # 根据问题类型筛选（这里需要实现更复杂的匹配逻辑）
            pass
        
        if school:
            query = query.filter(Counselor.school == school)
        
        if gender:
            # 这里需要关联User表来获取性别信息
            pass
        
        if is_counselor is not None:
            query = query.filter(Counselor.is_counselor == is_counselor)
        
        counselors = query.all()
        
        # 转换为字典格式
        result = []
        for counselor in counselors:
            result.append({
                "id": counselor.id,
                "name": counselor.name,
                "school": counselor.school,
                "description": counselor.description,
                "specialties": counselor.specialties,
                "experience_years": counselor.experience_years,
                "is_counselor": counselor.is_counselor,
                "office_location": counselor.office_location
            })
        
        return result
    
    async def get_student_appointments(self, student_id: int, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """获取学生的预约记录"""
        query = self.db.query(Appointment).filter(Appointment.student_id == student_id)
        
        if status:
            query = query.filter(Appointment.status == status)
        
        appointments = query.order_by(Appointment.appointment_time.desc()).all()
        
        result = []
        for appointment in appointments:
            result.append({
                "id": appointment.id,
                "counselor_id": appointment.counselor_id,
                "appointment_time": appointment.appointment_time.isoformat() if appointment.appointment_time else None,
                "consultation_type": appointment.consultation_type,
                "status": appointment.status,
                "reason": appointment.reason,
                "urgency_level": appointment.urgency_level
            })
        
        return result
    
    async def get_student_consultations(self, student_id: int) -> List[Dict[str, Any]]:
        """获取学生的咨询记录"""
        consultations = self.db.query(Consultation).filter(
            Consultation.student_id == student_id
        ).order_by(Consultation.start_time.desc()).all()
        
        result = []
        for consultation in consultations:
            result.append({
                "id": consultation.id,
                "counselor_id": consultation.counselor_id,
                "start_time": consultation.start_time.isoformat() if consultation.start_time else None,
                "end_time": consultation.end_time.isoformat() if consultation.end_time else None,
                "status": consultation.status,
                "consultation_type": consultation.consultation_type,
                "duration": consultation.duration,
                "summary": consultation.summary
            })
        
        return result
    
    async def cancel_appointment(self, appointment_id: int, student_id: int) -> Dict[str, Any]:
        """取消预约"""
        appointment = self.db.query(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.student_id == student_id
        ).first()
        
        if not appointment:
            raise ValueError("预约不存在或无权限取消")
        
        if appointment.status in ["completed", "cancelled"]:
            raise ValueError("预约状态不允许取消")
        
        appointment.status = "cancelled"
        self.db.commit()
        
        return {
            "message": "预约取消成功",
            "appointment_id": appointment_id
        }
    
    async def submit_consultation_feedback(self, consultation_id: int, is_satisfied: bool, 
                                         feedback_comment: str = None, student_id: int = None) -> Dict[str, Any]:
        """提交咨询满意度反馈"""
        consultation = self.db.query(Consultation).filter(
            Consultation.id == consultation_id,
            Consultation.student_id == student_id
        ).first()
        
        if not consultation:
            raise ValueError("咨询记录不存在或无权限提交反馈")
        
        # 这里可以添加反馈记录逻辑
        # 暂时返回简单的确认信息
        return {
            "message": "反馈提交成功",
            "consultation_id": consultation_id,
            "is_satisfied": is_satisfied,
            "feedback_comment": feedback_comment
        }
    
    async def intelligent_counselor_matching(self, student_id: int, problem_type: str, 
                                          preferences: Dict[str, Any]) -> List[Dict[str, Any]]:
        """智能咨询师匹配"""
        # 获取学生信息
        student = self.db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return []
        
        # 根据问题类型和偏好进行匹配
        # 这里实现更复杂的匹配算法
        matched_counselors = await self.get_available_counselors(
            problem_type=problem_type,
            school=preferences.get("school"),
            gender=preferences.get("gender")
        )
        
        # 计算匹配度分数
        for counselor in matched_counselors:
            match_score = self._calculate_match_score(counselor, problem_type, preferences)
            counselor["match_score"] = match_score
        
        # 按匹配度排序
        matched_counselors.sort(key=lambda x: x["match_score"], reverse=True)
        
        return matched_counselors[:5]  # 返回前5个最佳匹配
    
    async def get_counselor_schedule(self, counselor_id: int, date: datetime = None) -> List[Dict[str, Any]]:
        """获取咨询师日程安排"""
        if not date:
            date = datetime.now()
        
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        appointments = self.db.query(Appointment).filter(
            and_(
                Appointment.counselor_id == counselor_id,
                Appointment.appointment_time >= start_of_day,
                Appointment.appointment_time < end_of_day
            )
        ).order_by(Appointment.appointment_time).all()
        
        schedule = []
        for appointment in appointments:
            schedule.append({
                "id": appointment.id,
                "time": appointment.appointment_time,
                "student_name": self._get_student_name(appointment.student_id),
                "consultation_type": appointment.consultation_type,
                "status": appointment.status
            })
        
        return schedule
    
    async def start_consultation(self, appointment_id: int) -> Consultation:
        """开始咨询"""
        appointment = self.db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            raise ValueError("预约不存在")
        
        if appointment.status != "confirmed":
            raise ValueError("预约状态不正确")
        
        # 创建咨询记录
        consultation = Consultation(
            student_id=appointment.student_id,
            counselor_id=appointment.counselor_id,
            appointment_id=appointment_id,
            consultation_type=appointment.consultation_type,
            status=ConsultationStatus.IN_PROGRESS,
            start_time=datetime.utcnow()
        )
        
        self.db.add(consultation)
        self.db.commit()
        self.db.refresh(consultation)
        
        # 更新预约状态
        appointment.status = "in_progress"
        self.db.commit()
        
        return consultation
    
    async def complete_consultation(self, consultation_id: int, summary: str = None, 
                                  student_feedback: str = None, student_rating: int = None) -> Consultation:
        """完成咨询"""
        consultation = self.db.query(Consultation).filter(Consultation.id == consultation_id).first()
        if not consultation:
            raise ValueError("咨询记录不存在")
        
        consultation.status = ConsultationStatus.COMPLETED
        consultation.end_time = datetime.utcnow()
        consultation.summary = summary
        consultation.student_feedback = student_feedback
        consultation.student_rating = student_rating
        
        # 计算咨询时长
        if consultation.start_time and consultation.end_time:
            duration = consultation.end_time - consultation.start_time
            consultation.duration = duration.total_seconds() / 60  # 转换为分钟
        
        self.db.commit()
        self.db.refresh(consultation)
        
        # 更新预约状态
        if consultation.appointment_id:
            appointment = self.db.query(Appointment).filter(Appointment.id == consultation.appointment_id).first()
            if appointment:
                appointment.status = "completed"
                self.db.commit()
        
        return consultation
    
    def _calculate_match_score(self, counselor: Dict[str, Any], problem_type: str, 
                             preferences: Dict[str, Any]) -> float:
        """计算匹配度分数"""
        score = 0.0
        
        # 流派匹配
        if preferences.get("school") and counselor["school"] == preferences["school"]:
            score += 0.3
        
        # 经验匹配
        if counselor["experience_years"]:
            if counselor["experience_years"] >= 5:
                score += 0.2
            elif counselor["experience_years"] >= 3:
                score += 0.15
            else:
                score += 0.1
        
        # 专长匹配
        if counselor["specialties"] and problem_type in counselor["specialties"]:
            score += 0.3
        
        # 位置匹配
        if preferences.get("location") and counselor["office_location"]:
            # 这里可以实现更复杂的位置匹配逻辑
            score += 0.1
        
        return min(score, 1.0)
    
    def _get_student_name(self, student_id: int) -> str:
        """获取学生姓名"""
        student = self.db.query(Student).filter(Student.id == student_id).first()
        return student.name if student else "未知"
    
    async def get_counselor_appointments(self, counselor_id: int, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """获取咨询师的预约列表"""
        query = self.db.query(Appointment).filter(Appointment.counselor_id == counselor_id)
        
        if status:
            query = query.filter(Appointment.status == status)
        
        appointments = query.order_by(Appointment.appointment_time.desc()).all()
        
        result = []
        for appointment in appointments:
            result.append({
                "id": appointment.id,
                "student_id": appointment.student_id,
                "student_name": self._get_student_name(appointment.student_id),
                "appointment_time": appointment.appointment_time.isoformat() if appointment.appointment_time else None,
                "consultation_type": appointment.consultation_type,
                "status": appointment.status,
                "reason": appointment.reason,
                "urgency_level": appointment.urgency_level
            })
        
        return result
    
    async def get_counselor_consultations(self, counselor_id: int) -> List[Dict[str, Any]]:
        """获取咨询师的咨询记录"""
        consultations = self.db.query(Consultation).filter(
            Consultation.counselor_id == counselor_id
        ).order_by(Consultation.start_time.desc()).all()
        
        result = []
        for consultation in consultations:
            result.append({
                "id": consultation.id,
                "student_id": consultation.student_id,
                "student_name": self._get_student_name(consultation.student_id),
                "start_time": consultation.start_time.isoformat() if consultation.start_time else None,
                "end_time": consultation.end_time.isoformat() if consultation.end_time else None,
                "status": consultation.status,
                "consultation_type": consultation.consultation_type,
                "duration": consultation.duration,
                "summary": consultation.summary
            })
        
        return result
    
    async def update_counselor_schedule(self, counselor_id: int, schedule_data: Dict[str, Any]) -> Dict[str, Any]:
        """更新咨询师可用时间表"""
        # 这里可以实现更复杂的日程管理逻辑
        # 暂时返回简单的确认信息
        return {
            "message": "日程更新成功",
            "counselor_id": counselor_id,
            "schedule_data": schedule_data
        }
    
    async def get_counselor_statistics(self, counselor_id: int, start_date: Optional[datetime] = None, 
                                     end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """获取咨询师统计信息"""
        query = self.db.query(Consultation).filter(Consultation.counselor_id == counselor_id)
        
        if start_date:
            query = query.filter(Consultation.start_time >= start_date)
        if end_date:
            query = query.filter(Consultation.start_time <= end_date)
        
        consultations = query.all()
        
        total_consultations = len(consultations)
        completed_consultations = len([c for c in consultations if c.status == ConsultationStatus.COMPLETED])
        avg_duration = sum([c.duration or 0 for c in consultations]) / total_consultations if total_consultations > 0 else 0
        
        return {
            "total_consultations": total_consultations,
            "completed_consultations": completed_consultations,
            "completion_rate": completed_consultations / total_consultations if total_consultations > 0 else 0,
            "average_duration": avg_duration,
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None
        }

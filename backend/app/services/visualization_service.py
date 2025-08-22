"""
管理员数据可视化服务
Admin Data Visualization Service
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from collections import Counter
from dataclasses import dataclass
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from loguru import logger
import jieba
import redis

from app.models.user import Counselor, CounselorSchool, Student
from app.models.consultation import Consultation, ConsultationStatus
from app.models.assessment import Assessment
from app.core.config import settings
from app.core.exceptions import BusinessLogicError


@dataclass
class WordCloudData:
    """词云数据"""
    words: List[Dict[str, Any]]  # [{"word": "学习压力", "count": 45, "weight": 0.8}]
    total_keywords: int
    update_time: datetime
    time_range: str


@dataclass
class RoseChartData:
    """南丁格尔玫瑰图数据"""
    categories: List[Dict[str, Any]]  # [{"name": "认知行为疗法", "value": 120, "color": "#FF6B6B"}]
    total_consultations: int
    update_time: datetime


@dataclass
class AccuracyPieData:
    """准确率饼状图数据"""
    accurate_count: int
    inaccurate_count: int
    total_assessments: int
    accuracy_rate: float
    update_time: datetime
    breakdown: Dict[str, Any]  # 详细分解数据


@dataclass
class SuccessBarData:
    """成功率条形图数据"""
    counselors: List[Dict[str, Any]]  # [{"name": "张医生", "success_rate": 92.5, "total": 48}]
    average_success_rate: float
    update_time: datetime


class VisualizationService:
    """管理员数据可视化服务类"""
    
    def __init__(self, db: Session):
        self.db = db
        
        # Redis缓存客户端
        try:
            self.redis_client = redis.from_url(settings.REDIS_URL)
        except:
            self.redis_client = None
            logger.warning("Redis连接失败，将使用内存缓存")
        
        # 缓存过期时间配置
        self.cache_expiry = {
            'wordcloud': 3600,      # 词云数据1小时过期
            'rose_chart': 1800,     # 玫瑰图30分钟过期
            'accuracy_pie': 1800,   # 准确率图30分钟过期
            'success_bar': 3600     # 成功率图1小时过期
        }
        
        # 停用词列表（用于词云过滤）
        self.stop_words = {
            '的', '了', '和', '是', '我', '在', '有', '也', '就', '都', '这', '那',
            '但是', '然后', '因为', '所以', '如果', '或者', '虽然', '不过', '而且'
        }
    
    async def get_comprehensive_dashboard_data(
        self,
        time_range: str = "last_30_days",
        department_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        获取管理员仪表板综合数据
        
        Args:
            time_range: 时间范围 (last_7_days/last_30_days/last_90_days/custom)
            department_filter: 部门过滤 (可选)
            
        Returns:
            包含所有图表数据的字典
        """
        
        try:
            logger.info(f"获取管理员仪表板数据，时间范围: {time_range}")
            
            # 计算时间范围
            start_date, end_date = self._calculate_time_range(time_range)
            
            # 并行获取各图表数据
            wordcloud_data = await self._get_wordcloud_data(start_date, end_date, department_filter)
            rose_chart_data = await self._get_rose_chart_data(start_date, end_date, department_filter)
            accuracy_pie_data = await self._get_accuracy_pie_data(start_date, end_date, department_filter)
            success_bar_data = await self._get_success_bar_data(start_date, end_date, department_filter)
            
            # 获取总体统计
            overall_stats = await self._get_overall_statistics(start_date, end_date, department_filter)
            
            dashboard_data = {
                'wordcloud': wordcloud_data.__dict__,
                'rose_chart': rose_chart_data.__dict__,
                'accuracy_pie': accuracy_pie_data.__dict__,
                'success_bar': success_bar_data.__dict__,
                'overall_stats': overall_stats,
                'meta': {
                    'time_range': time_range,
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'department_filter': department_filter,
                    'last_updated': datetime.now().isoformat()
                }
            }
            
            # 缓存结果
            await self._cache_dashboard_data(dashboard_data, time_range, department_filter)
            
            logger.info("管理员仪表板数据获取完成")
            return dashboard_data
            
        except Exception as e:
            logger.error(f"获取仪表板数据失败: {str(e)}")
            raise BusinessLogicError(f"获取仪表板数据失败: {str(e)}")
    
    async def _get_wordcloud_data(
        self,
        start_date: datetime,
        end_date: datetime,
        department_filter: Optional[str] = None
    ) -> WordCloudData:
        """获取词云图数据"""
        
        # 尝试从缓存获取
        cache_key = f"wordcloud:{start_date.date()}:{end_date.date()}:{department_filter or 'all'}"
        cached_data = await self._get_from_cache(cache_key)
        
        if cached_data:
            return WordCloudData(**cached_data)
        
        # 从数据库查询
        query = self.db.query(Assessment).filter(
            Assessment.status == "completed",
            Assessment.created_at >= start_date,
            Assessment.created_at <= end_date,
            Assessment.keywords.isnot(None)
        )
        
        # 添加部门过滤
        if department_filter:
            query = query.join(Student).filter(Student.major == department_filter)
        
        assessments = query.all()
        
        # 提取并统计关键词
        all_keywords = []
        for assessment in assessments:
            if assessment.keywords:
                all_keywords.extend(assessment.keywords)
        
        # 使用jieba进行文本分析和关键词提取
        keyword_text = ' '.join(all_keywords)
        words = jieba.cut(keyword_text)
        
        # 过滤停用词并统计
        filtered_words = [word for word in words if word not in self.stop_words and len(word) > 1]
        word_counts = Counter(filtered_words)
        
        # 计算权重并格式化
        max_count = max(word_counts.values()) if word_counts else 1
        words_data = []
        
        for word, count in word_counts.most_common(50):  # 取前50个关键词
            weight = count / max_count
            words_data.append({
                'word': word,
                'count': count,
                'weight': weight,
                'font_size': max(12, min(48, int(weight * 40))),  # 字体大小12-48px
                'color': self._get_word_color(weight)
            })
        
        wordcloud_data = WordCloudData(
            words=words_data,
            total_keywords=len(all_keywords),
            update_time=datetime.now(),
            time_range=f"{start_date.date()} ~ {end_date.date()}"
        )
        
        # 缓存结果
        await self._set_cache(cache_key, wordcloud_data.__dict__, self.cache_expiry['wordcloud'])
        
        return wordcloud_data
    
    async def _get_rose_chart_data(
        self,
        start_date: datetime,
        end_date: datetime,
        department_filter: Optional[str] = None
    ) -> RoseChartData:
        """获取南丁格尔玫瑰图数据"""
        
        cache_key = f"rose_chart:{start_date.date()}:{end_date.date()}:{department_filter or 'all'}"
        cached_data = await self._get_from_cache(cache_key)
        
        if cached_data:
            return RoseChartData(**cached_data)
        
        # 查询咨询师流派统计
        query = self.db.query(
            Counselor.school,
            func.count(Consultation.id).label('consultation_count')
        ).join(
            Consultation, Counselor.id == Consultation.counselor_id
        ).filter(
            Consultation.status == ConsultationStatus.COMPLETED,
            Consultation.created_at >= start_date,
            Consultation.created_at <= end_date
        )
        
        # 添加部门过滤
        if department_filter:
            query = query.join(Student, Consultation.student_id == Student.id).filter(
                Student.major == department_filter
            )
        
        school_stats = query.group_by(Counselor.school).all()
        
        # 颜色配置
        school_colors = {
            CounselorSchool.COGNITIVE_BEHAVIORAL: "#FF6B6B",
            CounselorSchool.PSYCHOANALYTIC: "#4ECDC4",
            CounselorSchool.HUMANISTIC: "#45B7D1",
            CounselorSchool.SYSTEMIC: "#96CEB4",
            CounselorSchool.GESTALT: "#FFEAA7",
            CounselorSchool.OTHER: "#DDA0DD"
        }
        
        categories = []
        total_consultations = 0
        
        for school, count in school_stats:
            total_consultations += count
            categories.append({
                'name': school.value,
                'value': count,
                'color': school_colors.get(school, "#DDA0DD"),
                'percentage': 0  # 将在后面计算
            })
        
        # 计算百分比
        for category in categories:
            category['percentage'] = round(
                (category['value'] / total_consultations) * 100, 1
            ) if total_consultations > 0 else 0
        
        # 按数量排序
        categories.sort(key=lambda x: x['value'], reverse=True)
        
        rose_data = RoseChartData(
            categories=categories,
            total_consultations=total_consultations,
            update_time=datetime.now()
        )
        
        await self._set_cache(cache_key, rose_data.__dict__, self.cache_expiry['rose_chart'])
        return rose_data
    
    async def _get_accuracy_pie_data(
        self,
        start_date: datetime,
        end_date: datetime,
        department_filter: Optional[str] = None
    ) -> AccuracyPieData:
        """获取评估报告准确率饼状图数据"""
        
        cache_key = f"accuracy_pie:{start_date.date()}:{end_date.date()}:{department_filter or 'all'}"
        cached_data = await self._get_from_cache(cache_key)
        
        if cached_data:
            return AccuracyPieData(**cached_data)
        
        # 这里应该查询学生对评估报告的反馈
        # 目前使用模拟逻辑，基于评估完成情况估算准确性
        
        query = self.db.query(Assessment).filter(
            Assessment.status == "completed",
            Assessment.created_at >= start_date,
            Assessment.created_at <= end_date
        )
        
        if department_filter:
            query = query.join(Student).filter(Student.major == department_filter)
        
        total_assessments = query.count()
        
        # 基于风险等级和后续咨询情况估算准确性
        # 这是简化算法，实际应该基于学生的明确反馈
        
        high_risk_assessments = query.filter(Assessment.risk_level == "high").count()
        completed_assessments = query.filter(Assessment.total_score.isnot(None)).count()
        
        # 简化的准确性估算
        if total_assessments > 0:
            # 假设80%的基础准确率，根据完整性调整
            base_accuracy = 0.80
            completeness_factor = completed_assessments / total_assessments
            estimated_accuracy = base_accuracy * (0.7 + 0.3 * completeness_factor)
            
            accurate_count = int(total_assessments * estimated_accuracy)
            inaccurate_count = total_assessments - accurate_count
            accuracy_rate = round(estimated_accuracy * 100, 1)
        else:
            accurate_count = 0
            inaccurate_count = 0
            accuracy_rate = 0.0
        
        # 详细分解数据
        breakdown = {
            'by_risk_level': {
                'high_risk': high_risk_assessments,
                'other_risk': total_assessments - high_risk_assessments
            },
            'by_completeness': {
                'complete': completed_assessments,
                'incomplete': total_assessments - completed_assessments
            },
            'estimation_method': 'algorithm_based',
            'confidence': 0.7  # 算法估算的置信度
        }
        
        pie_data = AccuracyPieData(
            accurate_count=accurate_count,
            inaccurate_count=inaccurate_count,
            total_assessments=total_assessments,
            accuracy_rate=accuracy_rate,
            update_time=datetime.now(),
            breakdown=breakdown
        )
        
        await self._set_cache(cache_key, pie_data.__dict__, self.cache_expiry['accuracy_pie'])
        return pie_data
    
    async def _get_success_bar_data(
        self,
        start_date: datetime,
        end_date: datetime,
        department_filter: Optional[str] = None
    ) -> SuccessBarData:
        """获取咨询师问题解决率条形图数据"""
        
        cache_key = f"success_bar:{start_date.date()}:{end_date.date()}:{department_filter or 'all'}"
        cached_data = await self._get_from_cache(cache_key)
        
        if cached_data:
            return SuccessBarData(**cached_data)
        
        # 查询咨询师成功率统计
        query = self.db.query(
            Counselor.name,
            func.count(Consultation.id).label('total_consultations'),
            func.sum(
                func.case([(Consultation.student_feedback == True, 1)], else_=0)
            ).label('successful_consultations')
        ).join(
            Consultation, Counselor.id == Consultation.counselor_id
        ).filter(
            Consultation.status == ConsultationStatus.COMPLETED,
            Consultation.created_at >= start_date,
            Consultation.created_at <= end_date
        )
        
        if department_filter:
            query = query.join(Student, Consultation.student_id == Student.id).filter(
                Student.major == department_filter
            )
        
        counselor_stats = query.group_by(
            Counselor.id, Counselor.name
        ).having(
            func.count(Consultation.id) >= 3  # 至少3次咨询才计入统计
        ).all()
        
        counselors_data = []
        total_success_rate = 0
        
        for name, total, successful in counselor_stats:
            success_rate = round((successful / total) * 100, 1) if total > 0 else 0
            total_success_rate += success_rate
            
            counselors_data.append({
                'name': name,
                'success_rate': success_rate,
                'total_consultations': total,
                'successful_consultations': successful or 0,
                'level': self._get_performance_level(success_rate),
                'color': self._get_performance_color(success_rate)
            })
        
        # 按成功率排序
        counselors_data.sort(key=lambda x: x['success_rate'], reverse=True)
        
        # 计算平均成功率
        average_success_rate = round(
            total_success_rate / len(counselors_data), 1
        ) if counselors_data else 0
        
        bar_data = SuccessBarData(
            counselors=counselors_data[:15],  # 显示前15名
            average_success_rate=average_success_rate,
            update_time=datetime.now()
        )
        
        await self._set_cache(cache_key, bar_data.__dict__, self.cache_expiry['success_bar'])
        return bar_data
    
    async def _get_overall_statistics(
        self,
        start_date: datetime,
        end_date: datetime,
        department_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """获取总体统计数据"""
        
        # 基础查询
        base_filters = [
            Assessment.created_at >= start_date,
            Assessment.created_at <= end_date
        ]
        
        consultation_filters = [
            Consultation.created_at >= start_date,
            Consultation.created_at <= end_date
        ]
        
        if department_filter:
            base_filters.append(Student.major == department_filter)
            consultation_filters.append(Student.major == department_filter)
        
        # 评估统计
        assessment_query = self.db.query(Assessment)
        if department_filter:
            assessment_query = assessment_query.join(Student)
        assessment_query = assessment_query.filter(and_(*base_filters))
        
        total_assessments = assessment_query.count()
        completed_assessments = assessment_query.filter(Assessment.status == "completed").count()
        high_risk_cases = assessment_query.filter(Assessment.risk_level == "high").count()
        
        # 咨询统计
        consultation_query = self.db.query(Consultation)
        if department_filter:
            consultation_query = consultation_query.join(Student, Consultation.student_id == Student.id)
        consultation_query = consultation_query.filter(and_(*consultation_filters))
        
        total_consultations = consultation_query.count()
        completed_consultations = consultation_query.filter(
            Consultation.status == ConsultationStatus.COMPLETED
        ).count()
        
        # 活跃用户统计
        active_students = self.db.query(Student.id).distinct()
        if department_filter:
            active_students = active_students.filter(Student.major == department_filter)
        
        active_students_count = active_students.join(Assessment).filter(
            and_(*base_filters)
        ).count()
        
        # 咨询师统计
        active_counselors = self.db.query(Counselor.id).distinct().join(Consultation).filter(
            and_(*consultation_filters)
        ).count()
        
        return {
            'assessments': {
                'total': total_assessments,
                'completed': completed_assessments,
                'completion_rate': round((completed_assessments / total_assessments) * 100, 1) if total_assessments > 0 else 0,
                'high_risk_cases': high_risk_cases,
                'high_risk_rate': round((high_risk_cases / total_assessments) * 100, 1) if total_assessments > 0 else 0
            },
            'consultations': {
                'total': total_consultations,
                'completed': completed_consultations,
                'completion_rate': round((completed_consultations / total_consultations) * 100, 1) if total_consultations > 0 else 0
            },
            'users': {
                'active_students': active_students_count,
                'active_counselors': active_counselors
            },
            'trends': {
                'assessment_growth': await self._calculate_growth_rate('assessments', start_date, end_date),
                'consultation_growth': await self._calculate_growth_rate('consultations', start_date, end_date)
            }
        }
    
    def _calculate_time_range(self, time_range: str) -> Tuple[datetime, datetime]:
        """计算时间范围"""
        
        end_date = datetime.now()
        
        if time_range == "last_7_days":
            start_date = end_date - timedelta(days=7)
        elif time_range == "last_30_days":
            start_date = end_date - timedelta(days=30)
        elif time_range == "last_90_days":
            start_date = end_date - timedelta(days=90)
        else:  # 默认30天
            start_date = end_date - timedelta(days=30)
        
        return start_date, end_date
    
    def _get_word_color(self, weight: float) -> str:
        """根据权重获取词云颜色"""
        
        if weight >= 0.8:
            return "#FF4444"  # 高频词红色
        elif weight >= 0.6:
            return "#FF8800"  # 中高频词橙色
        elif weight >= 0.4:
            return "#0088FF"  # 中频词蓝色
        else:
            return "#888888"  # 低频词灰色
    
    def _get_performance_level(self, success_rate: float) -> str:
        """获取绩效等级"""
        
        if success_rate >= 90:
            return "优秀"
        elif success_rate >= 80:
            return "良好"
        elif success_rate >= 70:
            return "一般"
        else:
            return "待改进"
    
    def _get_performance_color(self, success_rate: float) -> str:
        """获取绩效颜色"""
        
        if success_rate >= 90:
            return "#4CAF50"  # 绿色
        elif success_rate >= 80:
            return "#2196F3"  # 蓝色
        elif success_rate >= 70:
            return "#FF9800"  # 橙色
        else:
            return "#F44336"  # 红色
    
    async def _calculate_growth_rate(
        self,
        metric_type: str,
        start_date: datetime,
        end_date: datetime
    ) -> float:
        """计算增长率"""
        
        # 计算当前周期和上一周期的数据量
        current_period_days = (end_date - start_date).days
        previous_start = start_date - timedelta(days=current_period_days)
        
        if metric_type == "assessments":
            current_count = self.db.query(Assessment).filter(
                Assessment.created_at >= start_date,
                Assessment.created_at <= end_date
            ).count()
            
            previous_count = self.db.query(Assessment).filter(
                Assessment.created_at >= previous_start,
                Assessment.created_at < start_date
            ).count()
        else:  # consultations
            current_count = self.db.query(Consultation).filter(
                Consultation.created_at >= start_date,
                Consultation.created_at <= end_date
            ).count()
            
            previous_count = self.db.query(Consultation).filter(
                Consultation.created_at >= previous_start,
                Consultation.created_at < start_date
            ).count()
        
        if previous_count > 0:
            growth_rate = ((current_count - previous_count) / previous_count) * 100
            return round(growth_rate, 1)
        else:
            return 0.0
    
    # 缓存相关方法
    async def _get_from_cache(self, key: str) -> Optional[Dict[str, Any]]:
        """从缓存获取数据"""
        
        if not self.redis_client:
            return None
        
        try:
            cached_data = self.redis_client.get(key)
            if cached_data:
                import json
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"缓存读取失败: {str(e)}")
        
        return None
    
    async def _set_cache(self, key: str, data: Dict[str, Any], expiry: int):
        """设置缓存数据"""
        
        if not self.redis_client:
            return
        
        try:
            import json
            self.redis_client.setex(
                key, 
                expiry, 
                json.dumps(data, default=str)
            )
        except Exception as e:
            logger.warning(f"缓存写入失败: {str(e)}")
    
    async def _cache_dashboard_data(
        self,
        dashboard_data: Dict[str, Any],
        time_range: str,
        department_filter: Optional[str]
    ):
        """缓存仪表板数据"""
        
        cache_key = f"dashboard:{time_range}:{department_filter or 'all'}"
        await self._set_cache(cache_key, dashboard_data, 1800)  # 30分钟过期
    
    async def export_dashboard_data(
        self,
        format_type: str = "json",
        time_range: str = "last_30_days",
        department_filter: Optional[str] = None
    ) -> bytes:
        """导出仪表板数据"""
        
        dashboard_data = await self.get_comprehensive_dashboard_data(time_range, department_filter)
        
        if format_type == "json":
            import json
            return json.dumps(dashboard_data, ensure_ascii=False, indent=2).encode('utf-8')
        
        elif format_type == "excel":
            # 实现Excel导出逻辑
            # 这里需要使用openpyxl或pandas
            pass
        
        elif format_type == "pdf":
            # 实现PDF导出逻辑
            # 这里需要使用reportlab等库
            pass
        
        else:
            raise ValueError(f"不支持的导出格式: {format_type}")

"""
综合心理评估API路由
Comprehensive Psychological Assessment API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
import json
from datetime import datetime

from app.core.database import get_db
from app.services.auth_service import get_current_user
from app.models.user import User, UserRole
from app.services.comprehensive_assessment_service import comprehensive_assessment_service
from app.schemas.ai_counseling import AISessionResponse, ComprehensiveAssessmentRequest, ComprehensiveAssessmentResponse
from loguru import logger

router = APIRouter()

def get_student_user(current_user: User = Depends(get_current_user)):
    """确保当前用户是学生"""
    if current_user.role != UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有学生用户可以进行心理评估"
        )
    return current_user

@router.post("/create-comprehensive-report", 
            response_model=ComprehensiveAssessmentResponse, 
            summary="创建综合心理评估报告")
async def create_comprehensive_assessment_report(
    request: ComprehensiveAssessmentRequest,
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    创建综合心理评估报告
    
    - **session_id**: AI咨询会话ID
    - **scale_results**: 心理量表测试结果 (可选)
    - **include_conversation**: 是否包含对话分析 (默认True)
    
    返回综合评估报告，包含：
    - 对话情感分析 (如果有)
    - 量表分析结果 (如果有)
    - 综合风险评估
    - 个性化建议
    - 后续计划
    """
    try:
        logger.info(f"用户 {current_user.id} 请求生成综合评估报告，会话ID: {request.session_id}")
        
        # 验证会话ID格式和权限
        if not request.session_id.startswith("ai_session_"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无效的会话ID格式"
            )
        
        # 提取会话ID中的用户ID进行权限验证
        try:
            session_parts = request.session_id.split("_")
            session_user_id = int(session_parts[2])
            if session_user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="只能访问自己的评估数据"
                )
        except (IndexError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="会话ID格式错误"
            )
        
        # 验证量表结果格式
        if request.scale_results:
            validated_scale_results = _validate_scale_results(request.scale_results)
        else:
            validated_scale_results = None
        
        # 创建综合评估报告
        comprehensive_report = await comprehensive_assessment_service.create_comprehensive_assessment(
            session_id=request.session_id,
            scale_results=validated_scale_results,
            include_conversation=request.include_conversation
        )
        
        # 添加用户信息到报告
        comprehensive_report["user_info"] = {
            "user_id": current_user.id,
            "username": current_user.username,
            "assessment_request_time": datetime.utcnow().isoformat()
        }
        
        logger.info(f"综合评估报告生成成功，ID: {comprehensive_report.get('assessment_id')}")
        
        return {
            "success": True,
            "message": "综合心理评估报告生成成功",
            "assessment_report": comprehensive_report,
            "meta": {
                "session_id": request.session_id,
                "has_conversation_data": request.include_conversation,
                "has_scale_data": request.scale_results is not None,
                "risk_level": comprehensive_report.get("overall_assessment", {}).get("risk_level", "unknown")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"生成综合评估报告失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"生成评估报告失败: {str(e)}"
        )

@router.get("/assessment-readiness/{session_id}", 
           response_model=Dict[str, Any], 
           summary="检查评估准备状态")
async def check_assessment_readiness(
    session_id: str,
    current_user: User = Depends(get_student_user)
):
    """
    检查指定会话是否准备好进行综合评估
    
    返回：
    - 对话数据可用性
    - 建议的量表测试
    - 评估质量预期
    """
    try:
        # 权限验证
        try:
            session_parts = session_id.split("_")
            session_user_id = int(session_parts[2])
            if session_user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="只能访问自己的会话数据"
                )
        except (IndexError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="会话ID格式错误"
            )
        
        # 获取会话数据
        conversation_data = comprehensive_assessment_service._get_conversation_data(session_id)
        
        if not conversation_data:
            return {
                "ready_for_assessment": False,
                "conversation_available": False,
                "message": "未找到会话数据，建议先进行AI咨询对话",
                "recommendations": {
                    "suggested_actions": ["开始AI心理咨询对话", "至少进行5轮以上的深入对话"],
                    "minimum_requirements": "需要至少5轮对话才能进行有效评估"
                }
            }
        
        # 分析对话质量
        conversation_history = conversation_data.get("conversation_history", [])
        user_messages = [msg for msg in conversation_history if msg.get("role") == "user"]
        
        # 评估对话质量
        conversation_quality = _assess_conversation_quality_for_assessment(conversation_data)
        
        # 生成量表推荐
        scale_recommendations = _generate_scale_recommendations_from_conversation(conversation_data)
        
        # 确定评估准备状态
        ready_for_assessment = (
            len(user_messages) >= 3 and 
            conversation_quality["quality_score"] >= 0.3
        )
        
        optimal_assessment = (
            len(user_messages) >= 5 and 
            conversation_quality["quality_score"] >= 0.5
        )
        
        return {
            "ready_for_assessment": ready_for_assessment,
            "optimal_for_assessment": optimal_assessment,
            "conversation_available": True,
            "conversation_analysis": {
                "message_count": len(user_messages),
                "quality_score": conversation_quality["quality_score"],
                "engagement_level": conversation_quality["engagement_level"],
                "conversation_depth": conversation_quality["conversation_depth"]
            },
            "scale_recommendations": scale_recommendations,
            "assessment_quality_prediction": {
                "expected_reliability": _predict_assessment_reliability(conversation_quality, scale_recommendations),
                "recommended_improvements": _suggest_assessment_improvements(conversation_quality)
            },
            "recommendations": {
                "immediate_actions": _generate_readiness_recommendations(ready_for_assessment, optimal_assessment),
                "suggested_scales": [rec["scale_name"] for rec in scale_recommendations[:3]]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"检查评估准备状态失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"检查评估状态失败: {str(e)}"
        )

@router.post("/submit-scale-results", 
            response_model=Dict[str, Any], 
            summary="提交心理量表测试结果")
async def submit_scale_results(
    session_id: str,
    scale_results: Dict[str, Any],
    current_user: User = Depends(get_student_user)
):
    """
    提交心理量表测试结果
    
    - **session_id**: 关联的AI咨询会话ID
    - **scale_results**: 量表测试结果
    
    支持的量表格式：
    - PHQ-9: {"scale_name": "PHQ-9", "total_score": 15, "items": [...]}
    - GAD-7: {"scale_name": "GAD-7", "total_score": 12, "items": [...]}
    - 自定义量表
    """
    try:
        # 权限验证
        try:
            session_parts = session_id.split("_")
            session_user_id = int(session_parts[2])
            if session_user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="只能提交自己的量表结果"
                )
        except (IndexError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="会话ID格式错误"
            )
        
        # 验证量表结果
        validated_results = _validate_scale_results(scale_results)
        
        # 分析量表结果
        scale_analysis = comprehensive_assessment_service._analyze_scale_results(validated_results)
        
        # 生成量表分析报告
        scale_report = {
            "submission_time": datetime.utcnow().isoformat(),
            "session_id": session_id,
            "user_id": current_user.id,
            "scale_results": validated_results,
            "analysis": scale_analysis,
            "summary": _generate_scale_summary(scale_analysis)
        }
        
        logger.info(f"用户 {current_user.id} 提交量表结果，会话: {session_id}")
        
        return {
            "success": True,
            "message": "量表结果提交成功",
            "scale_report": scale_report,
            "next_steps": {
                "can_generate_comprehensive_report": True,
                "recommended_action": "现在可以生成综合评估报告",
                "additional_scales_suggested": scale_analysis.get("additional_recommendations", [])
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"提交量表结果失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"提交量表结果失败: {str(e)}"
        )

@router.get("/available-scales", 
           response_model=List[Dict[str, Any]], 
           summary="获取可用的心理量表")
async def get_available_scales(
    current_user: User = Depends(get_student_user)
):
    """
    获取系统支持的心理量表列表
    """
    available_scales = [
        {
            "scale_name": "PHQ-9",
            "full_name": "患者健康问卷-9",
            "type": "depression",
            "description": "用于筛查和评估抑郁症状的标准化量表",
            "item_count": 9,
            "time_required": "5-10分钟",
            "score_range": "0-27分",
            "interpretations": {
                "0-4": "最小/无抑郁",
                "5-9": "轻度抑郁",
                "10-14": "中度抑郁", 
                "15-19": "中重度抑郁",
                "20-27": "重度抑郁"
            },
            "recommended_for": ["情绪低落", "抑郁症状", "心境问题"]
        },
        {
            "scale_name": "GAD-7",
            "full_name": "广泛性焦虑症量表-7",
            "type": "anxiety",
            "description": "用于筛查和评估焦虑症状的标准化量表",
            "item_count": 7,
            "time_required": "3-5分钟",
            "score_range": "0-21分",
            "interpretations": {
                "0-4": "最小焦虑",
                "5-9": "轻度焦虑",
                "10-14": "中度焦虑",
                "15-21": "重度焦虑"
            },
            "recommended_for": ["焦虑症状", "担心过度", "紧张不安"]
        },
        {
            "scale_name": "Beck抑郁量表(BDI-II)",
            "full_name": "Beck抑郁症清单第二版",
            "type": "depression",
            "description": "深度评估抑郁症状的专业量表",
            "item_count": 21,
            "time_required": "10-15分钟",
            "score_range": "0-63分",
            "interpretations": {
                "0-13": "最小抑郁",
                "14-19": "轻度抑郁",
                "20-28": "中度抑郁",
                "29-63": "重度抑郁"
            },
            "recommended_for": ["深度抑郁评估", "持续性情绪问题"]
        },
        {
            "scale_name": "学习压力量表",
            "full_name": "大学生学习压力评估量表",
            "type": "stress",
            "description": "评估学生学习相关压力水平",
            "item_count": 15,
            "time_required": "8-10分钟",
            "score_range": "15-75分",
            "recommended_for": ["学习压力", "学业困扰", "考试焦虑"]
        },
        {
            "scale_name": "社交焦虑量表(SAS)",
            "full_name": "社交焦虑症量表",
            "type": "social_anxiety",
            "description": "评估社交情境中的焦虑水平",
            "item_count": 20,
            "time_required": "10-12分钟",
            "score_range": "0-80分",
            "recommended_for": ["社交恐惧", "人际交往困难", "社交回避"]
        }
    ]
    
    return available_scales

# 辅助函数

def _validate_scale_results(scale_results: Dict[str, Any]) -> Dict[str, Any]:
    """验证量表结果格式"""
    validated = {}
    
    for scale_name, scale_data in scale_results.items():
        if not isinstance(scale_data, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"量表 {scale_name} 的数据格式无效"
            )
        
        # 验证必需字段
        if "total_score" not in scale_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"量表 {scale_name} 缺少总分字段"
            )
        
        try:
            total_score = int(scale_data["total_score"])
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"量表 {scale_name} 的总分必须是数字"
            )
        
        validated[scale_name] = {
            "total_score": total_score,
            "items": scale_data.get("items", []),
            "completion_time": scale_data.get("completion_time", datetime.utcnow().isoformat()),
            "max_score": scale_data.get("max_score", 100)
        }
    
    return validated

def _assess_conversation_quality_for_assessment(conversation_data: Dict[str, Any]) -> Dict[str, Any]:
    """评估对话质量以确定评估准备状态"""
    conversation_history = conversation_data.get("conversation_history", [])
    user_messages = [msg for msg in conversation_history if msg.get("role") == "user"]
    
    if not user_messages:
        return {
            "quality_score": 0.0,
            "engagement_level": "none",
            "conversation_depth": "none"
        }
    
    # 计算质量分数
    quality_score = 0.0
    
    # 1. 消息数量 (40%权重)
    message_count_score = min(len(user_messages) / 8, 1.0)
    quality_score += message_count_score * 0.4
    
    # 2. 平均消息长度 (30%权重)
    avg_length = sum(len(msg.get("message", "")) for msg in user_messages) / len(user_messages)
    length_score = min(avg_length / 50, 1.0)
    quality_score += length_score * 0.3
    
    # 3. 情感表达丰富度 (30%权重)
    emotion_words = ["开心", "难过", "焦虑", "害怕", "愤怒", "担心", "希望", "失望"]
    emotion_count = sum(1 for msg in user_messages for word in emotion_words 
                       if word in msg.get("message", ""))
    emotion_score = min(emotion_count / len(user_messages), 1.0)
    quality_score += emotion_score * 0.3
    
    # 参与度评估
    if quality_score >= 0.7:
        engagement_level = "high"
    elif quality_score >= 0.4:
        engagement_level = "medium"
    else:
        engagement_level = "low"
    
    # 对话深度评估
    if len(user_messages) >= 8 and avg_length >= 30:
        conversation_depth = "deep"
    elif len(user_messages) >= 5 and avg_length >= 20:
        conversation_depth = "moderate"
    else:
        conversation_depth = "surface"
    
    return {
        "quality_score": round(quality_score, 2),
        "engagement_level": engagement_level,
        "conversation_depth": conversation_depth,
        "message_count": len(user_messages),
        "avg_message_length": round(avg_length, 1)
    }

def _generate_scale_recommendations_from_conversation(conversation_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """基于对话内容推荐量表"""
    conversation_history = conversation_data.get("conversation_history", [])
    user_messages = [msg.get("message", "") for msg in conversation_history if msg.get("role") == "user"]
    all_text = " ".join(user_messages)
    
    recommendations = []
    
    # 基础推荐
    recommendations.extend([
        {
            "scale_name": "PHQ-9",
            "priority": "high",
            "reason": "基础抑郁症状筛查，适用于所有心理评估"
        },
        {
            "scale_name": "GAD-7", 
            "priority": "high",
            "reason": "基础焦虑症状筛查，适用于所有心理评估"
        }
    ])
    
    # 基于关键词的推荐
    if any(word in all_text for word in ["学习", "考试", "成绩", "作业", "功课"]):
        recommendations.append({
            "scale_name": "学习压力量表",
            "priority": "medium",
            "reason": "检测到学习相关话题，建议评估学习压力"
        })
    
    if any(word in all_text for word in ["朋友", "社交", "人际", "害羞", "紧张"]):
        recommendations.append({
            "scale_name": "社交焦虑量表(SAS)",
            "priority": "medium", 
            "reason": "检测到社交相关话题，建议评估社交焦虑"
        })
    
    if any(word in all_text for word in ["抑郁", "难过", "绝望", "无助", "痛苦"]):
        recommendations.append({
            "scale_name": "Beck抑郁量表(BDI-II)",
            "priority": "medium",
            "reason": "检测到抑郁相关症状，建议深度抑郁评估"
        })
    
    return recommendations

def _predict_assessment_reliability(conversation_quality: Dict[str, Any], scale_recommendations: List[Dict]) -> str:
    """预测评估可靠性"""
    score = 0
    
    # 对话质量影响
    quality_score = conversation_quality.get("quality_score", 0)
    if quality_score >= 0.7:
        score += 3
    elif quality_score >= 0.4:
        score += 2
    else:
        score += 1
    
    # 量表推荐数量影响
    if len(scale_recommendations) >= 3:
        score += 2
    elif len(scale_recommendations) >= 2:
        score += 1
    
    # 对话深度影响
    depth = conversation_quality.get("conversation_depth", "surface")
    if depth == "deep":
        score += 2
    elif depth == "moderate":
        score += 1
    
    if score >= 6:
        return "high"
    elif score >= 4:
        return "medium"
    else:
        return "low"

def _suggest_assessment_improvements(conversation_quality: Dict[str, Any]) -> List[str]:
    """建议评估改进措施"""
    suggestions = []
    
    quality_score = conversation_quality.get("quality_score", 0)
    message_count = conversation_quality.get("message_count", 0)
    avg_length = conversation_quality.get("avg_message_length", 0)
    
    if message_count < 5:
        suggestions.append("建议继续对话，至少达到5轮以上的深入交流")
    
    if avg_length < 20:
        suggestions.append("建议在对话中更详细地表达感受和想法")
    
    if quality_score < 0.5:
        suggestions.append("建议在对话中更多地分享具体的情感体验")
        suggestions.append("可以描述更多生活中的具体事例")
    
    if not suggestions:
        suggestions.append("对话质量良好，可以进行综合评估")
    
    return suggestions

def _generate_readiness_recommendations(ready_for_assessment: bool, optimal_for_assessment: bool) -> List[str]:
    """生成准备状态建议"""
    if optimal_for_assessment:
        return [
            "对话数据充分，可以生成高质量的综合评估报告",
            "建议完成推荐的心理量表以获得更全面的评估",
            "现在就可以创建综合评估报告"
        ]
    elif ready_for_assessment:
        return [
            "对话数据基本充分，可以进行评估",
            "建议继续1-2轮深入对话以提高评估质量",
            "完成心理量表测试将显著提升评估准确性"
        ]
    else:
        return [
            "建议继续AI心理咨询对话",
            "至少需要3-5轮深入对话才能进行有效评估",
            "在对话中更详细地表达感受和想法"
        ]

def _generate_scale_summary(scale_analysis: Dict[str, Any]) -> Dict[str, Any]:
    """生成量表分析摘要"""
    overall_assessment = scale_analysis.get("overall_scale_assessment", {})
    individual_analyses = scale_analysis.get("scale_analyses", {})
    
    summary = {
        "total_scales": len(individual_analyses),
        "overall_risk_level": overall_assessment.get("overall_risk_level", "unknown"),
        "average_risk_score": overall_assessment.get("average_risk_score", 0),
        "high_concern_scales": [],
        "positive_indicators": [],
        "key_findings": []
    }
    
    for scale_name, analysis in individual_analyses.items():
        severity = analysis.get("severity", "unknown")
        
        if severity in ["severe", "moderately_severe", "high"]:
            summary["high_concern_scales"].append({
                "scale": scale_name,
                "severity": severity,
                "score": analysis.get("score", 0)
            })
        elif severity in ["minimal", "low"]:
            summary["positive_indicators"].append({
                "scale": scale_name,
                "finding": f"{scale_name}结果良好"
            })
        
        # 关键发现
        if analysis.get("recommendation"):
            summary["key_findings"].append({
                "scale": scale_name,
                "finding": analysis.get("interpretation", ""),
                "recommendation": analysis.get("recommendation", "")
            })
    
    return summary


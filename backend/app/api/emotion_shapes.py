"""
情绪形状API路由
Emotion Shapes API Routes
"""

from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from pydantic import BaseModel
import os
from loguru import logger

from app.services.emotion_shape_generator import EmotionShapeGenerator

router = APIRouter()

class DetectEmotionRequest(BaseModel):
    keywords: List[str]

@router.get("/shapes/available")
async def get_available_emotion_shapes() -> Dict[str, Any]:
    """
    获取可用的情绪形状列表
    """
    try:
        generator = EmotionShapeGenerator()
        
        # 定义可用的情绪形状
        available_emotions = [
            {
                "emotion": "happy",
                "name": "开心",
                "description": "笑脸形状，适用于积极正面的情绪",
                "keywords": ["开心", "快乐", "高兴", "愉快", "兴奋", "喜悦"]
            },
            {
                "emotion": "love", 
                "name": "爱心",
                "description": "心形，适用于爱情、温暖、关爱等情绪",
                "keywords": ["爱", "喜欢", "浪漫", "温暖", "关爱", "亲情"]
            },
            {
                "emotion": "sad",
                "name": "悲伤",
                "description": "泪滴形状，适用于悲伤、失落等情绪",
                "keywords": ["难过", "伤心", "悲伤", "失落", "痛苦", "绝望"]
            },
            {
                "emotion": "angry",
                "name": "愤怒",
                "description": "闪电形状，适用于愤怒、生气等情绪",
                "keywords": ["愤怒", "生气", "烦躁", "恼火", "不满", "气愤"]
            },
            {
                "emotion": "anxious",
                "name": "焦虑",
                "description": "大脑形状，适用于焦虑、紧张、担心等情绪",
                "keywords": ["焦虑", "紧张", "担心", "害怕", "恐惧", "不安"]
            },
            {
                "emotion": "thinking",
                "name": "思考",
                "description": "灯泡形状，适用于学习、思考、创意等",
                "keywords": ["学习", "思考", "作业", "考试", "研究", "知识"]
            },
            {
                "emotion": "stress",
                "name": "压力",
                "description": "波浪形状，适用于压力、疲惫等情绪",
                "keywords": ["压力", "疲惫", "累", "忙碌", "紧张", "繁重"]
            },
            {
                "emotion": "neutral",
                "name": "中性",
                "description": "云朵形状，适用于中性或未明确的情绪",
                "keywords": ["一般", "还好", "普通", "正常", "平静"]
            }
        ]
        
        return {
            "available_emotions": available_emotions,
            "total_count": len(available_emotions),
            "description": "根据关键词自动检测情绪并生成对应形状的词云蒙版"
        }
        
    except Exception as e:
        logger.error(f"获取情绪形状列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取情绪形状列表失败: {str(e)}"
        )

@router.post("/shapes/generate")
async def generate_emotion_shape(
    emotion: str,
    keywords: List[str] = None
) -> Dict[str, Any]:
    """
    生成指定情绪的形状蒙版
    """
    try:
        generator = EmotionShapeGenerator()
        
        # 验证情绪类型
        valid_emotions = ["happy", "love", "sad", "angry", "anxious", "thinking", "stress", "neutral"]
        if emotion not in valid_emotions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"不支持的情绪类型: {emotion}，支持的类型: {valid_emotions}"
            )
        
        # 生成形状蒙版
        shape_mask = generator.generate_shape_mask(emotion, keywords)
        shape_mask_base64 = generator.save_mask_as_base64(shape_mask)
        
        logger.info(f"成功生成 {emotion} 情绪形状蒙版")
        
        return {
            "emotion": emotion,
            "shape_mask": shape_mask_base64,
            "mask_size": shape_mask.shape,
            "keywords_used": keywords or [],
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"生成情绪形状失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"生成情绪形状失败: {str(e)}"
        )

@router.post("/shapes/detect-emotion")
async def detect_emotion_from_keywords(
    request: DetectEmotionRequest
) -> Dict[str, Any]:
    """
    根据关键词检测情绪类型
    """
    try:
        keywords = request.keywords
        if not keywords:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="关键词列表不能为空"
            )
        
        generator = EmotionShapeGenerator()
        
        # 检测情绪
        detected_emotion = generator.get_emotion_from_keywords(keywords)
        
        # 生成对应的形状蒙版
        shape_mask = generator.generate_shape_mask(detected_emotion, keywords)
        shape_mask_base64 = generator.save_mask_as_base64(shape_mask)
        
        logger.info(f"关键词 {keywords} 检测到情绪: {detected_emotion}")
        
        return {
            "keywords": keywords,
            "detected_emotion": detected_emotion,
            "shape_mask": shape_mask_base64,
            "confidence": "high" if detected_emotion != "neutral" else "low",
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"情绪检测失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"情绪检测失败: {str(e)}"
        )

@router.get("/shapes/demo")
async def get_emotion_shapes_demo() -> Dict[str, Any]:
    """
    获取情绪形状演示数据
    """
    try:
        generator = EmotionShapeGenerator()
        
        # 演示数据
        demo_cases = [
            {
                "case_name": "学习压力",
                "keywords": ["学习", "压力", "考试", "焦虑", "担心"],
                "expected_emotion": "anxious"
            },
            {
                "case_name": "快乐心情",
                "keywords": ["开心", "快乐", "愉快", "满足", "高兴"],
                "expected_emotion": "happy"
            },
            {
                "case_name": "恋爱情感",
                "keywords": ["爱", "喜欢", "浪漫", "温暖", "关爱"],
                "expected_emotion": "love"
            },
            {
                "case_name": "失落情绪",
                "keywords": ["难过", "伤心", "失落", "痛苦", "绝望"],
                "expected_emotion": "sad"
            }
        ]
        
        demo_results = []
        
        for case in demo_cases:
            detected_emotion = generator.get_emotion_from_keywords(case["keywords"])
            shape_mask = generator.generate_shape_mask(detected_emotion, case["keywords"])
            shape_mask_base64 = generator.save_mask_as_base64(shape_mask)
            
            demo_results.append({
                "case_name": case["case_name"],
                "keywords": case["keywords"],
                "detected_emotion": detected_emotion,
                "expected_emotion": case["expected_emotion"],
                "match": detected_emotion == case["expected_emotion"],
                "shape_mask": shape_mask_base64
            })
        
        success_rate = sum(1 for result in demo_results if result["match"]) / len(demo_results)
        
        return {
            "demo_results": demo_results,
            "success_rate": round(success_rate * 100, 1),
            "total_cases": len(demo_results),
            "description": "情绪形状词云演示 - 根据关键词自动生成对应情绪的形状蒙版"
        }
        
    except Exception as e:
        logger.error(f"获取演示数据失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取演示数据失败: {str(e)}"
        )

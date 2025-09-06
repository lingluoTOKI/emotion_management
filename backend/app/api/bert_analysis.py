"""
BERT文本分析API端点
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from pydantic import BaseModel
from loguru import logger

from app.services.bert_text_analyzer import bert_analyzer

router = APIRouter(prefix="/api/bert", tags=["BERT分析"])


class TextAnalysisRequest(BaseModel):
    text: str


class TextSimilarityRequest(BaseModel):
    text1: str
    text2: str


class BertAnalysisResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    message: str = ""


@router.post("/emotion-analysis", response_model=BertAnalysisResponse)
async def analyze_emotion(request: TextAnalysisRequest):
    """
    BERT情感分析
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="输入文本不能为空")
        
        result = bert_analyzer.analyze_emotion(request.text)
        
        return BertAnalysisResponse(
            success=True,
            data=result,
            message="情感分析完成"
        )
        
    except Exception as e:
        logger.error(f"BERT情感分析API错误: {e}")
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")


@router.post("/problem-classification", response_model=BertAnalysisResponse)
async def classify_problem(request: TextAnalysisRequest):
    """
    BERT问题类型分类
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="输入文本不能为空")
        
        result = bert_analyzer.classify_problem_type(request.text)
        
        return BertAnalysisResponse(
            success=True,
            data=result,
            message="问题分类完成"
        )
        
    except Exception as e:
        logger.error(f"BERT问题分类API错误: {e}")
        raise HTTPException(status_code=500, detail=f"分类失败: {str(e)}")


@router.post("/entity-extraction", response_model=BertAnalysisResponse)
async def extract_entities(request: TextAnalysisRequest):
    """
    BERT命名实体识别
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="输入文本不能为空")
        
        result = bert_analyzer.extract_entities(request.text)
        
        return BertAnalysisResponse(
            success=True,
            data=result,
            message="实体识别完成"
        )
        
    except Exception as e:
        logger.error(f"BERT实体识别API错误: {e}")
        raise HTTPException(status_code=500, detail=f"识别失败: {str(e)}")


@router.post("/text-similarity", response_model=BertAnalysisResponse)
async def calculate_similarity(request: TextSimilarityRequest):
    """
    BERT文本相似度计算
    """
    try:
        if not request.text1.strip() or not request.text2.strip():
            raise HTTPException(status_code=400, detail="输入文本不能为空")
        
        result = bert_analyzer.calculate_text_similarity(request.text1, request.text2)
        
        return BertAnalysisResponse(
            success=True,
            data=result,
            message="相似度计算完成"
        )
        
    except Exception as e:
        logger.error(f"BERT相似度计算API错误: {e}")
        raise HTTPException(status_code=500, detail=f"计算失败: {str(e)}")


@router.post("/comprehensive-analysis", response_model=BertAnalysisResponse)
async def comprehensive_analysis(request: TextAnalysisRequest):
    """
    BERT综合文本分析
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="输入文本不能为空")
        
        result = bert_analyzer.comprehensive_analysis(request.text)
        
        return BertAnalysisResponse(
            success=True,
            data=result,
            message="综合分析完成"
        )
        
    except Exception as e:
        logger.error(f"BERT综合分析API错误: {e}")
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")


@router.get("/status", response_model=BertAnalysisResponse)
async def get_bert_status():
    """
    获取BERT分析器状态
    """
    try:
        status = bert_analyzer.get_status()
        
        return BertAnalysisResponse(
            success=True,
            data=status,
            message="状态获取成功"
        )
        
    except Exception as e:
        logger.error(f"获取BERT状态API错误: {e}")
        raise HTTPException(status_code=500, detail=f"获取状态失败: {str(e)}")


@router.post("/batch-analysis", response_model=BertAnalysisResponse)
async def batch_analysis(texts: List[str]):
    """
    批量BERT文本分析
    """
    try:
        if not texts or len(texts) == 0:
            raise HTTPException(status_code=400, detail="文本列表不能为空")
        
        if len(texts) > 50:
            raise HTTPException(status_code=400, detail="批量分析最多支持50个文本")
        
        results = []
        for i, text in enumerate(texts):
            if text.strip():
                try:
                    analysis = bert_analyzer.comprehensive_analysis(text)
                    results.append({
                        "index": i,
                        "text": text,
                        "analysis": analysis,
                        "success": True
                    })
                except Exception as e:
                    results.append({
                        "index": i,
                        "text": text,
                        "error": str(e),
                        "success": False
                    })
            else:
                results.append({
                    "index": i,
                    "text": text,
                    "error": "空文本",
                    "success": False
                })
        
        success_count = sum(1 for r in results if r["success"])
        
        return BertAnalysisResponse(
            success=True,
            data={
                "results": results,
                "total_count": len(texts),
                "success_count": success_count,
                "failure_count": len(texts) - success_count
            },
            message=f"批量分析完成，成功{success_count}个，失败{len(texts) - success_count}个"
        )
        
    except Exception as e:
        logger.error(f"BERT批量分析API错误: {e}")
        raise HTTPException(status_code=500, detail=f"批量分析失败: {str(e)}")


@router.post("/test-with-sample", response_model=BertAnalysisResponse)
async def test_with_sample():
    """
    使用示例文本测试BERT功能
    """
    try:
        sample_texts = [
            "我最近感觉很焦虑，学习压力好大，不知道该怎么办。",
            "今天心情不错，和朋友一起玩得很开心。",
            "我觉得我可能有点抑郁了，每天都很难过。",
            "家里人总是不理解我，我感觉很孤独。"
        ]
        
        test_results = {}
        
        # 测试情感分析
        emotion_results = []
        for text in sample_texts:
            emotion_result = bert_analyzer.analyze_emotion(text)
            emotion_results.append({
                "text": text,
                "emotion": emotion_result
            })
        test_results["emotion_analysis"] = emotion_results
        
        # 测试问题分类
        classification_results = []
        for text in sample_texts:
            classification_result = bert_analyzer.classify_problem_type(text)
            classification_results.append({
                "text": text,
                "classification": classification_result
            })
        test_results["problem_classification"] = classification_results
        
        # 测试文本相似度
        similarity_result = bert_analyzer.calculate_text_similarity(
            sample_texts[0], sample_texts[2]
        )
        test_results["text_similarity"] = {
            "text1": sample_texts[0],
            "text2": sample_texts[2],
            "similarity": similarity_result
        }
        
        # 测试综合分析
        comprehensive_result = bert_analyzer.comprehensive_analysis(sample_texts[0])
        test_results["comprehensive_analysis"] = comprehensive_result
        
        # 获取状态
        test_results["analyzer_status"] = bert_analyzer.get_status()
        
        return BertAnalysisResponse(
            success=True,
            data=test_results,
            message="示例测试完成"
        )
        
    except Exception as e:
        logger.error(f"BERT示例测试API错误: {e}")
        raise HTTPException(status_code=500, detail=f"测试失败: {str(e)}")

"""
科大讯飞AI服务集成
iFlytek AI Service Integration
"""

import asyncio
import json
import hmac
import hashlib
import base64
from datetime import datetime
from urllib.parse import urlparse, urlencode
import aiohttp
import websockets
from typing import Dict, Any, List, Optional, AsyncGenerator
from loguru import logger

from app.core.config import settings
from app.core.exceptions import AIServiceError


class XFYunAIService:
    """科大讯飞AI服务类"""
    
    def __init__(self):
        # HTTP接口配置 - 基于星火X1模型官方文档  
        self.http_api_key = "EzKgmeawIpXfiarncVSA:iIslfPOGbFKAvraGyOCr"  # 完整的APIpassword
        self.http_base_url = "https://spark-api-open.xf-yun.com/v2"  # 使用控制台显示的实际地址
        
        # WebSocket接口配置 - 基于您的服务控制台信息
        self.ws_app_id = "22402cd9"
        self.ws_api_key = "ce15803676c1ecda114a04c6523f4bca"
        self.ws_api_secret = "YjVkMmE2N2MyNjQ3ZDNjYmY4ZTNlMzU3"
        self.ws_base_url = "wss://spark-api-open.xf-yun.com/v2/chat"  # 更新WebSocket地址
        
        # 默认模型配置 - 星火X1模型
        self.default_model = "x1"  # 星火X1模型
        
        logger.info("科大讯飞AI服务初始化完成，配置已内置")
        
    async def chat_completion_http(
        self,
        messages: List[Dict[str, str]],
        model: str = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        使用HTTP接口进行对话完成
        
        Args:
            messages: 对话消息列表
            model: 模型名称
            max_tokens: 最大令牌数
            temperature: 温度参数
            stream: 是否流式返回
            
        Returns:
            AI回复结果
        """
        
        try:
            url = f"{self.http_base_url}/chat/completions"
            
            headers = {
                "Authorization": f"Bearer {self.http_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": model or self.default_model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "stream": stream,
                "user": "user_001"  # 必需参数：用户唯一ID
            }
            
            # 设置较长的超时时间
            timeout = aiohttp.ClientTimeout(total=30)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        logger.info(f"科大讯飞HTTP API调用成功")
                        return result
                    else:
                        error_text = await response.text()
                        logger.error(f"科大讯飞HTTP API调用失败: {response.status} - {error_text}")
                        raise AIServiceError(f"HTTP API调用失败: {response.status}")
                        
        except Exception as e:
            logger.error(f"科大讯飞HTTP API异常: {str(e)}")
            raise AIServiceError(f"HTTP API调用异常: {str(e)}")
    
    async def chat_completion_websocket(
        self,
        messages: List[Dict[str, str]],
        model: str = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        """
        使用WebSocket接口进行流式对话
        
        Args:
            messages: 对话消息列表
            model: 模型名称
            max_tokens: 最大令牌数
            temperature: 温度参数
            
        Yields:
            流式AI回复内容
        """
        
        try:
            # 生成WebSocket认证URL
            auth_url = self._generate_ws_auth_url()
            
            # 准备WebSocket消息
            ws_message = {
                "header": {
                    "app_id": self.ws_app_id,
                    "uid": "user_001"  # 可以动态生成
                },
                "parameter": {
                    "chat": {
                        "domain": "generalv3.5",  # 科大讯飞WebSocket需要的domain
                        "temperature": temperature,
                        "max_tokens": max_tokens
                    }
                },
                "payload": {
                    "message": {
                        "text": messages
                    }
                }
            }
            
            async with websockets.connect(auth_url) as websocket:
                # 发送消息
                await websocket.send(json.dumps(ws_message))
                logger.info("WebSocket消息已发送")
                
                # 接收流式响应
                full_response = ""
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        
                        # 检查是否有错误
                        if data.get("header", {}).get("code") != 0:
                            error_msg = data.get("header", {}).get("message", "未知错误")
                            logger.error(f"WebSocket响应错误: {error_msg}")
                            raise AIServiceError(f"WebSocket响应错误: {error_msg}")
                        
                        # 提取内容
                        choices = data.get("payload", {}).get("choices", {}).get("text", [])
                        for choice in choices:
                            content = choice.get("content", "")
                            if content:
                                full_response += content
                                yield content
                        
                        # 检查是否结束
                        if data.get("header", {}).get("status") == 2:
                            logger.info("WebSocket对话完成")
                            break
                            
                    except json.JSONDecodeError as e:
                        logger.error(f"WebSocket消息解析失败: {str(e)}")
                        continue
                        
        except Exception as e:
            logger.error(f"科大讯飞WebSocket异常: {str(e)}")
            raise AIServiceError(f"WebSocket连接异常: {str(e)}")
    
    def _generate_ws_auth_url(self) -> str:
        """生成WebSocket认证URL"""
        
        # 解析URL
        url_parts = urlparse(self.ws_base_url)
        host = url_parts.netloc
        path = url_parts.path
        
        # 生成时间戳
        now = datetime.utcnow()
        date = now.strftime('%a, %d %b %Y %H:%M:%S GMT')
        
        # 生成签名字符串
        signature_origin = f"host: {host}\ndate: {date}\nGET {path} HTTP/1.1"
        
        # 计算签名
        signature_sha = hmac.new(
            self.ws_api_secret.encode('utf-8'),
            signature_origin.encode('utf-8'),
            digestmod=hashlib.sha256
        ).digest()
        
        signature_sha_base64 = base64.b64encode(signature_sha).decode('utf-8')
        
        # 生成authorization
        authorization_origin = f'api_key="{self.ws_api_key}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature_sha_base64}"'
        authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode('utf-8')
        
        # 构建最终URL
        params = {
            'authorization': authorization,
            'date': date,
            'host': host
        }
        
        auth_url = f"{self.ws_base_url}?{urlencode(params)}"
        return auth_url
    
    async def generate_psychological_response(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]] = None,
        context: Dict[str, Any] = None,
        use_websocket: bool = False
    ) -> str:
        """
        生成心理咨询回复
        
        Args:
            user_message: 用户消息
            conversation_history: 对话历史
            context: 上下文信息（情绪状态、风险等级等）
            use_websocket: 是否使用WebSocket接口
            
        Returns:
            AI生成的心理咨询回复
        """
        
        try:
            # 构建心理咨询专用提示词
            system_prompt = self._build_psychological_prompt(context)
            
            # 构建消息列表
            messages = [{"role": "system", "content": system_prompt}]
            
            # 添加对话历史（最近10轮）
            if conversation_history:
                recent_history = conversation_history[-10:]
                messages.extend(recent_history)
            
            # 添加当前用户消息
            messages.append({"role": "user", "content": user_message})
            
            if use_websocket:
                # 使用WebSocket流式生成
                response_parts = []
                async for chunk in self.chat_completion_websocket(messages):
                    response_parts.append(chunk)
                
                full_response = "".join(response_parts)
                return full_response
            else:
                # 使用HTTP接口
                result = await self.chat_completion_http(messages)
                
                if "choices" in result and len(result["choices"]) > 0:
                    return result["choices"][0]["message"]["content"]
                else:
                    raise AIServiceError("AI服务返回格式异常")
                    
        except Exception as e:
            logger.error(f"心理咨询回复生成失败: {str(e)}")
            raise AIServiceError(f"心理咨询回复生成失败: {str(e)}")
    
    def _build_psychological_prompt(self, context: Dict[str, Any] = None) -> str:
        """构建心理咨询专用提示词"""
        
        base_prompt = """你是一位专业的AI心理咨询师，具有丰富的心理健康咨询经验。请遵循以下原则：

1. 保持专业、温暖、共情的语调
2. 积极倾听并理解来访者的感受
3. 提供建设性的建议和支持
4. 避免诊断或提供医疗建议
5. 鼓励来访者寻求专业帮助当需要时
6. 保护来访者的隐私和尊严
7. 使用简体中文回复，语言要温和、专业且易于理解

请根据来访者的具体情况，提供个性化的心理支持和指导。"""

        if context:
            # 根据上下文调整提示词
            emotion_state = context.get('emotion_state', 'neutral')
            risk_level = context.get('risk_level', 'low')
            
            if risk_level == 'high':
                base_prompt += "\n\n特别注意：当前来访者可能处于高风险状态，请格外关注其安全，必要时引导其寻求紧急帮助。"
            
            if emotion_state in ['depression', 'sadness']:
                base_prompt += "\n\n当前来访者可能处于抑郁情绪中，请特别关注他们的感受，提供温暖的支持和希望。"
            elif emotion_state in ['anxiety', 'fear']:
                base_prompt += "\n\n当前来访者可能感到焦虑不安，请帮助他们缓解紧张情绪，提供实用的放松技巧。"
        
        return base_prompt
    
    async def analyze_emotion_with_ai(
        self,
        text_content: str,
        use_websocket: bool = False
    ) -> Dict[str, Any]:
        """
        使用AI分析文本情绪
        
        Args:
            text_content: 要分析的文本内容
            use_websocket: 是否使用WebSocket接口
            
        Returns:
            情绪分析结果
        """
        
        try:
            emotion_prompt = f"""分析文本情绪，返回简洁JSON：

{{
    "dominant_emotion": "情绪(joy/sadness/anger/fear/neutral)",
    "intensity": 0.8,
    "confidence": 0.9
}}

文本：{text_content}"""

            messages = [
                {"role": "system", "content": "你是专业的心理情绪分析师，请准确分析文本中的情绪状态并返回标准JSON格式。"},
                {"role": "user", "content": emotion_prompt}
            ]
            
            if use_websocket:
                response_parts = []
                async for chunk in self.chat_completion_websocket(messages):
                    response_parts.append(chunk)
                response_text = "".join(response_parts)
            else:
                result = await self.chat_completion_http(messages)
                response_text = result["choices"][0]["message"]["content"]
            
            # 尝试解析JSON结果
            try:
                # 先尝试直接解析JSON
                emotion_result = json.loads(response_text)
                return emotion_result
            except json.JSONDecodeError:
                # 如果直接解析失败，尝试提取JSON部分
                try:
                    # 查找JSON格式的内容
                    import re
                    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                    if json_match:
                        json_str = json_match.group()
                        emotion_result = json.loads(json_str)
                        return emotion_result
                    else:
                        # 如果没有找到JSON，进行基础文本分析
                        return self._basic_emotion_analysis(response_text)
                except:
                    # 如果解析仍然失败，返回基础分析结果
                    logger.warning("AI情绪分析返回格式异常，使用基础分析")
                    return {
                        "dominant_emotion": "neutral",
                        "intensity": 0.5,
                        "confidence": 0.3,
                        "error": "AI分析格式异常"
                    }
                
        except Exception as e:
            logger.error(f"AI情绪分析失败: {str(e)}")
            return {
                "dominant_emotion": "neutral",
                "intensity": 0.5,
                "confidence": 0.2,
                "error": str(e)
            }
    
    def _basic_emotion_analysis(self, text: str) -> Dict[str, Any]:
        """基础文本情绪分析"""
        text_lower = text.lower()
        
        # 简单的关键词匹配
        if any(word in text_lower for word in ['悲伤', '沮丧', '难过', '抑郁', '绝望']):
            return {
                "dominant_emotion": "sadness",
                "intensity": 0.7,
                "confidence": 0.6,
                "source": "keyword_analysis"
            }
        elif any(word in text_lower for word in ['焦虑', '紧张', '担心', '恐惧', '害怕']):
            return {
                "dominant_emotion": "anxiety", 
                "intensity": 0.6,
                "confidence": 0.6,
                "source": "keyword_analysis"
            }
        elif any(word in text_lower for word in ['愤怒', '生气', '愤慨', '恼火']):
            return {
                "dominant_emotion": "anger",
                "intensity": 0.6,
                "confidence": 0.6,
                "source": "keyword_analysis"
            }
        elif any(word in text_lower for word in ['开心', '高兴', '快乐', '喜悦']):
            return {
                "dominant_emotion": "happiness",
                "intensity": 0.6,
                "confidence": 0.6,
                "source": "keyword_analysis"
            }
        else:
            return {
                "dominant_emotion": "neutral",
                "intensity": 0.5,
                "confidence": 0.4,
                "source": "default_analysis"
            }

    async def test_connection(self) -> Dict[str, Any]:
        """测试AI服务连接"""
        
        test_results = {
            "http_connection": False,
            "websocket_connection": False,
            "error_messages": []
        }
        
        # 测试HTTP连接
        try:
            test_messages = [{"role": "user", "content": "这是一个连接测试，请简单回复。"}]
            result = await self.chat_completion_http(test_messages, max_tokens=50)
            
            if "choices" in result:
                test_results["http_connection"] = True
                test_results["http_response"] = result["choices"][0]["message"]["content"]
            
        except Exception as e:
            test_results["error_messages"].append(f"HTTP连接失败: {str(e)}")
        
        # 测试WebSocket连接
        try:
            test_messages = [{"role": "user", "content": "WebSocket连接测试"}]
            response_parts = []
            
            async for chunk in self.chat_completion_websocket(test_messages):
                response_parts.append(chunk)
                if len(response_parts) >= 5:  # 限制测试长度
                    break
            
            if response_parts:
                test_results["websocket_connection"] = True
                test_results["websocket_response"] = "".join(response_parts)
                
        except Exception as e:
            test_results["error_messages"].append(f"WebSocket连接失败: {str(e)}")
        
        return test_results


# 全局实例
xfyun_ai_service = XFYunAIService()

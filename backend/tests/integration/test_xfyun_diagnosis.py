#!/usr/bin/env python3
"""
科大讯飞AI服务诊断脚本
iFlytek AI Service Diagnosis Script
"""

import asyncio
import aiohttp
import json
from datetime import datetime
from loguru import logger

class XFYunDiagnosis:
    """科大讯飞诊断工具"""
    
    def __init__(self):
        # HTTP接口配置
        self.http_api_key = "EzKgmeawIpXfiarncVSA:iIslfPOGbFKAvraGyOCr"
        self.http_base_url = "https://spark-api-open.xf-yun.com/v2"
        self.default_model = "x1"
    
    async def test_http_connection(self):
        """测试HTTP连接"""
        print("🔗 测试HTTP连接...")
        
        try:
            url = f"{self.http_base_url}/chat/completions"
            
            headers = {
                "Authorization": f"Bearer {self.http_api_key}",
                "Content-Type": "application/json"
            }
            
            # 简单测试消息
            payload = {
                "model": self.default_model,
                "messages": [
                    {"role": "user", "content": "你好"}
                ],
                "max_tokens": 50,
                "temperature": 0.7,
                "stream": False,
                "user": "test_user"
            }
            
            print(f"📡 请求URL: {url}")
            print(f"🔑 Authorization: Bearer {self.http_api_key[:20]}...")
            print(f"📦 请求体: {json.dumps(payload, indent=2, ensure_ascii=False)}")
            
            timeout = aiohttp.ClientTimeout(total=30)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    print(f"📊 响应状态: {response.status}")
                    print(f"📋 响应头: {dict(response.headers)}")
                    
                    response_text = await response.text()
                    print(f"📄 响应内容: {response_text}")
                    
                    if response.status == 200:
                        result = json.loads(response_text)
                        print("✅ HTTP连接测试成功！")
                        return True, result
                    else:
                        print(f"❌ HTTP连接测试失败: {response.status}")
                        return False, response_text
                        
        except Exception as e:
            print(f"💥 HTTP连接异常: {str(e)}")
            return False, str(e)
    
    async def test_network_connectivity(self):
        """测试网络连通性"""
        print("🌐 测试网络连通性...")
        
        try:
            # 测试基础连通性
            async with aiohttp.ClientSession() as session:
                async with session.get("https://www.baidu.com", timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        print("✅ 基础网络连通性正常")
                    else:
                        print(f"⚠️ 基础网络连通性异常: {response.status}")
                
                # 测试科大讯飞域名解析
                try:
                    async with session.get("https://spark-api-open.xf-yun.com", timeout=aiohttp.ClientTimeout(total=10)) as response:
                        print(f"✅ 科大讯飞域名可访问: {response.status}")
                except Exception as e:
                    print(f"❌ 科大讯飞域名访问异常: {str(e)}")
                    
        except Exception as e:
            print(f"💥 网络连通性测试异常: {str(e)}")
    
    async def test_api_key_format(self):
        """测试API密钥格式"""
        print("🔑 测试API密钥格式...")
        
        api_key = self.http_api_key
        print(f"API Key: {api_key}")
        print(f"长度: {len(api_key)}")
        
        if ":" in api_key:
            parts = api_key.split(":")
            print(f"格式: 用户名:密码 ({len(parts[0])}:{len(parts[1])})")
            print("✅ API密钥格式看起来正确")
        else:
            print("⚠️ API密钥格式可能不正确，应该是 username:password 格式")
    
    async def run_diagnosis(self):
        """运行完整诊断"""
        print("🩺 开始科大讯飞AI服务诊断...")
        print("=" * 50)
        
        # 测试API密钥格式
        await self.test_api_key_format()
        print()
        
        # 测试网络连通性
        await self.test_network_connectivity()
        print()
        
        # 测试HTTP连接
        success, result = await self.test_http_connection()
        print()
        
        print("=" * 50)
        if success:
            print("🎉 诊断完成：科大讯飞AI服务可正常使用！")
        else:
            print("⚠️ 诊断完成：发现问题需要修复")
            print("建议检查：")
            print("1. API密钥是否有效")
            print("2. 网络连接是否正常")
            print("3. 防火墙设置")
            print("4. 科大讯飞服务状态")

async def main():
    """主函数"""
    diagnosis = XFYunDiagnosis()
    await diagnosis.run_diagnosis()

if __name__ == "__main__":
    asyncio.run(main())


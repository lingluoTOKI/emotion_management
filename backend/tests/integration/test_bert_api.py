"""
BERT API快速测试脚本
Quick test script for BERT API endpoints
"""

import requests
import json
import time

# API基础URL
BASE_URL = "http://localhost:8000"

def test_bert_api():
    """测试BERT API接口"""
    
    print("🚀 开始测试BERT API接口...")
    
    # 测试数据
    test_texts = [
        "我最近感觉很焦虑，学习压力好大，不知道该怎么办。",
        "今天心情不错，和朋友一起玩得很开心。",
        "我觉得我可能有点抑郁了，每天都很难过。"
    ]
    
    # 1. 测试服务状态
    print("\n📊 测试服务状态:")
    try:
        response = requests.get(f"{BASE_URL}/api/bert/status")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ 状态检查成功")
            print(f"   📈 可用性: {data['data']['available']}")
            print(f"   🔧 模式: {data['data']['mode']}")
            print(f"   📚 支持功能: {len(data['data']['supported_features'])} 项")
        else:
            print(f"   ❌ 状态检查失败: {response.status_code}")
    except Exception as e:
        print(f"   ❌ 连接失败: {e}")
        return
    
    # 2. 测试情感分析
    print("\n😊 测试情感分析:")
    for i, text in enumerate(test_texts, 1):
        try:
            response = requests.post(
                f"{BASE_URL}/api/bert/emotion-analysis",
                json={"text": text}
            )
            if response.status_code == 200:
                data = response.json()
                emotion_data = data['data']
                print(f"   文本 {i}: {text[:30]}...")
                print(f"   情感: {emotion_data['dominant_emotion']} (置信度: {emotion_data['confidence']:.2f})")
                print(f"   方法: {emotion_data['analysis_method']}")
            else:
                print(f"   ❌ 测试 {i} 失败: {response.status_code}")
        except Exception as e:
            print(f"   ❌ 测试 {i} 异常: {e}")
    
    # 3. 测试问题分类
    print("\n📋 测试问题分类:")
    for i, text in enumerate(test_texts, 1):
        try:
            response = requests.post(
                f"{BASE_URL}/api/bert/problem-classification",
                json={"text": text}
            )
            if response.status_code == 200:
                data = response.json()
                class_data = data['data']
                print(f"   文本 {i}: {text[:30]}...")
                print(f"   类型: {class_data['problem_type']} (置信度: {class_data['confidence']:.2f})")
                print(f"   方法: {class_data['analysis_method']}")
            else:
                print(f"   ❌ 测试 {i} 失败: {response.status_code}")
        except Exception as e:
            print(f"   ❌ 测试 {i} 异常: {e}")
    
    # 4. 测试实体识别
    print("\n🏷️  测试实体识别:")
    test_text = "我是北京大学的学生张三，最近和室友李四发生了矛盾。"
    try:
        response = requests.post(
            f"{BASE_URL}/api/bert/entity-extraction",
            json={"text": test_text}
        )
        if response.status_code == 200:
            data = response.json()
            entities = data['data']['entities']
            print(f"   测试文本: {test_text}")
            print(f"   人名: {entities['persons']}")
            print(f"   组织: {entities['organizations']}")
            print(f"   关系: {entities['relationships']}")
        else:
            print(f"   ❌ 实体识别失败: {response.status_code}")
    except Exception as e:
        print(f"   ❌ 实体识别异常: {e}")
    
    # 5. 测试文本相似度
    print("\n🔗 测试文本相似度:")
    try:
        response = requests.post(
            f"{BASE_URL}/api/bert/text-similarity",
            json={
                "text1": test_texts[0],
                "text2": test_texts[2]
            }
        )
        if response.status_code == 200:
            data = response.json()
            sim_data = data['data']
            print(f"   文本1: {test_texts[0][:30]}...")
            print(f"   文本2: {test_texts[2][:30]}...")
            print(f"   相似度: {sim_data['similarity_score']:.2f}")
            print(f"   是否相似: {sim_data['is_similar']}")
        else:
            print(f"   ❌ 相似度测试失败: {response.status_code}")
    except Exception as e:
        print(f"   ❌ 相似度测试异常: {e}")
    
    # 6. 测试综合分析
    print("\n🎯 测试综合分析:")
    try:
        response = requests.post(
            f"{BASE_URL}/api/bert/comprehensive-analysis",
            json={"text": test_texts[0]}
        )
        if response.status_code == 200:
            data = response.json()
            comp_data = data['data']
            print(f"   测试文本: {test_texts[0][:30]}...")
            print(f"   情感分析: {comp_data['emotion_analysis']['dominant_emotion']}")
            print(f"   问题分类: {comp_data['problem_classification']['problem_type']}")
            print(f"   风险评估: {comp_data['risk_assessment']['risk_level']}")
            print(f"   分析方法: {comp_data['analysis_method']}")
        else:
            print(f"   ❌ 综合分析失败: {response.status_code}")
    except Exception as e:
        print(f"   ❌ 综合分析异常: {e}")
    
    # 7. 测试示例功能
    print("\n🧪 测试示例功能:")
    try:
        response = requests.post(f"{BASE_URL}/api/bert/test-with-sample")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ 示例测试成功")
            print(f"   📊 包含功能: {len(data['data'])} 项")
            print(f"   🔍 分析器状态: {data['data']['analyzer_status']['available']}")
        else:
            print(f"   ❌ 示例测试失败: {response.status_code}")
    except Exception as e:
        print(f"   ❌ 示例测试异常: {e}")
    
    print("\n🎉 BERT API测试完成!")

def check_server():
    """检查服务器是否运行"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

if __name__ == "__main__":
    print("🔍 检查后端服务状态...")
    
    if check_server():
        print("✅ 后端服务正在运行")
        test_bert_api()
    else:
        print("❌ 后端服务未运行")
        print("请先启动后端服务：")
        print("   cd backend")
        print("   python main.py")
        print("\n或者使用虚拟环境：")
        print("   cd backend")
        print("   venv\\Scripts\\activate")
        print("   python main.py")

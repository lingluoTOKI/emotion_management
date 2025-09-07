
#!/usr/bin/env python3
"""
测试登录API
Test login API
"""

import requests

def test_login_api():
    """测试登录API"""
    
    print("🧪 测试登录API...")
    
    url = "http://localhost:8000/api/auth/login"
    
    # 测试正确的表单数据格式
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    data = {
        'username': 'student1',
        'password': '123456'
    }
    
    try:
        response = requests.post(url, headers=headers, data=data)
        print(f"📝 登录测试结果: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 登录成功!")
            print(f"   Token: {result.get('access_token', 'N/A')[:20]}...")
            print(f"   用户角色: {result.get('user_role', 'N/A')}")
            print(f"   用户名: {result.get('username', 'N/A')}")
        else:
            print(f"❌ 登录失败: {response.text}")
            
    except Exception as e:
        print(f"❌ 请求失败: {e}")
    
    # 测试错误的JSON格式
    print("\n🧪 测试错误的JSON格式...")
    headers_json = {
        'Content-Type': 'application/json'
    }
    data_json = {
        'username': 'student1',
        'password': '123456'
    }
    
    try:
        response = requests.post(url, headers=headers_json, json=data_json)
        print(f"📝 JSON格式测试结果: {response.status_code}")
        if response.status_code != 200:
            print(f"   预期的错误: {response.json().get('message', 'N/A')}")
    except Exception as e:
        print(f"❌ JSON测试失败: {e}")

if __name__ == "__main__":
    test_login_api()

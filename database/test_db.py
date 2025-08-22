"""
测试数据库连接
Test Database Connection
"""

from app.core.database import engine
from sqlalchemy import text

def test_connection():
    """测试数据库连接"""
    try:
        print("测试数据库连接...")
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ 数据库连接成功！")
            return True
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        return False

if __name__ == "__main__":
    test_connection()

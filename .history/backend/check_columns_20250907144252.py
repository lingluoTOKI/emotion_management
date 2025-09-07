#!/usr/bin/env python3
"""
检查数据库列名
"""

from app.core.database import engine
from sqlalchemy import text

def check_columns():
    conn = engine.connect()
    try:
        result = conn.execute(text('SHOW COLUMNS FROM users'))
        print('实际的数据库列:')
        for row in result:
            print(f'  {row[0]} - {row[1]}')
    finally:
        conn.close()

if __name__ == "__main__":
    check_columns()

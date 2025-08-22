-- 创建MySQL用户脚本
-- Create MySQL User Script

-- 创建数据库
CREATE DATABASE IF NOT EXISTS emotion_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（如果不存在）
CREATE USER IF NOT EXISTS 'emotion_user'@'localhost' IDENTIFIED BY 'emotion123';

-- 授予权限
GRANT ALL PRIVILEGES ON emotion_management.* TO 'emotion_user'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 显示创建的用户
SELECT User, Host FROM mysql.user WHERE User = 'emotion_user';

-- 显示数据库
SHOW DATABASES LIKE 'emotion_management';

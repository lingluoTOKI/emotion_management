-- 修复数据库字段名不一致问题
-- Fix database column name inconsistency

USE emotion_management;

-- 检查是否存在password_hash列
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'emotion_management'
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'password_hash'
);

-- 如果存在password_hash列但不存在hashed_password列，则重命名
SET @hashed_password_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'emotion_management'
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'hashed_password'
);

-- 如果password_hash存在但hashed_password不存在，则重命名列
DROP PROCEDURE IF EXISTS rename_column;
DELIMITER //
CREATE PROCEDURE rename_column()
BEGIN
    IF @column_exists > 0 AND @hashed_password_exists = 0 THEN
        ALTER TABLE users CHANGE COLUMN password_hash hashed_password varchar(255) NOT NULL;
        SELECT 'Column renamed from password_hash to hashed_password' AS message;
    ELSEIF @column_exists = 0 AND @hashed_password_exists > 0 THEN
        SELECT 'Column hashed_password already exists' AS message;
    ELSEIF @column_exists = 0 AND @hashed_password_exists = 0 THEN
        SELECT 'Neither column exists, please check your schema' AS message;
    ELSE
        SELECT 'Both columns exist, please check your schema' AS message;
    END IF;
END //
DELIMITER ;

CALL rename_column();
DROP PROCEDURE IF EXISTS rename_column;

-- 确保role字段的枚举值是大写
-- 检查数据库中的role字段类型
SELECT COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'emotion_management'
AND TABLE_NAME = 'users'
AND COLUMN_NAME = 'role';

-- 如果需要修改role字段的枚举值，可以使用以下语句
-- ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN','STUDENT','COUNSELOR') NOT NULL;

-- 查看用户表中的数据
SELECT id, username, email, role, is_active FROM users;

-- 简化测试版本数据库初始化脚本
-- 注意：此版本使用明文密码，仅用于开发测试！

SET FOREIGN_KEY_CHECKS = 0;

-- 删除现有表
DROP TABLE IF EXISTS `consultation_records`;
DROP TABLE IF EXISTS `assessments`;
DROP TABLE IF EXISTS `counselors`;
DROP TABLE IF EXISTS `students`;
DROP TABLE IF EXISTS `admins`;
DROP TABLE IF EXISTS `users`;

-- 创建用户表（简化版）
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `email` varchar(100) DEFAULT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `role` enum('ADMIN','STUDENT','COUNSELOR') NOT NULL DEFAULT 'STUDENT',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_username` (`username`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入测试用户数据（明文密码）
INSERT IGNORE INTO `users` (`username`, `hashed_password`, `role`, `email`) VALUES
('admin1', '123456', 'ADMIN', 'admin@example.com'),
('counselor1', '123456', 'COUNSELOR', 'counselor1@example.com'),
('student1', '123456', 'STUDENT', 'student1@example.com');

-- 注意：上述密码是明文的 "123456"，仅用于测试！

SET FOREIGN_KEY_CHECKS = 1;

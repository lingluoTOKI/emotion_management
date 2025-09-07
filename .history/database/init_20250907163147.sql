-- 情绪管理系统数据库初始化脚本
-- Emotion Management System Database Initialization Script

-- 创建数据库
CREATE DATABASE IF NOT EXISTS emotion_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE emotion_management;

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `email` varchar(100) NOT NULL UNIQUE,
  `hashed_password` varchar(255) NOT NULL,
  `role` enum('student','counselor','admin') NOT NULL DEFAULT 'student',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI咨询会话表
CREATE TABLE IF NOT EXISTS `ai_counseling_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `session_type` varchar(50) DEFAULT 'general',
  `status` enum('active','completed','terminated') DEFAULT 'active',
  `start_time` timestamp DEFAULT CURRENT_TIMESTAMP,
  `end_time` timestamp NULL DEFAULT NULL,
  `conversation_history` json DEFAULT NULL,
  `emotion_analysis` json DEFAULT NULL,
  `risk_assessment` json DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 心理评估表
CREATE TABLE IF NOT EXISTS `assessments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `assessment_type` varchar(50) NOT NULL,
  `questions` json DEFAULT NULL,
  `answers` json DEFAULT NULL,
  `results` json DEFAULT NULL,
  `status` enum('in_progress','completed','cancelled') DEFAULT 'in_progress',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_assessment_type` (`assessment_type`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 咨询预约表
CREATE TABLE IF NOT EXISTS `consultations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `counselor_id` int NOT NULL,
  `appointment_time` timestamp NOT NULL,
  `duration` int DEFAULT 60,
  `consultation_type` enum('online','offline','phone') DEFAULT 'online',
  `status` enum('scheduled','confirmed','completed','cancelled','no_show') DEFAULT 'scheduled',
  `notes` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_counselor_id` (`counselor_id`),
  KEY `idx_appointment_time` (`appointment_time`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`counselor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入测试用户数据
INSERT IGNORE INTO `users` (`username`, `hashed_password`, `role`, `real_name`, `email`) VALUES
('admin1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsHBXMxrW', 'admin', '系统管理员', 'admin@example.com'),
('counselor1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsHBXMxrW', 'counselor', '心理咨询师', 'counselor1@example.com'),
('student1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsHBXMxrW', 'student', '学生用户', 'student1@example.com');

-- 注意：上述密码hash对应的明文密码都是 "123456"

SET FOREIGN_KEY_CHECKS = 1;
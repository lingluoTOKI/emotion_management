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

-- 管理员表
CREATE TABLE IF NOT EXISTS `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL UNIQUE,
  `name` varchar(100) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 学生表
CREATE TABLE IF NOT EXISTS `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL UNIQUE,
  `student_id` varchar(20) NOT NULL UNIQUE,
  `name` varchar(100) NOT NULL,
  `major` varchar(100) DEFAULT NULL,
  `grade` varchar(20) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `emergency_contact` varchar(100) DEFAULT NULL,
  `emergency_phone` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_student_id` (`student_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 心理咨询师表
CREATE TABLE IF NOT EXISTS `counselors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL UNIQUE,
  `name` varchar(100) NOT NULL,
  `school` enum('认知行为疗法','精神分析','人本主义','系统家庭治疗','格式塔疗法','其他') NOT NULL,
  `description` text DEFAULT NULL,
  `specialties` text DEFAULT NULL,
  `experience_years` int DEFAULT NULL,
  `is_counselor` tinyint(1) DEFAULT 1,
  `is_available` tinyint(1) DEFAULT 1,
  `phone` varchar(20) DEFAULT NULL,
  `office_location` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI咨询会话表
CREATE TABLE IF NOT EXISTS `ai_counseling_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `session_type` varchar(50) DEFAULT 'text',
  `start_time` timestamp DEFAULT CURRENT_TIMESTAMP,
  `end_time` timestamp NULL DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active',
  `conversation_history` json DEFAULT NULL,
  `emotion_analysis` json DEFAULT NULL,
  `risk_assessment` json DEFAULT NULL,
  `intervention_suggestions` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 心理评估表
CREATE TABLE IF NOT EXISTS `assessments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `assessment_type` varchar(50) NOT NULL,
  `start_time` timestamp DEFAULT CURRENT_TIMESTAMP,
  `end_time` timestamp NULL DEFAULT NULL,
  `status` varchar(50) DEFAULT 'in_progress',
  `total_score` float DEFAULT NULL,
  `risk_level` varchar(50) DEFAULT NULL,
  `keywords` json DEFAULT NULL,
  `emotion_trend` json DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_assessment_type` (`assessment_type`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 评估记录表
CREATE TABLE IF NOT EXISTS `assessment_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assessment_id` int NOT NULL,
  `question_id` varchar(50) DEFAULT NULL,
  `question_text` text DEFAULT NULL,
  `answer_text` text DEFAULT NULL,
  `answer_score` float DEFAULT NULL,
  `emotion_score` float DEFAULT NULL,
  `timestamp` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_assessment_id` (`assessment_id`),
  FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 情绪记录表
CREATE TABLE IF NOT EXISTS `emotion_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assessment_id` int NOT NULL,
  `timestamp` timestamp DEFAULT CURRENT_TIMESTAMP,
  `depression_index` float DEFAULT NULL,
  `anxiety_index` float DEFAULT NULL,
  `stress_index` float DEFAULT NULL,
  `overall_mood` float DEFAULT NULL,
  `dominant_emotion` varchar(50) DEFAULT NULL,
  `emotion_intensity` float DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_assessment_id` (`assessment_id`),
  FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 咨询记录表
CREATE TABLE IF NOT EXISTS `consultations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `counselor_id` int NOT NULL,
  `consultation_type` enum('face_to_face','online','phone') NOT NULL,
  `status` enum('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
  `scheduled_time` timestamp NOT NULL,
  `duration` int DEFAULT 60,
  `notes` text DEFAULT NULL,
  `student_feedback` tinyint(1) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_counselor_id` (`counselor_id`),
  KEY `idx_scheduled_time` (`scheduled_time`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`counselor_id`) REFERENCES `counselors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 咨询过程记录表
CREATE TABLE IF NOT EXISTS `consultation_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `consultation_id` int NOT NULL,
  `record_type` varchar(50) DEFAULT NULL,
  `content` text NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_consultation_id` (`consultation_id`),
  FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 预约表
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `counselor_id` int NOT NULL,
  `preferred_time` timestamp NOT NULL,
  `alternative_time` timestamp DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `urgency_level` int DEFAULT 1,
  `status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_counselor_id` (`counselor_id`),
  KEY `idx_preferred_time` (`preferred_time`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`counselor_id`) REFERENCES `counselors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 风险评估表
CREATE TABLE IF NOT EXISTS `risk_assessments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `risk_type` varchar(50) DEFAULT NULL,
  `risk_level` varchar(50) DEFAULT NULL,
  `risk_score` float DEFAULT NULL,
  `risk_indicators` json DEFAULT NULL,
  `intervention_required` tinyint(1) DEFAULT 0,
  `counselor_notified` tinyint(1) DEFAULT 0,
  `notification_sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_risk_level` (`risk_level`),
  FOREIGN KEY (`session_id`) REFERENCES `ai_counseling_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入测试用户数据
INSERT IGNORE INTO `users` (`username`, `email`, `hashed_password`, `role`) VALUES
('admin', 'admin@emotion.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsHBXMxrW', 'admin'),
('counselor1', 'counselor1@emotion.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsHBXMxrW', 'counselor'),
('counselor2', 'counselor2@emotion.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsHBXMxrW', 'counselor'),
('student1', 'student1@emotion.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsHBXMxrW', 'student'),
('student2', 'student2@emotion.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsHBXMxrW', 'student'),
('student3', 'student3@emotion.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsHBXMxrW', 'student');

-- 插入管理员信息
INSERT IGNORE INTO `admins` (`user_id`, `name`, `department`, `phone`) VALUES
(1, '系统管理员', '信息技术部', '13800138000');

-- 插入咨询师信息
INSERT IGNORE INTO `counselors` (`user_id`, `name`, `school`, `description`, `specialties`, `experience_years`, `phone`, `office_location`) VALUES
(2, '张心理咨询师', '认知行为疗法', '专注于认知行为疗法，擅长处理焦虑和抑郁问题', '焦虑症,抑郁症,压力管理', 8, '13800138001', '心理咨询中心A101'),
(3, '李心理咨询师', '人本主义', '采用人本主义疗法，注重个人成长和自我实现', '人际关系,自我认知,成长咨询', 5, '13800138002', '心理咨询中心B201');

-- 插入学生信息
INSERT IGNORE INTO `students` (`user_id`, `student_id`, `name`, `major`, `grade`, `phone`, `emergency_contact`, `emergency_phone`) VALUES
(4, '2024001', '王同学', '计算机科学与技术', '大二', '13800138003', '王父', '13900139001'),
(5, '2024002', '李同学', '心理学', '大三', '13800138004', '李母', '13900139002'),
(6, '2024003', '张同学', '软件工程', '大一', '13800138005', '张父', '13900139003');

-- 插入示例评估数据
INSERT IGNORE INTO `assessments` (`student_id`, `assessment_type`, `status`, `total_score`, `risk_level`, `keywords`, `emotion_trend`) VALUES
(1, 'PHQ-9', 'completed', 12.5, 'moderate', '["焦虑", "压力", "学习"]', '{"depression": 0.6, "anxiety": 0.7, "stress": 0.8}'),
(2, 'GAD-7', 'completed', 8.0, 'mild', '["担心", "紧张", "未来"]', '{"depression": 0.3, "anxiety": 0.5, "stress": 0.4}'),
(3, 'comprehensive', 'in_progress', NULL, NULL, NULL, NULL);

-- 插入示例咨询预约
INSERT IGNORE INTO `consultations` (`student_id`, `counselor_id`, `consultation_type`, `status`, `scheduled_time`, `duration`, `notes`) VALUES
(1, 1, 'online', 'scheduled', '2024-02-15 14:00:00', 60, '学生主动预约，希望讨论学习压力问题'),
(2, 2, 'face_to_face', 'completed', '2024-02-10 10:00:00', 60, '咨询完成，学生反馈良好');

-- 插入示例AI咨询会话
INSERT IGNORE INTO `ai_counseling_sessions` (`student_id`, `session_type`, `status`, `conversation_history`, `emotion_analysis`, `risk_assessment`) VALUES
(1, 'text', 'completed', '{"messages": [{"role": "user", "content": "最近学习压力很大"}, {"role": "assistant", "content": "我理解你的感受，能具体说说是什么让你感到压力吗？"}]}', '{"dominant_emotion": "焦虑", "intensity": 0.7}', '{"level": "low", "indicators": ["学习压力"]}'),
(2, 'text', 'active', '{"messages": [{"role": "user", "content": "我有点担心未来"}]}', '{"dominant_emotion": "担心", "intensity": 0.5}', '{"level": "low", "indicators": ["未来担忧"]}');

-- 注意：上述密码hash对应的明文密码都是 "123456"
-- 测试账号信息：
-- 管理员: admin / 123456
-- 咨询师: counselor1 / 123456, counselor2 / 123456  
-- 学生: student1 / 123456, student2 / 123456, student3 / 123456

SET FOREIGN_KEY_CHECKS = 1;
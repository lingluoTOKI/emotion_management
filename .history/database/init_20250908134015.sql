-- 情绪管理系统数据库初始化脚本
-- Emotion Management System Database Initialization Script

-- 使用数据库
USE emotion_management;

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `role` enum('admin','student','counselor') NOT NULL DEFAULT 'student',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_username` (`username`),
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
  UNIQUE KEY `student_id` (`student_id`),
  KEY `ix_students_id` (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 心理咨询师表
CREATE TABLE IF NOT EXISTS `counselors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL UNIQUE,
  `name` varchar(100) NOT NULL,
  `school` enum('COGNITIVE_BEHAVIORAL','PSYCHOANALYTIC','HUMANISTIC','SYSTEMIC','GESTALT','OTHER') NOT NULL,
  `description` text DEFAULT NULL,
  `specialties` text DEFAULT NULL,
  `experience_years` int DEFAULT NULL,
  `is_counselor` tinyint(1) DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `office_location` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_counselors_id` (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 心理评估表
CREATE TABLE IF NOT EXISTS `assessments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `assessment_type` varchar(50) NOT NULL,
  `start_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `end_time` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `total_score` float DEFAULT NULL,
  `risk_level` varchar(50) DEFAULT NULL,
  `keywords` json DEFAULT NULL,
  `emotion_trend` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `ix_assessments_id` (`id`),
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 评估记录表
CREATE TABLE IF NOT EXISTS `assessment_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assessment_id` int NOT NULL,
  `question_id` varchar(50) DEFAULT NULL,
  `question_text` text,
  `answer_text` text,
  `answer_score` float DEFAULT NULL,
  `emotion_score` float DEFAULT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `assessment_id` (`assessment_id`),
  KEY `ix_assessment_records_id` (`id`),
  FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 情绪记录表
CREATE TABLE IF NOT EXISTS `emotion_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assessment_id` int NOT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `depression_index` float DEFAULT NULL,
  `anxiety_index` float DEFAULT NULL,
  `stress_index` float DEFAULT NULL,
  `overall_mood` float DEFAULT NULL,
  `dominant_emotion` varchar(50) DEFAULT NULL,
  `emotion_intensity` float DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assessment_id` (`assessment_id`),
  KEY `ix_emotion_records_id` (`id`),
  FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 咨询记录表
CREATE TABLE IF NOT EXISTS `consultations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `counselor_id` int NOT NULL,
  `consultation_type` enum('FACE_TO_FACE','ONLINE','PHONE') NOT NULL,
  `status` enum('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED') DEFAULT NULL,
  `scheduled_time` datetime NOT NULL,
  `duration` int DEFAULT NULL,
  `notes` text,
  `student_feedback` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `counselor_id` (`counselor_id`),
  KEY `ix_consultations_id` (`id`),
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  FOREIGN KEY (`counselor_id`) REFERENCES `counselors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 咨询过程记录表
CREATE TABLE IF NOT EXISTS `consultation_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `consultation_id` int NOT NULL,
  `record_type` varchar(50) DEFAULT NULL,
  `content` text NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 预约表
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `counselor_id` int NOT NULL,
  `preferred_time` datetime NOT NULL,
  `alternative_time` datetime DEFAULT NULL,
  `reason` text,
  `urgency_level` int DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `counselor_id` (`counselor_id`),
  KEY `ix_appointments_id` (`id`),
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  FOREIGN KEY (`counselor_id`) REFERENCES `counselors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI咨询会话表
CREATE TABLE IF NOT EXISTS `ai_counseling_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `session_type` varchar(50) DEFAULT NULL,
  `start_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `end_time` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `conversation_history` json DEFAULT NULL,
  `emotion_analysis` json DEFAULT NULL,
  `risk_assessment` json DEFAULT NULL,
  `intervention_suggestions` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `ix_ai_counseling_sessions_id` (`id`),
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 风险评估表
CREATE TABLE IF NOT EXISTS `risk_assessments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `risk_type` varchar(50) DEFAULT NULL,
  `risk_level` varchar(50) DEFAULT NULL,
  `risk_score` float DEFAULT NULL,
  `risk_indicators` json DEFAULT NULL,
  `intervention_required` tinyint(1) DEFAULT NULL,
  `counselor_notified` tinyint(1) DEFAULT NULL,
  `notification_sent_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  KEY `ix_risk_assessments_id` (`id`),
  FOREIGN KEY (`session_id`) REFERENCES `ai_counseling_sessions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 匿名消息表
CREATE TABLE IF NOT EXISTS `anonymous_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_identifier` varchar(100) NOT NULL,
  `message_type` varchar(50) DEFAULT NULL,
  `content` text NOT NULL,
  `emotion_analysis` json DEFAULT NULL,
  `risk_level` varchar(50) DEFAULT NULL,
  `is_urgent` tinyint(1) DEFAULT NULL,
  `counselor_assigned` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_anonymous_messages_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 匿名聊天表
CREATE TABLE IF NOT EXISTS `anonymous_chats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message_id` int NOT NULL,
  `counselor_id` int NOT NULL,
  `chat_session_id` varchar(100) DEFAULT NULL,
  `start_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `end_time` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `conversation_history` json DEFAULT NULL,
  `risk_assessment` json DEFAULT NULL,
  `intervention_required` tinyint(1) DEFAULT NULL,
  `student_location` varchar(200) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chat_session_id` (`chat_session_id`),
  KEY `message_id` (`message_id`),
  KEY `counselor_id` (`counselor_id`),
  KEY `ix_anonymous_chats_id` (`id`),
  FOREIGN KEY (`message_id`) REFERENCES `anonymous_messages` (`id`),
  FOREIGN KEY (`counselor_id`) REFERENCES `counselors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入测试用户数据（与init_db.py保持一致）
INSERT IGNORE INTO `users` (`username`, `email`, `hashed_password`, `role`) VALUES
('admin', 'admin@example.com', '123456', 'admin'),
('counselor1', 'counselor1@example.com', '123456', 'counselor'),
('counselor2', 'counselor2@example.com', '123456', 'counselor'),
('counselor3', 'counselor3@example.com', '123456', 'counselor'),
('student1', 'student1@example.com', '123456', 'student'),
('student2', 'student2@example.com', '123456', 'student'),
('student3', 'student3@example.com', '123456', 'student'),
('student4', 'student4@example.com', '123456', 'student');

-- 插入管理员数据
INSERT IGNORE INTO `admins` (`user_id`, `name`, `department`, `phone`) VALUES
(1, '系统管理员', '信息技术部', '13800138000');

-- 插入咨询师数据
INSERT IGNORE INTO `counselors` (`user_id`, `name`, `school`, `description`, `specialties`, `experience_years`, `phone`, `office_location`) VALUES
(2, '张心理咨询师', 'COGNITIVE_BEHAVIORAL', '专注于认知行为疗法，擅长处理焦虑和抑郁问题', '焦虑症,抑郁症,压力管理', 8, '13800138001', '心理咨询中心A101'),
(3, '李心理咨询师', 'HUMANISTIC', '采用人本主义疗法，注重个人成长和自我实现', '人际关系,自我认知,成长咨询', 5, '13800138002', '心理咨询中心B201'),
(4, '陈心理咨询师', 'PSYCHOANALYTIC', '精神分析专家，擅长深度心理分析', '创伤治疗,人格障碍,深度分析', 12, '13800138005', '心理咨询中心C301');

-- 插入学生数据
INSERT IGNORE INTO `students` (`user_id`, `student_id`, `name`, `major`, `grade`, `phone`, `emergency_contact`, `emergency_phone`) VALUES
(5, '2024001', '王同学', '计算机科学与技术', '大二', '13800138003', '王父', '13900139001'),
(6, '2024002', '李同学', '心理学', '大三', '13800138004', '李母', '13900139002'),
(7, '2024003', '张同学', '工商管理', '大一', '13800138006', '张母', '13900139003'),
(8, '2024004', '刘同学', '临床医学', '大四', '13800138007', '刘父', '13900139004');

-- 插入心理评估数据
INSERT IGNORE INTO `assessments` (`student_id`, `assessment_type`, `status`, `total_score`, `risk_level`, `keywords`, `emotion_trend`, `end_time`) VALUES
(1, 'PHQ9', 'completed', 12.0, 'moderate', '["焦虑", "失眠", "压力"]', '{"depression": 0.6, "anxiety": 0.7, "stress": 0.8}', NOW() - INTERVAL 1 DAY),
(2, 'GAD7', 'completed', 8.0, 'low', '["轻度焦虑", "学习压力"]', '{"depression": 0.3, "anxiety": 0.4, "stress": 0.5}', NOW() - INTERVAL 2 DAY);

-- 插入咨询预约数据
INSERT IGNORE INTO `consultations` (`student_id`, `counselor_id`, `consultation_type`, `status`, `scheduled_time`, `duration`, `notes`, `student_feedback`) VALUES
(1, 1, 'ONLINE', 'SCHEDULED', NOW() + INTERVAL 1 DAY + INTERVAL 14 HOUR, 60, '学生主动预约，主要关注焦虑问题', NULL),
(2, 2, 'FACE_TO_FACE', 'COMPLETED', NOW() - INTERVAL 3 DAY - INTERVAL 10 HOUR, 60, '咨询效果良好，学生情绪有所改善', 1);

-- 插入AI咨询会话数据
INSERT IGNORE INTO `ai_counseling_sessions` (`student_id`, `session_type`, `status`, `end_time`, `conversation_history`, `emotion_analysis`, `risk_assessment`, `intervention_suggestions`) VALUES
(1, 'text', 'completed', NOW() - INTERVAL 2 HOUR, 
'[{"role": "user", "content": "我最近感觉很焦虑，睡不着觉"}, {"role": "assistant", "content": "我理解你的感受，焦虑和失眠确实很困扰人。能告诉我具体是什么让你感到焦虑吗？"}]',
'{"anxiety": 0.8, "depression": 0.3, "stress": 0.7}',
'{"level": "moderate", "indicators": ["失眠", "焦虑"]}',
'建议进行深度咨询，关注睡眠质量改善');

-- 插入风险评估数据
INSERT IGNORE INTO `risk_assessments` (`session_id`, `risk_type`, `risk_level`, `risk_score`, `risk_indicators`, `intervention_required`, `counselor_notified`, `notification_sent_at`) VALUES
(1, 'anxiety', 'moderate', 0.7, '["失眠", "焦虑", "压力"]', 1, 1, NOW() - INTERVAL 1 HOUR);

-- 插入匿名消息数据
INSERT IGNORE INTO `anonymous_messages` (`student_identifier`, `message_type`, `content`, `emotion_analysis`, `risk_level`, `is_urgent`, `counselor_assigned`) VALUES
('anon_001', 'text', '我最近压力很大，不知道该怎么办', '{"stress": 0.8, "anxiety": 0.6}', 'moderate', 0, 1);

-- 插入匿名聊天数据
INSERT IGNORE INTO `anonymous_chats` (`message_id`, `counselor_id`, `chat_session_id`, `status`, `conversation_history`, `risk_assessment`, `intervention_required`) VALUES
(1, 1, 'chat_001', 'active', 
'[{"role": "student", "content": "我最近压力很大，不知道该怎么办"}, {"role": "counselor", "content": "我理解你的感受，能具体说说是什么让你感到压力吗？"}]',
'{"level": "moderate", "type": "stress"}', 0);

-- 注意：上述密码均为明文存储，便于测试使用

SET FOREIGN_KEY_CHECKS = 1;
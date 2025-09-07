-- 情绪管理系统数据库部署脚本
-- Emotion Management System Database Deployment Script
-- 版本: 2.0
-- 创建时间: 2025-01-07

-- 设置MySQL配置
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- 创建数据库
CREATE DATABASE IF NOT EXISTS emotion_management 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE emotion_management;

-- =============================================
-- 用户相关表
-- =============================================

-- 用户表
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE COMMENT '用户名',
  `email` varchar(100) NOT NULL UNIQUE COMMENT '邮箱',
  `hashed_password` varchar(255) NOT NULL COMMENT '加密密码',
  `role` enum('student','counselor','admin') NOT NULL DEFAULT 'student' COMMENT '用户角色',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '是否激活',
  `last_login` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`),
  UNIQUE KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基础信息表';

-- 管理员表
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL UNIQUE COMMENT '关联用户ID',
  `name` varchar(100) NOT NULL COMMENT '真实姓名',
  `department` varchar(100) DEFAULT NULL COMMENT '部门',
  `position` varchar(100) DEFAULT NULL COMMENT '职位',
  `phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `permissions` json DEFAULT NULL COMMENT '权限配置',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_id` (`user_id`),
  KEY `idx_department` (`department`),
  CONSTRAINT `fk_admins_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员信息表';

-- 学生表
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL UNIQUE COMMENT '关联用户ID',
  `student_id` varchar(20) NOT NULL UNIQUE COMMENT '学号',
  `name` varchar(100) NOT NULL COMMENT '真实姓名',
  `major` varchar(100) DEFAULT NULL COMMENT '专业',
  `grade` varchar(20) DEFAULT NULL COMMENT '年级',
  `class_name` varchar(50) DEFAULT NULL COMMENT '班级',
  `phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `emergency_contact` varchar(100) DEFAULT NULL COMMENT '紧急联系人',
  `emergency_phone` varchar(20) DEFAULT NULL COMMENT '紧急联系电话',
  `dormitory` varchar(100) DEFAULT NULL COMMENT '宿舍信息',
  `birth_date` date DEFAULT NULL COMMENT '出生日期',
  `gender` enum('male','female','other') DEFAULT NULL COMMENT '性别',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_id` (`user_id`),
  UNIQUE KEY `idx_student_id` (`student_id`),
  KEY `idx_major` (`major`),
  KEY `idx_grade` (`grade`),
  CONSTRAINT `fk_students_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生信息表';

-- 心理咨询师表
DROP TABLE IF EXISTS `counselors`;
CREATE TABLE `counselors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL UNIQUE COMMENT '关联用户ID',
  `name` varchar(100) NOT NULL COMMENT '真实姓名',
  `school` enum('认知行为疗法','精神分析','人本主义','系统家庭治疗','格式塔疗法','其他') NOT NULL COMMENT '治疗学派',
  `description` text DEFAULT NULL COMMENT '个人简介',
  `specialties` text DEFAULT NULL COMMENT '专业领域',
  `experience_years` int DEFAULT NULL COMMENT '从业年限',
  `education` varchar(200) DEFAULT NULL COMMENT '教育背景',
  `certifications` text DEFAULT NULL COMMENT '资质证书',
  `is_counselor` tinyint(1) DEFAULT 1 COMMENT '是否在职咨询师',
  `is_available` tinyint(1) DEFAULT 1 COMMENT '是否可预约',
  `phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `office_location` varchar(200) DEFAULT NULL COMMENT '办公地点',
  `working_hours` json DEFAULT NULL COMMENT '工作时间配置',
  `max_clients_per_day` int DEFAULT 8 COMMENT '每日最大咨询人数',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_id` (`user_id`),
  KEY `idx_school` (`school`),
  KEY `idx_is_available` (`is_available`),
  CONSTRAINT `fk_counselors_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='心理咨询师信息表';

-- =============================================
-- AI咨询相关表
-- =============================================

-- AI咨询会话表
DROP TABLE IF EXISTS `ai_counseling_sessions`;
CREATE TABLE `ai_counseling_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` varchar(100) NOT NULL UNIQUE COMMENT '会话唯一标识',
  `student_id` int NOT NULL COMMENT '学生ID',
  `session_type` enum('assessment','counseling','crisis_intervention') DEFAULT 'counseling' COMMENT '会话类型',
  `start_time` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
  `end_time` timestamp NULL DEFAULT NULL COMMENT '结束时间',
  `status` enum('active','completed','cancelled','timeout') DEFAULT 'active' COMMENT '会话状态',
  `conversation_history` json DEFAULT NULL COMMENT '对话历史',
  `emotion_analysis` json DEFAULT NULL COMMENT '情感分析结果',
  `risk_assessment` json DEFAULT NULL COMMENT '风险评估结果',
  `easybert_analysis` json DEFAULT NULL COMMENT 'EasyBert分析结果',
  `dialogue_strategy` json DEFAULT NULL COMMENT '对话策略',
  `intervention_suggestions` text DEFAULT NULL COMMENT '干预建议',
  `session_summary` text DEFAULT NULL COMMENT '会话摘要',
  `total_messages` int DEFAULT 0 COMMENT '总消息数',
  `duration_minutes` int DEFAULT NULL COMMENT '会话时长(分钟)',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_session_id` (`session_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_status` (`status`),
  KEY `idx_session_type` (`session_type`),
  KEY `idx_start_time` (`start_time`),
  CONSTRAINT `fk_ai_sessions_student_id` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI咨询会话表';

-- =============================================
-- 心理评估相关表
-- =============================================

-- 心理评估表
DROP TABLE IF EXISTS `assessments`;
CREATE TABLE `assessments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL COMMENT '学生ID',
  `assessment_type` enum('ai_assessment','traditional_scale','comprehensive') NOT NULL COMMENT '评估类型',
  `session_id` varchar(100) DEFAULT NULL COMMENT '关联AI会话ID',
  `start_time` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
  `end_time` timestamp NULL DEFAULT NULL COMMENT '结束时间',
  `status` enum('in_progress','completed','cancelled') DEFAULT 'in_progress' COMMENT '评估状态',
  `total_score` float DEFAULT NULL COMMENT '总分',
  `risk_level` enum('low','medium','high','critical') DEFAULT NULL COMMENT '风险等级',
  `keywords` json DEFAULT NULL COMMENT '关键词提取',
  `emotion_trend` json DEFAULT NULL COMMENT '情绪趋势',
  `easybert_analysis` json DEFAULT NULL COMMENT 'EasyBert分析结果',
  `dialogue_strategy` json DEFAULT NULL COMMENT '对话策略',
  `assessment_data` json DEFAULT NULL COMMENT '评估数据',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_assessment_type` (`assessment_type`),
  KEY `idx_status` (`status`),
  KEY `idx_risk_level` (`risk_level`),
  KEY `idx_session_id` (`session_id`),
  CONSTRAINT `fk_assessments_student_id` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='心理评估表';

-- 评估记录表
DROP TABLE IF EXISTS `assessment_records`;
CREATE TABLE `assessment_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assessment_id` int NOT NULL COMMENT '评估ID',
  `question_id` varchar(50) DEFAULT NULL COMMENT '问题ID',
  `question_text` text DEFAULT NULL COMMENT '问题文本',
  `answer_text` text DEFAULT NULL COMMENT '回答文本',
  `answer_score` float DEFAULT NULL COMMENT '回答得分',
  `emotion_score` float DEFAULT NULL COMMENT '情感得分',
  `easybert_emotion` varchar(50) DEFAULT NULL COMMENT 'EasyBert情感分析',
  `timestamp` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  PRIMARY KEY (`id`),
  KEY `idx_assessment_id` (`assessment_id`),
  KEY `idx_question_id` (`question_id`),
  KEY `idx_timestamp` (`timestamp`),
  CONSTRAINT `fk_assessment_records_assessment_id` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评估记录表';

-- 情绪记录表
DROP TABLE IF EXISTS `emotion_records`;
CREATE TABLE `emotion_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assessment_id` int NOT NULL COMMENT '评估ID',
  `timestamp` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  `depression_index` float DEFAULT NULL COMMENT '抑郁指数',
  `anxiety_index` float DEFAULT NULL COMMENT '焦虑指数',
  `stress_index` float DEFAULT NULL COMMENT '压力指数',
  `overall_mood` float DEFAULT NULL COMMENT '整体情绪',
  `dominant_emotion` varchar(50) DEFAULT NULL COMMENT '主导情绪',
  `emotion_intensity` float DEFAULT NULL COMMENT '情绪强度',
  `sentiment_score` float DEFAULT NULL COMMENT '情感倾向得分',
  `keywords` json DEFAULT NULL COMMENT '关键词',
  PRIMARY KEY (`id`),
  KEY `idx_assessment_id` (`assessment_id`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_dominant_emotion` (`dominant_emotion`),
  CONSTRAINT `fk_emotion_records_assessment_id` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='情绪记录表';

-- =============================================
-- 咨询相关表
-- =============================================

-- 咨询记录表
DROP TABLE IF EXISTS `consultations`;
CREATE TABLE `consultations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL COMMENT '学生ID',
  `counselor_id` int NOT NULL COMMENT '咨询师ID',
  `consultation_type` enum('face_to_face','online','phone') NOT NULL COMMENT '咨询类型',
  `status` enum('scheduled','in_progress','completed','cancelled','no_show') DEFAULT 'scheduled' COMMENT '咨询状态',
  `scheduled_time` timestamp NOT NULL COMMENT '预约时间',
  `actual_start_time` timestamp NULL DEFAULT NULL COMMENT '实际开始时间',
  `actual_end_time` timestamp NULL DEFAULT NULL COMMENT '实际结束时间',
  `duration` int DEFAULT 60 COMMENT '预约时长(分钟)',
  `actual_duration` int DEFAULT NULL COMMENT '实际时长(分钟)',
  `reason` text DEFAULT NULL COMMENT '咨询原因',
  `notes` text DEFAULT NULL COMMENT '咨询记录',
  `student_feedback` tinyint(1) DEFAULT NULL COMMENT '学生反馈',
  `counselor_notes` text DEFAULT NULL COMMENT '咨询师备注',
  `follow_up_required` tinyint(1) DEFAULT 0 COMMENT '是否需要跟进',
  `follow_up_date` date DEFAULT NULL COMMENT '跟进日期',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_counselor_id` (`counselor_id`),
  KEY `idx_scheduled_time` (`scheduled_time`),
  KEY `idx_status` (`status`),
  KEY `idx_consultation_type` (`consultation_type`),
  CONSTRAINT `fk_consultations_student_id` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_consultations_counselor_id` FOREIGN KEY (`counselor_id`) REFERENCES `counselors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='咨询记录表';

-- 咨询过程记录表
DROP TABLE IF EXISTS `consultation_records`;
CREATE TABLE `consultation_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `consultation_id` int NOT NULL COMMENT '咨询ID',
  `record_type` enum('session_notes','intervention','homework','follow_up') DEFAULT 'session_notes' COMMENT '记录类型',
  `content` text NOT NULL COMMENT '记录内容',
  `created_by` enum('counselor','student','system') DEFAULT 'counselor' COMMENT '创建者',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_consultation_id` (`consultation_id`),
  KEY `idx_record_type` (`record_type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_consultation_records_consultation_id` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='咨询过程记录表';

-- 预约表
DROP TABLE IF EXISTS `appointments`;
CREATE TABLE `appointments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL COMMENT '学生ID',
  `counselor_id` int NOT NULL COMMENT '咨询师ID',
  `preferred_time` timestamp NOT NULL COMMENT '首选时间',
  `alternative_time` timestamp DEFAULT NULL COMMENT '备选时间',
  `reason` text DEFAULT NULL COMMENT '预约原因',
  `urgency_level` enum('low','medium','high','urgent') DEFAULT 'medium' COMMENT '紧急程度',
  `status` enum('pending','confirmed','cancelled','completed','no_show') DEFAULT 'pending' COMMENT '预约状态',
  `notes` text DEFAULT NULL COMMENT '备注',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_counselor_id` (`counselor_id`),
  KEY `idx_preferred_time` (`preferred_time`),
  KEY `idx_status` (`status`),
  KEY `idx_urgency_level` (`urgency_level`),
  CONSTRAINT `fk_appointments_student_id` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_appointments_counselor_id` FOREIGN KEY (`counselor_id`) REFERENCES `counselors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约表';

-- =============================================
-- 风险评估相关表
-- =============================================

-- 风险评估表
DROP TABLE IF EXISTS `risk_assessments`;
CREATE TABLE `risk_assessments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL COMMENT 'AI会话ID',
  `risk_type` enum('suicide','self_harm','violence','substance_abuse','eating_disorder','other') DEFAULT 'other' COMMENT '风险类型',
  `risk_level` enum('low','medium','high','critical') DEFAULT 'low' COMMENT '风险等级',
  `risk_score` float DEFAULT NULL COMMENT '风险得分',
  `risk_indicators` json DEFAULT NULL COMMENT '风险指标',
  `intervention_required` tinyint(1) DEFAULT 0 COMMENT '是否需要干预',
  `intervention_type` varchar(100) DEFAULT NULL COMMENT '干预类型',
  `counselor_notified` tinyint(1) DEFAULT 0 COMMENT '是否已通知咨询师',
  `notification_sent_at` timestamp NULL DEFAULT NULL COMMENT '通知发送时间',
  `intervention_notes` text DEFAULT NULL COMMENT '干预记录',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_risk_level` (`risk_level`),
  KEY `idx_risk_type` (`risk_type`),
  KEY `idx_intervention_required` (`intervention_required`),
  CONSTRAINT `fk_risk_assessments_session_id` FOREIGN KEY (`session_id`) REFERENCES `ai_counseling_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='风险评估表';

-- =============================================
-- 系统配置相关表
-- =============================================

-- 系统配置表
DROP TABLE IF EXISTS `system_configs`;
CREATE TABLE `system_configs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL UNIQUE COMMENT '配置键',
  `config_value` text DEFAULT NULL COMMENT '配置值',
  `config_type` enum('string','number','boolean','json') DEFAULT 'string' COMMENT '配置类型',
  `description` varchar(255) DEFAULT NULL COMMENT '配置描述',
  `is_public` tinyint(1) DEFAULT 0 COMMENT '是否公开',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 操作日志表
DROP TABLE IF EXISTS `operation_logs`;
CREATE TABLE `operation_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL COMMENT '操作用户ID',
  `operation_type` varchar(50) NOT NULL COMMENT '操作类型',
  `operation_description` varchar(255) DEFAULT NULL COMMENT '操作描述',
  `target_type` varchar(50) DEFAULT NULL COMMENT '目标类型',
  `target_id` int DEFAULT NULL COMMENT '目标ID',
  `request_data` json DEFAULT NULL COMMENT '请求数据',
  `response_data` json DEFAULT NULL COMMENT '响应数据',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` text DEFAULT NULL COMMENT '用户代理',
  `status` enum('success','failure','error') DEFAULT 'success' COMMENT '操作状态',
  `error_message` text DEFAULT NULL COMMENT '错误信息',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_operation_type` (`operation_type`),
  KEY `idx_target_type` (`target_type`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- =============================================
-- 插入基础数据
-- =============================================

-- 插入系统配置
INSERT INTO `system_configs` (`config_key`, `config_value`, `config_type`, `description`, `is_public`) VALUES
('system_name', '情绪管理系统', 'string', '系统名称', 1),
('system_version', '2.0.0', 'string', '系统版本', 1),
('max_ai_session_duration', '120', 'number', 'AI会话最大时长(分钟)', 0),
('risk_assessment_threshold', '0.7', 'number', '风险评估阈值', 0),
('counselor_notification_enabled', 'true', 'boolean', '是否启用咨询师通知', 0),
('ai_model_version', 'EasyBert-v1.0', 'string', 'AI模型版本', 1),
('assessment_retention_days', '365', 'number', '评估数据保留天数', 0),
('backup_enabled', 'true', 'boolean', '是否启用自动备份', 0);

-- 插入测试用户数据
INSERT INTO `users` (`username`, `email`, `hashed_password`, `role`, `is_active`) VALUES
('admin', 'admin@emotion-management.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsHBXMxrW', 'admin', 1),
('counselor1', 'counselor1@emotion-management.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsHBXMxrW', 'counselor', 1),
('counselor2', 'counselor2@emotion-management.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsHBXMxrW', 'counselor', 1),
('student1', 'student1@emotion-management.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsHBXMxrW', 'student', 1),
('student2', 'student2@emotion-management.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsHBXMxrW', 'student', 1),
('student3', 'student3@emotion-management.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsHBXMxrW', 'student', 1);

-- 插入管理员信息
INSERT INTO `admins` (`user_id`, `name`, `department`, `position`, `phone`) VALUES
(1, '系统管理员', '信息技术部', '系统管理员', '13800138000');

-- 插入咨询师信息
INSERT INTO `counselors` (`user_id`, `name`, `school`, `description`, `specialties`, `experience_years`, `education`, `phone`, `office_location`, `max_clients_per_day`) VALUES
(2, '张心理咨询师', '认知行为疗法', '专注于认知行为疗法，擅长处理焦虑和抑郁问题。具有丰富的临床经验，帮助众多学生走出心理困境。', '焦虑症,抑郁症,压力管理,认知行为治疗', 8, '心理学硕士，国家二级心理咨询师', '13800138001', '心理咨询中心A101', 8),
(3, '李心理咨询师', '人本主义', '采用人本主义疗法，注重个人成长和自我实现。擅长人际关系咨询和成长性咨询。', '人际关系,自我认知,成长咨询,人本主义治疗', 5, '心理学博士，国家二级心理咨询师', '13800138002', '心理咨询中心B201', 6);

-- 插入学生信息
INSERT INTO `students` (`user_id`, `student_id`, `name`, `major`, `grade`, `class_name`, `phone`, `emergency_contact`, `emergency_phone`, `dormitory`, `birth_date`, `gender`) VALUES
(4, '2024001', '王小明', '计算机科学与技术', '大二', '计科2024-1班', '13800138003', '王大明', '13900139001', '1号楼201', '2005-03-15', 'male'),
(5, '2024002', '李小红', '心理学', '大三', '心理2023-1班', '13800138004', '李大明', '13900139002', '2号楼301', '2004-07-22', 'female'),
(6, '2024003', '张小华', '软件工程', '大一', '软工2024-2班', '13800138005', '张大华', '13900139003', '3号楼101', '2006-11-08', 'male');

-- 提交事务
COMMIT;

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 显示创建结果
SELECT 'Database deployment completed successfully!' as message;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as admin_count FROM admins;
SELECT COUNT(*) as counselor_count FROM counselors;
SELECT COUNT(*) as student_count FROM students;
SELECT COUNT(*) as config_count FROM system_configs;

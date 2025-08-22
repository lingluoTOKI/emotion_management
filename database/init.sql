-- 情绪管理系统数据库初始化脚本
-- Emotion Management System Database Initialization Script

-- 创建数据库
CREATE DATABASE IF NOT EXISTS emotion_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE emotion_management;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'student', 'counselor') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建管理员表
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    phone VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建学生表
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    major VARCHAR(100),
    grade VARCHAR(20),
    phone VARCHAR(20),
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建咨询师表
CREATE TABLE IF NOT EXISTS counselors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    school ENUM('认知行为疗法', '精神分析', '人本主义', '系统家庭治疗', '格式塔疗法', '其他') NOT NULL,
    description TEXT,
    specialties TEXT,
    experience_years INT,
    is_counselor BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    phone VARCHAR(20),
    office_location VARCHAR(200),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建咨询记录表
CREATE TABLE IF NOT EXISTS consultations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    counselor_id INT NOT NULL,
    consultation_type ENUM('face_to_face', 'online', 'phone') NOT NULL,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    scheduled_time DATETIME NOT NULL,
    duration INT DEFAULT 60,
    notes TEXT,
    student_feedback BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (counselor_id) REFERENCES counselors(id)
);

-- 创建咨询过程记录表
CREATE TABLE IF NOT EXISTS consultation_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consultation_id INT NOT NULL,
    record_type VARCHAR(50),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
);

-- 创建预约表
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    counselor_id INT NOT NULL,
    preferred_time DATETIME NOT NULL,
    alternative_time DATETIME,
    reason TEXT,
    urgency_level INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (counselor_id) REFERENCES counselors(id)
);

-- 创建评估表
CREATE TABLE IF NOT EXISTS assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    assessment_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    status VARCHAR(50) DEFAULT 'in_progress',
    total_score FLOAT,
    risk_level VARCHAR(50),
    keywords JSON,
    emotion_trend JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 创建评估记录表
CREATE TABLE IF NOT EXISTS assessment_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    question_id VARCHAR(50),
    question_text TEXT,
    answer_text TEXT,
    answer_score FLOAT,
    emotion_score FLOAT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
);

-- 创建情绪记录表
CREATE TABLE IF NOT EXISTS emotion_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    depression_index FLOAT,
    anxiety_index FLOAT,
    stress_index FLOAT,
    overall_mood FLOAT,
    dominant_emotion VARCHAR(50),
    emotion_intensity FLOAT,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
);

-- 创建AI辅导会话表
CREATE TABLE IF NOT EXISTS ai_counseling_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    session_type VARCHAR(50) DEFAULT 'text',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    status VARCHAR(50) DEFAULT 'active',
    conversation_history JSON,
    emotion_analysis JSON,
    risk_assessment JSON,
    intervention_suggestions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 创建风险评估表
CREATE TABLE IF NOT EXISTS risk_assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    risk_type VARCHAR(50),
    risk_level ENUM('low', 'medium', 'high', 'critical'),
    risk_score FLOAT,
    risk_indicators JSON,
    intervention_required BOOLEAN DEFAULT FALSE,
    counselor_notified BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES ai_counseling_sessions(id) ON DELETE CASCADE
);

-- 创建匿名消息表
CREATE TABLE IF NOT EXISTS anonymous_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_identifier VARCHAR(100) NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    content TEXT NOT NULL,
    emotion_analysis JSON,
    risk_level VARCHAR(50),
    is_urgent BOOLEAN DEFAULT FALSE,
    counselor_assigned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建匿名聊天表
CREATE TABLE IF NOT EXISTS anonymous_chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    counselor_id INT NOT NULL,
    chat_session_id VARCHAR(100) UNIQUE,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    status VARCHAR(50) DEFAULT 'active',
    conversation_history JSON,
    risk_assessment JSON,
    intervention_required BOOLEAN DEFAULT FALSE,
    student_location VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES anonymous_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (counselor_id) REFERENCES counselors(id)
);

-- 插入示例数据
-- 注意：以下是测试用的简单密码，生产环境请使用强密码
-- admin 用户密码: admin123
-- counselor 用户密码: 123456
-- student 用户密码: 123456

-- 插入管理员用户
INSERT INTO users (username, email, hashed_password, role) VALUES
('admin', 'admin@example.com', '$2b$12$JLCSS7n0.s4X8Aj1NgLTh.zJu61O/PSOOktNJtRA.iLr6zZiZRBQu', 'admin');

INSERT INTO admins (user_id, name, department, phone) VALUES
(1, '系统管理员', '信息技术部', '13800138000');

-- 插入咨询师用户
INSERT INTO users (username, email, hashed_password, role) VALUES
('counselor1', 'counselor1@example.com', '$2b$12$Mi5OpuPQ3/got3OBd7kDU.hxAbivIqhDRSZO0uRqRNM6uFPnO2PB2', 'counselor'),
('counselor2', 'counselor2@example.com', '$2b$12$Mi5OpuPQ3/got3OBd7kDU.hxAbivIqhDRSZO0uRqRNM6uFPnO2PB2', 'counselor');

INSERT INTO counselors (user_id, name, school, description, specialties, experience_years, phone, office_location) VALUES
(2, '张心理咨询师', '认知行为疗法', '专注于认知行为疗法，擅长处理焦虑和抑郁问题', '焦虑症,抑郁症,压力管理', 8, '13800138001', '心理咨询中心A101'),
(3, '李心理咨询师', '人本主义', '采用人本主义疗法，注重个人成长和自我实现', '人际关系,自我认知,成长咨询', 5, '13800138002', '心理咨询中心B201');

-- 插入学生用户
INSERT INTO users (username, email, hashed_password, role) VALUES
('student1', 'student1@example.com', '$2b$12$Mi5OpuPQ3/got3OBd7kDU.hxAbivIqhDRSZO0uRqRNM6uFPnO2PB2', 'student'),
('student2', 'student2@example.com', '$2b$12$Mi5OpuPQ3/got3OBd7kDU.hxAbivIqhDRSZO0uRqRNM6uFPnO2PB2', 'student');

INSERT INTO students (user_id, student_id, name, major, grade, phone) VALUES
(4, '2024001', '王同学', '计算机科学与技术', '大二', '13800138003'),
(5, '2024002', '李同学', '心理学', '大三', '13800138004');

-- 创建索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_consultations_student_id ON consultations(student_id);
CREATE INDEX idx_consultations_counselor_id ON consultations(counselor_id);
CREATE INDEX idx_assessments_student_id ON assessments(student_id);
CREATE INDEX idx_ai_sessions_student_id ON ai_counseling_sessions(student_id);
CREATE INDEX idx_anonymous_messages_identifier ON anonymous_messages(student_identifier);

-- 创建视图
CREATE VIEW counselor_statistics AS
SELECT 
    c.id,
    c.name,
    c.school,
    c.experience_years,
    COUNT(co.id) as consultation_count,
    AVG(CASE WHEN co.student_feedback = 1 THEN 100 ELSE 0 END) as satisfaction_rate
FROM counselors c
LEFT JOIN consultations co ON c.id = co.counselor_id
GROUP BY c.id;

CREATE VIEW student_assessment_summary AS
SELECT 
    s.id,
    s.name,
    s.major,
    COUNT(a.id) as assessment_count,
    AVG(a.total_score) as avg_score,
    MAX(a.risk_level) as highest_risk
FROM students s
LEFT JOIN assessments a ON s.id = a.student_id
GROUP BY s.id;

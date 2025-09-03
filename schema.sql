-- init.sql
-- Створення бази даних для Skill Sculptor

-- Таблиця користувачів
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблиця навичок
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 10),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    target_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблиця завдань/цілей для навичок
CREATE TABLE IF NOT EXISTS skill_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT false,
    due_date DATE,
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблиця прогресу навичок (історія)
CREATE TABLE IF NOT EXISTS skill_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    progress_value INTEGER NOT NULL CHECK (progress_value >= 0 AND progress_value <= 100),
    notes TEXT,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблиця категорій навичок
CREATE TABLE IF NOT EXISTS skill_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблиця файлів/ресурсів
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Індекси для покращення продуктивності
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skill_goals_skill_id ON skill_goals(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_progress_skill_id ON skill_progress(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_progress_logged_at ON skill_progress(logged_at);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_skill_id ON files(skill_id);

-- Функція для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Тригери для автоматичного оновлення updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skill_goals_updated_at BEFORE UPDATE ON skill_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Вставка базових категорій навичок
INSERT INTO skill_categories (name, description, color, icon) VALUES
('Програмування', 'Навички розробки та програмування', '#3B82F6', 'code'),
('Дизайн', 'Графічний та UI/UX дизайн', '#EF4444', 'palette'),
('Мови', 'Вивчення іноземних мов', '#10B981', 'globe'),
('Музика', 'Музичні інструменти та теорія музики', '#8B5CF6', 'music'),
('Спорт', 'Фізичні навички та спорт', '#F59E0B', 'activity'),
('Бізнес', 'Підприємництво та управління', '#6B7280', 'briefcase'),
('Наука', 'Наукові дисципліни та дослідження', '#059669', 'beaker'),
('Мистецтво', 'Творчі та художні навички', '#DC2626', 'brush')
ON CONFLICT (name) DO NOTHING;

-- Створення тестового користувача
INSERT INTO users (email, name, password_hash) VALUES 
('test@example.com', 'Test User', '$2b$10$rOvHx.d5Q5y1V8K7N3XzUeJ5L5m5z5J5L5m5z5J5L5m5z5J5L5m5z5')
ON CONFLICT (email) DO NOTHING;

-- Створення представлень (views) для аналітики
CREATE OR REPLACE VIEW user_skill_stats AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    COUNT(s.id) as total_skills,
    AVG(s.progress) as average_progress,
    COUNT(CASE WHEN s.is_active = true THEN 1 END) as active_skills,
    COUNT(CASE WHEN s.progress = 100 THEN 1 END) as completed_skills
FROM users u
LEFT JOIN skills s ON u.id = s.user_id
GROUP BY u.id, u.name;

-- Представлення для останніх активностей
CREATE OR REPLACE VIEW recent_activities AS
SELECT 
    'skill_created' as activity_type,
    s.user_id,
    s.name as activity_title,
    s.created_at as activity_date,
    s.id as related_id
FROM skills s
WHERE s.created_at >= CURRENT_DATE - INTERVAL '7 days'

UNION ALL

SELECT 
    'progress_updated' as activity_type,
    s.user_id,
    CONCAT('Прогрес у ', s.name, ': ', sp.progress_value, '%') as activity_title,
    sp.logged_at as activity_date,
    sp.id as related_id
FROM skill_progress sp
JOIN skills s ON sp.skill_id = s.id
WHERE sp.logged_at >= CURRENT_DATE - INTERVAL '7 days'

UNION ALL

SELECT 
    'goal_completed' as activity_type,
    s.user_id,
    CONCAT('Завершено ціль: ', sg.title) as activity_title,
    sg.updated_at as activity_date,
    sg.id as related_id
FROM skill_goals sg
JOIN skills s ON sg.skill_id = s.id
WHERE sg.is_completed = true 
AND sg.updated_at >= CURRENT_DATE - INTERVAL '7 days'

ORDER BY activity_date DESC;

-- Функція для розрахунку рівня навички на основі прогресу
CREATE OR REPLACE FUNCTION calculate_skill_level(progress_value INTEGER)
RETURNS INTEGER AS $$
BEGIN
    CASE 
        WHEN progress_value >= 90 THEN RETURN 10;
        WHEN progress_value >= 80 THEN RETURN 9;
        WHEN progress_value >= 70 THEN RETURN 8;
        WHEN progress_value >= 60 THEN RETURN 7;
        WHEN progress_value >= 50 THEN RETURN 6;
        WHEN progress_value >= 40 THEN RETURN 5;
        WHEN progress_value >= 30 THEN RETURN 4;
        WHEN progress_value >= 20 THEN RETURN 3;
        WHEN progress_value >= 10 THEN RETURN 2;
        ELSE RETURN 1;
    END CASE;
END;
$ LANGUAGE plpgsql;

-- Тригер для автоматичного оновлення рівня навички
CREATE OR REPLACE FUNCTION update_skill_level()
RETURNS TRIGGER AS $
BEGIN
    NEW.level = calculate_skill_level(NEW.progress);
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_skill_level_trigger 
    BEFORE INSERT OR UPDATE OF progress ON skills
    FOR EACH ROW EXECUTE FUNCTION update_skill_level();
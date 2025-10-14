-- PostgreSQL Schema for Palm Oil Business Management System
-- Migrated from SQLite to PostgreSQL for Railway deployment

-- ตาราง users (สมาชิก)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง harvest_data (ข้อมูลการเก็บเกี่ยว)
CREATE TABLE IF NOT EXISTS harvest_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    total_weight DECIMAL(10,2) NOT NULL,
    price_per_kg DECIMAL(8,2) NOT NULL,
    total_revenue DECIMAL(12,2) NOT NULL,
    harvesting_cost DECIMAL(10,2) NOT NULL,
    net_profit DECIMAL(12,2) NOT NULL,
    fallen_weight DECIMAL(10,2) DEFAULT 0,
    fallen_price_per_kg DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_harvest_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ตาราง fertilizer_data (ข้อมูลปุ๋ย) - Updated schema
CREATE TABLE IF NOT EXISTS fertilizer_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    fertilizer_type VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL,
    cost_per_bag DECIMAL(8,2) NOT NULL,
    labor_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_cost DECIMAL(12,2) NOT NULL,
    supplier VARCHAR(255) DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fertilizer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ตาราง palm_tree_data (ข้อมูลต้นปาล์ม) - Updated schema
CREATE TABLE IF NOT EXISTS palm_tree_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    tree_id VARCHAR(10) NOT NULL, -- A1, A2, ..., L26
    harvest_date DATE NOT NULL,
    bunch_count INTEGER NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_palmtree_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ตาราง notes_data (บันทึกธุรกิจ) - Updated schema
CREATE TABLE IF NOT EXISTS notes_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'ทั่วไป',
    priority VARCHAR(50) DEFAULT 'ปานกลาง',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- สร้าง indexes เพื่อเพิ่มประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_harvest_user_date ON harvest_data(user_id, date);
CREATE INDEX IF NOT EXISTS idx_fertilizer_user_date ON fertilizer_data(user_id, date);
CREATE INDEX IF NOT EXISTS idx_palmtree_user_date ON palm_tree_data(user_id, harvest_date);
CREATE INDEX IF NOT EXISTS idx_palmtree_tree_id ON palm_tree_data(tree_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_date ON notes_data(user_id, date);

-- Function สำหรับอัปเดต updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger เพื่ออัพเดต updated_at อัตโนมัติ
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password hash สำหรับ 'admin')
INSERT INTO users (id, username, email, password, role, created_at) 
VALUES (1, 'admin', 'admin@palmoil.com', '$2a$10$/W1WlDQQQQs133VwYXS9Xe/phW8g74FV2Qagajp//UMUSRUt6QlAu', 'admin', '2025-01-01 00:00:00')
ON CONFLICT (email) DO NOTHING;

-- Set sequence to start from correct number
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users), true);
SELECT setval('harvest_data_id_seq', 1, false);
SELECT setval('fertilizer_data_id_seq', 1, false);
SELECT setval('palm_tree_data_id_seq', 1, false);
SELECT setval('notes_data_id_seq', 1, false);
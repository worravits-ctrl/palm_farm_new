-- Palm Oil Business Management Database Schema
-- สร้างเมื่อ: 2025-09-13

-- ตาราง users (สมาชิก)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง harvest_data (ข้อมูลการเก็บเกี่ยว)
CREATE TABLE IF NOT EXISTS harvest_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    total_weight DECIMAL(10,2) NOT NULL,
    price_per_kg DECIMAL(8,2) NOT NULL,
    total_revenue DECIMAL(12,2) NOT NULL,
    harvesting_cost DECIMAL(10,2) NOT NULL,
    net_profit DECIMAL(12,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ตาราง fertilizer_data (ข้อมูลปุ๋ย)
CREATE TABLE IF NOT EXISTS fertilizer_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    item VARCHAR(255) NOT NULL,
    sacks INTEGER NOT NULL,
    price_per_sack DECIMAL(8,2) NOT NULL,
    labor_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(12,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ตาราง palm_tree_data (ข้อมูลต้นปาล์ม)
CREATE TABLE IF NOT EXISTS palm_tree_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    palm_tree VARCHAR(10) NOT NULL, -- A1, A2, ..., L26
    bunches INTEGER NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ตาราง notes_data (บันทึกธุรกิจ)
CREATE TABLE IF NOT EXISTS notes_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- สร้าง indexes เพื่อเพิ่มประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_harvest_user_date ON harvest_data(user_id, date);
CREATE INDEX IF NOT EXISTS idx_fertilizer_user_date ON fertilizer_data(user_id, date);
CREATE INDEX IF NOT EXISTS idx_palmtree_user_date ON palm_tree_data(user_id, date);
CREATE INDEX IF NOT EXISTS idx_notes_user_date ON notes_data(user_id, date);

-- Insert default admin user
INSERT OR IGNORE INTO users (id, username, email, password, role, created_at) 
VALUES (1, 'admin', 'admin@palmoil.com', 'admin123', 'admin', '2025-01-01 00:00:00');

-- Trigger เพื่ออัพเดต updated_at อัตโนมัติ
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
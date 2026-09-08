-- =========================================================
-- ระบบบริหารจัดการวัสดุและครุภัณฑ์
-- Material and Equipment Management System
--
-- Database : PostgreSQL
-- Schema   : public
-- =========================================================


-- =========================================================
-- 1. ROLES
-- ตารางสิทธิ์/ระดับผู้ใช้งาน
-- User roles
-- =========================================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 2. DEPARTMENTS
-- ตารางหน่วยงาน
-- Departments
-- =========================================================

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    department_name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 3. USERS
-- ตารางผู้ใช้งาน
-- Users
-- =========================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    role_id INTEGER NOT NULL,
    department_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id)
);


-- =========================================================
-- 4. CATEGORIES
-- ตารางหมวดหมู่วัสดุ/ครุภัณฑ์
-- Material / Equipment Categories
-- =========================================================

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 5. MATERIALS
-- ตารางวัสดุและครุภัณฑ์
-- Materials and Equipment
-- =========================================================

CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    material_code VARCHAR(50) UNIQUE NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    category_id INTEGER NOT NULL,
    item_type VARCHAR(50) DEFAULT 'วัสดุ',
    description TEXT,
    unit VARCHAR(50) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 0,
    image_url TEXT,
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_material_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT check_stock_quantity CHECK (stock_quantity >= 0),
    CONSTRAINT check_minimum_stock CHECK (minimum_stock >= 0)
);


-- =========================================================
-- 6-7. ENUMS: REQUEST TYPE & STATUS
-- =========================================================

CREATE TYPE request_type AS ENUM ('เบิก', 'ยืม');
CREATE TYPE request_status AS ENUM ('รออนุมัติ', 'อนุมัติ', 'ไม่อนุมัติ', 'ยกเลิก', 'เสร็จสิ้น');


-- =========================================================
-- 8. REQUESTS
-- ตารางคำขอเบิก-ยืม
-- =========================================================

CREATE TABLE requests (
    id SERIAL PRIMARY KEY,
    request_code VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    request_type request_type NOT NULL,
    status request_status DEFAULT 'รออนุมัติ',
    reason TEXT,
    borrow_date DATE,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_request_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT check_borrow_date CHECK (request_type = 'เบิก' OR borrow_date IS NOT NULL),
    CONSTRAINT check_due_date CHECK (request_type = 'เบิก' OR due_date IS NOT NULL)
);


-- =========================================================
-- 9. REQUEST ITEMS
-- รายการวัสดุภายในคำขอ
-- =========================================================

CREATE TABLE request_items (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_request_item_request FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_request_item_material FOREIGN KEY (material_id) REFERENCES materials(id),
    CONSTRAINT check_request_quantity CHECK (quantity > 0)
);


-- =========================================================
-- 10. APPROVAL RESULT ENUM
-- =========================================================

CREATE TYPE approval_result AS ENUM ('อนุมัติ', 'ไม่อนุมัติ');


-- =========================================================
-- 11. APPROVALS
-- ตารางประวัติการอนุมัติ
-- =========================================================

CREATE TABLE approvals (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL,
    approver_id INTEGER NOT NULL,
    result approval_result NOT NULL,
    reason TEXT,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_approval_request FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_approval_approver FOREIGN KEY (approver_id) REFERENCES users(id)
);


-- =========================================================
-- 12. RETURNS
-- ตารางการคืนวัสดุ/ครุภัณฑ์
-- =========================================================

CREATE TABLE returns (
    id SERIAL PRIMARY KEY,
    return_code VARCHAR(50) UNIQUE NOT NULL,
    request_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    return_date DATE DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_return_request FOREIGN KEY (request_id) REFERENCES requests(id),
    CONSTRAINT fk_return_user FOREIGN KEY (user_id) REFERENCES users(id)
);


-- =========================================================
-- 13. RETURN ITEMS
-- รายการวัสดุที่คืน
-- =========================================================

CREATE TABLE return_items (
    id SERIAL PRIMARY KEY,
    return_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    condition VARCHAR(100),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_return_item_return FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
    CONSTRAINT fk_return_item_material FOREIGN KEY (material_id) REFERENCES materials(id),
    CONSTRAINT check_return_quantity CHECK (quantity > 0)
);


-- =========================================================
-- 14. STOCK MOVEMENT TYPE ENUM
-- =========================================================

CREATE TYPE stock_movement_type AS ENUM ('เติมสต็อก', 'เบิก', 'ยืม', 'คืน', 'ปรับปรุง');


-- =========================================================
-- 15. STOCK MOVEMENTS
-- ตารางประวัติการเคลื่อนไหวของสต็อก
-- =========================================================

CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL,
    movement_type stock_movement_type NOT NULL,
    quantity INTEGER NOT NULL,
    reference_id INTEGER,
    note TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_material FOREIGN KEY (material_id) REFERENCES materials(id),
    CONSTRAINT fk_stock_user FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT check_stock_movement_quantity CHECK (quantity > 0)
);


-- =========================================================
-- 16. STOCK REPLENISHMENTS
-- ตารางการเติมสต็อก
-- =========================================================

CREATE TABLE stock_replenishments (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    supplier VARCHAR(255),
    reference_no VARCHAR(100),
    note TEXT,
    added_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_replenishment_material FOREIGN KEY (material_id) REFERENCES materials(id),
    CONSTRAINT fk_replenishment_user FOREIGN KEY (added_by) REFERENCES users(id),
    CONSTRAINT check_replenishment_quantity CHECK (quantity > 0)
);


-- =========================================================
-- 17. AUDIT LOGS
-- ตารางประวัติการใช้งานระบบ
-- =========================================================

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);


-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_materials_category_id ON materials(category_id);
CREATE INDEX idx_materials_name ON materials(material_name);
CREATE INDEX idx_requests_user_id ON requests(user_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_type ON requests(request_type);
CREATE INDEX idx_request_items_request_id ON request_items(request_id);
CREATE INDEX idx_request_items_material_id ON request_items(material_id);
CREATE INDEX idx_approvals_request_id ON approvals(request_id);
CREATE INDEX idx_approvals_approver_id ON approvals(approver_id);
CREATE INDEX idx_returns_request_id ON returns(request_id);
CREATE INDEX idx_return_items_return_id ON return_items(return_id);
CREATE INDEX idx_stock_movements_material_id ON stock_movements(material_id);
CREATE INDEX idx_stock_replenishments_material_id ON stock_replenishments(material_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

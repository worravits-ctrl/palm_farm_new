```mermaid
erDiagram
    USERS {
        int id PK
        varchar username UK "ชื่อผู้ใช้"
        varchar email UK "อีเมล"
        text password_hash "รหัสผ่านเข้ารหัส"
        varchar role "user/admin"
        timestamp created_at "วันที่สร้าง"
    }
    
    HARVEST_DATA {
        int id PK
        int user_id FK
        date date "วันที่เก็บเกี่ยว"
        decimal total_weight "น้ำหนักรวม(กก.)"
        decimal price_per_kg "ราคา/กก.(บาท)"
        decimal harvesting_cost "ต้นทุนเก็บเกี่ยว"
        varchar location "สถานที่"
        text notes "หมายเหตุ"
        timestamp created_at
    }
    
    FERTILIZER_DATA {
        int id PK
        int user_id FK
        date date "วันที่ใส่ปุ๋ย"
        varchar fertilizer_type "ชนิดปุ๋ย"
        decimal quantity_used "ปริมาณ(กระสอบ)"
        decimal cost_per_unit "ต้นทุน/หน่วย"
        varchar supplier "ผู้จำหน่าย"
        varchar area_applied "พื้นที่ใส่ปุ๋ย"
        text notes "หมายเหตุ"
        timestamp created_at
    }
    
    PALM_TREE_DATA {
        int id PK
        int user_id FK
        varchar tree_id "รหัสต้นปาล์ม(A1,B5)"
        date harvest_date "วันที่เก็บเกี่ยว"
        int bunch_count "จำนวนทะลาย"
        text notes "สภาพต้นไม้"
        timestamp created_at
    }
    
    NOTES_DATA {
        int id PK
        int user_id FK
        varchar title "หัวข้อ"
        text content "เนื้อหา"
        varchar category "หมวดหมู่"
        varchar priority "ความสำคัญ"
        timestamp created_at
        timestamp updated_at
    }

    %% ความสัมพันธ์
    USERS ||--o{ HARVEST_DATA : "เป็นเจ้าของ"
    USERS ||--o{ FERTILIZER_DATA : "เป็นเจ้าของ"
    USERS ||--o{ PALM_TREE_DATA : "เป็นเจ้าของ"
    USERS ||--o{ NOTES_DATA : "เป็นเจ้าของ"
```

# 📊 Database Schema Visualization

## 🌴 Palm Oil Management System Database Structure

### 📋 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       🏢 USERS (ผู้ใช้งาน)                    │
├─────────────────────────────────────────────────────────────┤
│ • id (PK) - รหัสผู้ใช้                                        │
│ • username (UNIQUE) - ชื่อผู้ใช้                             │
│ • email (UNIQUE) - อีเมล                                    │
│ • password_hash - รหัsผ่านเข้ารหัส                            │
│ • role - บทบาท (user/admin)                                 │
│ • created_at - วันที่สร้างบัญชี                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (1:N)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    🌾 HARVEST_DATA (การเก็บเกี่ยว)             │
├─────────────────────────────────────────────────────────────┤
│ • id (PK) - รหัสการเก็บเกี่ยว                                  │
│ • user_id (FK) - รหัสผู้ใช้                                   │
│ • date - วันที่เก็บเกี่ยว                                      │
│ • total_weight - น้ำหนักรวม (กิโลกรัม)                        │
│ • price_per_kg - ราคาต่อกิโลกรัม (บาท)                        │
│ • harvesting_cost - ต้นทุนการเก็บเกี่ยว                        │
│ • location - สถานที่เก็บเกี่ยว                                 │
│ • notes - หมายเหตุ                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   🌱 FERTILIZER_DATA (การใส่ปุ๋ย)              │
├─────────────────────────────────────────────────────────────┤
│ • id (PK) - รหัสการใส่ปุ๋ย                                     │
│ • user_id (FK) - รหัสผู้ใช้                                   │
│ • date - วันที่ใส่ปุ๋ย                                         │
│ • fertilizer_type - ชนิดปุ๋ย (NPK, ยูเรีย)                     │
│ • quantity_used - ปริมาณที่ใช้ (กระสอบ)                        │
│ • cost_per_unit - ต้นทุนต่อหน่วย                              │
│ • supplier - ผู้จำหน่าย/ร้านค้า                                │
│ • area_applied - พื้นที่ที่ใส่ปุ๋ย                             │
│ • notes - หมายเหตุ                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  🌴 PALM_TREE_DATA (ข้อมูลต้นปาล์ม)           │
├─────────────────────────────────────────────────────────────┤
│ • id (PK) - รหัสข้อมูลต้นปาล์ม                                 │
│ • user_id (FK) - รหัสผู้ใช้                                   │
│ • tree_id - รหัสต้นปาล์ม (A1, B5, C12)                       │
│ • harvest_date - วันที่เก็บเกี่ยว                             │
│ • bunch_count - จำนวนทะลาย                                   │
│ • notes - สภาพต้นไม้, โรคแมลง                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   📝 NOTES_DATA (บันทึกเพิ่มเติม)              │
├─────────────────────────────────────────────────────────────┤
│ • id (PK) - รหัสบันทึก                                        │
│ • user_id (FK) - รหัสผู้ใช้                                   │
│ • title - หัวข้อบันทึก                                        │
│ • content - เนื้อหาโดยละเอียด                                 │
│ • category - หมวดหมู่ (การเก็บเกี่ยว, ปุ๋ย, โรคแมลง)           │
│ • priority - ระดับความสำคัญ (สูง, ปานกลาง, ต่ำ)                │
│ • created_at - วันที่สร้าง                                   │
│ • updated_at - วันที่แก้ไขล่าสุด                              │
└─────────────────────────────────────────────────────────────┘
```

### 🔗 Data Flow & Relationships

```
👤 User Authentication
    │
    ├── 🔐 JWT Token Generation
    │
    ▼
📊 Data Access Layer
    │
    ├── 🌾 Harvest Management
    │   ├── Daily harvest recording
    │   ├── Revenue calculation
    │   └── Profit analysis
    │
    ├── 🌱 Fertilizer Management  
    │   ├── Cost tracking
    │   ├── Usage monitoring
    │   └── Supplier management
    │
    ├── 🌴 Palm Tree Monitoring
    │   ├── Individual tree tracking
    │   ├── Productivity analysis
    │   └── Health monitoring
    │
    └── 📝 Notes & Documentation
        ├── Knowledge management
        ├── Planning records
        └── Experience logging
```

### 📈 Data Analytics & Reports

```
Raw Data Input → Processing → Analytics → Reports
      │              │           │          │
      ▼              ▼           ▼          ▼
  Daily Records → Validation → Aggregation → Dashboard
  CSV Import    → Calculation → Trends     → Charts
  Manual Entry  → Statistics  → Forecasts → Exports
```
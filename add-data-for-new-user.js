#!/usr/bin/env node

/**
 * Add sample data for new users to help them get started
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'palmoil.db');

console.log('🌱 Adding sample data for new users...');
console.log(`📊 Database: ${dbPath}`);

const db = new sqlite3.Database(dbPath);

// Function to add sample data for a user
function addSampleDataForUser(userId, userEmail) {
    console.log(`\n👤 Adding sample data for user ${userId} (${userEmail})...`);
    
    db.serialize(() => {
        // Add sample harvest data
        console.log('  📦 Adding harvest data...');
        const harvestStmt = db.prepare(`
            INSERT INTO harvest_data (user_id, date, total_weight, price_per_kg, fallen_weight, fallen_price_per_kg, total_revenue, harvesting_cost, net_profit)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const harvestData = [
            [userId, '2025-10-10', 150.5, 4.50, 10.2, 3.00, 707.85, 200.00, 507.85],
            [userId, '2025-10-09', 120.0, 4.50, 8.5, 3.00, 565.50, 150.00, 415.50],
            [userId, '2025-10-08', 180.3, 4.40, 12.0, 2.80, 827.32, 250.00, 577.32],
            [userId, '2025-10-07', 95.8, 4.60, 6.5, 3.20, 461.48, 120.00, 341.48],
            [userId, '2025-10-06', 210.7, 4.35, 15.3, 2.90, 961.49, 300.00, 661.49]
        ];

        harvestData.forEach(row => {
            harvestStmt.run(row, function(err) {
                if (err) console.error('    ❌ Error:', err.message);
            });
        });
        harvestStmt.finalize();

        // Add sample fertilizer data
        console.log('  🌿 Adding fertilizer data...');
        const fertilizerStmt = db.prepare(`
            INSERT INTO fertilizer_data (user_id, date, fertilizer_type, amount, cost_per_bag, labor_cost, total_cost, supplier, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const fertilizerData = [
            [userId, '2025-10-05', 'ปุ๋ยเคมี 15-15-15', 10, 850.00, 500.00, 9000.00, 'บริษัท เอบีซี', 'ปุ๋ยคุณภาพดีสำหรับเริ่มต้น'],
            [userId, '2025-10-01', 'ปุ๋ยอินทรีย์', 5, 450.00, 250.00, 2500.00, 'ร้านเกษตร ณ สวนปาล์ม', 'ปุ๋ยธรรมชาติ เหมาะกับดิน'],
            [userId, '2025-09-28', 'ปูนโดโลไมท์', 8, 320.00, 400.00, 2960.00, 'ห้างหุ้นส่วน สหเกษตร', 'ปรับ pH ดิน'],
            [userId, '2025-09-25', 'ปุ๋ยยูเรีย', 6, 780.00, 300.00, 4980.00, 'บริษัท เอบีซี', 'เพิ่มไนโตรเจน']
        ];

        fertilizerData.forEach(row => {
            fertilizerStmt.run(row, function(err) {
                if (err) console.error('    ❌ Error:', err.message);
            });
        });
        fertilizerStmt.finalize();

        // Add sample palm tree data
        console.log('  🌴 Adding palm tree data...');
        const palmTreeStmt = db.prepare(`
            INSERT INTO palm_tree_data (user_id, tree_id, harvest_date, bunch_count, notes, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
        `);

        const palmTreeData = [
            [userId, 'A1', '2025-10-10', 5, 'ต้นโต ผลดี สีสวย น้ำหนักเหมาะสม'],
            [userId, 'A2', '2025-10-10', 3, 'ต้นยังเล็ก แต่ผลสวย คาดว่าจะโตเร็ว'],
            [userId, 'A3', '2025-10-09', 7, 'ต้นแก่ ผลเยอะมาก คุณภาพดีมาก'],
            [userId, 'B1', '2025-10-09', 4, 'ต้นกลาง ผลปานกลาง สีดี'],
            [userId, 'B2', '2025-10-08', 6, 'ต้นแข็งแรง ผลสวย น้ำหนักดี'],
            [userId, 'B3', '2025-10-08', 2, 'ต้นเล็ก แต่แข็งแรง ผลดี'],
            [userId, 'C1', '2025-10-07', 8, 'ต้นโตมาก ผลเยอะที่สุด คุณภาพเยี่ยม'],
            [userId, 'C2', '2025-10-07', 5, 'ต้นปานกลาง ผลสม่ำเสมอ']
        ];

        palmTreeData.forEach(row => {
            palmTreeStmt.run(row, function(err) {
                if (err) console.error('    ❌ Error:', err.message);
            });
        });
        palmTreeStmt.finalize();

        // Add sample notes
        console.log('  📝 Adding notes...');
        const notesStmt = db.prepare(`
            INSERT INTO notes_data (user_id, date, title, content, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        `);

        const notesData = [
            [userId, '2025-10-10', 'การเก็บเกี่ยววันแรก', 'วันนี้เริ่มเก็บเกี่ยวครั้งแรก ผลผลิตดีกว่าที่คาดไว้ ต้นปาล์มโตแข็งแรง คุณภาพผลดี'],
            [userId, '2025-10-05', 'การใส่ปุ๋ย', 'ใส่ปุ๋ยเคมี 15-15-15 ครั้งแรก คาดว่าจะช่วยให้ต้นปาล์มโตเร็วขึ้น และผลดีขึ้น'],
            [userId, '2025-10-01', 'จัดการดิน', 'ใส่ปูนโดโลไมท์เพื่อปรับ pH ดิน และปุ๋ยอินทรีย์เพื่อเพิ่มความอุดมสมบูรณ์'],
            [userId, '2025-09-28', 'แผนการดูแล', 'วางแผนการดูแลต้นปาล์ม รดน้ำสม่ำเสมอ กำจดัวัชพืช ตรวจสอบโรคแมลง'],
            [userId, '2025-09-25', 'เริ่มต้นสวนปาล์ม', 'เริ่มต้นจัดการสวนปาล์มอย่างจริงจัง ตั้งเป้าให้มีผลผลิตดีและยั่งยืน']
        ];

        notesData.forEach(row => {
            notesStmt.run(row, function(err) {
                if (err) console.error('    ❌ Error:', err.message);
            });
        });
        notesStmt.finalize(() => {
            console.log(`  ✅ Sample data added for user ${userId} (${userEmail})`);
        });
    });
}

// Get all users and add sample data for users who don't have any data
db.serialize(() => {
    console.log('🔍 Checking users...');
    
    db.all("SELECT id, email, role FROM users WHERE role = 'user'", (err, users) => {
        if (err) {
            console.error('❌ Error getting users:', err.message);
            return;
        }

        console.log(`👥 Found ${users.length} regular users`);

        users.forEach(user => {
            // Check if user has any harvest data
            db.get("SELECT COUNT(*) as count FROM harvest_data WHERE user_id = ?", [user.id], (err, result) => {
                if (err) {
                    console.error('❌ Error checking user data:', err.message);
                    return;
                }

                if (result.count === 0) {
                    console.log(`📋 User ${user.email} has no data, adding sample data...`);
                    addSampleDataForUser(user.id, user.email);
                } else {
                    console.log(`📋 User ${user.email} already has ${result.count} harvest records`);
                }
            });
        });
    });
});

// Close database after 3 seconds to allow all operations to complete
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        } else {
            console.log('✅ Database closed successfully');
        }
    });
}, 3000);
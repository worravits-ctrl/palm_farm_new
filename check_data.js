#!/usr/bin/env node

/**
 * 📊 Real Data Inspector
 * ดึงข้อมูลจริงจากฐานข้อมูล SQLite
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath);

console.log('📊 ตรวจสอบข้อมูลจริงในระบบจัดการธุรกิจน้ำมันปาล์ม');
console.log('=' .repeat(60));

// ฟังก์ชันแสดงข้อมูลในรูปแบบตาราง
function displayTable(title, data) {
    console.log(`\n${title}`);
    console.log('-'.repeat(title.length));
    if (data.length > 0) {
        console.table(data);
    } else {
        console.log('ไม่มีข้อมูล');
    }
}

async function checkDatabase() {
    try {
        // 1. ข้อมูลผู้ใช้งาน
        db.all("SELECT id, username, email, role, created_at FROM users", (err, users) => {
            if (err) {
                console.error('Error fetching users:', err);
                return;
            }
            
            displayTable('👥 ข้อมูลผู้ใช้งานทั้งหมด', users);
            
            // 2. สถิติข้อมูลทั่วไป
            db.get(`
                SELECT 
                    (SELECT COUNT(*) FROM users WHERE role = 'user') as farmers,
                    (SELECT COUNT(*) FROM harvest_data) as harvests,
                    (SELECT COUNT(*) FROM fertilizer_data) as fertilizer_records,
                    (SELECT COUNT(*) FROM palm_tree_data) as palm_tree_records,
                    (SELECT COUNT(*) FROM notes_data) as notes,
                    (SELECT COUNT(DISTINCT tree_id) FROM palm_tree_data) as unique_trees
            `, (err, stats) => {
                if (err) {
                    console.error('Error fetching stats:', err);
                    return;
                }
                
                console.log('\n📊 สถิติข้อมูลทั่วไป');
                console.log('-'.repeat(25));
                console.log(`เกษตรกร: ${stats.farmers} คน`);
                console.log(`การเก็บเกี่ยว: ${stats.harvests} รายการ`);
                console.log(`การใส่ปุ๋ย: ${stats.fertilizer_records} รายการ`);
                console.log(`ข้อมูลต้นปาล์ม: ${stats.palm_tree_records} รายการ`);
                console.log(`บันทึกเพิ่มเติม: ${stats.notes} รายการ`);
                console.log(`ต้นปาล์มทั้งหมด: ${stats.unique_trees} ต้น`);
                
                // 3. ข้อมูลการเก็บเกี่ยวล่าสุด
                db.all(`
                    SELECT 
                        h.date,
                        h.total_weight,
                        h.price_per_kg,
                        h.total_revenue,
                        h.harvesting_cost,
                        h.net_profit,
                        u.username
                    FROM harvest_data h
                    JOIN users u ON h.user_id = u.id
                    ORDER BY h.date DESC
                    LIMIT 10
                `, (err, recentHarvests) => {
                    if (err) {
                        console.error('Error fetching recent harvests:', err);
                        return;
                    }
                    
                    displayTable('🌾 การเก็บเกี่ยวล่าสุด (10 รายการ)', recentHarvests);
                    
                    // 4. สถิติรายได้รายเดือน
                    db.all(`
                        SELECT 
                            strftime('%Y-%m', date) as month,
                            COUNT(*) as harvest_count,
                            ROUND(SUM(total_weight), 2) as total_weight,
                            ROUND(AVG(price_per_kg), 2) as avg_price,
                            ROUND(SUM(total_revenue), 2) as total_revenue
                        FROM harvest_data 
                        WHERE date >= date('now', '-6 months')
                        GROUP BY strftime('%Y-%m', date)
                        ORDER BY month DESC
                    `, (err, monthlyRevenue) => {
                        if (err) {
                            console.error('Error fetching monthly revenue:', err);
                            return;
                        }
                        
                        displayTable('💰 รายได้รายเดือน (6 เดือนล่าสุด)', monthlyRevenue);
                        
                        // 5. ข้อมูลการใส่ปุ๋ย
                        db.all(`
                            SELECT 
                                f.date,
                                f.fertilizer_type,
                                f.amount,
                                f.cost_per_bag,
                                f.labor_cost,
                                f.total_cost,
                                f.supplier,
                                u.username
                            FROM fertilizer_data f
                            JOIN users u ON f.user_id = u.id
                            ORDER BY f.date DESC
                            LIMIT 8
                        `, (err, fertilizers) => {
                            if (err) {
                                console.error('Error fetching fertilizers:', err);
                                return;
                            }
                            
                            displayTable('🌱 การใส่ปุ๋ยล่าสุด', fertilizers);
                            
                            // 6. ต้นปาล์มที่ให้ผลดีที่สุด
                            db.all(`
                                SELECT 
                                    p.tree_id,
                                    COUNT(*) as harvest_times,
                                    SUM(p.bunch_count) as total_bunches,
                                    ROUND(AVG(CAST(p.bunch_count AS FLOAT)), 1) as avg_bunches,
                                    MAX(p.harvest_date) as last_harvest,
                                    u.username
                                FROM palm_tree_data p
                                JOIN users u ON p.user_id = u.id
                                GROUP BY p.tree_id, u.username
                                ORDER BY total_bunches DESC
                                LIMIT 10
                            `, (err, topTrees) => {
                                if (err) {
                                    console.error('Error fetching top trees:', err);
                                    return;
                                }
                                
                                displayTable('🌴 ต้นปาล์มที่ให้ผลดีที่สุด (Top 10)', topTrees);
                                
                                // 7. บันทึกล่าสุด
                                db.all(`
                                    SELECT 
                                        n.title,
                                        n.category,
                                        n.priority,
                                        SUBSTR(n.content, 1, 50) || '...' as content_preview,
                                        n.created_at,
                                        u.username
                                    FROM notes_data n
                                    JOIN users u ON n.user_id = u.id
                                    ORDER BY n.created_at DESC
                                `, (err, notes) => {
                                    if (err) {
                                        console.error('Error fetching notes:', err);
                                        return;
                                    }
                                    
                                    displayTable('📝 บันทึกล่าสุด', notes);
                                    
                                    // 8. สรุปรายได้และต้นทุนรวม
                                    db.get(`
                                        SELECT 
                                            ROUND(SUM(total_revenue), 2) as total_revenue,
                                            ROUND(SUM(harvesting_cost), 2) as total_harvest_cost,
                                            ROUND(AVG(price_per_kg), 2) as avg_price,
                                            ROUND(SUM(total_weight), 2) as total_weight
                                        FROM harvest_data
                                    `, (err, harvestSummary) => {
                                        if (err) {
                                            console.error('Error fetching harvest summary:', err);
                                            return;
                                        }
                                        
                                        db.get(`
                                            SELECT 
                                                ROUND(SUM(total_cost), 2) as total_fertilizer_cost,
                                                COUNT(DISTINCT fertilizer_type) as fertilizer_types
                                            FROM fertilizer_data
                                        `, (err, fertilizerSummary) => {
                                            if (err) {
                                                console.error('Error fetching fertilizer summary:', err);
                                                return;
                                            }
                                            
                                            console.log('\n💼 สรุปผลการดำเนินงาน');
                                            console.log('-'.repeat(30));
                                            console.log(`รายได้รวมทั้งหมด: ${harvestSummary.total_revenue?.toLocaleString() || '0'} บาท`);
                                            console.log(`ต้นทุนเก็บเกี่ยว: ${harvestSummary.total_harvest_cost?.toLocaleString() || '0'} บาท`);
                                            console.log(`ต้นทุนปุ๋ย: ${fertilizerSummary.total_fertilizer_cost?.toLocaleString() || '0'} บาท`);
                                            console.log(`กำไรสุทธิ: ${((harvestSummary.total_revenue || 0) - (harvestSummary.total_harvest_cost || 0) - (fertilizerSummary.total_fertilizer_cost || 0)).toLocaleString()} บาท`);
                                            console.log(`น้ำหนักรวม: ${harvestSummary.total_weight?.toLocaleString() || '0'} กิโลกรัม`);
                                            console.log(`ราคาเฉลี่ย: ${harvestSummary.avg_price || '0'} บาท/กก.`);
                                            
                                            // 9. Database file size
                                            const fs = require('fs');
                                            try {
                                                const stats = fs.statSync(dbPath);
                                                const fileSizeKB = (stats.size / 1024).toFixed(2);
                                                const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
                                                
                                                console.log('\n💾 ข้อมูลฐานข้อมูล');
                                                console.log('-'.repeat(20));
                                                console.log(`ขนาดไฟล์: ${fileSizeKB} KB (${fileSizeMB} MB)`);
                                                console.log(`Path: ${dbPath}`);
                                                console.log(`แก้ไขล่าสุด: ${stats.mtime.toLocaleDateString('th-TH')}`);
                                            } catch (fsErr) {
                                                console.log('ไม่สามารถอ่านขนาดไฟล์ได้');
                                            }
                                            
                                            console.log('\n✅ การตรวจสอบข้อมูลเสร็จสมบูรณ์!');
                                            console.log('🌴 ระบบจัดการธุรกิจน้ำมันปาล์มพร้อมใช้งาน');
                                            
                                            // ปิดการเชื่อมต่อฐานข้อมูล
                                            db.close((err) => {
                                                if (err) {
                                                    console.error('Error closing database:', err);
                                                }
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
        
    } catch (error) {
        console.error('Error:', error);
        db.close();
    }
}

// รันการตรวจสอบ
checkDatabase();

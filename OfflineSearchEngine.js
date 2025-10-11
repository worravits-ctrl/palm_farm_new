const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ระบบค้นหาข้อมูลแบบ Offline (ไม่ต้องใช้ Gemini API)
class OfflineSearchEngine {
    constructor(dbPath) {
        this.db = new sqlite3.Database(dbPath);
    }

    // ค้นหาข้อมูลการเก็บเกี่ยว (แบบ shared data)
    async searchHarvest(userId, filters = {}) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT * FROM harvest_data 
                WHERE 1=1
            `;
            let params = [];

            // เพิ่มเงื่อนไขการค้นหา
            if (filters.dateFrom) {
                query += ` AND date >= ?`;
                params.push(filters.dateFrom);
            }
            if (filters.dateTo) {
                query += ` AND date <= ?`;
                params.push(filters.dateTo);
            }
            if (filters.minWeight) {
                query += ` AND total_weight >= ?`;
                params.push(filters.minWeight);
            }
            if (filters.maxWeight) {
                query += ` AND total_weight <= ?`;
                params.push(filters.maxWeight);
            }
            if (filters.minRevenue) {
                query += ` AND total_revenue >= ?`;
                params.push(filters.minRevenue);
            }
            if (filters.maxRevenue) {
                query += ` AND total_revenue <= ?`;
                params.push(filters.maxRevenue);
            }

            query += ` ORDER BY date DESC`;

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // ค้นหาข้อมูลปุ๋ย
    async searchFertilizer(userId, filters = {}) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT * FROM fertilizer_data 
                WHERE 1=1
            `;
            let params = [];

            if (filters.dateFrom) {
                query += ` AND date >= ?`;
                params.push(filters.dateFrom);
            }
            if (filters.dateTo) {
                query += ` AND date <= ?`;
                params.push(filters.dateTo);
            }
            if (filters.fertilizerType) {
                query += ` AND item LIKE ?`;
                params.push(`%${filters.fertilizerType}%`);
            }
            if (filters.minCost) {
                query += ` AND total_cost >= ?`;
                params.push(filters.minCost);
            }

            query += ` ORDER BY date DESC`;

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // ค้นหาข้อมูลต้นปาล์ม
    async searchPalmTrees(userId, filters = {}) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT * FROM palm_tree_data 
                WHERE 1=1
            `;
            let params = [];

            if (filters.treeId) {
                query += ` AND tree_id LIKE ?`;
                params.push(`%${filters.treeId}%`);
            }
            if (filters.dateFrom) {
                query += ` AND harvest_date >= ?`;
                params.push(filters.dateFrom);
            }
            if (filters.dateTo) {
                query += ` AND harvest_date <= ?`;
                params.push(filters.dateTo);
            }
            if (filters.minBunches) {
                query += ` AND bunch_count >= ?`;
                params.push(filters.minBunches);
            }

            query += ` ORDER BY harvest_date DESC`;

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // ค้นหาบันทึก
    async searchNotes(userId, filters = {}) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT * FROM notes_data 
                WHERE 1=1
            `;
            let params = [];

            if (filters.keyword) {
                query += ` AND (title LIKE ? OR content LIKE ?)`;
                params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
            }
            if (filters.dateFrom) {
                query += ` AND date >= ?`;
                params.push(filters.dateFrom);
            }
            if (filters.dateTo) {
                query += ` AND date <= ?`;
                params.push(filters.dateTo);
            }

            query += ` ORDER BY date DESC`;

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // สถิติการเก็บเกี่ยวตามช่วงเวลา
    async getHarvestStats(userId, dateFrom, dateTo) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    COUNT(*) as total_harvests,
                    SUM(total_weight) as total_weight,
                    SUM(total_revenue) as total_revenue,
                    SUM(harvesting_cost) as total_cost,
                    SUM(net_profit) as total_profit,
                    AVG(price_per_kg) as avg_price,
                    SUM(fallen_weight) as total_fallen_weight,
                    SUM(fallen_weight * fallen_price_per_kg) as fallen_revenue
                FROM harvest_data 
                WHERE date BETWEEN ? AND ?
            `;

            this.db.get(query, [dateFrom, dateTo], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // ต้นปาล์มที่ให้ผลผลิตสูงสุด
    async getTopPerformingTrees(userId, limit = 10) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    tree_id,
                    COUNT(*) as harvest_count,
                    SUM(bunch_count) as total_bunches,
                    AVG(bunch_count) as avg_bunches,
                    MAX(harvest_date) as last_harvest
                FROM palm_tree_data 
                WHERE bunch_count > 0
                GROUP BY tree_id
                ORDER BY total_bunches DESC
                LIMIT ?
            `;

            this.db.all(query, [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // คำนวณวันเก็บเกี่ยวครั้งต่อไป (วันล่าสุด + 15 วัน)
    async getNextHarvestDate(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT date as last_harvest_date 
                FROM harvest_data 
                ORDER BY date DESC 
                LIMIT 1
            `;

            this.db.get(query, (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!row) {
                    resolve("ไม่พบข้อมูลการเก็บเกี่ยวก่อนหน้า แนะนำให้เก็บเกี่ยวเมื่อผลปาล์มสุก (ประมาณทุก 15-20 วัน)");
                    return;
                }

                try {
                    // แปลงวันที่จากฐานข้อมูล (YYYY-MM-DD)
                    const lastHarvestDate = new Date(row.last_harvest_date);
                    
                    // บวก 15 วัน
                    const nextHarvestDate = new Date(lastHarvestDate);
                    nextHarvestDate.setDate(lastHarvestDate.getDate() + 15);
                    
                    // แปลงเป็นรูปแบบไทย
                    const thaiDate = nextHarvestDate.toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                    });
                    
                    // คำนวณจำนวนวันที่เหลือ
                    const today = new Date();
                    const diffTime = nextHarvestDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    let message = `เก็บเกี่ยวครั้งต่อไป: วัน${thaiDate}`;
                    
                    if (diffDays > 0) {
                        message += ` (อีก ${diffDays} วัน)`;
                    } else if (diffDays === 0) {
                        message += ` (วันนี้!)`;
                    } else {
                        message += ` (เลยกำหนดแล้ว ${Math.abs(diffDays)} วัน)`;
                    }
                    
                    // เพิ่มข้อมูลการเก็บเกี่ยวล่าสุด
                    const lastHarvestThai = lastHarvestDate.toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long', 
                        day: 'numeric'
                    });
                    message += `\n\nเก็บเกี่ยวครั้งล่าสุด: ${lastHarvestThai}`;
                    
                    resolve(message);
                    
                } catch (error) {
                    resolve(`เกิดข้อผิดพลาดในการคำนวณวันที่: ${error.message}`);
                }
            });
        });
    }

    // ค้นหาแบบ Full-text (คำถาม-คำตอบอัตโนมัติ)
    async answerQuestion(question, userId) {
        const questionLower = question.toLowerCase();
        
        // รายได้เดือนนี้
        if (questionLower.includes('รายได้') && questionLower.includes('เดือนนี้')) {
            const currentDate = new Date();
            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            
            const stats = await this.getHarvestStats(userId, 
                firstDay.toISOString().split('T')[0],
                lastDay.toISOString().split('T')[0]
            );
            
            return `รายได้เดือนนี้ (${currentDate.toLocaleDateString('th-TH', {month: 'long'})}): ${(stats.total_revenue || 0).toLocaleString()} บาท จากการเก็บเกี่ยว ${stats.total_harvests || 0} ครั้ง`;
        }

        // รายได้เดือนที่แล้ว  
        if (questionLower.includes('รายได้') && questionLower.includes('เดือนที่แล้ว')) {
            const currentDate = new Date();
            const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
            
            const stats = await this.getHarvestStats(userId,
                lastMonth.toISOString().split('T')[0], 
                lastMonthEnd.toISOString().split('T')[0]
            );
            
            return `รายได้เดือนที่แล้ว (${lastMonth.toLocaleDateString('th-TH', {month: 'long'})}): ${(stats.total_revenue || 0).toLocaleString()} บาท จากการเก็บเกี่ยว ${stats.total_harvests || 0} ครั้ง`;
        }

        // ต้นไหนให้ผลผลิตเยอะที่สุด
        if (questionLower.includes('ต้นไหน') && questionLower.includes('ผลผลิต')) {
            const topTrees = await this.getTopPerformingTrees(userId, 5);
            if (topTrees.length > 0) {
                const tree = topTrees[0];
                return `ต้น ${tree.tree_id} ให้ผลผลิตสูงสุด: ${tree.total_bunches} ทะลาย จากการเก็บ ${tree.harvest_count} ครั้ง (เฉลี่ย ${tree.avg_bunches.toFixed(1)} ทะลาย/ครั้ง)`;
            }
            return "ไม่พบข้อมูลการเก็บเกี่ยวต้นปาล์ม";
        }

        // วันนี้วันที่เท่าไร
        if (questionLower.includes('วันนี้') && questionLower.includes('วันที่')) {
            const today = new Date();
            const thaiDate = today.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
            return `วันนี้คือวัน${thaiDate}`;
        }

        // กำไรสุทธิ
        if (questionLower.includes('กำไร')) {
            // กำไรทั้งหมด
            if (questionLower.includes('ทั้งหมด')) {
                const stats = await this.getHarvestStats(userId, '2020-01-01', '2030-12-31');
                return `กำไรสุทธิทั้งหมด: ${(stats.total_profit || 0).toLocaleString()} บาท (รายได้ ${(stats.total_revenue || 0).toLocaleString()} - ค่าใช้จ่าย ${(stats.total_cost || 0).toLocaleString()})`;
            } else {
                // กำไรเดือนนี้
                const currentDate = new Date();
                const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                
                const stats = await this.getHarvestStats(userId,
                    firstDay.toISOString().split('T')[0],
                    lastDay.toISOString().split('T')[0]
                );
                
                return `กำไรสุทธิเดือนนี้: ${(stats.total_profit || 0).toLocaleString()} บาท (รายได้ ${(stats.total_revenue || 0).toLocaleString()} - ค่าใช้จ่าย ${(stats.total_cost || 0).toLocaleString()})`;
            }
        }

        // น้ำหนักรวม
        if (questionLower.includes('น้ำหนักรวม')) {
            if (questionLower.includes('เดือนนี้')) {
                const currentDate = new Date();
                const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                
                const stats = await this.getHarvestStats(userId,
                    firstDay.toISOString().split('T')[0],
                    lastDay.toISOString().split('T')[0]
                );
                
                return `น้ำหนักรวมเดือนนี้: ${(stats.total_weight || 0).toLocaleString()} กก. จากการเก็บเกี่ยว ${stats.total_harvests || 0} ครั้ง`;
            } else if (questionLower.includes('เดือนที่แล้ว')) {
                const currentDate = new Date();
                const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
                const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
                
                const stats = await this.getHarvestStats(userId,
                    lastMonth.toISOString().split('T')[0],
                    lastMonthEnd.toISOString().split('T')[0]
                );
                
                return `น้ำหนักรวมเดือนที่แล้ว: ${(stats.total_weight || 0).toLocaleString()} กก. จากการเก็บเกี่ยว ${stats.total_harvests || 0} ครั้ง`;
            }
        }

        // ราคาเฉลี่ย
        if (questionLower.includes('ราคาเฉลี่ย')) {
            if (questionLower.includes('เดือนนี้')) {
                const currentDate = new Date();
                const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                
                const stats = await this.getHarvestStats(userId,
                    firstDay.toISOString().split('T')[0],
                    lastDay.toISOString().split('T')[0]
                );
                
                return `ราคาเฉลี่ยเดือนนี้: ${(stats.avg_price || 0).toFixed(2)} บาท/กก. จากการเก็บเกี่ยว ${stats.total_harvests || 0} ครั้ง`;
            } else if (questionLower.includes('เดือนที่แล้ว')) {
                const currentDate = new Date();
                const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
                const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
                
                const stats = await this.getHarvestStats(userId,
                    lastMonth.toISOString().split('T')[0],
                    lastMonthEnd.toISOString().split('T')[0]
                );
                
                return `ราคาเฉลี่ยเดือนที่แล้ว: ${(stats.avg_price || 0).toFixed(2)} บาท/กก. จากการเก็บเกี่ยว ${stats.total_harvests || 0} ครั้ง`;
            }
        }

        // เก็บเกี่ยวครั้งต่อไปเมื่อไหร่
        if (questionLower.includes('เก็บเกี่ยว') && (questionLower.includes('ครั้งต่อไป') || questionLower.includes('ต่อไป') || questionLower.includes('เมื่อไหร่'))) {
            const nextHarvest = await this.getNextHarvestDate(userId);
            return nextHarvest;
        }

        // ใส่ปุ๋ยครั้งล่าสุดเมื่อไหร่
        if (questionLower.includes('ปุ๋ย') && questionLower.includes('ล่าสุด')) {
            return new Promise((resolve, reject) => {
                const query = `
                    SELECT date, fertilizer_type, amount, total_cost 
                    FROM fertilizer_data 
                    ORDER BY date DESC 
                    LIMIT 1
                `;
                
                this.db.get(query, (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (!row) {
                        resolve('ยังไม่มีข้อมูลการใส่ปุ๋ย');
                        return;
                    }
                    
                    const date = new Date(row.date);
                    const thaiDate = date.toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    
                    resolve(`ใส่ปุ๋ยครั้งล่าสุด: วันที่ ${thaiDate}\nประเภท: ${row.fertilizer_type}\nจำนวน: ${row.amount} กระสอบ\nค่าใช้จ่าย: ${row.total_cost.toLocaleString()} บาท`);
                });
            });
        }

        return "ขออภัย ไม่เข้าใจคำถาม ลองถามเกี่ยวกับ: รายได้เดือนนี้, กำไรสุทธิ, ต้นไหนให้ผลผลิตเยอะ, วันนี้วันที่เท่าไร, เก็บเกี่ยวครั้งต่อไปเมื่อไหร่, ใส่ปุ๋ยครั้งล่าสุดเมื่อไหร่";
    }
}

module.exports = OfflineSearchEngine;
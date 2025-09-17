const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/palmoil.db');

const query = `
    SELECT
        CASE
            WHEN date LIKE '%January%' THEN 'มกราคม'
            WHEN date LIKE '%February%' THEN 'กุมภาพันธ์'
            WHEN date LIKE '%March%' THEN 'มีนาคม'
            WHEN date LIKE '%April%' THEN 'เมษายน'
            WHEN date LIKE '%May%' THEN 'พฤษภาคม'
            WHEN date LIKE '%June%' THEN 'มิถุนายน'
            WHEN date LIKE '%July%' THEN 'กรกฎาคม'
            WHEN date LIKE '%August%' THEN 'สิงหาคม'
            WHEN date LIKE '%September%' THEN 'กันยายน'
            WHEN date LIKE '%October%' THEN 'ตุลาคม'
            WHEN date LIKE '%November%' THEN 'พฤศจิกายน'
            WHEN date LIKE '%December%' THEN 'ธันวาคม'
            ELSE 'ไม่ระบุ'
        END as thai_month,
        COUNT(*) as records,
        SUM(total_revenue) as revenue,
        SUM(net_profit) as profit,
        SUBSTR(date, -4) as year
    FROM harvest_data
    GROUP BY thai_month, year
    ORDER BY year DESC, thai_month DESC
    LIMIT 12
`;

db.all(query, (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Monthly Revenue Data:');
        rows.forEach(row => {
            console.log(`${row.thai_month} ${row.year}: ${row.records} รายการ, รายได้: ${row.revenue?.toLocaleString() || 0} บาท, กำไร: ${row.profit?.toLocaleString() || 0} บาท`);
        });
    }
    db.close();
});
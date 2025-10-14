const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class DatabaseMigrator {
  constructor() {
    // SQLite connection
    this.sqliteDb = new sqlite3.Database('./database/palmoil.db');
    
    // PostgreSQL connection - ใช้ environment variables
    this.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async migrate() {
    try {
      console.log('🚀 เริ่มต้นการ migrate ฐานข้อมูล...\n');

      // 1. สร้าง schema ใน PostgreSQL
      await this.createPostgreSQLSchema();

      // 2. Migrate ข้อมูล users
      await this.migrateUsers();

      // 3. Migrate ข้อมูล harvest_data
      await this.migrateHarvestData();

      // 4. Migrate ข้อมูล fertilizer_data
      await this.migrateFertilizerData();

      // 5. Migrate ข้อมูล palm_tree_data
      await this.migratePalmTreeData();

      // 6. Migrate ข้อมูล notes_data
      await this.migrateNotesData();

      console.log('\n✅ การ migrate เสร็จสิ้นเรียบร้อย!');

    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการ migrate:', error);
      throw error;
    }
  }

  async createPostgreSQLSchema() {
    console.log('📋 สร้าง schema ใน PostgreSQL...');
    
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'database/postgresql-schema.sql'), 'utf8');
    await this.pgPool.query(schemaSQL);
    
    console.log('✅ Schema สร้างเรียบร้อย');
  }

  async migrateUsers() {
    console.log('👥 กำลัง migrate ตาราง users...');

    return new Promise((resolve, reject) => {
      this.sqliteDb.all('SELECT * FROM users', async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          for (const row of rows) {
            const query = `
              INSERT INTO users (id, username, email, password, role, is_active, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              ON CONFLICT (email) DO UPDATE SET
                username = EXCLUDED.username,
                password = EXCLUDED.password,
                role = EXCLUDED.role,
                is_active = EXCLUDED.is_active,
                updated_at = EXCLUDED.updated_at
            `;
            
            await this.pgPool.query(query, [
              row.id,
              row.username,
              row.email,
              row.password,
              row.role,
              row.is_active === 1,
              row.created_at,
              row.updated_at
            ]);
          }

          // Update sequence
          if (rows.length > 0) {
            const maxId = Math.max(...rows.map(r => r.id));
            await this.pgPool.query(`SELECT setval('users_id_seq', $1, true)`, [maxId]);
          }

          console.log(`✅ migrate users เสร็จสิ้น (${rows.length} รายการ)`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async migrateHarvestData() {
    console.log('🌾 กำลัง migrate ตาราง harvest_data...');

    return new Promise((resolve, reject) => {
      this.sqliteDb.all('SELECT * FROM harvest_data', async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          for (const row of rows) {
            const query = `
              INSERT INTO harvest_data 
              (id, user_id, date, total_weight, price_per_kg, total_revenue, harvesting_cost, net_profit, fallen_weight, fallen_price_per_kg, created_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `;
            
            await this.pgPool.query(query, [
              row.id,
              row.user_id,
              row.date,
              row.total_weight,
              row.price_per_kg,
              row.total_revenue,
              row.harvesting_cost,
              row.net_profit,
              row.fallen_weight || 0,
              row.fallen_price_per_kg || 0,
              row.created_at
            ]);
          }

          // Update sequence
          if (rows.length > 0) {
            const maxId = Math.max(...rows.map(r => r.id));
            await this.pgPool.query(`SELECT setval('harvest_data_id_seq', $1, true)`, [maxId]);
          }

          console.log(`✅ migrate harvest_data เสร็จสิ้น (${rows.length} รายการ)`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async migrateFertilizerData() {
    console.log('🧪 กำลัง migrate ตาราง fertilizer_data...');

    return new Promise((resolve, reject) => {
      this.sqliteDb.all('SELECT * FROM fertilizer_data', async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          for (const row of rows) {
            const query = `
              INSERT INTO fertilizer_data 
              (id, user_id, date, fertilizer_type, amount, cost_per_bag, labor_cost, total_cost, supplier, notes, created_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `;
            
            await this.pgPool.query(query, [
              row.id,
              row.user_id,
              row.date,
              row.item || row.fertilizer_type || '', // Handle column name differences
              row.sacks || row.amount || 0,
              row.price_per_sack || row.cost_per_bag || 0,
              row.labor_cost || 0,
              row.total_cost,
              row.supplier || '',
              row.notes || '',
              row.created_at
            ]);
          }

          // Update sequence
          if (rows.length > 0) {
            const maxId = Math.max(...rows.map(r => r.id));
            await this.pgPool.query(`SELECT setval('fertilizer_data_id_seq', $1, true)`, [maxId]);
          }

          console.log(`✅ migrate fertilizer_data เสร็จสิ้น (${rows.length} รายการ)`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async migratePalmTreeData() {
    console.log('🌴 กำลัง migrate ตาราง palm_tree_data...');

    return new Promise((resolve, reject) => {
      this.sqliteDb.all('SELECT * FROM palm_tree_data', async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          for (const row of rows) {
            const query = `
              INSERT INTO palm_tree_data 
              (id, user_id, tree_id, harvest_date, bunch_count, notes, created_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;
            
            await this.pgPool.query(query, [
              row.id,
              row.user_id,
              row.palm_tree || row.tree_id || '', // Handle column name differences
              row.date || row.harvest_date,
              row.bunches || row.bunch_count || 0,
              row.note || row.notes || '',
              row.created_at
            ]);
          }

          // Update sequence
          if (rows.length > 0) {
            const maxId = Math.max(...rows.map(r => r.id));
            await this.pgPool.query(`SELECT setval('palm_tree_data_id_seq', $1, true)`, [maxId]);
          }

          console.log(`✅ migrate palm_tree_data เสร็จสิ้น (${rows.length} รายการ)`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async migrateNotesData() {
    console.log('📝 กำลัง migrate ตาราง notes_data...');

    return new Promise((resolve, reject) => {
      this.sqliteDb.all('SELECT * FROM notes_data', async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          for (const row of rows) {
            const query = `
              INSERT INTO notes_data 
              (id, user_id, date, title, content, category, priority, created_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `;
            
            await this.pgPool.query(query, [
              row.id,
              row.user_id,
              row.date,
              row.title,
              row.content,
              row.category || 'ทั่วไป',
              row.priority || 'ปานกลาง',
              row.created_at
            ]);
          }

          // Update sequence
          if (rows.length > 0) {
            const maxId = Math.max(...rows.map(r => r.id));
            await this.pgPool.query(`SELECT setval('notes_data_id_seq', $1, true)`, [maxId]);
          }

          console.log(`✅ migrate notes_data เสร็จสิ้น (${rows.length} รายการ)`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async close() {
    this.sqliteDb.close();
    await this.pgPool.end();
  }

  async testConnection() {
    try {
      console.log('🔌 ทดสอบการเชื่อมต่อ PostgreSQL...');
      
      const result = await this.pgPool.query('SELECT version()');
      console.log('✅ เชื่อมต่อ PostgreSQL สำเร็จ');
      console.log('📋 Version:', result.rows[0].version);
      
      // ทดสอบตาราง
      const tables = await this.pgPool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      console.log('📊 ตารางใน PostgreSQL:', tables.rows.map(r => r.table_name));
      
      return true;
    } catch (error) {
      console.error('❌ การเชื่อมต่อ PostgreSQL ล้มเหลว:', error.message);
      return false;
    }
  }
}

// ใช้งาน migration
if (require.main === module) {
  const migrator = new DatabaseMigrator();
  
  migrator.testConnection()
    .then(connected => {
      if (connected) {
        return migrator.migrate();
      } else {
        throw new Error('ไม่สามารถเชื่อมต่อ PostgreSQL ได้');
      }
    })
    .then(() => {
      console.log('\n🎉 Migration สำเร็จ!');
      return migrator.close();
    })
    .catch(error => {
      console.error('\n💥 Migration ล้มเหลว:', error);
      migrator.close();
      process.exit(1);
    });
}

module.exports = DatabaseMigrator;
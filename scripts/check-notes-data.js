const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking notes data in database...');

// Check all notes
db.all('SELECT id, user_id, date, title, content, category, priority FROM notes_data', [], (err, rows) => {
  if (err) {
    console.error('❌ Error reading notes:', err);
    return;
  }

  console.log('\n📋 Current notes in database:');
  console.log('ID | User | Date | Title | Category | Priority');
  console.log('---|------|------|-------|----------|----------');

  rows.forEach(row => {
    console.log(`${row.id} | ${row.user_id} | ${row.date} | ${row.title} | ${row.category} | ${row.priority}`);
  });

  console.log(`\n✅ Total notes: ${rows.length}`);

  if (rows.length > 0) {
    console.log('\n📝 Sample note content:');
    console.log(`Title: ${rows[0].title}`);
    console.log(`Content: ${rows[0].content}`);
    console.log(`Category: ${rows[0].category}`);
    console.log(`Priority: ${rows[0].priority}`);
  }

  db.close();
});
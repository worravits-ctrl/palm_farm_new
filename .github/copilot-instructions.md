# ระบบจัดการธุรกิจน้ำมันปาล์ม - คู่มือสำหรับ AI Coding

## ภาพรวม
ระบบจัดการสวนปาล์มน้ำมันแบบ full-stack ด้วย React frontend, Node.js/Express backend, ฐานข้อมูล SQLite และ Gemini AI assistant

## สถาปัตยกรรม
- **Frontend**: React 18 (CDN) + Tailwind CSS, สองเวอร์ชัน: API-based (`palm-oil-database-app.html`) และ localStorage (`Qwen_jsx_20250912_y4d6679zr.jsx`)
- **Backend**: Express.js พร้อม JWT auth, RESTful API บน port 3001
- **ฐานข้อมูล**: SQLite (`database/palmoil.db`), 5 ตารางพร้อมข้อมูล user-scoped และ CASCADE deletes
- **AI**: การผสาน Gemini สำหรับคำถามธุรกิจ

## การไหลของข้อมูล
- Multi-user: ข้อมูลทั้งหมดเชื่อมโยงกับ `user_id`, บทบาท admin สำหรับจัดการผู้ใช้
- Authentication: รหัสผ่าน bcrypt, JWT tokens พร้อม role-based access
- เอนทิตีธุรกิจ: harvest (น้ำหนัก/ราคา/ต้นทุน), fertilizer (กระสอบ/ต้นทุน), palm trees (A1-L26, bunches), notes

## ตรรกะทางธุรกิจ
- สกุลเงิน: THB พร้อมความแม่นยำ `.toFixed(2)`
- วันที่: รูปแบบไทย (dd/mm/yyyy, Buddhist era) แปลงเป็น YYYY-MM-DD
- การคำนวณ: `totalRevenue = totalWeight * pricePerKg`, `netProfit = totalRevenue - harvestingCost`
- หน่วย: bunches (ทะลาย), sacks (กระสอบ)

## รูปแบบ UI
- การนำทางแท็บ: Dashboard, Harvest, Fertilizer, Palm Trees, Notes, Reports, Users (admin)
- ฟอร์ม: FormData extraction → validation → API calls → error handling ภาษาไทย
- CSV: `exportToCSV(data, filename, headers)`, `importFromCSV(event, setData, headers)`
- AI Chat: การตอบกลับแบบ keyword จากข้อมูลปัจจุบัน

## ขั้นตอนการพัฒนา
- Init DB: `npm run init-db` (รัน `scripts/init-database.js`)
- Start API: `node api-server.js`
- Start Frontend: `node simple-server.js` (port 3000)
- Test: `node test-*.js` พร้อม JWT tokens hardcoded
- Debug: Console logs ใน server, browser dev tools

## ข้อตกลงโครงการ
- ไม่มี build tools: แก้ไข JSX/HTML โดยตรง, รีเฟรชเบราว์เซอร์
- Security: Rate limiting (1000 req/15min), Helmet CSP สำหรับ CDN resources
- Indexes: Optimized สำหรับ user_id และ date queries
- Code: คอมเมนต์ภาษาไทย, ศัพท์การเกษตร

## ตัวอย่างโค้ด
- API: `app.get('/api/harvest', authenticateToken, (req, res) => { db.all('SELECT * FROM harvest_data WHERE user_id = ?', [req.user.id], ...) })`
- React: `const [data, setData] = useState([]); useEffect(() => fetchData(), []);`
- Date: `normalizeDate(input)` สำหรับแปลงวันที่ไทย

Reference: `api-server.js`, `schema.sql`, `Qwen_jsx_20250912_y4d6679zr.jsx`, `package.json`
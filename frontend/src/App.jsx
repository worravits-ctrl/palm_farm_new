import React, { useState, useEffect } from 'react';
import './App.css';

// ฟังก์ชัน normalize วันที่ทุกแบบเป็น YYYY-MM-DD
function normalizeDate(str) {
  // 1. dd/mm/yyyy หรือ d/m/yyyy
  let m = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) {
    let day = m[1].padStart(2,'0');
    let month = m[2].padStart(2,'0');
    let year = parseInt(m[3],10);
    if (year > 2400) year -= 543;
    return `${year}-${month}-${day}`;
  }
  // 2. 8 สิงหาคม 2568 หรือ 08 ส.ค. 2568
  const thMonths = {
    'มกราคม':1,'ม.ค.':1,'jan':1,'january':1,
    'กุมภาพันธ์':2,'ก.พ.':2,'feb':2,'february':2,
    'มีนาคม':3,'มี.ค.':3,'mar':3,'march':3,
    'เมษายน':4,'เม.ย.':4,'apr':4,'april':4,
    'พฤษภาคม':5,'พ.ค.':5,'may':5,
    'มิถุนายน':6,'มิ.ย.':6,'jun':6,'june':6,
    'กรกฎาคม':7,'ก.ค.':7,'jul':7,'july':7,
    'สิงหาคม':8,'ส.ค.':8,'aug':8,'august':8,
    'กันยายน':9,'ก.ย.':9,'sep':9,'september':9,
    'ตุลาคม':10,'ต.ค.':10,'oct':10,'october':10,
    'พฤศจิกายน':11,'พ.ย.':11,'nov':11,'november':11,
    'ธันวาคม':12,'ธ.ค.':12,'dec':12,'december':12
  };
  m = str.match(/(\d{1,2})\s*([ก-ฮa-zA-Z.]+)\s*(\d{4})/i);
  if (m) {
    let day = m[1].padStart(2,'0');
    let month = thMonths[m[2].toLowerCase()];
    let year = parseInt(m[3],10);
    if (year > 2400) year -= 543;
    if (!month) return str;
    return `${year}-${month.toString().padStart(2,'0')}-${day}`;
  }
  // 3. YYYY-MM-DD (ผ่าน)
  m = str.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return str;
  return str;
}

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('login');
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');


  // API data states
  const [harvestData, setHarvestData] = useState([]);
  const [fertilizerData, setFertilizerData] = useState([]);
  const [palmTreeData, setPalmTreeData] = useState([]);
  const [notesData, setNotesData] = useState([]);
  const [users, setUsers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  // Edit mode states
  const [editingNote, setEditingNote] = useState(null);
  const [editFormData, setEditFormData] = useState({
    date: '',
    title: '',
    content: '',
    category: 'ทั่วไป',
    priority: 'ปานกลาง'
  });

  // API base URL
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'; // Use VITE_API_BASE_URL from environment variables

  // Helper: fetch with auth
  const apiFetch = async (url, options = {}) => {
    const headers = options.headers || {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
  };

  // Search harvest data from database
  const searchHarvestData = async (query = '', options = {}) => {
    if (!token) return null;

    try {
      const params = new URLSearchParams();
      
      // Add search query
      if (query) params.append('q', query);
      
      // Add date filters
      if (options.startDate) params.append('start_date', options.startDate);
      if (options.endDate) params.append('end_date', options.endDate);
      
      // Add weight filters
      if (options.minWeight) params.append('min_weight', options.minWeight);
      if (options.maxWeight) params.append('max_weight', options.maxWeight);
      
      // Add revenue filters
      if (options.minRevenue) params.append('min_revenue', options.minRevenue);
      if (options.maxRevenue) params.append('max_revenue', options.maxRevenue);
      
      // Add sorting
      if (options.sortBy) params.append('sort_by', options.sortBy);
      if (options.sortOrder) params.append('sort_order', options.sortOrder);
      
      // Add limit
      params.append('limit', options.limit || 50);

      const url = `${API_BASE}/harvest/search?${params.toString()}`;
      console.log('🔍 Searching harvest data:', url);
      
      const res = await apiFetch(url);
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Harvest search results:', data.results?.length || 0, 'records');
        return data;
      } else {
        console.error('❌ Harvest search failed:', res.status, res.statusText);
        return null;
      }
    } catch (error) {
      console.error('❌ Harvest search error:', error);
      return null;
    }
  };

  // Load dashboard stats
  const loadDashboardStats = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/stats`);
      if (res.ok) {
        const stats = await res.json();
        setDashboardStats(stats);
      }
    } catch (e) {}
    setLoading(false);
  };

  // Load all main data
  const loadAllData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      console.log('🔄 Loading all data...');
      const [harvestRes, fertRes, palmRes, notesRes] = await Promise.all([
        apiFetch(`${API_BASE}/harvest`),
        apiFetch(`${API_BASE}/fertilizer`),
        apiFetch(`${API_BASE}/palmtrees`),
        apiFetch(`${API_BASE}/notes`)
      ]);

      console.log('📊 API responses:', {
        harvest: harvestRes.ok,
        fertilizer: fertRes.ok,
        palmtrees: palmRes.ok,
        notes: notesRes.ok
      });

      if (harvestRes.ok) {
        const harvestData = await harvestRes.json();
        console.log('✅ Harvest data loaded:', harvestData.length, 'records');
        setHarvestData(harvestData);
      } else {
        console.error('❌ Harvest API error:', harvestRes.status, harvestRes.statusText);
      }

      if (fertRes.ok) {
        const fertData = await fertRes.json();
        console.log('✅ Fertilizer data loaded:', fertData.length, 'records');
        setFertilizerData(fertData);
      } else {
        console.error('❌ Fertilizer API error:', fertRes.status, fertRes.statusText);
      }

      if (palmRes.ok) {
        const palmData = await palmRes.json();
        console.log('✅ Palm trees data loaded:', palmData.length, 'records');
        setPalmTreeData(palmData);
      } else {
        console.error('❌ Palm trees API error:', palmRes.status, palmRes.statusText);
      }

      if (notesRes.ok) {
        const notesData = await notesRes.json();
        console.log('✅ Notes data loaded:', notesData.length, 'records');
        setNotesData(notesData);
      } else {
        console.error('❌ Notes API error:', notesRes.status, notesRes.statusText);
      }
    } catch (e) {
      console.error('❌ Error loading data:', e);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + e.message);
    }
    setLoading(false);
  };

  // Load users (admin only)
  const loadUsers = async () => {
    if (!token || !currentUser?.role || currentUser.role !== 'admin') return;
    try {
      const res = await apiFetch(`${API_BASE}/users`);
      if (res.ok) setUsers(await res.json());
    } catch (e) {}
  };

  // Effect: load data after login
  useEffect(() => {
    if (token) {
      loadDashboardStats();
      loadAllData();
      loadUsers();
    }
  }, [token]); // Only load when token changes (after login), not when activeTab changes

  // Generate palm tree names A1 to L26
  const generatePalmTreeNames = () => {
    const trees = [];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, 12); // A to L
    for (let i = 0; i < letters.length; i++) {
      for (let j = 1; j <= 26; j++) {
        trees.push(`${letters[i]}${j}`);
      }
    }
    return trees;
  };

  const palmTrees = generatePalmTreeNames();


  // Login handler (API)
  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setCurrentUser(data.user);
        // Load data immediately after setting token
        await loadDashboardStats();
        await loadAllData();
        await loadUsers();
        setActiveTab('dashboard');
      } else {
        const err = await res.json();
        alert(err.error || 'Login failed');
      }
    } catch (e) {
      alert('Login error');
    }
    setLoading(false);
  };

  // Signup handler (API)
  const handleSignup = async (username, email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      if (res.ok) {
        alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
        setActiveTab('login');
      } else {
        const err = await res.json();
        alert(err.error || 'Signup failed');
      }
    } catch (e) {
      alert('Signup error');
    }
    setLoading(false);
  };


  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    setActiveTab('login');
    setHarvestData([]);
    setFertilizerData([]);
    setPalmTreeData([]);
    setNotesData([]);
    setUsers([]);
    setDashboardStats(null);
  };


  // Harvest form submission (API)
  const handleHarvestSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      date: formData.get('date'),
      total_weight: parseFloat(formData.get('totalWeight')),
      price_per_kg: parseFloat(formData.get('pricePerKg')),
      harvesting_cost: parseFloat(formData.get('harvestingCost'))
    };
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/harvest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await loadAllData();
        e.target.reset();
      } else {
        const err = await res.json();
        alert(err.error || 'บันทึกข้อมูลเก็บเกี่ยวล้มเหลว');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดขณะบันทึกข้อมูล');
    }
    setLoading(false);
  };


  // Fertilizer form submission (API)
  const handleFertilizerSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      date: formData.get('date'),
      fertilizer_type: formData.get('item'),
      amount: parseInt(formData.get('sacks')),
      cost_per_bag: parseFloat(formData.get('pricePerSack')),
      labor_cost: parseFloat(formData.get('laborCost')),
      supplier: '',
      notes: ''
    };
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/fertilizer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await loadAllData();
        e.target.reset();
      } else {
        const err = await res.json();
        alert(err.error || 'บันทึกข้อมูลปุ๋ยล้มเหลว');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดขณะบันทึกข้อมูล');
    }
    setLoading(false);
  };


  // Palm tree harvest submission (API)
  const handlePalmTreeSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      tree_id: formData.get('palmTree'),
      harvest_date: formData.get('date'),
      bunch_count: parseInt(formData.get('bunches')),
      notes: formData.get('note') || ''
    };
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/palmtrees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await loadAllData();
        e.target.reset();
      } else {
        const err = await res.json();
        alert(err.error || 'บันทึกข้อมูลต้นปาล์มล้มเหลว');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดขณะบันทึกข้อมูล');
    }
    setLoading(false);
  };


  // Delete harvest
  const handleDeleteHarvest = async (id) => {
    if (!confirm('คุณต้องการลบข้อมูลการเก็บเกี่ยวนี้หรือไม่?')) return;
    
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/harvest/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadAllData();
      } else {
        const err = await res.json();
        alert(err.error || 'ลบข้อมูลการเก็บเกี่ยวไม่สำเร็จ');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดขณะลบข้อมูล');
    }
    setLoading(false);
  };

  // Delete fertilizer
  const handleDeleteFertilizer = async (id) => {
    if (!confirm('คุณต้องการลบข้อมูลปุ๋ยนี้หรือไม่?')) return;
    
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/fertilizer/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadAllData();
      } else {
        const err = await res.json();
        alert(err.error || 'ลบข้อมูลปุ๋ยไม่สำเร็จ');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดขณะลบข้อมูล');
    }
    setLoading(false);
  };

  // Delete palm tree
  const handleDeletePalmTree = async (id) => {
    if (!confirm('คุณต้องการลบข้อมูลต้นปาล์มนี้หรือไม่?')) return;
    
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/palmtrees/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadAllData();
      } else {
        const err = await res.json();
        alert(err.error || 'ลบข้อมูลต้นปาล์มไม่สำเร็จ');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดขณะลบข้อมูล');
    }
    setLoading(false);
  };

  // Notes form submission (API)
  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      date: formData.get('date'),
      title: formData.get('title'),
      content: formData.get('content'),
      category: formData.get('category') || 'ทั่วไป',
      priority: formData.get('priority') || 'ปานกลาง'
    };
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await loadAllData();
        e.target.reset();
      } else {
        const err = await res.json();
        alert(err.error || 'บันทึกบันทึกย่อล้มเหลว');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดขณะบันทึกข้อมูล');
    }
    setLoading(false);
  };

  // Delete note
  const handleDeleteNote = async (id) => {
    if (!confirm('คุณต้องการลบบันทึกย่อนี้หรือไม่?')) return;
    
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/notes/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadAllData();
      } else {
        const err = await res.json();
        alert(err.error || 'ลบบันทึกย่อไม่สำเร็จ');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดขณะลบข้อมูล');
    }
    setLoading(false);
  };

  // Edit note - start editing
  const handleEditNote = (note) => {
    setEditingNote(note.id);
    setEditFormData({
      date: note.date,
      title: note.title,
      content: note.content,
      category: note.category || 'ทั่วไป',
      priority: note.priority || 'ปานกลาง'
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditFormData({
      date: '',
      title: '',
      content: '',
      category: 'ทั่วไป',
      priority: 'ปานกลาง'
    });
  };

  // Update note (API)
  const handleUpdateNote = async (e) => {
    e.preventDefault();
    if (!editingNote) return;

    const formData = new FormData(e.target);
    const payload = {
      date: formData.get('date'),
      title: formData.get('title'),
      content: formData.get('content'),
      category: formData.get('category') || 'ทั่วไป',
      priority: formData.get('priority') || 'ปานกลาง'
    };

    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/notes/${editingNote}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await loadAllData();
        handleCancelEdit();
      } else {
        const err = await res.json();
        alert(err.error || 'แก้ไขบันทึกย่อล้มเหลว');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดขณะแก้ไขข้อมูล');
    }
    setLoading(false);
  };

  // Export to CSV
  const exportToCSV = (data, filename, headers) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import from CSV
  const importFromCSV = (event, setData, headers) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const importedData = [];
      
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, index) => {
          let value = values[index] ? values[index].replace(/^"|"$/g, '') : '';
          
          // Convert numeric values
          if (!isNaN(value) && value !== '') {
            value = parseFloat(value);
          }
          
          row[header] = value;
        });
        
        importedData.push(row);
      }
      
      setData([...importedData, ...setData()]);
    };
    reader.readAsText(file);
  };

  // Simulated Gemini AI responses
  const getAIResponse = async (message) => {
  // ตัวอย่างการใช้งาน thaiDateToISO:
  // thaiDateToISO('8 สิงหาคม 2568') => '2025-08-08'
    const lowerMsg = message.toLowerCase();
    
    // เมนูใหม่: การตัดปาล์ม/การเก็บเกี่ยว - aggregate/group harvestData ใน memory
    if (lowerMsg.includes('การตัดปาล์ม') || lowerMsg.includes('ตัดปาล์ม') || 
        lowerMsg.includes('การเก็บเกี่ยว') || lowerMsg.includes('เก็บเกี่ยว') || 
        lowerMsg.includes('harvest') || lowerMsg.includes('การเก็บ') || 
        lowerMsg.includes('เก็บปาล์ม') || lowerMsg.includes('ปาล์ม')) {
      try {
        // อ่าน harvestData ทั้งหมด (จาก state)
        let allData = harvestData;
        if (!allData || allData.length === 0) return 'ไม่พบข้อมูล';
        // Normalize วันที่ทุกแถว
        allData = allData.map(row => ({...row, _normDate: normalizeDate(row.date+"") }));
        // DEBUG: log harvestData ทั้งหมด
        console.log('DEBUG: harvestData', harvestData);
        console.log('DEBUG: allData (normalized)', allData);
        // ถามรายได้วันนี้
        if (lowerMsg.includes('วันนี้') || lowerMsg.includes('today')) {
          const today = new Date();
          const pad = n => n.toString().padStart(2, '0');
          const todayISO = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
          const found = allData.find(r => r._normDate === todayISO);
          if (found) {
            const profit = found.net_profit !== undefined ? found.net_profit : found.total_revenue;
            return `${(+profit).toLocaleString()} บาท`;
          }
          return 'ไม่พบข้อมูล';
        }
        // ถามรายได้เดือน X ปี Y
        const m = lowerMsg.match(/เดือน\s*([\d]+|[ก-ฮa-zA-Z]+)[^\d]*([\d]{4})/);
        if (m) {
          let month, year;
          const monthMap = {
            'มกราคม':1,'jan':1,'january':1,
            'กุมภาพันธ์':2,'feb':2,'february':2,
            'มีนาคม':3,'mar':3,'march':3,
            'เมษายน':4,'apr':4,'april':4,
            'พฤษภาคม':5,'may':5,
            'มิถุนายน':6,'jun':6,'june':6,
            'กรกฎาคม':7,'ก.ค.':7,'jul':7,'july':7,
            'สิงหาคม':8,'ส.ค.':8,'aug':8,'august':8,
            'กันยายน':9,'ก.ย.':9,'sep':9,'september':9,
            'ตุลาคม':10,'ต.ค.':10,'oct':10,'october':10,
            'พฤศจิกายน':11,'พ.ย.':11,'nov':11,'november':11,
            'ธันวาคม':12,'ธ.ค.':12,'dec':12,'december':12
          };
          if (isNaN(m[1])) {
            month = monthMap[m[1]];
          } else {
            month = parseInt(m[1]);
          }
          year = parseInt(m[2]);
          // ถ้าเป็น พ.ศ. ให้แปลงเป็น ค.ศ.
          if (year > 2400) year -= 543;
          if (month && year) {
            // filter เฉพาะแถวที่ตรงเดือน/ปี
            const rows = allData.filter(r => {
              const d = r._normDate.split('-');
              return d[0] == year && d[1] == month.toString().padStart(2,'0');
            });
            // DEBUG: log เฉพาะ rows ที่ filter ได้
            console.log(`DEBUG: Filtered rows for month=${month} year=${year}`, rows);
            if (rows.length === 0) return 'ไม่พบข้อมูล';
            // รวมยอดรายได้สุทธิ (หรือ total_revenue ถ้าไม่มี net_profit)
            let sum = 0;
            rows.forEach(r => {
              sum += (r.net_profit !== undefined ? +r.net_profit : +r.total_revenue);
            });
            return `${sum.toLocaleString()} บาท`;
          }
        }
        // ถามรายได้เดือนนี้
        if (lowerMsg.includes('เดือนนี้') || lowerMsg.includes('this month')) {
          const now = new Date();
          const year = now.getFullYear();
          const month = (now.getMonth()+1).toString().padStart(2,'0');
          const rows = allData.filter(r => {
            const d = r._normDate.split('-');
            return d[0] == year && d[1] == month;
          });
          if (rows.length === 0) return 'ไม่พบข้อมูล';
          let sum = 0;
          rows.forEach(r => {
            sum += (r.net_profit !== undefined ? +r.net_profit : +r.total_revenue);
          });
          return `${sum.toLocaleString()} บาท`;
        }
        // ถามรายได้ปีนี้
        if (lowerMsg.includes('ปีนี้') || lowerMsg.includes('this year')) {
          const year = (new Date()).getFullYear();
          const rows = allData.filter(r => r._normDate.startsWith(year+"-"));
          if (rows.length === 0) return 'ไม่พบข้อมูล';
          let sum = 0;
          rows.forEach(r => {
            sum += (r.net_profit !== undefined ? +r.net_profit : +r.total_revenue);
          });
          return `${sum.toLocaleString()} บาท`;
        }
        // fallback: ถามรายได้วันไหน/ข้อความอื่นๆ
        const dateMatch = lowerMsg.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (dateMatch) {
          const norm = normalizeDate(dateMatch[0]);
          const found = allData.find(r => r._normDate === norm);
          if (found) {
            const profit = found.net_profit !== undefined ? found.net_profit : found.total_revenue;
            return `${(+profit).toLocaleString()} บาท`;
          }
        }
        return 'ไม่พบข้อมูล';
      } catch (error) {
        console.error('❌ Error searching harvest data:', error);
        return 'เกิดข้อผิดพลาดในการค้นหาข้อมูลการเก็บเกี่ยว กรุณาลองใหม่อีกครั้ง';
      }
    }
    // เมนูใหม่: ค่าปุ๋ยแต่ละปี
    if (lowerMsg.includes('ค่าปุ๋ยแต่ละปี') || lowerMsg.includes('ค่าใช้จ่ายปุ๋ยรายปี')) {
      try {
        const res = await apiFetch(`${API_BASE}/yearly-stats`);
        if (res.ok) {
          const yearlyStats = await res.json();
          if (yearlyStats.fertilizer && yearlyStats.fertilizer.length > 0) {
            return yearlyStats.fertilizer.map(y => `ปี ${y.year}: ${(+y.total_cost).toLocaleString()} บาท (${y.total_amount} กระสอบ)`).join('\n');
          }
        }
        return 'ยังไม่มีข้อมูลรายปี หรือเกิดข้อผิดพลาดในการโหลดข้อมูล';
      } catch (error) {
        console.error('Error fetching yearly fertilizer stats:', error);
        return 'เกิดข้อผิดพลาดในการโหลดข้อมูลรายปี';
      }
    }
    // เมนูใหม่: การตัดปาล์มแต่ละปี
    if (lowerMsg.includes('การตัดปาล์ม') || lowerMsg.includes('ต้นปาล์มรายปี')) {
      try {
        const res = await apiFetch(`${API_BASE}/yearly-stats`);
        if (res.ok) {
          const yearlyStats = await res.json();
          if (yearlyStats.palmtrees && yearlyStats.palmtrees.length > 0) {
            return yearlyStats.palmtrees.map(y => `ปี ${y.year}: ${(+y.tree_harvest_count).toLocaleString()} ครั้ง (${(+y.total_bunches).toLocaleString()} ทะลาย)`).join('\n');
          }
        }
        return 'ยังไม่มีข้อมูลรายปี หรือเกิดข้อผิดพลาดในการโหลดข้อมูล';
      } catch (error) {
        console.error('Error fetching yearly palm tree stats:', error);
        return 'เกิดข้อผิดพลาดในการโหลดข้อมูลรายปี';
      }
    }
    // เมนูใหม่: ค้นหาบันทึก
    if (lowerMsg.includes('ค้นหาบันทึก') || lowerMsg.includes('หาบันทึก') || lowerMsg.includes('บันทึก') && (lowerMsg.includes('ค้นหา') || lowerMsg.includes('หา') || lowerMsg.includes('เกี่ยวกับ'))) {
      try {
        // ค้นหาคำสำคัญในข้อความ
        const searchTerms = lowerMsg.replace(/ค้นหาบันทึก|หาบันทึก|บันทึก|ค้นหา|หา|เกี่ยวกับ/g, '').trim();
        
        if (!searchTerms) {
          const res = await apiFetch(`${API_BASE}/notes?limit=10`);
          if (res.ok) {
            const notes = await res.json();
            if (notes && notes.length > 0) {
              return `พบ ${notes.length} บันทึกทั้งหมด:\n${notes.slice(0, 5).map(note => `- ${note.date}: ${note.title} (${note.category})`).join('\n')}`;
            }
          }
          return 'ยังไม่มีบันทึกในระบบ';
        }
        
        // ค้นหาบันทึกที่ตรงกับคำสำคัญ
        const res = await apiFetch(`${API_BASE}/notes/search?q=${encodeURIComponent(searchTerms)}&limit=10`);
        if (res.ok) {
          const notes = await res.json();
          if (notes && notes.length > 0) {
            return `พบบันทึกที่เกี่ยวข้อง ${notes.length} รายการ:\n${notes.slice(0, 5).map(note => 
              `- ${note.date}: ${note.title}\n  หมวดหมู่: ${note.category}, ความสำคัญ: ${note.priority}\n  เนื้อหา: ${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}`
            ).join('\n\n')}`;
          }
        }
        return `ไม่พบบันทึกที่เกี่ยวข้องกับ "${searchTerms}"`;
      } catch (error) {
        console.error('Error searching notes:', error);
        return 'เกิดข้อผิดพลาดในการค้นหาบันทึก';
      }
    }
    
    // เมนูใหม่: บันทึกตามหมวดหมู่
    if (lowerMsg.includes('บันทึกหมวดหมู่') || lowerMsg.includes('หมวดหมู่บันทึก') || (lowerMsg.includes('บันทึก') && lowerMsg.includes('หมวดหมู่'))) {
      try {
        const res = await apiFetch(`${API_BASE}/notes`);
        if (res.ok) {
          const notes = await res.json();
          if (notes && notes.length > 0) {
            const categories = {};
            notes.forEach(note => {
              categories[note.category] = (categories[note.category] || 0) + 1;
            });
            
            return `บันทึกตามหมวดหมู่:\n${Object.entries(categories).map(([cat, count]) => `- ${cat}: ${count} รายการ`).join('\n')}`;
          }
        }
        return 'ยังไม่มีบันทึกในระบบ';
      } catch (error) {
        console.error('Error fetching notes categories:', error);
        return 'เกิดข้อผิดพลาดในการโหลดข้อมูลบันทึก';
      }
    }
    
    // เมนูใหม่: บันทึกตามความสำคัญ
    if (lowerMsg.includes('บันทึกความสำคัญ') || lowerMsg.includes('ความสำคัญบันทึก') || (lowerMsg.includes('บันทึก') && lowerMsg.includes('ความสำคัญ'))) {
      try {
        const res = await apiFetch(`${API_BASE}/notes`);
        if (res.ok) {
          const notes = await res.json();
          if (notes && notes.length > 0) {
            const priorities = {};
            notes.forEach(note => {
              priorities[note.priority] = (priorities[note.priority] || 0) + 1;
            });
            
            return `บันทึกตามความสำคัญ:\n${Object.entries(priorities).map(([pri, count]) => `- ${pri}: ${count} รายการ`).join('\n')}`;
          }
        }
        return 'ยังไม่มีบันทึกในระบบ';
      } catch (error) {
        console.error('Error fetching notes priorities:', error);
        return 'เกิดข้อผิดพลาดในการโหลดข้อมูลบันทึก';
      }
    }
    
    // เมนูใหม่: บันทึกวันนี้
    if (lowerMsg.includes('บันทึกวันนี้') || lowerMsg.includes('บันทึกวันนี้')) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await apiFetch(`${API_BASE}/notes/search?date=${today}`);
        if (res.ok) {
          const notes = await res.json();
          if (notes && notes.length > 0) {
            return `บันทึกวันนี้ (${notes.length} รายการ):\n${notes.map(note => 
              `- ${note.title} (${note.category}, ${note.priority})`
            ).join('\n')}`;
          }
        }
        return 'ไม่มีบันทึกสำหรับวันนี้';
      } catch (error) {
        console.error('Error fetching today notes:', error);
        return 'เกิดข้อผิดพลาดในการค้นหาบันทึกวันนี้';
      }
    }
    
    // เมนูใหม่: สรุปบันทึก
    if (lowerMsg.includes('สรุปบันทึก') || lowerMsg.includes('รวมบันทึก')) {
      try {
        const res = await apiFetch(`${API_BASE}/notes`);
        if (res.ok) {
          const notes = await res.json();
          if (notes && notes.length > 0) {
            const total = notes.length;
            const categories = {};
            const priorities = {};
            
            notes.forEach(note => {
              categories[note.category] = (categories[note.category] || 0) + 1;
              priorities[note.priority] = (priorities[note.priority] || 0) + 1;
            });
            
            return `สรุปบันทึกทั้งหมด:\n- รวม: ${total} รายการ\n- หมวดหมู่: ${Object.keys(categories).join(', ')}\n- ความสำคัญสูงสุด: ${Object.keys(priorities).find(p => priorities[p] === Math.max(...Object.values(priorities)))}`;
          }
        }
        return 'ยังไม่มีบันทึกในระบบ';
      } catch (error) {
        console.error('Error fetching notes summary:', error);
        return 'เกิดข้อผิดพลาดในการโหลดข้อมูลบันทึก';
      }
    }
    // ...เมนูเดิม...
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
      return "Hello! I'm your Palm Oil Business Assistant. How can I help you today?";
    }
    // เมนูใหม่: รายได้แต่ละปี
    if (lowerMsg.includes('รายได้แต่ละปี') || lowerMsg.includes('รายได้รายปี') || lowerMsg.includes('รายได้ปีละ') || lowerMsg.includes('รายได้ปีนี้')) {
      try {
        const res = await apiFetch(`${API_BASE}/yearly-stats`);
        if (res.ok) {
          const yearlyStats = await res.json();
          if (yearlyStats.harvest && yearlyStats.harvest.length > 0) {
            const currentYear = new Date().getFullYear().toString();
            
            if (lowerMsg.includes('ปีนี้')) {
              // แสดงเฉพาะปีนี้
              const thisYearData = yearlyStats.harvest.find(y => y.year === currentYear);
              if (thisYearData) {
                return `📊 รายได้ปีนี้ (${currentYear}):\n- รายได้รวม: ${(+thisYearData.total_revenue).toLocaleString()} บาท\n- กำไรสุทธิ: ${(+thisYearData.total_profit).toLocaleString()} บาท\n- น้ำหนักรวม: ${(+thisYearData.total_weight).toFixed(1)} กก.\n- จำนวนครั้ง: ${thisYearData.harvest_count} ครั้ง`;
              } else {
                return `ยังไม่มีข้อมูลการเก็บเกี่ยวในปี ${currentYear}`;
              }
            } else {
              // แสดงข้อมูลทุกปี
              return yearlyStats.harvest
                .sort((a, b) => b.year - a.year)
                .slice(0, 5)
                .map(y => `ปี ${y.year}: ${(+y.total_revenue).toLocaleString()} บาท (${(+y.total_weight).toFixed(1)} กก.)`)
                .join('\n');
            }
          }
        }
        return 'ยังไม่มีข้อมูลรายปี หรือเกิดข้อผิดพลาดในการโหลดข้อมูล';
      } catch (error) {
        console.error('Error fetching yearly harvest stats:', error);
        return 'เกิดข้อผิดพลาดในการโหลดข้อมูลรายปี';
      }
    }
    if (lowerMsg.includes('revenue') || lowerMsg.includes('income') || lowerMsg.includes('รายได้')) {
      try {
        const res = await apiFetch(`${API_BASE}/stats`);
        if (res.ok) {
          const stats = await res.json();
          if (stats.harvest) {
            return `รายได้รวมจากการเก็บเกี่ยว: ${(+stats.harvest.revenue).toLocaleString()} บาท จาก ${stats.harvest.count} ครั้งการเก็บเกี่ยว`;
          }
        }
        return 'ไม่สามารถโหลดข้อมูลรายได้ได้ในขณะนี้';
      } catch (error) {
        console.error('Error fetching revenue stats:', error);
        return 'เกิดข้อผิดพลาดในการโหลดข้อมูลรายได้';
      }
    }
    if (lowerMsg.includes('profit') || lowerMsg.includes('earnings') || lowerMsg.includes('กำไร')) {
      try {
        const res = await apiFetch(`${API_BASE}/stats`);
        if (res.ok) {
          const stats = await res.json();
          if (stats.harvest) {
            return `กำไรสุทธิจากการเก็บเกี่ยว: ${(+stats.harvest.profit).toLocaleString()} บาท`;
          }
        }
        return 'ไม่สามารถโหลดข้อมูลกำไรได้ในขณะนี้';
      } catch (error) {
        console.error('Error fetching profit stats:', error);
        return 'เกิดข้อผิดพลาดในการโหลดข้อมูลกำไร';
      }
    }
    if (lowerMsg.includes('fertilizer') || lowerMsg.includes('cost') || lowerMsg.includes('ปุ๋ย') || lowerMsg.includes('ต้นทุน')) {
      try {
        const res = await apiFetch(`${API_BASE}/stats`);
        if (res.ok) {
          const stats = await res.json();
          if (stats.fertilizer) {
            return `ค่าใช้จ่ายปุ๋ยรวม: ${(+stats.fertilizer.cost).toLocaleString()} บาท จาก ${stats.fertilizer.count} รายการ`;
          }
        }
        return 'ไม่สามารถโหลดข้อมูลค่าใช้จ่ายปุ๋ยได้ในขณะนี้';
      } catch (error) {
        console.error('Error fetching fertilizer stats:', error);
        return 'เกิดข้อผิดพลาดในการโหลดข้อมูลค่าใช้จ่ายปุ๋ย';
      }
    }
    if (lowerMsg.includes('trees') || lowerMsg.includes('palm') || lowerMsg.includes('ต้นปาล์ม')) {
      try {
        const res = await apiFetch(`${API_BASE}/stats`);
        if (res.ok) {
          const stats = await res.json();
          if (stats.palmtrees) {
            return `จำนวนต้นปาล์มที่เก็บเกี่ยวแล้ว: ${stats.palmtrees.count} ต้น จากทั้งหมด 312 ต้น (${Math.round((stats.palmtrees.count / 312) * 100)}% แห่งสวนปาล์มทั้งหมด)`;
          }
        }
        return 'ไม่สามารถโหลดข้อมูลต้นปาล์มได้ในขณะนี้';
      } catch (error) {
        console.error('Error fetching palm tree stats:', error);
        return 'เกิดข้อผิดพลาดในการโหลดข้อมูลต้นปาล์ม';
      }
    }
    if (lowerMsg.includes('export') || lowerMsg.includes('import')) {
      return "You can export or import data using the CSV buttons on each data table. Click the button to download or upload your data.";
    }
    if (lowerMsg.includes('help')) {
      return `คำสั่งที่ใช้ได้:\n\n📊 สถิติ:\n- "สถิติ" หรือ "dashboard" - สถิติรวมทั้งหมด\n- "สถิติการเก็บเกี่ยว" - สถิติการเก็บเกี่ยว\n- "สถิติปุ๋ย" - สถิติการใช้ปุ๋ย\n- "สถิติต้นปาล์ม" - สถิติต้นปาล์ม\n\n📝 บันทึก:\n- "ค้นหาบันทึก [คำสำคัญ]" - ค้นหาบันทึกตามคำสำคัญ\n- "บันทึกหมวดหมู่" - แสดงบันทึกตามหมวดหมู่\n- "บันทึกความสำคัญ" - แสดงบันทึกตามความสำคัญ\n- "บันทึกวันนี้" - แสดงบันทึกวันนี้\n- "สรุปบันทึก" - สรุปบันทึกทั้งหมด\n\n💰 การเงิน:\n- "รายได้" หรือ "revenue" - รายได้รวม\n- "กำไร" หรือ "profit" - กำไรสุทธิ\n- "ต้นทุน" หรือ "cost" - ต้นทุนรวม\n\n🌴 ต้นปาล์ม:\n- "จำนวนต้นปาล์ม" - จำนวนต้นปาล์มทั้งหมด\n- "ต้นปาล์ม [รหัส]" - ข้อมูลต้นปาล์มเฉพาะ\n\n📅 วันที่:\n- "ข้อมูลวันนี้" - ข้อมูลวันนี้\n- "ข้อมูลเดือนนี้" - ข้อมูลเดือนนี้\n\n❓ ตัวอย่างคำถาม:\n- "มีบันทึกเกี่ยวกับปุ๋ยกี่รายการ?"\n- "แสดงบันทึกความสำคัญสูง"\n- "ค้นหาบันทึกเกี่ยวกับโรคต้นปาล์ม"`;
    }
    return "เมนูตัวอย่าง: รายได้แต่ละปี, ค่าปุ๋ยแต่ละปี, การตัดปาล์ม, รายได้รวม, กำไร, ค่าใช้จ่ายปุ๋ย, ต้นปาล์ม, export/import, ค้นหาบันทึก, บันทึกหมวดหมู่, บันทึกความสำคัญ, help";
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const userMessage = { id: Date.now(), text: inputMessage, sender: 'user' };
    setMessages([...messages, userMessage]);
    // Reset input message immediately for better UX
    setInputMessage('');
    
    // Show typing indicator
    setTimeout(async () => {
      try {
        const aiMessage = { id: Date.now() + 1, text: await getAIResponse(userMessage.text), sender: 'ai' };
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Error getting AI response:', error);
        const errorMessage = { id: Date.now() + 1, text: 'เกิดข้อผิดพลาดในการตอบคำถาม กรุณาลองใหม่อีกครั้ง', sender: 'ai' };
        setMessages(prev => [...prev, errorMessage]);
      }
    }, 500);
  };

  // Dashboard component
  const Dashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-700">ระบบจัดการธุรกิจน้ำมันปาล์ม</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">ยินดีต้อนรับ, {currentUser?.username}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto pb-2">
            {['แดชบอร์ด', 'การเก็บเกี่ยว', 'ปุ๋ย', 'ต้นปาล์ม', 'บันทึก', 'รายงาน'].map((tab, idx) => (
              <button
                key={tab}
                onClick={() => setActiveTab([
                  'dashboard', 'harvest', 'fertilizer', 'palm_trees', 'notes', 'reports'][idx])}
                className={`px-6 py-3 whitespace-nowrap font-medium text-sm transition-colors ${
                  activeTab === [
                    'dashboard', 'harvest', 'fertilizer', 'palm_trees', 'notes', 'reports'][idx]
                    ? 'bg-green-500 text-white'
                    : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800">แดชบอร์ดธุรกิจ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* รายได้รวม */}
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">รายได้รวม</h3>
                <p className="text-3xl font-bold text-green-600">
                  {harvestData.reduce((sum, item) => sum + (item.totalRevenue || 0), 0).toLocaleString()} บาท
                </p>
                <p className="text-sm text-gray-500 mt-2">{harvestData.length} ครั้งการเก็บเกี่ยว</p>
              </div>
              {/* กำไรสุทธิ */}
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">กำไรสุทธิ</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {harvestData.reduce((sum, item) => sum + (item.netProfit || 0), 0).toLocaleString()} บาท
                </p>
                <p className="text-sm text-gray-500 mt-2">หลังหักค่าแรงงาน</p>
              </div>
              {/* ค่าใช้จ่ายปุ๋ย */}
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">ค่าใช้จ่ายปุ๋ย</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {fertilizerData.reduce((sum, item) => sum + (item.totalCost || 0), 0).toLocaleString()} บาท
                </p>
                <p className="text-sm text-gray-500 mt-2">{fertilizerData.length} รายการ</p>
              </div>
              {/* ต้นปาล์ม */}
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">ต้นปาล์ม</h3>
                <p className="text-3xl font-bold text-orange-600">
                  {palmTreeData.length}/{palmTrees.length}
                </p>
                <p className="text-sm text-gray-500 mt-2">ต้นที่เก็บเกี่ยวแล้ว</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">กิจกรรมล่าสุด</h3>
              <div className="space-y-3">
                {[...harvestData.slice(0, 3), ...fertilizerData.slice(0, 2), ...palmTreeData.slice(0, 2)]
                  .sort((a, b) => new Date(b.date || b.date) - new Date(a.date || a.date))
                  .slice(0, 5)
                  .map(item => (
                    <div key={item.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {item.totalRevenue ? `การเก็บเกี่ยว: ${item.totalRevenue.toLocaleString()} บาท` : 
                           item.totalCost ? `ปุ๋ย: ${item.totalCost.toLocaleString()} บาท` :
                           `ต้นปาล์ม: ${item.palmTree} - ${item.bunches} ทะลาย`}
                        </p>
                        <p className="text-xs text-gray-500">{item.date || item.date}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Harvest Form */}
        {activeTab === 'harvest' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800">Harvest Income Records</h2>
            
            {/* Add Harvest Form */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Harvest Record</h3>
              <form onSubmit={handleHarvestSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" name="date" required className="w-full p-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Weight (kg)</label>
                  <input type="number" name="totalWeight" step="0.1" min="0" required className="w-full p-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per kg (THB)</label>
                  <input type="number" name="pricePerKg" step="0.01" min="0" required className="w-full p-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harvesting Labor Cost (THB)</label>
                  <input type="number" name="harvestingCost" step="0.01" min="0" required className="w-full p-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors">
                    Add Harvest Record
                  </button>
                </div>
              </form>
            </div>

            {/* Harvest Data Table */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Harvest Records</h3>
                <button
                  onClick={() => exportToCSV(
                    harvestData,
                    'harvest_data.csv',
                    ['date', 'totalWeight', 'pricePerKg', 'totalRevenue', 'harvestingCost', 'netProfit']
                  )}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2.586l-4.707 4.707a1 1 0 01-1.414 0L7 9.586V18a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" />
                  </svg>
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Weight (kg)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/kg (THB)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue (THB)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Labor Cost (THB)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Profit (THB)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {harvestData.length > 0 ? (
                      [...harvestData].sort((a, b) => new Date(b.date) - new Date(a.date)).map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.total_weight?.toFixed(1) ?? item.totalWeight?.toFixed(1)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.price_per_kg?.toFixed(2) ?? item.pricePerKg?.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{(item.total_revenue ?? item.totalRevenue)?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{(item.harvesting_cost ?? item.harvestingCost)?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">{(item.net_profit ?? item.netProfit)?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button onClick={() => handleDeleteHarvest(item.id)} className="text-red-500 hover:text-red-700 text-xs">ลบ</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">ไม่มีข้อมูลการเก็บเกี่ยว</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Fertilizer Form */}
        {activeTab === 'fertilizer' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800">Fertilizer Expense Records</h2>
            
            {/* Add Fertilizer Form */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Fertilizer Record</h3>
              <form onSubmit={handleFertilizerSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" name="date" required className="w-full p-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fertilizer Type</label>
                  <input type="text" name="item" required className="w-full p-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (sacks)</label>
                  <input type="number" name="sacks" min="0" required className="w-full p-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Sack (THB)</label>
                  <input type="number" name="pricePerSack" step="0.01" min="0" required className="w-full p-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Labor Cost (THB)</label>
                  <input type="number" name="laborCost" step="0.01" min="0" required className="w-full p-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors">
                    Add Fertilizer Record
                  </button>
                </div>
              </form>
            </div>

            {/* Fertilizer Data Table */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Fertilizer Records</h3>
                <button
                  onClick={() => exportToCSV(
                    fertilizerData,
                    'fertilizer_data.csv',
                    ['date', 'fertilizer_type', 'amount', 'cost_per_bag', 'total_cost', 'labor_cost']
                  )}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2.586l-4.707 4.707a1 1 0 01-1.414 0L7 9.586V18a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" />
                  </svg>
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fertilizer Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (sacks)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Sack (THB)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost (THB)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Labor Cost (THB)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fertilizerData.length > 0 ? (
                      fertilizerData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.fertilizer_type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cost_per_bag?.toFixed(2) ?? item.pricePerSack?.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{(item.total_cost ?? item.totalCost)?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{(item.labor_cost ?? item.laborCost)?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button onClick={() => handleDeleteFertilizer(item.id)} className="text-red-500 hover:text-red-700 text-xs">ลบ</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">ไม่มีข้อมูลค่าใช้จ่ายปุ๋ย</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Palm Trees Tab */}
        {activeTab === 'palm_trees' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800">ต้นปาล์ม</h2>
            
            {/* Add Palm Tree Form */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">บันทึกการเก็บเกี่ยวต้นปาล์ม</h3>
              
              <form onSubmit={handlePalmTreeSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Palm Tree ID</label>
                  <select name="palmTree" required className="w-full p-2 border border-gray-300 rounded-lg">
                    <option value="">Select a tree</option>
                    {palmTrees.map(treeId => (
                      <option key={treeId} value={treeId}>{treeId}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Date</label>
                  <input type="date" name="date" required className="w-full p-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bunch Count</label>
                  <input type="number" name="bunches" min="0" required className="w-full p-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea name="note" rows="2" className="w-full p-2 border border-gray-300 rounded-lg"></textarea>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors">
                    {loading ? 'กำลังบันทึก...' : 'บันทึกการเก็บเกี่ยว'}
                  </button>
                </div>
              </form>
            </div>

            {/* Palm Trees Data Table */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">ข้อมูลการเก็บเกี่ยวต้นปาล์ม ({palmTreeData.length} รายการ)</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ค้นหาต้นปาล์ม..."
                    className="p-2 border border-gray-300 rounded-lg w-64"
                    onChange={(e) => {
                      const query = e.target.value.toLowerCase();
                      const filteredData = palmTreeData.filter(item => 
                        item.tree_id.toLowerCase().includes(query) ||
                        item.harvest_date.includes(query) ||
                        item.bunch_count.toString().includes(query) ||
                        (item.notes || '').toLowerCase().includes(query)
                      );
                      setPalmTreeData(filteredData);
                    }}
                  />
                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => {
                        if (confirm('คุณแน่ใจว่าต้องการลบข้อมูลการเก็บเกี่ยวทั้งหมด?')) {
                          setLoading(true);
                          apiFetch(`${API_BASE}/palmtrees/all`, { method: 'DELETE' })
                            .then(res => {
                              if (res.ok) {
                                setPalmTreeData([]);
                                alert('ลบข้อมูลการเก็บเกี่ยวทั้งหมดเรียบร้อยแล้ว');
                              } else {
                                alert('เกิดข้อผิดพลาดในการลบข้อมูล');
                              }
                            })
                            .catch(err => {
                              console.error(err);
                              alert('เกิดข้อผิดพลาดในการลบข้อมูล');
                            })
                            .finally(() => setLoading(false));
                        }
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                      disabled={loading}
                    >
                      🗑️ ลบทั้งหมด
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                {/* Virtualized Table using react-window */}
                {/* <PalmTreeTable 
                  data={palmTreeData} 
                  sortOrder={palmTreeSortOrder}
                  setSortOrder={setPalmTreeSortOrder}
                  setData={setPalmTreeData}
                  currentUser={currentUser}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  loading={loading}
                /> */}
                {/* Placeholder for PalmTreeTable - You need to implement or import this component */}
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tree ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harvest Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bunch Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {palmTreeData.length > 0 ? (
                      palmTreeData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.tree_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.harvest_date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.bunch_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.notes}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button onClick={() => handleDeletePalmTree(item.id)} className="text-red-500 hover:text-red-700 text-xs">ลบ</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">ไม่มีข้อมูลต้นปาล์ม</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edit Modal for Palm Trees */}
            {/* You need to implement showEditModal, editType, handleEditChange, handleEditSubmit, handleCancelEdit, editFormData, selectedTreeId, palmTreeSortOrder, setPalmTreeSortOrder, handleEdit, handleDelete states and functions for this section to work. */}
            {/* {showEditModal && editType === 'palmtrees' && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">แก้ไขข้อมูลการเก็บเกี่ยวต้นปาล์ม</h3>
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Palm Tree ID</label>
                      <input
                        type="text"
                        name="tree_id"
                        value={editFormData.tree_id}
                                               onChange={handleEditChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Date</label>
                      <input
                        type="date"
                        name="harvest_date"
                        value={editFormData.harvest_date}
                        onChange={handleEditChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bunch Count</label>
                      <input
                        type="number"
                        name="bunch_count"
                        value={editFormData.bunch_count}
                        onChange={handleEditChange}
                        min="0"
                        required
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        name="notes"
                        value={editFormData.notes}
                        onChange={handleEditChange}
                        rows="3"
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      ></textarea>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-colors"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        บันทึกการเปลี่ยนแปลง
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )} */}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800">บันทึกและข้อคิดเห็น</h2>

            {/* Add Note Form */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">เพิ่มบันทึกใหม่</h3>
              <form onSubmit={handleNoteSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
                  <input type="date" name="date" required className="w-full p-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อ</label>
                  <input type="text" name="title" required className="w-full p-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">เนื้อหา</label>
                  <textarea name="content" rows="4" required className="w-full p-2 border border-gray-300 rounded-lg"></textarea>
                </div>
                <div className="md:col-span-2">
                  <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors">
                    เพิ่มบันทึก
                  </button>
                </div>
              </form>
            </div>

            {/* Notes Data Table */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">บันทึกทั้งหมด ({notesData.length} รายการ)</h3>
                <button
                  onClick={() => exportToCSV(
                    notesData,
                    'notes_data.csv',
                    ['date', 'title', 'content', 'category', 'priority']
                  )}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2.586l-4.707 4.707a1 1 0 01-1.414 0L7 9.586V18a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" />
                  </svg>
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หัวข้อ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เนื้อหา</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {notesData.length > 0 ? (
                      notesData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.title}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.content}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button onClick={() => handleEditNote(item)} className="text-blue-500 hover:text-blue-700 text-xs mr-2">แก้ไข</button>
                            <button onClick={() => handleDeleteNote(item.id)} className="text-red-500 hover:text-red-700 text-xs">ลบ</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">ไม่มีบันทึก</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edit Note Modal */}
            {editingNote && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">แก้ไขบันทึก</h3>
                  <form onSubmit={handleUpdateNote} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
                      <input
                        type="date"
                        name="date"
                        value={editFormData.date}
                        onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                        required
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อ</label>
                      <input
                        type="text"
                        name="title"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        required
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">เนื้อหา</label>
                      <textarea
                        name="content"
                        value={editFormData.content}
                        onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                        rows="4"
                        required
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      ></textarea>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-colors"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        บันทึกการเปลี่ยนแปลง
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800">รายงานและสถิติ</h2>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">รายงานรายปี</h3>
              {dashboardStats && dashboardStats.yearlyStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">การเก็บเกี่ยว</h4>
                    {dashboardStats.yearlyStats.harvest.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {dashboardStats.yearlyStats.harvest.map(yearData => (
                          <li key={yearData.year} className="text-gray-700">
                            ปี {yearData.year}: รายได้รวม {yearData.total_revenue.toLocaleString()} บาท, กำไรสุทธิ {yearData.total_profit.toLocaleString()} บาท
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">ไม่มีข้อมูลการเก็บเกี่ยวรายปี</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">ปุ๋ย</h4>
                    {dashboardStats.yearlyStats.fertilizer.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {dashboardStats.yearlyStats.fertilizer.map(yearData => (
                          <li key={yearData.year} className="text-gray-700">
                            ปี {yearData.year}: ค่าใช้จ่าย {yearData.total_cost.toLocaleString()} บาท
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">ไม่มีข้อมูลค่าใช้จ่ายปุ๋ยรายปี</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">ต้นปาล์ม</h4>
                    {dashboardStats.yearlyStats.palmtrees.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {dashboardStats.yearlyStats.palmtrees.map(yearData => (
                          <li key={yearData.year} className="text-gray-700">
                            ปี {yearData.year}: เก็บเกี่ยว {yearData.tree_harvest_count} ครั้ง, รวม {yearData.total_bunches} ทะลาย
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">ไม่มีข้อมูลต้นปาล์มรายปี</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">กำลังโหลดรายงาน...</p>
              )}
            </div>
          </div>
        )}

        {/* Users Tab (Admin Only) */}
        {activeTab === 'users' && currentUser?.role === 'admin' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800">การจัดการผู้ใช้ (Admin Only)</h2>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">ผู้ใช้ทั้งหมด ({users.length} รายการ)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.username}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <select
                              value={user.role}
                              onChange={async (e) => {
                                if (user.id === currentUser.userId) {
                                  alert('ไม่สามารถเปลี่ยนบทบาทของตัวเองได้');
                                  return;
                                }
                                if (!confirm(`คุณต้องการเปลี่ยนบทบาทของ ${user.username} เป็น ${e.target.value} หรือไม่?`)) return;
                                setLoading(true);
                                try {
                                  const res = await apiFetch(`${API_BASE}/users/${user.id}/role`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ role: e.target.value })
                                  });
                                  if (res.ok) {
                                    await loadUsers();
                                  } else {
                                    const err = await res.json();
                                    alert(err.error || 'เปลี่ยนบทบาทไม่สำเร็จ');
                                  }
                                } catch (err) {
                                  alert('เกิดข้อผิดพลาดในการเปลี่ยนบทบาท');
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              className="p-1 border border-gray-300 rounded-md"
                              disabled={loading || user.id === currentUser.userId}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <input
                              type="checkbox"
                              checked={user.is_active}
                              onChange={async (e) => {
                                if (user.id === currentUser.userId) {
                                  alert('ไม่สามารถเปลี่ยนสถานะของตัวเองได้');
                                  return;
                                }
                                if (!confirm(`คุณต้องการเปลี่ยนสถานะของ ${user.username} เป็น ${e.target.checked ? 'ใช้งาน' : 'ไม่ใช้งาน'} หรือไม่?`)) return;
                                setLoading(true);
                                try {
                                  const res = await apiFetch(`${API_BASE}/users/${user.id}/toggle`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' }
                                  });
                                  if (res.ok) {
                                    await loadUsers();
                                  } else {
                                    const err = await res.json();
                                    alert(err.error || 'เปลี่ยนสถานะไม่สำเร็จ');
                                  }
                                } catch (err) {
                                  alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              className="form-checkbox h-5 w-5 text-green-600"
                              disabled={loading || user.id === currentUser.userId}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.created_at}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={async () => {
                                if (user.id === currentUser.userId) {
                                  alert('ไม่สามารถลบบัญชีของตัวเองได้');
                                  return;
                                }
                                if (!confirm(`คุณต้องการลบผู้ใช้ ${user.username} หรือไม่?`)) return;
                                setLoading(true);
                                try {
                                  const res = await apiFetch(`${API_BASE}/users/${user.id}`, {
                                    method: 'DELETE'
                                  });
                                  if (res.ok) {
                                    await loadUsers();
                                  } else {
                                    const err = await res.json();
                                    alert(err.error || 'ลบผู้ใช้ไม่สำเร็จ');
                                  }
                                } catch (err) {
                                  alert('เกิดข้อผิดพลาดในการลบผู้ใช้');
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              className="text-red-500 hover:text-red-700 text-xs"
                              disabled={loading || user.id === currentUser.userId}
                            >
                              ลบ
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">ไม่มีผู้ใช้ในระบบ</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* AI Chat Button */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9H7v2h2V9z" clipRule="evenodd" />
        </svg>
      </button>

      {/* AI Chat Window */}
      {showChat && (
        <div className="fixed bottom-20 right-6 w-80 bg-white rounded-lg shadow-xl flex flex-col max-h-[70vh] z-50">
          <div className="p-4 bg-blue-600 text-white rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">AI Assistant</h3>
            <button onClick={() => setShowChat(false)} className="text-white hover:text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${msg.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200">
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="พิมพ์ข้อความ..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ส่ง
            </button>
          </div>
        </div>
      )}

      {/* Login/Signup View */}
      {!currentUser && (
        <div className="fixed inset-0 bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-3xl font-bold text-center text-green-700 mb-6">ระบบจัดการธุรกิจน้ำมันปาล์ม</h2>
            
            <div className="flex justify-center mb-6">
              <button
                onClick={() => setActiveTab('login')}
                className={`px-6 py-2 rounded-l-lg font-medium transition-colors ${
                  activeTab === 'login' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                เข้าสู่ระบบ
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`px-6 py-2 rounded-r-lg font-medium transition-colors ${
                  activeTab === 'signup' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                สมัครสมาชิก
              </button>
            </div>

            {activeTab === 'login' && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleLogin(formData.get('email'), formData.get('password'));
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                  <input type="email" name="email" required className="w-full p-3 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                  <input type="password" name="password" required className="w-full p-3 border border-gray-300 rounded-lg" />
                </div>
                <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg font-semibold transition-colors">
                  {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </button>
              </form>
            )}

            {activeTab === 'signup' && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleSignup(formData.get('username'), formData.get('email'), formData.get('password'));
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้</label>
                  <input type="text" name="username" required className="w-full p-3 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                  <input type="email" name="email" required className="w-full p-3 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                  <input type="password" name="password" required className="w-full p-3 border border-gray-300 rounded-lg" />
                </div>
                <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg font-semibold transition-colors">
                  {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return <Dashboard />;
};

export default App;

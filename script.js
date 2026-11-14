const KEY = 'expense-tracker-v1', HK = 'et-hide', TK = 'et-theme', DK = 'et-data';
const BASE = { expense: ['อาหาร', 'เดินทาง', 'ช้อปปิ้ง', 'บิลและค่าบริการ', 'บันเทิง', 'สุขภาพ', 'อื่นๆ'], income: ['เงินเดือน', 'ฟรีแลนซ์', 'โบนัส', 'อื่นๆ'] };
const COLORS = ['#7fb2e5', '#d9b27c', '#a995d9'];
const PER = [[1, 'เดือนนี้'], [3, '3 เดือน'], [6, '6 เดือน'], [12, '1 ปี']];
const P = {
  home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  income: '<path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/>',
  expense: '<path d="M12 16V5m0 0l-4 4m4-4l4 4M5 20h14"/>',
  more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  off: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/>',
  bell: '<path d="M6 17v-6a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>'
};
const ic = k => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${P[k]}</svg>`;
const $ = id => document.getElementById(id), pad = n => String(n).padStart(2, '0');
const ds = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, ts = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const ld = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const sv = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); if (k === KEY || k === DK) syncData(); return true; } catch (e) { return false; } };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const m = (n, h) => h ? '฿ xxxx' : (n < 0 ? '−' : '') + '฿' + Math.abs(n).toLocaleString(LOC, { maximumFractionDigits: 2 });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

let items = ld(KEY, []), hide = ld(HK, {}), D = ld(DK, {});
let view = 'ov', tp = 1, po = false, hs = { r: 'day', o: 0 }, type = 'expense', cat = 'อื่นๆ', mode = 'now', eid = null, photo = null, qp = null;
D.plan = D.plan || { inc: 0, per: 'month', fixed: [] }; D.goals = D.goals || []; D.pb = D.pb || {};
const PB = () => D.pb[D.cur] || (D.pb[D.cur] = D.cur === 'b0' ? { plan: D.plan, goals: D.goals } : { plan: { inc: 0, per: 'month', fixed: [] }, goals: [] }); D.cats = D.cats || JSON.parse(JSON.stringify(BASE));
D.books = D.books || [{ id: 'b0', name: 'ส่วนตัว', biz: false }]; D.cur = D.cur || 'b0'; D.learn = D.learn || []; D.q = D.q || []; D.rules = D.rules || []; D.lw = D.lw || {};
D.wallets = D.wallets || [{ id: 'w0', name: 'เงินสด', bk: 'b0' }, { id: 'w1', name: 'บัญชีธนาคาร', bk: 'b0' }];
let wl = null, xp = null, dtT = 'income', dtO = 0, rn = null, cgO = false, pmO = false, tutI = 0, tipA = 10; const gslip = {};
const saveI = () => sv(KEY, items), saveD = () => sv(DK, D);
const sumBy = (a, t) => a.filter(i => i.type === t).reduce((s, i) => s + i.amount, 0);
const bkOf = i => i.bk || 'b0', cb = () => items.filter(i => bkOf(i) === D.cur), curBook = () => D.books.find(b => b.id === D.cur) || D.books[0], myW = () => D.wallets.filter(w => w.bk === D.cur);
const inR = (a, b) => cb().filter(i => i.date >= a && i.date <= b);
const srt = a => [...a].sort((x, y) => (y.date + (y.time || '')).localeCompare(x.date + (x.time || '')));
const fd = s => new Date(s + 'T00:00:00').toLocaleDateString(LOC, { weekday: 'short', day: 'numeric', month: 'short' });
const toast = t => { const e = $('toast'); e.textContent = t; e.classList.add('on'); setTimeout(() => e.classList.remove('on'), 2200); };
const lang = D.lang || 'th', LOC = lang === 'en' ? 'en-GB' : 'th-TH', t = (a, b) => lang === 'en' ? b : a;
const EX = { 'วัน': 'Day', 'สัปดาห์': 'Week', 'เดือน': 'Month', 'ปี': 'Year', 'บันทึก': 'Save', 'อัปเดต': 'Update', 'ตอนนี้': 'Now', 'เวลา': 'Time', 'เพิ่ม': 'Add', 'ข้าม': 'Skip', 'กลับ': 'Back', 'ธีม': 'Theme', 'สว่าง': 'Light', 'มืด': 'Dark', 'อัตโนมัติ': 'Auto', 'รายได้': 'Income', 'รายรับ': 'Income', 'รายจ่าย': 'Expense', 'อื่นๆ': 'Other', 'หน้าแรก': 'Home', 'ภาพรวม': 'Overview', 'วันนี้': 'Today', 'เป้าหมาย': 'Goals', 'ประวัติ': 'History', 'ใบกำกับ': 'Invoices', 'ส่วนตัว': 'Personal', 'กลุ่ม': 'Group', 'ธุรกิจ': 'Business', 'ผู้ขาย': 'Seller', 'ผู้ซื้อ': 'Buyer', 'สมุด': 'Book', 'รายละเอียด': 'Details', 'หมวดหมู่': 'Category', 'ช่องทางเงิน': 'Channel', 'เมื่อวาน': 'Yesterday', 'วัน/เวลา': 'Date/time', 'จำนวนเงิน': 'Amount', 'อาหาร': 'Food', 'เดินทาง': 'Transport', 'ช้อปปิ้ง': 'Shopping', 'บิลและค่าบริการ': 'Bills', 'บันเทิง': 'Fun', 'สุขภาพ': 'Health', 'เงินเดือน': 'Salary', 'ฟรีแลนซ์': 'Freelance', 'โบนัส': 'Bonus' };
const EN = { 'คงเหลือวันนี้': 'Balance today', 'คงเหลือสัปดาห์นี้': 'Balance this week', 'คงเหลือเดือนนี้': 'Balance this month', 'สัปดาห์นี้': 'This week', 'เดือนนี้': 'This month', 'ใช้เงินไปกับอะไรมากที่สุด': 'Top spending', 'รายการล่าสุด': 'Recent entries', 'เงินแต่ละช่องทาง': 'Money by channel', 'ซ่อนอยู่ แตะรูปตาเพื่อแสดง': 'Hidden — tap the eye to show', 'รายรับมาจากอะไรบ้าง': 'Where income comes from', 'รายจ่ายไปกับอะไรบ้าง': 'Where money goes', 'ดูรายละเอียดทั้งหมด': 'See all', 'ยังไม่มีรายการ': 'No entries yet', 'ไม่มีรายการ': 'No entries', '3 เดือน': '3 months', '6 เดือน': '6 months', '1 ปี': '1 year', 'ตั้งเพดานกราฟ': 'Set chart limits', 'แตะที่กราฟเพื่อตั้งเพดาน': 'Tap the chart to set limits', 'เกินคาดดด! เก่งมาก': 'Wow, above target!', 'ใกล้ถึงเป้าแล้ว': 'Close to target', 'ใช้เกินเพดานแล้วนะ': 'Over your limit', 'เริ่มอันตราย ใช้จ่ายระวัง': 'Careful, nearing limit', 'สมดุลดี': 'Balanced', 'เป้ารายรับ': 'Income goal', 'เพดานรายจ่าย': 'Spending limit', 'หมวดหมู่ (เรียงตามที่ใช้บ่อย)': 'Category (most used first)', 'ลบรายการนี้': 'Delete this entry', 'สร้างข้อมูลสำรอง': 'Create backup', 'นำเข้าข้อมูล': 'Import data', 'สำรองและนำเข้าข้อมูล': 'Backup & import', 'หมวดหมู่ของฉัน': 'My categories', 'หมวดรายจ่าย': 'Expense categories', 'หมวดรายรับ': 'Income categories', 'การแจ้งเตือน': 'Notifications', 'ไม่มีการแจ้งเตือน': 'No notifications', 'ไม่ทราบชื่อ': 'Unknown', 'ไม่ทราบธนาคาร': 'Unknown bank', 'จำชื่อนี้ ครั้งหน้าจัดหมวดนี้ให้อัตโนมัติ': 'Remember this name, auto-file next time', 'เป็นรายรับแทน': 'Make it income', 'เป็นรายจ่ายแทน': 'Make it expense', 'เลือกสลิปจากอัลบั้ม': 'Pick slips from gallery', 'อ่านสลิปจากอัลบั้ม': 'Read slips from gallery', 'อนุญาตให้อ่านสลิปจากรูปที่ฉันเลือก': 'Allow reading slips from photos I pick', 'จัดหมวดอัตโนมัติตามชื่อในสลิป': 'Auto-categorise by name on slip', 'เชื่อมธนาคาร': 'Bank link (coming soon)', 'เป้าหมายและกองกลาง เช่น ทริปทะเล': 'Goals & group pots (e.g. beach trip)', 'เพิ่มเป้าหมายใหม่': 'New goal' };
const KEYS = Object.keys(EN).sort((a, b) => b.length - a.length), TH = /[\u0E00-\u0E7F]/;
const tx = x => { const q = x.trim(); if (EX[q]) return x.replace(q, EX[q]); let o = x; for (const k of KEYS) if (o.includes(k)) o = o.split(k).join(EN[k]); return o; };
function trEl(root) {
  if (lang !== 'en') return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) if (TH.test(n.data)) { const v = tx(n.data); if (v !== n.data) n.data = v; }
  if (root.querySelectorAll) root.querySelectorAll('[placeholder],[aria-label]').forEach(e => ['placeholder', 'aria-label'].forEach(a => { const v = e.getAttribute(a); if (v && TH.test(v)) e.setAttribute(a, tx(v)); }));
}
if (lang === 'en') new MutationObserver(ms => ms.forEach(q => q.addedNodes.forEach(n => n.nodeType === 1 ? trEl(n) : n.nodeType === 3 && TH.test(n.data) && (n.data = tx(n.data))))).observe(document.body, { childList: true, subtree: true });

// --- Smart API Base URL Detection (Works on Localhost, File, and Vercel) ---
function getApiUrl(path) {
  const isLocal = window.location.protocol === 'file:' || 
                 ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '8000');
  const baseUrl = isLocal ? 'http://127.0.0.1:8000' : '';
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return baseUrl + (cleanPath.startsWith('/api') ? cleanPath : '/api' + cleanPath);
}

// --- Auth & Sync ---
async function syncData() {
  const token = localStorage.getItem('jwt_token');
  if (!token) return;
  try {
    await fetch(getApiUrl('/data'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ items, D })
    });
  } catch (err) {
    console.warn('Sync failed:', err);
  }
}

// --- Auth Mode Toggle & Functions ---
let isRegisterMode = false;

function setAuthMsg(msg, type) {
  const el = $('authMsg');
  if (!el) return;
  el.textContent = msg || '';
  if (type === 'error') {
    el.style.color = '#e55353';
  } else if (type === 'success') {
    el.style.color = '#2eb85c';
  } else if (type === 'info') {
    el.style.color = 'var(--accent)';
  } else {
    el.style.color = 'inherit';
  }
}

function setAuthMode(register) {
  isRegisterMode = register;
  setAuthMsg('', '');
  if ($('lUser')) $('lUser').value = '';
  if ($('lPass')) $('lPass').value = '';
  if ($('authTitle')) $('authTitle').textContent = isRegisterMode ? 'สมัครสมาชิกใหม่' : 'เข้าสู่ระบบ (Login)';
  if ($('lBtn')) $('lBtn').textContent = isRegisterMode ? 'ยืนยันสมัครสมาชิก' : 'เข้าสู่ระบบ';
  if ($('rBtn')) $('rBtn').textContent = isRegisterMode ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิกที่นี่';
  setTimeout(() => { if ($('lUser')) $('lUser').focus(); }, 150);
}

async function auth() {
  const actionPath = isRegisterMode ? '/register' : '/token';
  const userEl = $('lUser'), passEl = $('lPass'), btn = $('lBtn');
  const username = userEl ? userEl.value.trim() : '';
  const password = passEl ? passEl.value.trim() : '';

  // Inline Validations
  if (!username) {
    setAuthMsg('กรุณากรอก Username (ชื่อผู้ใช้)', 'error');
    if (userEl) userEl.focus();
    return;
  }
  if (username.length < 3) {
    setAuthMsg('ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร', 'error');
    if (userEl) userEl.focus();
    return;
  }
  if (!password) {
    setAuthMsg('กรุณากรอก Password (รหัสผ่าน)', 'error');
    if (passEl) passEl.focus();
    return;
  }
  if (password.length < 4) {
    setAuthMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร', 'error');
    if (passEl) passEl.focus();
    return;
  }

  setAuthMsg(isRegisterMode ? 'กำลังลงทะเบียนบัญชีใหม่...' : 'กำลังตรวจสอบข้อมูลเข้าสู่ระบบ...', 'info');
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = '0.7';
  }

  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);

  try {
    const res = await fetch(getApiUrl(actionPath), { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params 
    });

    if (res.ok) {
      if (!isRegisterMode) {
        const data = await res.json();
        localStorage.setItem('jwt_token', data.access_token);
        localStorage.setItem('username', username);
        setAuthMsg('เข้าสู่ระบบสำเร็จ กำลังเข้าสู่หน้าหลัก...', 'success');
        setTimeout(() => location.reload(), 600);
      } else {
        setAuthMsg('สมัครสมาชิกสำเร็จ! กำลังสลับไปหน้าเข้าสู่ระบบ...', 'success');
        setTimeout(() => {
          setAuthMode(false);
          if ($('lUser')) $('lUser').value = username;
          setAuthMsg('สมัครสมาชิกสำเร็จแล้ว กรุณากรอกรหัสผ่านเพื่อเข้าสู่ระบบ', 'success');
        }, 1200);
      }
    } else {
      const err = await res.json().catch(() => ({}));
      const errorMsg = err.detail || 'เกิดข้อผิดพลาด ไม่สามารถดำเนินการได้';
      setAuthMsg('ข้อผิดพลาด: ' + errorMsg, 'error');
    }
  } catch (e) {
    console.error('API Error:', e);
    setAuthMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือสถานะของเซิร์ฟเวอร์', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  }
}

// Bind auth buttons and keydown listeners
if ($('lBtn')) $('lBtn').onclick = auth;
if ($('rBtn')) $('rBtn').onclick = () => setAuthMode(!isRegisterMode);

['lUser', 'lPass'].forEach(id => {
  const el = $(id);
  if (el) {
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        auth();
      }
    });
    el.addEventListener('input', () => setAuthMsg('', ''));
  }
});

// --- Profile UI Logic ---
if ($('logoutBtn')) {
  $('logoutBtn').onclick = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('username');
    location.reload();
  };
}
function updateProfileUI() {
  const username = localStorage.getItem('username');
  if (username && $('pUser')) $('pUser').textContent = 'ผู้ใช้: ' + username;
}
updateProfileUI();

// Check Login on Startup
const token = localStorage.getItem('jwt_token');
if (!token) {
  // Lock the UI
  document.body.style.display = 'none';
  if ($('sLogin')) $('sLogin').classList.add('open');
  if ($('scrim')) $('scrim').classList.add('open');
  document.body.style.display = '';
} else {
  (async () => {
    try {
      const res = await fetch(getApiUrl('/data'), { headers: { 'Authorization': 'Bearer ' + token } });
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          items = data.items;
          localStorage.setItem(KEY, JSON.stringify(items));
        }
        if (data.settings && Object.keys(data.settings).length) {
          D = Object.assign(D, data.settings);
          localStorage.setItem(DK, JSON.stringify(D));
        }
        render();
      } else if (res.status === 401) {
        localStorage.removeItem('jwt_token');
        location.reload();
      }
    } catch (e) {
      console.warn('Could not fetch server data, using cached local data.', e);
    }
  })();
}

let lastErr = '';
window.addEventListener('error', e => { lastErr = String(e.message); const b = document.getElementById('errb'); if (b) { b.textContent = '⚠ ' + lastErr; b.hidden = false; } });

const GUIDE = () => [
  ['✍️', t('บันทึกรายการ', 'Add an entry'), t('แตะ “รายจ่าย” หรือ “รายรับ” ที่แถบล่าง พิมพ์จำนวนเงิน แล้วกดบันทึก เวลาเริ่มต้นคือตอนนี้ ถ้าลืมกรอกให้กด “วัน/เวลา” เพื่อย้อนหลัง', 'Tap Expense or Income on the bottom bar, type the amount and save. Time defaults to now; use Date/time to backdate.')],
  ['📷', t('ถ่ายหรืออ่านสลิป', 'Photos & slips'), t('ปุ่มกล้องตรงกลาง ถ่ายแล้วเลือกรายรับ/รายจ่ายได้เลย เติมรายละเอียดทีหลัง หรือที่ “อื่นๆ” ติ๊กอนุญาตแล้วเลือกสลิปจากอัลบั้มให้ระบบอ่านยอด ผู้รับ และธนาคาร', 'Middle camera button: snap, pick income or expense, add details later. Or in Other, allow slip reading and pick slips from your gallery.')],
  ['📈', t('ภาพรวมและกราฟ', 'Overview & chart'), t('แตะ “คงเหลือ ▾” หรือแตะที่กราฟ เพื่อดูเป็นวัน สัปดาห์ เดือน และตั้งเพดานกราฟ เส้นขึ้นเมื่อรายรับมาก ลงเมื่อรายจ่ายมาก รูปตาใช้ซ่อนตัวเลข', 'Tap Balance ▾ or the chart to switch day/week/month and set limits. The line rises with income, falls with spending. The eye hides numbers.')],
  ['📒', t('สมุด และ ช่องทางเงิน', 'Books & channels'), t('สมุด = แยกเงินคนละเรื่อง เช่น ส่วนตัว กลุ่ม ธุรกิจ (กดชื่อมุมซ้ายบนเพื่อสลับ) ช่องทางเงิน = เงินสด ธนาคาร ฯลฯ ภายในแต่ละสมุด', 'A book separates money (personal, group, business); tap its name top-left to switch. Channels are cash, bank etc. inside each book.')],
  ['🎯', t('วันนี้ เป้าหมาย ประวัติ', 'Today, goals, history'), t('“วันนี้” คำนวณงบต่อวันจากรายได้หักรายจ่ายประจำ “เป้าหมาย” เก็บเงินเป็นกอง/ทริป “ประวัติ” ดูย้อนหลังเป็นวัน สัปดาห์ เดือน', 'Today works out a daily budget; Goals tracks savings and group pots; History browses by day, week or month.')]
];
const HELP2 = () => [
  ['🧾', t('ใบกำกับภาษี', 'Tax invoice'), t('ในสมุดธุรกิจจะมีแท็บ “ใบกำกับ” กรอกผู้ขาย ผู้ซื้อ รายการ ระบบคิด VAT 7% และบันทึกเป็นรายรับให้ได้', 'Business books get an Invoices tab: fill seller, buyer, items; VAT 7% is added and it can be saved as income.')],
  ['🔔', t('กระดิ่งและกฎอัตโนมัติ', 'Bell & auto rules'), t('ผลอ่านสลิปมาที่กระดิ่ง แตะหมวดเพื่อยืนยัน ติ๊ก “จำชื่อนี้” เพื่อให้ครั้งหน้าจัดหมวดอัตโนมัติ แก้กฎได้ที่ “อื่นๆ”', 'Slip results land in the bell: tap a category to confirm; tick Remember this name to auto-file next time. Edit rules in Other.')],
  ['🏷️', t('หมวดหมู่', 'Categories'), t('เพิ่ม/ลบหมวดของตัวเองได้ที่ “อื่นๆ” หมวดที่ใช้บ่อยจะขึ้นก่อน', 'Add or remove your own categories in Other; frequent ones show first.')]
];
const fbMsg = () => '[seemon] ' + ($('fbT') ? $('fbT').value : '') + ' | ' + navigator.userAgent.slice(0, 70) + (lastErr ? ' | err: ' + lastErr : '');
function drawTut() {
  const g = GUIDE(), i = tutI;
  $('tutBody').innerHTML = i < 0 ? `<h2>Language · ภาษา</h2><div class="two"><button data-a="lang" data-l="th">ไทย</button><button data-a="lang" data-l="en">English</button></div>` :
    `<div style="text-align:center;font-size:2.4rem">${g[i][0]}</div><h2 style="text-align:center">${g[i][1]}</h2><p style="line-height:1.7">${g[i][2]}</p><div class="srow"><button class="link" style="width:auto" data-a="tutX">${t('ข้าม', 'Skip')}</button><span class="mu">${i + 1}/${g.length}</span><button class="ghost" data-a="tutN">${i === g.length - 1 ? t('เริ่มใช้งาน', 'Start') : t('ถัดไป', 'Next')}</button></div>`;
}
function drawMx() {
  $('mx').innerHTML = `<h2 style="margin-top:20px">${t('ภาษา', 'Language')}</h2><div class="two"><button class="${lang === 'th' ? 'on' : ''}" data-a="lang" data-l="th">ไทย</button><button class="${lang === 'en' ? 'on' : ''}" data-a="lang" data-l="en">English</button></div>
<h2 style="margin-top:20px">${t('วิธีใช้', 'How to use')}</h2><button class="ghost" style="width:100%;margin-bottom:8px" data-a="tutRe">${t('เริ่มสอนใหม่', 'Replay tutorial')}</button>${GUIDE().concat(HELP2()).map(x => `<details style="margin:6px 0"><summary>${x[0]} ${x[1]}</summary><p class="mu" style="margin:6px 0 0;line-height:1.6">${x[2]}</p></details>`).join('')}
<h2 style="margin-top:20px">${t('ติดต่อผู้พัฒนา', 'Contact the developer')}</h2><div class="srow fx"><span>094-920-2250</span><span><a href="tel:0949202250" style="color:var(--accent)">${t('โทร', 'Call')}</a> · <button class="pen" style="font-size:.9rem" data-a="cp" data-v="0949202250">${t('คัดลอก', 'Copy')}</button></span></div>
<h2 style="margin-top:20px">${t('คำติชม / เสนอแนะ / แจ้งปัญหา', 'Feedback / ideas / bugs')}</h2><textarea class="f" id="fbT" placeholder="${t('เล่าให้ฟังได้เลย', 'Tell us anything')}"></textarea>
<div class="two" style="margin-top:8px"><a class="ghost" data-a="fbGo" href="sms:0949202250" style="display:grid;place-items:center;color:var(--ink);text-decoration:none">${t('ส่งทาง SMS', 'Send by SMS')}</a><button data-a="cp" data-fb="1">${t('คัดลอกข้อความ', 'Copy text')}</button></div>
<small style="display:block;margin-top:6px">${t('ตอนนี้ยังไม่มีเซิร์ฟเวอร์ ข้อความจะส่งผ่าน SMS ไปที่เบอร์ผู้พัฒนา', 'No server yet: feedback goes to the developer by SMS.')}</small>
<h2 style="margin-top:20px">${t('ให้ทิปผู้พัฒนา ☕', 'Tip the developer ☕')}</h2><div class="chips">${[5, 10, 20, 50].map(a => `<button class="chip${tipA === a ? ' on' : ''}" data-a="tip" data-v="${a}">${a} ${t('บาท', 'THB')}</button>`).join('')}</div>
<div class="srow fx"><span>${t('กสิกรไทย', 'KBank')} 141-1-81754-3</span><button class="pen" style="font-size:.9rem" data-a="cp" data-v="1411817543">${t('คัดลอก', 'Copy')}</button></div>
<small style="display:block;margin-top:6px">${t(`โอน ${tipA} บาทเข้าบัญชีด้านบน ขอบคุณมากครับ การทิปเป็นความสมัครใจ ไม่มีผลต่อการใช้งาน`, `Transfer ${tipA} THB to the account above. Thank you! Tipping is optional.`)}</small>`;
}
const nm = (k, o) => rn && rn.k === k && rn.id === o.id ? `<span style="display:flex;gap:6px;flex:1"><input class="f" id="rni" value="${esc(o.name)}" style="min-height:36px;padding:4px 10px"><button class="ghost" data-a="rnOk" style="min-height:36px">✓</button></span>` : `<span>${esc(o.name)}<button class="pen" data-a="rn" data-k="${k}" data-id="${o.id}" aria-label="เปลี่ยนชื่อ ${esc(o.name)}">${ic('pen')}</button></span>`;
const eye = k => `<button class="eye" data-a="eye" data-k="${k}" aria-label="ซ่อนหรือแสดงตัวเลข">${ic(hide[k] ? 'off' : 'eye')}</button>`;

const row = i => `<li data-a="edit" data-id="${i.id}"><i class="d ${i.type}" style="margin:0"></i>${i.photo ? `<img class="th" src="${i.photo}" alt="">` : ''}<div class="mid"><b>${esc(i.cat)}${i.pending ? '<span class="bd">รอรายละเอียด</span>' : ''}</b><small>${fd(i.date)}${i.time ? ' ' + i.time + ' น.' : ''}${i.note ? ' · ' + esc(i.note) : ''}</small></div><span class="amt">${i.amount ? (i.type === 'income' ? '+' : '−') + m(i.amount) : '—'}</span></li>`;
const ul = a => a.length ? `<ul>${a.map(row).join('')}</ul>` : '<p class="empty">ยังไม่มีรายการ</p>';

/* ภาพรวม */
const vOv = () => {
  const n = new Date(), wn = win(), L = inR(ds(wn.a), ds(new Date(+wn.z - 864e5))), inc = sumBy(L, 'income'), ex = sumBy(L, 'expense');
  const E = inR(ds(new Date(n.getFullYear(), n.getMonth() - tp + 1, 1)), '9').filter(i => i.type === 'expense'), by = {};
  E.forEach(i => by[i.cat] = (by[i.cat] || 0) + i.amount);
  const tot = sumBy(E, 'expense'), T = hide.top ? [] : Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 3), pn = cb().filter(i => i.pending).length;
  const bal = w => cb().filter(i => i.w === w.id).reduce((s, i) => s + (i.type === 'income' ? i.amount : -i.amount), 0), ws = myW(), bk = curBook(), vt = t => L.filter(i => i.type === t && i.vat).reduce((s, i) => s + i.amount * 7 / 107, 0);
  const ch = chart(), pop = pmO ? popHtml(wn.sp) : '';
  const xt = !hide.sum && xp, xb = {}; (xt ? L.filter(i => i.type === xt) : []).forEach(i => xb[i.cat] = (xb[i.cat] || 0) + i.amount);
  const xph = xt ? `<section><h2>${xt === 'income' ? 'รายรับมาจากอะไรบ้าง' : 'รายจ่ายไปกับอะไรบ้าง'}</h2>${Object.entries(xb).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => `<div class="srow fx"><span>${esc(e[0])}</span><b>${m(e[1])}</b></div>`).join('') || '<p class="empty">ยังไม่มีรายการ</p>'}<button class="ghost" style="width:100%;margin-top:10px" data-a="dtGo" data-t="${xt}">ดูรายละเอียดทั้งหมด ›</button></section>` : '';
  const wsec = ws.length ? `<section><h2>เงินแต่ละช่องทาง</h2><small style="display:block;margin:-6px 0 8px">เงินที่อยู่ในแต่ละช่องทาง เช่น เงินสดหรือธนาคาร ตอนบันทึกเลือกได้ว่าเข้า/ออกช่องไหน กดรูปปากกาเพื่อเปลี่ยนชื่อ</small>${ws.map(w => `<div class="srow fx">${nm('w', w)}<b>${m(bal(w), hide.bal)}</b></div>`).join('')}</section>` : '';
  const vsec = bk.biz ? `<section><h2>ภาษีมูลค่าเพิ่มเดือนนี้ (ประมาณ)</h2><div class="srow fx"><span>VAT ขาย</span><span>${m(vt('income'), hide.sum)}</span></div><div class="srow fx"><span>VAT ซื้อ</span><span>${m(vt('expense'), hide.sum)}</span></div><div class="srow fx"><b>ต้องนำส่ง</b><b>${m(vt('income') - vt('expense'), hide.sum)}</b></div><small>ติ๊ก “รวม VAT” ตอนบันทึกรายการ</small></section>` : '';
  return `<div class="hero hg"><div><div class="hrow"><button class="pill2" data-a="pm" aria-haspopup="menu">คงเหลือ${LB[wn.sp]} ▾</button>${eye('bal')}</div><strong>${m(inc - ex, hide.bal)}</strong><div class="cm">${cmsg}</div></div>${ch}${pop}</div>
<div class="sum"><div class="srow"><div class="s" data-a="xp" data-t="income" style="cursor:pointer"><small><i class="d in"></i>รายรับ ▾</small><b>${m(inc, hide.sum)}</b></div><div class="s" data-a="xp" data-t="expense" style="cursor:pointer"><small><i class="d out"></i>รายจ่าย ▾</small><b>${m(ex, hide.sum)}</b></div>${eye('sum')}</div></div>
${xph}${pn ? `<div class="note" data-a="goPend">มี ${pn} รายการจากกล้องที่รอใส่รายละเอียด แตะเพื่อเติม</div>` : ''}
${wsec}${vsec}<section><div class="hrow"><h2>ใช้เงินไปกับอะไรมากที่สุด</h2>${eye('top')}</div>
${hide.top ? '<p class="empty">ซ่อนอยู่ แตะรูปตาเพื่อแสดง</p>' : ''}<div ${hide.top ? 'hidden' : ''}><div class="chips">${PER.map(p => `<button class="chip${p[0] === tp ? ' on' : ''}" data-a="top" data-n="${p[0]}">${p[1]}</button>`).join('')}</div>
${T.length ? T.map((t, k) => `<div><div class="srow"><span><i class="d" style="background:${COLORS[k]}"></i>${k + 1}. ${esc(t[0])}</span><span>${m(t[1], hide.top)}${hide.top ? '' : ' · ' + Math.round(t[1] / tot * 100) + '%'}</span></div><div class="pb"><i style="width:${t[1] / tot * 100}%;background:${COLORS[k]}"></i></div></div>`).join('') : '<p class="empty">ยังไม่มีรายจ่ายในช่วงนี้</p>'}</div></section>
<section><div class="hrow"><h2>รายการล่าสุด</h2>${eye('rec')}</div>${hide.rec ? '<p class="empty">ซ่อนอยู่ แตะรูปตาเพื่อแสดง</p>' : ul(srt(cb()).slice(0, 6))}</section>`;
};

/* วันนี้ */
const vTd = () => {
  const n = new Date(), t = ds(n), p = PB().plan, FAC = { month: 1, week: 52 / 12, year: 1 / 12 }, PN = { month: 'เดือน', week: 'สัปดาห์', year: 'ปี' }, k = FAC[p.per];
  const mi = p.inc * k, fx = p.fixed.reduce((a, f) => a + f.amt * FAC[f.per], 0), free = mi - fx;
  const dim = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate(), daily = free / dim, dl = dim - n.getDate() + 1;
  const td = inR(t, t), spent = sumBy(td, 'expense'), ms = sumBy(inR(ds(new Date(n.getFullYear(), n.getMonth(), 1)), '9'), 'expense'), left = free - ms;
  const g = PB().goals.filter(x => x.saved < x.target).sort((a, b) => b.saved / b.target - a.saved / a.target)[0];
  const ok = p.inc > 0 && free > 0;
  return `<section><h2>วันนี้ใช้ไปแล้ว</h2><span class="big">${m(spent)}</span>
${ok ? `<div class="pb${spent > daily ? ' over' : ''}"><i style="width:${Math.min(100, spent / daily * 100)}%"></i></div><small>งบวันละ ${m(daily)} · ${spent > daily ? 'เกินงบวันนี้ ' + m(spent - daily) : 'เหลือใช้ได้อีก ' + m(daily - spent)}</small>` : '<p class="mu" style="margin:6px 0 0">ตั้งรายได้ด้านล่างเพื่อให้คำนวณงบต่อวัน</p>'}</section>
${ok ? `<section><h2>เหลือใช้เดือนนี้</h2><span class="big">${m(left)}</span><br><small>${left > 0 ? 'ใช้ได้วันละประมาณ ' + m(left / dl) + ' อีก ' + dl + ' วัน' : 'ใช้เกินงบเดือนนี้แล้ว'} · สัปดาห์ละประมาณ ${m(daily * 7)}</small></section>` : ''}
${ok && left > 0 ? `<section><h2>ถ้าสิ้นเดือนเหลือ ${m(left)} ลองแบ่งแบบนี้</h2><p style="margin:0;line-height:1.8">50% ${g ? 'เข้าเป้าหมาย “' + esc(g.name) + '”' : 'เป็นเงินออม'} ${m(left * .5)}<br>30% ลงทุนหรือออมระยะยาว ${m(left * .3)}<br>20% เงินสำรองหรือของอยากได้ ${m(left * .2)}</p><small>เป็นตัวอย่างการแบ่งทั่วไป ไม่ใช่คำแนะนำทางการเงิน</small></section>` : ''}
<section><h2>รายการวันนี้</h2>${ul(srt(td))}</section>
<section><details ${po || !p.inc ? 'open' : ''}><summary>ตั้งรายได้และรายจ่ายประจำ</summary>
<label>รายได้</label><div class="row"><input class="f" type="number" inputmode="decimal" data-p="inc" value="${p.inc || ''}" placeholder="เช่น 25000"><select class="f" data-p="per" style="max-width:130px"><option value="month"${p.per === 'month' ? ' selected' : ''}>ต่อเดือน</option><option value="week"${p.per === 'week' ? ' selected' : ''}>ต่อสัปดาห์</option><option value="year"${p.per === 'year' ? ' selected' : ''}>ต่อปี</option></select></div>
<label>รายจ่ายประจำ เช่น Netflix, Spotify, YouTube Premium, ค่าเน็ต</label>
${p.fixed.map(f => `<div class="srow fx"><span>${esc(f.name)}</span><span>${m(f.amt)}/${PN[f.per]}<button class="eye" style="display:inline-grid;vertical-align:middle;margin-left:8px" data-a="fixDel" data-id="${f.id}" aria-label="ลบ ${esc(f.name)}">×</button></span></div>`).join('')}
<div class="row"><input class="f" id="fn" placeholder="ชื่อ"><input class="f" id="fa" type="number" inputmode="decimal" placeholder="บาท" style="max-width:90px"><select class="f" id="fp" style="max-width:100px"><option value="month">เดือน</option><option value="week">สัปดาห์</option><option value="year">ปี</option></select></div>
<button class="ghost" style="margin-top:8px;width:100%" data-a="fixAdd">เพิ่มรายจ่ายประจำ</button>
${p.inc ? `<p class="mu" style="font-size:.85rem;margin:12px 0 0">รายได้ต่อเดือนประมาณ ${m(mi)} หักรายจ่ายประจำ ${m(fx)} เหลือ ${m(free)} ตกวันละ ${m(daily)}<br>รายจ่ายประจำไม่ต้องบันทึกซ้ำในรายการ</p>` : ''}
</details></section>`;
};

/* เป้าหมาย */
const vGl = () => `<section><h2>เป้าหมายและกองกลาง เช่น ทริปทะเล</h2>${PB().goals.map(g => {
  const pc = Math.min(100, g.saved / g.target * 100);
  return `<div class="g"><div class="srow"><b>${esc(g.name)}</b><button class="eye" data-a="gDel" data-id="${g.id}" aria-label="ลบเป้าหมาย ${esc(g.name)}">×</button></div><small>${m(g.saved)} จาก ${m(g.target)} · ${Math.round(pc)}%${g.saved >= g.target ? ' · ครบแล้ว' : ' · อีก ' + m(g.target - g.saved)}</small><div class="pb"><i style="width:${pc}%"></i></div><div class="row" style="margin-top:0"><input class="f" type="number" inputmode="decimal" placeholder="จำนวนเงิน"><input class="f" placeholder="ใครเก็บ/เบิก"></div><div class="two" style="margin-top:8px;grid-template-columns:repeat(3,1fr)"><button data-a="gAdd" data-s="1" data-id="${g.id}">เก็บเพิ่ม</button><button data-a="gAdd" data-s="-1" data-id="${g.id}">เบิกจ่าย</button><label class="ghost" style="display:grid;place-items:center;margin:0;color:var(--ink);cursor:pointer">แนบสลิป<input type="file" accept="image/*" hidden data-sl="${g.id}"></label></div>${(g.log || []).slice(0, 3).map(l => `<small style="display:block;margin-top:4px">${fd(l.d)} · ${esc(l.w || 'ไม่ระบุ')} · ${l.a > 0 ? 'เก็บ ' : 'เบิก '}${m(Math.abs(l.a))}${l.s ? ` <img class="th" style="width:26px;height:26px;vertical-align:middle" src="${l.s}" alt="สลิป">` : ''}</small>`).join('')}</div>`;
}).join('') || '<p class="empty">ยังไม่มีเป้าหมาย เพิ่มของที่อยากได้หรือเงินที่อยากเก็บได้ด้านล่าง</p>'}</section>
<section><h2>เพิ่มเป้าหมายใหม่</h2><input class="f" id="gn" placeholder="เช่น หูฟังใหม่, กองทุนฉุกเฉิน"><input class="f" id="gt" type="number" inputmode="decimal" placeholder="จำนวนเงินที่ต้องการ" style="margin-top:8px"><button class="primary" data-a="gNew">เพิ่มเป้าหมาย</button></section>`;

/* ประวัติ */
const vHs = () => {
  const n = new Date(), o = hs.o; let a, b, lb;
  const f = d => d.toLocaleDateString(LOC, { day: 'numeric', month: 'short' });
  if (hs.r === 'day') { const d = new Date(n.getFullYear(), n.getMonth(), n.getDate() + o); a = b = ds(d); lb = d.toLocaleDateString(LOC, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  else if (hs.r === 'week') { const s = new Date(n.getFullYear(), n.getMonth(), n.getDate() - ((n.getDay() + 6) % 7) + o * 7), e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6); a = ds(s); b = ds(e); lb = f(s) + ' – ' + f(e); }
  else { const d = new Date(n.getFullYear(), n.getMonth() + o, 1); a = ds(d); b = ds(new Date(d.getFullYear(), d.getMonth() + 1, 0)); lb = d.toLocaleDateString(LOC, { month: 'long', year: 'numeric' }); }
  const L = srt(inR(a, b));
  const body = L.length ? `<ul>${L.map((i, k) => (hs.r !== 'day' && (!k || L[k - 1].date !== i.date) ? `<li class="hd">${fd(i.date)}</li>` : '') + row(i)).join('')}</ul>` : '<p class="empty">ไม่มีรายการในช่วงนี้</p>';
  return `<section><div class="seg s3">${[['day', 'วัน'], ['week', 'สัปดาห์'], ['month', 'เดือน']].map(r => `<button class="${hs.r === r[0] ? 'on' : ''}" data-a="hr" data-r="${r[0]}">${r[1]}</button>`).join('')}</div>
<div class="srow"><button class="ghost" data-a="hm" data-d="-1" aria-label="ก่อนหน้า">‹</button><b style="text-align:center">${lb}</b><button class="ghost" data-a="hm" data-d="1" aria-label="ถัดไป">›</button></div>
<div class="srow" style="margin:12px 0 4px"><span><i class="d in"></i>${m(sumBy(L, 'income'), hide.sum)}</span><span><i class="d out"></i>${m(sumBy(L, 'expense'), hide.sum)}</span>${eye('sum')}</div>${body}</section>`;
};

function drawDch() { const n = new Date(), cur = $('dd').value; $('dch').innerHTML = [0, 1, 2, 3, 4, 5, 6].map(i => { const d = new Date(n.getFullYear(), n.getMonth(), n.getDate() - i), v = ds(d); return `<button class="chip${v === cur ? ' on' : ''}" data-a="dsel" data-d="${v}">${i ? i === 1 ? 'เมื่อวาน' : d.toLocaleDateString(LOC, { weekday: 'short', day: 'numeric' }) : 'วันนี้'}</button>`; }).join(''); }
const vDt = () => {
  const n = new Date(), d = new Date(n.getFullYear(), n.getMonth() + dtO, 1), L = srt(inR(ds(d), ds(new Date(d.getFullYear(), d.getMonth() + 1, 0))).filter(i => i.type === dtT));
  return `<section><div class="srow"><button class="ghost" data-a="back">‹ กลับ</button><b>${dtT === 'income' ? 'รายรับ' : 'รายจ่าย'}ทั้งหมด</b><span style="width:70px"></span></div><div class="srow" style="margin-top:12px"><button class="ghost" data-a="dtM" data-d="-1" aria-label="เดือนก่อน">‹</button><b>${d.toLocaleDateString(LOC, { month: 'long', year: 'numeric' })}</b><button class="ghost" data-a="dtM" data-d="1" aria-label="เดือนถัดไป">›</button></div><p class="big" style="margin:10px 0 0">${m(sumBy(L, dtT), hide.sum)}</p>${L.length ? `<ul>${L.map(row).join('')}</ul>` : '<p class="empty">ไม่มีรายการ</p>'}</section>`;
};
const vIv = () => { const b = curBook(); return `<section><h2>ใบกำกับภาษี</h2><button class="primary" style="margin-top:0" data-a="ivNew">+ ออกใบกำกับภาษีใหม่</button>${(b.invs || []).slice().reverse().map(v => `<div class="srow fx" data-a="ivShow" data-n="${v.no}" style="cursor:pointer;margin-top:6px"><span>${esc(v.no)} · ${esc(v.buyer.name || 'ไม่ระบุ')}<br><small>${fd(v.date)}</small></span><b>${m(v.total)}</b></div>`).join('') || '<p class="empty">ยังไม่มีใบกำกับภาษี</p>'}</section>`; };
const ivForm = () => {
  const b = curBook(), s = b.seller || {}, rw = [0, 1, 2, 3, 4].map(i => `<div class="row"><input class="f" id="ivd${i}" placeholder="รายการ"><input class="f" id="ivq${i}" type="number" inputmode="decimal" placeholder="จำนวน" style="max-width:76px"><input class="f" id="ivp${i}" type="number" inputmode="decimal" placeholder="ราคา" style="max-width:96px"></div>`).join('');
  return `<h2>ออกใบกำกับภาษี</h2><label>ผู้ขาย (จดจำไว้ใช้ครั้งต่อไป)</label><input class="f" id="isn" placeholder="ชื่อกิจการ" value="${esc(s.name || b.name)}"><input class="f" id="isa" placeholder="ที่อยู่" value="${esc(s.addr || '')}" style="margin-top:8px"><input class="f" id="ist" placeholder="เลขประจำตัวผู้เสียภาษี 13 หลัก" inputmode="numeric" value="${esc(s.tax || '')}" style="margin-top:8px"><label>ผู้ซื้อ</label><input class="f" id="ibn" placeholder="ชื่อลูกค้า"><input class="f" id="iba" placeholder="ที่อยู่" style="margin-top:8px"><input class="f" id="ibt" placeholder="เลขประจำตัวผู้เสียภาษี (ถ้ามี)" inputmode="numeric" style="margin-top:8px"><label>วันที่</label><input class="f" id="ivdt" type="date" value="${ds(new Date())}"><label>รายการสินค้า/บริการ (ราคาก่อน VAT)</label>${rw}<label><input type="checkbox" id="ivin" checked> บันทึกเป็นรายรับด้วย</label><button class="primary" data-a="ivMake">สร้างใบกำกับภาษี</button><small style="display:block;margin-top:8px">เป็นแบบฟอร์มพื้นฐาน ตรวจรูปแบบให้ตรงกฎหมายก่อนใช้จริง</small>`;
};
const ivDoc = v => `<div class="doc"><b style="font-size:1.1rem">ใบกำกับภาษี / TAX INVOICE</b><br>เลขที่ ${esc(v.no)} · วันที่ ${fd(v.date)}<hr><b>ผู้ขาย</b> ${esc(v.seller.name)}<br>${esc(v.seller.addr)}<br>เลขประจำตัวผู้เสียภาษี ${esc(v.seller.tax)}<br><br><b>ผู้ซื้อ</b> ${esc(v.buyer.name)}<br>${esc(v.buyer.addr)}<br>เลขประจำตัวผู้เสียภาษี ${esc(v.buyer.tax)}<table><tr><th>รายการ</th><th>จำนวน</th><th>ราคา</th><th>รวม</th></tr>${v.items.map(i => `<tr><td>${esc(i.d)}</td><td>${i.q}</td><td>${m(i.p)}</td><td>${m(i.q * i.p)}</td></tr>`).join('')}</table><p style="text-align:right;margin:8px 0 0">ก่อน VAT ${m(v.sub)}<br>VAT 7% ${m(v.vat)}<br><b>รวมทั้งสิ้น ${m(v.total)}</b></p></div><div class="two" style="margin-top:10px"><button data-a="ivPrint">พิมพ์ / บันทึก PDF</button><button data-a="close">ปิด</button></div>`;
const LB = { day: 'วันนี้', week: 'สัปดาห์นี้', month: 'เดือนนี้' };
let cmsg = '', cgI = 0, cgE = 0;
function win() {
  const g = PB().cg = PB().cg || { span: 'month', lim: {} }, sp = g.span, n = new Date(), T0 = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const a = sp === 'day' ? T0 : sp === 'week' ? new Date(+T0 - ((n.getDay() + 6) % 7) * 864e5) : new Date(n.getFullYear(), n.getMonth(), 1);
  const z = sp === 'day' ? new Date(+T0 + 864e5) : sp === 'week' ? new Date(+a + 7 * 864e5) : new Date(n.getFullYear(), n.getMonth() + 1, 1);
  return { sp, a, z, g };
}
function chart() {
  const { sp, a, z, g } = win(), n = new Date(), pl = PB().plan, mi = (pl.inc || 10000) * { month: 1, week: 52 / 12, year: 1 / 12 }[pl.per], sc = { month: 1, week: 12 / 52, day: 1 / 30 }[sp], lm = g.lim[sp] || {};
  const I = cgI = lm.i || Math.round(mi * sc), E = cgE = lm.e || Math.round(mi * .7 * sc);
  const ev = cb().filter(i => i.amount > 0).map(i => ({ t: +new Date(i.date + 'T' + (i.time || '12:00')), i })).filter(o => o.t >= +a && o.t < +z).sort((p, q) => p.t - q.t);
  let ci = 0, ce = 0, y = 0; const px = t => (t - a) / (z - a) * 120, py = v => 32 - Math.max(-1.15, Math.min(1.15, v)) * 24, pts = [[0, 32]];
  ev.forEach(o => { if (o.i.type === 'income') ci += o.i.amount; else ce += o.i.amount; y = ci / I - ce / E; pts.push([px(o.t), py(y)]); });
  pts.push([px(Math.min(+n, +z)), py(y)]);
  cmsg = !(pl.inc > 0 || lm.i || lm.e) ? 'แตะที่กราฟเพื่อตั้งเพดาน' : !ev.length ? 'ยังไม่มีรายการ' : y >= 1 ? 'เกินคาดดด! เก่งมาก' : y >= .8 ? 'ใกล้ถึงเป้าแล้ว' : y <= -1 ? 'ใช้เกินเพดานแล้วนะ' : y <= -.8 ? 'เริ่มอันตราย ใช้จ่ายระวัง' : 'สมดุลดี';
  const l = pts[pts.length - 1];
  return `<div class="cg mini" data-a="pm" style="cursor:pointer"><svg viewBox="0 0 120 64" role="img" aria-label="กราฟรายรับรายจ่าย: ${cmsg}"><line class="gl" x1="0" x2="120" y1="8" y2="8"/><line class="gl" x1="0" x2="120" y1="56" y2="56"/><polyline class="ln" points="${pts.map(p => p.join(',')).join(' ')}"/><circle class="dt" cx="${l[0]}" cy="${l[1]}" r="3.5"/></svg></div>`;
}
const popHtml = sp => `<div class="pop" role="menu">${[['day', 'วันนี้'], ['week', 'สัปดาห์นี้'], ['month', 'เดือนนี้']].map(q => `<button class="${sp === q[0] ? 'on' : ''}" data-a="cgSp" data-s="${q[0]}">${q[1]}</button>`).join('')}<button data-a="cgSet">ตั้งเพดานกราฟ ${cgO ? '▴' : '▾'}</button>${cgO ? `<div class="row" style="padding:4px 10px 8px"><input class="f" id="cgi" type="number" inputmode="decimal" placeholder="เป้ารายรับ ${cgI}"><input class="f" id="cge" type="number" inputmode="decimal" placeholder="เพดานรายจ่าย ${cgE}"><button class="ghost" data-a="cgSave">บันทึก</button></div>` : ''}</div>`;
function render() {
  if (view === 'iv' && !curBook().biz) view = 'ov'; $('ivTab').hidden = !curBook().biz;
  $('main').innerHTML = { ov: vOv, td: vTd, gl: vGl, hs: vHs, dt: vDt, iv: vIv }[view]();
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.v === view));
  drawBell(); $('bkBtn').textContent = curBook().name + ' ▾';
}
function setTab(t) { document.querySelectorAll('.bar button').forEach(b => b.classList.toggle('on', b.dataset.go === t)); }
const openSheet = id => { $('scrim').classList.add('open'); $(id).classList.add('open'); };
function closeSheets() {
  if (!D.seen && $('sTut').classList.contains('open')) { D.seen = true; saveD(); } $('scrim').classList.remove('open'); document.querySelectorAll('.sheet').forEach(s => s.classList.remove('open')); setTab('home'); }

/* ฟอร์มเพิ่ม/แก้ไข */
const dc = t => D.cats[t].includes('อื่นๆ') ? 'อื่นๆ' : (D.cats[t][0] || 'อื่นๆ');
function drawChips() {
  const c = [...D.cats[type]]; if (!c.includes(cat)) c.push(cat);
  const f = x => items.filter(i => i.type === type && i.cat === x).length;
  $('chips').innerHTML = c.sort((a, b) => f(b) - f(a)).map(x => `<button class="chip${x === cat ? ' on' : ''}" data-a="cat" data-c="${esc(x)}">${esc(x)}</button>`).join('');
}
function drawWl() { $('wl').innerHTML = myW().map(w => `<button class="chip${w.id === wl ? ' on' : ''}" data-a="wsel" data-id="${w.id}">${esc(w.name)}</button>`).join('') || '<small>ยังไม่มีบัญชี เพิ่มได้ที่ปุ่มสมุดบัญชีด้านบน</small>'; }
function setType(t, c) {
  type = t; cat = c || dc(t);
  document.querySelectorAll('#seg button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); drawChips();
}
function setMode(x) { mode = x; document.querySelectorAll('#tm button').forEach(b => b.classList.toggle('on', b.dataset.m === x)); $('dtw').hidden = x !== 'custom'; }
function drawPhoto() { $('pv').hidden = !photo; if (photo) $('pvImg').src = photo; }
function openAdd(t, id, keep) {
  const x = id && items.find(i => i.id === id); eid = x ? id : null;
  if (!keep) photo = x ? (x.photo || null) : null;
  setType(x ? x.type : t, x && x.cat);
  $('amount').value = x && x.amount ? x.amount : ''; $('note').value = x ? x.note : '';
  const n = new Date(); $('dd').value = x ? x.date : ds(n); $('tt').value = x ? (x.time || '12:00') : ts(n); drawDch();
  setMode(x ? 'custom' : 'now'); wl = (x && x.w) || D.lw[D.cur] || (myW()[0] || {}).id || null; drawWl(); $('vatL').hidden = !curBook().biz; $('vat').checked = !!(x && x.vat);
  $('save').textContent = x ? 'อัปเดต' : 'บันทึก'; $('delBtn').hidden = !x; $('msg').textContent = '';
  drawPhoto(); setTab(x ? 'home' : t); openSheet('sAdd'); setTimeout(() => $('amount').focus(), 280);
}
function shrink(file, cb, mx = 720) {
  const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, mx / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', 0.6)); }; im.src = r.result; };
  r.readAsDataURL(file);
}
$('camIn').onchange = function () {
  const f = this.files && this.files[0]; if (!f) return;
  shrink(f, u => { qp = u; $('qImg').src = u; openSheet('sQ'); }); this.value = '';
};
function drawCats() {
  $('cats').innerHTML = ['expense', 'income'].map(t => `<label>${t === 'expense' ? 'หมวดรายจ่าย' : 'หมวดรายรับ'}</label><div class="chips wr">${D.cats[t].map(c => `<span class="chip">${esc(c)}<button class="x" data-a="cDel" data-t="${t}" data-c="${esc(c)}" aria-label="ลบหมวด ${esc(c)}">×</button></span>`).join('')}</div><div class="row" style="margin-top:0"><input class="f" id="cn-${t}" placeholder="หมวดใหม่"><button class="ghost" data-a="cAdd" data-t="${t}">เพิ่ม</button></div>`).join('');
}
function applyTheme(t) {
  if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll('#themes button').forEach(b => b.classList.toggle('on', b.dataset.th === t)); try { localStorage.setItem(TK, t); } catch (e) {}
}

const dataBlob = u => { const [h, d] = u.split(','), bin = atob(d), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: h.slice(5, h.indexOf(';')) }); };
const guess = (t, a) => { const c = {}; D.learn.filter(l => l.t === t && Math.abs(l.a - a) <= Math.max(10, a * .2)).forEach(l => c[l.c] = (c[l.c] || 0) + 1); return Object.entries(c).sort((x, y) => y[1] - x[1]).map(e => e[0])[0]; };
const PROMPT = 'นี่คือรูปจากอัลบั้ม ตอบเป็น JSON อย่างเดียว {"isSlip": true ถ้าเป็นสลิปโอนเงิน/ชำระเงินของธนาคารไทย ไม่งั้น false, "bank": "ชื่อธนาคารที่ออกสลิป เช่น กสิกรไทย ไทยพาณิชย์ กรุงเทพ กรุงไทย กรุงศรี ทหารไทยธนชาต ออมสิน", "amount": จำนวนเงินเป็นตัวเลขบาท, "recipient": "ชื่อผู้รับโอนหรือร้านค้า", "date": "YYYY-MM-DD เป็น ค.ศ. (ถ้าเป็น พ.ศ. ให้ลบ 543) หรือ null", "time": "HH:MM หรือ null"}';
const sampler = async () => { const s = window.claude && await claude.use('sample'); return s && (await s.limits()).images ? s : null; };
const ord = q => { const g = guess(q.t, q.a), f = c => items.filter(i => i.type === q.t && i.cat === c).length; return [...new Set([g, ...[...D.cats[q.t]].sort((x, y) => f(y) - f(x))].filter(Boolean))]; };
function finish(q, c) {
  const it = q.iid && items.find(i => i.id === q.iid), note = [q.n, q.bank && '(' + q.bank + ')'].filter(Boolean).join(' ');
  if (it) { Object.assign(it, { amount: q.a, cat: c, note: it.note || note, sk: q.sk }); delete it.pending; }
  else items.push({ id: uid(), type: q.t, amount: q.a, cat: c, date: q.date, time: q.time, note, photo: q.photo, sk: q.sk, bk: q.bk, w: D.lw[q.bk] || (D.wallets.find(w => w.bk === q.bk) || {}).id });
  D.learn.push({ t: q.t, a: q.a, c });
}
function slipIn(r, base) {
  const a = r && r.isSlip !== false && +r.amount; if (!(a > 0)) return 0;
  const n = String(r.recipient || '').trim().slice(0, 40), nd = new Date(), t = base.t || 'expense';
  const date = /^\d{4}-\d\d-\d\d$/.test(r.date) ? r.date : ds(nd), time = /^\d\d:\d\d$/.test(r.time) ? r.time : ts(nd), sk = [a, date, time, n].join('|');
  if (items.some(i => i.sk === sk) || D.q.some(x => x.sk === sk)) return 0;
  const q = { id: uid(), iid: base.iid, a, t, n, bank: String(r.bank || '').slice(0, 30), date, time, photo: base.photo, sk, bk: base.bk || D.cur };
  const ru = n && D.rules.find(u => u.t === t && n.toLowerCase().includes(u.n.toLowerCase()));
  if (ru) { finish(q, ru.c); return 2; }
  D.q.push(q); return 1;
}
async function readSlip(it) {
  try {
    const s = await sampler(); if (!s) return;
    const k = slipIn(await s.json(PROMPT, { images: [dataBlob(it.photo)], modelTier: 'quick' }), { iid: it.id, photo: it.photo, t: it.type, bk: it.bk });
    if (k) { saveI(); saveD(); render(); toast(k === 2 ? 'อ่านสลิปและจัดหมวดให้แล้ว' : 'อ่านสลิปแล้ว ดูที่รูปกระดิ่ง'); }
  } catch (e) {}
}
async function readAlbum(files) {
  if (!D.slipOK) { toast('ติ๊กอนุญาตอ่านสลิปก่อนนะ'); return; }
  const s = await sampler(); if (!s) { toast('อ่านสลิปไม่ได้ในตอนนี้'); return; }
  const fl = files.slice(0, 8); let k = 0, auto = 0; toast('กำลังอ่าน ' + fl.length + ' รูป…');
  for (const f of fl) {
    try {
      const big = await new Promise(v => shrink(f, v, 1200)), th = await new Promise(v => shrink(f, v, 360));
      const x = slipIn(await s.json(PROMPT, { images: [dataBlob(big)], modelTier: 'quick' }), { photo: th, t: 'expense', bk: D.cur });
      if (x) k++; if (x === 2) auto++;
    } catch (e) {}
  }
  saveI(); saveD(); render(); drawBell(); drawNts();
  toast(k ? 'อ่านสลิปได้ ' + k + ' รายการ' + (auto ? ' (จัดหมวดอัตโนมัติ ' + auto + ')' : '') : 'ไม่พบสลิปธนาคารในรูปที่เลือก');
}
function drawBell() { $('bellBtn').innerHTML = ic('bell') + (D.q.length ? `<i>${D.q.length}</i>` : ''); }
function drawNts() {
  $('nts').innerHTML = D.q.map(q => `<div class="nt"><b>${m(q.a)} · ${esc(q.n || 'ไม่ทราบชื่อ')}</b><br><small>${esc(q.bank || 'ไม่ทราบธนาคาร')} · ${fd(q.date)} ${q.time} น. · ${q.t === 'income' ? 'รายรับ' : 'รายจ่าย'}</small>
<div class="chips" style="margin-top:8px">${ord(q).map((c, i) => `<button class="chip" data-a="ntPick" data-id="${q.id}" data-c="${esc(c)}">${i < 3 ? (i + 1) + ' ' : ''}${esc(c)}</button>`).join('')}</div>
<label style="display:flex;gap:8px;align-items:center;margin:2px 0 6px"><input type="checkbox"> จำชื่อนี้ ครั้งหน้าจัดหมวดนี้ให้อัตโนมัติ</label>
<div class="srow"><button class="link" style="width:auto;margin:0;padding:4px" data-a="ntT" data-id="${q.id}">เป็น${q.t === 'income' ? 'รายจ่าย' : 'รายรับ'}แทน</button><button class="link" style="width:auto;margin:0;padding:4px" data-a="ntNo" data-id="${q.id}">ข้าม</button></div></div>`).join('') || '<p class="empty">ไม่มีการแจ้งเตือน</p>';
}
function drawRules() {
  $('rules').innerHTML = D.rules.map((u, i) => `<div class="srow fx"><span>${esc(u.n)} → ${esc(u.c)}</span><button class="eye" data-a="ruDel" data-i="${i}" aria-label="ลบกฎ ${esc(u.n)}">×</button></div>`).join('') + `<div class="row"><input class="f" id="run" placeholder="ชื่อในสลิป เช่น สมพง"><select class="f" id="ruc" style="max-width:130px">${D.cats.expense.map(c => `<option>${esc(c)}</option>`).join('')}</select><button class="ghost" data-a="ruAdd">เพิ่ม</button></div>`;
}
function drawBks() {
  $('bks').innerHTML = D.books.map(b => rn && rn.k === 'b' && rn.id === b.id ? `<div class="row"><input class="f" id="rni" value="${esc(b.name)}"><button class="ghost" data-a="rnOk">✓</button></div>` : `<div class="srow" style="margin-bottom:8px"><button class="two-b${b.id === D.cur ? ' on' : ''}" style="margin:0;flex:1" data-a="bkGo" data-id="${b.id}">${esc(b.name)}${b.biz ? ' · ธุรกิจ' : b.kind === 'g' ? ' · กลุ่ม' : ''}</button><button class="pen" data-a="rn" data-k="b" data-id="${b.id}" aria-label="เปลี่ยนชื่อ ${esc(b.name)}">${ic('pen')}</button></div>`).join('') +
    `<div class="row"><input class="f" id="bkn" placeholder="ชื่อสมุดใหม่ เช่น ร้านกาแฟ"><select class="f" id="bkt" style="max-width:110px"><option value="p">ส่วนตัว</option><option value="g">กลุ่ม</option><option value="b">ธุรกิจ</option></select></div><button class="ghost" style="width:100%;margin-top:8px" data-a="bkAdd">เพิ่มสมุดใหม่</button>
<h2 style="margin-top:20px">ช่องทางเงินใน “${esc(curBook().name)}”</h2><small style="display:block;margin:-6px 0 8px">ช่องทางที่เงินเข้าหรือออก เช่น เงินสด กสิกร พร้อมเพย์ ตอนบันทึกรายการเลือกได้ว่าใช้ช่องไหน</small><div class="chips wr">${myW().map(w => `<span class="chip">${nm('w', w)}<button class="x" data-a="wDel" data-id="${w.id}" aria-label="ลบบัญชี ${esc(w.name)}">×</button></span>`).join('')}</div><div class="row" style="margin-top:0"><input class="f" id="wn" placeholder="เช่น กสิกร, เงินสด, พร้อมเพย์"><button class="ghost" data-a="wAdd">เพิ่ม</button></div>`;
}

const A = {
  tab: b => { view = b.dataset.v; po = false; render(); window.scrollTo(0, 0); },
  eye: b => { hide[b.dataset.k] = !hide[b.dataset.k]; sv(HK, hide); render(); },
  top: b => { tp = +b.dataset.n; render(); },
  edit: b => openAdd(null, b.dataset.id),
  goPend: () => openAdd(null, cb().find(i => i.pending).id),
  nav: b => {
    const g = b.dataset.go;
    if (g === 'home') { view = 'ov'; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else if (g === 'cam') $('camIn').click();
    else if (g === 'more') { drawCats(); drawRules(); drawMx(); $('slipOK').checked = !!D.slipOK; setTab('more'); openSheet('sMore'); }
    else openAdd(g);
  },
  close: closeSheets,
  xp: b => { xp = xp === b.dataset.t ? null : b.dataset.t; render(); },
  dtGo: b => { dtT = b.dataset.t; dtO = 0; view = 'dt'; render(); window.scrollTo(0, 0); },
  dtM: b => { dtO += +b.dataset.d; render(); },
  back: () => { view = 'ov'; render(); },
  dsel: b => { $('dd').value = b.dataset.d; drawDch(); },
  rn: b => { rn = { k: b.dataset.k, id: b.dataset.id }; render(); drawBks(); },
  rnOk: () => { const v = $('rni').value.trim(), o = (rn.k === 'w' ? D.wallets : D.books).find(x => x.id === rn.id); if (v && o) o.name = v; rn = null; saveD(); render(); drawBks(); },
  pm: () => { pmO = !pmO; render(); },
  cgSp: b => { PB().cg.span = b.dataset.s; pmO = false; saveD(); render(); },
  cgSet: () => { cgO = !cgO; render(); },
  cgSave: () => { const g = PB().cg; g.lim[g.span] = { i: +$('cgi').value || 0, e: +$('cge').value || 0 }; cgO = false; pmO = false; saveD(); render(); },
  ivNew: () => { $('ivBody').innerHTML = ivForm(); openSheet('sInv'); },
  ivShow: b => { const v = (curBook().invs || []).find(x => x.no === b.dataset.n); if (v) { $('ivBody').innerHTML = ivDoc(v); openSheet('sInv'); } },
  ivPrint: () => { try { window.print(); } catch (e) { toast('พิมพ์จากหน้านี้ไม่ได้ ลองแคปหน้าจอแทน'); } },
  ivMake: () => {
    const b = curBook(), it = [0, 1, 2, 3, 4].map(i => ({ d: $('ivd' + i).value.trim(), q: +$('ivq' + i).value || 1, p: +$('ivp' + i).value || 0 })).filter(x => x.d && x.p > 0);
    if (!it.length) { toast('ใส่รายการและราคาอย่างน้อย 1 แถว'); return; }
    const sub = it.reduce((t, x) => t + x.q * x.p, 0), seq = (b.seq || 0) + 1, no = 'INV-' + String(new Date().getFullYear()).slice(2) + String(seq).padStart(4, '0');
    const v = { no, date: $('ivdt').value || ds(new Date()), seller: { name: $('isn').value.trim(), addr: $('isa').value.trim(), tax: $('ist').value.trim() }, buyer: { name: $('ibn').value.trim(), addr: $('iba').value.trim(), tax: $('ibt').value.trim() }, items: it, sub, vat: sub * .07, total: sub * 1.07 };
    b.seq = seq; b.seller = v.seller; (b.invs = b.invs || []).push(v);
    if ($('ivin').checked) { items.push({ id: uid(), type: 'income', amount: v.total, cat: dc('income'), date: v.date, time: ts(new Date()), note: 'ใบกำกับ ' + no, bk: D.cur, w: D.lw[D.cur] || (myW()[0] || {}).id, vat: true }); saveI(); }
    saveD(); render(); $('ivBody').innerHTML = ivDoc(v);
  },
  wsel: b => { wl = b.dataset.id; drawWl(); },
  bkOpen: () => { drawBks(); openSheet('sBk'); },
  bkGo: b => { D.cur = b.dataset.id; saveD(); drawBks(); render(); },
  bkAdd: () => { const n = $('bkn').value.trim(); if (!n) return; const id = uid(); const k = $('bkt').value; D.books.push({ id, name: n, kind: k, biz: k === 'b' }); D.wallets.push({ id: uid(), name: k === 'g' ? 'กองกลาง' : 'เงินสด', bk: id }); D.cur = id; saveD(); drawBks(); render(); },
  wAdd: () => { const n = $('wn').value.trim(); if (!n) return; D.wallets.push({ id: uid(), name: n, bk: D.cur }); saveD(); drawBks(); },
  wDel: b => { D.wallets = D.wallets.filter(w => w.id !== b.dataset.id); saveD(); drawBks(); render(); },
  bell: () => { drawNts(); openSheet('sBell'); },
  ntPick: b => {
    const q = D.q.find(x => x.id === b.dataset.id); if (!q) return;
    if (b.closest('.nt').querySelector('input').checked && q.n) D.rules.push({ n: q.n, c: b.dataset.c, t: q.t });
    finish(q, b.dataset.c); D.q = D.q.filter(x => x.id !== q.id); saveI(); saveD(); drawNts(); render();
  },
  ntT: b => { const q = D.q.find(x => x.id === b.dataset.id); if (q) { q.t = q.t === 'income' ? 'expense' : 'income'; saveD(); drawNts(); } },
  alb: (b, e) => { if (!D.slipOK) { e.preventDefault(); toast(t('ติ๊กอนุญาตอ่านสลิปที่แท็บ อื่นๆ ก่อนนะ', 'Tick “allow reading slips” in Other first')); } },
  lang: b => { D.lang = b.dataset.l; D.langSet = true; saveD(); if (D.lang !== lang) { try { location.reload(); } catch (e) { toast('Reopen the app to apply'); } } else if (tutI < 0) { tutI = 0; drawTut(); } },
  tutRe: () => { tutI = 0; drawTut(); openSheet('sTut'); },
  tutN: () => { if (tutI >= GUIDE().length - 1) closeSheets(); else { tutI++; drawTut(); } },
  tutX: () => closeSheets(),
  tip: b => { tipA = +b.dataset.v; drawMx(); },
  cp: async b => { const v = b.dataset.fb ? fbMsg() : b.dataset.v; try { await navigator.clipboard.writeText(v); toast(t('คัดลอกแล้ว', 'Copied')); } catch (e) { toast(t('คัดลอกไม่ได้ กดค้างที่ข้อความเพื่อคัดลอก', 'Copy blocked: long-press the text')); } },
  fbGo: b => { b.href = 'sms:0949202250?&body=' + encodeURIComponent(fbMsg()); },
  errx: () => { $('errb').hidden = true; },
  ruAdd: () => { const n = $('run').value.trim(); if (n) { D.rules.push({ n, c: $('ruc').value, t: 'expense' }); saveD(); } drawRules(); },
  ruDel: b => { D.rules.splice(+b.dataset.i, 1); saveD(); drawRules(); },
  ntNo: b => { D.q = D.q.filter(x => x.id !== b.dataset.id); saveD(); drawNts(); render(); },
  sty: b => setType(b.dataset.t), md: b => setMode(b.dataset.m), cat: b => { cat = b.dataset.c; drawChips(); },
  pvDel: () => { photo = null; drawPhoto(); },
  q: b => {
    const n = new Date();
    const it = { id: uid(), type: b.dataset.t, amount: 0, cat: dc(b.dataset.t), date: ds(n), time: ts(n), note: '', photo: qp, pending: true, bk: D.cur, w: D.lw[D.cur] || (myW()[0] || {}).id }; items.push(it); readSlip(it);
    const ok = saveI(); closeSheets(); render(); toast(ok ? 'บันทึกรูปแล้ว เติมรายละเอียดทีหลังได้' : 'พื้นที่จัดเก็บเต็ม รูปอาจไม่ถูกบันทึกถาวร');
  },
  save: () => {
    const amount = parseFloat($('amount').value);
    if (!(amount > 0)) { $('msg').textContent = 'กรอกจำนวนเงินที่มากกว่า 0'; return; }
    let d = mode === 'custom' ? new Date($('dd').value + 'T' + ($('tt').value || '12:00')) : new Date(); if (isNaN(d)) d = new Date();
    const rec = { id: eid || uid(), type, amount, cat, date: ds(d), time: ts(d), note: $('note').value.trim(), bk: D.cur, w: wl, vat: !!(curBook().biz && $('vat').checked) };
    if (photo) rec.photo = photo;
    D.learn.push({ t: type, a: amount, c: cat }); D.learn = D.learn.slice(-300); if (wl) D.lw[D.cur] = wl; saveD();
    if (eid) items = items.map(x => x.id === eid ? rec : x); else items.push(rec);
    const ok = saveI(); closeSheets(); render(); if (!ok) toast('พื้นที่จัดเก็บเต็ม รายการนี้อาจไม่ถูกบันทึกถาวร');
  },
  del: () => { items = items.filter(i => i.id !== eid); saveI(); closeSheets(); render(); },
  fixAdd: () => { const n = $('fn').value.trim(), a = +$('fa').value; if (!n || !(a > 0)) return; PB().plan.fixed.push({ id: uid(), name: n, amt: a, per: $('fp').value }); saveD(); po = true; render(); },
  fixDel: b => { PB().plan.fixed = PB().plan.fixed.filter(f => f.id !== b.dataset.id); saveD(); po = true; render(); },
  gNew: () => { const n = $('gn').value.trim(), t = +$('gt').value; if (!n || !(t > 0)) return; PB().goals.push({ id: uid(), name: n, target: t, saved: 0 }); saveD(); render(); },
  gAdd: b => { const ins = b.closest('.g').querySelectorAll('input'), v = Math.abs(+ins[0].value) * +b.dataset.s, g = PB().goals.find(x => x.id === b.dataset.id); if (!v || !g) return; g.saved = Math.max(0, g.saved + v); (g.log = g.log || []).unshift({ d: ds(new Date()), a: v, w: ins[1].value.trim(), s: gslip[g.id] }); delete gslip[g.id]; saveD(); render(); },
  gDel: b => { PB().goals = PB().goals.filter(x => x.id !== b.dataset.id); saveD(); render(); },
  hr: b => { hs = { r: b.dataset.r, o: 0 }; render(); },
  hm: b => { hs.o += +b.dataset.d; render(); },
  cAdd: b => { const t = b.dataset.t, v = $('cn-' + t).value.trim(); if (v && !D.cats[t].includes(v)) { D.cats[t].push(v); saveD(); } drawCats(); },
  cDel: b => { const t = b.dataset.t; D.cats[t] = D.cats[t].filter(c => c !== b.dataset.c); saveD(); drawCats(); },
  th: b => applyTheme(b.dataset.th),
  exp: () => { $('backup').value = JSON.stringify({ items: items.map(x => { const y = { ...x }; delete y.photo; return y; }), D }); $('backup').select(); },
  imp: () => {
    try {
      const o = JSON.parse($('backup').value), arr = Array.isArray(o) ? o : o.items;
      if (!Array.isArray(arr)) throw 0;
      items = arr.filter(x => x && x.id && x.date && x.amount >= 0 && BASE[x.type]);
      if (!Array.isArray(o) && o.D) { D = { ...D, ...o.D }; saveD(); }
      saveI(); render(); $('backup').value = ''; $('msg2').textContent = 'นำเข้าข้อมูลแล้ว ' + items.length + ' รายการ';
    } catch (e) { $('msg2').textContent = 'ข้อมูลสำรองไม่ถูกต้อง ลองสร้างใหม่แล้ววางอีกครั้ง'; }
  }
};

document.addEventListener('click', e => {
  if (pmO && !e.target.closest('.pop,[data-a=pm]')) { pmO = false; render(); }
  const profileBtn = e.target.closest('[data-a="profile"]');
  if (profileBtn) {
    if ($('sProfile')) $('sProfile').classList.add('open');
    if ($('scrim')) $('scrim').classList.add('open');
    return;
  }
  const b = e.target.closest('[data-a]');
  if (b && A[b.dataset.a]) A[b.dataset.a](b, e);
});

document.addEventListener('change', e => {
  if (e.target.id === 'slipOK') { D.slipOK = e.target.checked; saveD(); }
  if (e.target.id === 'albIn') { const fl = [...e.target.files]; e.target.value = ''; readAlbum(fl); }
  if (e.target.id === 'dd') drawDch();
  const sl = e.target.dataset.sl; if (sl && e.target.files[0]) shrink(e.target.files[0], u => { gslip[sl] = u; toast('แนบสลิปแล้ว'); });
  const p = e.target.dataset.p; if (!p) return;
  PB().plan[p] = p === 'inc' ? Math.max(0, +e.target.value || 0) : e.target.value; saveD(); po = true; render();
});

document.querySelectorAll('[data-ic]').forEach(e => e.innerHTML = ic(e.dataset.ic));
let th0 = 'auto'; try { th0 = localStorage.getItem(TK) || 'auto'; } catch (e) {}
applyTheme(th0); setTab('home'); render();
trEl(document.body); setTimeout(() => { if ($('splash')) $('splash').classList.add('out'); }, 1700);
setTimeout(() => { if ($('splash')) $('splash').remove(); if (!D.seen) { tutI = D.langSet ? 0 : -1; drawTut(); openSheet('sTut'); } }, 2300);

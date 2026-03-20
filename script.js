/* ============================================================
   HILL MINER — Global Script
   ============================================================ */

/* ---- Toast Notifications ---- */
function showToast(msg, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ---- LocalStorage Helpers ---- */
const Store = {
  get: (k, def = null) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; }
  },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  remove: (k) => { try { localStorage.removeItem(k); } catch {} }
};

/* ---- Seed demo data if not present ---- */
function seedData() {
  if (!Store.get('hm_seeded')) {
    const users = [
      { id: 1, username: 'admin', email: 'admin@hillminer.com', password: 'admin123', role: 'admin',
        balance: 25000, totalDeposits: 50000, totalWithdrawals: 25000, referralEarnings: 3000,
        referralCode: 'ADMIN01', referredBy: null, referrals: 3, joinDate: '2025-01-01', blocked: false, ip: '127.0.0.1' },
      { id: 2, username: 'john_doe', email: 'john@example.com', password: 'pass123', role: 'user',
        balance: 8500, totalDeposits: 10000, totalWithdrawals: 1500, referralEarnings: 1200,
        referralCode: 'JOHN02', referredBy: 'ADMIN01', referrals: 2, joinDate: '2025-03-15', blocked: false, ip: '192.168.1.1' },
      { id: 3, username: 'sara_k', email: 'sara@example.com', password: 'pass456', role: 'user',
        balance: 3200, totalDeposits: 5000, totalWithdrawals: 1800, referralEarnings: 600,
        referralCode: 'SARA03', referredBy: 'JOHN02', referrals: 1, joinDate: '2025-04-10', blocked: false, ip: '192.168.1.2' }
    ];
    const deposits = [
      { id: 1, userId: 2, username: 'john_doe', amount: 5000, method: 'bank', ref: 'TXN001', date: '2025-05-01', status: 'approved' },
      { id: 2, userId: 2, username: 'john_doe', amount: 5000, method: 'bank', ref: 'TXN002', date: '2025-05-10', status: 'approved' },
      { id: 3, userId: 3, username: 'sara_k',   amount: 5000, method: 'bank', ref: 'TXN003', date: '2025-05-12', status: 'pending' }
    ];
    const withdrawals = [
      { id: 1, userId: 2, username: 'john_doe', amount: 1500, bank: 'Commercial Bank', accNo: '1234567890', holder: 'John Doe', date: '2025-05-15', status: 'approved' },
      { id: 2, userId: 3, username: 'sara_k',   amount: 1800, bank: 'Peoples Bank',    accNo: '9876543210', holder: 'Sara K',   date: '2025-05-16', status: 'pending' }
    ];
    Store.set('hm_users', users);
    Store.set('hm_deposits', deposits);
    Store.set('hm_withdrawals', withdrawals);
    Store.set('hm_next_uid', 4);
    Store.set('hm_seeded', true);
  }
}
seedData();

/* ---- Auth Helpers ---- */
function getCurrentUser() {
  const id = Store.get('hm_current_user');
  if (!id) return null;
  const users = Store.get('hm_users', []);
  return users.find(u => u.id === id) || null;
}
function requireAuth(redirectTo = 'login.html') {
  const u = getCurrentUser();
  if (!u) { window.location.href = redirectTo; return null; }
  return u;
}
function requireAdmin() {
  const u = requireAuth('login.html');
  if (u && u.role !== 'admin') { window.location.href = 'dashboard.html'; return null; }
  return u;
}
function logout() {
  Store.remove('hm_current_user');
  window.location.href = 'index.html';
}
function updateUser(updated) {
  const users = Store.get('hm_users', []);
  const idx = users.findIndex(u => u.id === updated.id);
  if (idx !== -1) { users[idx] = updated; Store.set('hm_users', users); }
}

/* ---- Animated Counter ---- */
function animateCounter(el, target, duration = 1500, prefix = '', suffix = '') {
  const start = 0;
  const step = target / (duration / 16);
  let current = start;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = prefix + Math.floor(current).toLocaleString() + suffix;
  }, 16);
}

/* ---- Intersection Observer for counters ---- */
function initCounters() {
  const els = document.querySelectorAll('[data-counter]');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = parseFloat(el.dataset.counter);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        animateCounter(el, target, 1500, prefix, suffix);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  els.forEach(el => obs.observe(el));
}

/* ---- Hamburger Menu ---- */
function initHamburger() {
  const btn = document.querySelector('.hamburger');
  const links = document.querySelector('.nav-links');
  if (!btn || !links) return;
  btn.addEventListener('click', () => links.classList.toggle('open'));
}

/* ---- Sidebar Toggle (mobile) ---- */
function initSidebar() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (!toggle || !sidebar) return;
  toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && e.target !== toggle) sidebar.classList.remove('open');
  });
}

/* ---- Form Validation ---- */
function validateField(input, rules) {
  const val = input.value.trim();
  const errEl = input.parentElement.querySelector('.error-msg');
  let msg = '';
  if (rules.required && !val) msg = 'This field is required.';
  else if (rules.minLen && val.length < rules.minLen) msg = `Minimum ${rules.minLen} characters.`;
  else if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) msg = 'Enter a valid email address.';
  else if (rules.match && val !== document.getElementById(rules.match).value) msg = 'Passwords do not match.';
  else if (rules.min && parseFloat(val) < rules.min) msg = `Minimum value is ${rules.min}.`;
  if (msg) {
    input.classList.add('error');
    if (errEl) { errEl.textContent = msg; errEl.classList.add('show'); }
    return false;
  } else {
    input.classList.remove('error');
    if (errEl) errEl.classList.remove('show');
    return true;
  }
}

/* ---- Copy to Clipboard ---- */
function copyToClipboard(text, label = 'Copied!') {
  navigator.clipboard.writeText(text).then(() => showToast(label, 'success')).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    showToast(label, 'success');
  });
}

/* ---- Format Currency ---- */
function fmtLKR(n) { return 'LKR ' + Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 }); }

/* ---- Get URL Param ---- */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ---- Mining Simulation ---- */
const MINING_RATE_PER_LKR_PER_DAY = 0.005; // 0.5% daily
function getDailyEarnings(balance) {
  return balance * MINING_RATE_PER_LKR_PER_DAY;
}

/* ---- Withdraw time check ---- */
function isWithdrawTime() {
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes();
  const mins = h * 60 + m;
  return mins >= 600 && mins <= 1200; // 10:00 - 20:00
}

/* ---- Init on DOM ready ---- */
document.addEventListener('DOMContentLoaded', () => {
  initCounters();
  initHamburger();
  initSidebar();
});

// utils.js — formatting helpers, badge colour helpers, misc utilities.

const Utils = (() => {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function todayISO() {
    const d = new Date();
    return toISO(d);
  }

  function toISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // "2026-08-11" -> "11 Aug 2026"
  function formatDate(iso) {
    if (!iso) return '—';
    const parts = String(iso).slice(0, 10).split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return String(iso);
    const [y, m, d] = parts;
    return `${d} ${MONTHS[m - 1]} ${y}`;
  }

  // South Asian (lakh/crore) grouping: 150000 -> "1,50,000"
  function formatBDT(amount) {
    const n = Math.round(Number(amount) || 0);
    const sign = n < 0 ? '-' : '';
    const s = String(Math.abs(n));
    if (s.length <= 3) return `${sign}BDT ${s}`;
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3);
    const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return `${sign}BDT ${grouped},${last3}`;
  }

  function formatNumber(n) {
    return (Number(n) || 0).toLocaleString('en-IN');
  }

  // Days between an ISO date and today (positive = in the past).
  function daysSince(iso) {
    if (!iso) return null;
    const past = new Date(String(iso).slice(0, 10) + 'T00:00:00');
    const now = new Date(todayISO() + 'T00:00:00');
    return Math.round((now - past) / 86400000);
  }

  function daysUntil(iso) {
    if (!iso) return null;
    const future = new Date(String(iso).slice(0, 10) + 'T00:00:00');
    const now = new Date(todayISO() + 'T00:00:00');
    return Math.round((future - now) / 86400000);
  }

  function isValidBDPhone(v) {
    return /^01[0-9]{9}$/.test(String(v).trim());
  }

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
  }

  // Timestamp (ISO datetime) to a friendly "3h ago" / "2d ago" label.
  function timeAgo(isoDateTime) {
    if (!isoDateTime) return '—';
    const then = new Date(isoDateTime).getTime();
    if (isNaN(then)) return '—';
    const diffMs = Date.now() - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  function hoursSince(isoDateTime) {
    if (!isoDateTime) return null;
    const then = new Date(isoDateTime).getTime();
    if (isNaN(then)) return null;
    return Math.floor((Date.now() - then) / 3600000);
  }

  // "days untouched" tone: 0-2 ok, 3-6 amber, 7+ red
  function ageTone(days) {
    if (days == null) return 'gray';
    if (days >= 7) return 'red';
    if (days >= 3) return 'amber';
    return 'green';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Build an HTML element.
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function cx(...parts) {
    return parts.filter(Boolean).join(' ');
  }

  function textMatch(obj, q, fields) {
    const needle = String(q || '').toLowerCase();
    if (!needle) return true;
    return fields.some(function (f) {
      return String(obj[f] == null ? '' : obj[f]).toLowerCase().indexOf(needle) !== -1;
    });
  }

  return {
    MONTHS,
    todayISO,
    toISO,
    formatDate,
    formatBDT,
    formatNumber,
    daysSince,
    daysUntil,
    isValidBDPhone,
    isValidEmail,
    timeAgo,
    hoursSince,
    ageTone,
    esc,
    el,
    debounce,
    cx,
    textMatch
  };
})();

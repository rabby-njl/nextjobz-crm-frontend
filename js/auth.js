// auth.js — real authentication. Employees sign in with their Enroll ID
// (username = Enroll ID, password = Enroll ID). The backend issues a Bearer
// token; the employee's CRM role drives their personalized dashboard.

const Auth = (() => {
  const STORAGE_KEY = 'njz_crm_session';

  const ROLES = [
    { id: 'super_admin',       label: 'Super Admin (CBO)' },
    { id: 'admin',             label: 'Admin (Operations)' },
    { id: 'sales_head',        label: 'Sales Head' },
    { id: 'sales_officer',     label: 'Sales Officer' },
    { id: 'crm_lead',          label: 'CRM Lead' },
    { id: 'crm_officer',       label: 'CRM Officer' },
    { id: 'marketing_officer', label: 'Marketing Officer' },
    { id: 'headhunting_mgr',   label: 'Headhunting Manager' },
    { id: 'recruiter',         label: 'Recruiter' },
    { id: 'business_development', label: 'Business Development' },
    { id: 'payroll_officer',   label: 'Payroll Officer' },
    { id: 'events_officer',    label: 'Events Officer' },
    { id: 'training_mgr',      label: 'Training & Development Manager' },
    { id: 'training_officer',  label: 'Training Officer' },
    { id: 'management',        label: 'Management (Read Only)' }
  ];

  // Which roles can open each screen. super_admin/admin are granted everything.
  const ACCESS = {
    dashboard:         ['sales_head', 'sales_officer', 'crm_lead', 'crm_officer', 'marketing_officer', 'headhunting_mgr', 'recruiter', 'business_development', 'payroll_officer', 'events_officer', 'management'],
    leads:             ['sales_head', 'sales_officer', 'crm_lead', 'crm_officer', 'marketing_officer', 'headhunting_mgr', 'recruiter', 'business_development', 'events_officer', 'management'],
    employers:         ['sales_head', 'sales_officer', 'crm_lead', 'business_development', 'management'],
    contacts:          ['sales_head', 'sales_officer', 'crm_lead', 'business_development', 'management'],
    deals:             ['sales_head', 'sales_officer', 'business_development', 'management'],
    sales:             ['sales_head', 'sales_officer', 'crm_lead', 'business_development', 'management'],
    collections:       ['sales_head', 'sales_officer', 'business_development', 'management'],
    visits:            ['sales_head', 'sales_officer', 'business_development', 'management'],
    'daily-report':    ['sales_head', 'sales_officer', 'management'],
    queries:           ['crm_lead', 'crm_officer', 'management'],
    'jobseeker-support': ['crm_lead', 'crm_officer', 'management'],
    requirements:      ['headhunting_mgr', 'recruiter', 'business_development', 'management'],
    proposals:         ['headhunting_mgr', 'recruiter', 'business_development', 'management'],
    payroll:           ['payroll_officer'],
    campaigns:         ['marketing_officer', 'management'],
    vendors:           ['marketing_officer', 'management'],
    events:            ['events_officer', 'crm_lead', 'management'],
    trainings:         ['training_mgr', 'training_officer', 'management'],
    targets:           ['sales_head', 'sales_officer', 'business_development', 'management'],
    reports:           ['sales_head', 'management']
  };

  function getSession() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
  }
  function setSession(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
  }
  function clearSession() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  }

  function isLoggedIn() {
    const s = getSession();
    return !!(s && s.token);
  }

  function employee() {
    const s = getSession();
    return s ? s.employee : null;
  }

  function token() {
    const s = getSession();
    return s ? s.token : null;
  }

  function role() {
    const e = employee();
    return e ? e.role : null;
  }

  function getRole() {
    return role();
  }

  function userName() {
    const e = employee();
    return e ? e.name : null;
  }

  function roleLabel(id) {
    const r = ROLES.find((x) => x.id === id);
    return r ? r.label : (id || '');
  }

  function canAccess(screenId) {
    const r = role();
    if (!r) return false;
    if (r === 'super_admin' || r === 'admin') return true;
    const allowed = ACCESS[screenId];
    if (!allowed) return false;
    return allowed.includes(r);
  }

  function isManager() {
    const r = role();
    return ['super_admin', 'admin', 'sales_head', 'crm_lead', 'headhunting_mgr'].includes(r);
  }

  function initials(name) {
    name = String(name || '');
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  /* ---------------- Employee directory (for name + Enroll ID dropdowns) ---------------- */

  let directory = [];

  async function loadEmployees() {
    try {
      const list = await api.employees.list();
      directory = Array.isArray(list) ? list : [];
    } catch (e) {
      directory = [];
    }
    return directory;
  }

  function employees() {
    return directory.slice();
  }

  function empLabel(e) {
    return e.name + ' (' + e.enrollId + ')';
  }

  function byRoles(roles) {
    return directory.filter((e) => roles.includes(e.role)).map(empLabel);
  }

  function allOfficers() {
    return directory.map(empLabel);
  }

  function salesOfficers() {
    return byRoles(['sales_officer', 'sales_head']);
  }

  function crmOfficers() {
    return byRoles(['crm_officer', 'crm_lead']);
  }

  function recruiters() {
    return byRoles(['recruiter', 'headhunting_mgr', 'business_development']);
  }

  function eventsOfficers() {
    return byRoles(['events_officer']);
  }

  function payrollOfficers() {
    return byRoles(['payroll_officer']);
  }

  async function login(username, password) {
    const res = await fetch(CONFIG.API_BASE_URL + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: String(username || '').trim(), password: String(password || '') })
    });
    if (!res.ok) {
      let msg = 'Invalid Enroll ID or password.';
      try { const j = await res.json(); if (j && j.error) msg = j.error; } catch (e) { /* ignore */ }
      throw new Error(msg);
    }
    const data = await res.json();
    setSession({ token: data.token, employee: data.employee });
    return data.employee;
  }

  function logout() {
    clearSession();
  }

  return {
    ROLES,
    getRole,
    roleLabel,
    canAccess,
    userName,
    isManager,
    initials,
    login,
    logout,
    isLoggedIn,
    employee,
    token,
    role,
    loadEmployees,
    employees,
    allOfficers,
    salesOfficers,
    crmOfficers,
    recruiters,
    eventsOfficers,
    payrollOfficers
  };
})();

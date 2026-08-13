// auth.js — demo role switching only. No real security (that's Phase 2).

const Auth = (() => {
  const STORAGE_KEY = 'njz_crm_role';

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
    { id: 'payroll_officer',   label: 'Payroll Officer' },
    { id: 'events_officer',    label: 'Events Officer' },
    { id: 'management',        label: 'Management (Read Only)' }
  ];

  // Which roles can open each screen (screen id -> allowed roles).
  // super_admin and admin are granted everything by canAccess() below.
  const ACCESS = {
    dashboard:         ['sales_head', 'sales_officer', 'crm_lead', 'crm_officer', 'marketing_officer', 'headhunting_mgr', 'recruiter', 'payroll_officer', 'events_officer', 'management'],
    leads:             ['sales_head', 'sales_officer', 'crm_lead', 'crm_officer', 'marketing_officer', 'headhunting_mgr', 'recruiter', 'events_officer', 'management'],
    employers:         ['sales_head', 'sales_officer', 'crm_lead', 'management'],
    contacts:          ['sales_head', 'sales_officer', 'crm_lead', 'management'],
    deals:             ['sales_head', 'sales_officer', 'management'],
    sales:             ['sales_head', 'sales_officer', 'crm_lead', 'management'],
    collections:       ['sales_head', 'sales_officer', 'management'],
    visits:            ['sales_head', 'sales_officer', 'management'],
    'daily-report':    ['sales_head', 'sales_officer', 'management'],
    queries:           ['crm_lead', 'crm_officer', 'management'],
    'jobseeker-support': ['crm_lead', 'crm_officer', 'management'],
    requirements:      ['headhunting_mgr', 'recruiter', 'management'],
    proposals:         ['headhunting_mgr', 'recruiter', 'management'],
    payroll:           ['payroll_officer'],
    campaigns:         ['marketing_officer', 'management'],
    vendors:           ['marketing_officer', 'management'],
    events:            ['events_officer', 'crm_lead', 'management'],
    targets:           ['sales_head', 'sales_officer', 'management'],
    reports:           ['sales_head', 'management']
  };

  function getRole() {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'super_admin';
    } catch (e) {
      return 'super_admin';
    }
  }

  function setRole(id) {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch (e) {
      /* ignore */
    }
  }

  function roleLabel(id) {
    const r = ROLES.find((x) => x.id === id);
    return r ? r.label : id;
  }

  function canAccess(screenId) {
    const role = getRole();
    if (role === 'super_admin' || role === 'admin') return true;
    const allowed = ACCESS[screenId];
    if (!allowed) return false;
    return allowed.includes(role);
  }

  // Demo user mapping: which person the current role "is", used for "My Leads" filtering.
  const USER_BY_ROLE = {
    super_admin: null,
    admin: null,
    sales_head: null,
    sales_officer: 'Officer One',
    crm_lead: null,
    crm_officer: 'Officer Five',
    marketing_officer: 'Marketing One',
    headhunting_mgr: null,
    recruiter: 'Recruiter One',
    payroll_officer: 'Payroll One',
    events_officer: 'Events One',
    management: null
  };

  function userName() {
    return USER_BY_ROLE[getRole()] || null;
  }

  function isManager() {
    const r = getRole();
    return r === 'super_admin' || r === 'admin' || r === 'sales_head' || r === 'crm_lead' || r === 'headhunting_mgr';
  }

  function initials(id) {
    return id.split('_').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  }

  return {
    ROLES,
    getRole,
    setRole,
    roleLabel,
    canAccess,
    userName,
    isManager,
    initials
  };
})();

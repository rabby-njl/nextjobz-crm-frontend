// api.js — THE ONLY data layer. Pages call api.*; nothing else touches storage.
// Mock now (localStorage seeded from mock-data.js), REST later via CONFIG.API_MODE.

const api = (() => {
  const DB_KEY = 'njz_crm_db_v1';
  const ENTITY_NAMES = [
    'employers', 'leads', 'deals', 'visits', 'orders',
    'collections', 'queries', 'campaigns', 'requirements', 'payrollClients', 'contacts', 'dailyReports',
    'jobseekerSupports', 'proposals', 'vendors', 'events', 'targets', 'trainings'
  ];

  const PREFIX = {
    employers: 'EMP', leads: 'LEAD', deals: 'DEAL', visits: 'VISIT', orders: 'ORD',
    collections: 'INV', queries: 'Q', campaigns: 'CAMP', requirements: 'REQ', payrollClients: 'PAY',
    contacts: 'CONT', dailyReports: 'REPORT', jobseekerSupports: 'JS', proposals: 'PROP',
    vendors: 'VEND', events: 'EVENT', targets: 'TGT', trainings: 'TRN'
  };

  function delay(ms) {
    ms = ms || 200;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function clone(x) {
    return JSON.parse(JSON.stringify(x));
  }

  function loadDB() {
    let db = null;
    try {
      db = JSON.parse(localStorage.getItem(DB_KEY));
    } catch (e) {
      db = null;
    }
    if (!db) {
      db = seedDB();
    }
    return db;
  }

  function seedDB() {
    const db = {};
    ENTITY_NAMES.forEach((name) => {
      db[name] = window.MOCK_DATA && window.MOCK_DATA[name] ? clone(window.MOCK_DATA[name]) : [];
    });
    saveDB(db);
    return db;
  }

  function saveDB(db) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
      /* storage full or blocked — ignore for demo */
    }
  }

  function nextId(name, items) {
    const prefix = PREFIX[name] || 'ID';
    let max = 0;
    items.forEach((it) => {
      const m = String(it.id).match(/(\d+)$/);
      if (m) max = Math.max(max, Number(m[1]));
    });
    return prefix + '-' + String(max + 1).padStart(3, '0');
  }

  // ---- live (REST) branch ----
  function authHeaders(extra) {
    const h = Object.assign({}, extra || {});
    let t = null;
    try { t = (typeof Auth !== 'undefined' && Auth.token) ? Auth.token() : null; } catch (e) { t = null; }
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  }

  function live(path, opts) {
    opts = opts || {};
    opts.headers = authHeaders(opts.headers);
    return fetch(CONFIG.API_BASE_URL + path, opts).then((r) => {
      if (!r.ok) throw new Error('Request failed ' + r.status);
      return r.json();
    });
  }

  function liveJSON(path, method, body) {
    return live(path, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
  }

  // ---- mock filter helper ----
  function applyFilters(items, filters) {
    if (!filters) return items;
    let out = items.slice();
    Object.keys(filters).forEach((key) => {
      const val = filters[key];
      if (val === undefined || val === null || val === '') return;

      if (key === 'q' && typeof val === 'string') {
        const q = val.toLowerCase();
        out = out.filter((it) => {
          const hay = Object.values(it).join(' ').toLowerCase();
          return hay.includes(q);
        });
        return;
      }

      out = out.filter((it) => {
        const v = it[key];
        if (Array.isArray(v)) return v.includes(val);
        if (Array.isArray(val)) return val.includes(v);
        return v === val;
      });
    });
    return out;
  }

  function makeEntity(name) {
    const base = '/api/' + name;

    return {
      list(filters) {
        filters = filters || {};
        if (CONFIG.API_MODE === 'live') {
          const qs = new URLSearchParams(filters).toString();
          return live(base + (qs ? '?' + qs : ''));
        }
        return delay().then(() => {
          const db = loadDB();
          return applyFilters(db[name] || [], filters);
        });
      },

      get(id) {
        if (CONFIG.API_MODE === 'live') {
          return live(base + '/' + encodeURIComponent(id));
        }
        return delay().then(() => {
          const db = loadDB();
          const found = (db[name] || []).find((x) => x.id === id);
          return found ? clone(found) : null;
        });
      },

      create(data) {
        if (CONFIG.API_MODE === 'live') {
          return liveJSON(base, 'POST', data);
        }
        return delay().then(() => {
          const db = loadDB();
          const item = clone(data || {});
          item.id = nextId(name, db[name] || []);
          db[name].push(item);
          saveDB(db);
          return clone(item);
        });
      },

      update(id, data) {
        if (CONFIG.API_MODE === 'live') {
          return liveJSON(base + '/' + encodeURIComponent(id), 'PUT', data);
        }
        return delay().then(() => {
          const db = loadDB();
          const list = db[name] || [];
          const idx = list.findIndex((x) => x.id === id);
          if (idx === -1) return null;
          list[idx] = Object.assign({}, list[idx], data, { id: id });
          saveDB(db);
          return clone(list[idx]);
        });
      },

      remove(id) {
        if (CONFIG.API_MODE === 'live') {
          return live(base + '/' + encodeURIComponent(id), { method: 'DELETE' });
        }
        return delay().then(() => {
          const db = loadDB();
          db[name] = (db[name] || []).filter((x) => x.id !== id);
          saveDB(db);
          return { ok: true };
        });
      }
    };
  }

  const out = {};
  ENTITY_NAMES.forEach((name) => {
    out[name] = makeEntity(name);
  });

  // handy flag for pages
  out.isMock = function () {
    return CONFIG.API_MODE !== 'live';
  };

  return out;
})();

// components.js — reusable UI builders + the app shell (sidebar, topbar, mobile nav).

const Components = (() => {
  /* ---------------- Icons (inline SVG) ---------------- */
  const ICONS = {
    dot: '<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>',
    search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/>',
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    leads: '<path d="M3 5h18M7 12h10M10 19h4"/>',
    employers: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 21v-6h6v6"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01"/>',
    contacts: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    deals: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    sales: '<path d="M20 13l-7 7-9-9V4h7l9 9z"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>',
    collections: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
    visits: '<path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    report: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 9h6M9 13h6M9 17h4"/>',
    queries: '<path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/>',
    support: '<path d="M4 13a8 8 0 0 1 16 0"/><rect x="3" y="13" width="4" height="6" rx="1"/><rect x="17" y="13" width="4" height="6" rx="1"/><path d="M20 19a3 3 0 0 1-3 3h-3"/>',
    requirements: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
    proposals: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    payroll: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    campaigns: '<path d="M3 11v3l3 1v-5z"/><path d="M6 10v5a2 2 0 0 0 2 2h1l8-4v-5l-8-4h-1a2 2 0 0 0-2 2z"/>',
    vendors: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    events: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    targets: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    reports: '<path d="M3 21h18M7 17V9M12 17V5M17 17v-4"/>'
  };

  function svg(name, size) {
    size = size || 20;
    const body = ICONS[name] || ICONS.dot;
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  function icon(name, size) {
    const span = Utils.el('span', 'nav-icon');
    span.innerHTML = svg(name, size);
    return span;
  }

  /* ---------------- Small builders ---------------- */

  function badge(tone, text) {
    const span = Utils.el('span', 'badge badge--' + (tone || 'gray'));
    span.textContent = text;
    return span;
  }

  function notice(tone, html) {
    const div = Utils.el('div', 'notice notice--' + (tone || 'purple'));
    div.innerHTML = html;
    return div;
  }

  function kpiCard(opts) {
    const div = Utils.el('div', 'kpi' + (opts.tone ? ' kpi--' + opts.tone : ''));
    div.appendChild(Utils.el('div', 'kpi-value', opts.value));
    div.appendChild(Utils.el('div', 'kpi-label', opts.label));
    if (opts.sub) div.appendChild(Utils.el('div', 'kpi-sub', opts.sub));
    return div;
  }

  function kpiGrid(items) {
    const grid = Utils.el('div', 'kpi-grid');
    items.forEach((it) => grid.appendChild(kpiCard(it)));
    return grid;
  }

  function card(opts) {
    const div = Utils.el('div', 'card');
    if (opts.title) {
      const head = Utils.el('div', 'card-head');
      const left = Utils.el('div');
      left.appendChild(Utils.el('div', 'card-title', opts.title));
      if (opts.sub) left.appendChild(Utils.el('div', 'card-sub', opts.sub));
      head.appendChild(left);
      if (opts.actions) {
        const right = Utils.el('div', 'toolbar-right');
        (opts.actions || []).forEach((a) => right.appendChild(a));
        head.appendChild(right);
      }
      div.appendChild(head);
    }
    if (opts.body) div.appendChild(opts.body);
    return div;
  }

  function emptyState(opts) {
    const div = Utils.el('div', 'empty');
    if (opts.icon) {
      const ic = Utils.el('div', 'empty-icon');
      ic.innerHTML = svg(opts.icon, 48);
      div.appendChild(ic);
    }
    div.appendChild(Utils.el('div', 'empty-title', opts.title || 'Nothing here yet'));
    if (opts.text) div.appendChild(Utils.el('div', 'empty-text', opts.text));
    if (opts.actionLabel) {
      const b = Utils.el('button', 'btn btn--primary', opts.actionLabel);
      b.addEventListener('click', opts.onAction || function () {});
      div.appendChild(b);
    }
    return div;
  }

  function searchBox(opts) {
    const wrap = Utils.el('div', 'search-inline');
    const input = Utils.el('input');
    input.type = 'text';
    input.placeholder = opts.placeholder || 'Search…';
    const ico = Utils.el('span', 'search-ico');
    ico.innerHTML = svg('search', 16);
    wrap.appendChild(ico);
    wrap.appendChild(input);
    if (opts.onInput) input.addEventListener('input', Utils.debounce(opts.onInput, 250));
    return wrap;
  }

  function chips(opts) {
    const bar = Utils.el('div', 'filter-bar');
    let active = opts.active || null;
    const items = opts.items || [];
    const render = () => {
      bar.innerHTML = '';
      items.forEach((it) => {
        const c = Utils.el('button', 'chip' + (active === it.key ? ' active' : ''), it.label);
        c.addEventListener('click', () => {
          active = it.key;
          render();
          if (opts.onSelect) opts.onSelect(it.key);
        });
        bar.appendChild(c);
      });
    };
    render();
    return bar;
  }

  function searchableSelect(options, current, placeholder) {
    options = options || [];
    let value = current || '';
    const wrap = Utils.el('div', 'ss-wrap');
    const input = Utils.el('input');
    input.type = 'text';
    input.placeholder = placeholder || 'Type to search…';
    input.value = value;
    const list = Utils.el('div', 'ss-list');
    list.style.display = 'none';

    function renderList(filter) {
      list.innerHTML = '';
      const q = (filter || '').toLowerCase();
      const matches = options.filter((o) => o.toLowerCase().includes(q));
      matches.slice(0, 50).forEach((o) => {
        const item = Utils.el('div', 'ss-item', o);
        item.addEventListener('click', () => {
          value = o;
          input.value = o;
          list.style.display = 'none';
        });
        list.appendChild(item);
      });
      list.style.display = 'block';
    }

    input.addEventListener('focus', () => renderList(input.value));
    input.addEventListener('input', () => renderList(input.value));
    input.addEventListener('blur', () => setTimeout(() => { list.style.display = 'none'; }, 150));

    wrap.appendChild(input);
    wrap.appendChild(list);
    return {
      el: wrap,
      getValue: () => value,
      setValue: (v) => { value = v || ''; input.value = value; }
    };
  }

  function numberInput(val, placeholder) {
    const inp = Utils.el('input');
    inp.type = 'number';
    inp.min = '0';
    inp.step = 'any';
    inp.value = val != null ? val : '';
    inp.placeholder = placeholder || '';
    return inp;
  }

  function dateInput(val) {
    const inp = Utils.el('input');
    inp.type = 'date';
    inp.value = val || '';
    return inp;
  }

  function pageHead(opts) {
    const head = Utils.el('div', 'page-head');
    const left = Utils.el('div');
    left.appendChild(Utils.el('h1', 'page-title', opts.title));
    if (opts.desc) left.appendChild(Utils.el('div', 'page-desc', opts.desc));
    const right = Utils.el('div', 'toolbar-right');
    (opts.actions || []).forEach((a) => right.appendChild(a));
    head.appendChild(left);
    head.appendChild(right);
    return head;
  }

  function skeleton(rows) {
    rows = rows || 4;
    const div = Utils.el('div', '');
    for (let i = 0; i < rows; i++) {
      const r = Utils.el('div', 'skeleton');
      r.style.marginBottom = '12px';
      r.style.height = (16 + (i % 3) * 4) + 'px';
      div.appendChild(r);
    }
    return div;
  }

  /* ---------------- Data table ---------------- */

  function table(opts) {
    const columns = opts.columns || [];
    const rows = opts.rows || [];
    const empty = opts.empty || {};
    const container = Utils.el('div', '');
    const wrap = Utils.el('div', 'table-wrap');
    const tableEl = Utils.el('table', 'data-table');
    let sortKey = null;
    let sortDir = 1;

    function val(nodeOrText, cell) {
      if (nodeOrText instanceof Node) cell.appendChild(nodeOrText);
      else if (nodeOrText != null) cell.textContent = nodeOrText;
      return cell;
    }

    function sortedRows() {
      const arr = rows.slice();
      if (sortKey) {
        const col = columns.find((c) => c.key === sortKey);
        arr.sort((a, b) => {
          let va, vb;
          if (col && col.sortValue) { va = col.sortValue(a); vb = col.sortValue(b); }
          else { va = a[sortKey]; vb = b[sortKey]; }
          if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sortDir;
          return String(va == null ? '' : va).localeCompare(String(vb == null ? '' : vb)) * sortDir;
        });
      }
      return arr;
    }

    function render() {
      tableEl.innerHTML = '';
      const thead = Utils.el('thead');
      const tr = Utils.el('tr');
      columns.forEach((col) => {
        const th = Utils.el('th');
        th.textContent = col.label;
        if (col.sortable !== false) {
          th.style.cursor = 'pointer';
          th.addEventListener('click', () => {
            if (sortKey === col.key) sortDir *= -1;
            else { sortKey = col.key; sortDir = 1; }
            renderAll();
          });
        }
        if (sortKey === col.key) {
          th.appendChild(Utils.el('span', 'sort-arrow', sortDir === 1 ? '▲' : '▼'));
        }
        tr.appendChild(th);
      });
      thead.appendChild(tr);
      tableEl.appendChild(thead);

      const tbody = Utils.el('tbody');
      const arr = sortedRows();
      if (!arr.length) {
        const tr2 = Utils.el('tr');
        const td = Utils.el('td');
        td.colSpan = columns.length;
        td.appendChild(emptyState(empty));
        tr2.appendChild(td);
        tbody.appendChild(tr2);
      } else {
        arr.forEach((row) => {
          const tr2 = Utils.el('tr', opts.rowClass ? opts.rowClass(row) : '');
          columns.forEach((col) => {
            const td = Utils.el('td');
            const rendered = col.render ? col.render(row) : row[col.key];
            val(rendered, td);
            tr2.appendChild(td);
          });
          tbody.appendChild(tr2);
        });
      }
      tableEl.appendChild(tbody);
    }

    function renderStacked() {
      const stack = Utils.el('div', 'stacked-list');
      const arr = sortedRows();
      if (!arr.length) {
        stack.appendChild(emptyState(empty));
      } else {
        arr.forEach((row) => {
          const cardEl = Utils.el('div', 'stacked-card' + (opts.rowClass ? ' ' + opts.rowClass(row) : ''));
          columns.forEach((col) => {
            const rowDiv = Utils.el('div', 'stacked-row');
            rowDiv.appendChild(Utils.el('span', 'lbl', col.label));
            const valEl = Utils.el('span', 'val');
            const rendered = col.render ? col.render(row) : row[col.key];
            val(rendered, valEl);
            rowDiv.appendChild(valEl);
            cardEl.appendChild(rowDiv);
          });
          stack.appendChild(cardEl);
        });
      }
      return stack;
    }

    function renderAll() {
      wrap.innerHTML = '';
      wrap.appendChild(tableEl);
      container.innerHTML = '';
      container.appendChild(wrap);
      container.appendChild(renderStacked());
      render();
    }

    renderAll();
    return container;
  }

  /* ---------------- Modal ---------------- */

  function modal(opts) {
    const root = document.getElementById('modal-root');
    const backdrop = Utils.el('div', 'modal-backdrop');
    const box = Utils.el('div', 'modal');
    const head = Utils.el('div', 'modal-head');
    head.appendChild(Utils.el('div', 'modal-title', opts.title || ''));
    const closeBtn = Utils.el('button', 'modal-close', '\u00d7');
    closeBtn.type = 'button';
    head.appendChild(closeBtn);
    const body = Utils.el('div', 'modal-body');
    if (opts.body) body.appendChild(opts.body);
    box.appendChild(head);
    box.appendChild(body);

    if (opts.actions && opts.actions.length) {
      const foot = Utils.el('div', 'modal-foot');
      opts.actions.forEach((a) => {
        const b = Utils.el('button', 'btn ' + (a.class || 'btn--secondary'), a.label);
        b.type = 'button';
        b.addEventListener('click', () => { if (a.onClick) a.onClick(close); });
        foot.appendChild(b);
      });
      box.appendChild(foot);
    }

    backdrop.appendChild(box);

    function close() {
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    root.appendChild(backdrop);
    return { close: close, el: box };
  }

  /* ---------------- Toast ---------------- */

  function toast(message, tone) {
    tone = tone || 'info';
    const root = document.getElementById('toast-root');
    const t = Utils.el('div', 'toast toast--' + tone, message);
    root.appendChild(t);
    setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 3200);
  }

  /* ---------------- Navigation config ---------------- */

  const NAV = [
    {
      title: 'Overview',
      items: [{ id: 'dashboard', label: 'Dashboard', hash: '#/', icon: 'dashboard' }]
    },
    {
      title: 'Sales',
      items: [
        { id: 'leads', label: 'Leads', hash: '#/leads', icon: 'leads' },
        { id: 'employers', label: 'Employers', hash: '#/employers', icon: 'employers' },
        { id: 'contacts', label: 'Contacts', hash: '#/contacts', icon: 'contacts' },
        { id: 'deals', label: 'Deals', hash: '#/deals', icon: 'deals' },
        { id: 'sales', label: 'Package Sales', hash: '#/sales', icon: 'sales' },
        { id: 'collections', label: 'Collections', hash: '#/collections', icon: 'collections' },
        { id: 'visits', label: 'Visits', hash: '#/visits', icon: 'visits' },
        { id: 'daily-report', label: 'Daily Report', hash: '#/daily-report', icon: 'report' }
      ]
    },
    {
      title: 'CRM',
      items: [
        { id: 'queries', label: 'Query Inbox', hash: '#/queries', icon: 'queries' },
        { id: 'jobseeker-support', label: 'Job Seeker Support', hash: '#/jobseeker-support', icon: 'support' }
      ]
    },
    {
      title: 'Headhunting & Payroll',
      items: [
        { id: 'requirements', label: 'Requirements', hash: '#/requirements', icon: 'requirements' },
        { id: 'proposals', label: 'Proposals', hash: '#/proposals', icon: 'proposals' },
        { id: 'payroll', label: 'Payroll', hash: '#/payroll', icon: 'payroll' }
      ]
    },
    {
      title: 'Marketing & Events',
      items: [
        { id: 'campaigns', label: 'Campaigns', hash: '#/campaigns', icon: 'campaigns' },
        { id: 'vendors', label: 'Vendors', hash: '#/vendors', icon: 'vendors' },
        { id: 'events', label: 'Events', hash: '#/events', icon: 'events' }
      ]
    },
    {
      title: 'Management',
      items: [
        { id: 'targets', label: 'Targets', hash: '#/targets', icon: 'targets' },
        { id: 'reports', label: 'Reports', hash: '#/reports', icon: 'reports' }
      ]
    }
  ];

  const MOBILE_NAV = [
    { id: 'dashboard', label: 'Home', hash: '#/', icon: 'dashboard' },
    { id: 'leads', label: 'Leads', hash: '#/leads', icon: 'leads' },
    { id: 'employers', label: 'Employers', hash: '#/employers', icon: 'employers' },
    { id: 'visits', label: 'Visits', hash: '#/visits', icon: 'visits' },
    { id: 'queries', label: 'Queries', hash: '#/queries', icon: 'queries' }
  ];

  function activeHash() {
    const h = window.location.hash || '#/';
    return h;
  }

  /* ---------------- Shell rendering ---------------- */

  function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = '';

    const brand = Utils.el('div', 'brand');
    brand.appendChild(Utils.el('div', 'brand-mark', 'N'));
    const brandText = Utils.el('div');
    brandText.appendChild(Utils.el('div', 'brand-name', 'Nextjobz CRM'));
    brandText.appendChild(Utils.el('div', 'brand-sub', 'Internal coordination hub'));
    brand.appendChild(brandText);
    sidebar.appendChild(brand);

    const nav = Utils.el('nav', 'nav');
    NAV.forEach((section) => {
      const visible = section.items.filter((it) => Auth.canAccess(it.id));
      if (!visible.length) return;
      const sec = Utils.el('div', 'nav-section');
      sec.appendChild(Utils.el('div', 'nav-section-title', section.title));
      visible.forEach((it) => {
        const a = Utils.el('a', 'nav-item', '');
        a.href = it.hash;
        a.setAttribute('data-nav', it.id);
        a.innerHTML = svg(it.icon, 20) + '<span>' + Utils.esc(it.label) + '</span>';
        if (activeHash() === it.hash) a.classList.add('active');
        sec.appendChild(a);
      });
      nav.appendChild(sec);
    });
    sidebar.appendChild(nav);

    const foot = Utils.el('div', 'sidebar-foot', 'Viewing as ' + Auth.roleLabel(Auth.getRole()));
    sidebar.appendChild(foot);
  }

  function renderTopBar() {
    const topbar = document.getElementById('topbar');
    topbar.innerHTML = '';

    const title = Utils.el('span', 'topbar-title', 'Nextjobz CRM');
    title.id = 'pageTitle';

    const search = Utils.el('div', 'topbar-search');
    const sInput = Utils.el('input');
    sInput.type = 'text';
    sInput.placeholder = 'Search…';
    const sIco = Utils.el('span', 'search-ico');
    sIco.innerHTML = svg('search', 16);
    search.appendChild(sIco);
    search.appendChild(sInput);

    const roleSwitch = Utils.el('div', 'role-switch');
    const lbl = Utils.el('label', '', 'Demo: View As');
    const sel = Utils.el('select');
    sel.setAttribute('aria-label', 'Demo view as role');
    Auth.ROLES.forEach((r) => {
      const o = Utils.el('option', '', r.label);
      o.value = r.id;
      sel.appendChild(o);
    });
    sel.value = Auth.getRole();
    sel.addEventListener('change', () => {
      Auth.setRole(sel.value);
      renderSidebar();
      renderTopBar();
      renderMobileNav();
      if (window.Router) window.Router.refresh();
    });

    roleSwitch.appendChild(lbl);
    roleSwitch.appendChild(sel);

    const avatar = Utils.el('div', 'avatar', Auth.initials(Auth.getRole()));
    avatar.title = Auth.roleLabel(Auth.getRole());

    topbar.appendChild(title);
    topbar.appendChild(search);
    topbar.appendChild(roleSwitch);
    topbar.appendChild(avatar);
  }

  function renderMobileNav() {
    const mnav = document.getElementById('mobileNav');
    mnav.innerHTML = '';
    MOBILE_NAV.forEach((it) => {
      if (!Auth.canAccess(it.id)) return;
      const a = Utils.el('a', 'mobile-nav-item', '');
      a.href = it.hash;
      a.setAttribute('data-nav', it.id);
      a.innerHTML = svg(it.icon, 20) + '<span>' + Utils.esc(it.label) + '</span>';
      if (activeHash() === it.hash) a.classList.add('active');
      mnav.appendChild(a);
    });
  }

  function renderShell() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    const layout = Utils.el('div', 'layout');
    const sidebar = Utils.el('aside', 'sidebar');
    sidebar.id = 'sidebar';
    layout.appendChild(sidebar);

    const main = Utils.el('div', 'main');
    const topbar = Utils.el('header', 'topbar');
    topbar.id = 'topbar';
    main.appendChild(topbar);
    const content = Utils.el('main', 'content');
    content.id = 'view';
    main.appendChild(content);
    layout.appendChild(main);
    app.appendChild(layout);

    const mnav = Utils.el('nav', 'mobile-nav');
    mnav.id = 'mobileNav';
    app.appendChild(mnav);

    // toast + modal roots
    const toastRoot = Utils.el('div', 'toast-root');
    toastRoot.id = 'toast-root';
    document.body.appendChild(toastRoot);
    const modalRoot = Utils.el('div', 'modal-root');
    modalRoot.id = 'modal-root';
    document.body.appendChild(modalRoot);

    renderSidebar();
    renderTopBar();
    renderMobileNav();
  }

  function setPageTitle(t) {
    const el = document.getElementById('pageTitle');
    if (el) el.textContent = t;
  }

  return {
    icon,
    svg,
    badge,
    notice,
    kpiCard,
    kpiGrid,
    card,
    emptyState,
    searchBox,
    searchableSelect,
    numberInput,
    dateInput,
    chips,
    pageHead,
    skeleton,
    table,
    modal,
    toast,
    renderShell,
    renderSidebar,
    renderTopBar,
    renderMobileNav,
    setPageTitle,
    NAV,
    MOBILE_NAV
  };
})();

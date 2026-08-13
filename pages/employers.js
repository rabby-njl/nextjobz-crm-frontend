// pages/employers.js — Employers list (#/employers) + Employer 360 view (#/employers/:id).

(function () {
  const C = window.APP_CONSTANTS;

  function statusTone(status) {
    switch (status) {
      case 'active': return 'green';
      case 'dormant': return 'amber';
      case 'lost': return 'red';
      default: return 'gray';
    }
  }

  /* ---------------- form helpers ---------------- */

  function textInput(val, placeholder) {
    const inp = Utils.el('input');
    inp.type = 'text';
    inp.value = val || '';
    inp.placeholder = placeholder || '';
    return inp;
  }

  function selectInput(options, current, placeholder) {
    const sel = Utils.el('select');
    if (placeholder !== false) {
      const o0 = Utils.el('option', '', placeholder || 'Select…');
      o0.value = '';
      sel.appendChild(o0);
    }
    options.forEach(function (opt) {
      const o = Utils.el('option', '', opt);
      o.value = opt;
      if (current === opt) o.selected = true;
      sel.appendChild(o);
    });
    return sel;
  }

  function field(label, control, required) {
    const div = Utils.el('div', 'field');
    const lbl = Utils.el('label', '', label);
    if (required) lbl.appendChild(Utils.el('span', 'req', ' *'));
    div.appendChild(lbl);
    div.appendChild(control);
    return div;
  }

  function buildEmployerForm(employer) {
    employer = employer || {};
    const form = Utils.el('div', 'form-grid');

    const name = textInput(employer.name, 'Demo Textiles Ltd');
    const industry = selectInput(C.industries, employer.industry, 'Select industry');
    const size = selectInput(C.sizes, employer.size, 'Select size');
    const address = textInput(employer.address, 'Plot, industrial area');
    const zone = selectInput(C.zones, employer.zone, 'Select zone');
    const phone = textInput(employer.phone, '01700000000');
    const email = textInput(employer.email, 'name@example.com');
    const salesperson = selectInput(C.salesOfficers, employer.salesperson, 'Select owner');
    const status = selectInput(['active', 'dormant', 'lost'], employer.status || 'active', false);

    form.appendChild(field('Company name', name, true));
    form.appendChild(field('Industry', industry, false));
    form.appendChild(field('Size', size, false));
    form.appendChild(field('Zone', zone, false));
    form.appendChild(field('Phone', phone, false));
    form.appendChild(field('Email', email, false));
    form.appendChild(field('Owner (sales officer)', salesperson, false));
    form.appendChild(field('Status', status, true));
    const addrField = field('Address', address, false);
    addrField.classList.add('full');
    form.appendChild(addrField);

    return {
      el: form,
      values: function () {
        return {
          name: name.value.trim(),
          industry: industry.value,
          size: size.value,
          address: address.value.trim(),
          zone: zone.value,
          phone: phone.value.trim(),
          email: email.value.trim(),
          salesperson: salesperson.value || null,
          status: status.value
        };
      },
      validate: function () {
        const v = this.values();
        const errs = [];
        if (!v.name) errs.push('Company name is required.');
        if (v.phone && !Utils.isValidBDPhone(v.phone)) errs.push('Phone must be 11 digits starting 01.');
        if (v.email && !Utils.isValidEmail(v.email)) errs.push('Email looks wrong.');
        return errs;
      }
    };
  }

  function openEmployerForm(employer, onSaved) {
    const isEdit = !!employer;
    const form = buildEmployerForm(employer);
    Components.modal({
      title: isEdit ? 'Edit Employer' : 'Add New Employer',
      body: form.el,
      actions: [
        { label: 'Cancel', class: 'btn--ghost', onClick: function (close) { close(); } },
        {
          label: isEdit ? 'Save Changes' : 'Add Employer', class: 'btn--primary',
          onClick: function (close) {
            const errs = form.validate();
            if (errs.length) { Components.toast(errs[0], 'error'); return; }
            const data = form.values();
            if (isEdit) {
              api.employers.update(employer.id, data).then(function () {
                close(); Components.toast('Employer updated', 'success'); if (onSaved) onSaved();
              });
            } else {
              data.servicesUsed = [];
              data.lastContact = Utils.todayISO();
              api.employers.create(data).then(function () {
                close(); Components.toast('Employer added', 'success'); if (onSaved) onSaved();
              });
            }
          }
        }
      ]
    });
  }

  /* ---------------- List screen ---------------- */

  let currentSearch = '';

  function servicesCell(r) {
    const list = r.servicesUsed || [];
    if (!list.length) return Components.badge('gray', 'None');
    const wrap = Utils.el('div');
    wrap.style.display = 'flex';
    wrap.style.gap = '4px';
    wrap.style.flexWrap = 'wrap';
    list.slice(0, 2).forEach(function (s) { wrap.appendChild(Components.badge('purple', s)); });
    if (list.length > 2) wrap.appendChild(Components.badge('gray', '+' + (list.length - 2)));
    return wrap;
  }

  function renderListInto(container) {
    container.innerHTML = '';
    container.appendChild(Components.skeleton(5));
    api.employers.list().then(function (employers) {
      let rows = employers.slice();
      if (currentSearch) {
        const q = currentSearch.toLowerCase();
        rows = rows.filter(function (e) { return (e.name || '').toLowerCase().includes(q); });
      }
      const tbl = Components.table({
        columns: [
          {
            key: 'name', label: 'Company',
            render: function (r) {
              const w = Utils.el('div');
              w.appendChild(Utils.el('div', 'td-strong', r.name));
              w.appendChild(Utils.el('div', 'td-sub', r.id));
              return w;
            }
          },
          { key: 'industry', label: 'Industry', render: function (r) { return r.industry; } },
          { key: 'zone', label: 'Zone', render: function (r) { return r.zone; } },
          { key: 'servicesUsed', label: 'Services Used', render: servicesCell, sortable: false },
          { key: 'salesperson', label: 'Owner', render: function (r) { return r.salesperson || '—'; } },
          {
            key: 'lastContact', label: 'Last Contact',
            render: function (r) {
              const d = Utils.daysSince(r.lastContact);
              return Utils.formatDate(r.lastContact) + (d != null ? ' (' + d + 'd)' : '');
            }
          },
          { key: 'status', label: 'Status', render: function (r) { return Components.badge(statusTone(r.status), r.status); } },
          {
            key: 'actions', label: 'Actions', sortable: false,
            render: function (r) {
              const w = Utils.el('div');
              w.style.display = 'flex';
              w.style.gap = '6px';
              const view = Utils.el('a', 'btn btn--ghost btn--sm', 'View');
              view.href = '#/employers/' + r.id;
              const edit = Utils.el('button', 'btn btn--ghost btn--sm', 'Edit');
              edit.type = 'button';
              edit.addEventListener('click', function () { openEmployerForm(r, loadAndRender); });
              w.appendChild(view);
              w.appendChild(edit);
              return w;
            }
          }
        ],
        rows: rows,
        empty: {
          title: 'No employers yet',
          text: 'Add your first employer to start building your book.',
          actionLabel: 'Add Employer',
          onAction: function () { openEmployerForm(null, loadAndRender); }
        }
      });
      container.innerHTML = '';
      container.appendChild(tbl);
    });
  }

  function loadAndRender() {
    renderListInto(document.getElementById('employerTable'));
  }

  function renderList(view) {
    view.innerHTML = '';

    const addBtn = Utils.el('button', 'btn btn--primary', 'Add Employer');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () { openEmployerForm(null, loadAndRender); });

    view.appendChild(Components.pageHead({
      title: 'Employers',
      desc: 'Every company your teams work with.',
      actions: [addBtn]
    }));

    view.appendChild(Components.searchBox({
      placeholder: 'Search company name',
      onInput: function (q) { currentSearch = q; loadAndRender(); }
    }));

    const wrap = Utils.el('div');
    wrap.id = 'employerTable';
    wrap.style.marginTop = '16px';
    view.appendChild(wrap);

    loadAndRender();
  }

  /* ---------------- Detail (360) screen ---------------- */

  function detailItem(k, v, sub) {
    const div = Utils.el('div', 'detail-item');
    div.appendChild(Utils.el('div', 'k', k));
    const val = Utils.el('div', 'v');
    val.textContent = v || '—';
    if (sub) val.appendChild(Utils.el('div', 'sub', sub));
    div.appendChild(val);
    return div;
  }

  function overviewTab(employer) {
    const grid = Utils.el('div', 'detail-grid');
    grid.appendChild(detailItem('Employer ID', employer.id));
    grid.appendChild(detailItem('Industry', employer.industry));
    grid.appendChild(detailItem('Size', employer.size));
    grid.appendChild(detailItem('Zone', employer.zone));
    grid.appendChild(detailItem('Address', employer.address));
    grid.appendChild(detailItem('Phone', employer.phone));
    grid.appendChild(detailItem('Email', employer.email));
    grid.appendChild(detailItem('Owner', employer.salesperson));
    grid.appendChild(detailItem('Status', employer.status));
    grid.appendChild(detailItem('Last Contact', Utils.formatDate(employer.lastContact), Utils.daysSince(employer.lastContact) + ' days ago'));
    grid.appendChild(detailItem('Services Used', (employer.servicesUsed || []).join(', ') || '—'));
    return Components.card({ title: 'Overview', body: grid });
  }

  function makeTabColumns(kind) {
    const money = function (v) { return Utils.formatBDT(v); };
    if (kind === 'contacts') {
      return [
        { key: 'name', label: 'Name', render: function (r) { return r.name; } },
        { key: 'designation', label: 'Designation', render: function (r) { return r.designation || '—'; } },
        { key: 'phone', label: 'Phone', render: function (r) { return r.phone || '—'; } },
        { key: 'email', label: 'Email', render: function (r) { return r.email || '—'; } },
        { key: 'isPrimary', label: 'Primary', render: function (r) { return r.isPrimary ? Components.badge('green', 'Primary') : Components.badge('gray', '—'); } }
      ];
    }
    if (kind === 'deals') {
      return [
        { key: 'id', label: 'Deal ID', render: function (r) { return r.id; } },
        { key: 'service', label: 'Service', render: function (r) { return r.service; } },
        { key: 'stage', label: 'Stage', render: function (r) { return r.stage; } },
        { key: 'value', label: 'Value', render: function (r) { return money(r.value); } },
        { key: 'officer', label: 'Officer', render: function (r) { return r.officer; } },
        { key: 'expectedClose', label: 'Expected Close', render: function (r) { return Utils.formatDate(r.expectedClose); } }
      ];
    }
    if (kind === 'sales') {
      return [
        { key: 'id', label: 'Order ID', render: function (r) { return r.id; } },
        { key: 'service', label: 'Service', render: function (r) { return r.service; } },
        { key: 'amount', label: 'Amount', render: function (r) { return money(r.amount); } },
        { key: 'status', label: 'Status', render: function (r) { return r.status; } },
        { key: 'startDate', label: 'Start', render: function (r) { return Utils.formatDate(r.startDate); } },
        { key: 'endDate', label: 'End', render: function (r) { return Utils.formatDate(r.endDate); } }
      ];
    }
    if (kind === 'visits') {
      return [
        { key: 'id', label: 'Visit ID', render: function (r) { return r.id; } },
        { key: 'date', label: 'Date', render: function (r) { return Utils.formatDate(r.date); } },
        { key: 'type', label: 'Type', render: function (r) { return r.type; } },
        { key: 'officer', label: 'Officer', render: function (r) { return r.officer; } },
        { key: 'outcome', label: 'Outcome', render: function (r) { return r.outcome; } },
        { key: 'nextStep', label: 'Next Step', render: function (r) { return r.nextStep; } }
      ];
    }
    if (kind === 'invoices') {
      return [
        { key: 'id', label: 'Invoice ID', render: function (r) { return r.id; } },
        { key: 'amount', label: 'Amount', render: function (r) { return money(r.amount); } },
        { key: 'dueDate', label: 'Due Date', render: function (r) { return Utils.formatDate(r.dueDate); } },
        { key: 'paidDate', label: 'Paid Date', render: function (r) { return Utils.formatDate(r.paidDate); } },
        { key: 'status', label: 'Status', render: function (r) { return r.status; } },
        { key: 'method', label: 'Method', render: function (r) { return r.method; } }
      ];
    }
    if (kind === 'queries') {
      return [
        { key: 'id', label: 'Query ID', render: function (r) { return r.id; } },
        { key: 'channel', label: 'Channel', render: function (r) { return r.channel; } },
        { key: 'type', label: 'Type', render: function (r) { return r.type; } },
        { key: 'subject', label: 'Subject', render: function (r) { return r.subject; } },
        { key: 'status', label: 'Status', render: function (r) { return r.status; } },
        { key: 'assignedTo', label: 'Assigned To', render: function (r) { return r.assignedTo || '—'; } }
      ];
    }
    return [];
  }

  function renderEmployerDetail(employer, lifetimeValue) {
    const view = document.getElementById('view');
    view.innerHTML = '';

    const back = Utils.el('a', 'btn btn--ghost btn--sm', '‹ Back to Employers');
    back.href = '#/employers';
    const editBtn = Utils.el('button', 'btn btn--secondary', 'Edit');
    editBtn.type = 'button';
    editBtn.addEventListener('click', function () { openEmployerForm(employer, function () { renderDetailFromId(employer.id); }); });

    view.appendChild(Components.pageHead({
      title: employer.name,
      desc: employer.id + ' · ' + employer.industry + ' · ' + employer.zone,
      actions: [back, editBtn]
    }));

    view.appendChild(Components.kpiGrid([
      { label: 'Total Lifetime Value', value: Utils.formatBDT(lifetimeValue), tone: 'purple', sub: 'packages + won deals' },
      { label: 'Status', value: employer.status, tone: statusTone(employer.status), sub: 'owner ' + (employer.salesperson || '—') }
    ]));

    const tabDefs = [
      { key: 'overview', label: 'Overview', load: function () { return Promise.resolve(overviewTab(employer)); } },
      { key: 'contacts', label: 'Contacts', load: function () { return api.contacts.list({ company: employer.name }).then(function (rows) { return Components.table({ columns: makeTabColumns('contacts'), rows: rows, empty: { title: 'No contacts', text: 'Add contacts for this employer.' } }); }); } },
      { key: 'deals', label: 'Deals', load: function () { return api.deals.list({ employer: employer.name }).then(function (rows) { return Components.table({ columns: makeTabColumns('deals'), rows: rows, empty: { title: 'No deals', text: 'No open deals for this employer.' } }); }); } },
      { key: 'sales', label: 'Package Sales', load: function () { return api.orders.list({ employer: employer.name }).then(function (rows) { return Components.table({ columns: makeTabColumns('sales'), rows: rows, empty: { title: 'No package sales', text: 'Nothing sold to this employer yet.' } }); }); } },
      { key: 'visits', label: 'Visits', load: function () { return api.visits.list({ employer: employer.name }).then(function (rows) { return Components.table({ columns: makeTabColumns('visits'), rows: rows, empty: { title: 'No visits', text: 'No visits recorded for this employer.' } }); }); } },
      { key: 'invoices', label: 'Invoices', load: function () { return api.collections.list({ employer: employer.name }).then(function (rows) { return Components.table({ columns: makeTabColumns('invoices'), rows: rows, empty: { title: 'No invoices', text: 'No invoices for this employer.' } }); }); } },
      { key: 'queries', label: 'Queries', load: function () { return api.queries.list({ company: employer.name }).then(function (rows) { return Components.table({ columns: makeTabColumns('queries'), rows: rows, empty: { title: 'No queries', text: 'No queries from this employer.' } }); }); } }
    ];

    let activeTab = 'overview';
    const tabBar = Utils.el('div', 'tabs');
    const content = Utils.el('div');
    content.id = 'tabContent';

    function renderTabs() {
      tabBar.innerHTML = '';
      tabDefs.forEach(function (t) {
        const b = Utils.el('button', 'tab' + (activeTab === t.key ? ' active' : ''), t.label);
        b.type = 'button';
        b.addEventListener('click', function () { activeTab = t.key; renderTabs(); loadTab(t.key); });
        tabBar.appendChild(b);
      });
    }

    function loadTab(key) {
      content.innerHTML = '';
      content.appendChild(Components.skeleton(3));
      const def = tabDefs.find(function (t) { return t.key === key; });
      def.load().then(function (el) { content.innerHTML = ''; content.appendChild(el); });
    }

    renderTabs();
    const wrap = Utils.el('div');
    wrap.style.marginTop = '16px';
    wrap.appendChild(tabBar);
    wrap.appendChild(content);
    view.appendChild(wrap);
    loadTab('overview');
  }

  function renderDetailFromId(id) {
    const view = document.getElementById('view');
    view.innerHTML = '';
    view.appendChild(Components.skeleton(5));
    api.employers.get(id).then(function (employer) {
      if (!employer) {
        view.innerHTML = '';
        view.appendChild(Components.emptyState({ title: 'Employer not found', text: 'It may have been removed.', actionLabel: 'Back to Employers', onAction: function () { window.location.hash = '#/employers'; } }));
        return;
      }
      Promise.all([api.orders.list({ employer: employer.name }), api.deals.list({ employer: employer.name })]).then(function (res) {
        const orders = res[0];
        const deals = res[1];
        let lifetime = 0;
        orders.forEach(function (o) { lifetime += Number(o.amount) || 0; });
        deals.forEach(function (d) { if (d.stage === 'won') lifetime += Number(d.value) || 0; });
        renderEmployerDetail(employer, lifetime);
      });
    });
  }

  /* ---------------- Routes ---------------- */

  Router.route('/employers', renderList, { screen: 'employers', title: 'Employers' });
  Router.route('/employers/:id', function (view, params) { renderDetailFromId(params.id); }, { screen: 'employers', title: 'Employer 360' });
})();

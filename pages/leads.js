// pages/leads.js — Leads list (#/leads) + Lead detail (#/leads/:id).
// The core screen: routing must be visible and nothing falls between teams.

(function () {
  const C = window.APP_CONSTANTS;

  function leadStatusTone(status) {
    switch (status) {
      case 'converted': return 'green';
      case 'qualified': return 'green';
      case 'contacted': return 'amber';
      case 'assigned': return 'purple';
      case 'new': return 'gray';
      case 'lost': return 'red';
      default: return 'gray';
    }
  }

  function actionTone(action) {
    switch (action) {
      case 'routed': return 'routed';
      case 'assigned': return 'assigned';
      case 'accepted': return 'accepted';
      case 'status': return 'status';
      case 'lost': return 'lost';
      case 'note': return 'note';
      default: return 'created';
    }
  }

  /* ---------------- Shared form helpers ---------------- */

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

  function buildLeadForm(lead) {
    lead = lead || {};
    const form = Utils.el('div', 'form-grid');

    const company = textInput(lead.company, 'Demo Textiles Ltd');
    const contactName = textInput(lead.contactName, 'Contact One');
    const phone = textInput(lead.phone, '01700000000');
    const email = textInput(lead.email, 'name@example.com');
    const source = selectInput(C.sources, lead.source, 'Select source');
    const serviceInterest = selectInput(C.services, lead.serviceInterest, 'Select service');
    const routedTo = selectInput(C.routes, lead.routedTo, 'Not routed');
    const assignedTo = selectInput(C.officers, lead.assignedTo, 'Unassigned');
    const status = selectInput(C.leadStatuses, lead.status || 'new', false);
    const note = Utils.el('textarea');
    note.value = lead.note || '';
    const lostReason = selectInput(C.lostReasons, lead.lostReason, 'Select reason');

    const lostField = field('Lost reason', lostReason, true);
    lostField.style.display = status.value === 'lost' ? '' : 'none';
    status.addEventListener('change', function () {
      lostField.style.display = status.value === 'lost' ? '' : 'none';
    });

    form.appendChild(field('Company', company, true));
    form.appendChild(field('Contact name', contactName, true));
    form.appendChild(field('Phone', phone, false));
    form.appendChild(field('Email', email, false));
    form.appendChild(field('Source', source, false));
    form.appendChild(field('Service interest', serviceInterest, false));
    form.appendChild(field('Routed to', routedTo, false));
    form.appendChild(field('Assigned to', assignedTo, false));
    form.appendChild(field('Status', status, true));
    form.appendChild(lostField);
    const noteField = field('Note', note, false);
    noteField.classList.add('full');
    form.appendChild(noteField);

    return {
      el: form,
      values: function () {
        return {
          company: company.value.trim(),
          contactName: contactName.value.trim(),
          phone: phone.value.trim(),
          email: email.value.trim(),
          source: source.value,
          serviceInterest: serviceInterest.value,
          routedTo: routedTo.value || null,
          assignedTo: assignedTo.value || null,
          status: status.value,
          note: note.value.trim(),
          lostReason: status.value === 'lost' ? lostReason.value : (lead.lostReason || null)
        };
      },
      validate: function () {
        const v = this.values();
        const errs = [];
        if (!v.company) errs.push('Company is required.');
        if (!v.contactName) errs.push('Contact name is required.');
        if (v.phone && !Utils.isValidBDPhone(v.phone)) errs.push('Phone must be 11 digits starting 01.');
        if (v.email && !Utils.isValidEmail(v.email)) errs.push('Email looks wrong.');
        if (v.status === 'lost' && !v.lostReason) errs.push('A lost lead needs a reason.');
        return errs;
      }
    };
  }

  /* ---------------- Add / Edit modal ---------------- */

  function openLeadForm(lead, onSaved) {
    const isEdit = !!lead;
    const form = buildLeadForm(lead);
    Components.modal({
      title: isEdit ? 'Edit Lead' : 'Add New Lead',
      body: form.el,
      actions: [
        { label: 'Cancel', class: 'btn--ghost', onClick: function (close) { close(); } },
        {
          label: isEdit ? 'Save Changes' : 'Add Lead',
          class: 'btn--primary',
          onClick: function (close) {
            const errs = form.validate();
            if (errs.length) { Components.toast(errs[0], 'error'); return; }
            const data = form.values();
            const now = new Date().toISOString();
            const by = Auth.userName() || 'CRM Team';

            if (isEdit) {
              const hist = (lead.history || []).slice();
              if (data.status !== lead.status) {
                hist.push({
                  action: data.status === 'lost' ? 'lost' : 'status',
                  text: data.status === 'lost' ? ('Marked lost: ' + data.lostReason) : ('Status updated to ' + data.status),
                  by: by, at: now
                });
              }
              if (data.routedTo && data.routedTo !== lead.routedTo) {
                hist.push({ action: 'routed', text: 'Routed to ' + data.routedTo, by: by, at: now });
                data.routedAt = Utils.todayISO();
                data.routedBy = by;
              }
              data.history = hist;
              data.lastActivityAt = Utils.todayISO();
              api.leads.update(lead.id, data).then(function () {
                close();
                Components.toast('Lead updated', 'success');
                if (onSaved) onSaved();
              });
            } else {
              data.createdAt = Utils.todayISO();
              data.lastActivityAt = Utils.todayISO();
              data.history = [{ action: 'created', text: 'Lead created', by: by, at: now }];
              if (data.routedTo) {
                data.routedAt = Utils.todayISO();
                data.routedBy = by;
                data.history.push({ action: 'routed', text: 'Routed to ' + data.routedTo, by: by, at: now });
                data.history.push({ action: 'assigned', text: 'Assigned to ' + data.assignedTo, by: by, at: now });
              }
              api.leads.create(data).then(function () {
                close();
                Components.toast('Lead added', 'success');
                if (onSaved) onSaved();
              });
            }
          }
        }
      ]
    });
  }

  /* ---------------- Route Lead modal ---------------- */

  function openRouteModal(lead, onSaved) {
    const body = Utils.el('div', 'form-grid');
    const team = selectInput(C.routes, lead.routedTo, 'Select team');
    const officer = selectInput(C.officers, lead.assignedTo, 'Select officer');
    body.appendChild(field('Team', team, true));
    body.appendChild(field('Assigned officer', officer, false));

    Components.modal({
      title: 'Route Lead — ' + lead.company,
      body: body,
      actions: [
        { label: 'Cancel', class: 'btn--ghost', onClick: function (close) { close(); } },
        {
          label: 'Route Lead', class: 'btn--primary',
          onClick: function (close) {
            if (!team.value) { Components.toast('Pick a team first.', 'error'); return; }
            const now = new Date().toISOString();
            const by = Auth.userName() || 'CRM Team';
            const hist = (lead.history || []).slice();
            hist.push({ action: 'routed', text: 'Routed to ' + team.value, by: by, at: now });
            if (officer.value) hist.push({ action: 'assigned', text: 'Assigned to ' + officer.value, by: by, at: now });

            api.leads.update(lead.id, {
              routedTo: team.value,
              assignedTo: officer.value || null,
              routedAt: Utils.todayISO(),
              routedBy: by,
              acceptedBy: officer.value || null,
              status: lead.status === 'new' ? 'assigned' : lead.status,
              lastActivityAt: Utils.todayISO(),
              history: hist
            }).then(function () {
              close();
              Components.toast('Lead routed to ' + team.value, 'success');
              if (onSaved) onSaved();
            });
          }
        }
      ]
    });
  }

  /* ---------------- List screen ---------------- */

  let currentFilter = 'all';
  let currentSearch = '';

  function applyFilters(leads) {
    let out = leads.slice();
    if (currentFilter === 'unrouted') {
      out = out.filter(function (l) { return !l.routedTo; });
    } else if (currentFilter === 'mine') {
      const me = Auth.userName();
      if (me) out = out.filter(function (l) { return l.assignedTo === me; });
    } else if (currentFilter === 'overdue') {
      out = out.filter(function (l) {
        const d = Utils.daysSince(l.lastActivityAt);
        return d != null && d >= 3;
      });
    }
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      out = out.filter(function (l) {
        return (l.company || '').toLowerCase().includes(q) || (l.contactName || '').toLowerCase().includes(q);
      });
    }
    return out;
  }

  function companyCell(r) {
    const wrap = Utils.el('div');
    wrap.appendChild(Utils.el('div', 'td-strong', r.company));
    wrap.appendChild(Utils.el('div', 'td-sub', r.id));
    return wrap;
  }

  function contactCell(r) {
    const wrap = Utils.el('div');
    wrap.appendChild(Utils.el('div', '', r.contactName || '—'));
    wrap.appendChild(Utils.el('div', 'td-sub', r.phone || ''));
    return wrap;
  }

  function daysCell(r) {
    const d = Utils.daysSince(r.lastActivityAt);
    if (d == null) return '—';
    return Components.badge(Utils.ageTone(d), d + 'd');
  }

  function actionsCell(r) {
    const wrap = Utils.el('div');
    wrap.style.display = 'flex';
    wrap.style.gap = '6px';
    wrap.style.flexWrap = 'wrap';

    const view = Utils.el('a', 'btn btn--ghost btn--sm', 'View');
    view.href = '#/leads/' + r.id;
    wrap.appendChild(view);

    if (!r.routedTo) {
      const routeBtn = Utils.el('button', 'btn btn--secondary btn--sm', 'Route');
      routeBtn.type = 'button';
      routeBtn.addEventListener('click', function () { openRouteModal(r, loadAndRender); });
      wrap.appendChild(routeBtn);
    }

    const edit = Utils.el('button', 'btn btn--ghost btn--sm', 'Edit');
    edit.type = 'button';
    edit.addEventListener('click', function () { openLeadForm(r, loadAndRender); });
    wrap.appendChild(edit);

    return wrap;
  }

  function renderTableInto(container) {
    container.innerHTML = '';
    container.appendChild(Components.skeleton(5));
    api.leads.list().then(function (leads) {
      const filtered = applyFilters(leads);
      const tbl = Components.table({
        columns: [
          { key: 'company', label: 'Company', render: companyCell },
          { key: 'contact', label: 'Contact', render: contactCell },
          { key: 'source', label: 'Source', render: function (r) { return r.source; } },
          { key: 'serviceInterest', label: 'Service Interest', render: function (r) { return r.serviceInterest; } },
          { key: 'routedTo', label: 'Routed To', render: function (r) { return r.routedTo ? r.routedTo : Components.badge('red', 'Not Routed'); } },
          { key: 'assignedTo', label: 'Assigned Officer', render: function (r) { return r.assignedTo || '—'; } },
          { key: 'status', label: 'Status', render: function (r) { return Components.badge(leadStatusTone(r.status), r.status); } },
          { key: 'days', label: 'Days Untouched', render: daysCell },
          { key: 'actions', label: 'Actions', sortable: false, render: actionsCell }
        ],
        rows: filtered,
        empty: {
          title: 'No leads match',
          text: 'Change the filter or add a new lead.',
          actionLabel: 'Add Lead',
          onAction: function () { openLeadForm(null, loadAndRender); }
        }
      });
      container.innerHTML = '';
      container.appendChild(tbl);
    });
  }

  function loadAndRender() {
    renderTableInto(document.getElementById('leadTable'));
  }

  function renderList(view) {
    view.innerHTML = '';

    const addBtn = Utils.el('button', 'btn btn--primary', 'Add Lead');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () { openLeadForm(null, loadAndRender); });

    view.appendChild(Components.pageHead({
      title: 'Leads',
      desc: 'Every lead, its route and its status. Nothing falls between teams.',
      actions: [addBtn]
    }));

    // filter + search row
    const controls = Utils.el('div', 'toolbar');
    controls.style.display = 'flex';
    controls.style.flexWrap = 'wrap';
    controls.style.alignItems = 'center';
    controls.style.gap = '12px';
    controls.style.marginBottom = '16px';

    const chips = Components.chips({
      active: currentFilter,
      items: [
        { key: 'all', label: 'All' },
        { key: 'unrouted', label: 'Unrouted' },
        { key: 'mine', label: 'My Leads' },
        { key: 'overdue', label: 'Overdue Follow-up' }
      ],
      onSelect: function (key) {
        currentFilter = key;
        loadAndRender();
      }
    });
    chips.style.marginBottom = '0';

    const search = Components.searchBox({
      placeholder: 'Search company or contact',
      onInput: function (q) {
        currentSearch = q;
        loadAndRender();
      }
    });

    controls.appendChild(chips);
    controls.appendChild(search);
    view.appendChild(controls);

    const tableWrap = Utils.el('div');
    tableWrap.id = 'leadTable';
    view.appendChild(tableWrap);

    loadAndRender();
  }

  /* ---------------- Detail screen ---------------- */

  function timeline(entries, actionsOnly) {
    const wrap = Utils.el('div', 'timeline');
    const list = actionsOnly ? entries.filter(function (e) {
      return ['routed', 'assigned', 'accepted'].indexOf(e.action) !== -1;
    }) : entries;
    if (!list.length) {
      wrap.appendChild(Utils.el('div', 'empty-text', 'No activity yet.'));
      return wrap;
    }
    list.forEach(function (e) {
      const item = Utils.el('div', 'timeline-item');
      item.appendChild(Utils.el('span', 'timeline-dot timeline-dot--' + actionTone(e.action)));
      const body = Utils.el('div');
      body.appendChild(Utils.el('div', 'timeline-text', e.text));
      body.appendChild(Utils.el('div', 'timeline-meta', (e.by ? e.by + ' · ' : '') + Utils.timeAgo(e.at)));
      item.appendChild(body);
      wrap.appendChild(item);
    });
    return wrap;
  }

  function detailItem(k, v, sub) {
    const div = Utils.el('div', 'detail-item');
    div.appendChild(Utils.el('div', 'k', k));
    const val = Utils.el('div', 'v');
    val.textContent = v || '—';
    if (sub) val.appendChild(Utils.el('div', 'sub', sub));
    div.appendChild(val);
    return div;
  }

  function renderDetail(lead) {
    const view = document.getElementById('view');
    view.innerHTML = '';

    const back = Utils.el('a', 'btn btn--ghost btn--sm', '‹ Back to Leads');
    back.href = '#/leads';

    const editBtn = Utils.el('button', 'btn btn--secondary', 'Edit');
    editBtn.type = 'button';
    editBtn.addEventListener('click', function () { openLeadForm(lead, function () { renderDetailFromId(lead.id); }); });

    const routeBtn = Utils.el('button', 'btn btn--primary', 'Route Lead');
    routeBtn.type = 'button';
    routeBtn.addEventListener('click', function () { openRouteModal(lead, function () { renderDetailFromId(lead.id); }); });

    view.appendChild(Components.pageHead({
      title: lead.company,
      desc: lead.id + ' · created ' + Utils.formatDate(lead.createdAt),
      actions: [back, editBtn, routeBtn]
    }));

    // header card
    const grid = Utils.el('div', 'detail-grid');
    grid.appendChild(detailItem('Status', lead.status));
    grid.appendChild(detailItem('Routed To', lead.routedTo || 'Not routed'));
    grid.appendChild(detailItem('Assigned Officer', lead.assignedTo || '—'));
    grid.appendChild(detailItem('Source', lead.source));
    grid.appendChild(detailItem('Service Interest', lead.serviceInterest));
    grid.appendChild(detailItem('Contact', lead.contactName, lead.phone));
    grid.appendChild(detailItem('Email', lead.email));
    const d = Utils.daysSince(lead.lastActivityAt);
    grid.appendChild(detailItem('Days Untouched', d == null ? '—' : d + ' days'));
    view.appendChild(Components.card({ title: 'Lead overview', body: grid }));

    // routing history trail + activity log
    const two = Utils.el('div');
    two.style.display = 'grid';
    two.style.gridTemplateColumns = '1fr 1fr';
    two.style.gap = '20px';
    two.style.marginTop = '20px';

    const trailCard = Components.card({ title: 'Routing history', body: timeline(lead.history || [], true) });
    const logCard = Components.card({ title: 'Activity log', body: timeline(lead.history || [], false) });

    two.appendChild(trailCard);
    two.appendChild(logCard);

    const twoWrap = Utils.el('div');
    twoWrap.appendChild(two);
    twoWrap.id = 'detailColumns';
    view.appendChild(twoWrap);

    // single column on mobile
    const media = window.matchMedia('(max-width: 768px)');
    const applyCols = function () {
      two.style.gridTemplateColumns = media.matches ? '1fr' : '1fr 1fr';
    };
    applyCols();
    if (media.addEventListener) media.addEventListener('change', applyCols);
  }

  function renderDetailFromId(id) {
    const view = document.getElementById('view');
    view.innerHTML = '';
    view.appendChild(Components.skeleton(4));
    api.leads.get(id).then(function (lead) {
      if (!lead) {
        view.innerHTML = '';
        view.appendChild(Components.emptyState({ title: 'Lead not found', text: 'It may have been removed.', actionLabel: 'Back to Leads', onAction: function () { window.location.hash = '#/leads'; } }));
        return;
      }
      renderDetail(lead);
    });
  }

  /* ---------------- Routes ---------------- */

  Router.route('/leads', renderList, { screen: 'leads', title: 'Leads' });
  Router.route('/leads/:id', function (view, params) { renderDetailFromId(params.id); }, { screen: 'leads', title: 'Lead Detail' });
})();

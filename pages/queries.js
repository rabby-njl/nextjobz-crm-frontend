// pages/queries.js — Query Inbox (#/queries). Shared inbox for inbound messages.

(function () {
  const C = window.APP_CONSTANTS;

  function statusTone(status) {
    switch (status) {
      case 'open': return 'amber';
      case 'in progress': return 'purple';
      case 'escalated': return 'red';
      case 'resolved': return 'green';
      default: return 'gray';
    }
  }

  function hourTone(h) {
    if (h == null) return 'gray';
    if (h >= 12) return 'red';
    if (h >= 4) return 'amber';
    return 'green';
  }

  function channelToSource(channel) {
    switch (channel) {
      case 'Messenger': return 'Messenger';
      case 'WhatsApp': return 'WhatsApp';
      case 'LinkedIn': return 'LinkedIn';
      case 'Hotline': return 'Hotline call';
      default: return 'website form';
    }
  }

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

  function buildQueryForm(query) {
    query = query || {};
    const form = Utils.el('div', 'form-grid');

    const channel = selectInput(C.queryChannels, query.channel, 'Select channel');
    const from = textInput(query.from, 'Sender name');
    const type = selectInput(C.queryTypes, query.type, 'Select type');
    const subject = textInput(query.subject, 'Subject');
    const assignedTo = selectInput(Auth.crmOfficers(), query.assignedTo, 'Unassigned');
    const status = selectInput(C.queryStatuses, query.status || 'open', false);
    const company = Components.searchableSelect(C.companies, query.company, 'Type to search employer (optional)');

    form.appendChild(field('Channel', channel, true));
    form.appendChild(field('From', from, true));
    form.appendChild(field('Type', type, false));
    form.appendChild(field('Assigned to', assignedTo, false));
    form.appendChild(field('Status', status, true));
    form.appendChild(field('Employer', company.el, false));
    const subjField = field('Subject', subject, false);
    subjField.classList.add('full');
    form.appendChild(subjField);

    return {
      el: form,
      values: function () {
        return {
          channel: channel.value,
          from: from.value.trim(),
          type: type.value,
          subject: subject.value.trim(),
          assignedTo: assignedTo.value || null,
          status: status.value,
          company: company.getValue() || null
        };
      },
      validate: function () {
        const v = this.values();
        const errs = [];
        if (!v.channel) errs.push('Channel is required.');
        if (!v.from) errs.push('Sender name is required.');
        return errs;
      }
    };
  }

  function openQueryForm(query, onSaved) {
    const isEdit = !!query;
    const form = buildQueryForm(query);
    Components.modal({
      title: isEdit ? 'Edit Query' : 'Add Query',
      body: form.el,
      actions: [
        { label: 'Cancel', class: 'btn--ghost', onClick: function (close) { close(); } },
        {
          label: isEdit ? 'Save Changes' : 'Add Query', class: 'btn--primary',
          onClick: function (close) {
            const errs = form.validate();
            if (errs.length) { Components.toast(errs[0], 'error'); return; }
            const data = form.values();
            if (!isEdit) data.createdAt = new Date().toISOString();
            const p = isEdit ? api.queries.update(query.id, data) : api.queries.create(data);
            p.then(function () {
              close();
              Components.toast(isEdit ? 'Query updated' : 'Query added', 'success');
              if (onSaved) onSaved();
            });
          }
        }
      ]
    });
  }

  /* ---------------- Escalation actions ---------------- */

  function escalateQuery(q, to, onDone) {
    api.queries.update(q.id, {
      status: 'escalated',
      escalatedTo: to,
      escalatedAt: new Date().toISOString()
    }).then(function () {
      Components.toast('Sent to ' + to, 'success');
      if (onDone) onDone();
    });
  }

  function convertToLead(q, onDone) {
    const by = Auth.userName() || 'CRM Team';
    const now = new Date().toISOString();
    api.leads.create({
      company: q.company || q.subject || 'Query lead',
      contactName: q.from,
      phone: '',
      email: '',
      source: channelToSource(q.channel),
      serviceInterest: null,
      routedTo: null,
      assignedTo: null,
      status: 'new',
      note: 'Converted from query ' + q.id + ': ' + q.subject,
      createdAt: Utils.todayISO(),
      lastActivityAt: Utils.todayISO(),
      history: [
        { action: 'created', text: 'Lead created from query ' + q.id, by: by, at: now }
      ]
    }).then(function (lead) {
      return api.queries.update(q.id, { status: 'resolved', convertedToLead: lead.id }).then(function () { return lead; });
    }).then(function (lead) {
      Components.toast('Lead created: ' + lead.id, 'success');
      if (onDone) onDone();
    });
  }

  /* ---------------- list ---------------- */

  let statusFilter = 'open';
  let channelFilter = 'all';
  let currentSearch = '';

  function applyFilters(list) {
    let out = list.slice();
    if (statusFilter === 'open') {
      out = out.filter(function (q) { return q.status !== 'resolved'; });
    }
    if (channelFilter !== 'all') {
      out = out.filter(function (q) { return q.channel === channelFilter; });
    }
    return out;
  }

  function ageCell(r) {
    const h = Utils.hoursSince(r.createdAt);
    if (h == null) return '—';
    return Components.badge(hourTone(h), h + 'h');
  }

  function loadQueries() {
    const container = document.getElementById('queriesTable');
    container.innerHTML = '';
    container.appendChild(Components.skeleton(5));
    api.queries.list().then(function (queries) {
      queries.sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
      const rows = applyFilters(queries).filter(function (q) { return Utils.textMatch(q, currentSearch, ['from', 'subject', 'id']); });
      const tbl = Components.table({
        columns: [
          { key: 'id', label: 'Query ID', render: function (r) { return r.id; } },
          { key: 'channel', label: 'Channel', render: function (r) { return r.channel; } },
          { key: 'from', label: 'From', render: function (r) { return r.from; } },
          { key: 'type', label: 'Type', render: function (r) { return r.type; } },
          { key: 'subject', label: 'Subject', render: function (r) { return r.subject; } },
          { key: 'assignedTo', label: 'Assigned To', render: function (r) { return r.assignedTo || '—'; } },
          { key: 'status', label: 'Status', render: function (r) { return Components.badge(statusTone(r.status), r.status); } },
          { key: 'age', label: 'Age', render: ageCell },
          {
            key: 'actions', label: 'Actions', sortable: false,
            render: function (r) {
              const w = Utils.el('div');
              w.style.display = 'flex';
              w.style.gap = '6px';
              w.style.flexWrap = 'wrap';

              const conv = Utils.el('button', 'btn btn--secondary btn--sm', 'Convert to Lead');
              conv.type = 'button';
              conv.addEventListener('click', function () { convertToLead(r, loadQueries); });

              const it = Utils.el('button', 'btn btn--ghost btn--sm', 'Send to IT');
              it.type = 'button';
              it.addEventListener('click', function () { escalateQuery(r, 'IT', loadQueries); });

              const ev = Utils.el('button', 'btn btn--ghost btn--sm', 'Send to Events');
              ev.type = 'button';
              ev.addEventListener('click', function () { escalateQuery(r, 'Events', loadQueries); });

              const edit = Utils.el('button', 'btn btn--ghost btn--sm', 'Edit');
              edit.type = 'button';
              edit.addEventListener('click', function () { openQueryForm(r, loadQueries); });

              w.appendChild(conv);
              w.appendChild(it);
              w.appendChild(ev);
              w.appendChild(edit);
              return w;
            }
          }
        ],
        rows: rows,
        empty: {
          title: 'No queries match',
          text: 'Change the filters or add a query.',
          actionLabel: 'Add Query',
          onAction: function () { openQueryForm(null, loadQueries); }
        }
      });
      container.innerHTML = '';
      container.appendChild(tbl);
    });
  }

  function renderQueriesPage(view) {
    view.innerHTML = '';

    const addBtn = Utils.el('button', 'btn btn--primary', 'Add Query');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () { openQueryForm(null, loadQueries); });

    view.appendChild(Components.pageHead({
      title: 'Query Inbox',
      desc: 'All inbound messages from Messenger, WhatsApp, Hotline, LinkedIn and more.',
      actions: [addBtn]
    }));

    view.appendChild(Components.chips({
      active: statusFilter,
      items: [
        { key: 'open', label: 'Open' },
        { key: 'all', label: 'All' }
      ],
      onSelect: function (key) { statusFilter = key; loadQueries(); }
    }));

    view.appendChild(Components.chips({
      active: channelFilter,
      items: [{ key: 'all', label: 'All Channels' }].concat(C.queryChannels.map(function (ch) { return { key: ch, label: ch }; })),
      onSelect: function (key) { channelFilter = key; loadQueries(); }
    }));

    view.appendChild(Components.searchBox({
      placeholder: 'Search sender or subject',
      onInput: function (q) { currentSearch = q; loadQueries(); }
    }));

    const wrap = Utils.el('div');
    wrap.id = 'queriesTable';
    wrap.style.marginTop = '16px';
    view.appendChild(wrap);

    loadQueries();
  }

  Router.route('/queries', renderQueriesPage, { screen: 'queries', title: 'Query Inbox' });
})();

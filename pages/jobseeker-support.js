// pages/jobseeker-support.js — Job Seeker Support Log (#/jobseeker-support).

(function () {
  const C = window.APP_CONSTANTS;

  function outcomeTone(outcome) {
    switch (outcome) {
      case 'profile completed': return 'green';
      case 'CV updated': return 'green';
      case 'call back later': return 'amber';
      case 'no response': return 'gray';
      default: return 'gray';
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

  function buildSupportForm(rec) {
    rec = rec || {};
    const form = Utils.el('div', 'form-grid');

    const name = textInput(rec.name, 'Job seeker name');
    const phone = textInput(rec.phone, '01700000000');
    const type = selectInput(C.jsTypes, rec.type, 'Select type');
    const officer = selectInput(Auth.crmOfficers(), rec.officer || Auth.userName(), 'Select officer');
    const date = Components.dateInput(rec.date || Utils.todayISO());
    const outcome = selectInput(C.jsOutcomes, rec.outcome, 'Select outcome');

    form.appendChild(field('Job seeker name', name, true));
    form.appendChild(field('Phone', phone, false));
    form.appendChild(field('Type', type, false));
    form.appendChild(field('Officer', officer, false));
    form.appendChild(field('Date', date, true));
    form.appendChild(field('Outcome', outcome, false));

    return {
      el: form,
      values: function () {
        return {
          name: name.value.trim(),
          phone: phone.value.trim(),
          type: type.value,
          officer: officer.value || null,
          date: date.value || Utils.todayISO(),
          outcome: outcome.value || null
        };
      },
      validate: function () {
        const v = this.values();
        const errs = [];
        if (!v.name) errs.push('Job seeker name is required.');
        if (v.phone && !Utils.isValidBDPhone(v.phone)) errs.push('Phone must be 11 digits starting 01.');
        return errs;
      }
    };
  }

  function openSupportForm(rec, onSaved) {
    const isEdit = !!rec;
    const form = buildSupportForm(rec);
    Components.modal({
      title: isEdit ? 'Edit Support Log' : 'Add Support Log',
      body: form.el,
      actions: [
        { label: 'Cancel', class: 'btn--ghost', onClick: function (close) { close(); } },
        {
          label: isEdit ? 'Save Changes' : 'Add Entry', class: 'btn--primary',
          onClick: function (close) {
            const errs = form.validate();
            if (errs.length) { Components.toast(errs[0], 'error'); return; }
            const data = form.values();
            const p = isEdit ? api.jobseekerSupports.update(rec.id, data) : api.jobseekerSupports.create(data);
            p.then(function () {
              close();
              Components.toast(isEdit ? 'Entry updated' : 'Entry added', 'success');
              if (onSaved) onSaved();
            });
          }
        }
      ]
    });
  }

  let currentSearch = '';

  function loadSupports() {
    const container = document.getElementById('jsTable');
    container.innerHTML = '';
    container.appendChild(Components.skeleton(5));
    api.jobseekerSupports.list().then(function (records) {
      const monthPrefix = Utils.todayISO().slice(0, 7);
      const completedThisMonth = records.filter(function (r) {
        return r.outcome === 'profile completed' && String(r.date || '').slice(0, 7) === monthPrefix;
      }).length;

      const kpi = document.getElementById('jsKpi');
      if (kpi) {
        kpi.innerHTML = '';
        kpi.appendChild(Components.kpiGrid([
          { label: 'Profiles Completed This Month', value: String(completedThisMonth), tone: 'green', sub: 'outcome "profile completed"' }
        ]));
      }

      records = records.filter(function (r) { return Utils.textMatch(r, currentSearch, ['name', 'phone', 'id']); });
      records.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
      const tbl = Components.table({
        columns: [
          { key: 'id', label: 'Support ID', render: function (r) { return r.id; } },
          { key: 'name', label: 'Job Seeker', render: function (r) { return r.name; } },
          { key: 'phone', label: 'Phone', render: function (r) { return r.phone || '—'; } },
          { key: 'type', label: 'Type', render: function (r) { return r.type; } },
          { key: 'officer', label: 'Officer', render: function (r) { return r.officer || '—'; } },
          { key: 'date', label: 'Date', render: function (r) { return Utils.formatDate(r.date); } },
          { key: 'outcome', label: 'Outcome', render: function (r) { return Components.badge(outcomeTone(r.outcome), r.outcome || '—'); } },
          {
            key: 'actions', label: 'Actions', sortable: false,
            render: function (r) {
              const w = Utils.el('div');
              w.style.display = 'flex';
              w.style.gap = '6px';
              const edit = Utils.el('button', 'btn btn--ghost btn--sm', 'Edit');
              edit.type = 'button';
              edit.addEventListener('click', function () { openSupportForm(r, loadSupports); });
              w.appendChild(edit);
              return w;
            }
          }
        ],
        rows: records,
        empty: {
          title: 'No support entries yet',
          text: 'Log your first job seeker support call.',
          actionLabel: 'Add Entry',
          onAction: function () { openSupportForm(null, loadSupports); }
        }
      });
      container.innerHTML = '';
      container.appendChild(tbl);
    });
  }

  function renderSupportPage(view) {
    view.innerHTML = '';

    const addBtn = Utils.el('button', 'btn btn--primary', 'Add Entry');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () { openSupportForm(null, loadSupports); });

    view.appendChild(Components.pageHead({
      title: 'Job Seeker Support',
      desc: 'CV support, profile completion and interview prep for job seekers.',
      actions: [addBtn]
    }));

    const kpi = Utils.el('div');
    kpi.id = 'jsKpi';
    kpi.style.marginBottom = '16px';
    view.appendChild(kpi);

    view.appendChild(Components.searchBox({
      placeholder: 'Search name or phone',
      onInput: function (q) { currentSearch = q; loadSupports(); }
    }));

    const wrap = Utils.el('div');
    wrap.id = 'jsTable';
    view.appendChild(wrap);

    loadSupports();
  }

  Router.route('/jobseeker-support', renderSupportPage, { screen: 'jobseeker-support', title: 'Job Seeker Support' });
})();

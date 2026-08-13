// pages/visits.js — Visits & Meetings (#/visits). Fast to fill for field officers.

(function () {
  const C = window.APP_CONSTANTS;

  function typeTone(type) {
    switch (type) {
      case 'field visit': return 'purple';
      case 'online meeting': return 'gray';
      case 'phone call': return 'green';
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

  function buildVisitForm(visit) {
    visit = visit || {};
    const form = Utils.el('div', 'form-grid');

    const employer = Components.searchableSelect(C.companies, visit.employer, 'Type to search employer');
    const date = Components.dateInput(visit.date || Utils.todayISO());
    const type = selectInput(C.visitTypes, visit.type || 'field visit', false);
    const outcome = textInput(visit.outcome, 'meeting held');
    const nextStep = textInput(visit.nextStep, 'send proposal');
    const officer = selectInput(Auth.salesOfficers(), visit.officer || Auth.userName(), 'Select officer');

    form.appendChild(field('Employer', employer.el, true));
    form.appendChild(field('Date', date, true));
    form.appendChild(field('Type', type, true));
    form.appendChild(field('Officer', officer, false));
    form.appendChild(field('Outcome', outcome, false));
    form.appendChild(field('Next step', nextStep, false));

    return {
      el: form,
      values: function () {
        return {
          employer: employer.getValue(),
          date: date.value || Utils.todayISO(),
          type: type.value,
          officer: officer.value || null,
          outcome: outcome.value.trim(),
          nextStep: nextStep.value.trim()
        };
      },
      validate: function () {
        const v = this.values();
        const errs = [];
        if (!v.employer) errs.push('Employer is required.');
        if (!v.date) errs.push('Date is required.');
        return errs;
      }
    };
  }

  function openVisitForm(visit, onSaved) {
    const isEdit = !!visit;
    const form = buildVisitForm(visit);
    Components.modal({
      title: isEdit ? 'Edit Visit' : 'Log a Visit',
      body: form.el,
      actions: [
        { label: 'Cancel', class: 'btn--ghost', onClick: function (close) { close(); } },
        {
          label: isEdit ? 'Save' : 'Log Visit', class: 'btn--primary',
          onClick: function (close) {
            const errs = form.validate();
            if (errs.length) { Components.toast(errs[0], 'error'); return; }
            const data = form.values();
            const p = isEdit ? api.visits.update(visit.id, data) : api.visits.create(data);
            p.then(function () {
              close();
              Components.toast(isEdit ? 'Visit updated' : 'Visit logged', 'success');
              if (onSaved) onSaved();
            });
          }
        }
      ]
    });
  }

  let currentSearch = '';

  function loadVisits() {
    const container = document.getElementById('visitsTable');
    container.innerHTML = '';
    container.appendChild(Components.skeleton(5));
    api.visits.list().then(function (visits) {
      visits = visits.filter(function (v) { return Utils.textMatch(v, currentSearch, ['employer', 'officer', 'type', 'id']); });
      visits.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
      const tbl = Components.table({
        columns: [
          { key: 'id', label: 'Visit ID', render: function (r) { return r.id; } },
          { key: 'employer', label: 'Employer', render: function (r) { return r.employer; } },
          { key: 'date', label: 'Date', render: function (r) { return Utils.formatDate(r.date); } },
          { key: 'type', label: 'Type', render: function (r) { return Components.badge(typeTone(r.type), r.type); } },
          { key: 'officer', label: 'Officer', render: function (r) { return r.officer || '—'; } },
          { key: 'outcome', label: 'Outcome', render: function (r) { return r.outcome || '—'; } },
          { key: 'nextStep', label: 'Next Step', render: function (r) { return r.nextStep || '—'; } },
          {
            key: 'actions', label: 'Actions', sortable: false,
            render: function (r) {
              const w = Utils.el('div');
              w.style.display = 'flex';
              w.style.gap = '6px';
              const edit = Utils.el('button', 'btn btn--ghost btn--sm', 'Edit');
              edit.type = 'button';
              edit.addEventListener('click', function () { openVisitForm(r, loadVisits); });
              w.appendChild(edit);
              return w;
            }
          }
        ],
        rows: visits,
        empty: {
          title: 'No visits yet',
          text: 'Log your first visit or call.',
          actionLabel: 'Log Visit',
          onAction: function () { openVisitForm(null, loadVisits); }
        }
      });
      container.innerHTML = '';
      container.appendChild(tbl);
    });
  }

  function renderVisitsPage(view) {
    view.innerHTML = '';

    const addBtn = Utils.el('button', 'btn btn--primary', 'Log Visit');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () { openVisitForm(null, loadVisits); });

    view.appendChild(Components.pageHead({
      title: 'Visits',
      desc: 'Field visits, online meetings and calls. Fast to log on your phone.',
      actions: [addBtn]
    }));

    view.appendChild(Components.searchBox({
      placeholder: 'Search employer, officer or type',
      onInput: function (q) { currentSearch = q; loadVisits(); }
    }));

    const wrap = Utils.el('div');
    wrap.id = 'visitsTable';
    view.appendChild(wrap);

    loadVisits();
  }

  Router.route('/visits', renderVisitsPage, { screen: 'visits', title: 'Visits' });
})();

// pages/targets.js — Monthly Targets (#/targets).
// Only sales_head / admin / super_admin can edit. Officers view their own only.

(function () {
  const C = window.APP_CONSTANTS;

  function currentMonth() {
    return Utils.todayISO().slice(0, 7);
  }

  function prevMonth() {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function canEdit() {
    const r = Auth.getRole();
    return r === 'super_admin' || r === 'admin' || r === 'sales_head';
  }

  function scopeList(list) {
    const r = Auth.getRole();
    const me = Auth.userName();
    if (r === 'sales_officer' && me) {
      return list.filter(function (t) { return t.officer === me; });
    }
    return list;
  }

  let selectedMonth = currentMonth();
  let currentSearch = '';

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

  function monthInput(val) {
    const inp = Utils.el('input');
    inp.type = 'month';
    inp.value = val || '';
    return inp;
  }

  function buildTargetForm(t) {
    t = t || {};
    const form = Utils.el('div', 'form-grid');

    const officer = selectInput(Auth.salesOfficers(), t.officer, 'Select officer');
    const month = monthInput(t.month || currentMonth());
    const targetSales = Components.numberInput(t.targetSales, '0');
    const targetVisits = Components.numberInput(t.targetVisits, '0');
    const targetNewEmployers = Components.numberInput(t.targetNewEmployers, '0');
    const targetLeads = Components.numberInput(t.targetLeads, '0');

    form.appendChild(field('Officer', officer, true));
    form.appendChild(field('Month', month, true));
    form.appendChild(field('Target sales (BDT)', targetSales, false));
    form.appendChild(field('Target visits', targetVisits, false));
    form.appendChild(field('Target new employers', targetNewEmployers, false));
    form.appendChild(field('Target leads', targetLeads, false));

    return {
      el: form,
      values: function () {
        return {
          officer: officer.value,
          month: month.value || currentMonth(),
          targetSales: Number(targetSales.value) || 0,
          targetVisits: Number(targetVisits.value) || 0,
          targetNewEmployers: Number(targetNewEmployers.value) || 0,
          targetLeads: Number(targetLeads.value) || 0
        };
      },
      validate: function () {
        const v = this.values();
        const errs = [];
        if (!v.officer) errs.push('Officer is required.');
        if (!v.month) errs.push('Month is required.');
        return errs;
      }
    };
  }

  function openTargetForm(t, onSaved) {
    const isEdit = !!t;
    const form = buildTargetForm(t);
    Components.modal({
      title: isEdit ? 'Edit Target' : 'Add Target',
      body: form.el,
      actions: [
        { label: 'Cancel', class: 'btn--ghost', onClick: function (close) { close(); } },
        {
          label: isEdit ? 'Save Changes' : 'Add Target', class: 'btn--primary',
          onClick: function (close) {
            const errs = form.validate();
            if (errs.length) { Components.toast(errs[0], 'error'); return; }
            const data = form.values();
            const p = isEdit ? api.targets.update(t.id, data) : api.targets.create(data);
            p.then(function () {
              close();
              Components.toast(isEdit ? 'Target updated' : 'Target added', 'success');
              if (onSaved) onSaved();
            });
          }
        }
      ]
    });
  }

  function copyLastMonth() {
    api.targets.list().then(function (all) {
      const last = all.filter(function (t) { return t.month === prevMonth(); });
      const curOfficers = all.filter(function (t) { return t.month === currentMonth(); }).map(function (t) { return t.officer; });
      const toCopy = last.filter(function (t) { return curOfficers.indexOf(t.officer) === -1; });
      if (!toCopy.length) {
        Components.toast('Nothing to copy', 'info');
        return;
      }
      Promise.all(toCopy.map(function (t) {
        return api.targets.create({
          officer: t.officer, month: currentMonth(),
          targetSales: t.targetSales, targetVisits: t.targetVisits,
          targetNewEmployers: t.targetNewEmployers, targetLeads: t.targetLeads
        });
      })).then(function () {
        Components.toast('Copied last month\'s targets', 'success');
        loadTargets();
      });
    });
  }

  function loadTargets() {
    const container = document.getElementById('targetsTable');
    container.innerHTML = '';
    container.appendChild(Components.skeleton(5));
    api.targets.list().then(function (targets) {
      let rows = scopeList(targets).filter(function (t) { return t.month === selectedMonth; })
        .filter(function (t) { return Utils.textMatch(t, currentSearch, ['officer']); });
      const tbl = Components.table({
        columns: [
          { key: 'officer', label: 'Officer', render: function (r) { return r.officer; } },
          { key: 'month', label: 'Month', render: function (r) { return r.month; } },
          { key: 'targetSales', label: 'Target Sales', render: function (r) { return Utils.formatBDT(r.targetSales); } },
          { key: 'targetVisits', label: 'Target Visits', render: function (r) { return String(r.targetVisits); } },
          { key: 'targetNewEmployers', label: 'Target New Employers', render: function (r) { return String(r.targetNewEmployers); } },
          { key: 'targetLeads', label: 'Target Leads', render: function (r) { return String(r.targetLeads); } }
        ].concat(canEdit() ? [{
          key: 'actions', label: 'Actions', sortable: false,
          render: function (r) {
            const w = Utils.el('div');
            const edit = Utils.el('button', 'btn btn--ghost btn--sm', 'Edit');
            edit.type = 'button';
            edit.addEventListener('click', function () { openTargetForm(r, loadTargets); });
            w.appendChild(edit);
            return w;
          }
        }] : []),
        rows: rows,
        empty: {
          title: 'No targets for this month',
          text: canEdit() ? 'Add a target or copy last month.' : 'No targets assigned for this month.'
        }
      });
      container.innerHTML = '';
      container.appendChild(tbl);
    });
  }

  function renderTargetsPage(view) {
    view.innerHTML = '';

    const actions = [];
    const monthSel = monthInput(selectedMonth);
    monthSel.style.maxWidth = '160px';
    monthSel.addEventListener('change', function () { selectedMonth = monthSel.value || currentMonth(); loadTargets(); });
    actions.push(monthSel);

    if (canEdit()) {
      const copyBtn = Utils.el('button', 'btn btn--secondary', 'Copy Last Month');
      copyBtn.type = 'button';
      copyBtn.addEventListener('click', copyLastMonth);
      const addBtn = Utils.el('button', 'btn btn--primary', 'Add Target');
      addBtn.type = 'button';
      addBtn.addEventListener('click', function () { openTargetForm(null, loadTargets); });
      actions.push(copyBtn);
      actions.push(addBtn);
    }

    view.appendChild(Components.pageHead({
      title: 'Monthly Targets',
      desc: canEdit() ? 'Set and manage officer targets.' : 'Your monthly targets.',
      actions: actions
    }));

    view.appendChild(Components.searchBox({
      placeholder: 'Search officer',
      onInput: function (q) { currentSearch = q; loadTargets(); }
    }));

    const wrap = Utils.el('div');
    wrap.id = 'targetsTable';
    view.appendChild(wrap);

    loadTargets();
  }

  Router.route('/targets', renderTargetsPage, { screen: 'targets', title: 'Monthly Targets' });
})();

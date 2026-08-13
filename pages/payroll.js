// pages/payroll.js — Payroll Clients (#/payroll).
// PRIVACY RULE: payroll data is client-owned under contract. This screen shows
// ONLY client name, headcount, cycle status and service fee. It must NEVER show
// individual employee names or salary figures. Access is restricted by role.

(function () {
  const C = window.APP_CONSTANTS;

  function cycleTone(status) {
    switch (status) {
      case 'disbursed': return 'green';
      case 'ready for approval': return 'purple';
      case 'processing': return 'amber';
      case 'data pending': return 'gray';
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

  function buildPayrollForm(client) {
    client = client || {};
    const form = Utils.el('div', 'form-grid');

    const clientName = Components.searchableSelect(C.companies, client.clientName, 'Type to search client');
    const contractStart = Components.dateInput(client.contractStart);
    const headcount = Components.numberInput(client.headcount, '0');
    const cycleStatus = selectInput(C.payrollCycles, client.cycleStatus || 'data pending', false);
    const monthlyFee = Components.numberInput(client.monthlyFee, '0');
    const owner = textInput(client.owner, Auth.userName());

    form.appendChild(field('Client name', clientName.el, true));
    form.appendChild(field('Contract start', contractStart, false));
    form.appendChild(field('Headcount', headcount, false));
    form.appendChild(field('Cycle status', cycleStatus, true));
    form.appendChild(field('Monthly service fee (BDT)', monthlyFee, false));
    form.appendChild(field('Owner', owner, false));

    return {
      el: form,
      values: function () {
        return {
          clientName: clientName.getValue(),
          contractStart: contractStart.value || null,
          headcount: Number(headcount.value) || 0,
          cycleStatus: cycleStatus.value,
          monthlyFee: Number(monthlyFee.value) || 0,
          owner: owner.value.trim() || null
        };
      },
      validate: function () {
        const v = this.values();
        const errs = [];
        if (!v.clientName) errs.push('Client name is required.');
        return errs;
      }
    };
  }

  function openPayrollForm(client, onSaved) {
    const isEdit = !!client;
    const form = buildPayrollForm(client);
    Components.modal({
      title: isEdit ? 'Edit Payroll Client' : 'Add Payroll Client',
      body: form.el,
      actions: [
        { label: 'Cancel', class: 'btn--ghost', onClick: function (close) { close(); } },
        {
          label: isEdit ? 'Save Changes' : 'Add Client', class: 'btn--primary',
          onClick: function (close) {
            const errs = form.validate();
            if (errs.length) { Components.toast(errs[0], 'error'); return; }
            const data = form.values();
            const p = isEdit ? api.payrollClients.update(client.id, data) : api.payrollClients.create(data);
            p.then(function () {
              close();
              Components.toast(isEdit ? 'Client updated' : 'Client added', 'success');
              if (onSaved) onSaved();
            });
          }
        }
      ]
    });
  }

  let currentSearch = '';

  function loadPayroll() {
    const container = document.getElementById('payrollTable');
    container.innerHTML = '';
    container.appendChild(Components.skeleton(5));
    api.payrollClients.list().then(function (clients) {
      clients = clients.filter(function (c) { return Utils.textMatch(c, currentSearch, ['clientName', 'owner']); });
      const tbl = Components.table({
        columns: [
          { key: 'clientName', label: 'Client Name', render: function (r) { return r.clientName; } },
          { key: 'contractStart', label: 'Contract Start', render: function (r) { return Utils.formatDate(r.contractStart); } },
          { key: 'headcount', label: 'Headcount', render: function (r) { return String(r.headcount); } },
          { key: 'cycleStatus', label: 'Cycle Status', render: function (r) { return Components.badge(cycleTone(r.cycleStatus), r.cycleStatus); } },
          { key: 'monthlyFee', label: 'Monthly Service Fee', render: function (r) { return Utils.formatBDT(r.monthlyFee); } },
          { key: 'owner', label: 'Owner', render: function (r) { return r.owner || '—'; } },
          {
            key: 'actions', label: 'Actions', sortable: false,
            render: function (r) {
              const w = Utils.el('div');
              w.style.display = 'flex';
              w.style.gap = '6px';
              const edit = Utils.el('button', 'btn btn--ghost btn--sm', 'Edit');
              edit.type = 'button';
              edit.addEventListener('click', function () { openPayrollForm(r, loadPayroll); });
              w.appendChild(edit);
              return w;
            }
          }
        ],
        rows: clients,
        empty: {
          title: 'No payroll clients yet',
          text: 'Add your first payroll client.',
          actionLabel: 'Add Client',
          onAction: function () { openPayrollForm(null, loadPayroll); }
        }
      });
      container.innerHTML = '';
      container.appendChild(tbl);
    });
  }

  function renderPayrollPage(view) {
    view.innerHTML = '';

    const addBtn = Utils.el('button', 'btn btn--primary', 'Add Client');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () { openPayrollForm(null, loadPayroll); });

    view.appendChild(Components.pageHead({
      title: 'Payroll Clients',
      desc: 'Payroll operations for client companies.',
      actions: [addBtn]
    }));

    view.appendChild(Components.notice('purple', '<strong>Client-owned data under contract. All access is logged.</strong>'));
    view.appendChild(Components.notice('amber', 'Only client name, headcount, cycle status and service fee are shown here.'));

    view.appendChild(Components.searchBox({
      placeholder: 'Search client name',
      onInput: function (q) { currentSearch = q; loadPayroll(); }
    }));

    const wrap = Utils.el('div');
    wrap.id = 'payrollTable';
    view.appendChild(wrap);

    loadPayroll();
  }

  Router.route('/payroll', renderPayrollPage, { screen: 'payroll', title: 'Payroll Clients' });
})();

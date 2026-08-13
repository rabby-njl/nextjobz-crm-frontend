// pages/collections.js — Collections (#/collections).

(function () {
  const C = window.APP_CONSTANTS;

  function statusTone(status) {
    switch (status) {
      case 'paid': return 'green';
      case 'due': return 'amber';
      case 'partial': return 'amber';
      default: return 'gray';
    }
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

  function buildCollectionForm(inv) {
    inv = inv || {};
    const form = Utils.el('div', 'form-grid');

    const employer = Components.searchableSelect(C.companies, inv.employer, 'Type to search employer');
    const amount = Components.numberInput(inv.amount, '0');
    const dueDate = Components.dateInput(inv.dueDate);
    const paidDate = Components.dateInput(inv.paidDate);
    const status = selectInput(C.collectionStatuses, inv.status || 'due', false);
    const method = selectInput(C.collectionMethods, inv.method, 'Select method');

    form.appendChild(field('Employer', employer.el, true));
    form.appendChild(field('Amount (BDT)', amount, false));
    form.appendChild(field('Due date', dueDate, false));
    form.appendChild(field('Paid date', paidDate, false));
    form.appendChild(field('Status', status, true));
    form.appendChild(field('Method', method, false));

    return {
      el: form,
      values: function () {
        return {
          employer: employer.getValue(),
          amount: Number(amount.value) || 0,
          dueDate: dueDate.value || null,
          paidDate: paidDate.value || null,
          status: status.value,
          method: method.value || null
        };
      },
      validate: function () {
        const v = this.values();
        const errs = [];
        if (!v.employer) errs.push('Employer is required.');
        return errs;
      }
    };
  }

  function openCollectionForm(inv, onSaved) {
    const isEdit = !!inv;
    const form = buildCollectionForm(inv);
    Components.modal({
      title: isEdit ? 'Edit Invoice' : 'Add Invoice',
      body: form.el,
      actions: [
        { label: 'Cancel', class: 'btn--ghost', onClick: function (close) { close(); } },
        {
          label: isEdit ? 'Save Changes' : 'Add Invoice', class: 'btn--primary',
          onClick: function (close) {
            const errs = form.validate();
            if (errs.length) { Components.toast(errs[0], 'error'); return; }
            const data = form.values();
            const p = isEdit ? api.collections.update(inv.id, data) : api.collections.create(data);
            p.then(function () {
              close();
              Components.toast(isEdit ? 'Invoice updated' : 'Invoice added', 'success');
              if (onSaved) onSaved();
            });
          }
        }
      ]
    });
  }

  function daysOverdue(r) {
    if (r.status === 'paid') return null;
    const d = Utils.daysSince(r.dueDate);
    return d > 0 ? d : null;
  }

  let currentFilter = 'all';
  let currentSearch = '';
  const collectionsCache = { all: [] };

  function applyFilter(list) {
    if (currentFilter === 'due') return list.filter(function (r) { return r.status !== 'paid' && !daysOverdue(r); });
    if (currentFilter === 'overdue') return list.filter(function (r) { return daysOverdue(r) != null; });
    if (currentFilter === 'paid') return list.filter(function (r) { return r.status === 'paid'; });
    return list;
  }

  function loadCollections() {
    const container = document.getElementById('collectionsBody');
    container.innerHTML = '';
    container.appendChild(Components.skeleton(5));
    api.collections.list().then(function (all) {
      collectionsCache.all = all;

      const kpi = document.getElementById('collectionsKpi');
      if (kpi) {
        const unpaid = all.filter(function (r) { return r.status !== 'paid'; });
        let total = 0;
        unpaid.forEach(function (r) { total += Number(r.amount) || 0; });
        kpi.innerHTML = '';
        kpi.appendChild(Components.kpiGrid([
          { label: 'Total Outstanding', value: Utils.formatBDT(total), tone: 'amber', sub: unpaid.length + ' unpaid invoices' }
        ]));
      }

      const rows = applyFilter(all).filter(function (r) { return Utils.textMatch(r, currentSearch, ['employer', 'id']); });
      const tbl = Components.table({
        columns: [
          { key: 'id', label: 'Invoice ID', render: function (r) { return r.id; } },
          { key: 'employer', label: 'Employer', render: function (r) { return r.employer; } },
          { key: 'amount', label: 'Amount', render: function (r) { return Utils.formatBDT(r.amount); } },
          { key: 'dueDate', label: 'Due Date', render: function (r) { return Utils.formatDate(r.dueDate); } },
          { key: 'paidDate', label: 'Paid Date', render: function (r) { return Utils.formatDate(r.paidDate); } },
          { key: 'status', label: 'Status', render: function (r) { return Components.badge(statusTone(r.status), r.status); } },
          {
            key: 'overdue', label: 'Days Overdue',
            render: function (r) {
              const d = daysOverdue(r);
              return d == null ? '—' : Components.badge('red', d + 'd');
            }
          },
          { key: 'method', label: 'Method', render: function (r) { return r.method || '—'; } },
          {
            key: 'actions', label: 'Actions', sortable: false,
            render: function (r) {
              const w = Utils.el('div');
              w.style.display = 'flex';
              w.style.gap = '6px';
              const edit = Utils.el('button', 'btn btn--ghost btn--sm', 'Edit');
              edit.type = 'button';
              edit.addEventListener('click', function () { openCollectionForm(r, loadCollections); });
              w.appendChild(edit);
              return w;
            }
          }
        ],
        rows: rows,
        empty: {
          title: 'No invoices match',
          text: 'Change the filter or add a new invoice.',
          actionLabel: 'Add Invoice',
          onAction: function () { openCollectionForm(null, loadCollections); }
        }
      });
      container.innerHTML = '';
      container.appendChild(tbl);
    });
  }

  function renderCollectionsPage(view) {
    view.innerHTML = '';

    const addBtn = Utils.el('button', 'btn btn--primary', 'Add Invoice');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () { openCollectionForm(null, loadCollections); });

    view.appendChild(Components.pageHead({
      title: 'Collections',
      desc: 'Track what clients owe and what is overdue.',
      actions: [addBtn]
    }));

    const kpi = Utils.el('div');
    kpi.id = 'collectionsKpi';
    kpi.style.marginBottom = '16px';
    view.appendChild(kpi);

    view.appendChild(Components.chips({
      active: currentFilter,
      items: [
        { key: 'all', label: 'All' },
        { key: 'due', label: 'Due' },
        { key: 'overdue', label: 'Overdue' },
        { key: 'paid', label: 'Paid' }
      ],
      onSelect: function (key) { currentFilter = key; loadCollections(); }
    }));

    view.appendChild(Components.searchBox({
      placeholder: 'Search employer or invoice',
      onInput: function (q) { currentSearch = q; loadCollections(); }
    }));

    const wrap = Utils.el('div');
    wrap.id = 'collectionsBody';
    wrap.style.marginTop = '16px';
    view.appendChild(wrap);

    loadCollections();
  }

  Router.route('/collections', renderCollectionsPage, { screen: 'collections', title: 'Collections' });
})();

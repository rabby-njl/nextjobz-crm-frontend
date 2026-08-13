// pages/sales.js — Package Sales (#/sales).

(function () {
  const C = window.APP_CONSTANTS;

  function statusTone(status) {
    switch (status) {
      case 'active': return 'green';
      case 'confirmed': return 'purple';
      case 'pending': return 'gray';
      case 'expired': return 'red';
      case 'cancelled': return 'red';
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

  function buildOrderForm(order) {
    order = order || {};
    const form = Utils.el('div', 'form-grid');

    const employer = Components.searchableSelect(C.companies, order.employer, 'Type to search employer');
    const service = selectInput(C.services, order.service, 'Select service');
    const amount = Components.numberInput(order.amount, '0');
    const status = selectInput(C.orderStatuses, order.status || 'pending', false);
    const startDate = Components.dateInput(order.startDate);
    const endDate = Components.dateInput(order.endDate);
    const officer = selectInput(C.salesOfficers, order.officer, 'Select officer');

    form.appendChild(field('Employer', employer.el, true));
    form.appendChild(field('Service', service, false));
    form.appendChild(field('Amount (BDT)', amount, false));
    form.appendChild(field('Status', status, true));
    form.appendChild(field('Start date', startDate, false));
    form.appendChild(field('End date', endDate, false));
    form.appendChild(field('Officer', officer, false));

    return {
      el: form,
      values: function () {
        return {
          employer: employer.getValue(),
          service: service.value,
          amount: Number(amount.value) || 0,
          status: status.value,
          startDate: startDate.value || null,
          endDate: endDate.value || null,
          officer: officer.value || null
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

  function openOrderForm(order, onSaved) {
    const isEdit = !!order;
    const form = buildOrderForm(order);
    Components.modal({
      title: isEdit ? 'Edit Package Sale' : 'Add Package Sale',
      body: form.el,
      actions: [
        { label: 'Cancel', class: 'btn--ghost', onClick: function (close) { close(); } },
        {
          label: isEdit ? 'Save Changes' : 'Add Package', class: 'btn--primary',
          onClick: function (close) {
            const errs = form.validate();
            if (errs.length) { Components.toast(errs[0], 'error'); return; }
            const data = form.values();
            const p = isEdit ? api.orders.update(order.id, data) : api.orders.create(data);
            p.then(function () {
              close();
              Components.toast(isEdit ? 'Package updated' : 'Package added', 'success');
              if (onSaved) onSaved();
            });
          }
        }
      ]
    });
  }

  function isEndingSoon(r) {
    if (r.status !== 'active') return false;
    const d = Utils.daysUntil(r.endDate);
    return d != null && d <= 30;
  }

  function endCell(r) {
    if (isEndingSoon(r)) {
      const d = Utils.daysUntil(r.endDate);
      const w = Utils.el('div');
      w.appendChild(Utils.el('div', '', Utils.formatDate(r.endDate)));
      w.appendChild(Components.badge('amber', d < 0 ? 'Overdue ' + (-d) + 'd' : 'Ends in ' + d + 'd'));
      return w;
    }
    return Utils.formatDate(r.endDate);
  }

  let currentSearch = '';

  function loadSales() {
    const container = document.getElementById('salesTable');
    container.innerHTML = '';
    container.appendChild(Components.skeleton(5));
    api.orders.list().then(function (orders) {
      orders = orders.filter(function (o) { return Utils.textMatch(o, currentSearch, ['employer', 'service', 'officer', 'id']); });
      const tbl = Components.table({
        rowClass: function (r) { return isEndingSoon(r) ? 'row-amber' : ''; },
        columns: [
          { key: 'id', label: 'Order ID', render: function (r) { return r.id; } },
          { key: 'employer', label: 'Employer', render: function (r) { return r.employer; } },
          { key: 'service', label: 'Service', render: function (r) { return r.service; } },
          { key: 'amount', label: 'Amount', render: function (r) { return Utils.formatBDT(r.amount); } },
          { key: 'status', label: 'Status', render: function (r) { return Components.badge(statusTone(r.status), r.status); } },
          { key: 'startDate', label: 'Start', render: function (r) { return Utils.formatDate(r.startDate); } },
          { key: 'endDate', label: 'End', render: endCell },
          { key: 'officer', label: 'Officer', render: function (r) { return r.officer || '—'; } },
          {
            key: 'actions', label: 'Actions', sortable: false,
            render: function (r) {
              const w = Utils.el('div');
              w.style.display = 'flex';
              w.style.gap = '6px';
              const edit = Utils.el('button', 'btn btn--ghost btn--sm', 'Edit');
              edit.type = 'button';
              edit.addEventListener('click', function () { openOrderForm(r, loadSales); });
              w.appendChild(edit);
              return w;
            }
          }
        ],
        rows: orders,
        empty: {
          title: 'No package sales yet',
          text: 'Add your first package sale when a client buys a service.',
          actionLabel: 'Add Package',
          onAction: function () { openOrderForm(null, loadSales); }
        }
      });
      container.innerHTML = '';
      container.appendChild(tbl);
    });
  }

  function renderSalesPage(view) {
    view.innerHTML = '';

    const addBtn = Utils.el('button', 'btn btn--primary', 'Add Package');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () { openOrderForm(null, loadSales); });

    view.appendChild(Components.pageHead({
      title: 'Package Sales',
      desc: 'Service packages sold to employers. Amber rows end within 30 days.',
      actions: [addBtn]
    }));

    view.appendChild(Components.searchBox({
      placeholder: 'Search employer or service',
      onInput: function (q) { currentSearch = q; loadSales(); }
    }));

    const wrap = Utils.el('div');
    wrap.id = 'salesTable';
    view.appendChild(wrap);

    loadSales();
  }

  Router.route('/sales', renderSalesPage, { screen: 'sales', title: 'Package Sales' });
})();

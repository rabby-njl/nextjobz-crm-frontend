// pages/vendors.js — Vendors and Bills (#/vendors).

(function () {
  const C = window.APP_CONSTANTS;

  function statusTone(status) {
    switch (status) {
      case 'paid': return 'green';
      case 'forwarded for approval': return 'amber';
      case 'verified': return 'purple';
      case 'received': return 'gray';
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

  function monthInput(val) {
    const inp = Utils.el('input');
    inp.type = 'month';
    inp.value = val || '';
    return inp;
  }

  function buildVendorForm(vendor) {
    vendor = vendor || {};
    const form = Utils.el('div', 'form-grid');

    const name = textInput(vendor.vendor, 'Vendor name');
    const serviceType = selectInput(C.vendorServiceTypes, vendor.serviceType, 'Select service type');
    const billMonth = monthInput(vendor.billMonth);
    const amount = Components.numberInput(vendor.amount, '0');
    const status = selectInput(C.vendorStatuses, vendor.status || 'received', false);
    const verifiedBy = textInput(vendor.verifiedBy, 'Marketing One');

    form.appendChild(field('Vendor', name, true));
    form.appendChild(field('Service type', serviceType, false));
    form.appendChild(field('Bill month', billMonth, false));
    form.appendChild(field('Amount (BDT)', amount, false));
    form.appendChild(field('Status', status, true));
    form.appendChild(field('Verified by', verifiedBy, false));

    return {
      el: form,
      values: function () {
        return {
          vendor: name.value.trim(),
          serviceType: serviceType.value,
          billMonth: billMonth.value || null,
          amount: Number(amount.value) || 0,
          status: status.value,
          verifiedBy: verifiedBy.value.trim() || null
        };
      },
      validate: function () {
        const v = this.values();
        const errs = [];
        if (!v.vendor) errs.push('Vendor name is required.');
        return errs;
      }
    };
  }

  function openVendorForm(vendor, onSaved) {
    const isEdit = !!vendor;
    const form = buildVendorForm(vendor);
    Components.modal({
      title: isEdit ? 'Edit Vendor Bill' : 'Add Vendor Bill',
      body: form.el,
      actions: [
        { label: 'Cancel', class: 'btn--ghost', onClick: function (close) { close(); } },
        {
          label: isEdit ? 'Save Changes' : 'Add Bill', class: 'btn--primary',
          onClick: function (close) {
            const errs = form.validate();
            if (errs.length) { Components.toast(errs[0], 'error'); return; }
            const data = form.values();
            const p = isEdit ? api.vendors.update(vendor.id, data) : api.vendors.create(data);
            p.then(function () {
              close();
              Components.toast(isEdit ? 'Bill updated' : 'Bill added', 'success');
              if (onSaved) onSaved();
            });
          }
        }
      ]
    });
  }

  let currentSearch = '';

  function loadVendors() {
    const container = document.getElementById('vendorsTable');
    container.innerHTML = '';
    container.appendChild(Components.skeleton(5));
    api.vendors.list().then(function (vendors) {
      vendors = vendors.filter(function (v) { return Utils.textMatch(v, currentSearch, ['vendor', 'serviceType']); });
      const tbl = Components.table({
        columns: [
          { key: 'vendor', label: 'Vendor', render: function (r) { return r.vendor; } },
          { key: 'serviceType', label: 'Service Type', render: function (r) { return r.serviceType; } },
          { key: 'billMonth', label: 'Bill Month', render: function (r) { return r.billMonth || '—'; } },
          { key: 'amount', label: 'Amount', render: function (r) { return Utils.formatBDT(r.amount); } },
          { key: 'status', label: 'Status', render: function (r) { return Components.badge(statusTone(r.status), r.status); } },
          { key: 'verifiedBy', label: 'Verified By', render: function (r) { return r.verifiedBy || '—'; } },
          {
            key: 'actions', label: 'Actions', sortable: false,
            render: function (r) {
              const w = Utils.el('div');
              w.style.display = 'flex';
              w.style.gap = '6px';
              const edit = Utils.el('button', 'btn btn--ghost btn--sm', 'Edit');
              edit.type = 'button';
              edit.addEventListener('click', function () { openVendorForm(r, loadVendors); });
              w.appendChild(edit);
              return w;
            }
          }
        ],
        rows: vendors,
        empty: {
          title: 'No vendor bills yet',
          text: 'Add your first vendor bill.',
          actionLabel: 'Add Bill',
          onAction: function () { openVendorForm(null, loadVendors); }
        }
      });
      container.innerHTML = '';
      container.appendChild(tbl);
    });
  }

  function renderVendorsPage(view) {
    view.innerHTML = '';

    const addBtn = Utils.el('button', 'btn btn--primary', 'Add Bill');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () { openVendorForm(null, loadVendors); });

    view.appendChild(Components.pageHead({
      title: 'Vendors & Bills',
      desc: 'Vendor bill checking for content, creative, SEO and media buying.',
      actions: [addBtn]
    }));

    view.appendChild(Components.searchBox({
      placeholder: 'Search vendor or service type',
      onInput: function (q) { currentSearch = q; loadVendors(); }
    }));

    const wrap = Utils.el('div');
    wrap.id = 'vendorsTable';
    view.appendChild(wrap);

    loadVendors();
  }

  Router.route('/vendors', renderVendorsPage, { screen: 'vendors', title: 'Vendors & Bills' });
})();

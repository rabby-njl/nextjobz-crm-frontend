// pages/proposals.js — Proposals (#/proposals).

(function () {
  const C = window.APP_CONSTANTS;

  function statusTone(status) {
    switch (status) {
      case 'won': return 'green';
      case 'sent': return 'purple';
      case 'under review': return 'amber';
      case 'draft': return 'gray';
      case 'lost': return 'red';
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

  function buildProposalForm(prop) {
    prop = prop || {};
    const form = Utils.el('div', 'form-grid');

    const client = Components.searchableSelect(C.companies, prop.client, 'Type to search client');
    const service = selectInput(C.services, prop.service, 'Select service');
    const value = Components.numberInput(prop.value, '0');
    const sentDate = Components.dateInput(prop.sentDate);
    const status = selectInput(C.proposalStatuses, prop.status || 'draft', false);
    const owner = selectInput(Auth.recruiters(), prop.owner, 'Select owner');

    form.appendChild(field('Client', client.el, true));
    form.appendChild(field('Service', service, false));
    form.appendChild(field('Value (BDT)', value, false));
    form.appendChild(field('Sent date', sentDate, false));
    form.appendChild(field('Status', status, true));
    form.appendChild(field('Owner', owner, false));

    return {
      el: form,
      values: function () {
        return {
          client: client.getValue(),
          service: service.value,
          value: Number(value.value) || 0,
          sentDate: sentDate.value || null,
          status: status.value,
          owner: owner.value || null
        };
      },
      validate: function () {
        const v = this.values();
        const errs = [];
        if (!v.client) errs.push('Client is required.');
        return errs;
      }
    };
  }

  function openProposalForm(prop, onSaved) {
    const isEdit = !!prop;
    const form = buildProposalForm(prop);
    Components.modal({
      title: isEdit ? 'Edit Proposal' : 'Add Proposal',
      body: form.el,
      actions: [
        { label: 'Cancel', class: 'btn--ghost', onClick: function (close) { close(); } },
        {
          label: isEdit ? 'Save Changes' : 'Add Proposal', class: 'btn--primary',
          onClick: function (close) {
            const errs = form.validate();
            if (errs.length) { Components.toast(errs[0], 'error'); return; }
            const data = form.values();
            const p = isEdit ? api.proposals.update(prop.id, data) : api.proposals.create(data);
            p.then(function () {
              close();
              Components.toast(isEdit ? 'Proposal updated' : 'Proposal added', 'success');
              if (onSaved) onSaved();
            });
          }
        }
      ]
    });
  }

  let currentSearch = '';

  function loadProposals() {
    const container = document.getElementById('propTable');
    container.innerHTML = '';
    container.appendChild(Components.skeleton(5));
    api.proposals.list().then(function (proposals) {
      proposals = proposals.filter(function (p) { return Utils.textMatch(p, currentSearch, ['client', 'service', 'id']); });
      proposals.sort(function (a, b) { return String(b.sentDate || '').localeCompare(String(a.sentDate || '')); });
      const tbl = Components.table({
        columns: [
          { key: 'id', label: 'Proposal ID', render: function (r) { return r.id; } },
          { key: 'client', label: 'Client', render: function (r) { return r.client; } },
          { key: 'service', label: 'Service', render: function (r) { return r.service; } },
          { key: 'value', label: 'Value', render: function (r) { return Utils.formatBDT(r.value); } },
          { key: 'sentDate', label: 'Sent Date', render: function (r) { return Utils.formatDate(r.sentDate); } },
          { key: 'status', label: 'Status', render: function (r) { return Components.badge(statusTone(r.status), r.status); } },
          { key: 'owner', label: 'Owner', render: function (r) { return r.owner || '—'; } },
          {
            key: 'actions', label: 'Actions', sortable: false,
            render: function (r) {
              const w = Utils.el('div');
              w.style.display = 'flex';
              w.style.gap = '6px';
              const edit = Utils.el('button', 'btn btn--ghost btn--sm', 'Edit');
              edit.type = 'button';
              edit.addEventListener('click', function () { openProposalForm(r, loadProposals); });
              w.appendChild(edit);
              return w;
            }
          }
        ],
        rows: proposals,
        empty: {
          title: 'No proposals yet',
          text: 'Add your first proposal.',
          actionLabel: 'Add Proposal',
          onAction: function () { openProposalForm(null, loadProposals); }
        }
      });
      container.innerHTML = '';
      container.appendChild(tbl);
    });
  }

  function renderProposalsPage(view) {
    view.innerHTML = '';

    const addBtn = Utils.el('button', 'btn btn--primary', 'Add Proposal');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () { openProposalForm(null, loadProposals); });

    view.appendChild(Components.pageHead({
      title: 'Proposals',
      desc: 'RPO, payroll and staffing proposals sent to clients.',
      actions: [addBtn]
    }));

    view.appendChild(Components.searchBox({
      placeholder: 'Search client or service',
      onInput: function (q) { currentSearch = q; loadProposals(); }
    }));

    const wrap = Utils.el('div');
    wrap.id = 'propTable';
    view.appendChild(wrap);

    loadProposals();
  }

  Router.route('/proposals', renderProposalsPage, { screen: 'proposals', title: 'Proposals' });
})();

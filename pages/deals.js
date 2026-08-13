// pages/deals.js — Opportunities (#/deals): list view + draggable Kanban view.

(function () {
  const C = window.APP_CONSTANTS;

  function stageTone(stage) {
    switch (stage) {
      case 'won': return 'green';
      case 'prospecting': return 'gray';
      case 'demo': return 'purple';
      case 'quotation': return 'amber';
      case 'negotiation': return 'amber';
      case 'lost': return 'red';
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

  function buildDealForm(deal) {
    deal = deal || {};
    const form = Utils.el('div', 'form-grid');

    const employer = Components.searchableSelect(C.companies, deal.employer, 'Type to search employer');
    const service = selectInput(C.services, deal.service, 'Select service');
    const stage = selectInput(C.dealStages, deal.stage || 'prospecting', false);
    const value = Components.numberInput(deal.value, '0');
    const officer = selectInput(C.salesOfficers, deal.officer, 'Select officer');
    const expectedClose = Components.dateInput(deal.expectedClose);

    form.appendChild(field('Employer', employer.el, true));
    form.appendChild(field('Service', service, false));
    form.appendChild(field('Stage', stage, true));
    form.appendChild(field('Value (BDT)', value, false));
    form.appendChild(field('Officer', officer, false));
    form.appendChild(field('Expected close', expectedClose, false));

    return {
      el: form,
      values: function () {
        return {
          employer: employer.getValue(),
          service: service.value,
          stage: stage.value,
          value: Number(value.value) || 0,
          officer: officer.value || null,
          expectedClose: expectedClose.value || null
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

  function openDealForm(deal, onSaved) {
    const isEdit = !!deal;
    const form = buildDealForm(deal);
    Components.modal({
      title: isEdit ? 'Edit Deal' : 'Add New Deal',
      body: form.el,
      actions: [
        { label: 'Cancel', class: 'btn--ghost', onClick: function (close) { close(); } },
        {
          label: isEdit ? 'Save Changes' : 'Add Deal', class: 'btn--primary',
          onClick: function (close) {
            const errs = form.validate();
            if (errs.length) { Components.toast(errs[0], 'error'); return; }
            const data = form.values();
            data.lastActivity = Utils.todayISO();
            const p = isEdit ? api.deals.update(deal.id, data) : api.deals.create(data);
            p.then(function () {
              close();
              Components.toast(isEdit ? 'Deal updated' : 'Deal added', 'success');
              if (onSaved) onSaved();
            });
          }
        }
      ]
    });
  }

  /* ---------------- state ---------------- */

  let currentView = 'list';
  let currentSearch = '';
  let dealsCache = [];

  function loadDeals() {
    const container = document.getElementById('dealContent');
    container.innerHTML = '';
    container.appendChild(Components.skeleton(5));
    api.deals.list().then(function (deals) {
      deals = deals.filter(function (d) { return Utils.textMatch(d, currentSearch, ['employer', 'service', 'officer', 'id']); });
      dealsCache = deals;
      if (currentView === 'kanban') renderKanban(container, deals);
      else renderListTable(container, deals);
    });
  }

  function daysCell(r) {
    const d = Utils.daysSince(r.lastActivity);
    if (d == null) return '—';
    return Components.badge(Utils.ageTone(d), d + 'd');
  }

  function renderListTable(container, deals) {
    const tbl = Components.table({
      columns: [
        { key: 'id', label: 'Deal ID', render: function (r) { return r.id; } },
        { key: 'employer', label: 'Employer', render: function (r) { return r.employer; } },
        { key: 'service', label: 'Service', render: function (r) { return r.service; } },
        { key: 'stage', label: 'Stage', render: function (r) { return Components.badge(stageTone(r.stage), r.stage); } },
        { key: 'value', label: 'Value', render: function (r) { return Utils.formatBDT(r.value); } },
        { key: 'officer', label: 'Officer', render: function (r) { return r.officer || '—'; } },
        { key: 'expectedClose', label: 'Expected Close', render: function (r) { return Utils.formatDate(r.expectedClose); } },
        { key: 'days', label: 'Days Untouched', render: daysCell },
        {
          key: 'actions', label: 'Actions', sortable: false,
          render: function (r) {
            const w = Utils.el('div');
            w.style.display = 'flex';
            w.style.gap = '6px';
            const edit = Utils.el('button', 'btn btn--ghost btn--sm', 'Edit');
            edit.type = 'button';
            edit.addEventListener('click', function () { openDealForm(r, loadDeals); });
            w.appendChild(edit);
            return w;
          }
        }
      ],
      rows: deals,
      empty: {
        title: 'No deals yet',
        text: 'Add your first opportunity to track the pipeline.',
        actionLabel: 'Add Deal',
        onAction: function () { openDealForm(null, loadDeals); }
      }
    });
    container.innerHTML = '';
    container.appendChild(tbl);
  }

  function moveDeal(id, stage) {
    api.deals.update(id, { stage: stage }).then(function () {
      Components.toast('Moved to ' + stage, 'success');
      loadDeals();
    });
  }

  function renderKanban(container, deals) {
    const board = Utils.el('div', 'kanban');
    C.dealStages.forEach(function (stage) {
      const col = Utils.el('div', 'kanban-col');
      const head = Utils.el('div', 'kanban-col-head');
      const items = deals.filter(function (d) { return d.stage === stage; });
      head.appendChild(Utils.el('span', '', stage));
      head.appendChild(Utils.el('span', 'kanban-count', String(items.length)));

      const body = Utils.el('div', 'kanban-col-body');
      body.setAttribute('data-stage', stage);
      body.addEventListener('dragover', function (e) { e.preventDefault(); });
      body.addEventListener('drop', function (e) {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        if (id) moveDeal(id, stage);
      });

      if (!items.length) {
        body.appendChild(Utils.el('div', 'kanban-empty', 'No deals'));
      }
      items.forEach(function (d) {
        const card = Utils.el('div', 'kanban-card');
        card.draggable = true;
        card.setAttribute('data-deal', d.id);
        card.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', d.id); });
        card.appendChild(Utils.el('div', 'k-title', d.employer));
        card.appendChild(Utils.el('div', 'k-sub', Utils.formatBDT(d.value) + ' · ' + (d.officer || '')));
        body.appendChild(card);
      });

      col.appendChild(head);
      col.appendChild(body);
      board.appendChild(col);
    });
    container.innerHTML = '';
    container.appendChild(board);
  }

  function renderDealsPage(view) {
    view.innerHTML = '';

    const addBtn = Utils.el('button', 'btn btn--primary', 'Add Deal');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () { openDealForm(null, loadDeals); });

    view.appendChild(Components.pageHead({
      title: 'Deals',
      desc: 'Opportunities across your pipeline.',
      actions: [addBtn]
    }));

    view.appendChild(Components.chips({
      active: currentView,
      items: [
        { key: 'list', label: 'List' },
        { key: 'kanban', label: 'Kanban' }
      ],
      onSelect: function (key) { currentView = key; loadDeals(); }
    }));

    view.appendChild(Components.searchBox({
      placeholder: 'Search employer, service or officer',
      onInput: function (q) { currentSearch = q; loadDeals(); }
    }));

    const content = Utils.el('div');
    content.id = 'dealContent';
    content.style.marginTop = '16px';
    view.appendChild(content);

    loadDeals();
  }

  Router.route('/deals', renderDealsPage, { screen: 'deals', title: 'Deals' });
})();

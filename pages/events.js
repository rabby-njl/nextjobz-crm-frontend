// pages/events.js — Event & Activation Leads (#/events).

(function () {
  const C = window.APP_CONSTANTS;

  function statusTone(status) {
    switch (status) {
      case 'confirmed': return 'green';
      case 'completed': return 'green';
      case 'proposal sent': return 'purple';
      case 'new': return 'gray';
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

  function buildEventForm(ev) {
    ev = ev || {};
    const form = Utils.el('div', 'form-grid');

    const organisation = Components.searchableSelect(C.companies, ev.organisation, 'Type to search organisation');
    const eventType = selectInput(C.eventTypes, ev.eventType, 'Select event type');
    const proposedDate = Components.dateInput(ev.proposedDate);
    const value = Components.numberInput(ev.value, '0');
    const status = selectInput(C.eventStatuses, ev.status || 'new', false);
    const owner = selectInput(['Events One'], ev.owner || 'Events One', false);
    const source = selectInput(C.eventSources, ev.source, 'Select source');

    form.appendChild(field('Organisation', organisation.el, true));
    form.appendChild(field('Event type', eventType, false));
    form.appendChild(field('Proposed date', proposedDate, false));
    form.appendChild(field('Value (BDT)', value, false));
    form.appendChild(field('Status', status, true));
    form.appendChild(field('Owner', owner, false));
    form.appendChild(field('Lead source', source, false));

    return {
      el: form,
      values: function () {
        return {
          organisation: organisation.getValue(),
          eventType: eventType.value,
          proposedDate: proposedDate.value || null,
          value: Number(value.value) || 0,
          status: status.value,
          owner: owner.value || null,
          source: source.value || null
        };
      },
      validate: function () {
        const v = this.values();
        const errs = [];
        if (!v.organisation) errs.push('Organisation is required.');
        return errs;
      }
    };
  }

  function openEventForm(ev, onSaved) {
    const isEdit = !!ev;
    const form = buildEventForm(ev);
    Components.modal({
      title: isEdit ? 'Edit Event Lead' : 'Add Event Lead',
      body: form.el,
      actions: [
        { label: 'Cancel', class: 'btn--ghost', onClick: function (close) { close(); } },
        {
          label: isEdit ? 'Save Changes' : 'Add Event Lead', class: 'btn--primary',
          onClick: function (close) {
            const errs = form.validate();
            if (errs.length) { Components.toast(errs[0], 'error'); return; }
            const data = form.values();
            const p = isEdit ? api.events.update(ev.id, data) : api.events.create(data);
            p.then(function () {
              close();
              Components.toast(isEdit ? 'Event lead updated' : 'Event lead added', 'success');
              if (onSaved) onSaved();
            });
          }
        }
      ]
    });
  }

  let currentSearch = '';

  function loadEvents() {
    const container = document.getElementById('eventsTable');
    container.innerHTML = '';
    container.appendChild(Components.skeleton(5));
    api.events.list().then(function (events) {
      events = events.filter(function (e) { return Utils.textMatch(e, currentSearch, ['organisation', 'eventType', 'id']); });
      const tbl = Components.table({
        columns: [
          { key: 'id', label: 'Event Lead ID', render: function (r) { return r.id; } },
          { key: 'organisation', label: 'Organisation', render: function (r) { return r.organisation; } },
          { key: 'eventType', label: 'Event Type', render: function (r) { return r.eventType; } },
          { key: 'proposedDate', label: 'Proposed Date', render: function (r) { return Utils.formatDate(r.proposedDate); } },
          { key: 'value', label: 'Value', render: function (r) { return Utils.formatBDT(r.value); } },
          { key: 'status', label: 'Status', render: function (r) { return Components.badge(statusTone(r.status), r.status); } },
          { key: 'owner', label: 'Owner', render: function (r) { return r.owner || '—'; } },
          { key: 'source', label: 'Source', render: function (r) { return Components.badge('purple', r.source || '—'); } },
          {
            key: 'actions', label: 'Actions', sortable: false,
            render: function (r) {
              const w = Utils.el('div');
              w.style.display = 'flex';
              w.style.gap = '6px';
              const edit = Utils.el('button', 'btn btn--ghost btn--sm', 'Edit');
              edit.type = 'button';
              edit.addEventListener('click', function () { openEventForm(r, loadEvents); });
              w.appendChild(edit);
              return w;
            }
          }
        ],
        rows: events,
        empty: {
          title: 'No event leads yet',
          text: 'Add your first event or activation lead.',
          actionLabel: 'Add Event Lead',
          onAction: function () { openEventForm(null, loadEvents); }
        }
      });
      container.innerHTML = '';
      container.appendChild(tbl);
    });
  }

  function renderEventsPage(view) {
    view.innerHTML = '';

    const addBtn = Utils.el('button', 'btn btn--primary', 'Add Event Lead');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () { openEventForm(null, loadEvents); });

    view.appendChild(Components.pageHead({
      title: 'Events & Activations',
      desc: 'Event and activation leads. Most arrive from the CRM team.',
      actions: [addBtn]
    }));

    view.appendChild(Components.searchBox({
      placeholder: 'Search organisation or event type',
      onInput: function (q) { currentSearch = q; loadEvents(); }
    }));

    const wrap = Utils.el('div');
    wrap.id = 'eventsTable';
    view.appendChild(wrap);

    loadEvents();
  }

  Router.route('/events', renderEventsPage, { screen: 'events', title: 'Events & Activations' });
})();

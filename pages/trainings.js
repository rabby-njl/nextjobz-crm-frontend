// pages/trainings.js — LearningLab Training business module (#/trainings).
// Covers internal, external and government/public training businesses.

(function () {
  const TYPES = ['Internal Training', 'External Training', 'Government / Public Training'];
  const STATUSES = ['planned', 'ongoing', 'completed', 'cancelled'];

  function statusTone(status) {
    switch (status) {
      case 'completed': return 'green';
      case 'ongoing': return 'purple';
      case 'planned': return 'amber';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  }

  function typeTone(type) {
    switch (type) {
      case 'Government / Public Training': return 'green';
      case 'External Training': return 'purple';
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

  function buildTrainingForm(t) {
    t = t || {};
    const form = Utils.el('div', 'form-grid');

    const title = textInput(t.title, 'Training program title');
    const type = selectInput(TYPES, t.type, 'Select type');
    const client = textInput(t.client, 'Client / organisation');
    const trainer = textInput(t.trainer, 'Trainer name');
    const participants = Components.numberInput(t.participants, '0');
    const revenue = Components.numberInput(t.revenue, '0');
    const startDate = Components.dateInput(t.startDate);
    const endDate = Components.dateInput(t.endDate);
    const status = selectInput(STATUSES, t.status || 'planned', false);

    form.appendChild(field('Program title', title, true));
    form.appendChild(field('Type', type, true));
    form.appendChild(field('Client / organisation', client, false));
    form.appendChild(field('Trainer', trainer, false));
    form.appendChild(field('Participants', participants, false));
    form.appendChild(field('Revenue (BDT)', revenue, false));
    form.appendChild(field('Start date', startDate, false));
    form.appendChild(field('End date', endDate, false));
    form.appendChild(field('Status', status, true));

    return {
      el: form,
      values: function () {
        return {
          title: title.value.trim(),
          type: type.value,
          client: client.value.trim(),
          trainer: trainer.value.trim(),
          participants: Number(participants.value) || 0,
          revenue: Number(revenue.value) || 0,
          startDate: startDate.value || null,
          endDate: endDate.value || null,
          status: status.value
        };
      },
      validate: function () {
        const v = this.values();
        const errs = [];
        if (!v.title) errs.push('Program title is required.');
        if (!v.type) errs.push('Type is required.');
        return errs;
      }
    };
  }

  function openTrainingForm(t, onSaved) {
    const isEdit = !!t;
    const form = buildTrainingForm(t);
    Components.modal({
      title: isEdit ? 'Edit Training Program' : 'Add Training Program',
      body: form.el,
      actions: [
        { label: 'Cancel', class: 'btn--ghost', onClick: function (close) { close(); } },
        {
          label: isEdit ? 'Save Changes' : 'Add Program', class: 'btn--primary',
          onClick: function (close) {
            const errs = form.validate();
            if (errs.length) { Components.toast(errs[0], 'error'); return; }
            const data = form.values();
            const p = isEdit ? api.trainings.update(t.id, data) : api.trainings.create(data);
            p.then(function () {
              close();
              Components.toast(isEdit ? 'Program updated' : 'Program added', 'success');
              if (onSaved) onSaved();
            });
          }
        }
      ]
    });
  }

  let currentFilter = 'all';

  function applyFilter(list) {
    if (currentFilter === 'all') return list;
    return list.filter(function (t) { return t.type === currentFilter; });
  }

  function loadTrainings() {
    const container = document.getElementById('trainingsTable');
    container.innerHTML = '';
    container.appendChild(Components.skeleton(5));
    api.trainings.list().then(function (all) {
      const kpi = document.getElementById('trainingsKpi');
      if (kpi) {
        const totalRevenue = all.reduce(function (s, t) { return s + (Number(t.revenue) || 0); }, 0);
        const totalParticipants = all.reduce(function (s, t) { return s + (Number(t.participants) || 0); }, 0);
        kpi.innerHTML = '';
        kpi.appendChild(Components.kpiGrid([
          { label: 'Training Programs', value: String(all.length), tone: 'purple' },
          { label: 'Total Revenue', value: Utils.formatBDT(totalRevenue), tone: 'green' },
          { label: 'Participants', value: String(totalParticipants), tone: 'amber' }
        ]));
      }

      const rows = applyFilter(all);
      const tbl = Components.table({
        columns: [
          { key: 'title', label: 'Program', render: function (r) { return r.title; } },
          { key: 'type', label: 'Type', render: function (r) { return Components.badge(typeTone(r.type), r.type); } },
          { key: 'client', label: 'Client / Org', render: function (r) { return r.client || '—'; } },
          { key: 'trainer', label: 'Trainer', render: function (r) { return r.trainer || '—'; } },
          { key: 'participants', label: 'Participants', render: function (r) { return String(r.participants || 0); } },
          { key: 'revenue', label: 'Revenue', render: function (r) { return Utils.formatBDT(r.revenue); } },
          { key: 'startDate', label: 'Start', render: function (r) { return Utils.formatDate(r.startDate); } },
          { key: 'endDate', label: 'End', render: function (r) { return Utils.formatDate(r.endDate); } },
          { key: 'status', label: 'Status', render: function (r) { return Components.badge(statusTone(r.status), r.status); } },
          {
            key: 'actions', label: 'Actions', sortable: false,
            render: function (r) {
              const w = Utils.el('div');
              const edit = Utils.el('button', 'btn btn--ghost btn--sm', 'Edit');
              edit.type = 'button';
              edit.addEventListener('click', function () { openTrainingForm(r, loadTrainings); });
              w.appendChild(edit);
              return w;
            }
          }
        ],
        rows: rows,
        empty: {
          title: 'No training programs yet',
          text: 'Add your first training program.',
          actionLabel: 'Add Program',
          onAction: function () { openTrainingForm(null, loadTrainings); }
        }
      });
      container.innerHTML = '';
      container.appendChild(tbl);
    });
  }

  function renderTrainingsPage(view) {
    view.innerHTML = '';

    const addBtn = Utils.el('button', 'btn btn--primary', 'Add Program');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () { openTrainingForm(null, loadTrainings); });

    view.appendChild(Components.pageHead({
      title: 'Training (LearningLab)',
      desc: 'Internal, external and government / public training businesses.',
      actions: [addBtn]
    }));

    const kpi = Utils.el('div');
    kpi.id = 'trainingsKpi';
    kpi.style.marginBottom = '16px';
    view.appendChild(kpi);

    view.appendChild(Components.chips({
      active: currentFilter,
      items: [{ key: 'all', label: 'All' }].concat(TYPES.map(function (ty) { return { key: ty, label: ty }; })),
      onSelect: function (key) { currentFilter = key; loadTrainings(); }
    }));

    const wrap = Utils.el('div');
    wrap.id = 'trainingsTable';
    wrap.style.marginTop = '16px';
    view.appendChild(wrap);

    loadTrainings();
  }

  Router.route('/trainings', renderTrainingsPage, { screen: 'trainings', title: 'Training' });
})();

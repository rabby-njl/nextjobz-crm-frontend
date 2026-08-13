// pages/requirements.js — Client Requirements (#/requirements) + candidate pipeline (#/requirements/:id).

(function () {
  const C = window.APP_CONSTANTS;

  function stageTone(stage) {
    switch (stage) {
      case 'placed': return 'green';
      case 'offer stage': return 'green';
      case 'shortlist sent': return 'green';
      case 'interviewing': return 'amber';
      case 'screening': return 'amber';
      case 'posted': return 'purple';
      case 'JD ready': return 'purple';
      case 'JD pending': return 'gray';
      case 'cancelled': return 'red';
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

  function buildRequirementForm(req) {
    req = req || {};
    const form = Utils.el('div', 'form-grid');

    const client = Components.searchableSelect(C.companies, req.client, 'Type to search client');
    const position = textInput(req.position, 'Sales Executive');
    const serviceType = selectInput(C.reqServiceTypes, req.serviceType, 'Select service type');
    const headcount = Components.numberInput(req.headcount, '1');
    const recruiter = selectInput(Auth.recruiters(), req.recruiter, 'Select recruiter');
    const stage = selectInput(C.reqStages, req.stage || 'JD pending', false);
    const dateOpened = Components.dateInput(req.dateOpened || Utils.todayISO());

    form.appendChild(field('Client', client.el, true));
    form.appendChild(field('Position', position, true));
    form.appendChild(field('Service type', serviceType, false));
    form.appendChild(field('Headcount', headcount, false));
    form.appendChild(field('Recruiter', recruiter, false));
    form.appendChild(field('Stage', stage, true));
    form.appendChild(field('Date opened', dateOpened, true));

    return {
      el: form,
      values: function () {
        return {
          client: client.getValue(),
          position: position.value.trim(),
          serviceType: serviceType.value,
          headcount: Number(headcount.value) || 0,
          recruiter: recruiter.value || null,
          stage: stage.value,
          dateOpened: dateOpened.value || Utils.todayISO()
        };
      },
      validate: function () {
        const v = this.values();
        const errs = [];
        if (!v.client) errs.push('Client is required.');
        if (!v.position) errs.push('Position is required.');
        return errs;
      }
    };
  }

  function openRequirementForm(req, onSaved) {
    const isEdit = !!req;
    const form = buildRequirementForm(req);
    Components.modal({
      title: isEdit ? 'Edit Requirement' : 'Add Requirement',
      body: form.el,
      actions: [
        { label: 'Cancel', class: 'btn--ghost', onClick: function (close) { close(); } },
        {
          label: isEdit ? 'Save Changes' : 'Add Requirement', class: 'btn--primary',
          onClick: function (close) {
            const errs = form.validate();
            if (errs.length) { Components.toast(errs[0], 'error'); return; }
            const data = form.values();
            if (!isEdit) {
              data.pipeline = { applied: 0, screened: 0, shortlisted: 0, interviewed: 0, sentToClient: 0, selected: 0, joined: 0 };
            }
            const p = isEdit ? api.requirements.update(req.id, data) : api.requirements.create(data);
            p.then(function () {
              close();
              Components.toast(isEdit ? 'Requirement updated' : 'Requirement added', 'success');
              if (onSaved) onSaved();
            });
          }
        }
      ]
    });
  }

  function daysOpenCell(r) {
    const d = Utils.daysSince(r.dateOpened);
    if (d == null) return '—';
    return Components.badge(Utils.ageTone(d), d + 'd');
  }

  let currentSearch = '';

  function loadRequirements() {
    const container = document.getElementById('reqTable');
    container.innerHTML = '';
    container.appendChild(Components.skeleton(5));
    api.requirements.list().then(function (reqs) {
      reqs = reqs.filter(function (r) { return Utils.textMatch(r, currentSearch, ['client', 'position', 'id']); });
      const tbl = Components.table({
        columns: [
          { key: 'id', label: 'Req ID', render: function (r) { return r.id; } },
          { key: 'client', label: 'Client', render: function (r) { return r.client; } },
          { key: 'position', label: 'Position', render: function (r) { return r.position; } },
          { key: 'serviceType', label: 'Service Type', render: function (r) { return r.serviceType; } },
          { key: 'headcount', label: 'Headcount', render: function (r) { return String(r.headcount); } },
          { key: 'recruiter', label: 'Recruiter', render: function (r) { return r.recruiter || '—'; } },
          { key: 'stage', label: 'Stage', render: function (r) { return Components.badge(stageTone(r.stage), r.stage); } },
          { key: 'daysOpen', label: 'Days Open', render: daysOpenCell },
          {
            key: 'actions', label: 'Actions', sortable: false,
            render: function (r) {
              const w = Utils.el('div');
              w.style.display = 'flex';
              w.style.gap = '6px';
              const view = Utils.el('a', 'btn btn--ghost btn--sm', 'Pipeline');
              view.href = '#/requirements/' + r.id;
              const edit = Utils.el('button', 'btn btn--ghost btn--sm', 'Edit');
              edit.type = 'button';
              edit.addEventListener('click', function () { openRequirementForm(r, loadRequirements); });
              w.appendChild(view);
              w.appendChild(edit);
              return w;
            }
          }
        ],
        rows: reqs,
        empty: {
          title: 'No requirements yet',
          text: 'Add your first client requirement.',
          actionLabel: 'Add Requirement',
          onAction: function () { openRequirementForm(null, loadRequirements); }
        }
      });
      container.innerHTML = '';
      container.appendChild(tbl);
    });
  }

  /* ---------------- Funnel chart ---------------- */

  const FUNNEL_STAGES = [
    { key: 'applied', label: 'Applied' },
    { key: 'screened', label: 'Screened' },
    { key: 'shortlisted', label: 'Shortlisted' },
    { key: 'interviewed', label: 'Interviewed' },
    { key: 'sentToClient', label: 'Sent to client' },
    { key: 'selected', label: 'Selected' },
    { key: 'joined', label: 'Joined' }
  ];

  function funnelChart(pipeline) {
    const counts = FUNNEL_STAGES.map(function (s) { return Number((pipeline && pipeline[s.key]) || 0); });
    const max = Math.max(1, Math.max.apply(null, counts));
    const wrap = Utils.el('div', 'funnel');
    FUNNEL_STAGES.forEach(function (s, idx) {
      const c = counts[idx];
      const row = Utils.el('div', 'funnel-row');
      row.appendChild(Utils.el('div', 'funnel-label', s.label));
      row.appendChild(Utils.el('div', 'funnel-count', String(c)));
      const track = Utils.el('div', 'funnel-track');
      const fill = Utils.el('div', 'funnel-fill');
      fill.style.width = Math.round((c / max) * 100) + '%';
      track.appendChild(fill);
      row.appendChild(track);
      wrap.appendChild(row);
    });
    return wrap;
  }

  function detailItem(k, v, sub) {
    const div = Utils.el('div', 'detail-item');
    div.appendChild(Utils.el('div', 'k', k));
    const val = Utils.el('div', 'v');
    val.textContent = v || '—';
    if (sub) val.appendChild(Utils.el('div', 'sub', sub));
    div.appendChild(val);
    return div;
  }

  function renderRequirementDetail(req) {
    const view = document.getElementById('view');
    view.innerHTML = '';

    const back = Utils.el('a', 'btn btn--ghost btn--sm', '‹ Back to Requirements');
    back.href = '#/requirements';
    const editBtn = Utils.el('button', 'btn btn--secondary', 'Edit');
    editBtn.type = 'button';
    editBtn.addEventListener('click', function () { openRequirementForm(req, function () { renderDetailFromId(req.id); }); });

    view.appendChild(Components.pageHead({
      title: req.position + ' — ' + req.client,
      desc: req.id + ' · ' + req.serviceType + ' · headcount ' + req.headcount,
      actions: [back, editBtn]
    }));

    const grid = Utils.el('div', 'detail-grid');
    grid.appendChild(detailItem('Client', req.client));
    grid.appendChild(detailItem('Position', req.position));
    grid.appendChild(detailItem('Service Type', req.serviceType));
    grid.appendChild(detailItem('Headcount', String(req.headcount)));
    grid.appendChild(detailItem('Recruiter', req.recruiter));
    grid.appendChild(detailItem('Stage', req.stage));
    grid.appendChild(detailItem('Date Opened', Utils.formatDate(req.dateOpened)));
    const d = Utils.daysSince(req.dateOpened);
    grid.appendChild(detailItem('Days Open', d == null ? '—' : d + ' days'));
    view.appendChild(Components.card({ title: 'Requirement overview', body: grid }));

    const pipe = req.pipeline || {};
    const funnelCard = Components.card({ title: 'Candidate pipeline', body: funnelChart(pipe) });
    funnelCard.style.marginTop = '20px';
    view.appendChild(funnelCard);
  }

  function renderDetailFromId(id) {
    const view = document.getElementById('view');
    view.innerHTML = '';
    view.appendChild(Components.skeleton(5));
    api.requirements.get(id).then(function (req) {
      if (!req) {
        view.innerHTML = '';
        view.appendChild(Components.emptyState({ title: 'Requirement not found', text: 'It may have been removed.', actionLabel: 'Back to Requirements', onAction: function () { window.location.hash = '#/requirements'; } }));
        return;
      }
      renderRequirementDetail(req);
    });
  }

  function renderRequirementsPage(view) {
    view.innerHTML = '';

    const addBtn = Utils.el('button', 'btn btn--primary', 'Add Requirement');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () { openRequirementForm(null, loadRequirements); });

    view.appendChild(Components.pageHead({
      title: 'Requirements',
      desc: 'Client hiring requirements across headhunting, staffing and campus hiring.',
      actions: [addBtn]
    }));

    view.appendChild(Components.searchBox({
      placeholder: 'Search client or position',
      onInput: function (q) { currentSearch = q; loadRequirements(); }
    }));

    const wrap = Utils.el('div');
    wrap.id = 'reqTable';
    view.appendChild(wrap);

    loadRequirements();
  }

  Router.route('/requirements', renderRequirementsPage, { screen: 'requirements', title: 'Requirements' });
  Router.route('/requirements/:id', function (view, params) { renderDetailFromId(params.id); }, { screen: 'requirements', title: 'Requirement Pipeline' });
})();

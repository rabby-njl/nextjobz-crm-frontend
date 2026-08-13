// pages/campaigns.js — Campaigns (Digital Marketing) (#/campaigns).

(function () {
  const C = window.APP_CONSTANTS;

  function statusTone(status) {
    switch (status) {
      case 'running': return 'green';
      case 'paused': return 'amber';
      case 'ended': return 'gray';
      default: return 'gray';
    }
  }

  function cplTone(cpl) {
    if (cpl == null) return 'gray';
    if (cpl < 200) return 'green';
    if (cpl <= 500) return 'amber';
    return 'red';
  }

  function costPerLead(r) {
    const gen = Number(r.leadsGenerated) || 0;
    if (!gen) return null;
    return (Number(r.spend) || 0) / gen;
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

  function buildCampaignForm(camp) {
    camp = camp || {};
    const form = Utils.el('div', 'form-grid');

    const campaign = textInput(camp.campaign, 'Campaign A');
    const channel = selectInput(C.campaignChannels, camp.channel, 'Select channel');
    const status = selectInput(C.campaignStatuses, camp.status || 'running', false);
    const spend = Components.numberInput(camp.spend, '0');
    const leadsGenerated = Components.numberInput(camp.leadsGenerated, '0');
    const start = Components.dateInput(camp.start);
    const end = Components.dateInput(camp.end);

    form.appendChild(field('Campaign', campaign, true));
    form.appendChild(field('Channel', channel, false));
    form.appendChild(field('Status', status, true));
    form.appendChild(field('Spend (BDT)', spend, false));
    form.appendChild(field('Leads generated', leadsGenerated, false));
    form.appendChild(field('Start', start, false));
    form.appendChild(field('End', end, false));

    return {
      el: form,
      values: function () {
        return {
          campaign: campaign.value.trim(),
          channel: channel.value,
          status: status.value,
          spend: Number(spend.value) || 0,
          leadsGenerated: Number(leadsGenerated.value) || 0,
          start: start.value || null,
          end: end.value || null
        };
      },
      validate: function () {
        const v = this.values();
        const errs = [];
        if (!v.campaign) errs.push('Campaign name is required.');
        return errs;
      }
    };
  }

  function openCampaignForm(camp, onSaved) {
    const isEdit = !!camp;
    const form = buildCampaignForm(camp);
    Components.modal({
      title: isEdit ? 'Edit Campaign' : 'Add Campaign',
      body: form.el,
      actions: [
        { label: 'Cancel', class: 'btn--ghost', onClick: function (close) { close(); } },
        {
          label: isEdit ? 'Save Changes' : 'Add Campaign', class: 'btn--primary',
          onClick: function (close) {
            const errs = form.validate();
            if (errs.length) { Components.toast(errs[0], 'error'); return; }
            const data = form.values();
            const p = isEdit ? api.campaigns.update(camp.id, data) : api.campaigns.create(data);
            p.then(function () {
              close();
              Components.toast(isEdit ? 'Campaign updated' : 'Campaign added', 'success');
              if (onSaved) onSaved();
            });
          }
        }
      ]
    });
  }

  function cplCell(r) {
    const cpl = costPerLead(r);
    if (cpl == null) return '—';
    return Components.badge(cplTone(cpl), Utils.formatBDT(Math.round(cpl)));
  }

  let currentSearch = '';

  function loadCampaigns() {
    const container = document.getElementById('campaignsTable');
    container.innerHTML = '';
    container.appendChild(Components.skeleton(5));
    api.campaigns.list().then(function (campaigns) {
      campaigns = campaigns.filter(function (c) { return Utils.textMatch(c, currentSearch, ['campaign', 'channel']); });
      const tbl = Components.table({
        columns: [
          { key: 'campaign', label: 'Campaign', render: function (r) { return r.campaign; } },
          { key: 'channel', label: 'Channel', render: function (r) { return r.channel; } },
          { key: 'status', label: 'Status', render: function (r) { return Components.badge(statusTone(r.status), r.status); } },
          { key: 'spend', label: 'Spend', render: function (r) { return Utils.formatBDT(r.spend); } },
          { key: 'leadsGenerated', label: 'Leads Generated', render: function (r) { return String(r.leadsGenerated); } },
          { key: 'cpl', label: 'Cost Per Lead', render: cplCell },
          { key: 'start', label: 'Start', render: function (r) { return Utils.formatDate(r.start); } },
          { key: 'end', label: 'End', render: function (r) { return Utils.formatDate(r.end); } },
          {
            key: 'actions', label: 'Actions', sortable: false,
            render: function (r) {
              const w = Utils.el('div');
              w.style.display = 'flex';
              w.style.gap = '6px';
              const edit = Utils.el('button', 'btn btn--ghost btn--sm', 'Edit');
              edit.type = 'button';
              edit.addEventListener('click', function () { openCampaignForm(r, loadCampaigns); });
              w.appendChild(edit);
              return w;
            }
          }
        ],
        rows: campaigns,
        empty: {
          title: 'No campaigns yet',
          text: 'Add your first marketing campaign.',
          actionLabel: 'Add Campaign',
          onAction: function () { openCampaignForm(null, loadCampaigns); }
        }
      });
      container.innerHTML = '';
      container.appendChild(tbl);
    });
  }

  function renderCampaignsPage(view) {
    view.innerHTML = '';

    const addBtn = Utils.el('button', 'btn btn--primary', 'Add Campaign');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () { openCampaignForm(null, loadCampaigns); });

    view.appendChild(Components.pageHead({
      title: 'Campaigns',
      desc: 'Digital marketing campaigns and their cost per lead.',
      actions: [addBtn]
    }));

    view.appendChild(Components.searchBox({
      placeholder: 'Search campaign or channel',
      onInput: function (q) { currentSearch = q; loadCampaigns(); }
    }));

    const wrap = Utils.el('div');
    wrap.id = 'campaignsTable';
    view.appendChild(wrap);

    loadCampaigns();
  }

  Router.route('/campaigns', renderCampaignsPage, { screen: 'campaigns', title: 'Campaigns' });
})();

// pages/dashboard.js — Dashboard: KPI cards + Unrouted Leads warning + recent leads.

(function () {
  function sum(list, key) {
    return list.reduce(function (acc, it) { return acc + (Number(it[key]) || 0); }, 0);
  }

  function leadStatusTone(status) {
    switch (status) {
      case 'converted': return 'green';
      case 'qualified': return 'green';
      case 'contacted': return 'amber';
      case 'assigned': return 'purple';
      case 'new': return 'gray';
      case 'lost': return 'red';
      default: return 'gray';
    }
  }

  Router.route('/', function (view) {
    view.appendChild(Components.skeleton(6));

    Promise.all([
      api.leads.list(),
      api.deals.list(),
      api.collections.list(),
      api.queries.list(),
      api.employers.list()
    ]).then(function (results) {
      render({
        leads: results[0],
        deals: results[1],
        collections: results[2],
        queries: results[3],
        employers: results[4]
      });
    }).catch(function () {
      view.innerHTML = '';
      view.appendChild(Components.emptyState({
        icon: 'dot',
        title: 'Could not load',
        text: 'Could not save. Check your internet and try again.'
      }));
    });
  }, { screen: 'dashboard', title: 'Dashboard' });

  function render(data) {
    const view = document.getElementById('view');
    view.innerHTML = '';

    const activeLeads = data.leads.filter(function (l) { return l.status !== 'lost'; });
    const unrouted = data.leads.filter(function (l) {
      return !l.routedTo && Utils.daysSince(l.createdAt) > 0;
    });
    const pipeline = data.deals.filter(function (d) { return d.stage !== 'won' && d.stage !== 'lost'; });
    const outstanding = data.collections.filter(function (c) { return c.status !== 'paid'; });
    const openQueries = data.queries.filter(function (q) { return q.status !== 'resolved'; });
    const activeEmployers = data.employers.filter(function (e) { return e.status === 'active'; });

    view.appendChild(Components.pageHead({
      title: 'Dashboard',
      desc: 'Your teams at a glance — ' + Utils.formatDate(Utils.todayISO())
    }));

    view.appendChild(Components.kpiGrid([
      { label: 'Active Leads', value: String(activeLeads.length), tone: 'purple', sub: 'across all teams' },
      { label: 'Pipeline Value', value: Utils.formatBDT(sum(pipeline, 'value')), tone: 'ink', sub: pipeline.length + ' open deals' },
      { label: 'Outstanding Collections', value: Utils.formatBDT(sum(outstanding, 'amount')), tone: 'amber', sub: outstanding.length + ' unpaid invoices' },
      { label: 'Open Queries', value: String(openQueries.length), tone: 'green', sub: 'in the shared inbox' },
      { label: 'Active Employers', value: String(activeEmployers.length), tone: 'purple', sub: 'of ' + data.employers.length + ' total' }
    ]));

    // Unrouted Leads warning box — the whole point of the CRM.
    if (unrouted.length) {
      const body = Utils.el('div');
      body.appendChild(Components.notice('red',
        '<strong>' + unrouted.length + ' leads are sitting unrouted for over 24 hours.</strong> Route them now so nothing falls between teams.'
      ));
      const list = Utils.el('div');
      list.style.marginTop = '8px';
      unrouted.slice(0, 8).forEach(function (l) {
        const row = Utils.el('div', 'stacked-row');
        row.appendChild(Utils.el('span', 'lbl', l.company + ' · ' + l.source));
        row.appendChild(Utils.el('span', 'val', Utils.daysSince(l.createdAt) + 'd'));
        list.appendChild(row);
      });
      body.appendChild(list);
      const btn = Utils.el('button', 'btn btn--primary mt-16', 'Open Leads');
      btn.addEventListener('click', function () { window.location.hash = '#/leads'; });
      body.appendChild(btn);
      view.appendChild(Components.card({ title: 'Unrouted Leads', body: body }));
    }

    // Recent leads
    const recent = data.leads.slice().sort(function (a, b) {
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    }).slice(0, 8);

    const tbl = Components.table({
      columns: [
        { key: 'company', label: 'Company', render: function (r) { return r.company; } },
        { key: 'source', label: 'Source', render: function (r) { return r.source; } },
        { key: 'serviceInterest', label: 'Service', render: function (r) { return r.serviceInterest; } },
        {
          key: 'routedTo', label: 'Routed To',
          render: function (r) { return r.routedTo ? r.routedTo : Components.badge('red', 'Not Routed'); }
        },
        {
          key: 'status', label: 'Status',
          render: function (r) { return Components.badge(leadStatusTone(r.status), r.status); }
        },
        {
          key: 'days', label: 'Days Untouched',
          render: function (r) {
            const d = Utils.daysSince(r.lastActivityAt);
            return Components.badge(Utils.ageTone(d), d == null ? '—' : d + 'd');
          }
        }
      ],
      rows: recent,
      empty: {
        title: 'No leads yet',
        text: 'Add your first lead to get started.',
        actionLabel: 'Add Lead',
        onAction: function () { window.location.hash = '#/leads'; }
      }
    });

    view.appendChild(Components.card({
      title: 'Recent Leads',
      sub: 'Latest ' + recent.length + ' leads by created date',
      body: tbl
    }));
  }
})();

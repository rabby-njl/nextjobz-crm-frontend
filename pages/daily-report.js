// pages/daily-report.js — Daily Activity Report (#/daily-report).
// Auto-fills from today's data. Officers submit; sales head reviews all.

(function () {
  function computeStats(officer) {
    const today = Utils.todayISO();
    return Promise.all([
      api.visits.list(),
      api.leads.list(),
      api.deals.list(),
      api.orders.list()
    ]).then(function (res) {
      let visits = res[0].filter(function (v) { return v.date === today; });
      let leads = res[1].filter(function (l) { return l.createdAt === today; });
      let deals = res[2].filter(function (d) { return d.lastActivity === today; });
      let orders = res[3].filter(function (o) { return o.startDate === today; });
      if (officer) {
        visits = visits.filter(function (v) { return v.officer === officer; });
        leads = leads.filter(function (l) { return l.assignedTo === officer; });
        deals = deals.filter(function (d) { return d.officer === officer; });
        orders = orders.filter(function (o) { return o.officer === officer; });
      }
      return {
        visits: visits.length,
        calls: visits.filter(function (v) { return v.type === 'phone call'; }).length,
        leads: leads.length,
        dealsMoved: deals.length,
        invoices: orders.length
      };
    });
  }

  function renderReportPage(view) {
    view.innerHTML = '';
    const me = Auth.userName();
    const manager = Auth.isManager();

    view.appendChild(Components.pageHead({
      title: 'Daily Activity Report',
      desc: manager ? 'All officers, auto-filled from today\'s data.' : 'Auto-filled from today\'s data. Add a note and submit.'
    }));

    const statsWrap = Utils.el('div');
    statsWrap.id = 'reportStats';
    statsWrap.style.marginBottom = '16px';
    view.appendChild(statsWrap);

    const formWrap = Utils.el('div');
    formWrap.id = 'reportForm';
    view.appendChild(formWrap);

    const histWrap = Utils.el('div');
    histWrap.id = 'reportHistory';
    histWrap.style.marginTop = '20px';
    view.appendChild(histWrap);

    loadStats();
    renderForm();
    loadHistory();
  }

  function loadStats() {
    const wrap = document.getElementById('reportStats');
    if (!wrap) return;
    const me = Auth.userName();
    const manager = Auth.isManager();
    wrap.innerHTML = '';
    wrap.appendChild(Components.skeleton(2));
    computeStats(manager ? null : me).then(function (stats) {
      wrap.innerHTML = '';
      wrap.appendChild(Components.kpiGrid([
        { label: 'Visits Done', value: String(stats.visits), tone: 'purple' },
        { label: 'Calls Made', value: String(stats.calls), tone: 'green' },
        { label: 'Leads Created', value: String(stats.leads), tone: 'purple' },
        { label: 'Deals Moved', value: String(stats.dealsMoved), tone: 'amber' },
        { label: 'Invoices Raised', value: String(stats.invoices), tone: 'green' }
      ]));
    });
  }

  function renderForm() {
    const wrap = document.getElementById('reportForm');
    if (!wrap) return;
    wrap.innerHTML = '';
    const manager = Auth.isManager();
    const me = Auth.userName();

    const card = Utils.el('div', 'card');
    if (manager) {
      const head = Utils.el('div', 'card-head');
      head.appendChild(Utils.el('div', 'card-title', 'Review reports by date'));
      card.appendChild(head);
      const label = Utils.el('label', '', 'Select date: ');
      const date = Components.dateInput(Utils.todayISO());
      date.style.maxWidth = '180px';
      date.addEventListener('change', function () { loadHistory(date.value); });
      const row = Utils.el('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '10px';
      row.appendChild(label);
      row.appendChild(date);
      card.appendChild(row);
    } else {
      card.appendChild(Utils.el('div', 'card-title', 'Add your note'));
      const note = Utils.el('textarea');
      note.placeholder = 'What did you do today? (optional)';
      note.style.width = '100%';
      note.style.minHeight = '80px';
      note.style.marginTop = '10px';
      const submit = Utils.el('button', 'btn btn--primary', 'Submit Report');
      submit.type = 'button';
      submit.style.marginTop = '10px';
      submit.addEventListener('click', function () {
        computeStats(me).then(function (stats) {
          api.dailyReports.create({
            officer: me,
            date: Utils.todayISO(),
            note: note.value.trim(),
            stats: stats,
            submittedAt: new Date().toISOString()
          }).then(function () {
            note.value = '';
            Components.toast('Report submitted', 'success');
            loadHistory();
          });
        });
      });
      card.appendChild(note);
      card.appendChild(submit);
    }
    wrap.appendChild(card);
  }

  function loadHistory(date) {
    const wrap = document.getElementById('reportHistory');
    if (!wrap) return;
    wrap.innerHTML = '';
    const me = Auth.userName();
    const manager = Auth.isManager();

    api.dailyReports.list().then(function (reports) {
      let rows = reports.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
      if (manager) {
        const d = date || Utils.todayISO();
        rows = rows.filter(function (r) { return r.date === d; });
      } else {
        rows = rows.filter(function (r) { return r.officer === me; });
      }

      const tbl = Components.table({
        columns: [
          { key: 'date', label: 'Date', render: function (r) { return Utils.formatDate(r.date); } },
          { key: 'officer', label: 'Officer', render: function (r) { return r.officer; } },
          { key: 'visits', label: 'Visits', render: function (r) { return String((r.stats && r.stats.visits) || 0); } },
          { key: 'calls', label: 'Calls', render: function (r) { return String((r.stats && r.stats.calls) || 0); } },
          { key: 'leads', label: 'Leads', render: function (r) { return String((r.stats && r.stats.leads) || 0); } },
          { key: 'dealsMoved', label: 'Deals', render: function (r) { return String((r.stats && r.stats.dealsMoved) || 0); } },
          { key: 'invoices', label: 'Invoices', render: function (r) { return String((r.stats && r.stats.invoices) || 0); } },
          { key: 'note', label: 'Note', render: function (r) { return r.note || '—'; } },
          { key: 'submittedAt', label: 'Submitted', render: function (r) { return Utils.timeAgo(r.submittedAt); } }
        ],
        rows: rows,
        empty: {
          title: 'No reports yet',
          text: manager ? 'No reports submitted for this date.' : 'Submit today\'s report to start your history.'
        }
      });

      wrap.innerHTML = '';
      wrap.appendChild(Components.card({
        title: manager ? 'Reports for selected date' : 'Your report history',
        body: tbl
      }));
    });
  }

  Router.route('/daily-report', renderReportPage, { screen: 'daily-report', title: 'Daily Activity Report' });
})();

// pages/reports.js — Reports (#/reports). Five tables + month selector + CSV download.

(function () {
  const C = window.APP_CONSTANTS;

  function currentMonth() {
    return Utils.todayISO().slice(0, 7);
  }

  let selectedMonth = currentMonth();
  let lastReports = [];

  function pctTone(p) {
    if (p >= 100) return 'green';
    if (p >= 70) return 'amber';
    return 'red';
  }

  function money(v) { return Utils.formatBDT(v); }

  /* ---------------- Report computations ---------------- */

  function reportSalesPerf(targets, orders, deals) {
    const rows = [];
    targets.filter(function (t) { return t.month === selectedMonth; }).forEach(function (t) {
      const achieved = orders.filter(function (o) { return o.officer === t.officer && String(o.startDate || '').slice(0, 7) === selectedMonth; })
        .reduce(function (s, o) { return s + (Number(o.amount) || 0); }, 0) +
        deals.filter(function (d) { return d.officer === t.officer && d.stage === 'won' && String(d.lastActivity || '').slice(0, 7) === selectedMonth; })
          .reduce(function (s, d) { return s + (Number(d.value) || 0); }, 0);
      const pct = t.targetSales ? Math.round(achieved / t.targetSales * 100) : 0;
      rows.push({ officer: t.officer, target: t.targetSales, achieved: achieved, pct: pct });
    });
    return {
      title: '1. Sales officer performance',
      columns: [
        { label: 'Officer', value: function (r) { return r.officer; }, render: function (r) { return r.officer; } },
        { label: 'Target (BDT)', value: function (r) { return r.target; }, render: function (r) { return money(r.target); } },
        { label: 'Achieved (BDT)', value: function (r) { return r.achieved; }, render: function (r) { return money(r.achieved); } },
        { label: 'Percent', value: function (r) { return r.pct; }, render: function (r) { return Components.badge(pctTone(r.pct), r.pct + '%'); } }
      ],
      rows: rows
    };
  }

  function reportLeadSource(leads) {
    const inMonth = leads.filter(function (l) { return String(l.createdAt || '').slice(0, 7) === selectedMonth; });
    const by = {};
    inMonth.forEach(function (l) {
      const s = l.source;
      by[s] = by[s] || { leads: 0, converted: 0 };
      by[s].leads++;
      if (l.status === 'converted') by[s].converted++;
    });
    const rows = Object.keys(by).map(function (s) {
      const d = by[s];
      return { source: s, leads: d.leads, converted: d.converted, pct: d.leads ? Math.round(d.converted / d.leads * 100) : 0 };
    });
    rows.sort(function (a, b) { return b.leads - a.leads; });
    return {
      title: '2. Lead source performance',
      columns: [
        { label: 'Source', value: function (r) { return r.source; }, render: function (r) { return r.source; } },
        { label: 'Leads', value: function (r) { return r.leads; }, render: function (r) { return String(r.leads); } },
        { label: 'Converted', value: function (r) { return r.converted; }, render: function (r) { return String(r.converted); } },
        { label: 'Conversion %', value: function (r) { return r.pct; }, render: function (r) { return Components.badge(pctTone(r.pct), r.pct + '%'); } }
      ],
      rows: rows
    };
  }

  function reportRouting(leads) {
    const inMonth = leads.filter(function (l) { return String(l.createdAt || '').slice(0, 7) === selectedMonth; });
    const rows = [];
    C.routes.forEach(function (team) {
      const inTeam = inMonth.filter(function (l) { return l.routedTo === team; });
      rows.push({
        team: team,
        routed: inTeam.length,
        accepted: inTeam.filter(function (l) { return l.acceptedBy; }).length,
        dropped: inTeam.filter(function (l) { return l.status === 'lost'; }).length
      });
    });
    const unrouted = inMonth.filter(function (l) { return !l.routedTo; });
    rows.push({
      team: 'Unrouted',
      routed: unrouted.length,
      accepted: 0,
      dropped: unrouted.filter(function (l) { return l.status === 'lost'; }).length
    });
    return {
      title: '3. Team routing report',
      columns: [
        { label: 'Team', value: function (r) { return r.team; }, render: function (r) { return r.team; } },
        { label: 'Routed', value: function (r) { return r.routed; }, render: function (r) { return String(r.routed); } },
        { label: 'Accepted', value: function (r) { return r.accepted; }, render: function (r) { return String(r.accepted); } },
        { label: 'Dropped', value: function (r) { return r.dropped; }, render: function (r) { return r.dropped ? Components.badge('red', String(r.dropped)) : '0'; } }
      ],
      rows: rows
    };
  }

  function reportAgeing(collections) {
    const unpaid = collections.filter(function (c) { return c.status !== 'paid'; });
    const buckets = [
      { label: '0-30 days', min: 0, max: 30 },
      { label: '31-60 days', min: 31, max: 60 },
      { label: '61-90 days', min: 61, max: 90 },
      { label: '90+ days', min: 91, max: Infinity }
    ];
    const rows = buckets.map(function (b) {
      const items = unpaid.filter(function (c) {
        const d = Utils.daysSince(c.dueDate);
        return d != null && d >= b.min && d <= b.max;
      });
      return {
        bucket: b.label,
        count: items.length,
        amount: items.reduce(function (s, c) { return s + (Number(c.amount) || 0); }, 0)
      };
    });
    return {
      title: '4. Collection ageing',
      columns: [
        { label: 'Age bucket', value: function (r) { return r.bucket; }, render: function (r) { return r.bucket; } },
        { label: 'Invoices', value: function (r) { return r.count; }, render: function (r) { return String(r.count); } },
        { label: 'Amount (BDT)', value: function (r) { return r.amount; }, render: function (r) { return money(r.amount); } }
      ],
      rows: rows
    };
  }

  function reportQuery(queries) {
    const by = {};
    queries.forEach(function (q) {
      const ch = q.channel;
      by[ch] = by[ch] || { count: 0, total: 0, responded: 0 };
      by[ch].count++;
      if (q.responseHours != null) { by[ch].responded++; by[ch].total += q.responseHours; }
    });
    const rows = Object.keys(by).map(function (ch) {
      const d = by[ch];
      const avg = d.responded ? Math.round((d.total / d.responded) * 10) / 10 : null;
      return { channel: ch, count: d.count, avg: avg };
    });
    rows.sort(function (a, b) { return b.count - a.count; });
    return {
      title: '5. Query response report',
      columns: [
        { label: 'Channel', value: function (r) { return r.channel; }, render: function (r) { return r.channel; } },
        { label: 'Queries', value: function (r) { return r.count; }, render: function (r) { return String(r.count); } },
        { label: 'Avg Response Hours', value: function (r) { return r.avg; }, render: function (r) { return r.avg == null ? '—' : String(r.avg) + 'h'; } }
      ],
      rows: rows
    };
  }

  /* ---------------- CSV ---------------- */

  function csvCell(v) {
    return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  }

  function downloadCSV() {
    const lines = [];
    lines.push('Nextjobz CRM — Reports for ' + selectedMonth);
    lastReports.forEach(function (rep) {
      lines.push('');
      lines.push(rep.title);
      lines.push(rep.columns.map(function (c) { return csvCell(c.label); }).join(','));
      rep.rows.forEach(function (row) {
        lines.push(rep.columns.map(function (c) { return csvCell(c.value(row)); }).join(','));
      });
    });
    const csv = lines.join('\n');
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nextjobz-report-' + selectedMonth + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Components.toast('CSV downloaded', 'success');
    } catch (e) {
      Components.toast('Could not save. Check your internet and try again.', 'error');
    }
  }

  /* ---------------- Render ---------------- */

  function loadReports() {
    const container = document.getElementById('reportsBody');
    container.innerHTML = '';
    container.appendChild(Components.skeleton(6));
    Promise.all([
      api.targets.list(), api.leads.list(), api.deals.list(), api.orders.list(), api.collections.list(), api.queries.list()
    ]).then(function (res) {
      const targets = res[0], leads = res[1], deals = res[2], orders = res[3], collections = res[4], queries = res[5];
      lastReports = [
        reportSalesPerf(targets, orders, deals),
        reportLeadSource(leads),
        reportRouting(leads),
        reportAgeing(collections),
        reportQuery(queries)
      ];
      container.innerHTML = '';
      lastReports.forEach(function (rep) {
        const tbl = Components.table({
          columns: rep.columns.map(function (c) {
            return { key: c.label, label: c.label, render: c.render, sortable: false };
          }),
          rows: rep.rows,
          empty: { title: 'No data', text: 'Nothing to show for ' + selectedMonth + '.' }
        });
        const card = Components.card({ title: rep.title, body: tbl });
        card.style.marginTop = '20px';
        container.appendChild(card);
      });
    });
  }

  function renderReportsPage(view) {
    view.innerHTML = '';

    const monthSel = Utils.el('input');
    monthSel.type = 'month';
    monthSel.value = selectedMonth;
    monthSel.style.maxWidth = '160px';
    monthSel.addEventListener('change', function () { selectedMonth = monthSel.value || currentMonth(); loadReports(); });

    const dlBtn = Utils.el('button', 'btn btn--primary', 'Download CSV');
    dlBtn.type = 'button';
    dlBtn.addEventListener('click', downloadCSV);

    view.appendChild(Components.pageHead({
      title: 'Reports',
      desc: 'Performance and pipeline reports. Select a month, then download as CSV.',
      actions: [monthSel, dlBtn]
    }));

    const wrap = Utils.el('div');
    wrap.id = 'reportsBody';
    view.appendChild(wrap);

    loadReports();
  }

  Router.route('/reports', renderReportsPage, { screen: 'reports', title: 'Reports' });
})();

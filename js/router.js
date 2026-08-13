// router.js — hash-based routing. GitHub Pages has no server rewrites, so #/ only.

const Router = (() => {
  const routes = [];

  function route(pattern, handler, opts) {
    routes.push({ pattern: pattern, handler: handler, opts: opts || {} });
  }

  function buildRegex(pattern) {
    const keys = [];
    const src = pattern.replace(/:([^/]+)/g, function (_, k) {
      keys.push(k);
      return '([^/]+)';
    });
    return { keys: keys, re: new RegExp('^' + src + '$') };
  }

  function match(path) {
    for (let i = 0; i < routes.length; i++) {
      const r = routes[i];
      const built = buildRegex(r.pattern);
      const m = path.match(built.re);
      if (m) {
        const params = {};
        built.keys.forEach(function (k, idx) {
          params[k] = decodeURIComponent(m[idx + 1]);
        });
        return { handler: r.handler, params: params, opts: r.opts };
      }
    }
    return null;
  }

  function highlightNav(screenId) {
    document.querySelectorAll('[data-nav]').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-nav') === screenId);
    });
  }

  function render() {
    const view = document.getElementById('view');
    view.innerHTML = '';

    const hash = window.location.hash || '#/';
    const path = hash.replace(/^#/, '');
    const m = match(path);

    if (!m) {
      Components.setPageTitle('Not found');
      view.appendChild(Components.emptyState({
        icon: 'dot',
        title: 'Page not found',
        text: 'That screen does not exist.',
        actionLabel: 'Go to Dashboard',
        onAction: function () { window.location.hash = '#/'; }
      }));
      return;
    }

    Components.setPageTitle(m.opts.title || 'Nextjobz CRM');

    if (m.opts.screen && !Auth.canAccess(m.opts.screen)) {
      highlightNav(null);
      view.appendChild(accessDenied());
      return;
    }

    if (m.opts.screen) highlightNav(m.opts.screen);

    try {
      m.handler(view, m.params);
    } catch (e) {
      console.error('Route error:', e);
      view.appendChild(Components.emptyState({
        icon: 'dot',
        title: 'Something went wrong',
        text: 'Could not load this screen.',
        actionLabel: 'Go to Dashboard',
        onAction: function () { window.location.hash = '#/'; }
      }));
    }
  }

  function accessDenied() {
    return Components.card({
      title: 'Access denied',
      body: Components.emptyState({
        icon: 'payroll',
        title: 'You do not have access to this screen',
        text: 'Use the "Demo: View As" switcher in the top bar to preview a role that can open it.',
        actionLabel: 'Go to Dashboard',
        onAction: function () { window.location.hash = '#/'; }
      })
    });
  }

  function start() {
    window.addEventListener('hashchange', render);
    render();
  }

  function refresh() {
    render();
  }

  function navigate(hash) {
    window.location.hash = hash;
  }

  return { route: route, start: start, refresh: refresh, navigate: navigate };
})();

// Bootstrap: History API router, route guards, SEO defaults, header and global event delegation.
(function (App) {
  const { store, ui } = App;
  const $app = document.getElementById('app');
  const $header = document.getElementById('header');

  const PRIVATE = { noindex: true };
  const routes = [
    { path: /^\/$/, page: 'home', seo: { description: 'Fresh pizzas, pastas, mains and desserts. Browse the Trattoria menu and order online in a few taps.' } },
    { path: /^\/menu$/, page: 'menu', seo: { title: 'Menu', description: 'Explore the full Trattoria menu. Filter by category, vegetarian, spiciness, rating and price.' } },
    { path: /^\/product\/(\d+)$/, page: 'product', keys: ['id'], seo: { title: 'Dish' } },
    { path: /^\/cart$/, page: 'cart', auth: true, seo: { title: 'Your cart', ...PRIVATE } },
    { path: /^\/profile$/, page: 'profile', auth: true, seo: { title: 'Your profile', ...PRIVATE } },
    { path: /^\/login$/, page: 'login', guest: true, seo: { title: 'Sign in', ...PRIVATE } },
    { path: /^\/register$/, page: 'register', guest: true, seo: { title: 'Create account', ...PRIVATE } },
    { path: /^\/verify$/, page: 'verify', guest: true, seo: { title: 'Verify email', ...PRIVATE } },
    { path: /^\/forgot$/, page: 'forgot', guest: true, seo: { title: 'Forgot password', ...PRIVATE } },
    { path: /^\/reset$/, page: 'reset', guest: true, seo: { title: 'Reset password', ...PRIVATE } },
  ];

  App.navigate = (url, { replace = false } = {}) => {
    history[replace ? 'replaceState' : 'pushState'](null, '', url);
    return render();
  };

  const currentPath = () => location.pathname.replace(/(.)\/$/, '$1') || '/';
  const currentQuery = () => Object.fromEntries(new URLSearchParams(location.search));

  let cleanup = null;
  let renderId = 0;

  async function render() {
    const id = ++renderId;
    const path = currentPath();
    const query = currentQuery();
    if (typeof cleanup === 'function') cleanup();
    cleanup = null;

    let params = {};
    const route = routes.find((r) => {
      const m = path.match(r.path);
      if (m) params = Object.fromEntries((r.keys || []).map((k, i) => [k, m[i + 1]]));
      return m;
    });

    if (!route) {
      App.seo.set({ title: 'Page not found', noindex: true });
      $app.innerHTML = ui.emptyState('Page not found', 'The page you are looking for does not exist.', '<a class="btn btn-primary" href="/">Go home</a>');
      return;
    }
    if (route.auth && !store.isAuthed) return App.navigate(`/login?next=${encodeURIComponent(path)}`, { replace: true });
    if (route.guest && store.isAuthed) return App.navigate('/menu', { replace: true });

    App.seo.set({ ...route.seo, path });
    $app.innerHTML = '';
    const result = await App.pages[route.page]({ root: $app, params, query, path });
    if (id !== renderId) { if (typeof result === 'function') result(); return; } // superseded navigation
    cleanup = result;
    markActiveNav(path);
    window.scrollTo({ top: 0 });
    $app.focus({ preventScroll: true });
    App.refreshEffects();
  }

  // ----- header -----
  function markActiveNav(path = currentPath()) {
    $header.querySelectorAll('[data-nav]').forEach((a) => {
      const active = a.dataset.nav === path || (a.dataset.nav !== '/' && path.startsWith(a.dataset.nav));
      active ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    });
  }

  function renderHeader() {
    const open = $header.querySelector('.nav')?.classList.contains('open');
    const name = store.user?.firstName;
    $header.innerHTML = `
      <div class="header-inner">
        <a class="brand" href="/">${ui.icon('utensils')} Trattoria</a>
        <button class="nav-toggle" data-action="nav-toggle" aria-label="Toggle menu" aria-expanded="${!!open}"><span class="bar"></span><span class="bar"></span><span class="bar"></span></button>
        <nav class="nav ${open ? 'open' : ''}" aria-label="Main">
          <a href="/menu" data-nav="/menu">Menu</a>
          ${store.isAuthed ? `
            <a href="/cart" data-nav="/cart" class="cart-link">${ui.icon('bag')} Cart${store.cartCount ? `<span class="count">${store.cartCount}</span>` : ''}</a>
            <a href="/profile" data-nav="/profile">${ui.icon('user')} ${name ? ui.esc(name) : 'Profile'}</a>
            <button class="btn btn-outline btn-sm" data-action="logout">Sign out</button>` : `
            <a href="/login" data-nav="/login">Sign in</a>
            <a href="/register" class="btn btn-primary btn-sm">Sign up</a>`}
          <button class="icon-btn" data-action="theme" aria-label="Toggle dark mode">${ui.icon('contrast')}</button>
        </nav>
      </div>`;
    markActiveNav();
  }

  // ----- theme -----
  const applyTheme = (t) => { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; };
  try { applyTheme(localStorage.getItem('restaurant.theme')); } catch { /* ignore */ }

  // ----- global events -----
  document.addEventListener('click', (e) => {
    // Client-side navigation for same-origin links.
    const a = e.target.closest('a[href]');
    if (a && !e.defaultPrevented && e.button === 0 && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) &&
        !a.target && !a.hasAttribute('download') && !a.getAttribute('href').startsWith('#') && a.origin === location.origin) {
      e.preventDefault();
      const url = a.pathname + a.search;
      if (url !== location.pathname + location.search) App.navigate(url);
      $header.querySelector('.nav')?.classList.remove('open');
      return;
    }

    const addBtn = e.target.closest('[data-add]');
    if (addBtn) return ui.addToCart(Number(addBtn.dataset.add), 1, addBtn);

    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'nav-toggle') {
      const nav = $header.querySelector('.nav');
      const open = nav.classList.toggle('open');
      e.target.closest('button').setAttribute('aria-expanded', open);
    } else if (action === 'theme') {
      const dark = document.documentElement.dataset.theme === 'dark' ||
        (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
      const next = dark ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('restaurant.theme', next); } catch { /* ignore */ }
    } else if (action === 'logout') {
      store.clear();
      ui.toast('Signed out', 'info');
      App.navigate('/');
    }
  });

  window.addEventListener('popstate', render);
  store.subscribe(renderHeader);

  // After login the header/cart need fresh user data.
  App.afterLogin = async (tokens) => {
    store.setTokens(tokens);
    try { store.setUser(await App.api.me()); } catch { /* non-critical */ }
    App.refreshCartCount();
  };

  document.getElementById('year').textContent = new Date().getFullYear();
  renderHeader();
  if (store.isAuthed) {
    App.api.me().then(store.setUser).catch(() => {});
    App.refreshCartCount();
  }
  render();
})(window.App);

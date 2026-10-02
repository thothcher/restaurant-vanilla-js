(function (App) {
  const { api, ui, config } = App;

  // URL query <-> API query mapping keeps filtered menus shareable.
  const toApi = (f) => ({
    Query: f.q, CategoryId: f.cat, Vegetarian: f.veg ? 'true' : undefined,
    Spiciness: f.spice, MinPrice: f.min, MaxPrice: f.max, Rate: f.rate,
  });
  const SPICE_LABELS = ['Not spicy (0)', 'Mild (1)', 'Medium (2)', 'Hot (3)', 'Very hot (4)', 'Extreme (5)'];

  App.pages.menu = async ({ root, query }) => {
    const filters = { q: '', cat: '', veg: '', spice: '', min: '', max: '', rate: '', ...query };
    let page = 1;
    let loading = false;
    let runId = 0;
    let categories = [];

    root.innerHTML = `
      <div class="container menu-layout">
        <aside class="filters" aria-label="Filters">
          <form id="filters" novalidate>
            <div class="filters-head"><h2>Filters</h2><button type="button" class="link" id="reset">Reset</button></div>
            <div class="field"><label for="q" data-text="Search">Search</label>
              <div class="input-wrap">${ui.icon('search', 'input-ico')}<input id="q" name="q" type="search" class="has-ico" placeholder="Pizza, pasta…" autocomplete="off"></div></div>
            <div class="field"><span class="label">Category</span><div class="chips" id="cats"></div></div>
            <label class="check"><input type="checkbox" name="veg"> <span>${ui.icon('leaf')} Vegetarian only</span></label>
            <div class="field"><label for="spice" data-text="Spiciness">Spiciness</label>
              <select id="spice" name="spice"><option value="">Any</option>${SPICE_LABELS.map((l, n) => `<option value="${n}">${l}</option>`).join('')}</select></div>
            <div class="field"><span class="label">Price (${config.CURRENCY})</span>
              <div class="range"><input name="min" type="number" min="0" step="0.5" placeholder="Min" aria-label="Minimum price">
              <span>–</span><input name="max" type="number" min="0" step="0.5" placeholder="Max" aria-label="Maximum price"></div></div>
            <div class="field"><label for="rate" data-text="Rating">Minimum rating</label>
              <select id="rate" name="rate"><option value="">Any</option>${[2, 3, 4].map((n) => `<option value="${n}">${n}+ stars</option>`).join('')}</select></div>
          </form>
        </aside>
        <section class="results">
          <div class="results-head"><h1>Menu</h1><span class="muted" id="count"></span></div>
          <div class="grid" id="grid"></div>
          <div class="more"><button class="btn btn-outline" id="more" hidden>Load more</button></div>
        </section>
      </div>`;

    const form = root.querySelector('#filters');
    const grid = root.querySelector('#grid');
    const moreBtn = root.querySelector('#more');
    const count = root.querySelector('#count');
    const catsEl = root.querySelector('#cats');
    let shown = 0;

    const syncForm = () => {
      form.q.value = filters.q;
      form.veg.checked = !!filters.veg;
      ['spice', 'min', 'max', 'rate'].forEach((k) => { form[k].value = filters[k]; });
      catsEl.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.cat === String(filters.cat))));
    };

    const syncUrl = () => {
      const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== '' && v != null)).toString();
      history.replaceState(null, '', App.url(`/menu${qs ? '?' + qs : ''}`));
      const cat = categories.find((c) => String(c.id) === String(filters.cat));
      App.seo.set({
        title: cat ? `${cat.name} Menu` : 'Menu',
        description: cat ? `Order ${cat.name.toLowerCase()} from the Trattoria menu online.` : 'Explore the full Trattoria menu. Filter by category, vegetarian, spiciness, rating and price.',
        path: cat ? `/menu?cat=${cat.id}` : '/menu',
        noindex: [filters.q, filters.veg, filters.spice, filters.min, filters.max, filters.rate].some(Boolean), // avoid indexing infinite filter combos
      });
    };

    async function load(reset) {
      if (loading && !reset) return;
      const id = ++runId;
      loading = true;
      if (reset) { page = 1; shown = 0; grid.innerHTML = ui.skeletonCards(6); moreBtn.hidden = true; count.textContent = ''; }
      else moreBtn.classList.add('is-loading');
      try {
        const res = await api.products({ ...toApi(filters), Page: page, Take: config.PAGE_SIZE });
        if (id !== runId) return;
        const items = res.products || [];
        if (reset) grid.innerHTML = '';
        grid.insertAdjacentHTML('beforeend', items.map((p, i) => ui.productCard(p, i)).join(''));
        shown += items.length;
        if (!shown) grid.innerHTML = ui.emptyState('No dishes found', 'Try adjusting or resetting your filters.', '', 'search');
        count.textContent = shown ? `${shown} dish${shown === 1 ? '' : 'es'}${res.hasMore ? '+' : ''}` : '';
        moreBtn.hidden = !res.hasMore;
        App.refreshEffects();
      } catch (err) {
        if (id !== runId) return;
        if (reset) grid.innerHTML = ui.errorState(err); else ui.toast(err.message, 'error');
      } finally {
        if (id === runId) { loading = false; moreBtn.classList.remove('is-loading'); }
      }
    }

    const apply = () => { syncUrl(); load(true); };

    form.addEventListener('submit', (e) => e.preventDefault());
    const debouncedApply = ui.debounce(apply, 350);
    form.addEventListener('input', (e) => {
      const el = e.target;
      filters[el.name] = el.type === 'checkbox' ? (el.checked ? '1' : '') : el.value.trim();
      (el.type === 'search' || el.type === 'number' ? debouncedApply : apply)();
    });
    root.querySelector('#reset').addEventListener('click', () => {
      Object.keys(filters).forEach((k) => { filters[k] = ''; });
      syncForm(); apply();
    });
    catsEl.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      filters.cat = String(filters.cat) === chip.dataset.cat ? '' : chip.dataset.cat;
      syncForm(); apply();
    });
    moreBtn.addEventListener('click', () => { page += 1; load(false); });
    grid.addEventListener('click', (e) => { if (e.target.closest('[data-retry]')) load(true); });

    syncForm();
    load(true);
    try {
      categories = await api.categories();
      catsEl.innerHTML = categories.map((c) => `<button type="button" class="chip" data-cat="${c.id}" aria-pressed="false">${ui.esc(c.name)}</button>`).join('');
      syncForm();
      if (filters.cat) syncUrl();
    } catch { catsEl.innerHTML = '<span class="muted">Unavailable</span>'; }

    return () => { runId += 1; };
  };
})(window.App);

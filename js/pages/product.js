(function (App) {
  const { api, ui } = App;

  App.pages.product = async ({ root, params, path }) => {
    root.innerHTML = '<div class="container"><div class="skeleton detail-skel"></div></div>';
    let p;
    let categories = [];
    try {
      [p, categories] = await Promise.all([api.product(params.id), api.categories().catch(() => [])]);
    } catch (err) {
      const missing = err.status === 400 || err.status === 404;
      App.seo.set({ title: missing ? 'Dish not found' : 'Error', noindex: true });
      root.innerHTML = `<div class="container">${missing
        ? ui.emptyState('Dish not found', 'This dish may have been removed.', '<a class="btn btn-primary" href="menu">Back to menu</a>')
        : ui.errorState(err)}</div>`;
      root.querySelector('[data-retry]')?.addEventListener('click', () => App.pages.product({ root, params, path }));
      return;
    }
    if (!root.isConnected) return;

    const category = categories.find((c) => c.id === p.categoryId);
    const desc = (p.description || `${p.name} from the Trattoria menu.`).slice(0, 155);
    App.seo.set({
      title: p.name, description: desc, path, type: 'product', image: p.image,
      jsonLd: {
        '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description, image: p.image,
        ...(category && { category: category.name }),
        ...(p.rate > 0 && { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rate, bestRating: 5, ratingCount: 1 } }),
        offers: { '@type': 'Offer', price: p.price, priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
      },
    });

    let qty = 1;
    root.innerHTML = `
      <div class="container">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="menu">Menu</a>${category ? ` / <a href="menu?cat=${category.id}">${ui.esc(category.name)}</a>` : ''} / <span>${ui.esc(p.name)}</span></nav>
        <div class="detail">
          <div class="detail-media" data-aos="fade-right"><div data-parallax="0.06">${ui.img(p.image, p.name, '', true)}</div></div>
          <div class="detail-info" data-aos="fade-left">
            <div class="badges">${ui.veg(p.vegetarian)}${ui.spice(p.spiciness)}</div>
            <h1>${ui.esc(p.name)}</h1>
            <div class="card-rate">${ui.stars(p.rate)}</div>
            <p class="lead">${ui.esc(p.description)}</p>
            <div class="buy">
              <strong class="price price-lg">${ui.price(p.price)}</strong>
              <div class="stepper" role="group" aria-label="Quantity">
                <button type="button" data-step="-1" aria-label="Decrease">${ui.icon('minus')}</button>
                <output id="qty" aria-live="polite">1</output>
                <button type="button" data-step="1" aria-label="Increase">${ui.icon('plus')}</button>
              </div>
              <button class="btn btn-primary btn-lg" id="add">${ui.icon('bag')} Add to cart · <span id="total">${ui.price(p.price)}</span></button>
            </div>
          </div>
        </div>
        ${p.ingredients?.length ? `<section class="panel" data-aos="fade-up"><h2>Ingredients</h2><ul class="list">${p.ingredients.map((i) => `<li>${ui.esc(i)}</li>`).join('')}</ul></section>` : ''}
        ${p.method ? `<section class="panel" data-aos="fade-up"><h2>How it's made</h2><p>${ui.esc(p.method)}</p></section>` : ''}
      </div>`;

    const qtyEl = root.querySelector('#qty');
    const totalEl = root.querySelector('#total');
    const onClick = async (e) => {
      const step = e.target.closest('[data-step]');
      if (step) {
        qty = Math.min(99, Math.max(1, qty + Number(step.dataset.step)));
        qtyEl.textContent = qty;
        totalEl.textContent = ui.price(p.price * qty);
      } else if (e.target.closest('#add')) {
        await ui.addToCart(p.id, qty, e.target.closest('#add'));
      }
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  };
})(window.App);

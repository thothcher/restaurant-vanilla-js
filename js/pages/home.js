(function (App) {
  const { api, ui } = App;

  App.pages.home = async ({ root }) => {
    root.innerHTML = `
      <section class="hero">
        <div class="hero-inner container">
          <div class="hero-text">
            <p class="eyebrow" data-aos="fade-up">Fresh · Handmade · Delivered</p>
            <h1 data-aos="fade-up" data-aos-delay="80">Authentic flavours, ordered in a few taps.</h1>
            <p class="lead" data-aos="fade-up" data-aos-delay="160">Explore our menu, filter by what you love, and have your meal taken care of.</p>
            <div class="hero-actions" data-aos="fade-up" data-aos-delay="240">
              <a class="btn btn-primary btn-lg" href="/menu">Browse the menu ${ui.icon('arrow')}</a>
              <a class="btn btn-outline btn-lg" href="/menu?veg=1">${ui.icon('leaf')} Vegetarian picks</a>
            </div>
          </div>
          <div class="hero-media" id="hero-media" aria-hidden="true">
            <figure class="skeleton"></figure><figure class="skeleton"></figure><figure class="skeleton"></figure>
          </div>
        </div>
      </section>

      <section class="container features">
        <div class="feature" data-aos="fade-up">${ui.icon('leaf')}<div><h3>Fresh ingredients</h3><p>Seasonal produce and handmade dough, every day.</p></div></div>
        <div class="feature" data-aos="fade-up" data-aos-delay="100">${ui.icon('clock')}<div><h3>Order in seconds</h3><p>Save your cart and check out whenever you're ready.</p></div></div>
        <div class="feature" data-aos="fade-up" data-aos-delay="200">${ui.icon('shield')}<div><h3>Secure account</h3><p>Verified email and protected sessions.</p></div></div>
      </section>

      <section class="container section">
        <h2 class="section-title" data-aos="fade-right">Categories</h2>
        <div class="cat-grid" id="cats"><div class="skeleton cat-tile"></div><div class="skeleton cat-tile"></div><div class="skeleton cat-tile"></div></div>
      </section>

      <section class="container section">
        <div class="section-head" data-aos="fade-right"><h2 class="section-title">Top rated</h2><a href="/menu" class="more-link">View all ${ui.icon('arrow')}</a></div>
        <div class="grid" id="top">${ui.skeletonCards(4)}</div>
      </section>

      <section class="band" id="band" aria-label="Order now">
        <div class="band-bg" data-parallax="0.18"></div>
        <div class="band-content container" data-aos="zoom-in">
          <h2>Hungry already?</h2>
          <p>Your next favourite dish is a couple of clicks away.</p>
          <a class="btn btn-primary btn-lg" href="/menu">Order now ${ui.icon('arrow')}</a>
        </div>
      </section>`;
    App.refreshEffects();

    const [cats, top] = await Promise.allSettled([api.categories(), api.products({ Page: 1, Take: 50 })]);
    if (!root.isConnected) return;

    root.querySelector('#cats').innerHTML = cats.status === 'fulfilled'
      ? cats.value.map((c, i) => `<a class="cat-tile" href="/menu?cat=${c.id}" data-aos="fade-up" data-aos-delay="${i * 60}">${ui.icon(ui.CATEGORY_ICONS[c.name] || 'utensils')}<span>${ui.esc(c.name)}</span></a>`).join('')
      : `<p class="muted">${ui.esc(cats.reason.message)}</p>`;

    const topEl = root.querySelector('#top');
    if (top.status === 'fulfilled') {
      const all = top.value.products || [];
      const best = [...all].sort((a, b) => b.rate - a.rate);
      topEl.innerHTML = best.slice(0, 4).map(ui.productCard).join('') || ui.emptyState('No dishes yet', 'Check back soon.');

      const pics = best.filter((p) => p.image).slice(0, 4);
      root.querySelector('#hero-media').innerHTML = pics.slice(0, 3)
        .map((p, i) => `<figure data-parallax="${[0.12, -0.1, 0.2][i]}">${ui.img(p.image, '', '', true)}</figure>`).join('');
      if (pics[3]) root.querySelector('.band-bg').style.backgroundImage = `url("${pics[3].image}")`;
    } else {
      topEl.innerHTML = ui.errorState(top.reason, false);
    }
    App.refreshEffects();
  };
})(window.App);

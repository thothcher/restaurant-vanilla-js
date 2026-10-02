(function (App) {
  const { api, ui, store } = App;

  App.pages.cart = async ({ root }) => {
    let cart = null;
    let busy = false;

    const itemRow = (it) => `
      <li class="cart-item" data-item="${it.id}">
        <a class="cart-thumb" href="/product/${it.product.id}">${ui.img(it.product.image, it.product.name)}</a>
        <div class="cart-info">
          <a class="cart-name" href="/product/${it.product.id}">${ui.esc(it.product.name)}</a>
          <span class="muted">${ui.price(it.product.price)} each</span>
        </div>
        <div class="stepper" role="group" aria-label="Quantity of ${ui.esc(it.product.name)}">
          <button type="button" data-qty="${it.quantity - 1}" aria-label="Decrease">${ui.icon('minus')}</button>
          <output>${it.quantity}</output>
          <button type="button" data-qty="${it.quantity + 1}" aria-label="Increase">${ui.icon('plus')}</button>
        </div>
        <strong class="cart-line">${ui.price(it.product.price * it.quantity)}</strong>
        <button class="icon-btn" data-remove aria-label="Remove ${ui.esc(it.product.name)}">${ui.icon('trash')}</button>
      </li>`;

    function draw() {
      const items = cart?.items || [];
      if (!items.length) {
        root.innerHTML = `<div class="container">${ui.emptyState('Your cart is empty', 'Add a few delicious dishes to get started.', '<a class="btn btn-primary" href="/menu">Browse the menu</a>', 'bag')}</div>`;
        return;
      }
      const units = items.reduce((n, i) => n + i.quantity, 0);
      const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
      root.innerHTML = `
        <div class="container">
          <h1 class="page-title">Your cart</h1>
          <div class="cart-layout ${busy ? 'is-busy' : ''}">
            <ul class="cart-list">${items.map(itemRow).join('')}</ul>
            <aside class="summary">
              <h2>Order summary</h2>
              <dl><dt>Items</dt><dd>${units}</dd>
                  <dt class="total">Total</dt><dd class="total">${ui.price(cart.totalPrice || total)}</dd></dl>
              <button class="btn btn-primary btn-lg btn-block" data-checkout>Checkout</button>
              <a class="link center" href="/menu">Continue shopping</a>
            </aside>
          </div>
        </div>`;
    }

    async function reload() {
      cart = await api.cart();
      store.setCartCount(cart.items?.reduce((n, i) => n + i.quantity, 0) ?? 0);
      draw();
    }

    async function mutate(fn, success) {
      if (busy) return;
      busy = true; root.querySelector('.cart-layout')?.classList.add('is-busy');
      try { await fn(); await reload(); if (success) ui.toast(success, 'success'); }
      catch (err) { ui.toast(err.message, 'error'); }
      finally { busy = false; root.querySelector('.cart-layout')?.classList.remove('is-busy'); }
    }

    const onClick = async (e) => {
      const row = e.target.closest('[data-item]');
      const id = row && Number(row.dataset.item);
      const qtyBtn = e.target.closest('[data-qty]');
      if (qtyBtn) {
        const q = Number(qtyBtn.dataset.qty);
        if (q < 1) return mutate(() => api.removeFromCart(id), 'Item removed');
        return mutate(() => api.editQuantity(id, Math.min(q, 99)));
      }
      if (e.target.closest('[data-remove]')) return mutate(() => api.removeFromCart(id), 'Item removed');
      if (e.target.closest('[data-retry]')) return start();
      if (e.target.closest('[data-checkout]')) {
        const ok = await ui.confirmDialog({
          title: 'Place order?',
          message: `You are about to order ${store.cartCount} item(s) for ${ui.price(cart.totalPrice)}.`,
          confirmText: 'Place order',
        });
        if (!ok) return;
        await mutate(() => api.checkout());
        if (!cart.items?.length) {
          root.innerHTML = `<div class="container">${ui.emptyState('Order placed!', "Thank you — we're preparing your food.", '<a class="btn btn-primary" href="/menu">Order more</a>', 'check-circle')}</div>`;
          App.refreshEffects();
        }
      }
    };

    async function start() {
      root.innerHTML = '<div class="container"><div class="skeleton detail-skel"></div></div>';
      try { await reload(); }
      catch (err) { root.innerHTML = `<div class="container">${ui.errorState(err)}</div>`; }
    }

    root.addEventListener('click', onClick);
    await start();
    return () => root.removeEventListener('click', onClick);
  };
})(window.App);

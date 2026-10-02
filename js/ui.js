// Shared UI helpers: icons, escaping, formatting, toasts, dialogs, validation, product card.
(function (App) {
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const price = (n) => `${App.config.CURRENCY}${Number(n || 0).toFixed(2)}`;
  const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  // ---------- Icons (24x24 stroke icons, Lucide-style) ----------
  const ICONS = {
    utensils: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7',
    leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
    flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    bag: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0',
    trash: 'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6',
    user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    menu: 'M3 12h18 M3 6h18 M3 18h18',
    contrast: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 2v20 M12 2a10 10 0 0 1 0 20z',
    check: 'M20 6 9 17l-5-5',
    x: 'M18 6 6 18 M6 6l12 12',
    alert: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01',
    'check-circle': 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3',
    arrow: 'M5 12h14 M12 5l7 7-7 7',
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35',
    plus: 'M12 5v14 M5 12h14',
    minus: 'M5 12h14',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'eye-off': 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94 M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19 M14.12 14.12a3 3 0 1 1-4.24-4.24 M1 1l22 22',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
    pizza: 'M15 11h.01 M11 15h.01 M16 16h.01 m2 16 20 6-6-20A20 20 0 0 0 2 16 M5.71 17.11a17.04 17.04 0 0 1 11.4-11.4',
    cake: 'M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8 M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1 M2 21h20 M7 8v3 M12 8v3 M17 8v3 M7 4h.01 M12 4h.01 M17 4h.01',
    soup: 'M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z M7 21h10 M19.5 12 22 6 M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62 M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62 M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.74 1.62',
    bowl: 'M4 11h16a8 8 0 0 1-16 0z M8 21h8 M9 7c0-2 2-2 2-4 M14 7c0-2 2-2 2-4',
  };
  const CATEGORY_ICONS = { Appetizers: 'leaf', 'First Courses': 'soup', 'Main Courses': 'utensils', Pizzas: 'pizza', 'Side Dishes': 'bowl', Desserts: 'cake' };

  const icon = (name, cls = '') =>
    `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[name] || ICONS.utensils}"/></svg>`;

  const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#c8e0f4"/>' +
    `<g transform="translate(164 114) scale(3)" fill="none" stroke="#508aa8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS.utensils}"/></g></svg>`);

  // Broken images fall back to a placeholder (capture phase: error events don't bubble).
  document.addEventListener('error', (e) => {
    const t = e.target;
    if (t.tagName === 'IMG' && !t.dataset.fallback) { t.dataset.fallback = '1'; t.src = PLACEHOLDER; }
  }, true);

  const img = (src, alt, cls = '', eager = false) =>
    `<img class="${cls}" src="${esc(src || PLACEHOLDER)}" alt="${esc(alt)}" ${eager ? '' : 'loading="lazy"'} decoding="async">`;

  const stars = (rate = 0) => {
    const r = Math.max(0, Math.min(5, Number(rate) || 0));
    const five = icon('star', 'ic-fill').repeat(5);
    return `<span class="stars" role="img" aria-label="Rated ${r.toFixed(1)} out of 5">` +
      `<span class="stars-bg">${five}</span><span class="stars-fg" style="width:${(r / 5) * 100}%">${five}</span></span>` +
      `<span class="rate-num">${r.toFixed(1)}</span>`;
  };
  const spice = (n) => n > 0
    ? `<span class="badge badge-spice" title="Spiciness ${n}/5" aria-label="Spiciness ${n} out of 5">${icon('flame').repeat(Math.min(n, 5))}</span>` : '';
  const veg = (v) => v ? `<span class="badge badge-veg">${icon('leaf')} Veg</span>` : '';

  // ---------- Toasts: top-centre, white card, black text ----------
  const TOAST_ICON = { success: 'check-circle', error: 'alert', info: 'info' };
  function toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = `${icon(TOAST_ICON[type] || 'info')}<span>${esc(message)}</span><button type="button" aria-label="Dismiss">${icon('x')}</button>`;
    const close = () => { el.classList.remove('show'); setTimeout(() => el.remove(), 250); };
    el.querySelector('button').addEventListener('click', close);
    document.getElementById('toasts').append(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(close, type === 'error' ? 5500 : 3200);
  }

  // ---------- Confirm dialog ----------
  function confirmDialog({ title, message, confirmText = 'Confirm', danger = false }) {
    const dlg = document.getElementById('dialog');
    dlg.innerHTML = `
      <form method="dialog" class="dialog-body">
        <h2>${esc(title)}</h2><p>${esc(message)}</p>
        <div class="dialog-actions">
          <button class="btn btn-ghost" value="cancel">Cancel</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" value="ok" autofocus>${esc(confirmText)}</button>
        </div>
      </form>`;
    return new Promise((resolve) => {
      dlg.addEventListener('close', () => resolve(dlg.returnValue === 'ok'), { once: true });
      dlg.returnValue = 'cancel';
      dlg.showModal();
    });
  }

  // ---------- Validation ----------
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PW_RULES = [
    { id: 'len', label: 'At least 8 characters', test: (v) => v.length >= 8 },
    { id: 'upper', label: 'One uppercase letter (A–Z)', test: (v) => /[A-Z]/.test(v) },
    { id: 'lower', label: 'One lowercase letter (a–z)', test: (v) => /[a-z]/.test(v) },
    { id: 'digit', label: 'One number (0–9)', test: (v) => /\d/.test(v) },
    { id: 'special', label: 'One special character (!@#$…)', test: (v) => /[^A-Za-z0-9]/.test(v) },
  ];

  const labelOf = (input) => input.closest('.field')?.querySelector('label')?.dataset.text || input.name;

  function validateField(input) {
    const v = input.value;
    const t = v.trim();
    const label = labelOf(input);
    if (input.required && !t) return `${label} is required`;
    if (!t) return '';
    if (input.type === 'email' && !EMAIL_RE.test(t)) return 'Enter a valid email address';
    if (input.type === 'url') { try { new URL(t); } catch { return 'Enter a valid URL, e.g. https://example.com/me.jpg'; } }
    if (input.dataset.rule === 'password' && !PW_RULES.every((r) => r.test(v))) return 'Password does not meet all the requirements';
    if (input.dataset.rule === 'phone' && !/^\+?[0-9\s().-]{7,18}$/.test(t)) return 'Enter a valid phone number';
    if (input.minLength > 0 && v.length < input.minLength) return `${label} must be at least ${input.minLength} characters`;
    if (input.type === 'number') {
      const n = Number(t);
      if (Number.isNaN(n)) return `${label} must be a number`;
      if (input.min !== '' && n < Number(input.min)) return `${label} must be at least ${input.min}`;
      if (input.max !== '' && n > Number(input.max)) return `${label} must be at most ${input.max}`;
    }
    if (input.dataset.match) {
      const other = input.form.elements[input.dataset.match];
      if (other && other.value !== v) return 'Passwords do not match';
    }
    return '';
  }

  function setFieldError(input, msg) {
    const wrap = input.closest('.field');
    wrap?.querySelector('.field-error')?.remove();
    if (!msg) { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); return; }
    input.setAttribute('aria-invalid', 'true');
    const p = document.createElement('p');
    p.className = 'field-error'; p.id = `err-${input.name}`; p.textContent = msg;
    wrap?.append(p);
    input.setAttribute('aria-describedby', p.id);
  }

  function updatePwRules(input) {
    const list = input.closest('.field')?.querySelector('.pw-rules');
    if (!list) return;
    PW_RULES.forEach((r) => list.querySelector(`[data-rule="${r.id}"]`)?.classList.toggle('ok', r.test(input.value)));
  }

  function validateForm(form) {
    let first = null;
    [...form.elements].filter((e) => e.matches('input, select, textarea')).forEach((el) => {
      el.dataset.touched = '1';
      const msg = validateField(el);
      setFieldError(el, msg);
      if (msg && !first) first = el;
    });
    first?.focus();
    return !first;
  }

  function clearErrors(form) { form.querySelector('.form-error')?.remove(); }

  /** Map a server error (field errors or message) onto the form. */
  function showError(form, err) {
    let shown = false;
    Object.entries(err?.errors || {}).forEach(([key, msgs]) => {
      const input = form.elements[key.charAt(0).toLowerCase() + key.slice(1)];
      if (input?.matches?.('input, select')) { setFieldError(input, [].concat(msgs)[0]); shown = true; }
    });
    if (!shown) {
      form.insertAdjacentHTML('afterbegin', `<p class="form-error" role="alert">${icon('alert')}<span>${esc(err?.message || 'Something went wrong')}</span></p>`);
    }
  }

  const formValues = (form) => Object.fromEntries(new FormData(form).entries());

  /** Wire a form: live validation, busy state, server error display and re-entrancy guard. */
  function bindForm(form, handler) {
    form.noValidate = true;
    form.addEventListener('input', (e) => {
      const el = e.target;
      if (el.dataset.rule === 'password') updatePwRules(el);
      if (el.dataset.touched) setFieldError(el, validateField(el));
      form.querySelectorAll(`[data-match="${el.name}"]`).forEach((d) => { if (d.dataset.touched) setFieldError(d, validateField(d)); });
    });
    form.addEventListener('focusout', (e) => {
      const el = e.target;
      if (!el.matches?.('input') || (!el.value && !el.dataset.touched)) return;
      el.dataset.touched = '1';
      setFieldError(el, validateField(el));
    });
    form.querySelectorAll('[data-rule="password"]').forEach(updatePwRules);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.dataset.busy) return;
      clearErrors(form);
      if (!validateForm(form)) return;
      const btn = form.querySelector('[type=submit]');
      form.dataset.busy = '1';
      btn?.classList.add('is-loading'); if (btn) btn.disabled = true;
      try { await handler(formValues(form), form); }
      catch (err) { showError(form, err); }
      finally { delete form.dataset.busy; btn?.classList.remove('is-loading'); if (btn) btn.disabled = false; }
    });
  }

  // Show/hide password toggle (delegated).
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-toggle-pw]');
    if (!btn) return;
    const input = btn.parentElement.querySelector('input');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.innerHTML = icon(show ? 'eye-off' : 'eye');
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });

  const field = ({ name, label, type = 'text', value = '', required = false, autocomplete, extra = '', rule, match }) => `
    <div class="field">
      <label for="f-${name}" data-text="${esc(label)}">${esc(label)}${required ? '<span class="req" aria-hidden="true"> *</span>' : ''}</label>
      <div class="input-wrap">
        <input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" ${required ? 'required' : ''}
          ${autocomplete ? `autocomplete="${autocomplete}"` : ''} ${rule ? `data-rule="${rule}"` : ''} ${match ? `data-match="${match}"` : ''} ${extra}>
        ${type === 'password' ? `<button type="button" class="pw-toggle" data-toggle-pw aria-label="Show password">${icon('eye')}</button>` : ''}
      </div>
      ${rule === 'password' ? `<ul class="pw-rules" aria-label="Password requirements">${PW_RULES.map((r) =>
        `<li data-rule="${r.id}">${icon('check')}${icon('x', 'ic-x')}<span>${r.label}</span></li>`).join('')}</ul>` : ''}
    </div>`;

  // ---------- Product card ----------
  function productCard(p, i = 0) {
    return `
      <article class="card" data-id="${p.id}" data-aos="fade-up" data-aos-delay="${(i % 4) * 70}">
        <a class="card-media" href="product/${p.id}" aria-label="${esc(p.name)}">
          ${img(p.image, p.name)}
          <div class="card-badges">${veg(p.vegeterian ?? p.vegetarian)}${spice(p.spiciness)}</div>
        </a>
        <div class="card-body">
          <h3 class="card-title"><a href="product/${p.id}">${esc(p.name)}</a></h3>
          <p class="card-desc">${esc(p.description)}</p>
          <div class="card-rate">${stars(p.rate)}</div>
          <div class="card-foot">
            <strong class="price">${price(p.price)}</strong>
            <button class="btn btn-primary btn-sm" data-add="${p.id}" aria-label="Add ${esc(p.name)} to cart">${icon('plus')} Add</button>
          </div>
        </div>
      </article>`;
  }

  const skeletonCards = (n = 6) => Array.from({ length: n }, () =>
    '<div class="card skeleton"><div class="card-media"></div><div class="card-body"><i></i><i></i><i class="short"></i></div></div>').join('');

  const emptyState = (title, text, action = '', ico = 'utensils') =>
    `<div class="empty"><div class="empty-ico">${icon(ico)}</div><h2>${esc(title)}</h2><p>${esc(text)}</p>${action}</div>`;

  const errorState = (err, retry = true) =>
    `<div class="empty"><div class="empty-ico">${icon('alert')}</div><h2>Something went wrong</h2><p>${esc(err?.message)}</p>${retry ? '<button class="btn btn-primary" data-retry>Try again</button>' : ''}</div>`;

  /** Add to cart with auth gate, used by cards and the product page. */
  async function addToCart(productId, quantity = 1, btn) {
    if (!App.store.isAuthed) {
      toast('Please sign in to add items to your cart', 'info');
      App.navigate(`/login?next=${encodeURIComponent(App.appPath() + location.search)}`);
      return false;
    }
    btn && (btn.disabled = true);
    try {
      await App.api.addToCart(productId, quantity);
      await App.refreshCartCount();
      toast('Added to cart', 'success');
      return true;
    } catch (err) {
      toast(err.message, 'error');
      return false;
    } finally { btn && (btn.disabled = false); }
  }

  App.ui = {
    esc, price, debounce, icon, CATEGORY_ICONS, img, stars, spice, veg, toast, confirmDialog, formValues, bindForm, field,
    productCard, skeletonCards, emptyState, errorState, addToCart, showError, clearErrors, PW_RULES,
  };
})(window.App);

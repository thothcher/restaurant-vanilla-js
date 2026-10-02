// HTTP client: API key header, bearer token, automatic one-shot token refresh,
// unwrapping of the { data, meta } envelope and normalised errors.
(function (App) {
  const { API_BASE, API_KEY } = App.config;
  const store = App.store;

  class ApiError extends Error {
    constructor(message, status = 0, errors = {}) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.errors = errors; // { field: [messages] }
    }
  }

  async function send(path, { method = 'GET', body, query, auth = true } = {}) {
    const url = new URL(API_BASE + path);
    Object.entries(query || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
    const headers = { Accept: 'application/json', 'X-API-KEY': API_KEY };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth && store.accessToken) headers.Authorization = `Bearer ${store.accessToken}`;
    try {
      return await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    } catch {
      throw new ApiError('Network error. Check your connection and try again.');
    }
  }

  let refreshing = null;
  function refresh() {
    if (!store.refreshToken) return Promise.resolve(false);
    refreshing ||= (async () => {
      try {
        const res = await send(`/api/auth/refresh-access-token/${encodeURIComponent(store.refreshToken)}`, { method: 'POST', auth: false });
        if (!res.ok) return false;
        const json = await res.json();
        const tokens = json.data ?? json;
        if (!tokens.accessToken) return false;
        store.setTokens(tokens);
        return true;
      } catch { return false; } finally { refreshing = null; }
    })();
    return refreshing;
  }

  async function parse(res) {
    const text = await res.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { return text; }
  }

  async function request(path, opts = {}) {
    let res = await send(path, opts);
    if (res.status === 401 && opts.auth !== false && store.refreshToken) {
      if (await refresh()) res = await send(path, opts);
    }
    if (res.status === 401 && opts.auth !== false) {
      store.clear();
      throw new ApiError('Your session has expired. Please sign in again.', 401);
    }
    const payload = await parse(res);
    if (!res.ok) {
      const p = typeof payload === 'object' && payload ? payload : {};
      const errors = p.errors || {};
      const first = Object.values(errors).flat()[0];
      throw new ApiError(p.detail || first || p.title || p.message || `Request failed (${res.status})`, res.status, errors);
    }
    const data = payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
    // "Result" style responses may report failure inside a 200 body.
    if (data && typeof data === 'object' && data.isSuccess === false) {
      throw new ApiError(data.error?.message || 'Operation failed', data.error?.statusCode || 400);
    }
    return data;
  }

  const get = (p, query, o) => request(p, { ...o, query });
  const post = (p, body, o) => request(p, { ...o, method: 'POST', body });
  const put = (p, body, o) => request(p, { ...o, method: 'PUT', body });
  const del = (p, o) => request(p, { ...o, method: 'DELETE' });

  App.ApiError = ApiError;
  App.api = {
    // auth
    register: (b) => post('/api/auth/register', b, { auth: false }),
    login: (b) => post('/api/auth/login', b, { auth: false }),
    verifyEmail: (b) => put('/api/auth/verify-email', b, { auth: false }),
    resendVerification: (email) => post(`/api/auth/resend-email-verification/${encodeURIComponent(email)}`, undefined, { auth: false }),
    forgotPassword: (email) => post(`/api/auth/forgot-password/${encodeURIComponent(email)}`, undefined, { auth: false }),
    resetPassword: (b) => put('/api/auth/reset-password', b, { auth: false }),
    // catalogue
    categories: () => get('/api/categories', undefined, { auth: false }),
    products: (q) => get('/api/products/filter', q, { auth: false }),
    product: (id) => get(`/api/products/${id}`, undefined, { auth: false }),
    // cart
    cart: () => get('/api/cart'),
    addToCart: (productId, quantity = 1) => post('/api/cart/add-to-cart', { productId, quantity }),
    editQuantity: (itemId, quantity) => put('/api/cart/edit-quantity', { itemId, quantity }),
    removeFromCart: (itemId) => del(`/api/cart/remove-from-cart/${itemId}`),
    checkout: () => post('/api/cart/checkout'),
    // user
    me: () => get('/api/users/me'),
    profile: () => get('/api/users/profile'),
    editProfile: (b) => put('/api/users/edit', b),
    changePassword: (b) => put('/api/users/change-password', b),
    deleteAccount: () => del('/api/users/delete'),
  };

  /** Re-sync the header badge with the server cart. Safe to call when logged out. */
  App.refreshCartCount = async () => {
    if (!store.isAuthed) return store.setCartCount(0);
    try {
      const cart = await App.api.cart();
      store.setCartCount(cart?.items?.reduce((n, i) => n + i.quantity, 0) ?? 0);
    } catch { /* badge is non-critical */ }
  };
})(window.App);

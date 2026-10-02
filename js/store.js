// Auth tokens (persisted) + cart count (in memory) with a tiny pub/sub.
(function (App) {
  const KEY = 'restaurant.auth';
  const listeners = new Set();
  let auth = { accessToken: null, refreshToken: null };
  let cartCount = 0;
  let user = null;

  try { auth = { ...auth, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { /* ignore */ }

  const emit = () => listeners.forEach((fn) => fn());
  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify(auth)); } catch { /* storage unavailable */ }
  };

  App.store = {
    get accessToken() { return auth.accessToken; },
    get refreshToken() { return auth.refreshToken; },
    get isAuthed() { return !!auth.accessToken; },
    get cartCount() { return cartCount; },
    get user() { return user; },
    setTokens({ accessToken, refreshToken }) {
      auth = { accessToken: accessToken || null, refreshToken: refreshToken || auth.refreshToken };
      persist();
      emit();
    },
    setUser(u) { user = u; emit(); },
    setCartCount(n) { cartCount = n || 0; emit(); },
    clear() {
      auth = { accessToken: null, refreshToken: null };
      user = null;
      cartCount = 0;
      try { localStorage.removeItem(KEY); } catch { /* ignore */ }
      emit();
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
})(window.App);

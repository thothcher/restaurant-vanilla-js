// Per-route SEO: title, description, canonical, Open Graph / Twitter tags, robots and JSON-LD.
(function (App) {
  const SITE = 'Trattoria';
  const DEFAULT_DESC = 'Browse the Trattoria menu: pizzas, pastas, mains and desserts. Order online in a few taps.';

  function meta(selector, create) {
    let el = document.head.querySelector(selector);
    if (!el) { el = document.createElement(create.tag); Object.entries(create.attrs).forEach(([k, v]) => el.setAttribute(k, v)); document.head.append(el); }
    return el;
  }
  const setMeta = (attr, key, content) => meta(`meta[${attr}="${key}"]`, { tag: 'meta', attrs: { [attr]: key } }).setAttribute('content', content);

  App.seo = {
    set({ title, description = DEFAULT_DESC, path = App.appPath(), noindex = false, image, type = 'website', jsonLd } = {}) {
      const fullTitle = title ? `${title} | ${SITE}` : `${SITE} — Fresh Italian Dishes, Ordered Online`;
      const url = location.origin + App.url(path);
      document.title = fullTitle;
      setMeta('name', 'description', description);
      setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
      meta('link[rel="canonical"]', { tag: 'link', attrs: { rel: 'canonical' } }).setAttribute('href', url);
      setMeta('property', 'og:title', fullTitle);
      setMeta('property', 'og:description', description);
      setMeta('property', 'og:url', url);
      setMeta('property', 'og:type', type);
      setMeta('name', 'twitter:title', fullTitle);
      setMeta('name', 'twitter:description', description);
      if (image) { setMeta('property', 'og:image', image); setMeta('name', 'twitter:image', image); }
      else { document.head.querySelector('meta[property="og:image"]')?.remove(); document.head.querySelector('meta[name="twitter:image"]')?.remove(); }

      document.getElementById('page-jsonld')?.remove();
      if (jsonLd) {
        const s = document.createElement('script');
        s.type = 'application/ld+json'; s.id = 'page-jsonld';
        s.textContent = JSON.stringify(jsonLd);
        document.head.append(s);
      }
    },
  };
})(window.App);

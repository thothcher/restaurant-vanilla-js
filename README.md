# Trattoria — Restaurant (Vanilla JS)

**Live demo:** https://thothcher.github.io/restaurant-vanilla-js/

A restaurant ordering front-end built with **plain HTML, CSS and JavaScript — no framework, no build step** —
talking to the [RestaurantAPI](https://restaurantapi.stepacademy.ge). The same app is also available as a
[React version](https://github.com/thothcher/restaurant-react).

## Features

- **Menu** — search, category chips, vegetarian toggle, spiciness, price range and minimum rating; "Load more" pagination; filters are kept in the URL so a filtered menu can be shared
- **Product page** — details, ingredients, preparation method, quantity picker, add to cart
- **Cart** — change quantity, remove items, checkout with confirmation
- **Accounts** — register, email verification (with resend), login, forgot / reset password, profile editing, change password, delete account
- **Validation** — live per-field validation and a password-requirements checklist (8+ chars, upper, lower, number, special character)
- **Design** — brand palette, max 4px corners, SVG icons, dark mode, custom scrollbars, parallax and [AOS](https://michalsnik.github.io/aos/) scroll animations, top-centre toasts
- **SEO** — per-route title / description / canonical / Open Graph, Product + Restaurant JSON-LD, `noindex` on private pages, `robots.txt` and `sitemap.xml`

## Getting started

URLs are real paths (`/menu`, `/product/5`) handled by a small History API router, so serve the folder
with a single-page-app fallback:

```bash
npx serve -s . -l 5173
```

Then open http://localhost:5173. (Opening `index.html` directly from disk won't work.)

## Project structure

```
index.html            page shell, SEO defaults, <base> setup for GitHub Pages
404.html              GitHub Pages SPA fallback (redirects to index.html)
css/styles.css        design tokens and all styles
js/
  config.js           API URL/key, base-path helpers (App.url, App.appPath)
  store.js            auth tokens + cart count (pub/sub)
  api.js              HTTP client: API key, bearer token, auto refresh, error normalising
  seo.js              per-route meta tags and JSON-LD
  effects.js          AOS init + parallax
  ui.js               icons, toasts, dialogs, form validation, product card
  app.js              router, route guards, header, global events
  pages/              home, menu, product, cart, auth, profile
```

## Configuration

The API base URL and key live in [`js/config.js`](js/config.js).

> The API key is a browser-side key for a training API. Don't reuse this pattern for real secrets —
> anything shipped to the browser can be read by users.

## Deployment (GitHub Pages)

The site is served straight from the `main` branch (Settings → Pages → *Deploy from a branch*).
GitHub Pages hosts project sites under `/<repo>/` and has no single-page-app fallback, so:

- A tiny script in `index.html` sets `<base href>` to `/<repo>/` on `*.github.io` (and `/` everywhere else);
  links are relative to it, and the router uses `App.url()` / `App.appPath()` to add or strip the prefix.
- `404.html` redirects unknown paths (e.g. a refresh on `/menu`) to `index.html` with the path in the query string,
  and `index.html` restores the original URL (the [spa-github-pages](https://github.com/rafgraph/spa-github-pages) technique).

To deploy under a different repository name, update the URLs in `sitemap.xml`, `robots.txt` and the JSON-LD in `index.html`.

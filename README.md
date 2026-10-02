# Restaurant — Vanilla JS

Online restaurant front-end built with plain HTML, CSS and JavaScript (no build step), talking to the RestaurantAPI.

## Features
- Menu with search, category, vegetarian, spiciness, price and rating filters
- Product details, cart, checkout
- Register, email verification, login, forgot/reset password, profile
- Live password-requirement validation
- Parallax + AOS scroll animations, dark mode, SEO meta/JSON-LD

## Run
URLs are real paths (`/menu`, `/product/5`), so serve with an SPA fallback:

```
npx serve -s . -l 5173
```

Then open http://localhost:5173.

## Config
API base URL and key live in `js/config.js`.

See also the React version: `restaurant-react`.

// Global namespace shared by all scripts (classic scripts, so the app also works from file://).
window.App = {
  config: {
    API_BASE: 'https://restaurantapi.stepacademy.ge',
    API_KEY: '0cdc10b8-cf48-4010-9902-7a895179e018',
    PAGE_SIZE: 12,
    CURRENCY: '$',
  },
  pages: {},
};

// Sub-path the app is served from: '' locally, '/<repo>' on GitHub Pages (set via <base> in index.html).
App.BASE = (window.__BASE__ || '/').replace(/\/$/, '');
/** Real URL for an app path, e.g. url('/menu') -> '/restaurant-vanilla-js/menu'. */
App.url = (path) => App.BASE + path;
/** Current app path without the base prefix, e.g. '/menu'. */
App.appPath = () => location.pathname.slice(App.BASE.length) || '/';

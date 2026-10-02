// Scroll effects: AOS (reveal-on-scroll) + lightweight parallax driven by [data-parallax="speed"].
// Parallax offsets are computed from the (untransformed) parent so there is no feedback loop.
(function (App) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let items = [];
  let queued = false;

  function frame() {
    queued = false;
    const vh = innerHeight;
    for (const { el, speed } of items) {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const y = (vh / 2 - (r.top + r.height / 2)) * speed;
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    }
  }
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };

  if (window.AOS) AOS.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 50, disable: reduce });
  else document.documentElement.classList.add('no-aos'); // CDN blocked/offline: never leave content hidden

  if (!reduce) {
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', request);
  }

  /** Call after rendering new DOM so new [data-aos] / [data-parallax] elements are picked up. */
  App.refreshEffects = () => {
    window.AOS && AOS.refreshHard();
    items = reduce ? [] : [...document.querySelectorAll('[data-parallax]')].map((el) => ({ el, speed: parseFloat(el.dataset.parallax) || 0 }));
    request();
  };
})(window.App);

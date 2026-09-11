/**
 * Mobile navbar toggle + sticky header shadow on scroll.
 */
(function (global) {
  'use strict';

  function init() {
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('primaryNav');
    const header = document.getElementById('siteHeader');

    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('is-open');
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
      });

      nav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          nav.classList.remove('is-open');
          toggle.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    if (header) {
      const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 4);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }

  global.NavbarUI = { init };
})(window);

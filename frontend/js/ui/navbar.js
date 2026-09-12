/**
 * Mobile navbar toggle + sticky header shadow on scroll.
 */
(function (global) {
  'use strict';

  function init() {
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('primaryNav');
    const header = document.getElementById('siteHeader');

    if (toggle && nav && !toggle.dataset.navbarBound) {
      // Guard against double-initialization (e.g. a page-specific script
      // calling NavbarUI.init() again) attaching a second click listener,
      // which would make the two `classList.toggle()` calls cancel each
      // other out and the menu appear stuck / non-responsive.
      toggle.dataset.navbarBound = '1';
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

  // Initialize independently of page-specific scripts so every page gets the same navbar behavior.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window);

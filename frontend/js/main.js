/**
 * Frontend entry point. Boots all UI modules.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    window.NavbarUI && window.NavbarUI.init();
    window.FavoriteUI && window.FavoriteUI.init();
    window.SearchUI && window.SearchUI.init();

    if (window.Api && window.Api.health) {
      window.Api.health()
        .then((res) => console.log('[health] Backend OK:', res))
        .catch((err) => console.warn('[health] Backend not reachable:', err.message));
    }
  });
})();

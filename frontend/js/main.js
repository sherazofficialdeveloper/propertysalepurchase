/**
 * Frontend entry point. Boots all UI modules.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // NavbarUI initializes itself (see js/ui/navbar.js) so every page gets the
    // same behavior automatically. Do NOT call NavbarUI.init() again here —
    // doing so on index.html attached a second click listener to the toggle
    // button, which caused each click to open then immediately re-close the
    // menu (two `classList.toggle()` calls cancelling out), making the
    // hamburger button appear completely non-functional on the home page.
    window.FavoriteUI && window.FavoriteUI.init();
    window.SearchUI && window.SearchUI.init();

    if (window.Api && window.Api.health) {
      window.Api.health()
        .then((res) => console.log('[health] Backend OK:', res))
        .catch((err) => console.warn('[health] Backend not reachable:', err.message));
    }
  });
})();

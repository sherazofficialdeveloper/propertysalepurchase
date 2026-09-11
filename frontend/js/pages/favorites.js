/**
 * Favorites page controller.
 * Loads GET /api/favorites. Renders cards via PropertyCard.
 */
(function (global) {
  'use strict';

  function renderLoading() {
    const grid = document.getElementById('favGrid');
    if (!grid) return;
    grid.innerHTML = Array.from({ length: 3 }, () => global.PropertyCard.renderSkeleton()).join('');
    document.getElementById('favEmpty')?.setAttribute('hidden', '');
    document.getElementById('favError')?.setAttribute('hidden', '');
  }
  function renderEmpty() {
    const grid = document.getElementById('favGrid');
    if (grid) grid.innerHTML = '';
    document.getElementById('favEmpty')?.removeAttribute('hidden');
    document.getElementById('favError')?.setAttribute('hidden', '');
  }
  function renderError() {
    const grid = document.getElementById('favGrid');
    if (grid) grid.innerHTML = '';
    document.getElementById('favError')?.removeAttribute('hidden');
    document.getElementById('favEmpty')?.setAttribute('hidden', '');
  }

  function setCount(n) {
    const el = document.getElementById('favCount');
    if (el) el.textContent = `${n} saved propert${n === 1 ? 'y' : 'ies'}`;
  }

  async function load() {
    renderLoading();
    try {
      const res = await global.Api.favorites.list();
      const items = (res && res.favorites) || [];
      setCount(items.length);

      if (!items.length) { renderEmpty(); return; }

      const grid = document.getElementById('favGrid');
      grid.innerHTML = items.map((f) => global.PropertyCard.render(f.property)).join('');
      global.PropertyCard.bindFavorites(grid);
      document.getElementById('favEmpty')?.setAttribute('hidden', '');
      document.getElementById('favError')?.setAttribute('hidden', '');
    } catch (err) {
      if (err && err.status === 401) {
        location.replace('login.html?next=' + encodeURIComponent('favorites.html'));
        return;
      }
      console.error('[favorites] load failed:', err);
      renderError();
    }
  }

  function init() {
    // Guard: redirect guests
    if (global.Session) {
      global.Session.ensure().then((u) => {
        if (!u) { location.replace('login.html?next=' + encodeURIComponent('favorites.html')); return; }
        load();
      });
    } else {
      load();
    }
    document.getElementById('favRetry')?.addEventListener('click', load);

    // When user removes a favorite via the card, reload the list to reflect removal.
    if (global.Favorites && global.Favorites.onChange) {
      global.Favorites.onChange(() => {
        // Only reload if we're currently showing the favorites page AND a card was removed.
        // Simple approach: if current size < rendered cards count, reload.
        const grid = document.getElementById('favGrid');
        if (!grid) return;
        const rendered = grid.querySelectorAll('.property-card').length;
        if (rendered > global.Favorites.size()) load();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);

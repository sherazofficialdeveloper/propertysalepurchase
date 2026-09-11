/**
 * Home page Featured Properties loader.
 * Binds favorites once loaded.
 */
(function (global) {
  'use strict';

  function init() {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;

    grid.innerHTML = Array.from({ length: 3 }, () => global.PropertyCard.renderSkeleton()).join('');

    const start = () => {
      global.PropertySource.list('featured=true&limit=3&sort=featured')
        .then((res) => {
          const items = (res && res.properties) || [];
          if (!items.length) {
            grid.innerHTML = '<p class="muted" style="grid-column:1/-1;">No featured properties yet.</p>';
            return;
          }
          grid.innerHTML = items.map(global.PropertyCard.render).join('');
          global.PropertyCard.bindFavorites(grid);
        })
        .catch((err) => {
          console.warn('[home-featured] load failed:', err);
          grid.innerHTML = '<p class="muted" style="grid-column:1/-1;">Unable to load featured properties right now.</p>';
        });
    };

    if (global.Favorites) global.Favorites.ensureLoaded().then(start, start);
    else start();
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);

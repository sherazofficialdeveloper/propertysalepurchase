/** Compatibility wrapper: favorites are handled by the API-backed Favorites module. */
(function (global) {
  'use strict';
  function init() {
    document.querySelectorAll('.fav-btn').forEach((btn) => {
      if (btn.dataset.favoriteBound) return;
      btn.dataset.favoriteBound = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (global.PropertyCard && global.PropertyCard.bindFavorites) {
          global.PropertyCard.bindFavorites(btn.closest('.property-grid, .properties-grid, main') || document);
        }
      });
    });
  }
  global.FavoriteUI = { init };
})(window);

/**
 * Sort dropdown binding.
 */
(function (global) {
  'use strict';

  function init() {
    const el = document.getElementById('sortSelect');
    if (!el) return;
    el.addEventListener('change', () => {
      global.FilterState.set({ sort: el.value });
      global.dispatchEvent(new CustomEvent('filters:changed'));
    });
  }

  function sync() {
    const el = document.getElementById('sortSelect');
    if (!el) return;
    el.value = global.FilterState.get().sort;
  }

  global.SortUI = { init, sync };
})(window);

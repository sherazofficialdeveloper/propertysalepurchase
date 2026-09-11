/**
 * Home Page search panel -> Properties Page redirect.
 * Phase 1 only logged values; Phase 2 wires real navigation.
 */
(function (global) {
  'use strict';

  function init() {
    const form = document.getElementById('heroSearchForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const params = new URLSearchParams();
      const map = {
        location: 'location',
        propertyType: 'type',
        purpose: 'purpose',
        minPrice: 'minPrice',
        maxPrice: 'maxPrice',
      };
      Object.entries(map).forEach(([field, key]) => {
        const v = (data[field] || '').trim();
        if (v) params.set(key, v);
      });
      const qs = params.toString();
      location.href = 'properties.html' + (qs ? '?' + qs : '');
    });
  }

  global.SearchUI = { init };
})(window);

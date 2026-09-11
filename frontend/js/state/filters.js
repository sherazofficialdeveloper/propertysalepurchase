/**
 * Centralized filter / sort / pagination state.
 * Single source of truth. UI modules read/write through this.
 */
(function (global) {
  'use strict';

  const DEFAULTS = {
    location: '',
    type: '',
    purpose: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    minArea: '',
    maxArea: '',
    status: '',
    parking: false,
    furnished: false,
    featured: false,
    sort: 'featured',
    page: 1,
    limit: 9,
  };

  let state = { ...DEFAULTS };

  function get() { return { ...state }; }

  function set(patch) {
    state = { ...state, ...patch };
    if (!('page' in patch)) state.page = 1; // reset page when filters change
    return get();
  }

  function reset() {
    state = { ...DEFAULTS };
    return get();
  }

  function toQuery() {
    const p = new URLSearchParams();
    Object.entries(state).forEach(([k, v]) => {
      if (v === '' || v === false || v === null || v === undefined) return;
      p.set(k, String(v));
    });
    return p.toString();
  }

  function fromQuery(search) {
    const p = new URLSearchParams(search);
    const patch = {};
    Object.keys(DEFAULTS).forEach((k) => {
      if (!p.has(k)) return;
      const raw = p.get(k);
      if (typeof DEFAULTS[k] === 'boolean') patch[k] = raw === 'true';
      else if (typeof DEFAULTS[k] === 'number') patch[k] = Number(raw);
      else patch[k] = raw;
    });
    return set(patch);
  }

  global.FilterState = { get, set, reset, toQuery, fromQuery, DEFAULTS };
})(window);

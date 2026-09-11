/**
 * Properties page controller.
 * Uses PropertySource (API → mock fallback).
 */
(function (global) {
  'use strict';

  function showNotice(source) {
    const el = document.getElementById('dataNotice');
    if (!el) return;
    if (source === 'fallback') {
      el.textContent = 'Showing demo properties. Live listings are unavailable right now.';
      el.hidden = false;
    } else {
      el.hidden = true;
      el.textContent = '';
    }
  }

  async function loadProperties(query) {
    const qs = buildQueryString(query);
    const res = await global.PropertySource.list(qs);
    return {
      items: (res && res.properties) || [],
      total: (res && res.pagination && res.pagination.total) || 0,
      pagination: res.pagination || { page: 1, limit: 9, total: 0, totalPages: 1 },
      source: res && res.source,
    };
  }

  function buildQueryString(q) {
    const p = new URLSearchParams();
    const map = {
      location: 'location', type: 'propertyType', purpose: 'purpose',
      minPrice: 'minPrice', maxPrice: 'maxPrice',
      bedrooms: 'bedrooms', bathrooms: 'bathrooms',
      minArea: 'minArea', maxArea: 'maxArea',
      status: 'status', sort: 'sort', page: 'page', limit: 'limit',
    };
    Object.entries(map).forEach(([from, to]) => {
      const v = q[from];
      if (v === '' || v === false || v == null) return;
      if (from === 'purpose' || from === 'type' || from === 'status') p.set(to, String(v).toLowerCase());
      else p.set(to, String(v));
    });
    if (q.featured) p.set('featured', 'true');
    return p.toString();
  }

  function renderLoading() {
    const grid = document.getElementById('propertyGrid');
    if (!grid) return;
    grid.innerHTML = Array.from({ length: 6 }, () => global.PropertyCard.renderSkeleton()).join('');
    document.getElementById('emptyState')?.setAttribute('hidden', '');
    document.getElementById('errorState')?.setAttribute('hidden', '');
    document.getElementById('dataNotice')?.setAttribute('hidden', '');
  }
  function renderEmpty() {
    const grid = document.getElementById('propertyGrid');
    if (grid) grid.innerHTML = '';
    document.getElementById('emptyState')?.removeAttribute('hidden');
    document.getElementById('errorState')?.setAttribute('hidden', '');
  }
  function renderError() {
    const grid = document.getElementById('propertyGrid');
    if (grid) grid.innerHTML = '';
    document.getElementById('errorState')?.removeAttribute('hidden');
    document.getElementById('emptyState')?.setAttribute('hidden', '');
  }

  function renderResult(result) {
    const grid = document.getElementById('propertyGrid');
    if (!grid) return;
    document.getElementById('emptyState')?.setAttribute('hidden', '');
    document.getElementById('errorState')?.setAttribute('hidden', '');
    showNotice(result.source);
    if (!result.items.length) return renderEmpty();
    grid.innerHTML = result.items.map(global.PropertyCard.render).join('');
    global.PropertyCard.bindFavorites(grid);
  }

  function renderSummary(result, query) {
    const el = document.getElementById('resultSummary');
    if (!el) return;
    const bits = [`${result.total} Propert${result.total === 1 ? 'y' : 'ies'} Found`];
    if (query.location) bits.push(`in ${query.location}`);
    el.textContent = bits.join(' ');
  }

  async function refresh() {
    const query = global.FilterState.get();
    renderLoading();
    try {
      const result = await loadProperties(query);
      renderResult(result);
      renderSummary(result, query);
      global.ActiveChipsUI.render();
      global.PaginationUI.render(result.total, query.limit);
      global.SortUI.sync();
      const qs = global.FilterState.toQuery();
      if (qs) history.replaceState(null, '', '?' + qs);
      else history.replaceState(null, '', location.pathname);
    } catch (err) {
      console.error('[properties] load failed:', err);
      renderError();
    }
  }

  function init() {
    global.FilterState.fromQuery(location.search);
    global.FiltersUI.init();
    global.FiltersUI.syncInputsFromState();
    global.SortUI.init();

    const start = () => {
      window.addEventListener('filters:changed', refresh);
      document.getElementById('errorRetry')?.addEventListener('click', refresh);
      document.getElementById('emptyReset')?.addEventListener('click', () => {
        global.FilterState.reset();
        global.FiltersUI.syncInputsFromState();
        refresh();
      });
      refresh();
    };
    if (global.Favorites) global.Favorites.ensureLoaded().then(start, start);
    else start();
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);

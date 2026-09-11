/**
 * Active filter chips: display applied filters as removable chips.
 */
(function (global) {
  'use strict';

  function labelFor(key, value) {
    const map = {
      location: 'Location', type: 'Type', purpose: 'Purpose',
      minPrice: 'Min Price', maxPrice: 'Max Price',
      bedrooms: 'Bedrooms', bathrooms: 'Bathrooms',
      minArea: 'Min Area', maxArea: 'Max Area',
      status: 'Status', parking: 'Parking',
      furnished: 'Furnished', featured: 'Featured',
    };
    return map[key] || key;
  }

  function render() {
    const container = document.getElementById('activeChips');
    if (!container) return;
    const s = global.FilterState.get();
    const chips = [];

    Object.keys(s).forEach((k) => {
      if (k === 'sort' || k === 'page' || k === 'limit') return;
      const v = s[k];
      if (v === '' || v === false || v === null || v === undefined) return;
      const shown = v === true ? 'Yes' : v;
      chips.push(`
        <button type="button" class="filter-chip" data-key="${k}" aria-label="Remove ${labelFor(k)} filter">
          <span>${labelFor(k)}: ${shown}</span>
          <span class="filter-chip-x" aria-hidden="true">&times;</span>
        </button>
      `);
    });

    if (chips.length === 0) {
      container.innerHTML = '';
      container.classList.remove('has-chips');
      return;
    }

    container.classList.add('has-chips');
    container.innerHTML = chips.join('') +
      '<button type="button" class="filter-chip-clear" id="clearAllChips">Clear All</button>';

    container.querySelectorAll('.filter-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const def = global.FilterState.DEFAULTS[key];
        global.FilterState.set({ [key]: typeof def === 'boolean' ? false : '' });
        global.FiltersUI.syncInputsFromState();
        global.dispatchEvent(new CustomEvent('filters:changed'));
      });
    });

    const clearAll = document.getElementById('clearAllChips');
    if (clearAll) {
      clearAll.addEventListener('click', () => {
        global.FilterState.reset();
        global.FiltersUI.syncInputsFromState();
        global.dispatchEvent(new CustomEvent('filters:changed'));
      });
    }
  }

  global.ActiveChipsUI = { render };
})(window);

/**
 * Filter panel behavior: bind inputs to FilterState, emit "filters:changed".
 */
(function (global) {
  'use strict';

  function bindInput(id, key, transform) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      const raw = el.type === 'checkbox' ? el.checked : el.value;
      global.FilterState.set({ [key]: transform ? transform(raw) : raw });
      global.dispatchEvent(new CustomEvent('filters:changed'));
    });
  }

  function init() {
    // Sidebar filters
    bindInput('fType', 'type');
    bindInput('fCity', 'location');
    bindInput('fPurpose', 'purpose');
    bindInput('fMinPrice', 'minPrice');
    bindInput('fMaxPrice', 'maxPrice');
    bindInput('fBedrooms', 'bedrooms');
    bindInput('fBathrooms', 'bathrooms');
    bindInput('fMinArea', 'minArea');
    bindInput('fMaxArea', 'maxArea');
    bindInput('fStatus', 'status');
    bindInput('fParking', 'parking');
    bindInput('fFurnished', 'furnished');
    bindInput('fFeatured', 'featured');

    // Top search bar
    bindInput('sLocation', 'location');
    bindInput('sType', 'type');
    bindInput('sPurpose', 'purpose');
    bindInput('sMinPrice', 'minPrice');
    bindInput('sMaxPrice', 'maxPrice');

    const searchForm = document.getElementById('propertiesSearchForm');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // read all top fields at once
        const patch = {
          location: (document.getElementById('sLocation') || {}).value || '',
          type: (document.getElementById('sType') || {}).value || '',
          purpose: (document.getElementById('sPurpose') || {}).value || '',
          minPrice: (document.getElementById('sMinPrice') || {}).value || '',
          maxPrice: (document.getElementById('sMaxPrice') || {}).value || '',
        };
        global.FilterState.set(patch);
        global.dispatchEvent(new CustomEvent('filters:changed'));
      });
    }

    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        global.FilterState.reset();
        syncInputsFromState();
        global.dispatchEvent(new CustomEvent('filters:changed'));
      });
    }

    // Mobile filter toggle
    const mobileToggle = document.getElementById('mobileFilterToggle');
    const filterPanel = document.getElementById('filterPanel');
    if (mobileToggle && filterPanel) {
      mobileToggle.addEventListener('click', () => {
        const open = filterPanel.classList.toggle('is-open');
        mobileToggle.setAttribute('aria-expanded', String(open));
      });
    }
  }

  /** Push current FilterState values into all bound inputs. */
  function syncInputsFromState() {
    const s = global.FilterState.get();
    const map = {
      fType: 'type', fCity: 'location', fPurpose: 'purpose',
      fMinPrice: 'minPrice', fMaxPrice: 'maxPrice',
      fBedrooms: 'bedrooms', fBathrooms: 'bathrooms',
      fMinArea: 'minArea', fMaxArea: 'maxArea',
      fStatus: 'status', fParking: 'parking',
      fFurnished: 'furnished', fFeatured: 'featured',
      sLocation: 'location', sType: 'type', sPurpose: 'purpose',
      sMinPrice: 'minPrice', sMaxPrice: 'maxPrice',
    };
    Object.entries(map).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = Boolean(s[key]);
      else el.value = s[key] ?? '';
    });
  }

  global.FiltersUI = { init, syncInputsFromState };
})(window);

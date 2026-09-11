/**
 * Reusable property card renderer.
 * Wires the favorite button to the centralized Favorites module.
 */
(function (global) {
  'use strict';

  function formatPrice(n, currency) {
    return (currency || 'PKR') + ' ' + Number(n).toLocaleString('en-PK');
  }

  function badgeFor(p) {
    if (p.status === 'sold') return '<span class="badge badge-sold">Sold</span>';
    if (p.status === 'pending') return '<span class="badge badge-pending">Pending</span>';
    if (p.featured) return '<span class="badge badge-gold">Featured</span>';
    const label = p.purpose === 'purchase' ? 'For Purchase' : 'For Sale';
    return `<span class="badge badge-sale">${label}</span>`;
  }

  function typeLabel(p) {
    return (p.propertyType || '').charAt(0).toUpperCase() + (p.propertyType || '').slice(1);
  }

  function favButtonHtml(p) {
    const saved = global.Favorites && global.Favorites.has(p.id);
    return `
      <button class="fav-btn${saved ? ' is-active' : ''}" type="button"
              aria-pressed="${saved ? 'true' : 'false'}"
              aria-label="${saved ? 'Remove property from saved' : 'Save property'}"
              data-fav="${p.id}"
              title="${saved ? 'Remove from saved' : 'Save property'}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.4C.7 8.3 2.6 4.5 6.3 4.1c2-.2 3.8.8 4.8 2.5.5.9.7 1.4.9 1.4s.4-.5.9-1.4c1-1.7 2.8-2.7 4.8-2.5 3.7.4 5.6 4.2 3.8 7.5-2 4.8-9.5 9.4-9.5 9.4z"/></svg>
      </button>`;
  }

  function render(p) {
    const img = (p.images && p.images[0]) || '';
    return `
      <article class="property-card" data-id="${p.id}">
        <div class="property-media">
          ${badgeFor(p)}
          ${favButtonHtml(p)}
          ${img ? `<img src="${img}" alt="${p.title}" loading="lazy" />` : '<div class="property-media-empty" aria-hidden="true"></div>'}
        </div>
        <div class="property-body">
          <span class="property-type">${typeLabel(p)}</span>
          <h3 class="property-title">${p.title}</h3>
          <p class="property-location">${p.location}, ${p.city}</p>
          <ul class="property-meta">
            ${p.bedrooms ? `<li>${p.bedrooms} Beds</li>` : ''}
            ${p.bathrooms ? `<li>${p.bathrooms} Baths</li>` : ''}
            <li>${Number(p.area).toLocaleString()} ${p.areaUnit || 'sqft'}</li>
          </ul>
          <div class="property-footer">
            <span class="property-price">${formatPrice(p.price, p.currency)}</span>
            <a href="property-details.html?id=${p.id}" class="btn btn-primary btn-sm">View Details</a>
          </div>
        </div>
      </article>
    `;
  }

  function renderSkeleton() {
    return `
      <article class="property-card property-skeleton" aria-hidden="true">
        <div class="property-media skeleton-block"></div>
        <div class="property-body">
          <div class="skeleton-line skeleton-sm"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-sm"></div>
          <div class="skeleton-line skeleton-md"></div>
          <div class="skeleton-line skeleton-lg"></div>
        </div>
      </article>
    `;
  }

  /**
   * Wire click handlers for all `.fav-btn` inside `root`.
   * Uses centralized Favorites.toggle. Disables during in-flight call.
   */
  function bindFavorites(root) {
    root.querySelectorAll('.fav-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault(); e.stopPropagation();
        const id = btn.dataset.fav;
        if (!id || btn.disabled) return;

        // Guest → prompt
        if (!global.Auth || !global.Auth.isAuthenticated()) {
          global.Favorites && global.Favorites.toggle(id).catch(() => {});
          return;
        }

        btn.disabled = true;
        const wasSaved = btn.classList.contains('is-active');
        try {
          if (wasSaved) {
            await global.Favorites.remove(id);
            global.ShareUI && global.ShareUI.toast('Property removed from saved.');
          } else {
            await global.Favorites.add(id);
            global.ShareUI && global.ShareUI.toast('Property saved.');
          }
        } catch (err) {
          // Restore previous state on failure.
          global.ShareUI && global.ShareUI.toast((err && err.message) || 'Unable to update favorites.');
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  // When favorites change anywhere, refresh all visible buttons in one pass.
  if (global.Favorites && global.Favorites.onChange) {
    global.Favorites.onChange(() => {
      document.querySelectorAll('.fav-btn[data-fav]').forEach((btn) => {
        const id = btn.dataset.fav;
        const saved = global.Favorites.has(id);
        btn.classList.toggle('is-active', saved);
        btn.setAttribute('aria-pressed', String(saved));
        btn.setAttribute('aria-label', saved ? 'Remove property from saved' : 'Save property');
        btn.setAttribute('title', saved ? 'Remove from saved' : 'Save property');
      });
    });
  }

  global.PropertyCard = { render, renderSkeleton, formatPrice, bindFavorites };
})(window);

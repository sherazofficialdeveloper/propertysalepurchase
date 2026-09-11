/**
 * Property management page controller.
 * Seller sees own. Admin sees all + extra actions.
 */
(function (global) {
  'use strict';

  let user = null;
  let list = [];
  let filter = { scope: 'mine' }; // 'mine' | 'all' (admin only)

  const $ = (id) => document.getElementById(id);

  function formatPrice(n, currency) {
    return (currency || 'PKR') + ' ' + Number(n).toLocaleString('en-PK');
  }

  function statusBadge(p) {
    const map = { available: 'badge-sale', pending: 'badge-pending', sold: 'badge-sold' };
    return `<span class="badge ${map[p.status] || ''}">${p.status}</span>`;
  }

  function row(p) {
    const canEdit = user.role === 'admin' || (user.role === 'seller' && p.owner && p.owner.id === user.id);
    return `
      <tr>
        <td>
          <div class="mp-cell">
            <img class="mp-thumb" src="${(p.images && p.images[0]) || ''}" alt="" loading="lazy" />
            <div>
              <div class="mp-title">${p.title}</div>
              <div class="mp-sub">${p.city} &middot; ${p.propertyType}</div>
            </div>
          </div>
        </td>
        <td>${formatPrice(p.price, p.currency)}</td>
        <td>${statusBadge(p)}</td>
        <td>${p.featured ? '<span class="badge badge-gold">Featured</span>' : '—'}</td>
        <td>${p.isPublished ? 'Published' : 'Draft'}</td>
        <td>
          <div class="mp-actions">
            <a class="btn btn-ghost btn-sm" href="property-details.html?id=${p.id}" target="_blank" rel="noopener">View</a>
            ${canEdit ? `<a class="btn btn-outline btn-sm" href="property-form.html?id=${p.id}">Edit</a>` : ''}
            ${canEdit ? `<button class="btn btn-ghost btn-sm" data-action="delete" data-id="${p.id}">Delete</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }

  function renderList() {
    const tbody = $('mpTableBody');
    const empty = $('mpEmpty');
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = '';
      empty && (empty.hidden = false);
      return;
    }
    empty && (empty.hidden = true);
    tbody.innerHTML = list.map(row).join('');

    tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => confirmDelete(btn.dataset.id));
    });
  }

  async function confirmDelete(id) {
    const p = list.find((x) => x.id === id);
    if (!p) return;
    const ok = window.confirm(`Delete "${p.title}"?\n\nThis action cannot be undone.`);
    if (!ok) return;
    try {
      await global.Api.properties.remove(id);
      list = list.filter((x) => x.id !== id);
      renderList();
      global.ShareUI && global.ShareUI.toast('Property deleted');
    } catch (err) {
      global.ShareUI && global.ShareUI.toast(err.message || 'Delete failed');
    }
  }

  async function load() {
    const loading = $('mpLoading');
    const errorBox = $('mpError');
    loading && (loading.hidden = false);
    errorBox && (errorBox.hidden = true);

    const qs = new URLSearchParams();
    if (filter.scope === 'all') qs.set('all', 'true');
    else qs.set('mine', 'true');
    qs.set('limit', '48');

    try {
      const res = await global.Api.properties.list(qs.toString());
      list = (res && res.properties) || [];
      renderList();
    } catch (err) {
      errorBox && (errorBox.hidden = false);
      $('mpErrorMsg') && ($('mpErrorMsg').textContent = err.message || 'Unable to load properties.');
    } finally {
      loading && (loading.hidden = true);
    }
  }

  async function init() {
    // Auth guard
    user = await global.Session.ensure();
    if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
      $('mpForbidden') && ($('mpForbidden').hidden = false);
      $('mpContent') && ($('mpContent').hidden = true);
      return;
    }
    $('mpForbidden') && ($('mpForbidden').hidden = true);
    $('mpContent') && ($('mpContent').hidden = false);

    // Admin scope toggle
    if (user.role === 'admin') {
      const scope = $('mpScope');
      if (scope) {
        scope.hidden = false;
        scope.querySelectorAll('button').forEach((b) => {
          b.addEventListener('click', () => {
            scope.querySelectorAll('button').forEach((x) => x.classList.remove('is-active'));
            b.classList.add('is-active');
            filter.scope = b.dataset.scope;
            load();
          });
        });
      }
    }

    $('mpRetry') && $('mpRetry').addEventListener('click', load);
    load();
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);

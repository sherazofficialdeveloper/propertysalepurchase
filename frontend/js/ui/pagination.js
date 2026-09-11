/**
 * Pagination UI + behavior. Works against FilterState.page.
 */
(function (global) {
  'use strict';

  function render(total, limit) {
    const container = document.getElementById('pagination');
    if (!container) return;

    const pages = Math.max(1, Math.ceil(total / limit));
    const current = global.FilterState.get().page;

    if (pages <= 1) {
      container.innerHTML = '';
      return;
    }

    const btn = (label, page, disabled, active) => `
      <button type="button"
        class="page-btn${active ? ' is-active' : ''}"
        data-page="${page}"
        ${disabled ? 'disabled' : ''}
        aria-label="${label}">${label}</button>
    `;

    const items = [];
    items.push(btn('Previous', Math.max(1, current - 1), current === 1, false));

    for (let i = 1; i <= pages; i++) {
      items.push(btn(String(i), i, false, i === current));
    }

    items.push(btn('Next', Math.min(pages, current + 1), current === pages, false));

    container.innerHTML = items.join('');

    container.querySelectorAll('.page-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const p = Number(b.dataset.page);
        if (!p) return;
        global.FilterState.set({ page: p, limit });
        global.dispatchEvent(new CustomEvent('filters:changed'));
        document.getElementById('resultsTop')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  global.PaginationUI = { render };
})(window);

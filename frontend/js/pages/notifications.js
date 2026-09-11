/**
 * Notifications full page controller.
 * Reads from /api/notifications with filter + pagination.
 */
(function (global) {
  'use strict';

  let currentFilter = 'all'; // all | unread | read
  let currentPage = 1;
  const limit = 10;

  const $ = (id) => document.getElementById(id);

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderLoading() {
    $('nfList').innerHTML = `<div class="nf-item"><p class="muted" style="padding:12px;">Loading notifications…</p></div>`;
    $('nfEmpty').hidden = true;
    $('nfError').hidden = true;
  }
  function renderEmpty() {
    $('nfList').innerHTML = '';
    $('nfEmpty').hidden = false;
    $('nfError').hidden = true;
  }
  function renderError(message) {
    $('nfList').innerHTML = '';
    $('nfEmpty').hidden = true;
    $('nfError').hidden = false;
    $('nfErrorMessage').textContent = message || 'Unable to load notifications. Please try again.';
  }

  function renderList(items, pagination, unreadCount) {
    $('nfEmpty').hidden = true;
    $('nfError').hidden = true;
    $('nfSummary').textContent = `${pagination.total} notification${pagination.total === 1 ? '' : 's'} · ${unreadCount} unread`;

    if (!items.length) return renderEmpty();

    $('nfList').innerHTML = items.map((n) => {
      const href = global.Notifications.linkFor(n);
      const unread = !n.isRead;
      return `
        <article class="nf-item${unread ? ' is-unread' : ''}" data-id="${n.id}">
          <span class="nf-item-dot" aria-hidden="true"></span>
          <div class="nf-item-body">
            <div class="nf-item-title">${escapeHtml(n.title)}</div>
            <div class="nf-item-msg">${escapeHtml(n.message)}</div>
            <div class="nf-item-time">${escapeHtml(global.Notifications.timeAgo(n.createdAt))}</div>
          </div>
          <div class="nf-item-actions">
            ${href ? `<a class="btn btn-outline btn-sm" href="${href}" data-open="${n.id}">Open</a>` : ''}
            ${unread ? `<button class="btn btn-ghost btn-sm" data-mark="${n.id}">Mark read</button>` : ''}
            <button class="btn btn-ghost btn-sm" data-del="${n.id}" aria-label="Delete notification">Delete</button>
          </div>
        </article>`;
    }).join('');

    // Actions
    $('nfList').querySelectorAll('[data-mark]').forEach((b) => b.addEventListener('click', async () => {
      try { await global.Api.notifications.markRead(b.dataset.mark); await global.Notifications.refreshUnread(); load(); }
      catch (err) { global.ShareUI && global.ShareUI.toast((err && err.message) || 'Failed.'); }
    }));
    $('nfList').querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      const ok = window.confirm('Delete this notification?');
      if (!ok) return;
      try { await global.Api.notifications.remove(b.dataset.del); await global.Notifications.refreshUnread(); load(); }
      catch (err) { global.ShareUI && global.ShareUI.toast((err && err.message) || 'Failed.'); }
    }));
    $('nfList').querySelectorAll('[data-open]').forEach((a) => a.addEventListener('click', async () => {
      try { await global.Api.notifications.markRead(a.dataset.open); await global.Notifications.refreshUnread(); } catch (_) {}
    }));

    // Pagination
    const pag = $('nfPagination');
    if (pagination.totalPages <= 1) { pag.innerHTML = ''; return; }
    let html = '';
    for (let i = 1; i <= pagination.totalPages; i++) {
      html += `<button class="page-btn${i === pagination.page ? ' is-active' : ''}" data-page="${i}">${i}</button>`;
    }
    pag.innerHTML = html;
    pag.querySelectorAll('[data-page]').forEach((b) => b.addEventListener('click', () => {
      currentPage = Number(b.dataset.page); load(); window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
  }

  async function load() {
    renderLoading();
    try {
      const qs = new URLSearchParams();
      qs.set('page', String(currentPage));
      qs.set('limit', String(limit));
      if (currentFilter === 'unread') qs.set('isRead', 'false');
      if (currentFilter === 'read') qs.set('isRead', 'true');

      const res = await global.Api.notifications.list(qs.toString());
      renderList(res.notifications || [], res.pagination, res.unreadCount || 0);
    } catch (err) {
      if (err && err.status === 401) { location.replace('login.html?next=' + encodeURIComponent('notifications.html')); return; }
      renderError(err && err.message);
    }
  }

  function bindFilters() {
    document.querySelectorAll('.nf-filters button').forEach((b) => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.nf-filters button').forEach((x) => x.classList.remove('is-active'));
        b.classList.add('is-active');
        currentFilter = b.dataset.filter;
        currentPage = 1;
        load();
      });
    });
  }

  async function init() {
    if (global.Session) {
      const u = await global.Session.ensure();
      if (!u) { location.replace('login.html?next=' + encodeURIComponent('notifications.html')); return; }
    }
    bindFilters();

    $('nfMarkAll').addEventListener('click', async () => {
      try {
        await global.Api.notifications.markAllRead();
        await global.Notifications.refreshUnread();
        global.ShareUI && global.ShareUI.toast('All marked as read.');
        load();
      } catch (err) { global.ShareUI && global.ShareUI.toast((err && err.message) || 'Failed.'); }
    });
    $('nfRetry').addEventListener('click', load);

    load();
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);

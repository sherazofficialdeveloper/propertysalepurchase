/**
 * Centralized notifications module.
 * - Fetches unread count
 * - Renders the navbar bell + dropdown
 * - Integrates with Auth state (clears on logout)
 */
(function (global) {
  'use strict';

  const state = { unread: 0, items: [], lastFetch: 0 };
  const listeners = new Set();

  function notify() { listeners.forEach((fn) => { try { fn(state); } catch (_) {} }); }
  function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  async function refreshUnread() {
    if (!global.Auth || !global.Auth.isAuthenticated()) {
      state.unread = 0; renderBadge(); notify(); return 0;
    }
    try {
      const res = await global.Api.notifications.unreadCount();
      state.unread = res.count || 0;
    } catch (_) { state.unread = 0; }
    renderBadge(); notify();
    return state.unread;
  }

  async function refreshRecent(limit = 6) {
    if (!global.Auth || !global.Auth.isAuthenticated()) {
      state.items = []; renderDropdown(); notify(); return [];
    }
    try {
      const res = await global.Api.notifications.list('limit=' + limit);
      state.items = (res && res.notifications) || [];
      state.unread = res.unreadCount != null ? res.unreadCount : state.unread;
    } catch (_) { state.items = []; }
    renderBadge(); renderDropdown(); notify();
    return state.items;
  }

  function timeAgo(iso) {
    const t = new Date(iso).getTime();
    if (!t) return '';
    const diff = Date.now() - t;
    const sec = Math.floor(diff / 1000);
    if (sec < 45) return 'Just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return min + ' minute' + (min === 1 ? '' : 's') + ' ago';
    const hr = Math.floor(min / 60);
    if (hr < 24) return hr + ' hour' + (hr === 1 ? '' : 's') + ' ago';
    const d = new Date(iso);
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function linkFor(n) {
    if (!n) return null;
    const t = n.relatedEntityType;
    const id = n.relatedEntityId;
    if (!id) return null;
    if (t === 'property') return 'property-details.html?id=' + encodeURIComponent(id);
    if (t === 'inquiry') return 'dashboard.html#inquiries';
    return null;
  }

  function ensureBell() {
    const blocks = document.querySelectorAll('.nav-actions');
    if (!blocks.length) return;

    blocks.forEach((block) => {
      block.querySelectorAll('.notif-bell-wrap').forEach((n) => n.remove());
      if (!global.Auth || !global.Auth.isAuthenticated()) return;

      const wrap = document.createElement('div');
      wrap.className = 'notif-bell-wrap';
      wrap.innerHTML = `
        <button type="button" class="notif-bell" id="notifBell" aria-label="Notifications" aria-haspopup="true" aria-expanded="false">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6v-5a7 7 0 0 0-5.5-6.84V3a1.5 1.5 0 0 0-3 0v1.16A7 7 0 0 0 5 11v5l-1.5 2v1h17v-1Z"/>
          </svg>
          <span class="notif-badge" id="notifBadge" hidden>0</span>
        </button>
        <div class="notif-dropdown" id="notifDropdown" hidden>
          <header class="notif-dropdown-head">
            <strong>Notifications</strong>
            <button type="button" class="btn-link" id="notifMarkAll">Mark all read</button>
          </header>
          <div class="notif-dropdown-body" id="notifList"><p class="muted" style="padding:16px;">Loading…</p></div>
          <footer class="notif-dropdown-foot">
            <a href="notifications.html" class="btn-link">View All Notifications</a>
          </footer>
        </div>
      `;
      block.insertBefore(wrap, block.firstChild);

      const bell = wrap.querySelector('#notifBell');
      const dd = wrap.querySelector('#notifDropdown');

      bell.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = dd.hidden;
        dd.hidden = !open;
        bell.setAttribute('aria-expanded', String(open));
        if (open) refreshRecent(6);
      });
      document.addEventListener('click', (e) => {
        if (!wrap.contains(e.target)) { dd.hidden = true; bell.setAttribute('aria-expanded', 'false'); }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !dd.hidden) { dd.hidden = true; bell.setAttribute('aria-expanded', 'false'); }
      });

      wrap.querySelector('#notifMarkAll').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await global.Api.notifications.markAllRead();
          await refreshRecent(6);
          global.ShareUI && global.ShareUI.toast('All notifications marked as read.');
        } catch (err) {
          global.ShareUI && global.ShareUI.toast((err && err.message) || 'Unable to mark as read.');
        }
      });
    });

    renderBadge();
    renderDropdown();
  }

  function renderBadge() {
    document.querySelectorAll('#notifBadge').forEach((b) => {
      if (state.unread <= 0) { b.hidden = true; b.textContent = '0'; return; }
      b.hidden = false;
      b.textContent = state.unread > 99 ? '99+' : String(state.unread);
    });
  }

  function renderDropdown() {
    const list = document.getElementById('notifList');
    if (!list) return;
    if (!state.items.length) {
      list.innerHTML = '<p class="muted" style="padding:16px;text-align:center;">You\'re all caught up.</p>';
      return;
    }
    list.innerHTML = state.items.map((n) => {
      const href = linkFor(n);
      return `
        <a class="notif-item${n.isRead ? '' : ' is-unread'}" ${href ? `href="${href}"` : ''} data-id="${n.id}">
          <div class="notif-dot" aria-hidden="true"></div>
          <div class="notif-item-body">
            <div class="notif-item-title">${escapeHtml(n.title)}</div>
            <div class="notif-item-msg">${escapeHtml(n.message)}</div>
            <div class="notif-item-time">${escapeHtml(timeAgo(n.createdAt))}</div>
          </div>
        </a>`;
    }).join('');

    list.querySelectorAll('.notif-item').forEach((el) => {
      el.addEventListener('click', async () => {
        const id = el.dataset.id;
        try { await global.Api.notifications.markRead(id); } catch (_) {}
        state.items = state.items.map((n) => n.id === id ? { ...n, isRead: true } : n);
        state.unread = Math.max(0, state.unread - 1);
        renderBadge(); renderDropdown(); notify();
      });
    });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  let pollId = null;
  function startPolling(ms = 60000) { stopPolling(); pollId = setInterval(() => { refreshUnread(); }, ms); }
  function stopPolling() { if (pollId) { clearInterval(pollId); pollId = null; } }

  function init() {
    if (global.Auth && global.Auth.onChange) {
      global.Auth.onChange(() => {
        ensureBell();
        if (global.Auth.isAuthenticated()) { refreshUnread(); startPolling(60000); }
        else { state.unread = 0; state.items = []; renderBadge(); renderDropdown(); notify(); stopPolling(); }
      });
    }
    document.addEventListener('DOMContentLoaded', () => {
      ensureBell();
      if (global.Auth && global.Auth.isAuthenticated()) { refreshUnread(); startPolling(60000); }
    });
  }

  global.Notifications = { init, refreshUnread, refreshRecent, timeAgo, linkFor, onChange, getState: () => ({ ...state }) };
  init();
})(window);

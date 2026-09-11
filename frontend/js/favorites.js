/**
 * Centralized favorites module.
 * - Keeps an in-memory Set of property IDs (server is source of truth)
 * - Delegates to /api/favorites
 * - Provides helpers for any card/detail view
 * - Never stores favorites in localStorage
 */
(function (global) {
  'use strict';

  const ids = new Set();
  let loaded = false;
  let loadingPromise = null;
  const listeners = new Set();

  function notify() { listeners.forEach((fn) => { try { fn(ids); } catch (_) {} }); }

  async function ensureLoaded(force) {
    if (!global.Auth || !global.Auth.isAuthenticated()) {
      ids.clear(); loaded = true; notify(); return ids;
    }
    if (loaded && !force) return ids;
    if (loadingPromise && !force) return loadingPromise;

    loadingPromise = (async () => {
      try {
        const res = await global.Api.favorites.ids();
        ids.clear();
        (res && res.propertyIds || []).forEach((id) => ids.add(id));
        loaded = true;
      } catch (err) {
        // Not fatal — treat as empty; toast on user-initiated actions only.
        console.warn('[favorites] load failed:', err && err.message);
        ids.clear();
        loaded = true;
      } finally {
        loadingPromise = null;
        notify();
      }
      return ids;
    })();
    return loadingPromise;
  }

  function has(id) { return ids.has(id); }
  function all() { return Array.from(ids); }
  function size() { return ids.size; }

  async function add(id) {
    if (!global.Auth || !global.Auth.isAuthenticated()) {
      promptLogin();
      throw new Error('Authentication required');
    }
    const res = await global.Api.favorites.add(id);
    ids.add(id);
    notify();
    return res;
  }

  async function remove(id) {
    if (!global.Auth || !global.Auth.isAuthenticated()) {
      promptLogin();
      throw new Error('Authentication required');
    }
    const res = await global.Api.favorites.remove(id);
    ids.delete(id);
    notify();
    return res;
  }

  async function toggle(id) {
    await ensureLoaded();
    if (has(id)) return remove(id);
    return add(id);
  }

  function promptLogin() {
    if (global.ShareUI && global.ShareUI.toast) {
      global.ShareUI.toast('Please log in to save properties.');
    }
    // Subtle UX: don't auto-redirect — let user choose from the navbar.
  }

  function onChange(fn) {
    listeners.add(fn);
    if (loaded) fn(ids);
    return () => listeners.delete(fn);
  }

  // Reset when auth changes (login/logout).
  if (global.Auth && global.Auth.onChange) {
    global.Auth.onChange(() => { loaded = false; ensureLoaded(true); });
  }

  global.Favorites = { ensureLoaded, has, all, size, add, remove, toggle, onChange };
})(window);

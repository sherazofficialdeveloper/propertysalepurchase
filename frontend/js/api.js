/**
 * Centralized API helper.
 * Deployed: Vercel serves frontend + rewrites /api/* to Railway (same-origin).
 */
(function (global) {
  'use strict';
  const LOCAL_BACKEND_PORT = 5000;

  function resolveBaseUrl() {
    const host = (window.location.hostname || '').toLowerCase();
    const proto = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const configured = global.APP_CONFIG && global.APP_CONFIG.API_BASE_URL;
    if (typeof configured === 'string' && configured.trim()) {
      return configured.trim().replace(/\/+$/, '');
    }
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return proto + '//' + host + ':' + LOCAL_BACKEND_PORT + '/api';
    }
    return '/api';
  }

  const BASE_URL = resolveBaseUrl();
  try { console.log('[api] BASE_URL =', BASE_URL); } catch (_) {}

  async function request(method, path, body) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    };
    if (body !== undefined) options.body = JSON.stringify(body);
    const res = await fetch(BASE_URL + path, options);
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    if (!res.ok) {
      const error = new Error((data && data.message) || ('Request failed (' + res.status + ')'));
      error.status = res.status; error.data = data;
      throw error;
    }
    return data;
  }

  global.Api = {
    baseUrl: BASE_URL,
    get: (p) => request('GET', p),
    post: (p, b) => request('POST', p, b),
    put: (p, b) => request('PUT', p, b),
    del: (p) => request('DELETE', p),
    health: () => request('GET', '/health'),
    auth: {
      me: () => request('GET', '/auth/me'),
      login: (email, password) => request('POST', '/auth/login', { email, password }),
      register: (payload) => request('POST', '/auth/register', payload),
      logout: () => request('POST', '/auth/logout'),
    },
    users: {
      me: () => request('GET', '/users/me'),
      updateMe: (payload) => request('PUT', '/users/me', payload),
    },
    inquiries: {
      create: (payload) => request('POST', '/inquiries', payload),
      list: (qs) => request('GET', '/inquiries' + (qs ? '?' + qs : '')),
      get: (id) => request('GET', '/inquiries/' + encodeURIComponent(id)),
      updateStatus: (id, status) => request('PUT', '/inquiries/' + encodeURIComponent(id) + '/status', { status }),
    },
    properties: {
      list: (qs) => request('GET', '/properties' + (qs ? '?' + qs : '')),
      get: (id) => request('GET', '/properties/' + encodeURIComponent(id)),
      create: (p) => request('POST', '/properties', p),
      update: (id, p) => request('PUT', '/properties/' + encodeURIComponent(id), p),
      remove: (id) => request('DELETE', '/properties/' + encodeURIComponent(id)),
    },
    dashboard: {
      buyer: () => request('GET', '/dashboard/buyer'),
      seller: () => request('GET', '/dashboard/seller'),
      admin: () => request('GET', '/dashboard/admin'),
    },
    admin: {
      users: (qs) => request('GET', '/admin/users' + (qs ? '?' + qs : '')),
      setUserStatus: (id, isActive) => request('PUT', '/admin/users/' + encodeURIComponent(id) + '/status', { isActive }),
      setUserRole: (id, role) => request('PUT', '/admin/users/' + encodeURIComponent(id) + '/role', { role }),
    },
    favorites: {
      list: () => request('GET', '/favorites'),
      ids: () => request('GET', '/favorites/ids'),
      status: (propertyId) => request('GET', '/favorites/' + encodeURIComponent(propertyId) + '/status'),
      add: (propertyId) => request('POST', '/favorites/' + encodeURIComponent(propertyId)),
      remove: (propertyId) => request('DELETE', '/favorites/' + encodeURIComponent(propertyId)),
    },
    notifications: {
      list: (qs) => request('GET', '/notifications' + (qs ? '?' + qs : '')),
      unreadCount: () => request('GET', '/notifications/unread-count'),
      get: (id) => request('GET', '/notifications/' + encodeURIComponent(id)),
      markRead: (id) => request('PUT', '/notifications/' + encodeURIComponent(id) + '/read'),
      markAllRead: () => request('PUT', '/notifications/read-all'),
      remove: (id) => request('DELETE', '/notifications/' + encodeURIComponent(id)),
    },
  };
})(window);

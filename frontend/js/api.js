/**
 * Centralized API helper.
 */
(function (global) {
  'use strict';

  const API_HOST = window.location.hostname || 'localhost';
  const API_PROTOCOL = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const BASE_URL = `${API_PROTOCOL}//${API_HOST}:5000/api`;

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
      const error = new Error((data && data.message) || `Request failed (${res.status})`);
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  global.Api = {
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
      setUserStatus: (id, isActive) => request('PUT', `/admin/users/${encodeURIComponent(id)}/status`, { isActive }),
      setUserRole: (id, role) => request('PUT', `/admin/users/${encodeURIComponent(id)}/role`, { role }),
    },
    favorites: {
      list: () => request('GET', '/favorites'),
      ids: () => request('GET', '/favorites/ids'),
      status: (propertyId) => request('GET', `/favorites/${encodeURIComponent(propertyId)}/status`),
      add: (propertyId) => request('POST', `/favorites/${encodeURIComponent(propertyId)}`),
      remove: (propertyId) => request('DELETE', `/favorites/${encodeURIComponent(propertyId)}`),
    },
  };
})(window);

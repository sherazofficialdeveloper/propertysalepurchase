/**
 * Centralized frontend authentication module.
 * Navbar for guests: Login/Register.
 * Navbar for authed: Dashboard link + name chip + Logout.
 *
 * Optimization: on login/register pages, skip the /api/auth/me probe
 * unless the user just submitted. This removes the harmless 401 from
 * the browser console for guests.
 */
(function (global) {
  'use strict';

  let currentUser = null;
  let ready = null;
  const listeners = new Set();

  function dashboardHref() { return 'dashboard.html'; }

  function isAuthPage() {
    const p = location.pathname.toLowerCase();
    return p.endsWith('/login.html') || p.endsWith('/register.html');
  }

  async function fetchMe() {
    // Skip the probe on auth pages to avoid a guaranteed-401 on first visit.
    if (isAuthPage() && !sessionStorage.getItem('auth_probe')) {
      currentUser = null;
      return null;
    }
    try {
      const res = await global.Api.get('/auth/me');
      currentUser = res && res.user ? res.user : null;
    } catch (_) {
      currentUser = null;
    }
    return currentUser;
  }

  function notify() { listeners.forEach((fn) => { try { fn(currentUser); } catch (_) {} }); }

  function getInitials(name) {
    if (!name) return 'U';
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  }

  function renderNavbar() {
    document.querySelectorAll('.nav-actions').forEach((block) => {
      const existingList = block.querySelector('a.btn-gold');
      const listBtn = existingList ? existingList.cloneNode(true) : null;

      block.innerHTML = '';

      if (currentUser) {
        const chip = document.createElement('a');
        chip.href = dashboardHref(currentUser.role);
        chip.className = 'auth-user btn btn-ghost';
        chip.setAttribute('aria-label', 'Open dashboard');
        chip.innerHTML = `
          <span class="auth-avatar" aria-hidden="true">◉</span>
          <span class="auth-name">${currentUser.name.split(' ')[0]}</span>
          <span class="auth-role">Dashboard</span>
        `;
        block.appendChild(chip);

        const logoutBtn = document.createElement('button');
        logoutBtn.type = 'button';
        logoutBtn.className = 'btn btn-ghost';
        logoutBtn.textContent = 'Logout';
        logoutBtn.addEventListener('click', async () => {
          logoutBtn.disabled = true;
          logoutBtn.textContent = 'Logging out…';
          await logout();
          window.location.reload();
        });
        block.appendChild(logoutBtn);
      } else {
        const login = document.createElement('a');
        login.href = 'login.html';
        login.className = 'btn btn-ghost';
        login.textContent = 'Login';
        block.appendChild(login);

        const register = document.createElement('a');
        register.href = 'register.html';
        register.className = 'btn btn-outline';
        register.textContent = 'Register';
        block.appendChild(register);
      }

      if (listBtn) block.appendChild(listBtn);
    });
  }

  async function init() {
    if (ready) return ready;
    ready = fetchMe().then((u) => { renderNavbar(); notify(); return u; });
    return ready;
  }

  function isAuthenticated() { return Boolean(currentUser); }
  function getUser() { return currentUser; }

  async function login(email, password) {
    const res = await global.Api.post('/auth/login', { email, password });
    currentUser = res.user;
    sessionStorage.setItem('auth_probe', '1');
    renderNavbar(); notify();
    return currentUser;
  }
  async function register(payload) {
    const res = await global.Api.post('/auth/register', payload);
    currentUser = res.user;
    sessionStorage.setItem('auth_probe', '1');
    renderNavbar(); notify();
    return currentUser;
  }
  async function logout() {
    try { await global.Api.post('/auth/logout'); }
    finally {
      currentUser = null;
      sessionStorage.removeItem('auth_probe');
      renderNavbar(); notify();
    }
  }

  function onChange(fn) { listeners.add(fn); if (ready) fn(currentUser); return () => listeners.delete(fn); }

  global.Auth = { init, isAuthenticated, getUser, login, register, logout, onChange, dashboardHref };
  document.addEventListener('DOMContentLoaded', () => { init(); });
})(window);

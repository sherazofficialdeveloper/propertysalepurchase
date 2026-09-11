/**
 * Login page controller.
 * - Clears any autofilled email/password aggressively
 * - On success → dashboard.html
 */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function wipeInputs() {
    const emailEl = $('loginEmail');
    const pwEl = $('loginPassword');
    if (emailEl && !emailEl.dataset.userTouched) emailEl.value = '';
    if (pwEl && !pwEl.dataset.userTouched) pwEl.value = '';
  }

  function scheduleWipes() {
    // Browser autofill can land at various moments — wipe on several ticks.
    [0, 50, 150, 300, 600, 1000].forEach((ms) => setTimeout(wipeInputs, ms));
  }

  function setFieldError(id, message) {
    const input = $(id);
    const err = document.querySelector(`[data-error-for="${id}"]`);
    if (input) {
      input.classList.toggle('is-invalid', Boolean(message));
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
    }
    if (err) { err.textContent = message || ''; err.hidden = !message; }
  }

  function validate() {
    let ok = true;
    const email = $('loginEmail').value.trim();
    const password = $('loginPassword').value;

    if (!email) { setFieldError('loginEmail', 'Email is required.'); ok = false; }
    else if (!EMAIL_RE.test(email)) { setFieldError('loginEmail', 'Please enter a valid email address.'); ok = false; }
    else setFieldError('loginEmail', '');

    if (!password) { setFieldError('loginPassword', 'Password is required.'); ok = false; }
    else setFieldError('loginPassword', '');

    return ok;
  }

  function setSubmitting(on) {
    const btn = $('loginSubmit');
    btn.disabled = on;
    btn.textContent = on ? 'Signing in…' : 'Sign In';
  }

  function showError(message) { const el = $('authError'); el.textContent = message; el.hidden = false; }
  function hideError() { $('authError').hidden = true; }

  function init() {
    scheduleWipes();

    // Mark fields as user-touched the moment they interact — prevents wipe after.
    ['loginEmail', 'loginPassword'].forEach((id) => {
      const el = $(id);
      if (!el) return;
      ['input', 'change', 'focus', 'keydown', 'paste'].forEach((ev) =>
        el.addEventListener(ev, () => { el.dataset.userTouched = '1'; }, { passive: true })
      );
    });

    // Password visibility toggle
    const pwToggle = $('pwToggle');
    if (pwToggle) {
      pwToggle.addEventListener('click', () => {
        const pw = $('loginPassword');
        const show = pw.type === 'password';
        pw.type = show ? 'text' : 'password';
        pwToggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      });
    }

    // Clear inline errors on type
    ['loginEmail', 'loginPassword'].forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('input', () => { if (el.classList.contains('is-invalid')) setFieldError(id, ''); });
    });

    // If already logged in, go straight to dashboard.
    window.Auth.init().then(() => {
      if (window.Auth.isAuthenticated()) {
        const params = new URLSearchParams(location.search);
        const next = params.get('next') || 'dashboard.html';
        location.replace(window.Auth.dashboardHref(window.Auth.getUser()?.role) || next);
      }
    });

    // Submit
    $('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();
      if (!validate()) return;

      setSubmitting(true);
      try {
        await window.Auth.login($('loginEmail').value.trim(), $('loginPassword').value);
        const params = new URLSearchParams(location.search);
        const next = params.get('next') || 'dashboard.html';
        location.replace(window.Auth.dashboardHref(window.Auth.getUser()?.role) || next);
      } catch (err) {
        showError((err && err.message) || 'Unable to sign in. Please try again.');
      } finally {
        setSubmitting(false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();

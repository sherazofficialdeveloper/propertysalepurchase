/**
 * Register page controller.
 * - Clears autofilled email/password on load
 * - On success → dashboard.html
 */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^[+()\-\s\d]{7,30}$/;

  function clearAutofill() {
    ['regEmail', 'regPassword', 'regConfirm'].forEach((id) => {
      const el = $(id);
      if (el && !el.dataset.userTouched) el.value = '';
    });
  }

  function setFieldError(id, message) {
    const input = $(id);
    const err = document.querySelector(`[data-error-for="${id}"]`);
    if (input) input.classList.toggle('is-invalid', Boolean(message));
    if (err) { err.textContent = message || ''; err.hidden = !message; }
  }

  function validate() {
    let ok = true;

    const name = $('regName').value.trim();
    if (!name) { setFieldError('regName', 'Full name is required.'); ok = false; }
    else if (name.length < 2) { setFieldError('regName', 'Name must be at least 2 characters.'); ok = false; }
    else setFieldError('regName', '');

    const email = $('regEmail').value.trim();
    if (!email) { setFieldError('regEmail', 'Email is required.'); ok = false; }
    else if (!EMAIL_RE.test(email)) { setFieldError('regEmail', 'Please enter a valid email address.'); ok = false; }
    else setFieldError('regEmail', '');

    const phone = $('regPhone').value.trim();
    if (phone && !PHONE_RE.test(phone)) { setFieldError('regPhone', 'Invalid phone number.'); ok = false; }
    else setFieldError('regPhone', '');

    const pw = $('regPassword').value;
    if (!pw) { setFieldError('regPassword', 'Password is required.'); ok = false; }
    else if (pw.length < 6) { setFieldError('regPassword', 'At least 6 characters.'); ok = false; }
    else setFieldError('regPassword', '');

    const confirm = $('regConfirm').value;
    if (!confirm) { setFieldError('regConfirm', 'Please confirm your password.'); ok = false; }
    else if (confirm !== pw) { setFieldError('regConfirm', 'Passwords do not match.'); ok = false; }
    else setFieldError('regConfirm', '');

    return ok;
  }

  function setSubmitting(on) {
    const btn = $('registerSubmit');
    btn.disabled = on;
    btn.textContent = on ? 'Creating account…' : 'Create Account';
  }

  function showError(m) { const el = $('authError'); el.textContent = m; el.hidden = false; }
  function hideError() { $('authError').hidden = true; }

  function clearServerFieldErrors(errors) {
    if (!errors) return;
    const map = { name: 'regName', email: 'regEmail', phone: 'regPhone', password: 'regPassword' };
    Object.entries(errors).forEach(([k, v]) => { const id = map[k]; if (id) setFieldError(id, v); });
  }

  function init() {
    clearAutofill();
    setTimeout(clearAutofill, 100);
    setTimeout(clearAutofill, 400);

    ['regEmail', 'regPassword', 'regConfirm'].forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('input', () => { el.dataset.userTouched = '1'; });
      el.addEventListener('focus', () => { el.dataset.userTouched = '1'; });
    });

    // Password visibility toggles
    document.querySelectorAll('.pw-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const t = document.getElementById(btn.dataset.pw);
        const show = t.type === 'password';
        t.type = show ? 'text' : 'password';
        btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      });
    });

    // Clear inline errors on input
    ['regName', 'regEmail', 'regPhone', 'regPassword', 'regConfirm'].forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('input', () => { if (el.classList.contains('is-invalid')) setFieldError(id, ''); });
    });

    // If already logged in, skip straight to dashboard.
    window.Auth.init().then(() => {
      if (window.Auth.isAuthenticated()) location.replace(window.Auth.dashboardHref(window.Auth.getUser()?.role) || 'dashboard.html');
    });

    // Submit
    $('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();
      if (!validate()) return;

      setSubmitting(true);
      try {
        const roleInput = document.querySelector('input[name="role"]:checked');
        await window.Auth.register({
          name: $('regName').value.trim(),
          email: $('regEmail').value.trim(),
          phone: $('regPhone').value.trim(),
          password: $('regPassword').value,
          role: roleInput ? roleInput.value : 'buyer',
        });

        // Always go to dashboard.html after successful registration.
        location.replace(window.Auth.dashboardHref(window.Auth.getUser()?.role) || 'dashboard.html');
      } catch (err) {
        const data = err && err.data;
        if (data && data.errors) clearServerFieldErrors(data.errors);
        showError((err && err.message) || 'Unable to create account. Please try again.');
      } finally {
        setSubmitting(false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();

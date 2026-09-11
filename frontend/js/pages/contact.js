/**
 * Contact / Inquiry page controller.
 * Phase 9: prefills user info for authenticated visitors.
 */
(function (global) {
  'use strict';

  const MAX_MESSAGE = 1000;
  const MIN_MESSAGE = 20;

  const state = { propertyId: null, property: null, submitting: false, user: null };
  const $ = (id) => document.getElementById(id);

  function getQueryPropertyId() { return new URLSearchParams(location.search).get('property') || ''; }

  async function loadProperty(id) {
    if (!id) return null;
    try {
      const res = await global.Api.properties.get(id);
      return res && res.property ? res.property : null;
    } catch (_) { return null; }
  }

  function populatePropertySelect(selectedId, properties) {
    const sel = $('cProperty');
    if (!sel) return;
    const all = properties || [];
    sel.innerHTML = '<option value="">— General Inquiry (No specific property) —</option>' +
      all.map((p) => `<option value="${p.id}"${p.id === selectedId ? ' selected' : ''}>${p.title} — ${p.city}</option>`).join('');
  }

  function renderPropertyContext(property) {
    const card = $('propertyContext');
    if (!card) return;
    if (!property) { card.hidden = true; return; }
    card.hidden = false;
    $('pcImage').src = (property.images && property.images[0]) || property.image || '';
    $('pcImage').alt = property.title;
    $('pcTitle').textContent = property.title;
    $('pcLocation').textContent = `${property.location}, ${property.city}`;
    $('pcPrice').textContent = (property.currency || 'PKR') + ' ' + Number(property.price).toLocaleString('en-PK');
    $('pcId').textContent = property.id.slice(-8).toUpperCase();
    $('pcView').href = 'property-details.html?id=' + encodeURIComponent(property.id);
  }

  function renderBreadcrumb(property) {
    const el = $('crumbs');
    if (!el) return;
    if (property) {
      el.innerHTML = `
        <a href="index.html">Home</a>
        <span aria-hidden="true">/</span>
        <a href="properties.html">Properties</a>
        <span aria-hidden="true">/</span>
        <a href="property-details.html?id=${encodeURIComponent(property.id)}">Property Details</a>
        <span aria-hidden="true">/</span>
        <span class="crumb-current">Inquiry</span>`;
    } else {
      el.innerHTML = `<a href="index.html">Home</a><span aria-hidden="true">/</span><span class="crumb-current">Contact</span>`;
    }
  }

  function bindCounter() {
    const msg = $('cMessage'); const counter = $('charCounter');
    if (!msg || !counter) return;
    const update = () => {
      const len = msg.value.length;
      counter.textContent = `${len} / ${MAX_MESSAGE}`;
      counter.classList.toggle('over', len > MAX_MESSAGE);
    };
    msg.addEventListener('input', update); update();
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^[+()\-\s\d]{7,30}$/;

  const FIELD_RULES = {
    cName: (v) => { v = v.trim(); if (!v) return 'Please enter your full name.'; if (v.length < 2) return 'Name must be at least 2 characters.'; return ''; },
    cEmail: (v) => { v = v.trim(); if (!v) return 'Please enter your email.'; if (!EMAIL_RE.test(v)) return 'Please enter a valid email address.'; return ''; },
    cPhone: (v) => { v = v.trim(); if (!v) return 'Please enter your phone number.'; if (!PHONE_RE.test(v)) return 'Please enter a valid phone number.'; return ''; },
    cInquiryType: (v) => (!v ? 'Please select an inquiry type.' : ''),
    cMessage: (v) => { v = v.trim(); if (!v) return 'Please enter your message.'; if (v.length < MIN_MESSAGE) return `Message must be at least ${MIN_MESSAGE} characters.`; if (v.length > MAX_MESSAGE) return `Message must be ${MAX_MESSAGE} characters or fewer.`; return ''; },
  };

  function setFieldError(id, message) {
    const input = $(id); const err = document.querySelector(`[data-error-for="${id}"]`);
    if (input) { input.classList.toggle('is-invalid', Boolean(message)); input.setAttribute('aria-invalid', message ? 'true' : 'false'); }
    if (err) { err.textContent = message || ''; err.hidden = !message; }
  }
  function validateField(id) {
    const input = $(id); if (!input || !FIELD_RULES[id]) return true;
    const msg = FIELD_RULES[id](input.value); setFieldError(id, msg); return !msg;
  }
  function validateAll() {
    let ok = true; Object.keys(FIELD_RULES).forEach((id) => { if (!validateField(id)) ok = false; });
    return ok;
  }
  function bindLiveValidation() {
    Object.keys(FIELD_RULES).forEach((id) => {
      const input = $(id); if (!input) return;
      input.addEventListener('blur', () => validateField(id));
      input.addEventListener('input', () => { if (input.classList.contains('is-invalid')) validateField(id); });
      input.addEventListener('change', () => validateField(id));
    });
  }

  function collectFormData() {
    const fd = new FormData($('inquiryForm'));
    const preferred = document.querySelector('input[name="preferredContact"]:checked');
    return {
      name: (fd.get('name') || '').toString().trim(),
      email: (fd.get('email') || '').toString().trim(),
      phone: (fd.get('phone') || '').toString().trim(),
      inquiryType: (fd.get('inquiryType') || '').toString(),
      propertyId: (fd.get('propertyId') || '').toString() || null,
      message: (fd.get('message') || '').toString().trim(),
      preferredContact: preferred ? preferred.value : 'Email',
    };
  }

  function setSubmitting(on) {
    state.submitting = on;
    const btn = $('submitBtn'); if (!btn) return;
    btn.disabled = on;
    btn.textContent = on ? 'Sending…' : 'Send Inquiry';
  }

  function showError(message) {
    const box = $('formError'); if (!box) return;
    $('formErrorMsg').textContent = message || "We couldn't submit your inquiry right now. Please try again.";
    box.hidden = false; box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function hideError() { const box = $('formError'); if (box) box.hidden = true; }

  function showSuccess(inquiryId) {
    const form = $('inquiryFormWrap'); const success = $('inquirySuccess');
    if (form) form.hidden = true;
    if (success) {
      success.hidden = false;
      const ref = $('successRef');
      if (ref) ref.textContent = inquiryId ? `Reference: ${String(inquiryId).slice(-8).toUpperCase()}` : '';
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (state.submitting) return;
    hideError();
    if (!validateAll()) { const firstInvalid = document.querySelector('.is-invalid'); if (firstInvalid) firstInvalid.focus(); return; }

    setSubmitting(true);
    try {
      const payload = collectFormData();
      const res = await global.Api.inquiries.create(payload);
      if (!res || !res.success) throw new Error('Unexpected response');
      showSuccess(res.inquiry && res.inquiry.id);
    } catch (err) {
      const friendly = err && err.status === 400
        ? 'Some information is missing or invalid. Please check the form and try again.'
        : "We couldn't submit your inquiry right now. Please try again.";
      showError(friendly);
      console.error('[contact] submission failed:', err);
    } finally { setSubmitting(false); }
  }

  function bindPropertySelect() {
    const sel = $('cProperty'); if (!sel) return;
    sel.addEventListener('change', async () => {
      const id = sel.value;
      state.propertyId = id || null;
      state.property = await loadProperty(id);
      renderPropertyContext(state.property);
    });
  }

  function prefillUser(user) {
    if (!user) return;
    const nameEl = $('cName'); const emailEl = $('cEmail'); const phoneEl = $('cPhone');
    if (nameEl && !nameEl.value) nameEl.value = user.name || '';
    if (emailEl && !emailEl.value) emailEl.value = user.email || '';
    if (phoneEl && !phoneEl.value) phoneEl.value = user.phone || '';
  }

  async function init() {
    global.AccordionUI && global.AccordionUI.init('#faq');

    // Resolve user (if logged in) and prefill.
    if (global.Session) {
      try { state.user = await global.Session.ensure(); } catch (_) { state.user = null; }
    }
    prefillUser(state.user);

    const idFromUrl = getQueryPropertyId();
    state.propertyId = idFromUrl || null;
    state.property = await loadProperty(idFromUrl);

    // Load list of properties for the dropdown (public API).
    let properties = [];
    try {
      const res = await global.PropertySource.list('limit=48');
      properties = (res && res.properties) || [];
    } catch (_) { properties = []; }
    populatePropertySelect(state.propertyId, properties);

    renderPropertyContext(state.property);
    renderBreadcrumb(state.property);

    bindCounter(); bindLiveValidation(); bindPropertySelect();

    $('inquiryForm')?.addEventListener('submit', onSubmit);
    $('errorRetry')?.addEventListener('click', () => { hideError(); $('inquiryForm')?.scrollIntoView({ behavior: 'smooth' }); });
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);

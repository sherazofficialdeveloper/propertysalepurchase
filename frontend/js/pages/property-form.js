/**
 * Property create/edit form controller.
 * One form, two modes — decided by ?id= presence.
 */
(function (global) {
  'use strict';

  let user = null;
  let editId = null;
  let editingProperty = null;

  const $ = (id) => document.getElementById(id);

  function getQueryId() {
    return new URLSearchParams(location.search).get('id') || '';
  }

  function toLocalFields(p) {
    return {
      title: p.title || '',
      description: p.description || '',
      propertyType: p.propertyType || 'house',
      purpose: p.purpose || 'sale',
      price: p.price ?? '',
      currency: p.currency || 'PKR',
      location: p.location || '',
      city: p.city || '',
      area: p.area ?? '',
      areaUnit: p.areaUnit || 'sqft',
      bedrooms: p.bedrooms ?? 0,
      bathrooms: p.bathrooms ?? 0,
      parking: p.parking ?? 0,
      yearBuilt: p.yearBuilt ?? '',
      furnished: p.furnished || 'unfurnished',
      constructionStatus: p.constructionStatus || '',
      features: (p.features || []).join(', '),
      amenities: (p.amenities || []).join(', '),
      images: (p.images || []).join('\n'),
      status: p.status || 'available',
      isPublished: Boolean(p.isPublished),
      featured: Boolean(p.featured),
    };
  }

  function fillForm(p) {
    const f = toLocalFields(p);
    Object.entries(f).forEach(([k, v]) => {
      const el = document.querySelector(`[name="${k}"]`);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = Boolean(v);
      else el.value = v;
    });
  }

  function collect() {
    const fd = new FormData($('propertyForm'));
    const out = {};
    fd.forEach((v, k) => { out[k] = typeof v === 'string' ? v.trim() : v; });

    // Convert booleans
    out.isPublished = $('isPublished') ? $('isPublished').checked : false;
    out.featured = $('featured') ? $('featured').checked : false;

    // Arrays from comma/newline-separated
    out.features = (out.features || '').split(',').map((s) => s.trim()).filter(Boolean);
    out.amenities = (out.amenities || '').split(',').map((s) => s.trim()).filter(Boolean);
    out.images = (out.images || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

    // Numeric
    ['price', 'area', 'bedrooms', 'bathrooms', 'parking', 'yearBuilt'].forEach((k) => {
      if (out[k] === '' || out[k] == null) { if (k === 'yearBuilt') delete out[k]; return; }
      const n = Number(out[k]);
      if (Number.isFinite(n)) out[k] = n;
    });

    return out;
  }

  function validate(payload) {
    const errors = {};
    if (!payload.title || payload.title.length < 4) errors.title = 'Title must be at least 4 characters.';
    if (!payload.description || payload.description.length < 20) errors.description = 'Description must be at least 20 characters.';
    if (!['house', 'apartment', 'commercial', 'plot', 'office', 'shop'].includes(payload.propertyType)) errors.propertyType = 'Invalid type.';
    if (!['sale', 'purchase'].includes(payload.purpose)) errors.purpose = 'Invalid purpose.';
    if (!Number.isFinite(payload.price) || payload.price < 0) errors.price = 'Price must be a positive number.';
    if (!payload.location) errors.location = 'Location is required.';
    if (!payload.city) errors.city = 'City is required.';
    if (!Number.isFinite(payload.area) || payload.area < 0) errors.area = 'Area must be a positive number.';
    return errors;
  }

  function showErrors(errors) {
    document.querySelectorAll('.field-error[data-error-for]').forEach((el) => { el.textContent = ''; el.hidden = true; });
    document.querySelectorAll('input, select, textarea').forEach((el) => el.classList.remove('is-invalid'));
    Object.entries(errors || {}).forEach(([field, msg]) => {
      const err = document.querySelector(`[data-error-for="${field}"]`);
      const input = document.querySelector(`[name="${field}"]`);
      if (err) { err.textContent = msg; err.hidden = false; }
      if (input) input.classList.add('is-invalid');
    });
  }

  function banner(message, kind) {
    const el = $('formBanner');
    if (!el) return;
    el.textContent = message;
    el.className = 'alert ' + (kind === 'success' ? 'alert-success' : 'alert-error');
    el.hidden = false;
  }
  function hideBanner() { $('formBanner') && ($('formBanner').hidden = true); }

  function setSubmitting(on) {
    const btn = $('pfSubmit');
    if (!btn) return;
    btn.disabled = on;
    btn.textContent = on ? 'Saving…' : (editId ? 'Save Changes' : 'Create Property');
  }

  async function init() {
    user = await global.Session.ensure();
    if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
      location.replace('login.html?next=' + encodeURIComponent(location.pathname + location.search));
      return;
    }

    // Admin-only fields
    if (user.role === 'admin') {
      ['statusField', 'featuredField'].forEach((id) => { const el = $(id); if (el) el.hidden = false; });
    }

    editId = getQueryId() || null;

    if (editId) {
      $('pfTitle').textContent = 'Edit Property';
      $('pfHeading').textContent = 'Edit Property';
      try {
        const res = await global.Api.properties.get(editId);
        editingProperty = res.property;
        fillForm(editingProperty);
      } catch (err) {
        banner(err.message || 'Unable to load property.', 'error');
      }
    } else {
      $('pfHeading').textContent = 'Add New Property';
    }

    $('propertyForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      hideBanner();
      const payload = collect();
      const errors = validate(payload);
      if (Object.keys(errors).length) { showErrors(errors); banner('Please correct the highlighted fields.', 'error'); return; }

      // Non-admins cannot set featured
      if (user.role !== 'admin') delete payload.featured;

      setSubmitting(true);
      try {
        if (editId) {
          const res = await global.Api.properties.update(editId, payload);
          banner('Property updated.', 'success');
          // eslint-disable-next-line no-unused-expressions
          res;
        } else {
          await global.Api.properties.create(payload);
          banner('Property created.', 'success');
          setTimeout(() => { location.href = 'manage-properties.html'; }, 700);
          return;
        }
      } catch (err) {
        const errs = err && err.data && err.data.errors;
        if (errs) showErrors(errs);
        banner(err.message || 'Unable to save property.', 'error');
      } finally {
        setSubmitting(false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);

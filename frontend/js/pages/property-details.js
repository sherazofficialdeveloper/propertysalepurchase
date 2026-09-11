/**
 * Property Details page controller.
 * Uses GET /api/properties/:id — API first, mock fallback.
 * Default agent + real map embed.
 */
(function (global) {
  'use strict';

  // ---- Your agent identity (used when API data has no owner) ----
  const DEFAULT_AGENT = {
    name: 'Sheraz Developer',
    role: 'Verified Property Agent',
    phone: '03486346858',
    email: 'sherazofficialdev@gmail.com',
    office: 'Blue Area, Islamabad',
    avatar: 'https://i.pravatar.cc/160?img=12',
  };

  function getQueryId() { return new URLSearchParams(location.search).get('id') || ''; }
  function formatPrice(n, c) { return (c || 'PKR') + ' ' + Number(n).toLocaleString('en-PK'); }
  const $ = (id) => document.getElementById(id);
  function toggle(id, v) { const el = $(id); if (!el) return; v ? el.removeAttribute('hidden') : el.setAttribute('hidden', ''); }
  function setText(id, v) { const el = $(id); if (el) el.textContent = v == null ? '' : String(v); }
  function setHtml(id, v) { const el = $(id); if (el) el.innerHTML = v == null ? '' : String(v); }
  function typeLabel(p) { return (p.propertyType || '').charAt(0).toUpperCase() + (p.propertyType || '').slice(1); }

  function renderLoading() { toggle('detailsRoot', false); toggle('detailsLoading', true); toggle('detailsError', false); toggle('detailsNotFound', false); }
  function renderError() { toggle('detailsRoot', false); toggle('detailsLoading', false); toggle('detailsError', true); toggle('detailsNotFound', false); }
  function renderNotFound() { toggle('detailsRoot', false); toggle('detailsLoading', false); toggle('detailsError', false); toggle('detailsNotFound', true); }

  function render(p, related, source) {
    toggle('detailsRoot', true); toggle('detailsLoading', false); toggle('detailsError', false); toggle('detailsNotFound', false);

    document.title = p.title + ' — EstateHub';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', p.title + ' in ' + p.location + ', ' + p.city + '. ' + typeLabel(p) + ' for ' + p.purpose + ' at ' + formatPrice(p.price, p.currency) + '.');

    setText('crumbTitle', p.title);
    setText('pdTitle', p.title);
    setText('pdLocation', p.location + ', ' + p.city + ', Pakistan');
    setText('pdType', typeLabel(p));
    setText('pdPurpose', 'For ' + (p.purpose === 'purchase' ? 'Purchase' : 'Sale'));
    setText('pdPrice', formatPrice(p.price, p.currency));
    setText('pdStatus', p.status);
    setText('pdPropertyId', (p.id || '').slice(-8).toUpperCase());

    const sb = $('pdStatusBadge');
    if (sb) {
      const cls = p.status === 'sold' ? 'badge-sold' : p.status === 'pending' ? 'badge-pending' : 'badge-sale';
      sb.className = 'badge ' + cls;
      sb.textContent = p.status;
    }

    const hint = $('fallbackHint');
    if (hint) {
      if (source === 'fallback') { hint.textContent = 'Showing a demo property. Live listings are unavailable right now.'; hint.hidden = false; }
      else { hint.hidden = true; }
    }

    if (global.GalleryUI) {
      global.GalleryUI.mount(p.images && p.images.length ? p.images : [], 0);
    }

    setText('statBeds', p.bedrooms || '—');
    setText('statBaths', p.bathrooms || '—');
    setText('statArea', Number(p.area).toLocaleString());
    setText('statParking', p.parking || '—');
    setText('statType', typeLabel(p));
    setText('statStatus', p.status);

    setText('infoPrice', formatPrice(p.price, p.currency));
    setText('infoPurpose', 'For ' + (p.purpose === 'purchase' ? 'Purchase' : 'Sale'));
    setText('infoType', typeLabel(p));
    setText('infoStatus', p.status);
    setText('infoArea', Number(p.area).toLocaleString() + ' ' + (p.areaUnit || 'sqft'));
    setText('infoBeds', p.bedrooms || '—');
    setText('infoBaths', p.bathrooms || '—');
    setText('infoParking', p.parking || '—');

    setText('pdDescription', p.description || 'No description available.');
    renderList('pdFeatures', p.features, 'No features listed.');
    renderList('pdAmenities', p.amenities, 'No amenities listed.');

    setText('specType', typeLabel(p));
    setText('specPurpose', 'For ' + (p.purpose === 'purchase' ? 'Purchase' : 'Sale'));
    setText('specStatus', p.status);
    setText('specConstruction', p.constructionStatus || '—');
    setText('specArea', Number(p.area).toLocaleString() + ' ' + (p.areaUnit || 'sqft'));
    setText('specBeds', p.bedrooms || '—');
    setText('specBaths', p.bathrooms || '—');
    setText('specParking', p.parking || '—');
    setText('specYear', p.yearBuilt || '—');
    setText('specFurnished', p.furnished ? p.furnished.charAt(0).toUpperCase() + p.furnished.slice(1) : '—');

    setText('locCity', p.city);
    setText('locArea', p.location);
    setText('locFull', p.location + ', ' + p.city + ', Pakistan');

    // -------- Map embed (Google Maps, no API key needed for basic embed) --------
    renderMap(p);

    renderNearby([]);
    renderSeller(p.owner || DEFAULT_AGENT);

    const inquiry = $('inquiryBtn');
    if (inquiry) inquiry.href = 'contact.html?property=' + encodeURIComponent(p.id);
    const callBtn = $('callAgentBtn');
    if (callBtn) callBtn.href = 'tel:' + ((p.owner && p.owner.phone) || DEFAULT_AGENT.phone);
    const emailBtn = $('emailAgentBtn');
    if (emailBtn) emailBtn.href = 'mailto:' + ((p.owner && p.owner.email) || DEFAULT_AGENT.email);

    renderRelated(related);

    const shareBtn = $('shareBtn');
    if (shareBtn) shareBtn.addEventListener('click', () => global.ShareUI && global.ShareUI.share(p));

    const favBtn = $('favDetailBtn');
    if (favBtn) {
      favBtn.dataset.fav = p.id;
      const setState = (saved) => {
        favBtn.classList.toggle('is-active', saved);
        favBtn.setAttribute('aria-pressed', String(saved));
        favBtn.textContent = saved ? '♥ Saved' : '♡ Save';
        favBtn.setAttribute('aria-label', saved ? 'Remove property from saved' : 'Save property');
      };
      setState(global.Favorites ? global.Favorites.has(p.id) : false);
      global.Favorites && global.Favorites.onChange(() => setState(global.Favorites.has(p.id)));
      favBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (favBtn.disabled) return;
        if (!global.Auth || !global.Auth.isAuthenticated()) {
          global.Favorites.toggle(p.id).catch(() => {});
          return;
        }
        favBtn.disabled = true;
        try {
          const cur = favBtn.classList.contains('is-active');
          if (cur) { await global.Favorites.remove(p.id); global.ShareUI && global.ShareUI.toast('Property removed from saved.'); }
          else { await global.Favorites.add(p.id); global.ShareUI && global.ShareUI.toast('Property saved.'); }
        } catch (err) {
          global.ShareUI && global.ShareUI.toast((err && err.message) || 'Unable to update favorites.');
        } finally { favBtn.disabled = false; }
      });
    }
  }

  // -------- Map --------
  function renderMap(p) {
    const host = document.querySelector('.map-placeholder');
    if (!host) return;
    const q = encodeURIComponent((p.location || '') + ', ' + (p.city || '') + ', Pakistan');
    // Google Maps embed — no API key needed for basic iframe embed.
    host.innerHTML =
      '<iframe ' +
        'title="Property location on map" ' +
        'width="100%" height="320" ' +
        'style="border:0;display:block;border-radius:12px;" ' +
        'loading="lazy" referrerpolicy="no-referrer-when-downgrade" ' +
        'src="https://www.google.com/maps?q=' + q + '&output=embed">' +
      '</iframe>' +
      '<div class="map-caption">' + escapeHtml((p.location || '') + ', ' + (p.city || '')) + '</div>';
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderList(containerId, items, emptyMsg) {
    const el = $(containerId);
    if (!el) return;
    if (!Array.isArray(items) || items.length === 0) { el.innerHTML = '<li class="muted">' + emptyMsg + '</li>'; return; }
    el.innerHTML = items.map((it) => '<li><span class="check" aria-hidden="true">✓</span><span>' + escapeHtml(it) + '</span></li>').join('');
  }

  function renderNearby() {
    const el = $('pdNearby');
    if (!el) return;
    el.innerHTML = '<li class="muted">Nearby information will be available in a future update.</li>';
  }

  // -------- Seller / Agent --------
  function renderSeller(seller) {
    const s = seller || DEFAULT_AGENT;
    const avatar = $('agentAvatar');
    if (avatar) {
      avatar.src = s.avatar || DEFAULT_AGENT.avatar;
      avatar.alt = s.name || DEFAULT_AGENT.name;
      avatar.hidden = false;
    }
    setText('agentName', s.name || DEFAULT_AGENT.name);
    setText('agentRole', s.role === 'admin' ? 'Platform Admin' : (s.role || DEFAULT_AGENT.role));
    setText('agentPhone', s.phone || DEFAULT_AGENT.phone);
    setText('agentEmail', s.email || DEFAULT_AGENT.email);
    setText('agentOffice', s.office || DEFAULT_AGENT.office);
  }

  function renderRelated(list) {
    const el = $('relatedGrid');
    if (!el) return;
    if (!list || !list.length) { el.innerHTML = '<p class="muted">No similar properties available.</p>'; return; }
    el.innerHTML = list.map(global.PropertyCard.render).join('');
    global.PropertyCard.bindFavorites(el);
  }

  function initReadMore() {
    const desc = $('pdDescription'); const btn = $('readMoreBtn');
    if (!desc || !btn) return;
    btn.addEventListener('click', () => {
      const expanded = desc.classList.toggle('is-expanded');
      btn.textContent = expanded ? 'Read Less' : 'Read More';
    });
  }

  async function init() {
    initReadMore();
    const id = getQueryId();
    if (!id) return renderNotFound();

    if (global.Favorites) { try { await global.Favorites.ensureLoaded(); } catch (_) {} }

    renderLoading();
    try {
      const src = global.PropertySource || global.Api.properties;
      const res = await (src.get ? src.get(id) : src.get(id));
      if (!res || !res.property) return renderNotFound();
      render(res.property, res.related || [], res.source);
    } catch (err) {
      if (err && (err.status === 404 || err.status === 400)) return renderNotFound();
      console.error('[details] load failed:', err);
      renderError();
    }
    $('retryBtn') && $('retryBtn').addEventListener('click', init);
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);

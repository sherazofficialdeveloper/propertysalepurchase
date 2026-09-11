/**
 * Dashboard shell controller.
 * Decides sidebar + main content based on authenticated role.
 * Phase 9: richer inquiry management with detail modal + filters.
 */
(function (global) {
  'use strict';

  let user = null;
  let activeTab = 'overview';
  const $ = (id) => document.getElementById(id);

  const SIDEBAR = {
    buyer: [
      { tab: 'overview',  label: 'Overview',          icon: '🏠' },
      { tab: 'favorites', label: 'Saved Properties',  icon: '♥', href: 'favorites.html' },
      { tab: 'inquiries', label: 'My Inquiries',      icon: '✉' },
      { tab: 'profile',   label: 'Profile',           icon: '👤' },
      { tab: 'browse',    label: 'Browse Properties', icon: '🔎', href: 'properties.html' },
      { tab: 'settings',  label: 'Account Settings',  icon: '⚙' },
    ],
    seller: [
      { tab: 'overview',   label: 'Overview',          icon: '📊' },
      { tab: 'properties', label: 'My Properties',     icon: '🏘', href: 'manage-properties.html' },
      { tab: 'add',        label: 'Add Property',      icon: '➕', href: 'property-form.html' },
      { tab: 'inquiries',  label: 'Inquiries',         icon: '✉' },
      { tab: 'profile',    label: 'Profile',           icon: '👤' },
      { tab: 'settings',   label: 'Account Settings',  icon: '⚙' },
    ],
    admin: [
      { tab: 'overview',   label: 'Overview',          icon: '📊' },
      { tab: 'properties', label: 'Properties',        icon: '🏘', href: 'manage-properties.html' },
      { tab: 'users',      label: 'Users',             icon: '👥' },
      { tab: 'inquiries',  label: 'Inquiries',         icon: '✉' },
      { tab: 'profile',    label: 'Profile',           icon: '👤' },
      { tab: 'settings',   label: 'Account Settings',  icon: '⚙' },
    ],
  };

  function renderSidebar() {
    const list = SIDEBAR[user.role] || [];
    $('dashRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1) + ' Dashboard';
    $('dashUserName').textContent = user.name;

    $('dashNav').innerHTML = list.map((item) => {
      const active = item.tab === activeTab ? ' is-active' : '';
      const href = item.href || '#';
      const dataTab = item.href ? '' : ` data-tab="${item.tab}"`;
      return `<a href="${href}"${dataTab} class="${active.trim()}"><span class="nav-icon" aria-hidden="true">${item.icon}</span>${item.label}</a>`;
    }).join('');

    $('dashNav').querySelectorAll('[data-tab]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault(); activeTab = a.dataset.tab;
        renderSidebar(); renderContent(); closeMobileSidebar();
      });
    });

    $('dashNav').insertAdjacentHTML('beforeend', `
      <div class="nav-section">Account</div>
      <a href="#" id="dashLogout"><span class="nav-icon" aria-hidden="true">⏻</span>Logout</a>
    `);
    $('dashLogout').addEventListener('click', async (e) => {
      e.preventDefault(); await global.Auth.logout(); location.replace('index.html');
    });
  }

  function closeMobileSidebar() { $('dashSide').classList.remove('is-open'); }

  async function renderContent() {
    const main = $('dashMain');
    main.innerHTML = `<div class="panel"><p class="muted">Loading…</p></div>`;
    try {
      if (activeTab === 'overview') return await renderOverview();
      if (activeTab === 'profile') return await renderProfile();
      if (activeTab === 'settings') return await renderSettings();
      if (activeTab === 'inquiries') return await renderInquiries();
      if (activeTab === 'users' && user.role === 'admin') return await renderUsers();
      main.innerHTML = `<div class="panel"><p class="muted">Select a section.</p></div>`;
    } catch (err) {
      console.error('[dashboard]', err);
      main.innerHTML = `
        <div class="panel"><h2>Unable to Load</h2>
        <p class="muted">Something went wrong. Please try again.</p>
        <button class="btn btn-primary mt-4" id="dashRetry">Try Again</button></div>`;
      $('dashRetry').addEventListener('click', renderContent);
    }
  }

  async function renderOverview() {
    const main = $('dashMain');
    let payload;
    if (user.role === 'buyer') payload = await global.Api.dashboard.buyer();
    else if (user.role === 'seller') payload = await global.Api.dashboard.seller();
    else payload = await global.Api.dashboard.admin();

    const title = user.role === 'buyer' ? 'Buyer Overview'
                : user.role === 'seller' ? 'Seller Overview' : 'Admin Overview';

    main.innerHTML = `
      <header class="dash-topbar">
        <div><h1>${title}</h1><p class="sub">Welcome back, ${user.name.split(' ')[0]}.</p></div>
      </header>
      <div id="statGridHost"></div>
      <div id="overviewExtra"></div>`;

    if (user.role === 'buyer') {
      const s = payload.stats || {};
      $('statGridHost').innerHTML = `
        <div class="stat-grid">
          ${statCard('Saved Properties', s.savedProperties)}
          ${statCard('Total Inquiries', s.totalInquiries)}
          ${statCard('Active', (s.newInquiries || 0) + (s.contactedInquiries || 0) + (s.inProgressInquiries || 0))}
          ${statCard('Resolved / Closed', (s.resolvedInquiries || 0) + (s.closedInquiries || 0))}
        </div>`;
      $('overviewExtra').innerHTML = `
        <div class="panel"><h2>Quick Actions</h2>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <a href="favorites.html" class="btn btn-primary">View Saved Properties</a>
            <a href="properties.html" class="btn btn-outline">Browse Properties</a>
            <button class="btn btn-ghost" data-goto="inquiries">View My Inquiries</button>
          </div>
        </div>`;
    } else if (user.role === 'seller') {
      const s = payload.stats || {};
      $('statGridHost').innerHTML = `
        <div class="stat-grid">
          ${statCard('Total Properties', s.totalProperties)}
          ${statCard('Published', s.publishedProperties)}
          ${statCard('Drafts', s.draftProperties)}
          ${statCard('Sold', s.soldProperties)}
        </div>
        <div class="stat-grid">
          ${statCard('Total Inquiries', s.totalInquiries)}
          ${statCard('New', s.newInquiries)}
          ${statCard('In Progress', s.inProgressInquiries)}
          ${statCard('Resolved', s.resolvedInquiries)}
        </div>`;
      $('overviewExtra').innerHTML = `
        <div class="panel"><h2>Quick Actions</h2>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <a href="manage-properties.html" class="btn btn-primary">Manage Properties</a>
            <a href="property-form.html" class="btn btn-outline">Add Property</a>
            <button class="btn btn-ghost" data-goto="inquiries">View Inquiries</button>
          </div>
        </div>`;
    } else {
      const u = payload.users, p = payload.properties, i = payload.inquiries;
      $('statGridHost').innerHTML = `
        <div class="stat-grid">
          ${statCard('Total Users', u.total)}
          ${statCard('Buyers', u.buyers)}
          ${statCard('Sellers', u.sellers)}
          ${statCard('Admins', u.admins)}
        </div>
        <div class="stat-grid">
          ${statCard('Total Properties', p.total)}
          ${statCard('Published', p.published)}
          ${statCard('Drafts', p.drafts)}
          ${statCard('Featured', p.featured)}
        </div>
        <div class="stat-grid">
          ${statCard('Total Inquiries', i.total)}
          ${statCard('New', i.byStatus.new)}
          ${statCard('In Progress', i.byStatus.inProgress)}
          ${statCard('Resolved', i.byStatus.resolved)}
        </div>`;
    }
    $('overviewExtra').querySelector('[data-goto]')?.addEventListener('click', (e) => {
      e.preventDefault(); activeTab = 'inquiries'; renderSidebar(); renderContent();
    });
  }

  function statCard(label, value) {
    return `<div class="stat-card"><span class="stat-label">${label}</span><span class="stat-value">${value == null ? '—' : value}</span></div>`;
  }
  function formatDate(d) {
    if (!d) return '—';
    const dt = new Date(d); if (isNaN(dt)) return '—';
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function formatDateTime(d) {
    if (!d) return '—';
    const dt = new Date(d); if (isNaN(dt)) return '—';
    return dt.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- Profile / Settings (unchanged from Phase 7) ----------
  async function renderProfile() {
    const main = $('dashMain');
    const res = await global.Api.users.me();
    const u = res.user;
    main.innerHTML = `
      <header class="dash-topbar"><div><h1>My Profile</h1><p class="sub">View and update your account information.</p></div></header>
      <div class="panel"><h2>Account Information</h2>
        <div class="profile-grid">
          <div class="field"><label>Full Name</label><input type="text" id="pName" value="${escapeHtml(u.name)}" /></div>
          <div class="field"><label>Phone</label><input type="tel" id="pPhone" value="${escapeHtml(u.phone || '')}" /></div>
          <div class="field"><label>Email</label><input type="email" value="${escapeHtml(u.email)}" disabled /></div>
          <div class="field"><label>Role</label><input type="text" value="${escapeHtml(u.role)}" disabled /></div>
        </div>
        <p class="muted mt-4" style="font-size:var(--fs-xs);">Email and role cannot be changed here.</p>
        <div class="form-actions-row"><button class="btn btn-primary" id="saveProfile">Save Changes</button></div>
        <div class="alert" id="profileBanner" hidden></div>
      </div>`;
    $('saveProfile').addEventListener('click', async () => {
      const banner = $('profileBanner'); banner.hidden = true;
      try {
        const r = await global.Api.users.updateMe({ name: $('pName').value.trim(), phone: $('pPhone').value.trim() });
        user = r.user; $('dashUserName').textContent = user.name;
        banner.textContent = 'Profile updated.'; banner.className = 'alert alert-success'; banner.hidden = false;
      } catch (err) {
        banner.textContent = (err && err.message) || 'Unable to update profile.';
        banner.className = 'alert alert-error'; banner.hidden = false;
      }
    });
  }

  async function renderSettings() {
    const main = $('dashMain');
    const res = await global.Api.users.me();
    const u = res.user;
    main.innerHTML = `
      <header class="dash-topbar"><div><h1>Account Settings</h1><p class="sub">Manage your account preferences.</p></div></header>
      <div class="panel"><h2>Account</h2>
        <div class="info-grid">
          <div class="info-row"><span class="info-label">Name</span><span class="info-value">${escapeHtml(u.name)}</span></div>
          <div class="info-row"><span class="info-label">Email</span><span class="info-value">${escapeHtml(u.email)}</span></div>
          <div class="info-row"><span class="info-label">Role</span><span class="info-value">${escapeHtml(u.role)}</span></div>
          <div class="info-row"><span class="info-label">Status</span><span class="info-value">${u.isActive ? 'Active' : 'Inactive'}</span></div>
          <div class="info-row"><span class="info-label">Member since</span><span class="info-value">${formatDate(u.createdAt)}</span></div>
        </div>
      </div>
      <div class="panel"><h2>Security</h2><p class="muted">Password change will be implemented in a future phase.</p></div>
      <div class="panel"><h2>Session</h2><button class="btn btn-outline mt-4" id="logoutBtn">Logout</button></div>`;
    $('logoutBtn').addEventListener('click', async () => { await global.Auth.logout(); location.replace('index.html'); });
  }

  // ---------- Inquiries ----------
  const STATUSES = ['New', 'Contacted', 'In Progress', 'Resolved', 'Closed'];

  function statusBadge(s) {
    const map = { New: 'badge-gold', Contacted: 'badge', 'In Progress': 'badge-pending', Resolved: 'badge-sale', Closed: '' };
    return `<span class="badge ${map[s] || ''}">${escapeHtml(s)}</span>`;
  }

  async function renderInquiries() {
    const main = $('dashMain');
    const canUpdate = user.role === 'admin' || user.role === 'seller';

    main.innerHTML = `
      <header class="dash-topbar">
        <div><h1>Inquiries</h1><p class="sub">Manage incoming inquiries.</p></div>
      </header>
      <div class="panel">
        <div class="inq-filters">
          <input type="search" id="inqSearch" placeholder="Search name, email or phone…" />
          <select id="inqStatusFilter">
            <option value="">All Statuses</option>
            ${STATUSES.map((s) => `<option value="${s}">${s}</option>`).join('')}
          </select>
          <select id="inqSortFilter">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="status">Status</option>
          </select>
          <button class="btn btn-primary" id="inqApply">Apply</button>
        </div>
      </div>
      <div id="inqHost"></div>`;

    const apply = () => loadInquiries({
      q: $('inqSearch').value.trim(),
      status: $('inqStatusFilter').value,
      sort: $('inqSortFilter').value,
    });
    $('inqApply').addEventListener('click', apply);
    $('inqSearch').addEventListener('keydown', (e) => { if (e.key === 'Enter') apply(); });
    $('inqStatusFilter').addEventListener('change', apply);
    $('inqSortFilter').addEventListener('change', apply);

    await loadInquiries({ sort: 'newest' });

    function loadInquiries(params) {
      $('inqHost').innerHTML = `<div class="panel"><p class="muted">Loading…</p></div>`;
      const qs = new URLSearchParams();
      if (params.q) qs.set('q', params.q);
      if (params.status) qs.set('status', params.status);
      if (params.sort) qs.set('sort', params.sort);
      qs.set('limit', '50');
      return global.Api.inquiries.list(qs.toString())
        .then((res) => renderInquiryTable(res, canUpdate))
        .catch((err) => {
          $('inqHost').innerHTML = `<div class="panel"><h2>Unable to Load</h2>
            <p class="muted">${escapeHtml((err && err.message) || 'Something went wrong.')}</p></div>`;
        });
    }
  }

  function renderInquiryTable(res, canUpdate) {
    const list = (res && res.inquiries) || [];
    if (!list.length) {
      $('inqHost').innerHTML = `
        <div class="panel"><h2>No inquiries yet</h2>
        <p class="muted">${user.role === 'buyer' ? "You haven't submitted any inquiries yet."
          : user.role === 'seller' ? "No inquiries for your properties yet."
          : "No inquiries found."}</p></div>`;
      return;
    }
    $('inqHost').innerHTML = `
      <div class="panel"><div class="dtable-wrap">
        <table class="dtable">
          <thead><tr>
            <th>Customer</th><th>Property</th><th>Type</th><th>Preferred</th>
            <th>Status</th><th>Date</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${list.map((i) => `
              <tr data-id="${i._id}">
                <td>
                  <div><strong>${escapeHtml(i.name)}</strong></div>
                  <div class="muted" style="font-size:var(--fs-xs);">${escapeHtml(i.email)}</div>
                </td>
                <td>${i.property ? escapeHtml(i.property.title) : '<span class="muted">General</span>'}</td>
                <td>${escapeHtml(i.inquiryType || '')}</td>
                <td>${escapeHtml(i.preferredContact || '')}</td>
                <td>${canUpdate
                  ? `<select class="inq-status" data-id="${i._id}" aria-label="Update status">
                       ${STATUSES.map((s) => `<option value="${s}"${s === i.status ? ' selected' : ''}>${s}</option>`).join('')}
                     </select>`
                  : statusBadge(i.status)}</td>
                <td>${formatDate(i.createdAt)}</td>
                <td><button class="btn btn-ghost btn-sm inq-view" data-id="${i._id}">View</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div></div>`;

    if (canUpdate) {
      document.querySelectorAll('.inq-status').forEach((sel) => {
        sel.addEventListener('change', async () => {
          const previous = sel.dataset.previous || sel.value;
          sel.disabled = true;
          try {
            await global.Api.inquiries.updateStatus(sel.dataset.id, sel.value);
            global.ShareUI && global.ShareUI.toast('Status updated.');
            sel.dataset.previous = sel.value;
          } catch (err) {
            sel.value = previous;
            global.ShareUI && global.ShareUI.toast((err && err.message) || 'Update failed.');
          } finally { sel.disabled = false; }
        });
        sel.dataset.previous = sel.value;
      });
    }

    document.querySelectorAll('.inq-view').forEach((btn) => {
      btn.addEventListener('click', () => openInquiryDetail(btn.dataset.id));
    });
  }

  async function openInquiryDetail(id) {
    // Modal
    let modal = document.getElementById('inqModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'inqModal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-backdrop" data-close></div>
        <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="inqModalTitle">
          <button class="modal-close" data-close aria-label="Close">×</button>
          <div id="inqModalBody"><p class="muted">Loading…</p></div>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', (e) => {
        if (e.target.matches('[data-close]')) modal.classList.remove('is-open');
      });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.classList.remove('is-open'); });
    }
    modal.classList.add('is-open');
    const body = document.getElementById('inqModalBody');
    body.innerHTML = '<p class="muted">Loading…</p>';

    try {
      const res = await global.Api.inquiries.get(id);
      const i = res.inquiry;
      const canUpdate = user.role === 'admin' || user.role === 'seller';
      body.innerHTML = `
        <h2 id="inqModalTitle">Inquiry Details</h2>
        <div class="modal-grid">
          <div>
            <h3>Customer</h3>
            <div class="info-grid">
              <div class="info-row"><span class="info-label">Name</span><span class="info-value">${escapeHtml(i.name)}</span></div>
              <div class="info-row"><span class="info-label">Email</span><span class="info-value"><a href="mailto:${escapeHtml(i.email)}">${escapeHtml(i.email)}</a></span></div>
              <div class="info-row"><span class="info-label">Phone</span><span class="info-value"><a href="tel:${escapeHtml(i.phone)}">${escapeHtml(i.phone)}</a></span></div>
              <div class="info-row"><span class="info-label">Preferred</span><span class="info-value">${escapeHtml(i.preferredContact || '')}</span></div>
            </div>
            <h3 class="mt-6">Message</h3>
            <p class="modal-message">${escapeHtml(i.message)}</p>
          </div>
          <div>
            ${i.property ? `
              <h3>Property</h3>
              <div class="modal-property">
                ${i.property.image ? `<img src="${escapeHtml(i.property.image)}" alt="${escapeHtml(i.property.title)}" />` : ''}
                <div class="modal-property-body">
                  <strong>${escapeHtml(i.property.title)}</strong>
                  <div class="muted">${escapeHtml(i.property.location)}, ${escapeHtml(i.property.city)}</div>
                  <div class="modal-property-price">${escapeHtml(i.property.currency || 'PKR')} ${Number(i.property.price).toLocaleString('en-PK')}</div>
                  <a class="btn btn-outline btn-sm mt-4" href="property-details.html?id=${encodeURIComponent(i.property.id)}" target="_blank" rel="noopener">View Property</a>
                </div>
              </div>
            ` : `<h3>Property</h3><p class="muted">General inquiry — no specific property.</p>`}

            <h3 class="mt-6">Status</h3>
            ${canUpdate
              ? `<select id="inqModalStatus" class="inq-status">${STATUSES.map((s) => `<option value="${s}"${s === i.status ? ' selected' : ''}>${s}</option>`).join('')}</select>`
              : statusBadge(i.status)}

            <h3 class="mt-6">Timeline</h3>
            <div class="info-grid">
              <div class="info-row"><span class="info-label">Submitted</span><span class="info-value">${formatDateTime(i.createdAt)}</span></div>
              <div class="info-row"><span class="info-label">Updated</span><span class="info-value">${formatDateTime(i.updatedAt)}</span></div>
            </div>
          </div>
        </div>`;

      const statusSel = document.getElementById('inqModalStatus');
      if (statusSel) {
        statusSel.addEventListener('change', async () => {
          statusSel.disabled = true;
          try {
            await global.Api.inquiries.updateStatus(i._id, statusSel.value);
            global.ShareUI && global.ShareUI.toast('Status updated.');
          } catch (err) {
            global.ShareUI && global.ShareUI.toast((err && err.message) || 'Update failed.');
          } finally { statusSel.disabled = false; }
        });
      }
    } catch (err) {
      body.innerHTML = `<h2>Unable to Load</h2><p class="muted">${escapeHtml((err && err.message) || 'Something went wrong.')}</p>`;
    }
  }

  // ---------- Users (admin) ----------
  async function renderUsers() {
    const main = $('dashMain');
    const res = await global.Api.admin.users('limit=50');
    const users = (res && res.users) || [];
    main.innerHTML = `
      <header class="dash-topbar"><div><h1>Users</h1><p class="sub">${users.length} record(s)</p></div></header>
      <div id="userHost"></div>`;
    if (!users.length) { $('userHost').innerHTML = `<div class="panel"><h2>No users found.</h2></div>`; return; }
    $('userHost').innerHTML = `
      <div class="panel"><div class="dtable-wrap"><table class="dtable">
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
        <tbody>
          ${users.map((u) => `
            <tr data-id="${u.id}">
              <td>${escapeHtml(u.name)}</td>
              <td>${escapeHtml(u.email)}</td>
              <td>${escapeHtml(u.phone || '—')}</td>
              <td><select class="user-role" data-id="${u.id}">${['buyer','seller','admin'].map((r) => `<option value="${r}"${r === u.role ? ' selected' : ''}>${r}</option>`).join('')}</select></td>
              <td>${u.isActive ? '<span class="badge badge-sale">Active</span>' : '<span class="badge badge-sold">Inactive</span>'}</td>
              <td>${formatDate(u.createdAt)}</td>
              <td><button class="btn btn-ghost btn-sm" data-toggle="${u.id}" data-active="${u.isActive}">${u.isActive ? 'Deactivate' : 'Activate'}</button></td>
            </tr>`).join('')}
        </tbody>
      </table></div></div>`;
    document.querySelectorAll('.user-role').forEach((sel) => {
      sel.addEventListener('change', async () => {
        try { await global.Api.admin.setUserRole(sel.dataset.id, sel.value); global.ShareUI && global.ShareUI.toast('Role updated'); }
        catch (err) { global.ShareUI && global.ShareUI.toast((err && err.message) || 'Update failed'); renderContent(); }
      });
    });
    document.querySelectorAll('[data-toggle]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const nextActive = btn.dataset.active !== 'true';
        try { await global.Api.admin.setUserStatus(btn.dataset.toggle, nextActive); global.ShareUI && global.ShareUI.toast('Status updated'); renderContent(); }
        catch (err) { global.ShareUI && global.ShareUI.toast((err && err.message) || 'Update failed'); }
      });
    });
  }

  async function init() {
    user = await global.Session.ensure();
    if (!user) { location.replace('login.html?next=' + encodeURIComponent('dashboard.html')); return; }
    if (global.Favorites) global.Favorites.ensureLoaded().catch(() => {});
    renderSidebar(); renderContent();
    $('dashMenuBtn')?.addEventListener('click', () => $('dashSide').classList.toggle('is-open'));
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);

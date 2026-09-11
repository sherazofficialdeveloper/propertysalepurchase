/**
 * Property data fallback module.
 *
 * Priority:
 *   1. API  — if reachable and returns >0 items
 *   2. MOCK — if API throws or returns 0 items (empty DB, backend down, demo mode)
 *
 * Shape returned matches the API response: { properties, pagination, source }.
 * The `source` field tells the UI whether the data came from Mongo or the demo set,
 * so we never pretend mock data is real database content.
 *
 * Mock data lives in `frontend/js/data/properties.data.js` (PropertyData.getAll()).
 * NO other module should read PropertyData directly anymore.
 */
(function (global) {
  'use strict';

  const PAGE_DEFAULT = 9;


  function normalizeProperty(p) {
    if (!p || typeof p !== 'object') return null;
    const images = Array.isArray(p.images) ? p.images.filter(Boolean)
      : (p.image ? [p.image] : []);
    return {
      ...p,
      id: p.id || p._id || '',
      propertyType: String(p.propertyType || p.type || '').toLowerCase(),
      purpose: String(p.purpose || 'sale').toLowerCase(),
      status: String(p.status || 'available').toLowerCase(),
      images,
      image: images[0] || '',
      features: Array.isArray(p.features) ? p.features : [],
      amenities: Array.isArray(p.amenities) ? p.amenities : [],
    };
  }
  function normalizeList(items) {
    return Array.isArray(items) ? items.map(normalizeProperty).filter(Boolean) : [];
  }

  // ---- Local filtering / sorting / pagination over the mock array ----
  function applyMockFilters(list, q) {
    let out = list.slice();

    if (q.location) {
      const needle = String(q.location).toLowerCase();
      out = out.filter((p) =>
        (p.city || '').toLowerCase().includes(needle) ||
        (p.location || '').toLowerCase().includes(needle)
      );
    }
    if (q.propertyType) out = out.filter((p) => (p.propertyType || '').toLowerCase() === String(q.propertyType).toLowerCase());
    if (q.purpose) out = out.filter((p) => (p.purpose || '').toLowerCase() === String(q.purpose).toLowerCase());
    if (q.minPrice) out = out.filter((p) => Number(p.price) >= Number(q.minPrice));
    if (q.maxPrice) out = out.filter((p) => Number(p.price) <= Number(q.maxPrice));
    if (q.minArea) out = out.filter((p) => Number(p.area) >= Number(q.minArea));
    if (q.maxArea) out = out.filter((p) => Number(p.area) <= Number(q.maxArea));
    if (q.bedrooms) out = out.filter((p) => Number(p.bedrooms) >= Number(q.bedrooms));
    if (q.bathrooms) out = out.filter((p) => Number(p.bathrooms) >= Number(q.bathrooms));
    if (q.status) out = out.filter((p) => (p.status || '').toLowerCase() === String(q.status).toLowerCase());
    if (q.featured === 'true') out = out.filter((p) => Boolean(p.featured));
    if (q.mine === 'true' || q.all === 'true') {
      // Mock data has no notion of "mine" — return empty so the fallback doesn't
      // leak demo data into a management view.
      return { properties: [], pagination: { page: 1, limit: PAGE_DEFAULT, total: 0, totalPages: 1 } };
    }

    return out;
  }

  function sortMock(list, key) {
    const arr = list.slice();
    switch (key) {
      case 'price_asc':  return arr.sort((a, b) => a.price - b.price);
      case 'price_desc': return arr.sort((a, b) => b.price - a.price);
      case 'area_asc':   return arr.sort((a, b) => a.area - b.area);
      case 'area_desc':  return arr.sort((a, b) => b.area - a.area);
      case 'newest':     return arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      case 'featured':
      default:
        return arr.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
  }

  function paginate(list, page, limit) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(48, Math.max(1, Number(limit) || PAGE_DEFAULT));
    const start = (p - 1) * l;
    return {
      items: list.slice(start, start + l),
      pagination: { page: p, limit: l, total: list.length, totalPages: Math.max(1, Math.ceil(list.length / l)) },
    };
  }

  function mockList(qs) {
    const q = Object.fromEntries(new URLSearchParams(qs || '').entries());
    const raw = normalizeList((global.PropertyData && global.PropertyData.getAll) ? global.PropertyData.getAll() : []);
    let filtered = applyMockFilters(raw, q);
    if (!Array.isArray(filtered)) {
      // "mine/all" short-circuit returned an object already
      return { properties: filtered.properties, pagination: filtered.pagination, source: 'fallback' };
    }
    filtered = sortMock(filtered, q.sort);
    const { items, pagination } = paginate(filtered, q.page, q.limit);
    return { properties: items, pagination, source: 'fallback' };
  }

  function mockGet(id) {
    if (!global.PropertyData || !global.PropertyData.getById) return null;
    const p = global.PropertyData.getById(id);
    if (!p) return null;
    // Shape like the API's related[] payload
    const related = (global.PropertyData.getRelated ? global.PropertyData.getRelated(p, 3) : []);
    return { property: normalizeProperty(p), related: normalizeList(related), source: 'fallback' };
  }

  // ---- Public API ----
  async function list(qs) {
    try {
      const res = await global.Api.properties.list(qs);
      if (res && Array.isArray(res.properties) && res.properties.length > 0) {
        return { properties: normalizeList(res.properties), pagination: res.pagination, source: 'api' };
      }
      // Empty API result → fallback (demo mode)
      const fallback = mockList(qs);
      // If the caller asked for "mine"/"all" (management), don't inject demo data.
      if (fallback.source === 'fallback' && fallback.properties.length === 0) return res || { properties: [], pagination: null, source: 'api' };
      return fallback;
    } catch (err) {
      const isManagement = qs && (qs.includes('mine=true') || qs.includes('all=true'));
      if (isManagement) {
        // Surface the error to management UIs so they show a proper error state.
        throw err;
      }
      return mockList(qs);
    }
  }

  async function get(id) {
    try {
      const res = await global.Api.properties.get(id);
      if (res && res.property) return { property: normalizeProperty(res.property), related: normalizeList(res.related || []), source: 'api' };
      return mockGet(id);
    } catch (err) {
      const m = mockGet(id);
      if (m) return m;
      throw err;
    }
  }

  global.PropertySource = { list, get };
})(window);

/**
 * Server-side validation for property payloads.
 * Rejects anything not in the controlled enums.
 */
const {
  PROPERTY_TYPES, PURPOSES, STATUSES, AREA_UNITS, CURRENCIES,
} = require('../models/Property');

function clean(v) { return typeof v === 'string' ? v.trim() : v; }
function num(v) {
  if (v === '' || v === null || v === undefined) return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}
function arr(v) {
  if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function validateProperty(body, { partial = false, isAdmin = false } = {}) {
  const errors = {};
  const value = {};

  const req = (field, val, msg) => {
    if (partial && (val === undefined)) return;
    if (val === '' || val === null || val === undefined) errors[field] = msg;
  };

  // title
  if (!(partial && body.title === undefined)) {
    value.title = clean(body.title) || '';
    req('title', value.title, 'Title is required.');
    if (value.title && (value.title.length < 4 || value.title.length > 160)) {
      errors.title = 'Title must be 4–160 characters.';
    }
  }

  // description
  if (!(partial && body.description === undefined)) {
    value.description = clean(body.description) || '';
    req('description', value.description, 'Description is required.');
    if (value.description && (value.description.length < 20 || value.description.length > 4000)) {
      errors.description = 'Description must be 20–4000 characters.';
    }
  }

  // propertyType
  if (!(partial && body.propertyType === undefined)) {
    value.propertyType = String(body.propertyType || '').toLowerCase();
    if (!PROPERTY_TYPES.includes(value.propertyType)) errors.propertyType = 'Invalid property type.';
  }

  // purpose
  if (!(partial && body.purpose === undefined)) {
    value.purpose = String(body.purpose || '').toLowerCase();
    if (!PURPOSES.includes(value.purpose)) errors.purpose = 'Purpose must be sale or purchase.';
  }

  // price
  if (!(partial && body.price === undefined)) {
    const n = num(body.price);
    if (!Number.isFinite(n) || n < 0) errors.price = 'Price must be a positive number.';
    else value.price = n;
  }

  // currency
  if (body.currency !== undefined) {
    value.currency = String(body.currency || 'PKR').toUpperCase();
    if (!CURRENCIES.includes(value.currency)) errors.currency = 'Invalid currency.';
  }

  // location
  if (!(partial && body.location === undefined)) {
    value.location = clean(body.location) || '';
    req('location', value.location, 'Location is required.');
  }

  // city
  if (!(partial && body.city === undefined)) {
    value.city = clean(body.city) || '';
    req('city', value.city, 'City is required.');
  }

  // area
  if (!(partial && body.area === undefined)) {
    const n = num(body.area);
    if (!Number.isFinite(n) || n < 0) errors.area = 'Area must be a positive number.';
    else value.area = n;
  }

  // areaUnit
  if (body.areaUnit !== undefined) {
    value.areaUnit = String(body.areaUnit || 'sqft').toLowerCase();
    if (!AREA_UNITS.includes(value.areaUnit)) errors.areaUnit = 'Invalid area unit.';
  }

  // Numeric optional fields
  ['bedrooms', 'bathrooms', 'parking'].forEach((f) => {
    if (body[f] === undefined) return;
    const n = num(body[f]);
    if (!Number.isFinite(n) || n < 0 || n > 50) errors[f] = `${f} must be between 0 and 50.`;
    else value[f] = n;
  });

  // yearBuilt
  if (body.yearBuilt !== undefined && body.yearBuilt !== '' && body.yearBuilt !== null) {
    const n = num(body.yearBuilt);
    if (!Number.isFinite(n) || n < 1800 || n > 2200) errors.yearBuilt = 'Invalid year built.';
    else value.yearBuilt = n;
  }

  // furnished
  if (body.furnished !== undefined) {
    const f = String(body.furnished).toLowerCase();
    if (!['unfurnished', 'semi', 'furnished'].includes(f)) errors.furnished = 'Invalid furnished value.';
    else value.furnished = f;
  }

  // constructionStatus
  if (body.constructionStatus !== undefined) {
    value.constructionStatus = clean(body.constructionStatus) || '';
  }

  // Arrays
  if (body.features !== undefined) value.features = arr(body.features);
  if (body.amenities !== undefined) value.amenities = arr(body.amenities);
  if (body.images !== undefined) {
    value.images = arr(body.images).filter((u) => /^https?:\/\//i.test(u));
  }

  // Status (only admin or seller on own prop, handled in controller)
  if (body.status !== undefined) {
    const s = String(body.status).toLowerCase();
    if (!STATUSES.includes(s)) errors.status = 'Invalid status.';
    else value.status = s;
  }

  // featured — admin only, controller enforces
  if (body.featured !== undefined) {
    if (typeof body.featured !== 'boolean') errors.featured = 'Featured must be boolean.';
    else value.featured = body.featured;
  }

  // isPublished — owner or admin
  if (body.isPublished !== undefined) {
    if (typeof body.isPublished !== 'boolean') errors.isPublished = 'isPublished must be boolean.';
    else value.isPublished = body.isPublished;
  }

  return { valid: Object.keys(errors).length === 0, errors, value };
}

module.exports = { validateProperty };

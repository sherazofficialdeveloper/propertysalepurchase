/**
 * Shared validation helpers.
 * Kept centralized so auth + future modules can reuse.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\-\s\d]{7,30}$/;

function clean(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function isNonEmpty(v, min = 1) {
  return typeof v === 'string' && v.trim().length >= min;
}

function isValidEmail(v) {
  return EMAIL_RE.test(clean(v).toLowerCase());
}

function isValidPhone(v) {
  // Optional: empty is allowed. Non-empty must match pattern.
  const s = clean(v);
  if (!s) return true;
  return PHONE_RE.test(s);
}

module.exports = { clean, isNonEmpty, isValidEmail, isValidPhone };

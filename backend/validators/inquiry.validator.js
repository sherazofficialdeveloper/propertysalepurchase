/**
 * Server-side validation for inquiry payloads.
 * Never trust the client. Returns { valid, errors, value }.
 */
const { INQUIRY_TYPES, PREFERRED_CONTACTS } = require('../models/Inquiry');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\-\s\d]{7,30}$/;

function clean(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function validateInquiry(body) {
  const errors = {};
  const value = {};

  value.name = clean(body.name);
  if (!value.name) errors.name = 'Full name is required.';
  else if (value.name.length < 2) errors.name = 'Full name must be at least 2 characters.';
  else if (value.name.length > 100) errors.name = 'Full name is too long.';

  value.email = clean(body.email).toLowerCase();
  if (!value.email) errors.email = 'Email address is required.';
  else if (!EMAIL_RE.test(value.email)) errors.email = 'Please enter a valid email address.';

  value.phone = clean(body.phone);
  if (!value.phone) errors.phone = 'Phone number is required.';
  else if (!PHONE_RE.test(value.phone)) errors.phone = 'Please enter a valid phone number.';

  value.inquiryType = clean(body.inquiryType);
  if (!value.inquiryType) errors.inquiryType = 'Inquiry type is required.';
  else if (!INQUIRY_TYPES.includes(value.inquiryType)) errors.inquiryType = 'Invalid inquiry type.';

  value.propertyId = clean(body.propertyId) || null;

  value.message = clean(body.message);
  if (!value.message) errors.message = 'Message is required.';
  else if (value.message.length < 20) errors.message = 'Message must be at least 20 characters.';
  else if (value.message.length > 1000) errors.message = 'Message must be 1000 characters or fewer.';

  value.preferredContact = clean(body.preferredContact) || 'Email';
  if (!PREFERRED_CONTACTS.includes(value.preferredContact)) {
    errors.preferredContact = 'Invalid preferred contact method.';
  }

  return { valid: Object.keys(errors).length === 0, errors, value };
}

module.exports = { validateInquiry };

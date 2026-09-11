/**
 * Deprecated shim — kept so any lingering import doesn't break.
 * Real implementations now live in controllers/inquiry.controller.js
 */
const base = require('./inquiry.controller');
module.exports = {
  listInquiries: base.listInquiries,
  updateInquiryStatus: base.updateInquiryStatus,
};

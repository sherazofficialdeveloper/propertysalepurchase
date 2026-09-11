/**
 * Inquiry model — persisted contact/inquiry submissions.
 * Phase 9: added optional `user` reference for authenticated buyers.
 * `propertyId` kept as String for backward-compat (may be a legacy ObjectId string).
 */
const mongoose = require('mongoose');

const INQUIRY_TYPES = ['Buying a Property', 'Selling a Property', 'Property Information', 'General Inquiry'];
const PREFERRED_CONTACTS = ['Phone', 'Email', 'WhatsApp'];
const STATUSES = ['New', 'Contacted', 'In Progress', 'Resolved', 'Closed'];

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    inquiryType: { type: String, required: true, enum: INQUIRY_TYPES },
    propertyId: { type: String, trim: true, default: null, index: true },
    message: { type: String, required: true, trim: true, minlength: 20, maxlength: 1000 },
    preferredContact: { type: String, enum: PREFERRED_CONTACTS, default: 'Email' },
    status: { type: String, enum: STATUSES, default: 'New', index: true },
    // Phase 9: optional association with an authenticated user.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  },
  { timestamps: true }
);

inquirySchema.index({ createdAt: -1 });
inquirySchema.index({ user: 1, createdAt: -1 });
inquirySchema.index({ propertyId: 1, createdAt: -1 });
inquirySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
module.exports.INQUIRY_TYPES = INQUIRY_TYPES;
module.exports.PREFERRED_CONTACTS = PREFERRED_CONTACTS;
module.exports.STATUSES = STATUSES;

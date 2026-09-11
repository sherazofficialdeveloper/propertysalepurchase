/**
 * Notification model — in-app notifications only (no email/SMS/push).
 * Recipient is set by the backend from a real business event; never from the frontend.
 */
const mongoose = require('mongoose');

const TYPES = [
  'new_inquiry',
  'inquiry_status_changed',
  'property_published',
  'property_unpublished',
  'property_status_changed',
  'property_featured',
];

const ENTITY_TYPES = ['inquiry', 'property', 'none'];

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    type: { type: String, enum: TYPES, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    relatedEntityType: { type: String, enum: ENTITY_TYPES, default: 'none' },
    relatedEntityId: { type: String, default: null },
    isRead: { type: Boolean, default: false, index: true },
    // Dedup hash for accidental double-triggers (created within a short window).
    dedupeKey: { type: String, default: null },
  },
  { timestamps: true }
);

// Listing queries: recipient's recent, unread-first.
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
// Dedup lookup
notificationSchema.index({ recipient: 1, dedupeKey: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.TYPES = TYPES;
module.exports.ENTITY_TYPES = ENTITY_TYPES;

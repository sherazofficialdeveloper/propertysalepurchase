/**
 * Notification service — centralized creation logic.
 * Never trust recipient IDs from frontend; caller passes a real user.
 */
const Notification = require('../models/Notification');
const { TYPES, ENTITY_TYPES } = require('../models/Notification');

const DEDUPE_WINDOW_MS = 10 * 1000; // 10s — absorbs accidental double-fire

/**
 * Create a notification.
 * @param {Object} opts
 * @param {ObjectId|string} opts.recipient     - required; resolved server-side
 * @param {string}          opts.type          - must be in TYPES
 * @param {string}          opts.title
 * @param {string}          opts.message
 * @param {string}          [opts.relatedEntityType='none']
 * @param {string|null}     [opts.relatedEntityId]
 * @param {ObjectId|string} [opts.sender]
 * @param {string|null}     [opts.dedupeKey]   - optional; suppresses repeats within window
 * @returns {Promise<Object|null>}             - created doc, or null if deduped
 */
async function createNotification(opts) {
  try {
    if (!opts || !opts.recipient) return null;
    if (!TYPES.includes(opts.type)) {
      console.warn('[notification] invalid type:', opts.type);
      return null;
    }

    // Dedupe: same recipient + key created within window → skip.
    if (opts.dedupeKey) {
      const since = new Date(Date.now() - DEDUPE_WINDOW_MS);
      const existing = await Notification.findOne({
        recipient: opts.recipient,
        dedupeKey: opts.dedupeKey,
        createdAt: { $gte: since },
      }).select('_id');
      if (existing) return null;
    }

    const doc = await Notification.create({
      recipient: opts.recipient,
      sender: opts.sender || null,
      type: opts.type,
      title: String(opts.title || '').slice(0, 160),
      message: String(opts.message || '').slice(0, 500),
      relatedEntityType: ENTITY_TYPES.includes(opts.relatedEntityType) ? opts.relatedEntityType : 'none',
      relatedEntityId: opts.relatedEntityId ? String(opts.relatedEntityId) : null,
      dedupeKey: opts.dedupeKey || null,
    });
    return doc.toObject();
  } catch (err) {
    // Never let a notification failure break a business operation.
    console.error('[notification] create failed:', err.message);
    return null;
  }
}

module.exports = { createNotification };

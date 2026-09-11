/**
 * Inquiry controller — create + role-scoped list/detail/status.
 * Phase 10: emits notifications via centralized service.
 */
const mongoose = require('mongoose');
const Inquiry = require('../models/Inquiry');
const Property = require('../models/Property');
const { validateInquiry } = require('../validators/inquiry.validator');
const { STATUSES } = require('../models/Inquiry');
const { createNotification } = require('../services/notification.service');

function isAdmin(u) { return u && u.role === 'admin'; }
function isSeller(u) { return u && u.role === 'seller'; }
function isBuyer(u) { return u && u.role === 'buyer'; }
function validObjectId(id) { return mongoose.Types.ObjectId.isValid(id); }

async function enrichWithProperties(items) {
  const propIds = Array.from(new Set(items.map((i) => i.propertyId).filter(Boolean)));
  const validIds = propIds.filter((id) => validObjectId(id));
  const props = validIds.length
    ? await Property.find({ _id: { $in: validIds } })
        .select('title city location price currency images propertyType status isPublished owner')
    : [];
  const map = new Map(props.map((p) => [p._id.toString(), p]));

  return items.map((i) => {
    const base = typeof i.toObject === 'function' ? i.toObject() : i;
    const p = i.propertyId ? map.get(String(i.propertyId)) : null;
    return {
      ...base,
      property: p ? {
        id: p._id.toString(),
        title: p.title, city: p.city, location: p.location,
        price: p.price, currency: p.currency,
        image: (p.images && p.images[0]) || '',
        propertyType: p.propertyType, status: p.status,
        isPublished: p.isPublished,
        ownerId: p.owner ? p.owner.toString() : null,
      } : null,
    };
  });
}

/**
 * POST /api/inquiries — public. Notifies property owner when applicable.
 */
async function createInquiry(req, res, next) {
  try {
    const { valid, errors, value } = validateInquiry(req.body || {});
    if (!valid) {
      return res.status(400).json({
        success: false,
        message: 'Please correct the highlighted fields and try again.',
        errors,
      });
    }

    if (req.user) value.user = req.user._id;

    const inquiry = await Inquiry.create(value);

    // ---- Notification: notify property owner (if property-linked) ----
    if (inquiry.propertyId && validObjectId(inquiry.propertyId)) {
      try {
        const property = await Property.findById(inquiry.propertyId).select('title owner');
        if (property && property.owner) {
          await createNotification({
            recipient: property.owner,
            sender: req.user ? req.user._id : null,
            type: 'new_inquiry',
            title: 'New Property Inquiry',
            message: `You received a new inquiry about "${property.title}".`,
            relatedEntityType: 'inquiry',
            relatedEntityId: inquiry._id.toString(),
            dedupeKey: `new_inquiry:${inquiry._id.toString()}`,
          });
        }
      } catch (nErr) {
        console.error('[inquiry] notification hook failed:', nErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully',
      inquiry: {
        id: inquiry._id.toString(),
        status: inquiry.status,
        createdAt: inquiry.createdAt,
      },
    });
  } catch (err) { return next(err); }
}

async function listInquiries(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
    const q = req.query || {};
    const filter = {};
    let sellerPropertyIds = null;

    if (isAdmin(req.user)) {
      // no scope
    } else if (isSeller(req.user)) {
      const props = await Property.find({ owner: req.user._id }).select('_id');
      const ids = props.map((p) => p._id.toString());
      sellerPropertyIds = ids;
      if (ids.length === 0) {
        return res.status(200).json({ success: true, inquiries: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } });
      }
      filter.propertyId = { $in: ids };
    } else if (isBuyer(req.user)) {
      filter.$or = [{ user: req.user._id }, { user: null, email: req.user.email }];
    } else {
      return res.status(403).json({ success: false, message: 'Not allowed.' });
    }

    if (q.status && STATUSES.includes(q.status)) filter.status = q.status;
    if (q.inquiryType) filter.inquiryType = q.inquiryType;
    if (q.propertyId) {
      if (isSeller(req.user)) {
        if (!sellerPropertyIds.includes(String(q.propertyId))) {
          return res.status(403).json({ success: false, message: 'Not allowed.' });
        }
      }
      filter.propertyId = q.propertyId;
    }
    if (q.from || q.to) {
      filter.createdAt = {};
      if (q.from) filter.createdAt.$gte = new Date(q.from);
      if (q.to) filter.createdAt.$lte = new Date(q.to);
    }
    if (q.q) {
      const re = new RegExp(String(q.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const searchOr = [{ name: re }, { email: re }, { phone: re }];
      if (filter.$or) filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
      else filter.$or = searchOr;
    }

    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const skip = (page - 1) * limit;
    const sort = resolveSort(q.sort);

    const [items, total] = await Promise.all([
      Inquiry.find(filter).sort(sort).skip(skip).limit(limit),
      Inquiry.countDocuments(filter),
    ]);

    const enriched = await enrichWithProperties(items);
    return res.status(200).json({
      success: true,
      inquiries: enriched,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) { return next(err); }
}

function resolveSort(key) {
  switch (key) {
    case 'oldest': return { createdAt: 1 };
    case 'status': return { status: 1, createdAt: -1 };
    case 'property': return { propertyId: 1, createdAt: -1 };
    default: return { createdAt: -1 };
  }
}

async function getInquiry(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
    const { id } = req.params;
    if (!validObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid inquiry id.' });

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found.' });

    let allowed = false;
    if (isAdmin(req.user)) allowed = true;
    else if (isSeller(req.user)) {
      if (inquiry.propertyId && validObjectId(inquiry.propertyId)) {
        allowed = Boolean(await Property.exists({ _id: inquiry.propertyId, owner: req.user._id }));
      }
    } else if (isBuyer(req.user)) {
      if (inquiry.user && inquiry.user.toString() === req.user._id.toString()) allowed = true;
      else if (!inquiry.user && inquiry.email === req.user.email) allowed = true;
    }
    if (!allowed) return res.status(403).json({ success: false, message: 'Not allowed.' });

    const [enriched] = await enrichWithProperties([inquiry]);
    return res.status(200).json({ success: true, inquiry: enriched });
  } catch (err) { return next(err); }
}

/**
 * PUT /api/inquiries/:id/status — admin or owning seller.
 * Phase 10: notifies buyer (if authenticated) of status change.
 */
async function updateInquiryStatus(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
    const { id } = req.params;
    if (!validObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid inquiry id.' });

    const next_status = String((req.body || {}).status || '');
    if (!STATUSES.includes(next_status)) return res.status(400).json({ success: false, message: 'Invalid status.' });

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found.' });

    if (!isAdmin(req.user)) {
      if (!isSeller(req.user)) return res.status(403).json({ success: false, message: 'Not allowed.' });
      if (!inquiry.propertyId || !validObjectId(inquiry.propertyId)) {
        return res.status(403).json({ success: false, message: 'Not allowed.' });
      }
      const owns = await Property.exists({ _id: inquiry.propertyId, owner: req.user._id });
      if (!owns) return res.status(403).json({ success: false, message: 'Not allowed.' });
    }

    const previousStatus = inquiry.status;
    inquiry.status = next_status;
    await inquiry.save();

    // ---- Notification: notify buyer only if they have an authenticated account ----
    if (previousStatus !== next_status && inquiry.user) {
      try {
        let propTitle = 'your property';
        if (inquiry.propertyId && validObjectId(inquiry.propertyId)) {
          const prop = await Property.findById(inquiry.propertyId).select('title');
          if (prop && prop.title) propTitle = `"${prop.title}"`;
        }
        await createNotification({
          recipient: inquiry.user,
          sender: req.user._id,
          type: 'inquiry_status_changed',
          title: 'Inquiry Status Updated',
          message: `Your inquiry for ${propTitle} is now marked as "${next_status}".`,
          relatedEntityType: 'inquiry',
          relatedEntityId: inquiry._id.toString(),
          dedupeKey: `status:${inquiry._id.toString()}:${next_status}`,
        });
      } catch (nErr) {
        console.error('[inquiry] status notify hook failed:', nErr.message);
      }
    }

    const [enriched] = await enrichWithProperties([inquiry]);
    return res.status(200).json({ success: true, message: 'Status updated.', inquiry: enriched });
  } catch (err) { return next(err); }
}

module.exports = { createInquiry, listInquiries, getInquiry, updateInquiryStatus };

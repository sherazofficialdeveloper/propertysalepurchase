/**
 * Property controller — CRUD with ownership + role enforcement.
 * Phase 10: emits notifications on publish/status/feature events.
 */
const mongoose = require('mongoose');
const Property = require('../models/Property');
const { validateProperty } = require('../validators/property.validator');
const { createNotification } = require('../services/notification.service');

function isValidObjectId(id) { return mongoose.Types.ObjectId.isValid(id); }
function isOwner(property, userId) { return property.owner && property.owner.toString() === userId.toString(); }
function canManage(property, user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'seller' && isOwner(property, user._id)) return true;
  return false;
}

async function createProperty(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
    if (!['seller', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only sellers and admins can create properties.' });
    }

    const { valid, errors, value } = validateProperty(req.body || {}, { isAdmin: req.user.role === 'admin' });
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Please correct the highlighted fields.', errors });
    }

    const payload = {
      ...value,
      owner: req.user._id,
      featured: req.user.role === 'admin' ? Boolean(value.featured) : false,
      status: value.status || 'available',
      isPublished: typeof value.isPublished === 'boolean' ? value.isPublished : false,
    };

    const property = await Property.create(payload);
    const populated = await property.populate('owner');

    return res.status(201).json({
      success: true,
      message: 'Property created.',
      property: populated.toPublicJSON(),
    });
  } catch (err) { return next(err); }
}

async function listProperties(req, res, next) {
  try {
    const q = req.query || {};
    const filter = {};
    const wantsMine = q.mine === 'true';
    const wantsAll = q.all === 'true';

    if (wantsMine) {
      if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
      filter.owner = req.user._id;
    } else if (wantsAll) {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required.' });
      }
    } else {
      filter.isPublished = true;
    }

    if (q.city) filter.city = new RegExp('^' + escapeRegex(String(q.city).trim()) + '$', 'i');
    if (q.location) filter.location = new RegExp(escapeRegex(String(q.location).trim()), 'i');
    if (q.propertyType) filter.propertyType = String(q.propertyType).toLowerCase();
    if (q.purpose) filter.purpose = String(q.purpose).toLowerCase();
    if (q.status) filter.status = String(q.status).toLowerCase();
    if (q.featured === 'true') filter.featured = true;

    if (q.minPrice || q.maxPrice) {
      filter.price = {};
      if (q.minPrice) filter.price.$gte = Number(q.minPrice);
      if (q.maxPrice) filter.price.$lte = Number(q.maxPrice);
    }
    if (q.minArea || q.maxArea) {
      filter.area = {};
      if (q.minArea) filter.area.$gte = Number(q.minArea);
      if (q.maxArea) filter.area.$lte = Number(q.maxArea);
    }
    if (q.bedrooms) filter.bedrooms = { $gte: Number(q.bedrooms) };
    if (q.bathrooms) filter.bathrooms = { $gte: Number(q.bathrooms) };

    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(48, Math.max(1, Number(q.limit) || 9));
    const skip = (page - 1) * limit;
    const sort = resolveSort(q.sort);

    const [items, total] = await Promise.all([
      Property.find(filter).sort(sort).skip(skip).limit(limit).populate('owner'),
      Property.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      properties: items.map((p) => p.toPublicJSON()),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) { return next(err); }
}

function resolveSort(sortKey) {
  switch (sortKey) {
    case 'price_asc': return { price: 1, _id: 1 };
    case 'price_desc': return { price: -1, _id: 1 };
    case 'area_asc': return { area: 1, _id: 1 };
    case 'area_desc': return { area: -1, _id: 1 };
    case 'newest': return { createdAt: -1, _id: -1 };
    default: return { featured: -1, createdAt: -1, _id: -1 };
  }
}
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

async function getProperty(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid property id.' });

    const property = await Property.findById(id).populate('owner');
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });

    if (!property.isPublished) {
      const isAdmin = req.user && req.user.role === 'admin';
      const isOwnSeller = req.user && req.user.role === 'seller' && isOwner(property, req.user._id);
      if (!isAdmin && !isOwnSeller) return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    const related = await Property.find({
      _id: { $ne: property._id },
      isPublished: true,
      $or: [{ propertyType: property.propertyType }, { city: property.city }],
    }).sort({ featured: -1, createdAt: -1 }).limit(3).populate('owner');

    return res.status(200).json({
      success: true,
      property: property.toPublicJSON(),
      related: related.map((p) => p.toPublicJSON()),
    });
  } catch (err) { return next(err); }
}

/**
 * UPDATE — detects publish / status / feature transitions and emits notifications.
 */
async function updateProperty(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid property id.' });

    const property = await Property.findById(id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
    if (!canManage(property, req.user)) return res.status(403).json({ success: false, message: 'You cannot modify this property.' });

    // Snapshot for change detection
    const before = {
      isPublished: property.isPublished,
      status: property.status,
      featured: property.featured,
    };

    const body = { ...req.body };
    delete body.owner; delete body._id; delete body.createdAt; delete body.updatedAt;
    if (body.featured !== undefined && req.user.role !== 'admin') delete body.featured;

    const { valid, errors, value } = validateProperty(body, { partial: true, isAdmin: req.user.role === 'admin' });
    if (!valid) return res.status(400).json({ success: false, message: 'Please correct the highlighted fields.', errors });

    Object.assign(property, value);
    await property.save();
    await property.populate('owner');

    // ---- Notifications (to the owner; seller self-actions still notify for reference) ----
    const ownerId = property.owner && property.owner._id ? property.owner._id : property.owner;
    const dedupeBase = `property:${property._id.toString()}`;

    // Publish / unpublish
    if (before.isPublished !== property.isPublished) {
      await createNotification({
        recipient: ownerId,
        sender: req.user._id,
        type: property.isPublished ? 'property_published' : 'property_unpublished',
        title: property.isPublished ? 'Property Published' : 'Property Unpublished',
        message: `Your property "${property.title}" has been ${property.isPublished ? 'published' : 'unpublished'}.`,
        relatedEntityType: 'property',
        relatedEntityId: property._id.toString(),
        dedupeKey: `${dedupeBase}:publish:${property.isPublished}`,
      });
    }

    // Status change
    if (before.status !== property.status) {
      await createNotification({
        recipient: ownerId,
        sender: req.user._id,
        type: 'property_status_changed',
        title: 'Property Status Changed',
        message: `Your property "${property.title}" is now marked as "${property.status}".`,
        relatedEntityType: 'property',
        relatedEntityId: property._id.toString(),
        dedupeKey: `${dedupeBase}:status:${property.status}`,
      });
    }

    // Featured toggle (admin action; notify owner)
    if (before.featured !== property.featured) {
      await createNotification({
        recipient: ownerId,
        sender: req.user._id,
        type: 'property_featured',
        title: property.featured ? 'Property Featured' : 'Property Unfeatured',
        message: `Your property "${property.title}" has been ${property.featured ? 'marked as featured' : 'removed from featured'}.`,
        relatedEntityType: 'property',
        relatedEntityId: property._id.toString(),
        dedupeKey: `${dedupeBase}:featured:${property.featured}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Property updated.',
      property: property.toPublicJSON(),
    });
  } catch (err) { return next(err); }
}

async function deleteProperty(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid property id.' });

    const property = await Property.findById(id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
    if (!canManage(property, req.user)) return res.status(403).json({ success: false, message: 'You cannot delete this property.' });

    await property.deleteOne();
    return res.status(200).json({ success: true, message: 'Property deleted.' });
  } catch (err) { return next(err); }
}

module.exports = { createProperty, listProperties, getProperty, updateProperty, deleteProperty };

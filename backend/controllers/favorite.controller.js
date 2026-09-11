/**
 * Favorites controller.
 * All operations scoped to the authenticated user — no user id from frontend.
 */
const mongoose = require('mongoose');
const Favorite = require('../models/Favorite');
const Property = require('../models/Property');

const FAVORITE_ROLES = ['buyer', 'seller', 'admin']; // admins/sellers may save too, but primary is buyer

function validId(id) { return mongoose.Types.ObjectId.isValid(id); }

/**
 * POST /api/favorites/:propertyId
 */
async function addFavorite(req, res, next) {
  try {
    const { propertyId } = req.params;
    if (!validId(propertyId)) {
      return res.status(400).json({ success: false, message: 'Invalid property id.' });
    }

    // Confirm the property exists and is publicly viewable.
    const property = await Property.findById(propertyId).select('_id isPublished');
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }
    // Public visibility check — sellers/admin bypass public rule on their own drafts later.
    if (!property.isPublished && req.user.role === 'buyer') {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    // Idempotent: upsert prevents duplicate errors on race conditions.
    try {
      await Favorite.updateOne(
        { user: req.user._id, property: property._id },
        { $setOnInsert: { user: req.user._id, property: property._id } },
        { upsert: true }
      );
    } catch (err) {
      // Duplicate key race — treat as already favorited.
      if (!(err && err.code === 11000)) throw err;
    }

    return res.status(200).json({ success: true, message: 'Property saved.', favorited: true });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/favorites/:propertyId
 */
async function removeFavorite(req, res, next) {
  try {
    const { propertyId } = req.params;
    if (!validId(propertyId)) {
      return res.status(400).json({ success: false, message: 'Invalid property id.' });
    }

    await Favorite.deleteOne({ user: req.user._id, property: propertyId });
    return res.status(200).json({ success: true, message: 'Property removed from saved.', favorited: false });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/favorites
 * Returns populated, publicly-visible properties.
 * Orphaned favorites (deleted / unpublished) are filtered out and cleaned up.
 */
async function listFavorites(req, res, next) {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'property', populate: { path: 'owner' } });

    const visible = [];
    const orphans = [];

    for (const f of favorites) {
      const p = f.property;
      if (!p) { orphans.push(f._id); continue; }
      if (!p.isPublished && req.user.role === 'buyer') { orphans.push(f._id); continue; }
      visible.push(f);
    }

    // Best-effort cleanup of orphans (don't fail the request if cleanup fails).
    if (orphans.length) {
      Favorite.deleteMany({ _id: { $in: orphans } }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      favorites: visible.map((f) => ({
        id: f._id.toString(),
        savedAt: f.createdAt,
        property: f.property.toPublicJSON(),
      })),
      count: visible.length,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/favorites/ids
 * Lightweight: just the property IDs the current user has favorited.
 * Used by the frontend to build a Set without loading full docs.
 */
async function listFavoriteIds(req, res, next) {
  try {
    const rows = await Favorite.find({ user: req.user._id }).select('property');
    return res.status(200).json({
      success: true,
      propertyIds: rows.map((r) => r.property.toString()),
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/favorites/:propertyId/status
 */
async function favoriteStatus(req, res, next) {
  try {
    const { propertyId } = req.params;
    if (!validId(propertyId)) {
      return res.status(400).json({ success: false, message: 'Invalid property id.' });
    }
    const exists = await Favorite.exists({ user: req.user._id, property: propertyId });
    return res.status(200).json({ success: true, favorited: Boolean(exists) });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  addFavorite,
  removeFavorite,
  listFavorites,
  listFavoriteIds,
  favoriteStatus,
  FAVORITE_ROLES,
};

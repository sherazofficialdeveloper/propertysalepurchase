/**
 * Dashboard statistics controllers — real Mongo queries only.
 */
const User = require('../models/User');
const Property = require('../models/Property');
const Inquiry = require('../models/Inquiry');
const Favorite = require('../models/Favorite');

async function buyerDashboard(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    // Buyer inquiries: user ref OR legacy email-matched guest submissions.
    const buyerFilter = { $or: [{ user: req.user._id }, { user: null, email: req.user.email }] };

    const [total, newC, contacted, inProgress, resolved, closed, favorites] = await Promise.all([
      Inquiry.countDocuments(buyerFilter),
      Inquiry.countDocuments({ ...buyerFilter, status: 'New' }),
      Inquiry.countDocuments({ ...buyerFilter, status: 'Contacted' }),
      Inquiry.countDocuments({ ...buyerFilter, status: 'In Progress' }),
      Inquiry.countDocuments({ ...buyerFilter, status: 'Resolved' }),
      Inquiry.countDocuments({ ...buyerFilter, status: 'Closed' }),
      Favorite.countDocuments({ user: req.user._id }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalInquiries: total,
        newInquiries: newC,
        contactedInquiries: contacted,
        inProgressInquiries: inProgress,
        resolvedInquiries: resolved,
        closedInquiries: closed,
        savedProperties: favorites,
      },
      account: {
        role: req.user.role,
        isActive: req.user.isActive,
        memberSince: req.user.createdAt,
      },
    });
  } catch (err) { return next(err); }
}

async function sellerDashboard(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Seller access required.' });
    }
    const owner = req.user._id;

    const [total, published, drafts, available, pending, sold, featured] = await Promise.all([
      Property.countDocuments({ owner }),
      Property.countDocuments({ owner, isPublished: true }),
      Property.countDocuments({ owner, isPublished: false }),
      Property.countDocuments({ owner, status: 'available' }),
      Property.countDocuments({ owner, status: 'pending' }),
      Property.countDocuments({ owner, status: 'sold' }),
      Property.countDocuments({ owner, featured: true }),
    ]);

    const myProps = await Property.find({ owner }).select('_id');
    const ids = myProps.map((p) => p._id.toString());

    const inqScope = ids.length ? { propertyId: { $in: ids } } : null;
    const [totalInq, newInq, contactedInq, inProgressInq, resolvedInq, closedInq] = inqScope
      ? await Promise.all([
          Inquiry.countDocuments(inqScope),
          Inquiry.countDocuments({ ...inqScope, status: 'New' }),
          Inquiry.countDocuments({ ...inqScope, status: 'Contacted' }),
          Inquiry.countDocuments({ ...inqScope, status: 'In Progress' }),
          Inquiry.countDocuments({ ...inqScope, status: 'Resolved' }),
          Inquiry.countDocuments({ ...inqScope, status: 'Closed' }),
        ])
      : [0, 0, 0, 0, 0, 0];

    return res.status(200).json({
      success: true,
      stats: {
        totalProperties: total, publishedProperties: published, draftProperties: drafts,
        availableProperties: available, pendingProperties: pending, soldProperties: sold,
        featuredProperties: featured,
        totalInquiries: totalInq, newInquiries: newInq, contactedInquiries: contactedInq,
        inProgressInquiries: inProgressInq, resolvedInquiries: resolvedInq, closedInquiries: closedInq,
      },
    });
  } catch (err) { return next(err); }
}

async function adminDashboard(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    const [
      totalUsers, buyers, sellers, admins,
      totalProps, published, drafts, availableP, pendingP, soldP, featuredP,
      totalInq, newInq, contactedInq, inProgressInq, resolvedInq, closedInq,
    ] = await Promise.all([
      User.countDocuments({}), User.countDocuments({ role: 'buyer' }), User.countDocuments({ role: 'seller' }), User.countDocuments({ role: 'admin' }),
      Property.countDocuments({}), Property.countDocuments({ isPublished: true }), Property.countDocuments({ isPublished: false }),
      Property.countDocuments({ status: 'available' }), Property.countDocuments({ status: 'pending' }), Property.countDocuments({ status: 'sold' }),
      Property.countDocuments({ featured: true }),
      Inquiry.countDocuments({}), Inquiry.countDocuments({ status: 'New' }), Inquiry.countDocuments({ status: 'Contacted' }),
      Inquiry.countDocuments({ status: 'In Progress' }), Inquiry.countDocuments({ status: 'Resolved' }), Inquiry.countDocuments({ status: 'Closed' }),
    ]);

    return res.status(200).json({
      success: true,
      users: { total: totalUsers, buyers, sellers, admins },
      properties: {
        total: totalProps, published, drafts, featured: featuredP,
        byStatus: { available: availableP, pending: pendingP, sold: soldP },
      },
      inquiries: {
        total: totalInq,
        byStatus: {
          new: newInq, contacted: contactedInq, inProgress: inProgressInq, resolved: resolvedInq, closed: closedInq,
        },
      },
    });
  } catch (err) { return next(err); }
}

module.exports = { buyerDashboard, sellerDashboard, adminDashboard };

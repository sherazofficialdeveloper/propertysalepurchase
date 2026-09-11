/**
 * Property model — real Mongo-backed property listing.
 * Controlled enums for type/purpose/status. Owner set server-side.
 */
const mongoose = require('mongoose');

const PROPERTY_TYPES = ['house', 'apartment', 'commercial', 'plot', 'office', 'shop'];
const PURPOSES = ['sale', 'purchase'];
const STATUSES = ['available', 'pending', 'sold'];
const AREA_UNITS = ['sqft', 'sqm', 'marla', 'kanal'];
const CURRENCIES = ['PKR', 'USD'];

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 4, maxlength: 160 },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 4000 },

    propertyType: { type: String, required: true, enum: PROPERTY_TYPES, index: true },
    purpose: { type: String, required: true, enum: PURPOSES, index: true },

    price: { type: Number, required: true, min: 0, index: true },
    currency: { type: String, enum: CURRENCIES, default: 'PKR' },

    location: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 80, index: true },

    area: { type: Number, required: true, min: 0, index: true },
    areaUnit: { type: String, enum: AREA_UNITS, default: 'sqft' },

    bedrooms: { type: Number, default: 0, min: 0, max: 50 },
    bathrooms: { type: Number, default: 0, min: 0, max: 50 },
    parking: { type: Number, default: 0, min: 0, max: 50 },

    yearBuilt: { type: Number, default: null, min: 1800, max: 2200 },
    furnished: { type: String, enum: ['unfurnished', 'semi', 'furnished'], default: 'unfurnished' },
    constructionStatus: { type: String, trim: true, default: '' },

    features: { type: [String], default: [] },
    amenities: { type: [String], default: [] },
    images: { type: [String], default: [] },

    status: { type: String, enum: STATUSES, default: 'available', index: true },
    featured: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: false, index: true },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

// Compound index for the most common public browse query
propertySchema.index({ isPublished: 1, status: 1, propertyType: 1, city: 1 });
propertySchema.index({ isPublished: 1, featured: -1, createdAt: -1 });

propertySchema.methods.toPublicJSON = function toPublicJSON(opts = {}) {
  const o = this.owner && this.owner.toSafeJSON ? this.owner.toSafeJSON() : this.owner;
  return {
    id: this._id.toString(),
    title: this.title,
    description: this.description,
    propertyType: this.propertyType,
    purpose: this.purpose,
    price: this.price,
    currency: this.currency,
    location: this.location,
    city: this.city,
    area: this.area,
    areaUnit: this.areaUnit,
    bedrooms: this.bedrooms,
    bathrooms: this.bathrooms,
    parking: this.parking,
    yearBuilt: this.yearBuilt,
    furnished: this.furnished,
    constructionStatus: this.constructionStatus,
    features: this.features,
    amenities: this.amenities,
    images: this.images,
    status: this.status,
    featured: this.featured,
    isPublished: this.isPublished,
    owner: o ? {
      id: o.id,
      name: o.name,
      role: o.role,
      phone: o.phone || '',
      email: o.email || '',
      avatar: o.avatar || '',
    } : null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('Property', propertySchema);
module.exports.PROPERTY_TYPES = PROPERTY_TYPES;
module.exports.PURPOSES = PURPOSES;
module.exports.STATUSES = STATUSES;
module.exports.AREA_UNITS = AREA_UNITS;
module.exports.CURRENCIES = CURRENCIES;

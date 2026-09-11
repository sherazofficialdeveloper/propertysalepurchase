/**
 * User model.
 * NOTE: Password hashing is done by callers (auth controller, seed scripts).
 * The model does NOT hash on save — this avoids double-hashing bugs.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['buyer', 'seller', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
    phone: { type: String, trim: true, maxlength: 30, default: '' },
    // 60 = bcrypt hash length. Callers MUST hash before create/save.
    password: { type: String, required: true, minlength: 60, select: false },
    role: { type: String, enum: ROLES, default: 'buyer', index: true },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    avatar: this.avatar,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;

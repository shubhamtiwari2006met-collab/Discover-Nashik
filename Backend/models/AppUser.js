const mongoose = require('mongoose');
const crypto = require('crypto');

// Helper to generate a non-sequential, non-predictable Discover Nashik Platform ID (e.g. DN-7K4M92X)
function generatePlatformId() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Avoid ambiguous chars like 0, O, 1, I
  let result = 'DN-';
  const bytes = crypto.randomBytes(7);
  for (let i = 0; i < 7; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

const appUserSchema = new mongoose.Schema({
  platformId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  email: {
    type: String,
    default: null,
    lowercase: true,
    trim: true
  },
  mobile: {
    type: String,
    default: null,
    trim: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  mobileVerified: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    default: null,
    trim: true
  },
  passwordHash: {
    type: String,
    default: null,
    select: false
  },
  resetPasswordToken: {
    type: String,
    default: null,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
    select: false
  },
  authProvider: {
    type: String,
    default: 'local'
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create partial unique indexes so null values don't collide
appUserSchema.index(
  { email: 1 },
  { 
    unique: true, 
    partialFilterExpression: { email: { $type: 'string' } } 
  }
);

appUserSchema.index(
  { mobile: 1 },
  { 
    unique: true, 
    partialFilterExpression: { mobile: { $type: 'string' } } 
  }
);

// Method to format public user output without sensitive fields
appUserSchema.methods.toSafeObject = function() {
  return {
    id: this._id.toString(),
    platformId: this.platformId,
    email: this.email,
    mobile: this.mobile,
    name: this.name,
    emailVerified: this.emailVerified,
    mobileVerified: this.mobileVerified,
    authProvider: this.authProvider,
    createdAt: this.createdAt,
    lastLoginAt: this.lastLoginAt
  };
};

appUserSchema.statics.generatePlatformId = generatePlatformId;

module.exports = mongoose.model('AppUser', appUserSchema, 'app_users');

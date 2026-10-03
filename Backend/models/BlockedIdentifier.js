const mongoose = require('mongoose');

const blockedIdentifierSchema = new mongoose.Schema({
  identifierType: {
    type: String,
    enum: ['email', 'mobile'],
    required: true
  },
  identifier: {
    type: String,
    required: true,
    trim: true
  },
  normalizedIdentifier: {
    type: String,
    required: true,
    trim: true
  },
  blockedAt: {
    type: Date,
    default: Date.now
  },
  blockedBy: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  unblockedAt: {
    type: Date,
    default: null
  },
  unblockedBy: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Compound index for efficient lookups
blockedIdentifierSchema.index(
  { normalizedIdentifier: 1, identifierType: 1, isActive: 1 }
);

blockedIdentifierSchema.index({ isActive: 1 });

module.exports = mongoose.model('BlockedIdentifier', blockedIdentifierSchema, 'blocked_identifiers');

const mongoose = require('mongoose');

/**
 * UserConsent Schema
 * Maintains an auditable, immutable record of user acceptance of
 * Discover Nashik's Terms & Conditions and Privacy Policy.
 */
const userConsentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppUser',
    required: true,
    index: true
  },
  platformId: {
    type: String,
    trim: true,
    index: true
  },
  termsAccepted: {
    type: Boolean,
    required: true,
    default: true
  },
  privacyPolicyAccepted: {
    type: Boolean,
    required: true,
    default: true
  },
  termsVersion: {
    type: String,
    required: true,
    default: '1.0'
  },
  privacyPolicyVersion: {
    type: String,
    required: true,
    default: '1.0'
  },
  acceptedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  consentMethod: {
    type: String,
    required: true,
    default: 'signup'
  },
  consentSource: {
    type: String,
    required: true,
    default: 'signup'
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserConsent', userConsentSchema, 'user_consents');

const mongoose = require('mongoose');

const notificationIdentitySchema = new mongoose.Schema({
  identityType: { type: String, enum: ['platform', 'app_user'], required: true },
  identityId: { type: String, required: true },
  recipientId: { type: String, required: true, unique: true, index: true },
}, { timestamps: true });

notificationIdentitySchema.index({ identityType: 1, identityId: 1 }, { unique: true });

module.exports = mongoose.model('NotificationIdentity', notificationIdentitySchema);

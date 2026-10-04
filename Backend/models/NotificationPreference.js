const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema({
  recipientId: { type: String, required: true, unique: true, index: true },
  enabled: { type: Boolean, default: true },
  pushEnabled: { type: Boolean, default: false },
  categories: { type: Map, of: Boolean, default: () => new Map() },
}, { timestamps: true });

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);

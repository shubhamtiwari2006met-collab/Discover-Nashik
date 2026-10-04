const mongoose = require('mongoose');

const notificationDeviceSchema = new mongoose.Schema({
  recipientId: { type: String, required: true, index: true },
  recipientType: { type: String, enum: ['platform', 'app_user'], required: true },
  fcmToken: { type: String, required: true, unique: true, select: false },
  platform: { type: String, enum: ['web'], default: 'web', required: true },
  browser: { type: String, default: '', maxlength: 80 },
  deviceId: { type: String, default: '', maxlength: 120 },
  isActive: { type: Boolean, default: true, index: true },
  lastSeenAt: { type: Date, default: Date.now },
}, { timestamps: true });

notificationDeviceSchema.index({ recipientId: 1, isActive: 1 });

module.exports = mongoose.model('NotificationDevice', notificationDeviceSchema);

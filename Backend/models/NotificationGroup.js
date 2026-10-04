const mongoose = require('mongoose');

const notificationGroupSchema = new mongoose.Schema({
  groupCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  groupName: { type: String, default: 'Nashik Yatra Group', trim: true },
  createdByRecipientId: { type: String, default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('NotificationGroup', notificationGroupSchema);

const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema({
  key: { type: String, enum: ['global'], unique: true, default: 'global' },
  globalAutomationEnabled: { type: Boolean, default: true },
  categories: {
    lostFound: { type: Boolean, default: true },
    groupTracker: { type: Boolean, default: true },
    tripPlanner: { type: Boolean, default: true },
  },
  tripReminders: {
    sevenDays: { type: Boolean, default: true },
    oneDay: { type: Boolean, default: true },
    tripDay: { type: Boolean, default: true },
  },
}, { timestamps: true });

module.exports = mongoose.model('NotificationSettings', notificationSettingsSchema);

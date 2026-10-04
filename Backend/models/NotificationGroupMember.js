const mongoose = require('mongoose');

const notificationGroupMemberSchema = new mongoose.Schema({
  groupCode: { type: String, required: true, uppercase: true, trim: true, index: true },
  memberId: { type: String, required: true },
  identityType: { type: String, enum: ['platform', 'app_user', 'anonymous'], required: true },
  identityId: { type: String, required: true },
  recipientId: { type: String, default: null, index: true },
  displayName: { type: String, required: true, trim: true },
  role: { type: String, enum: ['coordinator', 'member'], default: 'member' },
  status: { type: String, enum: ['active', 'left'], default: 'active', index: true },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date, default: null },
}, { timestamps: true });

notificationGroupMemberSchema.index({ groupCode: 1, memberId: 1 }, { unique: true });

module.exports = mongoose.model('NotificationGroupMember', notificationGroupMemberSchema);

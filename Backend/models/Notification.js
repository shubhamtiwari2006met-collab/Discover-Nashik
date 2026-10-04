const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  category: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  source: { type: String, enum: ['AUTOMATED', 'MANUAL', 'SCHEDULED'], required: true, index: true },
  status: { type: String, enum: ['PENDING', 'SENT', 'FAILED', 'CANCELLED'], default: 'SENT', index: true },
  referenceId: { type: String, default: null },
  referenceType: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  recipientScope: { type: String, default: 'USER' },
  batchId: { type: String, default: null, index: true },
  deduplicationKey: { type: String, default: null },
  isRead: { type: Boolean, default: false, index: true },
  readAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null, index: true },
  scheduledAt: { type: Date, default: null, index: true },
}, { timestamps: true });

notificationSchema.index(
  { recipientId: 1, deduplicationKey: 1 },
  { unique: true, partialFilterExpression: { deduplicationKey: { $type: 'string' } } }
);
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);

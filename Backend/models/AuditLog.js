const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['ADMIN_CREATED', 'ADMIN_ACCESS_REVOKED'],
    required: true,
  },
  performedBy: {
    type: String,
    required: true,
  },
  affectedAdmin: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  details: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);

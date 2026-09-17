const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  businessName: { type: String, required: true, trim: true },
  businessType: { type: String, required: true, trim: true },
  contactName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  address: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  documents: [{
    name: { type: String, required: true },
    url: { type: String, required: true }
  }],
  photos: [{ type: String }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  monetization: {
    plan: { type: String, default: 'free' },
    status: { type: String, enum: ['inactive', 'active', 'past_due'], default: 'inactive' },
    customerId: { type: String, default: '' },
    subscriptionId: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Business', businessSchema);
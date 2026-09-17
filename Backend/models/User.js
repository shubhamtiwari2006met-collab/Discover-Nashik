const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  supabaseId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, default: 'Visitor' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  role: { type: String, enum: ['visitor', 'business', 'admin'], default: 'visitor' },
  adminStatus: { type: String, enum: ['active', 'revoked', 'not_applicable'], default: 'not_applicable' },
  isPrimaryAdmin: { type: Boolean, default: false },
  createdBy: { type: String, default: null },
  revokedAt: { type: Date, default: null },
  businessStatus: { type: String, enum: ['not_applicable', 'pending', 'approved', 'rejected'], default: 'not_applicable' },
  avatar: { type: String, default: '' },
  savedPlaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Place' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

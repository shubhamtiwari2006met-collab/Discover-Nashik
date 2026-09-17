const mongoose = require('mongoose');

const kumbhLocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  placeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Place',
    default: null
  },
  category: {
    type: String,
    required: true,
    enum: ['Ghat', 'Temple', 'Parking', 'Entry/Exit', 'Medical/Help', 'Emergency', 'Other'],
    default: 'Ghat'
  },
  description: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  image: {
    type: String,
    default: ''
  },
  kumbhImportance: {
    type: String,
    default: ''
  },
  instructions: {
    type: String,
    default: ''
  },
  nearbyFacilities: {
    type: String,
    default: ''
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('KumbhLocation', kumbhLocationSchema);

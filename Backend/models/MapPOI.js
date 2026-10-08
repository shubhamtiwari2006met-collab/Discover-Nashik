const mongoose = require('mongoose');

const mapPOISchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Spiritual',
      'Historic',
      'Religious',
      'Tourist Spot',
      'Trek',
      'Mountains',
      'Hotels',
      'Restaurants',
      'Hospitals',
      'Public Toilets',
      'Emergency',
      'Transport'
    ]
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  famousThing: {
    type: String,
    default: ''
  },
  mapOnly: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('MapPOI', mapPOISchema);

const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Temples', 'Food', 'Hotels', 'Nature', 'Waterfalls', 'Trekking', 'Vineyards', 'Shopping', 'Emergency']
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  tagline: {
    type: String,
    default: ''
  },
  famousThing: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    default: 4.0,
    min: 0,
    max: 5
  },
  business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Place', placeSchema);

const mongoose = require('mongoose');

const kumbhTransportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Bus', 'Railway', 'Shuttle', 'Parking', 'Walking Route', 'Entry/Exit', 'Traffic Advisory', 'Transport Point', 'Other'],
    default: 'Bus'
  },
  description: {
    type: String,
    required: true
  },
  routeOrDetails: {
    type: String,
    default: ''
  },
  locationOrStation: {
    type: String,
    default: ''
  },
  advisories: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('KumbhTransport', kumbhTransportSchema);

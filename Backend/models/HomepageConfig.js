const mongoose = require('mongoose');

/**
 * HomepageConfig stores the admin's homepage display preferences.
 * Uses a singleton pattern — only one document exists (configKey: 'homepage_places').
 * Each entry in `places` references a Place _id with a visibility flag and sort order.
 */
const homepageConfigSchema = new mongoose.Schema({
  configKey: {
    type: String,
    default: 'homepage_places',
    unique: true,
    required: true,
    immutable: true
  },
  places: [{
    placeId: {
      type: String,
      required: true
    },
    visible: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  updatedBy: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('HomepageConfig', homepageConfigSchema);

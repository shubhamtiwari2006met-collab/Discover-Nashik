const mongoose = require('mongoose');

const tripItemSchema = new mongoose.Schema({
  placeId: { type: String, default: null },
  title: { type: String, required: true },
  category: { type: String, default: 'General' },
  location: { type: String, default: 'Nashik' },
  startTime: { type: String, default: '09:00 AM' },
  endTime: { type: String, default: '10:30 AM' },
  durationMinutes: { type: Number, default: 90 },
  travelMinutes: { type: Number, default: 15 },
  notes: { type: String, default: '' },
  isCompleted: { type: Boolean, default: false }
});

const dayItinerarySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  date: { type: String, required: true },
  title: { type: String, default: '' },
  items: [tripItemSchema]
});

const kumbhTripSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'AppUser', required: true, index: true },
  title: { type: String, required: true, default: 'My Kumbh Journey 2027' },
  destination: { type: String, default: 'Nashik + Trimbakeshwar' },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  travellers: {
    adults: { type: Number, default: 2 },
    children: { type: Number, default: 0 },
    seniorCitizens: { type: Number, default: 0 }
  },
  interests: [{ type: String }],
  travelStyle: { type: String, default: 'Balanced' }, // Relaxed, Balanced, Packed
  budget: { type: String, default: 'Moderate' }, // Budget, Moderate, Premium, Custom
  arrivalMode: { type: String, default: 'Train' },
  departureMode: { type: String, default: 'Train' },
  stayType: { type: String, default: 'Discover Nashik Hotel' },
  preferences: {
    lowWalking: { type: Boolean, default: false },
    accessibilityNeeded: { type: Boolean, default: false },
    vegFoodOnly: { type: Boolean, default: false },
    avoidCrowds: { type: Boolean, default: false },
    earlyMorningPreference: { type: Boolean, default: false }
  },
  days: [dayItinerarySchema],
  status: { type: String, enum: ['planned', 'active', 'completed'], default: 'planned' }
}, { timestamps: true });

kumbhTripSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('KumbhTrip', kumbhTripSchema, 'kumbh_trips');

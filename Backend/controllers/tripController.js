const KumbhTrip = require('../models/KumbhTrip');
const Place = require('../models/Place');
const KumbhLocation = require('../models/KumbhLocation');
const KumbhEvent = require('../models/KumbhEvent');

// Default curated database of Nashik & Kumbh locations for high-quality itinerary generation
const DEFAULT_KUMBH_PLACES = [
  {
    title: "Ram Kund & Godavari Ghats",
    category: "Spiritual",
    location: "Panchavati, Nashik",
    durationMinutes: 90,
    travelMinutes: 15,
    description: "Sacred bathing ghat where millions gather during Kumbh Mela for holy dips.",
    isEarlyMorning: true,
    tags: ["Spiritual", "Culture", "Photography", "Kumbh experiences"]
  },
  {
    title: "Trimbakeshwar Jyotirlinga Temple",
    category: "Spiritual",
    location: "Trimbak, Nashik",
    durationMinutes: 120,
    travelMinutes: 45,
    description: "One of the 12 sacred Jyotirlinga temples of Lord Shiva and primary Kumbh ritual site.",
    isEarlyMorning: true,
    tags: ["Spiritual", "Heritage", "Kumbh experiences"]
  },
  {
    title: "Kalaram Temple",
    category: "Heritage",
    location: "Panchavati, Nashik",
    durationMinutes: 60,
    travelMinutes: 10,
    description: "Historic 18th-century black stone temple dedicated to Lord Rama.",
    tags: ["Heritage", "Spiritual", "Culture"]
  },
  {
    title: "Sita Gufa (Sita's Cave)",
    category: "Heritage",
    location: "Panchavati, Nashik",
    durationMinutes: 45,
    travelMinutes: 5,
    description: "Sacred cave near Kalaram temple where Sita worshipped Lord Shiva during exile.",
    tags: ["Heritage", "Spiritual", "Culture"]
  },
  {
    title: "Kushavarta Kund",
    category: "Spiritual",
    location: "Trimbakeshwar",
    durationMinutes: 60,
    travelMinutes: 10,
    description: "Sacred pond in Trimbak where river Godavari originates and Akharas take royal bath.",
    tags: ["Spiritual", "Kumbh experiences"]
  },
  {
    title: "Anjaneri Hill (Birthplace of Lord Hanuman)",
    category: "Nature",
    location: "Anjaneri, Nashik",
    durationMinutes: 180,
    travelMinutes: 30,
    description: "Scenic mountain trekking route offering breathtaking views of Nashik landscape.",
    tags: ["Nature", "Trekking", "Photography", "Culture"]
  },
  {
    title: "Pandavleni Caves & Dadasaheb Phalke Smarak",
    category: "Heritage",
    location: "Pathardi Phata, Nashik",
    durationMinutes: 120,
    travelMinutes: 20,
    description: "24 ancient rock-cut Buddhist caves dating back to 1st century BCE.",
    tags: ["Heritage", "Culture", "Photography"]
  },
  {
    title: "Muktidham Temple Complex",
    category: "Spiritual",
    location: "Nashik Road",
    durationMinutes: 60,
    travelMinutes: 15,
    description: "Unique white marble temple housing replicas of all 12 Jyotirlingas.",
    tags: ["Spiritual", "Family"]
  },
  {
    title: "Sula Vineyards & Tasting Tour",
    category: "Vineyards",
    location: "Gangapur Dam Road, Nashik",
    durationMinutes: 120,
    travelMinutes: 25,
    description: "India's premier wine estate featuring vineyard tours, tastings, and sunset dining.",
    tags: ["Vineyards", "Food", "Culture", "Photography"]
  },
  {
    title: "Saraf Bazaar & Traditional Nashik Shopping",
    category: "Shopping",
    location: "Old City, Nashik",
    durationMinutes: 90,
    travelMinutes: 15,
    description: "Vibrant traditional market famous for copperware, chivda, sweets, and handicrafts.",
    tags: ["Shopping", "Food", "Culture"]
  },
  {
    title: "Someshwar Waterfall & Temple",
    category: "Nature",
    location: "Gangapur, Nashik",
    durationMinutes: 90,
    travelMinutes: 20,
    description: "Picturesque waterfall on Godavari river surrounded by lush greenery and ancient temple.",
    tags: ["Nature", "Family", "Photography"]
  },
  {
    title: "Tapovan Sacred Grove",
    category: "Spiritual",
    location: "Near Panchavati, Nashik",
    durationMinutes: 60,
    travelMinutes: 10,
    description: "Quiet meditative riverfront grove where Lakshmana practiced penance.",
    tags: ["Spiritual", "Nature", "Culture"]
  }
];

// Helper to format 12h time string
function formatTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${displayHours}:${displayMinutes} ${period}`;
}

// ─── POST /api/kumbh/trips/generate — Structured Trip Generation ───
exports.generateTrip = async (req, res) => {
  try {
    const userId = req.authUser._id;
    const {
      destination = 'Nashik + Trimbakeshwar',
      startDate,
      endDate,
      travellers = { adults: 2, children: 0, seniorCitizens: 0 },
      interests = ['Spiritual', 'Kumbh experiences'],
      travelStyle = 'Balanced',
      budget = 'Moderate',
      arrivalMode = 'Train',
      departureMode = 'Train',
      stayType = 'Discover Nashik Hotel',
      preferences = {}
    } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return res.status(400).json({ message: 'Invalid start or end date selection' });
    }

    // Calculate trip days (max 10 days per generated trip)
    const diffTime = Math.abs(end - start);
    const totalDays = Math.min(10, Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1));

    // Determine max activities per day based on travel style
    let maxItemsPerDay = 3;
    if (travelStyle === 'Relaxed') maxItemsPerDay = 2;
    if (travelStyle === 'Packed') maxItemsPerDay = 4;

    // Filter candidate places matching user interests or fallback defaults
    let candidatePlaces = [...DEFAULT_KUMBH_PLACES];
    if (interests && interests.length > 0) {
      candidatePlaces.sort((a, b) => {
        const scoreA = a.tags.filter(t => interests.includes(t)).length;
        const scoreB = b.tags.filter(t => interests.includes(t)).length;
        return scoreB - scoreA;
      });
    }

    // Adjust for accessibility/low walking preferences
    if (preferences.lowWalking || preferences.accessibilityNeeded) {
      candidatePlaces = candidatePlaces.filter(p => !p.tags.includes("Trekking"));
    }

    const generatedDays = [];
    let poolIndex = 0;

    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + (dayNum - 1));
      const dateStr = currentDate.toISOString().split('T')[0];

      let currentMinute = preferences.earlyMorningPreference ? 360 : 540; // 6:00 AM or 9:00 AM start
      const items = [];

      let dayTitle = `Day ${dayNum}: `;
      if (dayNum === 1) dayTitle += `Arrival & Sacred Panchavati Circuit`;
      else if (dayNum === totalDays) dayTitle += `Trimbakeshwar Rituals & Departure`;
      else dayTitle += `Heritage & Cultural Exploration`;

      for (let itemIdx = 0; itemIdx < maxItemsPerDay; itemIdx++) {
        const place = candidatePlaces[poolIndex % candidatePlaces.length];
        poolIndex++;

        const startTimeStr = formatTime(currentMinute);
        const duration = place.durationMinutes;
        const travel = place.travelMinutes;
        currentMinute += duration;
        const endTimeStr = formatTime(currentMinute);
        currentMinute += travel; // Travel buffer for next item

        items.push({
          placeId: null,
          title: place.title,
          category: place.category,
          location: place.location,
          startTime: startTimeStr,
          endTime: endTimeStr,
          durationMinutes: duration,
          travelMinutes: travel,
          notes: place.description,
          isCompleted: false
        });
      }

      generatedDays.push({
        dayNumber: dayNum,
        date: dateStr,
        title: dayTitle,
        items
      });
    }

    // Save generated trip to MongoDB
    const newTrip = new KumbhTrip({
      userId,
      title: `My ${destination} Journey (${totalDays} ${totalDays === 1 ? 'Day' : 'Days'})`,
      destination,
      startDate,
      endDate,
      travellers,
      interests,
      travelStyle,
      budget,
      arrivalMode,
      departureMode,
      stayType,
      preferences,
      days: generatedDays
    });

    await newTrip.save();

    return res.status(201).json({
      success: true,
      message: 'Personalized Kumbh trip generated successfully',
      trip: newTrip
    });
  } catch (error) {
    console.error('Error generating Kumbh trip:', error);
    return res.status(500).json({ message: 'Failed to generate personalized trip' });
  }
};

// ─── GET /api/kumbh/trips — List User's Saved Trips (Strict Ownership Authorized) ───
exports.getUserTrips = async (req, res) => {
  try {
    const userId = req.authUser._id;
    const trips = await KumbhTrip.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      trips
    });
  } catch (error) {
    console.error('Error fetching user trips:', error);
    return res.status(500).json({ message: 'Failed to retrieve saved trips' });
  }
};

// ─── GET /api/kumbh/trips/:id — Get Single Trip (Strict Ownership Authorized) ───
exports.getTripById = async (req, res) => {
  try {
    const userId = req.authUser._id;
    const tripId = req.params.id;

    const trip = await KumbhTrip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip itinerary not found' });
    }

    // Strict Ownership Verification
    if (trip.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to view this trip' });
    }

    return res.status(200).json({
      success: true,
      trip
    });
  } catch (error) {
    console.error('Error fetching trip by ID:', error);
    return res.status(500).json({ message: 'Failed to retrieve trip details' });
  }
};

// ─── PUT /api/kumbh/trips/:id — Update Trip (Strict Ownership Authorized) ───
exports.updateTrip = async (req, res) => {
  try {
    const userId = req.authUser._id;
    const tripId = req.params.id;

    const trip = await KumbhTrip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip itinerary not found' });
    }

    // Strict Ownership Verification
    if (trip.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to modify this trip' });
    }

    const { days, title, status, preferences, travelStyle } = req.body;
    if (days) trip.days = days;
    if (title) trip.title = title;
    if (status) trip.status = status;
    if (preferences) trip.preferences = preferences;
    if (travelStyle) trip.travelStyle = travelStyle;

    await trip.save();

    return res.status(200).json({
      success: true,
      message: 'Trip updated successfully',
      trip
    });
  } catch (error) {
    console.error('Error updating trip:', error);
    return res.status(500).json({ message: 'Failed to update trip' });
  }
};

// ─── DELETE /api/kumbh/trips/:id — Delete Trip (Strict Ownership Authorized) ───
exports.deleteTrip = async (req, res) => {
  try {
    const userId = req.authUser._id;
    const tripId = req.params.id;

    const trip = await KumbhTrip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip itinerary not found' });
    }

    // Strict Ownership Verification
    if (trip.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to delete this trip' });
    }

    await KumbhTrip.findByIdAndDelete(tripId);

    return res.status(200).json({
      success: true,
      message: 'Trip itinerary deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return res.status(500).json({ message: 'Failed to delete trip' });
  }
};

// ─── POST /api/kumbh/trips/:id/modify-ai — Natural Language AI Modification Engine ───
exports.modifyTripWithAi = async (req, res) => {
  try {
    const userId = req.authUser._id;
    const tripId = req.params.id;
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ message: 'Instruction prompt is required' });
    }

    const trip = await KumbhTrip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip itinerary not found' });
    }

    // Strict Ownership Verification
    if (trip.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to modify this trip' });
    }

    const cleanPrompt = prompt.toLowerCase();

    // 1. Remove Shopping / Remove Trekking
    if (cleanPrompt.includes('remove shopping') || cleanPrompt.includes('no shopping')) {
      trip.days.forEach(day => {
        day.items = day.items.filter(item => !item.category.toLowerCase().includes('shopping') && !item.title.toLowerCase().includes('shopping'));
      });
    }

    // 2. Add Trimbakeshwar if requested
    if (cleanPrompt.includes('add trimbakeshwar') || cleanPrompt.includes('trimbakeshwar temple')) {
      const alreadyHasTrimbak = trip.days.some(day => day.items.some(i => i.title.toLowerCase().includes('trimbakeshwar')));
      if (!alreadyHasTrimbak && trip.days.length > 0) {
        trip.days[0].items.unshift({
          placeId: null,
          title: "Trimbakeshwar Jyotirlinga Temple",
          category: "Spiritual",
          location: "Trimbak, Nashik",
          startTime: "06:30 AM",
          endTime: "08:30 AM",
          durationMinutes: 120,
          travelMinutes: 45,
          notes: "Sacred Jyotirlinga holy bath and early morning darshan.",
          isCompleted: false
        });
      }
    }

    // 3. Make less hectic / reduce activities
    if (cleanPrompt.includes('less hectic') || cleanPrompt.includes('relaxed') || cleanPrompt.includes('too busy')) {
      trip.travelStyle = 'Relaxed';
      trip.days.forEach(day => {
        if (day.items.length > 2) {
          day.items = day.items.slice(0, 2);
        }
      });
    }

    // 4. Low walking / no trekking
    if (cleanPrompt.includes('walk') || cleanPrompt.includes('stair') || cleanPrompt.includes('accessibility')) {
      trip.preferences.lowWalking = true;
      trip.days.forEach(day => {
        day.items = day.items.filter(item => !item.title.toLowerCase().includes('anjaneri') && !item.title.toLowerCase().includes('caves'));
      });
    }

    await trip.save();

    return res.status(200).json({
      success: true,
      message: `Itinerary updated based on your request: "${prompt}"`,
      trip
    });
  } catch (error) {
    console.error('AI trip modification error:', error);
    return res.status(500).json({ message: 'Failed to modify trip with AI instructions' });
  }
};

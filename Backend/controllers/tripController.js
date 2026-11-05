const KumbhTrip = require('../models/KumbhTrip');
const Place = require('../models/Place');
const KumbhLocation = require('../models/KumbhLocation');
const KumbhEvent = require('../models/KumbhEvent');
const { generateIntelligentItinerary } = require('../services/geoPilgrimagePlanner');

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
  },
  // ─── Extended places to support 7-10 day itineraries without repetition ───
  {
    title: "Gangapur Dam & Boating",
    category: "Nature",
    location: "Gangapur, Nashik",
    durationMinutes: 120,
    travelMinutes: 25,
    description: "Scenic reservoir offering boating, bird watching, and sunset views over the dam.",
    tags: ["Nature", "Family", "Photography"]
  },
  {
    title: "Coin Museum Nashik",
    category: "Heritage",
    location: "Anjaneri, Nashik",
    durationMinutes: 60,
    travelMinutes: 20,
    description: "One of India's finest numismatic museums showcasing coins from ancient to modern eras.",
    tags: ["Heritage", "Culture", "Family"]
  },
  {
    title: "Naroshankar Temple",
    category: "Spiritual",
    location: "Godavari Bank, Nashik",
    durationMinutes: 45,
    travelMinutes: 10,
    description: "18th-century Shiva temple famous for its enormous bell and riverside location.",
    tags: ["Spiritual", "Heritage", "Culture"]
  },
  {
    title: "Sundarnarayan Temple",
    category: "Spiritual",
    location: "Panchavati, Nashik",
    durationMinutes: 45,
    travelMinutes: 10,
    description: "Ancient Vishnu temple with beautiful carvings and serene courtyard atmosphere.",
    tags: ["Spiritual", "Heritage", "Culture"]
  },
  {
    title: "York Winery & Tasting Lounge",
    category: "Vineyards",
    location: "Gangapur, Nashik",
    durationMinutes: 90,
    travelMinutes: 25,
    description: "Award-winning winery with guided vineyard tours, tasting sessions, and panoramic valley views.",
    tags: ["Vineyards", "Food", "Photography"]
  },
  {
    title: "Grover Zampa Vineyards",
    category: "Vineyards",
    location: "Sanjegaon, Nashik",
    durationMinutes: 90,
    travelMinutes: 30,
    description: "Premium boutique winery offering exclusive wine tasting and picturesque vineyard walks.",
    tags: ["Vineyards", "Food", "Photography"]
  },
  {
    title: "Dugarwadi Waterfall",
    category: "Nature",
    location: "Trimbakeshwar Road, Nashik",
    durationMinutes: 120,
    travelMinutes: 35,
    description: "Stunning multi-tiered waterfall surrounded by dense green forest, ideal for nature lovers.",
    tags: ["Nature", "Trekking", "Photography"]
  },
  {
    title: "Saptashrungi Devi Temple",
    category: "Spiritual",
    location: "Vani, Nashik",
    durationMinutes: 180,
    travelMinutes: 60,
    description: "One of the Shakti Peeths, a powerful hilltop goddess temple with panoramic views.",
    tags: ["Spiritual", "Nature", "Trekking", "Photography"]
  },
  {
    title: "Bhandardara & Arthur Lake",
    category: "Nature",
    location: "Bhandardara, Nashik",
    durationMinutes: 180,
    travelMinutes: 75,
    description: "Serene hill station with Arthur Lake, Wilson Dam, firefly spots, and lush Sahyadri scenery.",
    tags: ["Nature", "Photography", "Family"]
  },
  {
    title: "Nandur Madhmeshwar Bird Sanctuary",
    category: "Nature",
    location: "Niphad, Nashik",
    durationMinutes: 120,
    travelMinutes: 45,
    description: "Maharashtra's only Ramsar wetland site, home to over 200 migratory and resident bird species.",
    tags: ["Nature", "Photography", "Family"]
  },
  {
    title: "ABC Farms (Agri-Tourism)",
    category: "Nature",
    location: "Trimbakeshwar Road, Nashik",
    durationMinutes: 120,
    travelMinutes: 30,
    description: "Popular agri-tourism destination with farm activities, organic food, and rural Nashik experiences.",
    tags: ["Nature", "Food", "Family", "Culture"]
  },
  {
    title: "Panchavati Heritage Walk",
    category: "Heritage",
    location: "Panchavati, Nashik",
    durationMinutes: 120,
    travelMinutes: 10,
    description: "Guided walk through Nashik's ancient Panchavati area covering temples, ghats, and historic lanes.",
    tags: ["Heritage", "Culture", "Kumbh experiences", "Photography"]
  },
  {
    title: "Godavari Dham",
    category: "Spiritual",
    location: "Nashik",
    durationMinutes: 60,
    travelMinutes: 15,
    description: "Modern spiritual complex on the banks of Godavari with meditation halls and puja areas.",
    tags: ["Spiritual", "Culture"]
  },
  {
    title: "Igatpuri Vipassana & Dhamma Giri",
    category: "Spiritual",
    location: "Igatpuri, Nashik",
    durationMinutes: 120,
    travelMinutes: 50,
    description: "World-renowned Vipassana meditation centre with serene hilltop pagoda and peace gardens.",
    tags: ["Spiritual", "Nature", "Culture"]
  },
  {
    title: "Harihar Fort Trek",
    category: "Nature",
    location: "Harshewadi, Nashik",
    durationMinutes: 240,
    travelMinutes: 50,
    description: "Thrilling rock-cut staircase fort trek with dramatic cliff edges and stunning Sahyadri views.",
    tags: ["Nature", "Trekking", "Photography"]
  },
  {
    title: "Brahmagiri Hill & Trek",
    category: "Nature",
    location: "Trimbakeshwar, Nashik",
    durationMinutes: 180,
    travelMinutes: 40,
    description: "Sacred hill where river Godavari originates; moderate trek with panoramic views of Trimbak valley.",
    tags: ["Nature", "Spiritual", "Trekking", "Photography"]
  },
  {
    title: "Nashik Caves (Trirashmi Leni)",
    category: "Heritage",
    location: "College Road, Nashik",
    durationMinutes: 90,
    travelMinutes: 15,
    description: "Group of 23 ancient Buddhist caves with detailed sculptures and inscriptions from 1st-3rd century CE.",
    tags: ["Heritage", "Culture", "Photography"]
  },
  {
    title: "Ozar Ganpati Temple",
    category: "Spiritual",
    location: "Junnar-Ozar, Nashik",
    durationMinutes: 90,
    travelMinutes: 50,
    description: "One of the Ashtavinayak temples dedicated to Lord Vighneshwar with beautiful carved mandap.",
    tags: ["Spiritual", "Heritage"]
  },
  {
    title: "Gondeshwar Temple",
    category: "Heritage",
    location: "Sinnar, Nashik",
    durationMinutes: 60,
    travelMinutes: 30,
    description: "11th-century Hemadpanthi-style temple complex with exquisite stone carvings dedicated to Lord Shiva.",
    tags: ["Heritage", "Spiritual", "Culture", "Photography"]
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

    // Generate intelligent, geography-based pilgrimage itinerary
    const generatedDays = generateIntelligentItinerary({
      destination,
      startDate,
      endDate,
      interests,
      travelStyle,
      preferences,
      travellers
    });

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

    const cleanPrompt = prompt.toLowerCase().trim();

    // ─── Fast-path handlers for the static quick-suggestion buttons ONLY ───
    // Complex, day-specific, replacement, or multi-action requests must be processed by the full AI engine.
    const isQuickSuggestion =
      cleanPrompt === 'add trimbakeshwar jyotirlinga' ||
      cleanPrompt === 'add trimbakeshwar' ||
      cleanPrompt === 'make itinerary less hectic' ||
      cleanPrompt === 'make itinerary relaxed' ||
      cleanPrompt === 'remove shopping activities' ||
      cleanPrompt === 'remove shopping' ||
      cleanPrompt === 'low walking preferences only' ||
      cleanPrompt === 'low walking only';

    let fastPathHandled = false;

    if (isQuickSuggestion) {
      // 1. Remove Shopping
      if (cleanPrompt.includes('remove shopping')) {
        trip.days.forEach(day => {
          day.items = day.items.filter(item => !item.category.toLowerCase().includes('shopping') && !item.title.toLowerCase().includes('shopping'));
        });
        fastPathHandled = true;
      }

      // 2. Add Trimbakeshwar if requested
      if (cleanPrompt.includes('add trimbakeshwar')) {
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
        fastPathHandled = true;
      }

      // 3. Make less hectic / reduce activities
      if (cleanPrompt.includes('less hectic') || cleanPrompt.includes('relaxed')) {
        trip.travelStyle = 'Relaxed';
        trip.days.forEach(day => {
          if (day.items.length > 2) {
            day.items = day.items.slice(0, 2);
          }
        });
        fastPathHandled = true;
      }

      // 4. Low walking
      if (cleanPrompt.includes('low walking') || cleanPrompt.includes('walk')) {
        trip.preferences.lowWalking = true;
        trip.days.forEach(day => {
          day.items = day.items.filter(item => !item.title.toLowerCase().includes('anjaneri') && !item.title.toLowerCase().includes('caves'));
        });
        fastPathHandled = true;
      }
    }

    // ─── AI-powered modification for all other requests ───
    if (!fastPathHandled) {
      // Load and sanitize Gemini API Key (support standard GEMINI_API_KEY as well as MAP_VOICE_API_KEY and GOOGLE_API_KEY)
      const apiKey = (process.env.GEMINI_API_KEY || process.env.MAP_VOICE_API_KEY || process.env.GOOGLE_API_KEY)?.trim().replace(/^["']|["']$/g, "");
      if (!apiKey) {
        console.error('[TripPlanner AI] GEMINI_API_KEY is not configured in backend environment variables.');
        return res.status(503).json({
          message: 'AI modification service is not configured. Please ensure GEMINI_API_KEY is configured in your backend environment variables.',
          code: 'AI_SERVICE_UNCONFIGURED'
        });
      }

      // Build available places reference for the AI
      const availablePlacesRef = DEFAULT_KUMBH_PLACES.map(p => ({
        title: p.title,
        category: p.category,
        location: p.location,
        durationMinutes: p.durationMinutes,
        travelMinutes: p.travelMinutes,
        description: p.description
      }));

      // Build current itinerary summary for the AI
      const currentItinerary = trip.days.map(day => ({
        dayNumber: day.dayNumber,
        date: day.date,
        title: day.title,
        items: day.items.map(item => ({
          title: item.title,
          category: item.category,
          location: item.location,
          startTime: item.startTime,
          endTime: item.endTime,
          durationMinutes: item.durationMinutes,
          travelMinutes: item.travelMinutes,
          notes: item.notes,
          isCompleted: item.isCompleted
        }))
      }));

      const systemPrompt = `You are an expert travel itinerary planner for Nashik, India. You help modify existing trip itineraries based on user instructions.

CURRENT ITINERARY (JSON):
${JSON.stringify(currentItinerary, null, 2)}

AVAILABLE NASHIK DESTINATIONS (you may use these or suggest similar Nashik-area places):
${JSON.stringify(availablePlacesRef, null, 2)}

RULES:
1. You MUST return ONLY a valid JSON array of day objects matching the exact structure below.
2. Modify ONLY what the user explicitly requests. Preserve all other days and items unchanged.
3. Each day object must have: dayNumber (number), date (string YYYY-MM-DD), title (string), items (array).
4. Each item must have: placeId (null), title (string), category (string), location (string), startTime (string like "9:00 AM"), endTime (string like "10:30 AM"), durationMinutes (number), travelMinutes (number), notes (string description), isCompleted (boolean).
5. Keep the same number of days as the original itinerary (${trip.days.length} days).
6. When adding a new place, calculate reasonable startTime and endTime based on other items in that day.
7. When removing a place, recalculate remaining items' time slots to avoid gaps.
8. When replacing a place, keep the same time slot if duration is similar, otherwise adjust.
9. Keep dates exactly as they are in the original itinerary.
10. DO NOT add any text, explanation, or markdown. Return ONLY the JSON array.`;

      const requestBody = {
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: `Modify my itinerary: ${prompt}` }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 8192
        }
      };

      // Primary model explicitly recommended by Google Gemini API (gemini-3.8-flash),
      // followed by verified, active fallback models tested with Gemini API v1beta
      const models = [
        'gemini-3.8-flash',
        'gemini-3.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-flash-lite-latest',
        'gemini-3.1-flash-lite'
      ];
      let aiResponse = null;
      let lastError = null;
      let usedModel = null;

      for (const model of models) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout per attempt

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
              signal: controller.signal
            }
          );

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            lastError = new Error(`Gemini API ${model} returned ${response.status}: ${errorText}`);
            console.warn(`[TripPlanner AI] Model ${model} returned status ${response.status}. Attempting fallback...`);
            continue;
          }

          const data = await response.json();

          // Extract text content from Gemini response
          const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!textContent) {
            lastError = new Error(`Gemini ${model} returned empty content`);
            console.warn(`[TripPlanner AI] Model ${model} returned empty content. Attempting fallback...`);
            continue;
          }

          // Parse the JSON response
          let parsedDays;
          try {
            parsedDays = JSON.parse(textContent);
          } catch (parseErr) {
            // Try to extract JSON array from the response if wrapped in markdown/text
            const jsonMatch = textContent.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              parsedDays = JSON.parse(jsonMatch[0]);
            } else {
              lastError = new Error(`Failed to parse AI response as JSON from ${model}: ${parseErr.message}`);
              console.warn(`[TripPlanner AI] Model ${model} returned non-JSON output. Attempting fallback...`);
              continue;
            }
          }

          // Ensure it's an array
          if (!Array.isArray(parsedDays)) {
            if (parsedDays && Array.isArray(parsedDays.days)) {
              parsedDays = parsedDays.days;
            } else {
              lastError = new Error(`AI response from ${model} is not a valid days array`);
              console.warn(`[TripPlanner AI] Model ${model} output was not a day array. Attempting fallback...`);
              continue;
            }
          }

          // Validate structure of each day
          const isValid = parsedDays.every(day =>
            typeof day.dayNumber === 'number' &&
            typeof day.title === 'string' &&
            Array.isArray(day.items) &&
            day.items.every(item =>
              typeof item.title === 'string' &&
              typeof item.category === 'string'
            )
          );

          if (!isValid) {
            lastError = new Error(`AI response from ${model} has invalid day/item structure`);
            console.warn(`[TripPlanner AI] Model ${model} output failed schema validation. Attempting fallback...`);
            continue;
          }

          // Ensure all items have required fields with defaults
          parsedDays.forEach(day => {
            if (!day.date) {
              const originalDay = trip.days.find(d => d.dayNumber === day.dayNumber);
              if (originalDay) day.date = originalDay.date;
            }
            day.items.forEach(item => {
              if (item.placeId === undefined) item.placeId = null;
              if (item.isCompleted === undefined) item.isCompleted = false;
              if (!item.location) item.location = 'Nashik';
              if (!item.startTime) item.startTime = '9:00 AM';
              if (!item.endTime) item.endTime = '10:00 AM';
              if (!item.durationMinutes) item.durationMinutes = 60;
              if (!item.travelMinutes) item.travelMinutes = 15;
              if (!item.notes) item.notes = '';
            });
          });

          aiResponse = parsedDays;
          usedModel = model;
          console.log(`[TripPlanner AI] Itinerary successfully modified using model: ${model}`);
          break; // Primary or fallback succeeded

        } catch (fetchErr) {
          if (fetchErr.name === 'AbortError') {
            lastError = new Error(`Gemini ${model} request timed out`);
          } else {
            lastError = fetchErr;
          }
          console.warn(`[TripPlanner AI] Model ${model} error:`, lastError.message, `Attempting fallback...`);
          continue;
        }
      }

      if (!aiResponse) {
        console.error('All Gemini models failed:', lastError?.message);
        return res.status(500).json({
          message: 'Could not process your modification request. Please try rephrasing your instruction or try again later.',
          error: lastError?.message
        });
      }

      // Apply the AI-generated modifications
      trip.days = aiResponse;
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

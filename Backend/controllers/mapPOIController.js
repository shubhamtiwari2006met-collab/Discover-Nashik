const MapPOI = require('../models/MapPOI');

// Initial seed list of Nashik points of interest
// NOTE: All image URLs use stable sources (Wikimedia Commons, Unsplash, upload.wikimedia.org, etc.)
// that do NOT expire or get blocked by referrer/CORS policies.
const DEFAULT_NASHIK_POIS = [
  // Spiritual & Religious
  {
    name: "Kalaram Temple",
    category: "Religious",
    latitude: 20.0055,
    longitude: 73.7946,
    location: "Panchavati, Nashik",
    description: "Historic black stone temple dedicated to Lord Rama, constructed in 1782 by Sardar Rangarao Odhekar.",
    famousThing: "Black Stone Architecture, Ramayana Heritage",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Kalaram_Temple%2C_Nashik.jpg/800px-Kalaram_Temple%2C_Nashik.jpg"
  },
  {
    name: "Muktidham Temple",
    category: "Spiritual",
    latitude: 19.9515,
    longitude: 73.8344,
    location: "Nashik Road, Nashik",
    description: "Marble temple complex featuring replicas of all 12 Jyotirlingas and chapters of Bhagavad Gita carved on walls.",
    famousThing: "12 Jyotirlinga Replicas, Pure White Marble",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Muktidham_Temple_Nashik.jpg/800px-Muktidham_Temple_Nashik.jpg"
  },
  {
    name: "Ramkund Ghat",
    category: "Spiritual",
    latitude: 20.0076,
    longitude: 73.7925,
    location: "Panchavati, Nashik",
    description: "Sacred bathing ghat on river Godavari where Lord Rama took baths during exile. Core site of Kumbh Mela.",
    famousThing: "Kumbh Mela Holy Dip, Sacred Asthi Visarjan",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Ramkund_Nashik_India.jpg/800px-Ramkund_Nashik_India.jpg"
  },
  {
    name: "Someshwar Temple & Waterfalls",
    category: "Spiritual",
    latitude: 20.0264,
    longitude: 73.7381,
    location: "Gangapur Road, Nashik",
    description: "Ancient Lord Shiva temple set beside scenic Dudhsagar waterfalls along the Godavari River.",
    famousThing: "Scenic Waterfalls, Boating & Shiva Temple",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Someshwar_waterfall_Nashik.jpg/800px-Someshwar_waterfall_Nashik.jpg"
  },
  {
    name: "Sundarnarayan Temple",
    category: "Religious",
    latitude: 20.0048,
    longitude: 73.7920,
    location: "Panchavati, Nashik",
    description: "Beautiful 1756 Lord Vishnu temple designed so rays of setting sun fall directly on deity on March 21.",
    famousThing: "Equinox Sun Rays Alignment, Peshwa Architecture",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Sundarnarayan_Temple_Nashik.jpg/800px-Sundarnarayan_Temple_Nashik.jpg"
  },
  {
    name: "Tapovan Ashram",
    category: "Spiritual",
    latitude: 20.0035,
    longitude: 73.8055,
    location: "Panchavati, Nashik",
    description: "Serene penance grove where Lakshmana cut off Surpanakha's nose. Confluence of Kapila & Godavari.",
    famousThing: "Ramayana History, Confluence of Rivers",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Tapovan_Nashik.jpg/800px-Tapovan_Nashik.jpg"
  },
  {
    name: "Kapaleshwar Temple",
    category: "Religious",
    latitude: 20.0072,
    longitude: 73.7928,
    location: "Panchavati, Nashik",
    description: "Unique Lord Shiva temple near Ramkund where there is NO Nandi idol in front of Shiva.",
    famousThing: "Shiva Temple without Nandi Bull",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Kapaleshwar_Temple_Nashik.jpg/800px-Kapaleshwar_Temple_Nashik.jpg"
  },
  {
    name: "Sita Gufa",
    category: "Spiritual",
    latitude: 20.0062,
    longitude: 73.7950,
    location: "Panchavati, Nashik",
    description: "Narrow ancient cave where Goddess Sita stayed and was abducted by Ravana.",
    famousThing: "Goddess Sita Cave, Ancient Banyan Trees",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Sita_Gufa_Panchavati_Nashik.jpg/800px-Sita_Gufa_Panchavati_Nashik.jpg"
  },
  {
    name: "Dharmachakra Prabhav Tirth Jain Mandir",
    category: "Spiritual",
    latitude: 19.9248,
    longitude: 73.7410,
    location: "Vilholi, Nashik",
    description: "Grand Jain pilgrimage complex featuring heavy gold-plated idols and pink stone carvings.",
    famousThing: "24 Tirthankara Sculptures, Architectural Marvel",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Jain_temple_Nashik.jpg/800px-Jain_temple_Nashik.jpg"
  },

  // Historic & Tourist Spots
  {
    name: "Pandavleni Caves",
    category: "Historic",
    latitude: 19.9442,
    longitude: 73.7663,
    location: "Pathardi Phata, Nashik",
    description: "Group of 24 rock-cut Buddhist caves dating back to the 1st century BCE to 3rd century CE.",
    famousThing: "2000-Year Rock-Cut Caves, Panoramic Nashik View",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Pandavleni_Caves_Nashik.jpg/800px-Pandavleni_Caves_Nashik.jpg"
  },
  {
    name: "Gargoti Mineral Museum",
    category: "Historic",
    latitude: 19.8660,
    longitude: 73.9215,
    location: "Sinnar, Nashik",
    description: "India's only mineral museum exhibiting rare natural zeolites, gems, crystals, and rocks.",
    famousThing: "World-Class Zeolite & Gemstone Collection",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Gargoti_Museum_Nashik.jpg/800px-Gargoti_Museum_Nashik.jpg"
  },
  {
    name: "Coin Museum (INSAF)",
    category: "Historic",
    latitude: 19.9820,
    longitude: 73.5680,
    location: "Trimbak Road, Nashik",
    description: "Indian Institute of Research in Numismatic Studies documenting Indian currency history through millennia.",
    famousThing: "Ancient Indian Coins & Currency History",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Indian_Coin_Museum.jpg/800px-Indian_Coin_Museum.jpg"
  },
  {
    name: "Artillery Centre Museum",
    category: "Tourist Spot",
    latitude: 19.9650,
    longitude: 73.8150,
    location: "Nashik Road Military Station, Nashik",
    description: "Asia's largest artillery military museum displaying historic cannons, military tanks, and battle weapons.",
    famousThing: "Military Tanks, War Artillery & Historic Guns",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Artillery_Museum_Nashik.jpg/800px-Artillery_Museum_Nashik.jpg"
  },

  // Treks & Mountains
  {
    name: "Anjaneri Hill Fort & Hanuman Birthplace",
    category: "Trek",
    latitude: 19.9192,
    longitude: 73.5708,
    location: "Anjaneri, Nashik",
    description: "Sacred mountain fort considered the birthplace of Lord Hanuman. Popular scenic trekking trail.",
    famousThing: "Birthplace of Lord Hanuman, Footprint Rock",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Anjaneri_hill_Nashik.jpg/800px-Anjaneri_hill_Nashik.jpg"
  },
  {
    name: "Brahmagiri Mountain & Godavari Source",
    category: "Mountains",
    latitude: 19.9310,
    longitude: 73.5180,
    location: "Trimbakeshwar, Nashik",
    description: "Majestic mountain ridge overlooking Trimbak town. Steps lead to Godavari river origin (Gangadwar).",
    famousThing: "Godavari River Origin Point, Cloud Trail",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Brahmagiri_Trimbakeshwar.jpg/800px-Brahmagiri_Trimbakeshwar.jpg"
  },
  {
    name: "Harihar Fort Trek",
    category: "Trek",
    latitude: 19.9015,
    longitude: 73.4712,
    location: "Nirgudpada, Nashik",
    description: "World-famous iconic fort featuring 80-degree near-vertical rock-cut rock staircase steps.",
    famousThing: "Vertical Rock Stairs, Iconic Thrill Trek",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Harihar_Fort_Nashik.jpg/800px-Harihar_Fort_Nashik.jpg"
  },
  {
    name: "Ramshej Fort Trek",
    category: "Trek",
    latitude: 20.1085,
    longitude: 73.7842,
    location: "Peth Road, Nashik",
    description: "Historic fort where Maratha army successfully defended against Mughal siege for over 5 years.",
    famousThing: "Maratha Defense History, Quick Weekend Trek",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Ramshej_Fort.jpg/800px-Ramshej_Fort.jpg"
  },
  {
    name: "Salher Fort Peak",
    category: "Mountains",
    latitude: 20.7215,
    longitude: 73.9405,
    location: "Satana, Nashik District",
    description: "The highest fort peak in Maharashtra at 1,567 meters altitude with ancient rock tanks.",
    famousThing: "Highest Fort Peak in Maharashtra (1567m)",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Salher_Fort_Maharashtra.jpg/800px-Salher_Fort_Maharashtra.jpg"
  },

  // Famous Hotels & Stays
  {
    name: "Taj Gateway Hotel Ambad",
    category: "Hotels",
    latitude: 19.9480,
    longitude: 73.7460,
    location: "Ambad MIDC, Nashik",
    description: "5-star luxury hotel surrounded by 11 acres of manicured gardens and premium suites.",
    phone: "+91 253 669 2333",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Express Inn Hotel",
    category: "Hotels",
    latitude: 19.9472,
    longitude: 73.7620,
    location: "Pathardi Phata, Mumbai-Agra Highway, Nashik",
    description: "Luxury 5-star business hotel featuring rooftop poolside lounge Freasia & multi-cuisine dining.",
    phone: "+91 253 664 1111",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Radisson Blu Hotel & Spa",
    category: "Hotels",
    latitude: 19.9530,
    longitude: 73.7550,
    location: "Pathardi Phata, Nashik",
    description: "Urban resort offering panoramic mountain views, international spa, and luxury dining.",
    phone: "+91 253 260 0000",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Courtyard by Marriott Nashik",
    category: "Hotels",
    latitude: 19.9880,
    longitude: 73.7740,
    location: "Mumbai Naka, Nashik",
    description: "Modern upscale city hotel featuring luxury amenities and convenient access to highway.",
    phone: "+91 253 230 9999",
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=800&auto=format&fit=crop"
  },

  // Famous Restaurants & Food
  {
    name: "Sadhana Chulivarchi Misal",
    category: "Restaurants",
    latitude: 20.0385,
    longitude: 73.7310,
    location: "Hardev Nagar, Bardan Phata, Nashik",
    description: "Iconic traditional wood-fired chulivarchi misal served with fresh jalebis & gulab jamuns in rural setting.",
    famousThing: "Clay-pot Woodfire Spicy Misal Pav",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Hotel Divtya Budhlya",
    category: "Restaurants",
    latitude: 20.0090,
    longitude: 73.7710,
    location: "Gangapur Road, Nashik",
    description: "Famous authentic Khandeshi & Maharashtrian non-veg thali restaurant.",
    famousThing: "Mutton Kala Masala Thali",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Hotel Panchratna Misal",
    category: "Restaurants",
    latitude: 20.0068,
    longitude: 73.7915,
    location: "Panchavati, Nashik",
    description: "Legendary traditional breakfast spot serving spicy Nashik Misal right in Panchavati.",
    famousThing: "Classic Panchavati Spicy Misal",
    image: "https://images.unsplash.com/photo-1567337710282-00832b415979?q=80&w=800&auto=format&fit=crop"
  },

  // Hospitals & Emergency
  {
    name: "Apollo Hospitals Nashik",
    category: "Hospitals",
    latitude: 19.9720,
    longitude: 73.7750,
    location: "Swaminarayan Nagar, Mumbai Naka, Nashik",
    description: "24/7 Multi-speciality tertiary care super-specialty hospital with advanced trauma unit.",
    phone: "1066 / +91 253 230 3333",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Wockhardt Hospital",
    category: "Hospitals",
    latitude: 19.9890,
    longitude: 73.7780,
    location: "Mumbai Naka, Nashik",
    description: "Multi-specialty super-specialty healthcare centre with round-the-clock emergency response.",
    phone: "+91 253 662 4444",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Sahyadri Super Speciality Hospital",
    category: "Hospitals",
    latitude: 19.9980,
    longitude: 73.7680,
    location: "Bhavik Complex, Mumbai Naka, Nashik",
    description: "Leading multi-specialty cardiac, neuro, and critical care medical hospital.",
    phone: "+91 253 664 0000",
    image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Civil Hospital Nashik",
    category: "Emergency",
    latitude: 20.0010,
    longitude: 73.7850,
    location: "Trimbak Road, Nashik",
    description: "Primary government district general hospital with 24x7 emergency medical service.",
    phone: "+91 253 257 2038",
    image: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?q=80&w=800&auto=format&fit=crop"
  },

  // Public Toilets & Facilities
  {
    name: "Public Toilet - Ramkund Ghat",
    category: "Public Toilets",
    latitude: 20.0078,
    longitude: 73.7928,
    location: "Ramkund Bathing Ghat, Panchavati",
    description: "Clean public restroom facility maintained by NMC for pilgrims visiting Ramkund.",
    famousThing: "Pilgrim Restroom Facility"
  },
  {
    name: "Public Toilet - CBS Central Bus Stand",
    category: "Public Toilets",
    latitude: 19.9985,
    longitude: 73.7820,
    location: "CBS Bus Stand, Old Agra Road",
    description: "Public sanitation complex at Nashik central bus station.",
    famousThing: "24x7 Bus Station Restroom"
  },
  {
    name: "Public Toilet - Shalimar Circle",
    category: "Public Toilets",
    latitude: 19.9995,
    longitude: 73.7870,
    location: "Shalimar Chowk, Nashik",
    description: "Public sanitation facility located near Shalimar market intersection.",
    famousThing: "Market Area Public Restroom"
  },
  {
    name: "Public Toilet - Nashik Road Railway Station",
    category: "Public Toilets",
    latitude: 19.9485,
    longitude: 73.8360,
    location: "Nashik Road Station Platform 1 Exit",
    description: "24/7 Pay & Use clean public toilet complex for train passengers.",
    famousThing: "Railway Station Pay & Use Toilet"
  },
  {
    name: "Public Toilet - Trimbak Bus Station",
    category: "Public Toilets",
    latitude: 19.9340,
    longitude: 73.5320,
    location: "Trimbakeshwar Bus Stand",
    description: "Pilgrim public toilet facility near Trimbakeshwar temple entrance.",
    famousThing: "Trimbak Temple Visitor Facility"
  }
];

const defaultImageMap = {};
DEFAULT_NASHIK_POIS.forEach(p => {
  if (p.name && p.image) {
    defaultImageMap[p.name.trim().toLowerCase()] = p.image;
  }
});

// Get all Map POIs
exports.getMapPOIs = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const pois = await MapPOI.find(query).sort({ createdAt: -1 });

    // If database is empty, seed and return DEFAULT_NASHIK_POIS
    if (pois.length === 0 && !category && !search) {
      MapPOI.insertMany(DEFAULT_NASHIK_POIS).catch((err) => console.warn('Auto seed warning:', err.message));
      return res.json(DEFAULT_NASHIK_POIS);
    }

    // Enrich any database records that are missing image URLs from default seed map
    // Also FIX broken Bing/Yahoo URLs stored in DB by replacing them with stable ones
    const brokenUrlPatterns = [
      'tse1.mm.bing.net', 'tse2.mm.bing.net', 'tse3.mm.bing.net', 'tse4.mm.bing.net',
      'mm.bing.net', 'in.images.search.yahoo.com', 'yahoo.com/search'
    ];

    const enrichedPois = pois.map((poi) => {
      const obj = poi.toObject ? poi.toObject() : { ...poi };
      const nameKey = (obj.name || '').trim().toLowerCase();

      // Check if the existing image URL is broken (Bing/Yahoo) or missing
      const hasImage = obj.image && obj.image.trim() !== '';
      const isBrokenUrl = hasImage && brokenUrlPatterns.some(pattern => obj.image.includes(pattern));

      if ((!hasImage || isBrokenUrl) && defaultImageMap[nameKey]) {
        obj.image = defaultImageMap[nameKey];
        // Update the DB record with the stable URL
        MapPOI.findByIdAndUpdate(obj._id, { image: defaultImageMap[nameKey] }).exec().catch(() => { });
      }

      return obj;
    });

    res.json(enrichedPois);
  } catch (error) {
    console.error('Error fetching map POIs:', error);
    res.status(500).json({ error: 'Failed to fetch map POIs' });
  }
};

// Get single Map POI by ID
exports.getMapPOIById = async (req, res) => {
  try {
    const poi = await MapPOI.findById(req.params.id);
    if (!poi) {
      return res.status(404).json({ error: 'Map POI not found' });
    }
    res.json(poi);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching map POI' });
  }
};

// Create new Map POI (Admin)
exports.createMapPOI = async (req, res) => {
  try {
    const { name, category, latitude, longitude, location, description, image, phone, famousThing } = req.body;

    if (!name || !category || latitude == null || longitude == null || !location) {
      return res.status(400).json({ error: 'Name, Category, Latitude, Longitude and Location are required' });
    }

    const newPOI = new MapPOI({
      name,
      category,
      latitude: Number(latitude),
      longitude: Number(longitude),
      location,
      description: description || '',
      image: image || '',
      phone: phone || '',
      famousThing: famousThing || '',
      mapOnly: true
    });

    await newPOI.save();
    res.status(201).json(newPOI);
  } catch (error) {
    console.error('Error creating map POI:', error);
    res.status(500).json({ error: 'Failed to create map POI' });
  }
};

// Update Map POI (Admin)
exports.updateMapPOI = async (req, res) => {
  try {
    const { name, category, latitude, longitude, location, description, image, phone, famousThing } = req.body;

    const updatedPOI = await MapPOI.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        latitude: latitude != null ? Number(latitude) : undefined,
        longitude: longitude != null ? Number(longitude) : undefined,
        location,
        description,
        image,
        phone,
        famousThing
      },
      { new: true, runValidators: true }
    );

    if (!updatedPOI) {
      return res.status(404).json({ error: 'Map POI not found' });
    }

    res.json(updatedPOI);
  } catch (error) {
    console.error('Error updating map POI:', error);
    res.status(500).json({ error: 'Failed to update map POI' });
  }
};

// Delete Map POI (Admin)
exports.deleteMapPOI = async (req, res) => {
  try {
    const deletedPOI = await MapPOI.findByIdAndDelete(req.params.id);
    if (!deletedPOI) {
      return res.status(404).json({ error: 'Map POI not found' });
    }
    res.json({ success: true, message: 'Map POI deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Error deleting map POI:', error);
    res.status(500).json({ error: 'Failed to delete map POI' });
  }
};

// Seed default Nashik POIs (Admin)
exports.seedMapPOIs = async (req, res) => {
  try {
    // Upsert or clear and re-insert default POIs
    await MapPOI.deleteMany({});
    const inserted = await MapPOI.insertMany(DEFAULT_NASHIK_POIS);
    res.json({ success: true, count: inserted.length, message: `Successfully seeded ${inserted.length} Nashik Map POIs.` });
  } catch (error) {
    console.error('Error seeding map POIs:', error);
    res.status(500).json({ error: 'Failed to seed map POIs' });
  }
};

exports.DEFAULT_NASHIK_POIS = DEFAULT_NASHIK_POIS;

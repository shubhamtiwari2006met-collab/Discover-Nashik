const Place = require('../models/Place');
const Business = require('../models/Business');

async function purgeSamplePlacesFromDb() {
  try {
    // Delete all place documents to ensure no sample data remains
    await Place.deleteMany({});
  } catch (err) {
    console.error('Error purging places:', err);
  }
}

// @desc    Get all places (including approved businesses)
// @route   GET /api/places
exports.getPlaces = async (req, res) => {
  try {
    await purgeSamplePlacesFromDb();
    let query = {};
    if (req.query.category) {
      query.category = new RegExp(req.query.category, 'i');
    }
    if (req.query.search) {
      query.name = new RegExp(req.query.search, 'i');
    }

    const places = await Place.find(query);

    let approvedBusinesses = [];
    try {
      let businessQuery = { verificationStatus: 'approved' };
      if (req.query.category) {
        businessQuery.businessType = new RegExp(req.query.category, 'i');
      }
      if (req.query.search) {
        businessQuery.$or = [
          { businessName: new RegExp(req.query.search, 'i') },
          { description: new RegExp(req.query.search, 'i') },
          { address: new RegExp(req.query.search, 'i') },
        ];
      }
      approvedBusinesses = await Business.find(businessQuery);
    } catch (bErr) {
      console.error("MongoDB Business query notice:", bErr.message);
    }

    const formattedBusinesses = approvedBusinesses.map(b => ({
      _id: b._id.toString(),
      name: b.businessName,
      category: b.businessType,
      location: b.address,
      description: b.description || `${b.businessName} located in ${b.address}`,
      image: (b.photos && b.photos.length > 0) ? b.photos[0] : "https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80",
      images: b.photos || [],
      rating: 4.8,
      phone: b.phone,
      email: b.email,
      business_id: b._id
    }));

    res.status(200).json([...formattedBusinesses, ...places]);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get single place by ID
// @route   GET /api/places/:id
exports.getPlaceById = async (req, res) => {
  try {
    let place = await Place.findById(req.params.id).catch(() => null);
    if (!place && Business) {
      try {
        const business = await Business.findOne({ _id: req.params.id, verificationStatus: 'approved' });
        if (business) {
          place = {
            _id: business._id.toString(),
            name: business.businessName,
            category: business.businessType,
            location: business.address,
            description: business.description || `${business.businessName} located in ${business.address}`,
            image: (business.photos && business.photos.length > 0) ? business.photos[0] : "https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80",
            images: business.photos || [],
            rating: 4.8,
            phone: business.phone,
            email: business.email,
          };
        }
      } catch (bErr) {
        // Ignore invalid ObjectId
      }
    }
    if (!place) {
      return res.status(404).json({ message: 'Place not found' });
    }
    res.status(200).json(place);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create a new place
// @route   POST /api/places
exports.createPlace = async (req, res) => {
  try {
    const place = await Place.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(place);
  } catch (error) {
    res.status(400).json({ message: 'Bad Request', error: error.message });
  }
};

exports.updatePlace = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ message: 'Place not found' });
    if (req.user.role !== 'admin' && String(place.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only edit places you created' });
    }

    Object.assign(place, req.body, { createdBy: place.createdBy || req.user._id });
    await place.save();
    res.status(200).json(place);
  } catch (error) {
    res.status(400).json({ message: 'Bad Request', error: error.message });
  }
};

exports.deletePlace = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ message: 'Place not found' });
    if (req.user.role !== 'admin' && String(place.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete places you created' });
    }

    await place.deleteOne();
    res.status(200).json({ success: true, deletedId: req.params.id });
  } catch (error) {
    res.status(400).json({ message: 'Bad Request', error: error.message });
  }
};

// @desc    Seed mock data (for development/testing)
// @route   POST /api/places/seed
exports.seedPlaces = async (req, res) => {
  try {
    const mockPlaces = [
      {
        name: "Trimbakeshwar Shiva Temple",
        category: "Temples",
        location: "Trimbak, Nashik",
        description: "An ancient Hindu temple in the town of Trimbak, dedicated to Lord Shiva and one of the twelve Jyotirlingas.",
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1596700508005-4f05ab04c997?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Sula Vineyards",
        category: "Vineyards",
        location: "Gangapur-Savargaon Road, Nashik",
        description: "India's most famous vineyard offering wine tasting, tours, and a beautiful resort experience.",
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1502758151829-47000d6fdb0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Dugarwadi Waterfall",
        category: "Waterfalls",
        location: "Trimbakeshwar Road, Nashik",
        description: "A pristine and scenic waterfall surrounded by lush green mountains, perfect for a day trip.",
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1432405972618-fc0279a0f072?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Sadhana Restaurant (Chulivarchi Misal)",
        category: "Food",
        location: "Gangapur Road, Nashik",
        description: "Famous for its authentic Nashik Misal Pav cooked on a traditional wood-fired stove.",
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      }
    ];

    // Clear existing to avoid duplicates when testing
    await Place.deleteMany({});
    const places = await Place.insertMany(mockPlaces);
    res.status(201).json({ message: "Mock data seeded successfully", count: places.length });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

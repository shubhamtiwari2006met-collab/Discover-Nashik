const Place = require('../models/Place');
const Business = require('../models/Business');

function escapeRegex(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function getPermittedPlaceFields(body) {
  if (!body || typeof body !== 'object') return {};
  const allowed = [
    'name',
    'category',
    'location',
    'description',
    'image',
    'images',
    'rating',
    'phone',
    'email',
    'openingHours',
    'entryFee',
    'latitude',
    'longitude',
    'website'
  ];
  const clean = {};
  for (const field of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      clean[field] = body[field];
    }
  }
  return clean;
}

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
    // purgeSamplePlacesFromDb removed – no DB write on each request
    let query = {};
    if (typeof req.query.category === 'string' && req.query.category.trim()) {
      query.category = new RegExp(escapeRegex(req.query.category.trim()), 'i');
    }
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      query.name = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    }

    const places = await Place.find(query);

    let approvedBusinesses = [];
    try {
      let businessQuery = { verificationStatus: 'approved' };
      if (typeof req.query.category === 'string' && req.query.category.trim()) {
        businessQuery.businessType = new RegExp(escapeRegex(req.query.category.trim()), 'i');
      }
      if (typeof req.query.search === 'string' && req.query.search.trim()) {
        const searchPattern = new RegExp(escapeRegex(req.query.search.trim()), 'i');
        businessQuery.$or = [
          { businessName: searchPattern },
          { description: searchPattern },
          { address: searchPattern },
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
    res.status(500).json({ message: 'Unable to fetch places' });
  }
};

// @desc    Get single place by ID
// @route   GET /api/places/:id
exports.getPlaceById = async (req, res) => {
  try {
    const id = String(req.params.id || '');
    let place = await Place.findById(id).catch(() => null);
    if (!place && Business) {
      try {
        const business = await Business.findOne({ _id: id, verificationStatus: 'approved' });
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
    res.status(500).json({ message: 'Error retrieving place details' });
  }
};

// @desc    Create a new place (Explicit field allowlisting prevents Mass Assignment)
// @route   POST /api/places
exports.createPlace = async (req, res) => {
  try {
    const permittedFields = getPermittedPlaceFields(req.body);
    if (!permittedFields.name) {
      return res.status(400).json({ message: 'Place name is required' });
    }
    const place = await Place.create({
      ...permittedFields,
      createdBy: req.user._id
    });
    res.status(201).json(place);
  } catch (error) {
    res.status(400).json({ message: 'Invalid place data submitted' });
  }
};

// @desc    Update an existing place
// @route   PUT /api/places/:id
exports.updatePlace = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ message: 'Place not found' });
    
    // Authorization & Ownership Check
    const isOwner = String(place.createdBy) === String(req.user._id);
    const isAdmin = req.user.role === 'admin' || req.user.isPrimaryAdmin;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You can only edit places you created' });
    }

    const permittedFields = getPermittedPlaceFields(req.body);
    Object.assign(place, permittedFields, { createdBy: place.createdBy || req.user._id });
    await place.save();
    res.status(200).json(place);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update place' });
  }
};

// @desc    Delete a place
// @route   DELETE /api/places/:id
exports.deletePlace = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ message: 'Place not found' });
    
    const isOwner = String(place.createdBy) === String(req.user._id);
    const isAdmin = req.user.role === 'admin' || req.user.isPrimaryAdmin;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You can only delete places you created' });
    }

    await place.deleteOne();
    res.status(200).json({ success: true, deletedId: req.params.id });
  } catch (error) {
    res.status(400).json({ message: 'Failed to delete place' });
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
    res.status(500).json({ message: 'Server error while seeding data' });
  }
};


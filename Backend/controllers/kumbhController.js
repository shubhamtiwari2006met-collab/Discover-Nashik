const KumbhLocation = require('../models/KumbhLocation');
const KumbhTransport = require('../models/KumbhTransport');
const KumbhEvent = require('../models/KumbhEvent');
const Place = require('../models/Place');

// Initial seed data helpers if collections are empty
async function seedDefaultDataIfEmpty() {
  try {
    // Run independent collection counts concurrently
    const [locCount, transCount, eventCount] = await Promise.all([
      KumbhLocation.countDocuments(),
      KumbhTransport.countDocuments(),
      KumbhEvent.countDocuments()
    ]);

    if (locCount === 0) {
      // Run independent Place lookups concurrently
      const [ramKundPlace, trimbakPlace] = await Promise.all([
        Place.findOne({ name: { $regex: /Ram Kund/i } }).lean(),
        Place.findOne({ name: { $regex: /Trimbak/i } }).lean()
      ]);

      await KumbhLocation.insertMany([
        {
          name: 'Ram Kund Ghat',
          placeId: ramKundPlace ? ramKundPlace._id : null,
          category: 'Ghat',
          description: 'Holy bathing ghat located on the banks of Godavari river in Panchavati.',
          address: 'Panchavati, Nashik, Maharashtra 422003',
          latitude: 20.0063,
          longitude: 73.7915,
          image: ramKundPlace?.image || 'https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80',
          kumbhImportance: 'Primary site for the holy bath (Shahi Snan) during Kumbh Mela in Nashik.',
          instructions: 'Follow color-coded pedestrian pathways. Heavy crowd expected during Shahi Snan days.',
          nearbyFacilities: 'Medical camp (100m), Drinking water stations, Emergency helpline booth, Lost & Found counter.',
          isPublished: true
        },
        {
          name: 'Panchavati Temple Complex',
          category: 'Temple',
          description: 'Sacred grove area with historic temples including Sita Gufa and Kala Ram Temple.',
          address: 'Panchavati, Nashik, Maharashtra 422003',
          latitude: 20.0080,
          longitude: 73.7930,
          image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
          kumbhImportance: 'Key spiritual hub for pilgrims visiting during Kumbh Mela.',
          instructions: 'Shoe stands available near main entrance. Footwear strictly prohibited inside temple inner sanctum.',
          nearbyFacilities: 'Information desk, Sanitation facilities, Public seating, Security post.',
          isPublished: true
        },
        {
          name: 'Trimbakeshwar Temple & Kushavarta Kund',
          placeId: trimbakPlace ? trimbakPlace._id : null,
          category: 'Temple',
          description: 'Ancient Jyotirlinga temple at the source of Godavari river in Trimbak.',
          address: 'Trimbak, Maharashtra 422212',
          latitude: 19.9318,
          longitude: 73.5307,
          image: trimbakPlace?.image || 'https://images.unsplash.com/photo-1609949279531-cf48d64bed89?auto=format&fit=crop&w=800&q=80',
          kumbhImportance: 'One of the main venues for Kumbh rituals for Shaiva Akharas.',
          instructions: 'Special shuttle buses operate from Nashik city to Trimbakeshwar during event days.',
          nearbyFacilities: 'Bus stand, First aid center, Parking plaza at Outer Ring Road.',
          isPublished: true
        },
        {
          name: 'Outer Tapovan Parking & Holding Area',
          category: 'Parking',
          description: 'Massive vehicle holding area and parking ground for private buses and cars.',
          address: 'Tapovan, Nashik, Maharashtra 422011',
          latitude: 20.0020,
          longitude: 73.8150,
          image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
          kumbhImportance: 'Primary parking hub to restrict heavy traffic from entering inner city ghat zones.',
          instructions: 'Park your private vehicle here and switch to free electric shuttle buses to reach Ram Kund.',
          nearbyFacilities: 'Electric shuttle terminal, Mobile toilets, Food courts, Help desk.',
          isPublished: true
        }
      ]);
      console.log('Seeded default Kumbh locations');
    } else {
      console.log('Kumbh locations already exist — skipping seed');
    }

    if (transCount === 0) {
      await KumbhTransport.insertMany([
        {
          title: 'Special MSRTC Kumbh Shuttle Services',
          category: 'Shuttle',
          description: 'Frequent shuttle buses operating between Outer Parking Grounds and City Center Holding hubs.',
          routeOrDetails: 'Route 1: Tapovan Parking -> Nimani Bus Stand -> Panchavati Circle. Running every 5 minutes.',
          locationOrStation: 'Tapovan Parking Terminal / CBS Main Station',
          advisories: 'Passes or shuttle tickets can be bought at auto-kiosks. Senior citizens priority boarding provided.',
          image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
          isPublished: true
        },
        {
          title: 'Nashik Road Railway Station Special Trains',
          category: 'Railway',
          description: 'Indian Railways operates special Kumbh Mela express trains connecting Nashik Road to major cities.',
          routeOrDetails: 'Direct trains from Mumbai, Pune, Nagpur, Varanasi, and Delhi.',
          locationOrStation: 'Nashik Road Railway Station (NK)',
          advisories: 'Extra ticket booking counters and 24/7 help desks installed at Platform 1 entrance.',
          image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80',
          isPublished: true
        },
        {
          title: 'Pedestrian Green Zones & Walking Routes',
          category: 'Walking Route',
          description: 'Dedicated vehicle-free walking corridors leading to Ram Kund and Godavari Ghats.',
          routeOrDetails: '3 km dedicated walking track with shaded shelters, drinking water, and mist fans.',
          locationOrStation: 'Panchavati Riverfront Promenade',
          advisories: 'Motorized two-wheelers strictly prohibited between 6:00 AM and 10:00 PM on bathing days.',
          image: 'https://images.unsplash.com/photo-1476514525535-ce74f45814d0?auto=format&fit=crop&w=800&q=80',
          isPublished: true
        }
      ]);
      console.log('Seeded default Kumbh transport');
    } else {
      console.log('Kumbh transport already exists — skipping seed');
    }

    if (eventCount === 0) {
      await KumbhEvent.insertMany([
        {
          title: 'Flag Hoisting (Dhwajarohan) - Kumbh Mela Commencement',
          date: new Date('2027-07-14'),
          startTime: '06:00 AM',
          endTime: '12:00 PM',
          description: 'Official ceremonial flag hoisting at Ram Kund and Trimbakeshwar marking the start of Kumbh Mela 2027.',
          location: 'Ram Kund, Panchavati & Trimbakeshwar',
          instructions: 'Public entry permitted in designated viewing arenas only.',
          status: 'upcoming',
          image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=80',
          isPublished: true
        },
        {
          title: 'First Shahi Snan (First Royal Bathing Day)',
          date: new Date('2027-08-02'),
          startTime: '03:00 AM',
          endTime: '06:00 PM',
          description: 'The auspicious first royal bath led by Mahants and Sadhus of various Akharas.',
          location: 'Ram Kund & Kushavarta Kund',
          instructions: 'Akharas procession path reserved. General public bathing allowed post 12:00 PM.',
          status: 'upcoming',
          image: 'https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80',
          isPublished: true
        },
        {
          title: 'Second Shahi Snan (Main Royal Holy Bath - Shravan Purnima)',
          date: new Date('2027-08-17'),
          startTime: '02:00 AM',
          endTime: '08:00 PM',
          description: 'The grandest royal holy bath day attracting millions of devotees across the world.',
          location: 'Godavari Riverfront Ghats',
          instructions: 'Heavy crowd movement expected. Follow designated circular entry and exit routes.',
          status: 'upcoming',
          image: 'https://images.unsplash.com/photo-1609949279531-cf48d64bed89?auto=format&fit=crop&w=800&q=80',
          isPublished: true
        },
        {
          title: 'Third Shahi Snan (Bhadrapada Amavasya Snan)',
          date: new Date('2027-08-31'),
          startTime: '04:00 AM',
          endTime: '05:00 PM',
          description: 'Third major royal holy dip day for spiritual seekers and pilgrims.',
          location: 'Ram Kund Ghats',
          instructions: 'Emergency medical teams stationed every 200m along the river promenade.',
          status: 'upcoming',
          image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
          isPublished: true
        }
      ]);
      console.log('Seeded default Kumbh events');
    } else {
      console.log('Kumbh events already exist — skipping seed');
    }
  } catch (err) {
    console.warn('Error during Kumbh default data seeding:', err.message);
  }
}

// -------------------------------------------------------------
// LOCATIONS CONTROLLERS
// -------------------------------------------------------------
const getKumbhLocations = async (req, res) => {
  try {
    const query = req.query.admin === 'true' ? {} : { isPublished: { $ne: false } };
    const locations = await KumbhLocation.find(query)
      .populate('placeId', 'name category location description image latitude longitude rating')
      .sort({ createdAt: -1 })
      .lean();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching Kumbh locations' });
  }
};

const createKumbhLocation = async (req, res) => {
  try {
    const {
      name,
      placeId,
      category,
      description,
      address,
      latitude,
      longitude,
      image,
      kumbhImportance,
      instructions,
      nearbyFacilities,
      isPublished
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Location name is required' });
    }

    let linkedPlace = null;
    if (placeId) {
      linkedPlace = await Place.findById(placeId);
    }

    const newLocation = new KumbhLocation({
      name,
      placeId: placeId || null,
      category: category || (linkedPlace ? linkedPlace.category : 'Ghat'),
      description: description || (linkedPlace ? linkedPlace.description : ''),
      address: address || (linkedPlace ? linkedPlace.location : ''),
      latitude: latitude !== undefined && latitude !== null && latitude !== '' ? Number(latitude) : (linkedPlace ? linkedPlace.latitude : null),
      longitude: longitude !== undefined && longitude !== null && longitude !== '' ? Number(longitude) : (linkedPlace ? linkedPlace.longitude : null),
      image: image || (linkedPlace ? linkedPlace.image : ''),
      kumbhImportance: kumbhImportance || '',
      instructions: instructions || '',
      nearbyFacilities: nearbyFacilities || '',
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true
    });

    const saved = await newLocation.save();
    const populated = await KumbhLocation.findById(saved._id).populate('placeId');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error creating Kumbh location' });
  }
};

const updateKumbhLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.placeId === '') {
      updateData.placeId = null;
    }
    if (updateData.latitude !== undefined && updateData.latitude !== null && updateData.latitude !== '') {
      updateData.latitude = Number(updateData.latitude);
    }
    if (updateData.longitude !== undefined && updateData.longitude !== null && updateData.longitude !== '') {
      updateData.longitude = Number(updateData.longitude);
    }

    const updated = await KumbhLocation.findByIdAndUpdate(id, updateData, { new: true }).populate('placeId');
    if (!updated) {
      return res.status(404).json({ message: 'Kumbh location not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error updating Kumbh location' });
  }
};

const deleteKumbhLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await KumbhLocation.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Kumbh location not found' });
    }
    res.json({ message: 'Kumbh location deleted successfully', id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error deleting Kumbh location' });
  }
};

// -------------------------------------------------------------
// TRANSPORT CONTROLLERS
// -------------------------------------------------------------
const getKumbhTransports = async (req, res) => {
  try {
    const query = req.query.admin === 'true' ? {} : { isPublished: { $ne: false } };
    const transports = await KumbhTransport.find(query).sort({ createdAt: -1 });
    res.json(transports);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching transport info' });
  }
};

const createKumbhTransport = async (req, res) => {
  try {
    const { title, category, description, routeOrDetails, locationOrStation, advisories, image, isPublished } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const newTransport = new KumbhTransport({
      title,
      category: category || 'Bus',
      description,
      routeOrDetails: routeOrDetails || '',
      locationOrStation: locationOrStation || '',
      advisories: advisories || '',
      image: image || '',
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true
    });

    const saved = await newTransport.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error creating transport info' });
  }
};

const updateKumbhTransport = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await KumbhTransport.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Transport entry not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error updating transport entry' });
  }
};

const deleteKumbhTransport = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await KumbhTransport.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Transport entry not found' });
    }
    res.json({ message: 'Transport entry deleted successfully', id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error deleting transport entry' });
  }
};

// -------------------------------------------------------------
// EVENTS CONTROLLERS
// -------------------------------------------------------------
const getKumbhEvents = async (req, res) => {
  try {
    const query = req.query.admin === 'true' ? {} : { isPublished: { $ne: false } };
    const events = await KumbhEvent.find(query).sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching Kumbh events' });
  }
};

const createKumbhEvent = async (req, res) => {
  try {
    const { title, date, startTime, endTime, description, location, instructions, status, image, isPublished } = req.body;
    if (!title || !date) {
      return res.status(400).json({ message: 'Event title and date are required' });
    }

    const newEvent = new KumbhEvent({
      title,
      date: new Date(date),
      startTime: startTime || '',
      endTime: endTime || '',
      description: description || '',
      location: location || '',
      instructions: instructions || '',
      status: status || 'upcoming',
      image: image || '',
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true
    });

    const saved = await newEvent.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error creating Kumbh event' });
  }
};

const updateKumbhEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateBody = { ...req.body };
    if (updateBody.date) {
      updateBody.date = new Date(updateBody.date);
    }
    const updated = await KumbhEvent.findByIdAndUpdate(id, updateBody, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Kumbh event not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error updating Kumbh event' });
  }
};

const deleteKumbhEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await KumbhEvent.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Kumbh event not found' });
    }
    res.json({ message: 'Kumbh event deleted successfully', id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error deleting Kumbh event' });
  }
};

module.exports = {
  getKumbhLocations,
  createKumbhLocation,
  updateKumbhLocation,
  deleteKumbhLocation,

  getKumbhTransports,
  createKumbhTransport,
  updateKumbhTransport,
  deleteKumbhTransport,

  getKumbhEvents,
  createKumbhEvent,
  updateKumbhEvent,
  deleteKumbhEvent,

  // Export seed function for one‑time startup execution
  seedDefaultDataIfEmpty
};

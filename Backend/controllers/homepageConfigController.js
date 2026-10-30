const HomepageConfig = require('../models/HomepageConfig');

const CONFIG_KEY = 'homepage_places';

/**
 * GET /api/admin/homepage-config
 * Returns the saved homepage configuration (places array with placeId, visible, order).
 */
exports.getHomepageConfig = async (req, res) => {
  try {
    const config = await HomepageConfig.findOne({ configKey: CONFIG_KEY }).lean();

    res.json({
      success: true,
      places: config && Array.isArray(config.places) ? config.places : [],
      updatedAt: config ? config.updatedAt : null,
      updatedBy: config ? config.updatedBy : null
    });
  } catch (error) {
    console.error('Error fetching homepage config:', error);
    res.status(500).json({ message: 'Failed to load homepage configuration' });
  }
};

/**
 * PUT /api/admin/homepage-config
 * Save the homepage configuration (place ordering and visibility).
 * Expects body: { places: [{ placeId: string, visible: boolean, order: number }] }
 */
exports.saveHomepageConfig = async (req, res) => {
  try {
    const { places } = req.body;

    if (!Array.isArray(places)) {
      return res.status(400).json({ message: 'Invalid request: places must be an array' });
    }

    // Filter out invalid/duplicate entries
    const seen = new Set();
    const cleanedPlaces = [];
    for (const entry of places) {
      const id = String(entry.placeId || entry.id || '').trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      cleanedPlaces.push({
        placeId: id,
        visible: entry.visible !== false,
        order: typeof entry.order === 'number' ? entry.order : cleanedPlaces.length
      });
    }

    // Upsert the singleton config
    const config = await HomepageConfig.findOneAndUpdate(
      { configKey: CONFIG_KEY },
      {
        $set: {
          places: cleanedPlaces,
          updatedBy: req.user ? (req.user.email || req.user.username || 'admin') : 'admin'
        }
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Homepage configuration saved successfully',
      updatedAt: config.updatedAt,
      savedCount: cleanedPlaces.length
    });
  } catch (error) {
    console.error('Error saving homepage config:', error);
    res.status(500).json({ message: 'Failed to save homepage configuration' });
  }
};

/**
 * GET /api/places/homepage (PUBLIC — no auth required)
 * Returns an ordered list of place IDs that should appear on the homepage.
 */
exports.getPublicHomepagePlaces = async (req, res) => {
  try {
    const config = await HomepageConfig.findOne({ configKey: CONFIG_KEY }).lean();

    if (!config || !config.places || config.places.length === 0) {
      return res.json({ configured: false, placeIds: [] });
    }

    const visibleEntries = config.places
      .filter(p => p.visible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    res.json({
      configured: true,
      placeIds: visibleEntries.map(p => String(p.placeId))
    });
  } catch (error) {
    console.error('Error fetching public homepage places:', error);
    res.json({ configured: false, placeIds: [] });
  }
};

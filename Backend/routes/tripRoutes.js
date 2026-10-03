const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const userAuthController = require('../controllers/userAuthController');
const jwt = require('jsonwebtoken');
const AppUser = require('../models/AppUser');

const JWT_SECRET = process.env.JWT_SECRET || 'discover_nashik_jwt_secret_key_2026';
const COOKIE_NAME = 'app_user_token';

// Middleware: Authenticate AppUser strictly for personalized trip operations
async function requireAppUserAuth(req, res, next) {
  try {
    let token = req.cookies && req.cookies[COOKIE_NAME];
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7);
    }

    if (!token) {
      return res.status(401).json({ message: 'Create or sign in to your Discover Nashik account to create and save your personalized Kumbh journey.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Authentication session expired. Please sign in again.' });
    }

    if (!decoded || decoded.type !== 'app_user' || !decoded.userId) {
      return res.status(401).json({ message: 'Authentication session invalid. Please sign in again.' });
    }

    const user = await AppUser.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(403).json({ message: 'Account disabled or not found.' });
    }

    req.authUser = user;
    next();
  } catch (err) {
    console.error('requireAppUserAuth error:', err);
    return res.status(500).json({ message: 'Authentication error' });
  }
}

// Protected Trip Endpoints
router.post('/generate', requireAppUserAuth, tripController.generateTrip);
router.get('/', requireAppUserAuth, tripController.getUserTrips);
router.get('/:id', requireAppUserAuth, tripController.getTripById);
router.put('/:id', requireAppUserAuth, tripController.updateTrip);
router.delete('/:id', requireAppUserAuth, tripController.deleteTrip);
router.post('/:id/modify-ai', requireAppUserAuth, tripController.modifyTripWithAi);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticate, requireRoles } = require('../middleware/auth');
const { 
  getPlaces, 
  getPlaceById, 
  createPlace, 
  updatePlace,
  deletePlace,
  seedPlaces 
} = require('../controllers/placeController');

// Routes for /api/places
router.route('/')
  .get(getPlaces)
  .post(authenticate, requireRoles('admin', 'business'), createPlace);

router.route('/seed')
  .post(authenticate, requireRoles('admin'), seedPlaces);

router.route('/:id')
  .get(getPlaceById)
  .put(authenticate, requireRoles('admin', 'business'), updatePlace)
  .delete(authenticate, requireRoles('admin', 'business'), deletePlace);

module.exports = router;

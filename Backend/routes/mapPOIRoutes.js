const express = require('express');
const router = express.Router();
const { authenticate, requireRoles } = require('../middleware/auth');
const { 
  getMapPOIs, 
  getMapPOIById, 
  createMapPOI, 
  updateMapPOI, 
  deleteMapPOI, 
  seedMapPOIs 
} = require('../controllers/mapPOIController');

// Routes for /api/map-pois
router.route('/')
  .get(getMapPOIs)
  .post(authenticate, requireRoles('admin'), createMapPOI);

router.route('/seed')
  .post(authenticate, requireRoles('admin'), seedMapPOIs);

router.route('/:id')
  .get(getMapPOIById)
  .put(authenticate, requireRoles('admin'), updateMapPOI)
  .delete(authenticate, requireRoles('admin'), deleteMapPOI);

module.exports = router;

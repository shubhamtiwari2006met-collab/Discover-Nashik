const express = require('express');
const router = express.Router();
const { authenticate, requireRoles } = require('../middleware/auth');
const {
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
  deleteKumbhEvent
} = require('../controllers/kumbhController');

// -------------------------------------------------------------
// Locations Routes
// -------------------------------------------------------------
router.route('/locations')
  .get(getKumbhLocations)
  .post(authenticate, requireRoles('admin'), createKumbhLocation);

router.route('/locations/:id')
  .put(authenticate, requireRoles('admin'), updateKumbhLocation)
  .delete(authenticate, requireRoles('admin'), deleteKumbhLocation);

// -------------------------------------------------------------
// Transport Routes
// -------------------------------------------------------------
router.route('/transport')
  .get(getKumbhTransports)
  .post(authenticate, requireRoles('admin'), createKumbhTransport);

router.route('/transport/:id')
  .put(authenticate, requireRoles('admin'), updateKumbhTransport)
  .delete(authenticate, requireRoles('admin'), deleteKumbhTransport);

// -------------------------------------------------------------
// Events / Dates Routes
// -------------------------------------------------------------
router.route('/events')
  .get(getKumbhEvents)
  .post(authenticate, requireRoles('admin'), createKumbhEvent);

router.route('/events/:id')
  .put(authenticate, requireRoles('admin'), updateKumbhEvent)
  .delete(authenticate, requireRoles('admin'), deleteKumbhEvent);

module.exports = router;

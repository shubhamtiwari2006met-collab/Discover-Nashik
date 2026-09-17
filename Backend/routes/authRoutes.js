const express = require('express');
const {
  getCurrentUser,
  registerBusiness,
  listBusinesses,
  reviewBusiness
} = require('../controllers/authController');
const { authenticate, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/me', authenticate, getCurrentUser);
router.post('/business/register', authenticate, registerBusiness);
router.get('/admin/businesses', authenticate, requireRoles('admin'), listBusinesses);
router.patch('/admin/businesses/:id', authenticate, requireRoles('admin'), reviewBusiness);

module.exports = router;
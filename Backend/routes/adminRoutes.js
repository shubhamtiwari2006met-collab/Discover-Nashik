const express = require('express');
const router = express.Router();
const { authenticate, requireRoles, requirePrimaryAdmin } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');
const { getAdmins, createAdmin, revokeAdmin } = require('../controllers/adminController');
const {
  getUsers,
  getUserStats,
  getUserDetail,
  deleteUser,
  blockUser,
  unblockUser,
  getBlockedIdentifiers
} = require('../controllers/userManagementController');

// Admin Authorization Verification & Management Routes
router.get('/verify', authenticate, requireRoles('admin'), (req, res) => {
  res.json({
    status: 'ok',
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      adminStatus: req.user.adminStatus,
      isPrimaryAdmin: req.user.isPrimaryAdmin,
    },
  });
});

router.get('/admins', authenticate, requireRoles('admin'), getAdmins);
router.post('/admins', authenticate, requirePrimaryAdmin, createAdmin);
router.delete('/admins/:id', authenticate, requirePrimaryAdmin, revokeAdmin);

// User Management Routes
router.get('/users', authenticate, requireRoles('admin'), getUsers);
router.get('/users/stats', authenticate, requireRoles('admin'), getUserStats);
router.get('/users/blocked', authenticate, requireRoles('admin'), getBlockedIdentifiers);
router.get('/users/:id', authenticate, requireRoles('admin'), getUserDetail);
router.delete('/users/:id', authenticate, requireRoles('admin'), deleteUser);
router.post('/users/:id/block', authenticate, requireRoles('admin'), blockUser);
router.post('/users/:id/unblock', authenticate, requireRoles('admin'), unblockUser);

// Centralized MongoDB notification control; the existing Supabase-backed page is preserved.
router.get('/notifications/overview', authenticate, requireRoles('admin'), notificationController.adminOverview);
router.get('/notifications', authenticate, requireRoles('admin'), notificationController.adminHistory);
router.get('/notifications/settings', authenticate, requireRoles('admin'), notificationController.getAdminSettings);
router.patch('/notifications/settings', authenticate, requireRoles('admin'), notificationController.updateAdminSettings);
router.post('/notifications', authenticate, requireRoles('admin'), notificationController.createAdminNotification);
router.patch('/notifications/:id/cancel', authenticate, requireRoles('admin'), notificationController.cancelScheduled);

module.exports = router;

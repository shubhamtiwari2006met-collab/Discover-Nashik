const express = require('express');
const router = express.Router();
const { authenticate, requireRoles, requirePrimaryAdmin } = require('../middleware/auth');
const { getAdmins, createAdmin, revokeAdmin } = require('../controllers/adminController');

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

module.exports = router;

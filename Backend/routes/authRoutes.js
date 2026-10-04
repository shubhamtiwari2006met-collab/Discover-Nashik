const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  getCurrentUser,
  registerBusiness,
  listBusinesses,
  reviewBusiness
} = require('../controllers/authController');
const userAuthController = require('../controllers/userAuthController');
const { authenticate, requireRoles } = require('../middleware/auth');

const router = express.Router();

// Dedicated rate limiter for normal user authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again in 15 minutes.' }
});

// Normal user authentication endpoints
router.post('/register', authLimiter, userAuthController.register);
router.post('/login', authLimiter, userAuthController.login);
router.post('/logout', userAuthController.logout);
router.post('/send-otp', authLimiter, userAuthController.sendOtp);
router.post('/verify-otp', authLimiter, userAuthController.verifyOtp);
router.post('/forgot-password', authLimiter, userAuthController.forgotPassword);
router.post('/reset-password', authLimiter, userAuthController.resetPassword);

// Unified GET /api/auth/me supporting both normal AppUsers and Supabase Admin/Business users
router.get('/me', async (req, res, next) => {
  const isAppUserCookie = req.cookies && req.cookies.app_user_token;
  if (isAppUserCookie) {
    return userAuthController.getMe(req, res);
  }

  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'discover_nashik_jwt_secret_key_2026';
      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.type === 'app_user') {
        return userAuthController.getMe(req, res);
      }
    } catch (e) {
      // Token is not an app_user JWT; fallback to Supabase admin/business check below
    }

    return authenticate(req, res, () => getCurrentUser(req, res));
  }

  return userAuthController.getMe(req, res);
});

// Preserved Admin & Business authentication endpoints (Supabase based)
const { adminLogin } = require('../controllers/adminController');
router.post('/admin/login', authLimiter, adminLogin);
router.post('/business/register', authenticate, registerBusiness);
router.get('/admin/businesses', authenticate, requireRoles('admin'), listBusinesses);
router.patch('/admin/businesses/:id', authenticate, requireRoles('admin'), reviewBusiness);

module.exports = router;
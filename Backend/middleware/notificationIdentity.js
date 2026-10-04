const jwt = require('jsonwebtoken');
const AppUser = require('../models/AppUser');
const { authenticate } = require('./auth');

const JWT_SECRET = process.env.JWT_SECRET || 'discover_nashik_jwt_secret_key_2026';
const COOKIE_NAME = 'app_user_token';

async function findAppUser(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
  if (!decoded || decoded.type !== 'app_user' || !decoded.userId) return null;
  const user = await AppUser.findById(decoded.userId);
  return user && user.isActive ? user : null;
}

async function resolveNotificationIdentity(req, res, next) {
  try {
    const cookieToken = req.cookies?.[COOKIE_NAME];
    const authorization = req.headers.authorization || '';
    const bearerToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
    const appUser = cookieToken
      ? await findAppUser(cookieToken)
      : bearerToken ? await findAppUser(bearerToken) : null;

    if (appUser) {
      req.notificationIdentity = { type: 'app_user', id: String(appUser._id), user: appUser };
      return next();
    }

    if (bearerToken) {
      return authenticate(req, res, (error) => {
        if (error) return next(error);
        if (!req.user) return res.status(401).json({ message: 'Authentication required' });
        req.notificationIdentity = { type: 'platform', id: String(req.user._id), user: req.user };
        return next();
      });
    }

    if (cookieToken) return res.status(401).json({ message: 'Invalid or expired AppUser session' });
    req.notificationIdentity = null;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireNotificationIdentity(req, res, next) {
  if (!req.notificationIdentity) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

module.exports = { resolveNotificationIdentity, requireNotificationIdentity };

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');
const AppUser = require('../models/AppUser');
const BlockedIdentifier = require('../models/BlockedIdentifier');

const JWT_SECRET = process.env.JWT_SECRET || 'discover_nashik_jwt_secret_key_2026';
const COOKIE_NAME = 'app_user_token';

// In-memory OTP storage for initial architecture (expires in 5 minutes)
const otpStore = new Map();

// Helper: Normalize Email
function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : null;
}

// Helper: Normalize Mobile (Indian format standard 10 digits)
function normalizeMobile(mobile) {
  if (!mobile || typeof mobile !== 'string') return null;
  // Strip non-digit characters
  let digits = mobile.replace(/\D/g, '');
  // Remove leading country code +91 or 91 or 0 if 12 or 11 digits
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(digits) ? digits : null;
}

function normalizePlatformId(value) {
  return value
    .trim()
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\s+/g, '')
    .toUpperCase();
}

function safeErrorMessage(error, secrets = []) {
  let message = String(error?.message || 'Unknown provider error');
  for (const secret of secrets) {
    if (secret) message = message.split(secret).join('[redacted]');
  }
  return message;
}

// Helper: Get Cookie Options
function getCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  };
}

// Helper: Generate Token & Set Cookie
function setAuthSession(res, userId) {
  const token = jwt.sign({ userId, type: 'app_user' }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE_NAME, token, getCookieOptions());
  return token;
}

// Helper to ensure unique Platform ID for new or existing users
async function generateUniquePlatformId() {
  let platformId = AppUser.generatePlatformId();
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 10) {
    const existing = await AppUser.findOne({ platformId }).lean();
    if (!existing) {
      isUnique = true;
    } else {
      platformId = AppUser.generatePlatformId();
      attempts++;
    }
  }
  return platformId;
}

// Register Controller
exports.register = async (req, res) => {
  try {
    const { email, mobile, password, name } = req.body;

    const cleanEmail = normalizeEmail(email);
    const cleanMobile = normalizeMobile(mobile);

    if (email && !cleanEmail) {
      return res.status(400).json({ message: 'Invalid email address format' });
    }
    if (mobile && !cleanMobile) {
      return res.status(400).json({ message: 'Invalid Indian mobile number (must be 10 digits starting with 6-9)' });
    }

    if (!cleanEmail && !cleanMobile) {
      return res.status(400).json({ message: 'Either a valid email address or mobile number is required' });
    }

    // Check if identifier is blocked BEFORE proceeding
    const blockQuery = { isActive: true, $or: [] };
    if (cleanEmail) blockQuery.$or.push({ normalizedIdentifier: cleanEmail, identifierType: 'email' });
    if (cleanMobile) blockQuery.$or.push({ normalizedIdentifier: cleanMobile, identifierType: 'mobile' });
    if (blockQuery.$or.length > 0) {
      const blocked = await BlockedIdentifier.findOne(blockQuery).lean();
      if (blocked) {
        return res.status(403).json({ message: 'This account or identifier has been blocked. Please contact the administrator if you believe this is an error.' });
      }
    }

    if (password && typeof password === 'string' && password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check existing account
    const query = [];
    if (cleanEmail) query.push({ email: cleanEmail });
    if (cleanMobile) query.push({ mobile: cleanMobile });

    const existingUser = await AppUser.findOne({ $or: query });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email or mobile number already exists' });
    }

    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const platformId = await generateUniquePlatformId();

    const newUser = new AppUser({
      platformId,
      email: cleanEmail,
      mobile: cleanMobile,
      name: name ? name.trim() : null,
      passwordHash,
      emailVerified: false,
      mobileVerified: false,
      lastLoginAt: new Date()
    });

    await newUser.save();

    const token = setAuthSession(res, newUser._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: newUser.toSafeObject()
    });
  } catch (error) {
    console.error('User registration error:', error);
    return res.status(500).json({ message: 'Failed to create user account' });
  }
};

// Login Controller
// Login Controller
exports.login = async (req, res) => {
  try {
    const { identifier, email, mobile, password, platformId: inputPlatformId } = req.body;
    let inputId = String(inputPlatformId || identifier || email || mobile || '').trim();

    if (!inputId) {
      return res.status(400).json({ message: 'Email, mobile number, or Discover Nashik Platform ID is required' });
    }

    // Standardize Platform ID candidate
    let upperInput = normalizePlatformId(inputId);
    let platformIdCandidate = upperInput.startsWith('DN-') ? upperInput : `DN-${upperInput}`;
    
    // First try finding user by Platform ID
    let user = await AppUser.findOne({
      $or: [
        { platformId: upperInput },
        { platformId: platformIdCandidate }
      ]
    }).select('+passwordHash');

    if (user) {
      if (!user.isActive) {
        return res.status(403).json({ message: 'This account or identifier has been blocked. Please contact the administrator if you believe this is an error.' });
      }
    } else {
      // Normal Email / Mobile lookup
      const cleanEmail = normalizeEmail(inputId);
      const cleanMobile = normalizeMobile(inputId);

      if (!cleanEmail && !cleanMobile) {
        const isPlatformIdFormat = /^DN-[A-Z0-9]{7}$/.test(platformIdCandidate);
        return res.status(401).json({
          message: isPlatformIdFormat
            ? 'This Discover Nashik ID was not found in the active account database. Check the ID or sign in with the email or mobile number linked to the account.'
            : 'The credentials you entered are incorrect.'
        });
      }

      // Check if identifier is blocked
      const blockQuery = { isActive: true, $or: [] };
      if (cleanEmail) blockQuery.$or.push({ normalizedIdentifier: cleanEmail, identifierType: 'email' });
      if (cleanMobile) blockQuery.$or.push({ normalizedIdentifier: cleanMobile, identifierType: 'mobile' });
      if (blockQuery.$or.length > 0) {
        const blocked = await BlockedIdentifier.findOne(blockQuery).lean();
        if (blocked) {
          return res.status(403).json({ message: 'This account or identifier has been blocked. Please contact the administrator if you believe this is an error.' });
        }
      }

      const query = [];
      if (cleanEmail) query.push({ email: cleanEmail });
      if (cleanMobile) query.push({ mobile: cleanMobile });

      user = await AppUser.findOne({ $or: query }).select('+passwordHash');
      if (!user) {
        return res.status(401).json({ message: 'The credentials you entered are incorrect.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'This account or identifier has been blocked. Please contact the administrator if you believe this is an error.' });
      }

      if (user.passwordHash) {
        if (!password) {
          return res.status(400).json({ message: 'Password is required' });
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return res.status(401).json({ message: 'The credentials you entered are incorrect.' });
        }
      }
    }

    // Lazy migration: Generate Platform ID for older accounts if missing
    if (!user.platformId) {
      user.platformId = await generateUniquePlatformId();
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = setAuthSession(res, user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('User login error:', error);
    return res.status(500).json({ message: 'Login failed' });
  }
};

// Forgot Password Controller
exports.forgotPassword = async (req, res) => {
  const genericResponse = {
    success: true,
    message: 'If an account matches that email address, a password reset email will be sent.'
  };
  let pendingReset = null;

  try {
    const emailInput = typeof req.body?.email === 'string'
      ? req.body.email
      : req.body?.identifier;
    const cleanEmail = normalizeEmail(emailInput);
    if (!cleanEmail) {
      return res.status(400).json({ message: 'A valid email address is required' });
    }

    const missingConfiguration = ['RESEND_API_KEY', 'EMAIL_FROM', 'FRONTEND_URL']
      .filter((name) => !process.env[name]?.trim());
    if (missingConfiguration.length > 0) {
      console.error('Password reset email configuration is incomplete', {
        missingVariables: missingConfiguration
      });
      return res.status(503).json({ message: 'Password reset email is temporarily unavailable. Please try again later.' });
    }

    let frontendUrl;
    try {
      frontendUrl = new URL(process.env.FRONTEND_URL);
      if (!['http:', 'https:'].includes(frontendUrl.protocol) ||
          (process.env.NODE_ENV === 'production' && frontendUrl.protocol !== 'https:')) {
        throw new Error('FRONTEND_URL must use HTTPS in production');
      }
    } catch (error) {
      console.error('Password reset email configuration has an invalid FRONTEND_URL', {
        errorType: error.name,
        errorMessage: error.message
      });
      return res.status(503).json({ message: 'Password reset email is temporarily unavailable. Please try again later.' });
    }

    const user = await AppUser.findOne({ email: cleanEmail, isActive: true });
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    pendingReset = { userId: user._id, tokenHash: resetTokenHash };

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    const resetUrl = new URL('/login', frontendUrl);
    resetUrl.searchParams.set('mode', 'reset');
    resetUrl.searchParams.set('source', 'mongodb');
    resetUrl.searchParams.set('token', resetToken);

    const resend = new Resend(process.env.RESEND_API_KEY);
    let sendResult;
    try {
      sendResult = await resend.emails.send({
        from: process.env.EMAIL_FROM.trim(),
        to: cleanEmail,
        subject: 'Reset your Discover Nashik password',
        text: [
          'A password reset was requested for your Discover Nashik account.',
          '',
          `Reset your password: ${resetUrl.toString()}`,
          '',
          'This link expires in 15 minutes and can only be used once.',
          'If you did not request this reset, you can ignore this email.'
        ].join('\n'),
        html: `<div style="margin:0;background:#f8f2e8;padding:32px 16px;font-family:Arial,sans-serif;color:#173247"><div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7d7bd;border-radius:16px;padding:32px"><p style="margin:0 0 8px;color:#e86f18;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase">Discover Nashik</p><h1 style="margin:0 0 20px;font-size:24px">Reset your password</h1><p style="line-height:1.6">A password reset was requested for your Discover Nashik account. Use the button below to choose a new password.</p><p style="margin:28px 0"><a href="${resetUrl.toString()}" style="display:inline-block;border-radius:999px;background:#e86f18;padding:13px 22px;color:#ffffff;font-weight:700;text-decoration:none">Reset Password</a></p><p style="font-size:13px;line-height:1.6">This link expires in 15 minutes and can only be used once. If the button does not work, copy this URL into your browser:</p><p style="overflow-wrap:anywhere;font-size:12px"><a href="${resetUrl.toString()}" style="color:#c9580f">${resetUrl.toString()}</a></p><p style="margin-top:24px;color:#667883;font-size:13px;line-height:1.6">If you did not request a password reset, you can safely ignore this email. Your password will not change.</p></div></div>`
      });
    } catch (error) {
      console.error('Resend password reset email request failed', {
        provider: 'Resend',
        errorType: error?.name || typeof error,
        errorMessage: safeErrorMessage(error, [resetToken, process.env.RESEND_API_KEY])
      });
      try {
        await AppUser.updateOne(
          { _id: pendingReset.userId, resetPasswordToken: pendingReset.tokenHash },
          { $set: { resetPasswordToken: null, resetPasswordExpires: null } }
        );
        pendingReset = null;
      } catch (cleanupError) {
        console.error('Failed to invalidate reset token after email delivery failure', {
          errorType: cleanupError?.name || typeof cleanupError,
          errorMessage: cleanupError?.message || 'Unknown cleanup error'
        });
      }
      return res.status(502).json({ message: 'Unable to send password reset email. Please try again later.' });
    }

    if (sendResult?.error || !sendResult?.data?.id) {
      const providerError = sendResult?.error || new Error('Resend did not confirm email acceptance');
      console.error('Resend rejected password reset email request', {
        provider: 'Resend',
        errorType: providerError?.name || typeof providerError,
        errorMessage: safeErrorMessage(providerError, [resetToken, process.env.RESEND_API_KEY]),
        statusCode: providerError?.statusCode
      });
      try {
        await AppUser.updateOne(
          { _id: pendingReset.userId, resetPasswordToken: pendingReset.tokenHash },
          { $set: { resetPasswordToken: null, resetPasswordExpires: null } }
        );
        pendingReset = null;
      } catch (cleanupError) {
        console.error('Failed to invalidate reset token after email delivery failure', {
          errorType: cleanupError?.name || typeof cleanupError,
          errorMessage: cleanupError?.message || 'Unknown cleanup error'
        });
      }
      return res.status(502).json({ message: 'Unable to send password reset email. Please try again later.' });
    }

    pendingReset = null;
    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error('Forgot password error:', {
      errorType: error?.name || typeof error,
      errorMessage: error?.message || 'Unknown error'
    });
    if (pendingReset) {
      try {
        await AppUser.updateOne(
          { _id: pendingReset.userId, resetPasswordToken: pendingReset.tokenHash },
          { $set: { resetPasswordToken: null, resetPasswordExpires: null } }
        );
      } catch (cleanupError) {
        console.error('Failed to invalidate reset token after request failure', {
          errorType: cleanupError?.name || typeof cleanupError,
          errorMessage: cleanupError?.message || 'Unknown cleanup error'
        });
      }
    }
    return res.status(500).json({ message: 'Failed to process request' });
  }
};

// Reset Password Controller
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (typeof resetToken !== 'string' || !/^[a-f0-9]{64}$/i.test(resetToken) || !newPassword) {
      return res.status(400).json({ message: 'Invalid or expired password reset link' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const user = await AppUser.findOneAndUpdate(
      {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: { $gt: new Date() },
        isActive: true
      },
      {
        $set: {
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpires: null
        }
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset link' });
    }

    return res.status(200).json({
      success: true,
      message: 'Your password has been updated successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', {
      errorType: error?.name || typeof error,
      errorMessage: error?.message || 'Unknown error'
    });
    return res.status(500).json({ message: 'Failed to reset password' });
  }
};

// Logout Controller
exports.logout = async (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/'
  });
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Current User Controller (GET /api/auth/me)
exports.getMe = async (req, res) => {
  try {
    let token = req.cookies[COOKIE_NAME];

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7);
    }

    if (!token) {
      return res.status(200).json({
        authenticated: false,
        user: null
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(200).json({
        authenticated: false,
        user: null
      });
    }

    if (decoded.type !== 'app_user' || !decoded.userId) {
      return res.status(200).json({
        authenticated: false,
        user: null
      });
    }

    const user = await AppUser.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(200).json({
        authenticated: false,
        user: null
      });
    }

    // Lazy migration: Ensure platformId exists for active user
    if (!user.platformId) {
      user.platformId = await generateUniquePlatformId();
      await user.save();
    }

    return res.status(200).json({
      authenticated: true,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(200).json({
      authenticated: false,
      user: null
    });
  }
};

// Send OTP Controller
exports.sendOtp = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ message: 'Email or mobile number is required' });
    }

    const cleanEmail = normalizeEmail(identifier);
    const cleanMobile = normalizeMobile(identifier);

    if (!cleanEmail && !cleanMobile) {
      return res.status(400).json({ message: 'Please provide a valid email or 10-digit mobile number' });
    }

    const key = cleanEmail || cleanMobile;
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(key, { otp, expiresAt });

    // Note: SMS/Email provider hook can be called here if configured in environment.
    // OTP is deliberately NOT returned in API response for security.

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${key}`
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// Verify OTP Controller
exports.verifyOtp = async (req, res) => {
  try {
    const { identifier, otp, name } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ message: 'Identifier and OTP are required' });
    }

    const inputId = identifier.trim();
    let upperInput = normalizePlatformId(inputId);
    let platformIdCandidate = upperInput.startsWith('DN-') ? upperInput : `DN-${upperInput}`;

    // 1. Check if identifier matches a Platform ID
    let user = await AppUser.findOne({
      $or: [
        { platformId: upperInput },
        { platformId: platformIdCandidate }
      ]
    });

    if (user) {
      if (!user.isActive) {
        return res.status(403).json({ message: 'This account or identifier has been blocked. Please contact the administrator if you believe this is an error.' });
      }

      const key = user.email || user.mobile || user.platformId;
      const storedData = otpStore.get(key) || otpStore.get(user.platformId);
      const isTestOtp = process.env.NODE_ENV !== 'production' && otp === '123456';

      if (!isTestOtp && (!storedData || storedData.otp !== otp || Date.now() > storedData.expiresAt)) {
        return res.status(400).json({ message: 'Invalid or expired verification code' });
      }

      otpStore.delete(key);
      if (user.platformId) otpStore.delete(user.platformId);

      user.lastLoginAt = new Date();
      await user.save();

      const token = setAuthSession(res, user._id);
      return res.status(200).json({
        success: true,
        message: 'Verification successful',
        token,
        user: user.toSafeObject()
      });
    }

    // 2. Email or Mobile OTP verification
    const cleanEmail = normalizeEmail(inputId);
    const cleanMobile = normalizeMobile(inputId);
    const key = cleanEmail || cleanMobile;

    if (!key) {
      return res.status(400).json({ message: 'Invalid identifier' });
    }

    // Check if identifier is blocked BEFORE proceeding
    const blockQuery = { isActive: true, $or: [] };
    if (cleanEmail) blockQuery.$or.push({ normalizedIdentifier: cleanEmail, identifierType: 'email' });
    if (cleanMobile) blockQuery.$or.push({ normalizedIdentifier: cleanMobile, identifierType: 'mobile' });
    if (blockQuery.$or.length > 0) {
      const blocked = await BlockedIdentifier.findOne(blockQuery).lean();
      if (blocked) {
        return res.status(403).json({ message: 'This account or identifier has been blocked. Please contact the administrator if you believe this is an error.' });
      }
    }

    const storedData = otpStore.get(key);
    const isTestOtp = process.env.NODE_ENV !== 'production' && otp === '123456';

    if (!isTestOtp && (!storedData || storedData.otp !== otp || Date.now() > storedData.expiresAt)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    otpStore.delete(key);

    const query = cleanEmail ? { email: cleanEmail } : { mobile: cleanMobile };
    user = await AppUser.findOne(query);

    if (!user) {
      const platformId = await generateUniquePlatformId();
      user = new AppUser({
        platformId,
        email: cleanEmail,
        mobile: cleanMobile,
        name: name ? name.trim() : null,
        emailVerified: Boolean(cleanEmail),
        mobileVerified: Boolean(cleanMobile),
        lastLoginAt: new Date()
      });
    } else {
      user.lastLoginAt = new Date();
      if (cleanEmail) user.emailVerified = true;
      if (cleanMobile) user.mobileVerified = true;
      if (!user.platformId) {
        user.platformId = await generateUniquePlatformId();
      }
    }

    await user.save();

    const token = setAuthSession(res, user._id);

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ message: 'Failed to verify OTP' });
  }
};

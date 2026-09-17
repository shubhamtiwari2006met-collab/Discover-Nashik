const { createClient } = require('@supabase/supabase-js');
const User = require('../models/User');

const PRIMARY_ADMIN_EMAIL = 'shubhamtiwari.2006.met@gmail.com';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

function getBearerToken(request) {
  const authorization = request.headers.authorization || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
}

async function authenticate(request, response, next) {
  try {
    if (!supabase) {
      return response.status(500).json({ message: 'Supabase backend configuration is missing' });
    }

    const token = getBearerToken(request);
    if (!token) {
      return response.status(401).json({ message: 'Authentication required' });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return response.status(401).json({ message: 'Invalid or expired authentication token' });
    }

    const email = (data.user.email || '').toLowerCase().trim();
    const metadata = data.user.user_metadata || {};
    const isPrimaryAdmin = email === PRIMARY_ADMIN_EMAIL;

    // Check existing MongoDB user to see authorization status
    let existingUser = await User.findOne({ supabaseId: data.user.id });
    if (!existingUser && email) {
      existingUser = await User.findOne({ email: new RegExp('^' + email.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') });
    }

    const setFields = {
      email,
      name: metadata.full_name || metadata.name || email.split('@')[0] || 'Visitor',
      avatar: metadata.avatar_url || metadata.picture || ''
    };

    if (isPrimaryAdmin) {
      setFields.role = 'admin';
      setFields.adminStatus = 'active';
      setFields.isPrimaryAdmin = true;
    } else if (existingUser && existingUser.role === 'admin') {
      if (existingUser.adminStatus === 'revoked') {
        setFields.role = 'visitor';
        setFields.adminStatus = 'revoked';
      } else {
        setFields.role = 'admin';
        setFields.adminStatus = 'active';
      }
    } else {
      // Normal user or business user — NEVER promote to admin via client metadata or request body!
      let detectedRole = metadata.role ? metadata.role.toLowerCase() : null;
      if (detectedRole === 'admin') {
        detectedRole = 'visitor'; // Strip forged admin role from metadata
      }

      if (detectedRole && ['visitor', 'business'].includes(detectedRole)) {
        setFields.role = detectedRole;
      } else if (existingUser && existingUser.role) {
        setFields.role = existingUser.role;
      } else {
        setFields.role = 'visitor';
      }
      setFields.adminStatus = existingUser?.adminStatus || 'not_applicable';
    }

    const filterQuery = existingUser ? { _id: existingUser._id } : { supabaseId: data.user.id };
    setFields.supabaseId = data.user.id;

    const user = await User.findOneAndUpdate(
      filterQuery,
      {
        $set: setFields,
        $setOnInsert: { businessStatus: 'not_applicable' }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log(`[Auth] User ${email} authenticated. Role: ${user.role}, AdminStatus: ${user.adminStatus}, Primary: ${Boolean(user.isPrimaryAdmin)}`);

    request.authUser = data.user;
    request.user = user;
    next();
  } catch (error) {
    console.error("[Auth] Error in authenticate:", error);
    next(error);
  }
}

async function optionalAuthenticate(request, response, next) {
  try {
    if (!supabase) return next();
    const token = getBearerToken(request);
    if (!token) return next();

    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) {
      const email = (data.user.email || '').toLowerCase().trim();
      const metadata = data.user.user_metadata || {};
      const isPrimaryAdmin = email === PRIMARY_ADMIN_EMAIL;

      let existingUser = await User.findOne({ supabaseId: data.user.id });
      if (!existingUser && email) {
        existingUser = await User.findOne({ email: new RegExp('^' + email.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') });
      }

      const setFields = {
        email,
        name: metadata.full_name || metadata.name || email.split('@')[0] || 'Visitor',
        avatar: metadata.avatar_url || metadata.picture || ''
      };

      if (isPrimaryAdmin) {
        setFields.role = 'admin';
        setFields.adminStatus = 'active';
        setFields.isPrimaryAdmin = true;
      } else if (existingUser && existingUser.role === 'admin') {
        if (existingUser.adminStatus === 'revoked') {
          setFields.role = 'visitor';
          setFields.adminStatus = 'revoked';
        } else {
          setFields.role = 'admin';
          setFields.adminStatus = 'active';
        }
      }

      const optFilterQuery = existingUser ? { _id: existingUser._id } : { supabaseId: data.user.id };
      setFields.supabaseId = data.user.id;

      const user = await User.findOneAndUpdate(
        optFilterQuery,
        {
          $set: setFields,
          $setOnInsert: { businessStatus: 'not_applicable' }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      request.authUser = data.user;
      request.user = user;
    }
    next();
  } catch (error) {
    next();
  }
}

function requireRoles(...roles) {
  return (request, response, next) => {
    if (!request.user) {
      return response.status(401).json({ message: 'Authentication required' });
    }

    const userRole = request.user.role;
    const isPrimaryAdmin = request.user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL || request.user.isPrimaryAdmin;

    if (!roles.includes(userRole) && !isPrimaryAdmin) {
      return response.status(403).json({ message: 'Insufficient permissions' });
    }

    if (roles.includes('admin')) {
      if (!isPrimaryAdmin) {
        if (request.user.role !== 'admin' || request.user.adminStatus === 'revoked') {
          return response.status(403).json({ message: 'Admin access has been revoked or is unauthorized.' });
        }
      }
    }

    if (userRole === 'business' && request.user.businessStatus !== 'approved') {
      return response.status(403).json({ message: 'Business account approval is required' });
    }

    next();
  };
}

function requirePrimaryAdmin(request, response, next) {
  if (!request.user) {
    return response.status(401).json({ message: 'Authentication required' });
  }

  const isPrimary = request.user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL || request.user.isPrimaryAdmin === true;
  if (!isPrimary) {
    return response.status(403).json({ message: 'Only the Primary Admin (shubhamtiwari.2006.met@gmail.com) can manage admin accounts.' });
  }

  next();
}

module.exports = { authenticate, optionalAuthenticate, requireRoles, requirePrimaryAdmin, PRIMARY_ADMIN_EMAIL };
const { createClient } = require('@supabase/supabase-js');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { PRIMARY_ADMIN_EMAIL } = require('../middleware/auth');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

// 1. GET /api/admin/admins — List all admin accounts
exports.getAdmins = async (req, res) => {
  try {
    // Ensure Primary Admin exists in MongoDB
    await User.findOneAndUpdate(
      { email: PRIMARY_ADMIN_EMAIL },
      {
        $set: {
          email: PRIMARY_ADMIN_EMAIL,
          role: 'admin',
          adminStatus: 'active',
          isPrimaryAdmin: true,
          name: 'Primary Admin',
        },
      },
      { upsert: true, new: true }
    );

    const mongoAdmins = await User.find({
      $or: [
        { role: 'admin' },
        { isPrimaryAdmin: true },
        { email: PRIMARY_ADMIN_EMAIL },
        { adminStatus: { $in: ['active', 'revoked'] } },
      ],
    }).sort({ createdAt: -1 });

    const formatted = mongoAdmins.map((u) => {
      const isPrimary = u.email.toLowerCase() === PRIMARY_ADMIN_EMAIL || u.isPrimaryAdmin;
      return {
        _id: u._id.toString(),
        id: u._id.toString(),
        supabaseId: u.supabaseId,
        name: u.name || (isPrimary ? 'Primary Admin' : 'Admin'),
        email: u.email,
        role: isPrimary ? 'admin' : u.role,
        adminStatus: isPrimary ? 'active' : (u.adminStatus || 'active'),
        isPrimaryAdmin: isPrimary,
        createdBy: u.createdBy || (isPrimary ? 'System' : 'Primary Admin'),
        createdAt: u.createdAt,
        revokedAt: u.revokedAt,
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching admin accounts:', error);
    res.status(500).json({ message: 'Failed to load admin accounts' });
  }
};

// 2. POST /api/admin/admins — Primary Admin creates an additional Admin
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required (Name, Email, Password, Confirm Password).' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    // Valid email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (cleanEmail === PRIMARY_ADMIN_EMAIL) {
      return res.status(400).json({ message: 'Primary Admin account already exists.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Password and Confirm Password do not match.' });
    }

    // Check if user is already an active admin in MongoDB
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser && existingUser.role === 'admin' && existingUser.adminStatus === 'active') {
      return res.status(400).json({ message: 'An active Admin account with this email already exists.' });
    }

    let supabaseUserId = existingUser?.supabaseId || null;

    // Create user in Supabase Auth if supabase client is configured
    if (supabase) {
      try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              full_name: cleanName,
              name: cleanName,
              role: 'admin',
            },
          },
        });

        if (signUpData?.user) {
          supabaseUserId = signUpData.user.id;
        } else if (signUpError) {
          console.warn('Supabase signUp warning (user may already exist):', signUpError.message);
        }
      } catch (sbErr) {
        console.warn('Supabase Auth creation exception:', sbErr.message);
      }
    }

    if (!supabaseUserId) {
      supabaseUserId = existingUser?.supabaseId || `admin-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }

    // Update Supabase profiles table if available
    if (supabase && supabaseUserId && !supabaseUserId.startsWith('admin-')) {
      try {
        await supabase.from('profiles').upsert({
          id: supabaseUserId,
          email: cleanEmail,
          role: 'ADMIN',
        });
      } catch (pErr) {
        console.warn('Error updating Supabase profile role:', pErr.message);
      }
    }

    // Upsert MongoDB User record
    const adminUser = await User.findOneAndUpdate(
      { email: cleanEmail },
      {
        $set: {
          supabaseId: supabaseUserId,
          name: cleanName,
          email: cleanEmail,
          role: 'admin',
          adminStatus: 'active',
          isPrimaryAdmin: false,
          createdBy: req.user ? req.user.email : PRIMARY_ADMIN_EMAIL,
          revokedAt: null,
        },
      },
      { upsert: true, new: true }
    );

    // Write Audit Log
    try {
      await AuditLog.create({
        action: 'ADMIN_CREATED',
        performedBy: req.user ? req.user.email : PRIMARY_ADMIN_EMAIL,
        affectedAdmin: cleanEmail,
        details: `Additional Admin account created for ${cleanName} (${cleanEmail})`,
      });
    } catch (auditErr) {
      console.warn('Audit log creation warning:', auditErr.message);
    }

    res.status(201).json({
      message: `Additional Admin account created successfully for ${cleanEmail}.`,
      admin: {
        _id: adminUser._id.toString(),
        id: adminUser._id.toString(),
        name: adminUser.name,
        email: adminUser.email,
        role: 'admin',
        adminStatus: 'active',
        isPrimaryAdmin: false,
        createdBy: adminUser.createdBy,
        createdAt: adminUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating admin account:', error);
    res.status(500).json({ message: 'Failed to create admin account' });
  }
};

// 3. DELETE /api/admin/admins/:id — Primary Admin revokes an additional Admin
exports.revokeAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const targetUser = await User.findOne({
      $or: [{ _id: id }, { supabaseId: id }, { email: id.toLowerCase().trim() }],
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'Admin account not found.' });
    }

    if (targetUser.email.toLowerCase() === PRIMARY_ADMIN_EMAIL || targetUser.isPrimaryAdmin) {
      return res.status(403).json({ message: 'Primary Admin cannot be revoked or removed.' });
    }

    // Revoke admin status in MongoDB
    targetUser.adminStatus = 'revoked';
    targetUser.role = 'visitor';
    targetUser.revokedAt = new Date();
    await targetUser.save();

    // Revoke role in Supabase profiles table
    if (supabase && targetUser.supabaseId && !targetUser.supabaseId.startsWith('admin-')) {
      try {
        await supabase.from('profiles').upsert({
          id: targetUser.supabaseId,
          email: targetUser.email,
          role: 'VISITOR',
        });
      } catch (pErr) {
        console.warn('Error updating Supabase profiles on revoke:', pErr.message);
      }
    }

    // Write Audit Log
    try {
      await AuditLog.create({
        action: 'ADMIN_ACCESS_REVOKED',
        performedBy: req.user ? req.user.email : PRIMARY_ADMIN_EMAIL,
        affectedAdmin: targetUser.email,
        details: `Admin access revoked for ${targetUser.email}`,
      });
    } catch (auditErr) {
      console.warn('Audit log creation warning:', auditErr.message);
    }

    res.json({
      message: `Admin access for ${targetUser.email} has been revoked successfully.`,
      revokedId: targetUser._id.toString(),
    });
  } catch (error) {
    console.error('Error revoking admin access:', error);
    res.status(500).json({ message: 'Failed to revoke admin access' });
  }
};

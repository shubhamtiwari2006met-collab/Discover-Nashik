const User = require('../models/User');
const AppUser = require('../models/AppUser');
const Business = require('../models/Business');
const BlockedIdentifier = require('../models/BlockedIdentifier');
const AuditLog = require('../models/AuditLog');
const { PRIMARY_ADMIN_EMAIL } = require('../middleware/auth');

// Helper: Normalize email
function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return null;
  return email.toLowerCase().trim();
}

// Helper: Normalize mobile (Indian format 10 digits)
function normalizeMobile(mobile) {
  if (!mobile || typeof mobile !== 'string') return null;
  let digits = mobile.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(digits) ? digits : null;
}

// ─── GET /api/admin/users — List all users with pagination, search, filters ───
exports.getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const category = (req.query.category || 'all').toLowerCase();
    const status = (req.query.status || 'all').toLowerCase();

    // Build results from multiple collections
    let commonUsers = [];
    let businessUsers = [];
    let adminUsers = [];

    // Get blocked identifiers for status annotation
    const activeBlocks = await BlockedIdentifier.find({ isActive: true }).lean();
    const blockedEmails = new Set(activeBlocks.filter(b => b.identifierType === 'email').map(b => b.normalizedIdentifier));
    const blockedMobiles = new Set(activeBlocks.filter(b => b.identifierType === 'mobile').map(b => b.normalizedIdentifier));

    // ── Common Users (AppUser collection) ──
    if (category === 'all' || category === 'common' || category === 'blocked' || category === 'active') {
      const appUserQuery = {};
      if (search) {
        const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        appUserQuery.$or = [
          { name: searchRegex },
          { email: searchRegex },
          { mobile: searchRegex }
        ];
      }

      const appUsers = await AppUser.find(appUserQuery)
        .sort({ createdAt: -1 })
        .lean();

      commonUsers = appUsers.map(u => {
        const emailBlocked = u.email ? blockedEmails.has(normalizeEmail(u.email)) : false;
        const mobileBlocked = u.mobile ? blockedMobiles.has(normalizeMobile(u.mobile) || u.mobile) : false;
        const isBlocked = emailBlocked || mobileBlocked || !u.isActive;
        return {
          _id: u._id.toString(),
          name: u.name || 'Unknown',
          email: u.email || null,
          mobile: u.mobile || null,
          userType: 'common',
          status: isBlocked ? 'blocked' : 'active',
          isActive: u.isActive,
          emailVerified: u.emailVerified,
          mobileVerified: u.mobileVerified,
          authProvider: u.authProvider,
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt
        };
      });
    }

    // ── Business Users (User collection with role=business) ──
    if (category === 'all' || category === 'business' || category === 'blocked' || category === 'active') {
      const bizUserQuery = { role: 'business' };
      if (search) {
        const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        bizUserQuery.$or = [
          { name: searchRegex },
          { email: searchRegex }
        ];
        // If searching, remove role from top-level and put it in $and
        delete bizUserQuery.role;
        bizUserQuery.$and = [
          { role: 'business' },
          { $or: bizUserQuery.$or }
        ];
        delete bizUserQuery.$or;
      }

      const bizUsers = await User.find(bizUserQuery)
        .sort({ createdAt: -1 })
        .lean();

      // Fetch associated businesses
      const bizOwnerIds = bizUsers.map(u => u._id);
      const businesses = await Business.find({ owner: { $in: bizOwnerIds } }).lean();
      const bizMap = {};
      businesses.forEach(b => { bizMap[b.owner.toString()] = b; });

      // Also search by business name if search is provided
      if (search && (category === 'all' || category === 'business')) {
        const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const matchedBusinesses = await Business.find({ businessName: searchRegex }).lean();
        const additionalOwnerIds = matchedBusinesses
          .map(b => b.owner.toString())
          .filter(id => !bizOwnerIds.some(existing => existing.toString() === id));

        if (additionalOwnerIds.length > 0) {
          const additionalUsers = await User.find({ _id: { $in: additionalOwnerIds }, role: 'business' }).lean();
          additionalUsers.forEach(u => {
            bizUsers.push(u);
            const biz = matchedBusinesses.find(b => b.owner.toString() === u._id.toString());
            if (biz) bizMap[u._id.toString()] = biz;
          });
        }
      }

      businessUsers = bizUsers.map(u => {
        const emailBlocked = u.email ? blockedEmails.has(normalizeEmail(u.email)) : false;
        const isBlocked = emailBlocked;
        const biz = bizMap[u._id.toString()];
        return {
          _id: u._id.toString(),
          name: u.name || 'Unknown',
          email: u.email || null,
          mobile: null,
          userType: 'business',
          status: isBlocked ? 'blocked' : 'active',
          businessStatus: u.businessStatus,
          businessName: biz ? biz.businessName : null,
          businessType: biz ? biz.businessType : null,
          verificationStatus: biz ? biz.verificationStatus : null,
          supabaseId: u.supabaseId,
          lastLoginAt: null,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt
        };
      });
    }

    // ── Admin Users (User collection with role=admin) ──
    if (category === 'all' || category === 'admin') {
      const adminQuery = {
        $or: [
          { role: 'admin' },
          { isPrimaryAdmin: true },
          { email: PRIMARY_ADMIN_EMAIL }
        ]
      };
      if (search) {
        const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        adminQuery.$and = [
          { $or: adminQuery.$or },
          { $or: [{ name: searchRegex }, { email: searchRegex }] }
        ];
        delete adminQuery.$or;
      }

      const admins = await User.find(adminQuery)
        .sort({ createdAt: -1 })
        .lean();

      adminUsers = admins.map(u => {
        const isPrimary = u.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL || u.isPrimaryAdmin;
        return {
          _id: u._id.toString(),
          name: u.name || (isPrimary ? 'Primary Admin' : 'Admin'),
          email: u.email || null,
          mobile: null,
          userType: 'admin',
          status: u.adminStatus === 'revoked' ? 'revoked' : 'active',
          adminStatus: isPrimary ? 'active' : (u.adminStatus || 'active'),
          isPrimaryAdmin: isPrimary,
          createdBy: u.createdBy || (isPrimary ? 'System' : null),
          revokedAt: u.revokedAt,
          supabaseId: u.supabaseId,
          lastLoginAt: null,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt
        };
      });
    }

    // Combine all users
    let allUsers = [...commonUsers, ...businessUsers, ...adminUsers];

    // Apply status filter
    if (status === 'blocked') {
      allUsers = allUsers.filter(u => u.status === 'blocked');
    } else if (status === 'active') {
      allUsers = allUsers.filter(u => u.status === 'active');
    }

    // Remove duplicates (in case a user appears in multiple categories)
    const seen = new Set();
    allUsers = allUsers.filter(u => {
      const key = u._id + u.userType;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by createdAt descending
    allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = allUsers.length;
    const paginated = allUsers.slice(skip, skip + limit);

    res.json({
      users: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to load users' });
  }
};

// ─── GET /api/admin/users/stats — Summary statistics ───
exports.getUserStats = async (req, res) => {
  try {
    const [commonCount, businessCount, adminCount, blockedCount] = await Promise.all([
      AppUser.countDocuments({}),
      User.countDocuments({ role: 'business' }),
      User.countDocuments({
        $or: [
          { role: 'admin' },
          { isPrimaryAdmin: true },
          { email: PRIMARY_ADMIN_EMAIL }
        ]
      }),
      BlockedIdentifier.countDocuments({ isActive: true })
    ]);

    // Count blocked common users
    const activeBlocks = await BlockedIdentifier.find({ isActive: true }).lean();
    const blockedEmails = new Set(activeBlocks.filter(b => b.identifierType === 'email').map(b => b.normalizedIdentifier));
    const blockedMobiles = new Set(activeBlocks.filter(b => b.identifierType === 'mobile').map(b => b.normalizedIdentifier));

    // Count AppUsers who are blocked (either by isActive=false or by blocked identifier)
    const inactiveAppUsers = await AppUser.countDocuments({ isActive: false });
    let blockedAppUsersByIdentifier = 0;
    if (blockedEmails.size > 0 || blockedMobiles.size > 0) {
      const orConditions = [];
      if (blockedEmails.size > 0) orConditions.push({ email: { $in: [...blockedEmails] } });
      if (blockedMobiles.size > 0) orConditions.push({ mobile: { $in: [...blockedMobiles] } });
      if (orConditions.length > 0) {
        blockedAppUsersByIdentifier = await AppUser.countDocuments({ $or: orConditions, isActive: true });
      }
    }

    const totalBlockedUsers = inactiveAppUsers + blockedAppUsersByIdentifier;

    res.json({
      total: commonCount + businessCount + adminCount,
      common: commonCount,
      business: businessCount,
      admin: adminCount,
      blocked: totalBlockedUsers,
      blockedIdentifiers: blockedCount
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Failed to load user statistics' });
  }
};

// ─── GET /api/admin/users/:id — Get single user detail ───
exports.getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'common', 'business', 'admin'

    let user = null;

    if (type === 'common') {
      const appUser = await AppUser.findById(id).lean();
      if (!appUser) return res.status(404).json({ message: 'User not found' });

      // Check block status
      const blocks = [];
      if (appUser.email) {
        const emailBlock = await BlockedIdentifier.findOne({
          normalizedIdentifier: normalizeEmail(appUser.email),
          identifierType: 'email',
          isActive: true
        }).lean();
        if (emailBlock) blocks.push(emailBlock);
      }
      if (appUser.mobile) {
        const mobileBlock = await BlockedIdentifier.findOne({
          normalizedIdentifier: normalizeMobile(appUser.mobile) || appUser.mobile,
          identifierType: 'mobile',
          isActive: true
        }).lean();
        if (mobileBlock) blocks.push(mobileBlock);
      }

      const isBlocked = blocks.length > 0 || !appUser.isActive;

      user = {
        _id: appUser._id.toString(),
        name: appUser.name || 'Unknown',
        email: appUser.email,
        mobile: appUser.mobile,
        userType: 'common',
        status: isBlocked ? 'blocked' : 'active',
        isActive: appUser.isActive,
        emailVerified: appUser.emailVerified,
        mobileVerified: appUser.mobileVerified,
        authProvider: appUser.authProvider,
        lastLoginAt: appUser.lastLoginAt,
        createdAt: appUser.createdAt,
        updatedAt: appUser.updatedAt,
        blockedIdentifiers: blocks.map(b => ({
          type: b.identifierType,
          identifier: b.identifier,
          blockedAt: b.blockedAt,
          reason: b.reason
        }))
      };
    } else if (type === 'business') {
      const bizUser = await User.findById(id).lean();
      if (!bizUser) return res.status(404).json({ message: 'User not found' });

      const biz = await Business.findOne({ owner: bizUser._id }).lean();

      const emailBlocked = bizUser.email
        ? await BlockedIdentifier.findOne({ normalizedIdentifier: normalizeEmail(bizUser.email), identifierType: 'email', isActive: true }).lean()
        : null;

      user = {
        _id: bizUser._id.toString(),
        name: bizUser.name,
        email: bizUser.email,
        userType: 'business',
        status: emailBlocked ? 'blocked' : 'active',
        businessStatus: bizUser.businessStatus,
        supabaseId: bizUser.supabaseId,
        createdAt: bizUser.createdAt,
        updatedAt: bizUser.updatedAt,
        business: biz ? {
          businessName: biz.businessName,
          businessType: biz.businessType,
          contactName: biz.contactName,
          phone: biz.phone,
          email: biz.email,
          address: biz.address,
          description: biz.description,
          verificationStatus: biz.verificationStatus,
          createdAt: biz.createdAt
        } : null,
        blockedIdentifiers: emailBlocked ? [{
          type: 'email',
          identifier: emailBlocked.identifier,
          blockedAt: emailBlocked.blockedAt,
          reason: emailBlocked.reason
        }] : []
      };
    } else if (type === 'admin') {
      const adminUser = await User.findById(id).lean();
      if (!adminUser) return res.status(404).json({ message: 'User not found' });

      const isPrimary = adminUser.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL || adminUser.isPrimaryAdmin;

      user = {
        _id: adminUser._id.toString(),
        name: adminUser.name || (isPrimary ? 'Primary Admin' : 'Admin'),
        email: adminUser.email,
        userType: 'admin',
        status: adminUser.adminStatus === 'revoked' ? 'revoked' : 'active',
        adminStatus: isPrimary ? 'active' : (adminUser.adminStatus || 'active'),
        isPrimaryAdmin: isPrimary,
        createdBy: adminUser.createdBy,
        revokedAt: adminUser.revokedAt,
        supabaseId: adminUser.supabaseId,
        createdAt: adminUser.createdAt,
        updatedAt: adminUser.updatedAt
      };
    } else {
      return res.status(400).json({ message: 'Invalid user type. Must be common, business, or admin.' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user detail:', error);
    res.status(500).json({ message: 'Failed to load user details' });
  }
};

// ─── DELETE /api/admin/users/:id — Delete user (does NOT block identifier) ───
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'common', 'business', 'admin'
    const adminEmail = req.user?.email || 'unknown';

    if (type === 'common') {
      const appUser = await AppUser.findById(id);
      if (!appUser) return res.status(404).json({ message: 'User not found' });

      await AppUser.findByIdAndDelete(id);

      // Audit
      try {
        await AuditLog.create({
          action: 'USER_DELETED',
          performedBy: adminEmail,
          affectedAdmin: appUser.email || appUser.mobile || id,
          details: `Common user ${appUser.name || ''} (${appUser.email || appUser.mobile || id}) deleted`
        });
      } catch (e) { /* non-critical */ }

      return res.json({ message: 'User deleted successfully. The identifier can be used to register again.' });

    } else if (type === 'business') {
      const bizUser = await User.findById(id);
      if (!bizUser) return res.status(404).json({ message: 'User not found' });

      if (bizUser.role !== 'business') {
        return res.status(400).json({ message: 'This user is not a business user' });
      }

      // Don't delete associated Business record — preserve business data
      // Just remove the User record
      await User.findByIdAndDelete(id);

      try {
        await AuditLog.create({
          action: 'USER_DELETED',
          performedBy: adminEmail,
          affectedAdmin: bizUser.email || id,
          details: `Business user ${bizUser.name || ''} (${bizUser.email || id}) deleted. Business records preserved.`
        });
      } catch (e) { /* non-critical */ }

      return res.json({ message: 'Business user account deleted. Business records have been preserved.' });

    } else if (type === 'admin') {
      const adminUser = await User.findById(id);
      if (!adminUser) return res.status(404).json({ message: 'Admin not found' });

      const isPrimary = adminUser.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL || adminUser.isPrimaryAdmin;
      if (isPrimary) {
        return res.status(403).json({ message: 'Primary Admin cannot be deleted.' });
      }

      // Self-deletion prevention
      if (req.user && req.user._id.toString() === id) {
        return res.status(403).json({ message: 'You cannot delete your own admin account.' });
      }

      // Revoke instead of hard delete for admin accounts
      adminUser.adminStatus = 'revoked';
      adminUser.role = 'visitor';
      adminUser.revokedAt = new Date();
      await adminUser.save();

      try {
        await AuditLog.create({
          action: 'ADMIN_ACCESS_REVOKED',
          performedBy: adminEmail,
          affectedAdmin: adminUser.email || id,
          details: `Admin ${adminUser.name || ''} (${adminUser.email || id}) access revoked via user management`
        });
      } catch (e) { /* non-critical */ }

      return res.json({ message: 'Admin access has been revoked.' });

    } else {
      return res.status(400).json({ message: 'Invalid user type' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// ─── POST /api/admin/users/:id/block — Block user identifier ───
exports.blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const { reason } = req.body;
    const adminEmail = req.user?.email || 'unknown';

    let identifiers = [];

    if (type === 'common') {
      const appUser = await AppUser.findById(id);
      if (!appUser) return res.status(404).json({ message: 'User not found' });

      if (appUser.email) {
        identifiers.push({ type: 'email', value: appUser.email, normalized: normalizeEmail(appUser.email) });
      }
      if (appUser.mobile) {
        const normalizedMobile = normalizeMobile(appUser.mobile) || appUser.mobile;
        identifiers.push({ type: 'mobile', value: appUser.mobile, normalized: normalizedMobile });
      }

      // Mark AppUser as inactive
      appUser.isActive = false;
      await appUser.save();

    } else if (type === 'business') {
      const bizUser = await User.findById(id);
      if (!bizUser) return res.status(404).json({ message: 'User not found' });

      if (bizUser.email) {
        identifiers.push({ type: 'email', value: bizUser.email, normalized: normalizeEmail(bizUser.email) });
      }

    } else if (type === 'admin') {
      const adminUser = await User.findById(id);
      if (!adminUser) return res.status(404).json({ message: 'Admin not found' });

      const isPrimary = adminUser.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL || adminUser.isPrimaryAdmin;
      if (isPrimary) {
        return res.status(403).json({ message: 'Primary Admin cannot be blocked.' });
      }

      // Self-block prevention
      if (req.user && req.user._id.toString() === id) {
        return res.status(403).json({ message: 'You cannot block your own account.' });
      }

      if (adminUser.email) {
        identifiers.push({ type: 'email', value: adminUser.email, normalized: normalizeEmail(adminUser.email) });
      }

      // Also revoke admin status
      adminUser.adminStatus = 'revoked';
      adminUser.role = 'visitor';
      adminUser.revokedAt = new Date();
      await adminUser.save();

    } else {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    if (identifiers.length === 0) {
      return res.status(400).json({ message: 'No identifiers found to block for this user.' });
    }

    // Create blocked identifier records
    for (const id_data of identifiers) {
      // Check if already blocked
      const existing = await BlockedIdentifier.findOne({
        normalizedIdentifier: id_data.normalized,
        identifierType: id_data.type,
        isActive: true
      });

      if (!existing) {
        await BlockedIdentifier.create({
          identifierType: id_data.type,
          identifier: id_data.value,
          normalizedIdentifier: id_data.normalized,
          blockedBy: adminEmail,
          reason: reason || null,
          isActive: true
        });
      }
    }

    // Audit
    try {
      await AuditLog.create({
        action: 'USER_BLOCKED',
        performedBy: adminEmail,
        affectedAdmin: identifiers.map(i => i.value).join(', '),
        details: `Identifiers blocked: ${identifiers.map(i => `${i.type}:${i.value}`).join(', ')}${reason ? ` | Reason: ${reason}` : ''}`
      });
    } catch (e) { /* non-critical */ }

    res.json({
      message: 'User has been blocked. Their identifiers cannot be used to login or register.',
      blockedIdentifiers: identifiers.map(i => ({ type: i.type, value: i.value }))
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ message: 'Failed to block user' });
  }
};

// ─── POST /api/admin/users/:id/unblock — Unblock user identifier ───
exports.unblockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const adminEmail = req.user?.email || 'unknown';

    let identifiers = [];

    if (type === 'common') {
      const appUser = await AppUser.findById(id);
      if (!appUser) return res.status(404).json({ message: 'User not found' });

      if (appUser.email) {
        identifiers.push({ type: 'email', normalized: normalizeEmail(appUser.email), value: appUser.email });
      }
      if (appUser.mobile) {
        identifiers.push({ type: 'mobile', normalized: normalizeMobile(appUser.mobile) || appUser.mobile, value: appUser.mobile });
      }

      // Reactivate the user
      appUser.isActive = true;
      await appUser.save();

    } else if (type === 'business') {
      const bizUser = await User.findById(id);
      if (!bizUser) return res.status(404).json({ message: 'User not found' });
      if (bizUser.email) {
        identifiers.push({ type: 'email', normalized: normalizeEmail(bizUser.email), value: bizUser.email });
      }

    } else if (type === 'admin') {
      // Admins can be unrevoked but this is handled by the existing admin management
      return res.status(400).json({ message: 'Admin unblocking should be done through admin management.' });
    } else {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    // Deactivate blocked identifier records
    let unblockedCount = 0;
    for (const id_data of identifiers) {
      const result = await BlockedIdentifier.updateMany(
        { normalizedIdentifier: id_data.normalized, identifierType: id_data.type, isActive: true },
        { $set: { isActive: false, unblockedAt: new Date(), unblockedBy: adminEmail } }
      );
      unblockedCount += result.modifiedCount;
    }

    // Audit
    try {
      await AuditLog.create({
        action: 'USER_UNBLOCKED',
        performedBy: adminEmail,
        affectedAdmin: identifiers.map(i => i.value).join(', '),
        details: `Identifiers unblocked: ${identifiers.map(i => `${i.type}:${i.value}`).join(', ')}`
      });
    } catch (e) { /* non-critical */ }

    res.json({
      message: 'User has been unblocked. They can now login or register again.',
      unblockedCount
    });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ message: 'Failed to unblock user' });
  }
};

// ─── GET /api/admin/users/blocked — List all blocked identifiers ───
exports.getBlockedIdentifiers = async (req, res) => {
  try {
    const blocks = await BlockedIdentifier.find({ isActive: true })
      .sort({ blockedAt: -1 })
      .lean();

    res.json(blocks.map(b => ({
      _id: b._id.toString(),
      identifierType: b.identifierType,
      identifier: b.identifier,
      normalizedIdentifier: b.normalizedIdentifier,
      blockedAt: b.blockedAt,
      blockedBy: b.blockedBy,
      reason: b.reason
    })));
  } catch (error) {
    console.error('Error fetching blocked identifiers:', error);
    res.status(500).json({ message: 'Failed to load blocked identifiers' });
  }
};

// ─── Middleware: Check if identifier is blocked (for auth routes) ───
exports.checkBlockedIdentifier = async (identifier) => {
  if (!identifier) return false;

  const cleanEmail = normalizeEmail(identifier);
  const cleanMobile = normalizeMobile(identifier);

  const query = { isActive: true, $or: [] };
  if (cleanEmail) query.$or.push({ normalizedIdentifier: cleanEmail, identifierType: 'email' });
  if (cleanMobile) query.$or.push({ normalizedIdentifier: cleanMobile, identifierType: 'mobile' });

  if (query.$or.length === 0) return false;

  const blocked = await BlockedIdentifier.findOne(query).lean();
  return !!blocked;
};

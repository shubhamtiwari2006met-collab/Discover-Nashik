const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const NotificationIdentity = require('../models/NotificationIdentity');
const NotificationPreference = require('../models/NotificationPreference');
const NotificationDevice = require('../models/NotificationDevice');
const NotificationSettings = require('../models/NotificationSettings');
const NotificationGroup = require('../models/NotificationGroup');
const NotificationGroupMember = require('../models/NotificationGroupMember');
const User = require('../models/User');
const AppUser = require('../models/AppUser');
const service = require('../services/notificationService');

function currentRecipient(req) {
  return service.resolveRecipient(req.notificationIdentity.type, req.notificationIdentity.id);
}

exports.getUserNotifications = async (req, res) => {
  try {
    const recipientId = await currentRecipient(req);
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
    const query = { recipientId, status: 'SENT', $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] };
    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({ ...query, isRead: false }),
    ]);
    return res.json({ notifications, unreadCount, recipientId });
  } catch (error) {
    console.error('[Notifications] Failed to load user notifications:', error);
    return res.status(500).json({ message: 'Failed to load notifications' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const recipientId = await currentRecipient(req);
    const count = await Notification.countDocuments({
      recipientId,
      status: 'SENT',
      isRead: false,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });
    return res.json({ unreadCount: count, recipientId });
  } catch (error) {
    console.error('[Notifications] Failed to count unread notifications:', error);
    return res.status(500).json({ message: 'Failed to load unread count' });
  }
};

exports.markRead = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid notification ID' });
    const recipientId = await currentRecipient(req);
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId, status: 'SENT' },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    return res.json({ notification });
  } catch (error) {
    console.error('[Notifications] Failed to mark notification as read:', error);
    return res.status(500).json({ message: 'Failed to update notification' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const recipientId = await currentRecipient(req);
    await Notification.updateMany(
      { recipientId, status: 'SENT', isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return res.json({ success: true });
  } catch (error) {
    console.error('[Notifications] Failed to mark all notifications as read:', error);
    return res.status(500).json({ message: 'Failed to update notifications' });
  }
};

exports.getPreferences = async (req, res) => {
  try {
    const recipientId = await currentRecipient(req);
    const preferences = await NotificationPreference.findOneAndUpdate(
      { recipientId },
      { $setOnInsert: { recipientId, enabled: true, categories: {} } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json({ preferences });
  } catch (error) {
    console.error('[Notifications] Failed to load preferences:', error);
    return res.status(500).json({ message: 'Failed to load preferences' });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const { enabled, categories, pushEnabled } = req.body;
    if (typeof enabled !== 'boolean' || !categories || typeof categories !== 'object' || Array.isArray(categories) ||
        (pushEnabled !== undefined && typeof pushEnabled !== 'boolean')) {
      return res.status(400).json({ message: 'A boolean enabled value and category settings are required' });
    }
    if (Object.values(categories).some((value) => typeof value !== 'boolean')) {
      return res.status(400).json({ message: 'Category preferences must be boolean values' });
    }
    const recipientId = await currentRecipient(req);
    const update = { enabled, categories: new Map(Object.entries(categories)) };
    if (pushEnabled !== undefined) update.pushEnabled = pushEnabled;
    const preferences = await NotificationPreference.findOneAndUpdate(
      { recipientId },
      { $set: update },
      { upsert: true, new: true, runValidators: true }
    );
    return res.json({ preferences });
  } catch (error) {
    console.error('[Notifications] Failed to update preferences:', error);
    return res.status(500).json({ message: 'Failed to update preferences' });
  }
};

exports.registerPushDevice = async (req, res) => {
  try {
    const { token, platform = 'web', browser = '', deviceId = '' } = req.body;
    if (typeof token !== 'string' || token.trim().length < 20 || token.length > 4096 || /\s/.test(token)) {
      return res.status(400).json({ message: 'A valid push token is required' });
    }
    if (platform !== 'web' ||
        typeof browser !== 'string' || browser.length > 80 ||
        typeof deviceId !== 'string' || deviceId.length > 120) {
      return res.status(400).json({ message: 'Invalid device details' });
    }

    const recipientId = await currentRecipient(req);
    const recipientType = req.notificationIdentity.type;
    const fcmToken = token.trim();
    let device = await NotificationDevice.findOne({ fcmToken }).select('+fcmToken');
    if (device && device.recipientId !== recipientId) {
      return res.status(409).json({ message: 'This push token is already registered to another account' });
    }
    if (device) {
      await NotificationDevice.updateOne(
        { _id: device._id, recipientId },
        { $set: { recipientType, platform, browser: browser.trim(), deviceId: deviceId.trim(), isActive: true, lastSeenAt: new Date() } }
      );
    } else {
      try {
        await NotificationDevice.create({
          recipientId,
          recipientType,
          fcmToken,
          platform,
          browser: browser.trim(),
          deviceId: deviceId.trim(),
          isActive: true,
          lastSeenAt: new Date(),
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        device = await NotificationDevice.findOne({ fcmToken }).select('+fcmToken');
        if (!device || device.recipientId !== recipientId) {
          return res.status(409).json({ message: 'This push token is already registered to another account' });
        }
        await NotificationDevice.updateOne(
          { _id: device._id, recipientId },
          { $set: { recipientType, platform, browser: browser.trim(), deviceId: deviceId.trim(), isActive: true, lastSeenAt: new Date() } }
        );
      }
    }
    return res.json({ registered: true });
  } catch (error) {
    console.error('[Notifications] Failed to register push device:', error);
    return res.status(500).json({ message: 'Failed to register push notifications' });
  }
};

exports.disablePushDevices = async (req, res) => {
  try {
    const recipientId = await currentRecipient(req);
    const result = await NotificationDevice.updateMany(
      { recipientId, isActive: true },
      { $set: { isActive: false } }
    );
    return res.json({ disabledCount: result.modifiedCount });
  } catch (error) {
    console.error('[Notifications] Failed to disable push devices:', error);
    return res.status(500).json({ message: 'Failed to disable push notifications' });
  }
};

exports.adminOverview = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [total, todayCount, unread, automated, manual, scheduled, settings] = await Promise.all([
      Notification.countDocuments({ status: { $ne: 'CANCELLED' } }),
      Notification.countDocuments({ createdAt: { $gte: today }, status: 'SENT' }),
      Notification.countDocuments({ status: 'SENT', isRead: false }),
      Notification.countDocuments({ source: 'AUTOMATED' }),
      Notification.countDocuments({ source: 'MANUAL' }),
      Notification.countDocuments({ source: 'SCHEDULED' }),
      service.getSettings(),
    ]);
    return res.json({ total, today: todayCount, unread, automated, manual, scheduled, settings });
  } catch (error) {
    console.error('[Notifications] Failed to load overview:', error);
    return res.status(500).json({ message: 'Failed to load notification overview' });
  }
};

exports.adminHistory = async (req, res) => {
  try {
    const { category, source, status, from, to } = req.query;
    const query = {};
    if (category) query.category = category;
    if (source) query.source = source;
    if (status) query.status = status;
    if (from || to) query.createdAt = {};
    if (from) {
      const start = new Date(from);
      if (!Number.isFinite(start.getTime())) return res.status(400).json({ message: 'Invalid from date' });
      query.createdAt.$gte = start;
    }
    if (to) {
      const end = new Date(to);
      if (!Number.isFinite(end.getTime())) return res.status(400).json({ message: 'Invalid to date' });
      query.createdAt.$lte = end;
    }
    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(200).lean();
    const batchIds = [...new Set(notifications.map((item) => item.batchId).filter(Boolean))];
    const recipientCounts = await Notification.aggregate([
      { $match: { batchId: { $in: batchIds } } },
      { $group: { _id: '$batchId', count: { $addToSet: '$recipientId' } } },
      { $project: { count: { $size: '$count' } } },
    ]);
    const countByBatch = new Map(recipientCounts.map((row) => [row._id, row.count]));
    return res.json({
      notifications: notifications.map((item) => ({
        _id: item._id,
        type: item.type,
        category: item.category,
        title: item.title,
        message: item.message,
        source: item.source,
        status: item.status,
        referenceId: item.referenceId,
        referenceType: item.referenceType,
        recipientScope: item.recipientScope,
        batchId: item.batchId,
        createdAt: item.createdAt,
        scheduledAt: item.scheduledAt,
        recipientCount: item.batchId ? countByBatch.get(item.batchId) || 1 : 1,
      })),
    });
  } catch (error) {
    console.error('[Notifications] Failed to load admin history:', error);
    return res.status(500).json({ message: 'Failed to load notification history' });
  }
};

exports.getAdminSettings = async (req, res) => {
  try {
    return res.json({ settings: await service.getSettings() });
  } catch (error) {
    console.error('[Notifications] Failed to load automation settings:', error);
    return res.status(500).json({ message: 'Failed to load automation settings' });
  }
};

exports.updateAdminSettings = async (req, res) => {
  try {
    const { globalAutomationEnabled, categories, tripReminders } = req.body;
    const validBooleans = (value) => value && typeof value === 'object' && !Array.isArray(value) &&
      Object.values(value).every((entry) => typeof entry === 'boolean');
    if (typeof globalAutomationEnabled !== 'boolean' || !validBooleans(categories) || !validBooleans(tripReminders)) {
      return res.status(400).json({ message: 'Invalid notification settings' });
    }
    const allowedCategories = ['lostFound', 'groupTracker', 'tripPlanner'];
    const allowedReminders = ['sevenDays', 'oneDay', 'tripDay'];
    if (Object.keys(categories).some((key) => !allowedCategories.includes(key)) ||
      Object.keys(tripReminders).some((key) => !allowedReminders.includes(key))) {
      return res.status(400).json({ message: 'Unknown notification setting' });
    }
    const settings = await NotificationSettings.findOneAndUpdate(
      { key: 'global' },
      { $set: { globalAutomationEnabled, categories, tripReminders } },
      { upsert: true, new: true, runValidators: true }
    );
    return res.json({ settings });
  } catch (error) {
    console.error('[Notifications] Failed to update automation settings:', error);
    return res.status(500).json({ message: 'Failed to update automation settings' });
  }
};

async function getManualRecipients(body) {
  if (body.recipientScope === 'ALL' || body.recipientScope === 'CATEGORY') return service.findAllRecipientIds();
  if (body.recipientScope === 'GROUP') {
    const members = await NotificationGroupMember.find({
      groupCode: String(body.groupCode || '').toUpperCase(),
      status: 'active',
      recipientId: { $ne: null },
    }).select('recipientId').lean();
    return members.map((member) => member.recipientId);
  }
  if (body.recipientScope === 'USER') {
    const { identityType, identityId } = body;
    if (!['platform', 'app_user'].includes(identityType) || !identityId) return null;
    const Model = identityType === 'platform' ? User : AppUser;
    if (!mongoose.Types.ObjectId.isValid(identityId) || !(await Model.exists({ _id: identityId }))) return null;
    return [await service.resolveRecipient(identityType, identityId)];
  }
  return null;
}

exports.createAdminNotification = async (req, res) => {
  try {
    const { category, title, message, recipientScope, scheduledAt, expiresAt, referenceId, referenceType } = req.body;
    if (!['lost_found', 'group_tracker', 'trip_planner', 'general'].includes(category) ||
      typeof title !== 'string' || !title.trim() || title.length > 160 ||
      typeof message !== 'string' || !message.trim() || message.length > 5000) {
      return res.status(400).json({ message: 'Valid category, title, and message are required' });
    }
    if (scheduledAt && (!Number.isFinite(new Date(scheduledAt).getTime()) || new Date(scheduledAt) <= new Date())) {
      return res.status(400).json({ message: 'Scheduled time must be a valid future date' });
    }
    if (expiresAt && (!Number.isFinite(new Date(expiresAt).getTime()) || new Date(expiresAt) <= new Date())) {
      return res.status(400).json({ message: 'Expiry must be a valid future date' });
    }
    const recipients = await getManualRecipients({ ...req.body, recipientScope });
    if (!recipients) return res.status(400).json({ message: 'Invalid recipient scope or user identity' });
    const notifications = await service.createManualBatch({
      recipients,
      category,
      title: title.trim(),
      message: message.trim(),
      recipientScope,
      referenceId,
      referenceType,
      expiresAt: expiresAt || null,
      scheduledAt: scheduledAt || null,
    });
    return res.status(201).json({ createdCount: notifications.length });
  } catch (error) {
    console.error('[Notifications] Failed to create admin notification:', error);
    return res.status(500).json({ message: 'Failed to create notification' });
  }
};

exports.cancelScheduled = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid notification ID' });
    const notification = await Notification.findOne({ _id: req.params.id, source: 'SCHEDULED', status: 'PENDING' });
    if (!notification) return res.status(404).json({ message: 'Pending scheduled notification not found' });
    const query = notification.batchId
      ? { batchId: notification.batchId, source: 'SCHEDULED', status: 'PENDING' }
      : { _id: notification._id, source: 'SCHEDULED', status: 'PENDING' };
    await Notification.updateMany(query, { $set: { status: 'CANCELLED' } });
    return res.json({ cancelled: true });
  } catch (error) {
    console.error('[Notifications] Failed to cancel scheduled notification:', error);
    return res.status(500).json({ message: 'Failed to cancel scheduled notification' });
  }
};

exports.registerGroup = async (req, res) => {
  try {
    const groupCode = String(req.body.groupCode || '').trim().toUpperCase();
    if (groupCode.length < 3 || groupCode.length > 12 || !/^[A-Z0-9]+$/.test(groupCode)) {
      return res.status(400).json({ message: 'Invalid group code' });
    }
    const recipientId = req.notificationIdentity
      ? await service.resolveRecipient(req.notificationIdentity.type, req.notificationIdentity.id)
      : null;
    const existingGroup = await NotificationGroup.findOne({ groupCode });
    let legacyGroup = null;
    if (req.body.reconcileOnly && !existingGroup) {
      legacyGroup = await service.findLegacyGroup(groupCode);
      if (!legacyGroup) return res.status(404).json({ message: 'Group not found' });
    }

    const group = await NotificationGroup.findOneAndUpdate(
      { groupCode },
      { $setOnInsert: { groupCode, groupName: String(existingGroup?.groupName || legacyGroup?.group_name || req.body.groupName || 'Nashik Yatra Group').trim().slice(0, 100), createdByRecipientId: recipientId } },
      { upsert: true, new: true }
    );
    if (!req.body.reconcileOnly) {
      const identityType = req.notificationIdentity?.type || 'anonymous';
      const identityId = req.notificationIdentity?.id || String(req.body.memberId || '').trim();
      const memberId = String(req.body.memberId || '').trim() || identityId;
      const displayName = String(req.body.displayName || 'Group Coordinator').trim().slice(0, 80);
      if (!memberId) return res.status(400).json({ message: 'Group creator identity is required' });
      const existingMembership = await NotificationGroupMember.findOne({ groupCode, memberId });
      if (existingGroup && !existingMembership) {
        return res.status(403).json({ message: 'Only an existing group member can register this group' });
      }
      if (existingMembership && existingMembership.recipientId !== recipientId) {
        return res.status(403).json({ message: 'Group membership already belongs to another identity' });
      }
      await NotificationGroupMember.updateOne(
        { groupCode, memberId },
        { $setOnInsert: { groupCode, memberId, identityType, identityId, recipientId, displayName, role: 'coordinator', joinedAt: new Date() }, $set: { status: 'active' } },
        { upsert: true }
      );
    }
    return res.status(201).json({ group: { groupCode: group.groupCode, groupName: group.groupName } });
  } catch (error) {
    if (error.code === 11000) return res.status(200).json({ success: true, alreadyRegistered: true });
    console.error('[Group Sync] Failed to register group:', error);
    return res.status(500).json({ message: 'Failed to register group' });
  }
};

exports.joinGroup = async (req, res) => {
  try {
    const groupCode = String(req.params.groupCode || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{3,12}$/.test(groupCode)) return res.status(400).json({ message: 'Invalid group code' });
    const group = await NotificationGroup.findOne({ groupCode, isActive: true });
    if (!group) return res.status(404).json({ message: 'Group not found. Ask the coordinator to reopen the group.' });
    const identityType = req.notificationIdentity?.type || 'anonymous';
    const identityId = req.notificationIdentity?.id || String(req.body.memberId || '').trim();
    const memberId = String(req.body.memberId || '').trim() || identityId;
    const displayName = String(req.body.displayName || 'Group Member').trim().slice(0, 80);
    if (!memberId || !identityId) return res.status(400).json({ message: 'Member identity is required' });
    const recipientId = req.notificationIdentity
      ? await service.resolveRecipient(identityType, identityId)
      : null;

    let membership;
    let isNewMember = false;
    try {
      membership = await NotificationGroupMember.create({
        groupCode, memberId, identityType, identityId, recipientId, displayName,
        role: 'member', status: 'active', joinedAt: new Date(),
      });
      isNewMember = true;
    } catch (error) {
      if (error.code !== 11000) throw error;
      const existingMembership = await NotificationGroupMember.findOne({ groupCode, memberId });
      if (existingMembership?.recipientId && existingMembership.recipientId !== recipientId) {
        return res.status(403).json({ message: 'Group membership already belongs to another identity' });
      }
      membership = await NotificationGroupMember.findOneAndUpdate(
        { groupCode, memberId },
        { $set: { status: 'active', displayName, recipientId, identityType, identityId } },
        { new: true }
      );
      isNewMember = false;
    }
    const members = await NotificationGroupMember.find({ groupCode, status: 'active' }).select('-__v').lean();
    if (isNewMember) {
      const eventMember = {
        id: membership.memberId,
        name: membership.displayName,
        role: membership.role,
        lastUpdated: new Date(membership.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      try {
        await service.publishChannel(
          `group-tracker:${groupCode}`,
          'MEMBER_JOINED',
          { code: groupCode, type: 'MEMBER_JOINED', payload: { member: eventMember, joinedAt: membership.joinedAt } }
        );
      } catch (error) {
        console.error('[Group Sync] Realtime member event failed:', error.message);
      }

      if (recipientId && await service.automationIsEnabled('group_tracker')) {
        const recipients = members
          .filter((item) => item.memberId !== memberId && item.recipientId)
          .map((item) => item.recipientId);
        await service.createBulkNotifications({
          type: 'GROUP_MEMBER_JOINED',
          category: 'group_tracker',
          title: 'New Member Joined',
          message: `${membership.displayName} joined your group.`,
          source: 'AUTOMATED',
          referenceId: groupCode,
          referenceType: 'group',
          deduplicationKey: `group:${groupCode}:member:${memberId}:joined`,
          recipientScope: 'GROUP',
        }, recipients);
      }
    }
    return res.json({ success: true, isNewMember, members: members.map((item) => ({
      id: item.memberId, name: item.displayName, role: item.role, joinedAt: item.joinedAt,
    })) });
  } catch (error) {
    console.error('[Group Sync] Failed to join group:', error);
    return res.status(500).json({ message: 'Failed to join group' });
  }
};

exports.syncGroupMembership = async (req, res) => {
  try {
    const groupCode = String(req.params.groupCode || '').trim().toUpperCase();
    const { members } = req.body;
    if (!Array.isArray(members) || members.length > 100) {
      return res.status(400).json({ message: 'A valid group member list is required' });
    }
    const group = await NotificationGroup.findOne({ groupCode, isActive: true });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    for (const member of members) {
      const memberId = String(member.id || '').trim();
      const displayName = String(member.name || '').trim().slice(0, 80);
      if (!memberId || !displayName) continue;
      const isCurrentIdentity = req.notificationIdentity &&
        (memberId === String(req.body.currentMemberId || '') ||
          memberId === req.notificationIdentity.id ||
          (req.notificationIdentity.type === 'platform' && memberId === req.notificationIdentity.user.supabaseId));
      const identityType = isCurrentIdentity ? req.notificationIdentity.type : 'anonymous';
      const identityId = isCurrentIdentity ? req.notificationIdentity.id : memberId;
      const recipientId = isCurrentIdentity
        ? await service.resolveRecipient(identityType, identityId)
        : null;
      const existing = await NotificationGroupMember.findOne({ groupCode, memberId }).select('recipientId lastSeenAt lastLocationUpdatedAt lastLocationLat lastLocationLng').lean();
      if (existing?.recipientId && existing.recipientId !== recipientId) continue;
      const fields = { status: 'active', displayName };
      if (member.lastSeenAt) fields.lastSeenAt = new Date(member.lastSeenAt);
      if (member.lastLocationUpdatedAt) fields.lastLocationUpdatedAt = new Date(member.lastLocationUpdatedAt);
      if (typeof member.lastLocationLat === 'number') fields.lastLocationLat = member.lastLocationLat;
      if (typeof member.lastLocationLng === 'number') fields.lastLocationLng = member.lastLocationLng;
      if (isCurrentIdentity) Object.assign(fields, { identityType, identityId, recipientId });
      await NotificationGroupMember.updateOne(
        { groupCode, memberId },
        {
          $setOnInsert: {
            groupCode, memberId, joinedAt: new Date(), identityType, identityId, recipientId,
            role: member.role === 'coordinator' ? 'coordinator' : 'member',
            lastSeenAt: Date.now() ? new Date() : new Date(),
          },
          $set: fields,
        },
        { upsert: true }
      );
    }
    const stored = await NotificationGroupMember.find({ groupCode, status: 'active' }).select('memberId displayName role joinedAt lastSeenAt lastLocationUpdatedAt lastLocationLat lastLocationLng').lean();
    return res.json({ members: stored.map((member) => ({
      id: member.memberId,
      name: member.displayName,
      role: member.role,
      joinedAt: member.joinedAt,
      lastSeenAt: member.lastSeenAt,
      lastLocationUpdatedAt: member.lastLocationUpdatedAt,
      lastLocationLat: member.lastLocationLat,
      lastLocationLng: member.lastLocationLng,
    })) });
  } catch (error) {
    console.error('[Group Sync] Failed to synchronize membership:', error);
    return res.status(500).json({ message: 'Failed to synchronize group membership' });
  }
};

exports.getGroupMembers = async (req, res) => {
  try {
    const groupCode = String(req.params.groupCode || '').trim().toUpperCase();
    const group = await NotificationGroup.findOne({ groupCode, isActive: true }).lean();
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const memberId = String(req.query.memberId || '').trim();
    if (!memberId) return res.status(400).json({ message: 'Member identity is required' });
    const currentMember = await NotificationGroupMember.findOne({ groupCode, memberId, status: 'active' });
    if (!currentMember) return res.status(403).json({ message: 'Active group membership required' });
    if (req.notificationIdentity) {
      const expectedRecipient = await service.resolveRecipient(req.notificationIdentity.type, req.notificationIdentity.id);
      if (currentMember.recipientId && currentMember.recipientId !== expectedRecipient) {
        return res.status(403).json({ message: 'Group membership identity does not match' });
      }
    }
    const members = await NotificationGroupMember.find({ groupCode, status: 'active' }).select('memberId displayName role joinedAt lastSeenAt lastLocationUpdatedAt lastLocationLat lastLocationLng').lean();
    return res.json({ members: members.map((item) => ({
      id: item.memberId,
      name: item.displayName,
      role: item.role,
      joinedAt: item.joinedAt,
      lastSeenAt: item.lastSeenAt,
      lastLocationUpdatedAt: item.lastLocationUpdatedAt,
      lastLocationLat: item.lastLocationLat,
      lastLocationLng: item.lastLocationLng,
    })) });
  } catch (error) {
    console.error('[Group Sync] Failed to load group members:', error);
    return res.status(500).json({ message: 'Failed to load group members' });
  }
};

exports.syncGroupMessage = async (req, res) => {
  try {
    const groupCode = String(req.params.groupCode || '').trim().toUpperCase();
    const { messageId, senderId, message } = req.body;
    if (!messageId || !senderId || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message identity, sender, and content are required' });
    }
    const sender = await NotificationGroupMember.findOne({ groupCode, memberId: senderId, status: 'active' });
    if (!sender) return res.status(403).json({ message: 'Active group membership required' });
    if (sender.recipientId && sender.recipientId !== (req.notificationIdentity
      ? await service.resolveRecipient(req.notificationIdentity.type, req.notificationIdentity.id)
      : null)) {
      return res.status(403).json({ message: 'Sender identity does not match active membership' });
    }
    const recipients = await NotificationGroupMember.find({
      groupCode, status: 'active', memberId: { $ne: senderId }, recipientId: { $ne: null },
    }).select('recipientId').lean();
    const displayName = sender.displayName;
    const safeMessage = String(message).trim().slice(0, 500);
    await service.createBulkNotifications({
      type: 'GROUP_MESSAGE',
      category: 'group_tracker',
      title: sender.role === 'coordinator' ? 'Group Coordinator Update' : 'New Group Message',
      message: `${displayName}: ${safeMessage}`,
      source: 'AUTOMATED',
      referenceId: groupCode,
      referenceType: 'group',
      deduplicationKey: `group:${groupCode}:message:${String(messageId)}`,
      recipientScope: 'GROUP',
    }, recipients.map((member) => member.recipientId));
    return res.json({ success: true });
  } catch (error) {
    console.error('[Group Sync] Failed to process group message notification:', error);
    return res.status(500).json({ message: 'Failed to process group message' });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const groupCode = String(req.params.groupCode || '').trim().toUpperCase();
    const memberId = String(req.body.memberId || '').trim();
    const identityType = req.notificationIdentity?.type || 'anonymous';
    const identityId = req.notificationIdentity?.id || memberId;
    const membership = await NotificationGroupMember.findOneAndUpdate(
      { groupCode, memberId, identityType, identityId, status: 'active' },
      { $set: { status: 'left', leftAt: new Date() } },
      { new: true }
    );
    return res.json({ success: true, left: Boolean(membership) });
  } catch (error) {
    console.error('[Group Sync] Failed to leave group:', error);
    return res.status(500).json({ message: 'Failed to leave group' });
  }
};

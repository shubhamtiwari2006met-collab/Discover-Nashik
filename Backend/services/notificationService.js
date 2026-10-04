const { randomUUID } = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const Notification = require('../models/Notification');
const NotificationIdentity = require('../models/NotificationIdentity');
const NotificationPreference = require('../models/NotificationPreference');
const NotificationDevice = require('../models/NotificationDevice');
const NotificationSettings = require('../models/NotificationSettings');
const AppUser = require('../models/AppUser');
const User = require('../models/User');
const { getFirebaseMessaging } = require('./firebaseAdmin');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const realtimeClient = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

const CATEGORY_PATHS = {
  lost_found: 'categories.lostFound',
  group_tracker: 'categories.groupTracker',
  trip_planner: 'categories.tripPlanner',
};

async function resolveRecipient(identityType, identityId) {
  const normalizedId = String(identityId);
  const recipientId = `${identityType}:${normalizedId}`;
  let identity;
  try {
    identity = await NotificationIdentity.findOneAndUpdate(
      { identityType, identityId: normalizedId },
      { $setOnInsert: { recipientId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    identity = await NotificationIdentity.findOne({ identityType, identityId: normalizedId });
  }
  return identity.recipientId;
}

async function getSettings() {
  return NotificationSettings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function findLegacyGroup(groupCode) {
  if (!realtimeClient) return null;
  const { data, error } = await realtimeClient
    .from('groups')
    .select('code, group_name')
    .eq('code', groupCode)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function userCanReceive(recipientId, category) {
  const preference = await NotificationPreference.findOne({ recipientId }).lean();
  if (preference?.enabled === false) return false;
  const categories = preference?.categories;
  const categoryPreference = categories instanceof Map ? categories.get(category) : categories?.[category];
  if (categoryPreference === false) return false;
  return true;
}

async function automationIsEnabled(category) {
  const settings = await getSettings();
  const categoryPath = CATEGORY_PATHS[category];
  return Boolean(settings.globalAutomationEnabled && (!categoryPath || settings.get(categoryPath)));
}

async function publishChannel(channelName, event, payload) {
  if (!realtimeClient) {
    console.warn('[Notifications] Realtime publishing is not configured');
    return;
  }

  const channel = realtimeClient.channel(channelName);
  try {
    const ready = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Realtime subscription timed out')), 8000);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          resolve();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeout);
          reject(new Error(`Realtime subscription failed: ${status}`));
        }
      });
    });
    await ready;
    const result = await channel.send({
      type: 'broadcast',
      event,
      payload,
    });
    if (result !== 'ok') throw new Error(`Realtime publish returned ${result}`);
  } finally {
    await realtimeClient.removeChannel(channel);
  }
}

function publishRealtime(recipientId, notification) {
  return publishChannel(`notifications:${recipientId}`, 'NOTIFICATION_CREATED', { notification });
}

function getNotificationUrl(notification) {
  const referenceId = notification.referenceId ? String(notification.referenceId) : '';
  if (notification.category === 'group_tracker' && /^[A-Z0-9]{3,12}$/i.test(referenceId)) {
    return `/group-tracker?code=${encodeURIComponent(referenceId)}`;
  }
  if (notification.category === 'lost_found' && referenceId) {
    return `/kumbh/lost-found/${encodeURIComponent(referenceId)}`;
  }
  if (notification.category === 'trip_planner' && referenceId) {
    return `/kumbh/planner?tripId=${encodeURIComponent(referenceId)}`;
  }
  return '/';
}

async function deliverPush(notification) {
  try {
    const preference = await NotificationPreference.findOne({ recipientId: notification.recipientId }).lean();
    if (preference?.enabled !== true || preference?.pushEnabled !== true) return;
    const categories = preference.categories;
    const categoryPreference = categories instanceof Map ? categories.get(notification.category) : categories?.[notification.category];
    if (categoryPreference === false) return;

    const devices = await NotificationDevice.find({
      recipientId: notification.recipientId,
      isActive: true,
    }).select('+fcmToken').lean();
    if (devices.length === 0) return;

    const messaging = getFirebaseMessaging();
    if (!messaging) return;
    const url = getNotificationUrl(notification);
    const data = {
      notificationId: String(notification._id),
      type: String(notification.type || ''),
      category: String(notification.category || ''),
      referenceId: String(notification.referenceId || ''),
      referenceType: String(notification.referenceType || ''),
      url,
    };

    for (let offset = 0; offset < devices.length; offset += 500) {
      const batch = devices.slice(offset, offset + 500);
      let response;
      try {
        response = await messaging.sendEachForMulticast({
          tokens: batch.map((device) => device.fcmToken),
          data,
        });
      } catch (error) {
        console.warn('[Notifications] FCM batch delivery failed:', error.code || 'unknown');
        continue;
      }
      const invalidDeviceIds = [];
      response.responses.forEach((result, index) => {
        if (result.success) return;
        const errorCode = result.error?.code || 'unknown';
        if (errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token') {
          invalidDeviceIds.push(batch[index]._id);
        } else {
          console.warn('[Notifications] FCM delivery failed:', errorCode);
        }
      });
      if (invalidDeviceIds.length > 0) {
        try {
          await NotificationDevice.updateMany(
            { _id: { $in: invalidDeviceIds } },
            { $set: { isActive: false } }
          );
        } catch (error) {
          console.warn('[Notifications] Invalid FCM token cleanup failed:', error.code || 'unknown');
        }
      }
    }
  } catch (error) {
    console.error('[Notifications] FCM delivery failed:', error.code || 'unknown');
  }
}

async function createNotification(input) {
  const {
    recipientId, type, category, title, message, source = 'AUTOMATED',
    referenceId = null, referenceType = null, metadata = {},
    recipientScope = 'USER', deduplicationKey = null, expiresAt = null,
    scheduledAt = null, status,
  } = input;

  if (source === 'AUTOMATED' && !(await automationIsEnabled(category))) return null;
  if (!(await userCanReceive(recipientId, category))) return null;

  try {
    const notification = await Notification.create({
      recipientId,
      type,
      category,
      title,
      message,
      source,
      referenceId,
      referenceType,
      metadata,
      recipientScope,
      deduplicationKey,
      expiresAt,
      scheduledAt,
      status: status || (scheduledAt && new Date(scheduledAt) > new Date() ? 'PENDING' : 'SENT'),
    });

    if (notification.status === 'SENT') {
      void publishRealtime(recipientId, notification.toObject())
        .catch((error) => console.error('[Notifications] Realtime delivery failed:', error.message));
      void deliverPush(notification.toObject());
    }
    return notification;
  } catch (error) {
    if (error.code === 11000 && deduplicationKey) return null;
    throw error;
  }
}

async function createBulkNotifications(input, recipientIds) {
  const deduplicated = [...new Set(recipientIds)];
  const results = await Promise.allSettled(deduplicated.map((recipientId) =>
    createNotification({ ...input, recipientId })
  ));
  const failed = results.filter((result) => result.status === 'rejected');
  for (const result of failed) {
    console.error('[Notifications] Bulk notification failed:', result.reason);
  }
  return results.filter((result) => result.status === 'fulfilled' && result.value).map((result) => result.value);
}

async function createTripReminder(trip, period) {
  const user = await AppUser.findById(trip.userId).select('_id isActive');
  if (!user || !user.isActive) return null;
  const recipientId = await resolveRecipient('app_user', user._id);
  return createNotification({
    recipientId,
    type: `TRIP_REMINDER_${period.toUpperCase()}`,
    category: 'trip_planner',
    title: period === 'trip_day' ? 'Your trip starts today' : 'Trip reminder',
    message: period === 'seven_days'
      ? `Your trip, ${trip.title}, starts in 7 days.`
      : period === 'one_day'
        ? `Your trip, ${trip.title}, starts tomorrow.`
        : `Your trip, ${trip.title}, starts today.`,
    source: 'AUTOMATED',
    referenceId: String(trip._id),
    referenceType: 'trip',
    deduplicationKey: `trip:${trip._id}:${period}`,
  });
}

async function processScheduledNotifications() {
  const now = new Date();
  const due = await Notification.find({ source: 'SCHEDULED', status: 'PENDING', scheduledAt: { $lte: now } }).limit(100);
  for (const notification of due) {
    const claim = await Notification.findOneAndUpdate(
      { _id: notification._id, status: 'PENDING' },
      { $set: { status: 'SENT' } },
      { new: true }
    );
    if (!claim) continue;
    try {
      if (!(await userCanReceive(claim.recipientId, claim.category))) {
        await Notification.updateOne({ _id: claim._id }, { $set: { status: 'CANCELLED' } });
        continue;
      }
      await publishRealtime(claim.recipientId, claim.toObject());
      void deliverPush(claim.toObject());
    } catch (error) {
      console.error('[Notifications] Scheduled notification delivery failed:', error);
      await Notification.updateOne({ _id: claim._id }, { $set: { status: 'FAILED' } });
    }
  }
}

async function processTripReminders() {
  const KumbhTrip = require('../models/KumbhTrip');
  const settings = await getSettings();
  if (!settings.globalAutomationEnabled || !settings.categories.tripPlanner) return;

  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const today = `${dateParts.find((part) => part.type === 'year').value}-${dateParts.find((part) => part.type === 'month').value}-${dateParts.find((part) => part.type === 'day').value}`;
  const periods = [
    { key: 'sevenDays', code: 'seven_days', days: 7 },
    { key: 'oneDay', code: 'one_day', days: 1 },
    { key: 'tripDay', code: 'trip_day', days: 0 },
  ].filter((period) => settings.tripReminders[period.key]);
  for (const period of periods) {
    const target = new Date(`${today}T00:00:00Z`);
    target.setUTCDate(target.getUTCDate() + period.days);
    const date = target.toISOString().slice(0, 10);
    const trips = await KumbhTrip.find({ status: { $in: ['planned', 'active'] }, startDate: date }).limit(1000);
    for (const trip of trips) {
      try {
        await createTripReminder(trip, period.code);
      } catch (error) {
        console.error(`[Notifications] Trip reminder failed for ${trip._id}:`, error);
      }
    }
  }
}

function startNotificationScheduler() {
  const run = async () => {
    try {
      await processScheduledNotifications();
      await processTripReminders();
    } catch (error) {
      console.error('[Notifications] Scheduler iteration failed:', error);
    }
  };
  void run();
  const timer = setInterval(() => void run(), 60 * 1000);
  timer.unref();
  return timer;
}

async function createManualBatch({ recipients, category, title, message, recipientScope, referenceId, referenceType, expiresAt, scheduledAt }) {
  const batchId = randomUUID();
  const source = scheduledAt && new Date(scheduledAt) > new Date() ? 'SCHEDULED' : 'MANUAL';
  return createBulkNotifications({
    type: 'ADMIN_MESSAGE',
    category,
    title,
    message,
    source,
    referenceId: referenceId || null,
    referenceType: referenceType || null,
    recipientScope,
    batchId,
    expiresAt: expiresAt || null,
    scheduledAt: scheduledAt || null,
  }, recipients);
}

async function findAllRecipientIds() {
  const users = await Promise.all([
    User.find({}).select('_id').lean(),
    AppUser.find({ isActive: true }).select('_id').lean(),
  ]);
  return Promise.all([
    ...users[0].map((user) => resolveRecipient('platform', user._id)),
    ...users[1].map((user) => resolveRecipient('app_user', user._id)),
  ]);
}

module.exports = {
  resolveRecipient,
  getSettings,
  findLegacyGroup,
  automationIsEnabled,
  createNotification,
  createBulkNotifications,
  createTripReminder,
  processScheduledNotifications,
  processTripReminders,
  startNotificationScheduler,
  createManualBatch,
  findAllRecipientIds,
  publishRealtime,
  publishChannel,
  deliverPush,
};

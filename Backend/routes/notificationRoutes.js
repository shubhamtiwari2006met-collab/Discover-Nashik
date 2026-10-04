const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificationController');
const { resolveNotificationIdentity, requireNotificationIdentity } = require('../middleware/notificationIdentity');

router.use(resolveNotificationIdentity, requireNotificationIdentity);
router.get('/', controller.getUserNotifications);
router.get('/unread-count', controller.getUnreadCount);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', controller.markRead);
router.get('/preferences', controller.getPreferences);
router.patch('/preferences', controller.updatePreferences);
router.post('/push/register', controller.registerPushDevice);
router.delete('/push/devices', controller.disablePushDevices);

module.exports = router;

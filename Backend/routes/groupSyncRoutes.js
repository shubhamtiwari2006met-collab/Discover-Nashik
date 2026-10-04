const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificationController');
const { resolveNotificationIdentity } = require('../middleware/notificationIdentity');

router.use(resolveNotificationIdentity);
router.post('/groups', controller.registerGroup);
router.post('/groups/:groupCode/join', controller.joinGroup);
router.post('/groups/:groupCode/sync', controller.syncGroupMembership);
router.get('/groups/:groupCode/members', controller.getGroupMembers);
router.post('/groups/:groupCode/messages', controller.syncGroupMessage);
router.post('/groups/:groupCode/leave', controller.leaveGroup);

module.exports = router;

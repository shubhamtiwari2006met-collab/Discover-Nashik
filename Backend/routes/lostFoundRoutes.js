const express = require("express");
const router = express.Router();
const { authenticate, optionalAuthenticate, requireRoles } = require("../middleware/auth");
const {
  getPublicReports,
  getReportById,
  createReport,
  submitInquiry,
  getPublicInquiries,
  updateReportStatus,
  getUnreadNotificationsCount,
  markInquiriesAsRead,
  getAdminReports,
  getAdminInquiries,
  adminDeleteInquiry,
  adminDeleteReport,
} = require("../controllers/lostFoundController");

// Notification endpoint (must be before /:id)
router.get("/notifications/unread-count", authenticate, getUnreadNotificationsCount);

// Admin endpoints
router.get("/admin/all", authenticate, requireRoles("admin"), getAdminReports);
router.patch("/admin/:id/status", authenticate, requireRoles("admin"), updateReportStatus);
router.get("/admin/:id/inquiries", authenticate, requireRoles("admin"), getAdminInquiries);
router.delete("/admin/inquiries/:inquiryId", authenticate, requireRoles("admin"), adminDeleteInquiry);
router.delete("/admin/reports/:id", authenticate, requireRoles("admin"), adminDeleteReport);

// Public / Soft-authenticated endpoints
router.get("/", optionalAuthenticate, getPublicReports);
router.post("/", optionalAuthenticate, createReport);
router.get("/:id", optionalAuthenticate, getReportById);
router.get("/:id/inquiries", optionalAuthenticate, getPublicInquiries);
router.post("/:id/inquiry", optionalAuthenticate, submitInquiry);

// Authenticated user/owner endpoints
router.patch("/:id/status", authenticate, updateReportStatus);
router.patch("/:id/inquiries/mark-read", authenticate, markInquiriesAsRead);

module.exports = router;

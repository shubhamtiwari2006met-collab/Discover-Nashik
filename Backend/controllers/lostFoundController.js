const mongoose = require("mongoose");
const LostFoundReport = require("../models/LostFoundReport");
const LostFoundInquiry = require("../models/LostFoundInquiry");

const SAMPLE_REPORTS = [];

// Helper to strip sensitive reporter contact details for public view
function sanitizePublicReport(doc, currentUserId, isAdmin) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };

  const isOwner = currentUserId && obj.reporterContact && obj.reporterContact.userId === currentUserId;

  // Expose flags to frontend
  obj.isOwner = Boolean(isOwner);
  obj.canUpdateStatus = Boolean(isOwner || isAdmin);

  if (!isAdmin && !isOwner) {
    delete obj.reporterContact;
  }
  return obj;
}

// Helper to sanitize inquiry for public display
function sanitizePublicInquiry(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };

  const safeName = obj.reporterContact?.name?.trim() || "Community Member";

  // Obfuscate contact information completely for public callers
  obj.authorLabel = safeName;
  delete obj.reporterContact;
  return obj;
}

async function purgeSampleReportsFromDb() {
  try {
    await LostFoundReport.deleteMany({
      $or: [
        { reportId: { $in: ["LF-2027-2678", "LF-2027-1042", "LF-2027-5890"] } },
        { title: { $regex: /Ramesh Sharma|Leather Wallet|Aarav/i } },
        { _id: { $in: ["65d100000000000000002678", "65d100000000000000001042", "65d100000000000000005890"] } }
      ],
    });
  } catch (err) {}
}

// 1. GET /api/kumbh/lost-found — Public published reports
exports.getPublicReports = async (req, res) => {
  try {
    await purgeSampleReportsFromDb();
    const { reportType, category, search, status, page = 1, limit = 30 } = req.query;

    const query = {
      status: { $nin: ["rejected"] },
    };

    if (reportType) query.reportType = reportType;
    if (category && category !== "all") query.category = category;
    if (status && status !== "all") query.status = status;

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { "location.areaName": searchRegex },
        { "personDetails.name": searchRegex },
        { "itemDetails.itemName": searchRegex },
      ];
    }

    const currentUserId = req.user ? req.user.supabaseId : null;
    const isAdmin = req.user && req.user.role === "admin";

    let reports = [];
    let total = 0;

    try {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      [reports, total] = await Promise.all([
        LostFoundReport.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
        LostFoundReport.countDocuments(query),
      ]);
    } catch (dbErr) {
      console.warn("DB lookup warning:", dbErr.message);
    }

    let sanitized = reports.map((r) => sanitizePublicReport(r, currentUserId, isAdmin));

    res.json({ reports: sanitized, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching public reports:", error);
    res.json({ reports: [], total: 0, page: 1, pages: 1 });
  }
};

// 2. GET /api/kumbh/lost-found/:id — Single public report details
exports.getReportById = async (req, res) => {
  try {
    const targetId = req.params.id;
    const isObjectId = mongoose.Types.ObjectId.isValid(targetId);
    const query = isObjectId
      ? { $or: [{ _id: targetId }, { reportId: targetId }] }
      : { reportId: targetId };

    let report = null;
    try {
      report = await LostFoundReport.findOne(query);
    } catch (dbErr) {
      console.warn("DB lookup error in getReportById:", dbErr.message);
    }

    const currentUserId = req.user ? req.user.supabaseId : null;
    const isAdmin = req.user && req.user.role === "admin";

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (!isAdmin && report.status === "rejected") {
      return res.status(403).json({ message: "Report is not publicly accessible" });
    }

    const sanitizedReport = sanitizePublicReport(report, currentUserId, isAdmin);

    try {
      const inquiries = await LostFoundInquiry.find({
        $or: [
          { reportId: report._id },
          { reportId: report._id.toString() },
          { reportId: report.reportId },
        ],
        isPublic: { $ne: false },
        status: { $ne: "archived" },
        moderationStatus: { $ne: "rejected" },
      }).sort({ createdAt: -1 });

      sanitizedReport.inquiries = inquiries.map(sanitizePublicInquiry);
    } catch (inqErr) {
      sanitizedReport.inquiries = [];
    }

    return res.json(sanitizedReport);
  } catch (error) {
    console.error("Error fetching report by ID:", error);
    res.status(500).json({ message: "Failed to fetch report details" });
  }
};

// 3. POST /api/kumbh/lost-found — Submit a new Lost & Found report
exports.createReport = async (req, res) => {
  try {
    const {
      reportType,
      category,
      title,
      description,
      photoUrl,
      personDetails,
      itemDetails,
      location,
      reporterContact,
    } = req.body;

    if (!reportType || !category || !title || !description || !location?.areaName) {
      return res.status(400).json({ message: "Required fields missing: reportType, category, title, description, and area location are required." });
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const reportId = `LF-2027-${randomNum}`;

    const newReport = new LostFoundReport({
      reportId,
      reportType,
      category,
      title: title.trim(),
      description: description.trim(),
      photoUrl: photoUrl || "",
      personDetails: personDetails || {},
      itemDetails: itemDetails || {},
      location: {
        areaName: location.areaName.trim(),
        landmark: (location.landmark || "").trim(),
        latitude: location.latitude ? Number(location.latitude) : null,
        longitude: location.longitude ? Number(location.longitude) : null,
        incidentDate: location.incidentDate || "",
        incidentTime: location.incidentTime || "",
      },
      reporterContact: {
        name: (reporterContact?.name || (req.user ? req.user.name : "Visitor")).trim(),
        phone: (reporterContact?.phone || "").trim(),
        email: (reporterContact?.email || (req.user ? req.user.email : "")).trim(),
        userId: req.user ? req.user.supabaseId : (reporterContact?.userId || ""),
      },
      status: "published",
      publishedAt: new Date(),
      statusHistory: [
        {
          status: "published",
          updatedBy: req.user ? req.user.name || "Reporter" : "Visitor",
          updatedAt: new Date(),
          notes: "Initial report published",
        },
      ],
    });

    await newReport.save();

    res.status(201).json({
      message: "Report submitted successfully and is now publicly visible.",
      reportId: newReport.reportId,
      status: newReport.status,
    });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ message: "Failed to submit report" });
  }
};

// 4. POST /api/kumbh/lost-found/:id/inquiry — Submit sighting / tip on a report
exports.submitInquiry = async (req, res) => {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const query = isObjectId
      ? { $or: [{ _id: req.params.id }, { reportId: req.params.id }] }
      : { reportId: req.params.id };

    const report = await LostFoundReport.findOne(query);

    if (!report) {
      return res.status(404).json({ message: "Target report not found" });
    }

    const { inquiryType, message, photoUrl, reporterContact } = req.body;

    if (!inquiryType || !message) {
      return res.status(400).json({ message: "Inquiry type and message are required." });
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const inquiryId = `INQ-${randomNum}`;

    const inquiry = new LostFoundInquiry({
      inquiryId,
      reportId: report._id,
      inquiryType,
      message: message.trim(),
      photoUrl: photoUrl || "",
      reporterContact: {
        name: (reporterContact?.name || (req.user ? req.user.name : "Community Member")).trim(),
        phone: (reporterContact?.phone || "").trim(),
        email: (reporterContact?.email || (req.user ? req.user.email : "")).trim(),
        userId: req.user ? req.user.supabaseId : "",
      },
      status: "pending",
      isReadByOwner: false,
      isPublic: true,
      moderationStatus: "approved",
    });

    await inquiry.save();

    res.status(201).json({
      message: "Thank you! Your inquiry/information has been submitted successfully.",
      inquiryId,
    });
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    res.status(500).json({ message: "Failed to submit inquiry" });
  }
};

// 5. GET /api/kumbh/lost-found/:id/inquiries — Public list of inquiries/updates for a report
exports.getPublicInquiries = async (req, res) => {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const query = isObjectId
      ? { $or: [{ _id: req.params.id }, { reportId: req.params.id }] }
      : { reportId: req.params.id };

    const report = await LostFoundReport.findOne(query);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const inquiries = await LostFoundInquiry.find({
      $or: [
        { reportId: report._id },
        { reportId: report._id.toString() },
        { reportId: report.reportId },
      ],
      isPublic: { $ne: false },
      status: { $ne: "archived" },
      moderationStatus: { $ne: "rejected" },
    }).sort({ createdAt: -1 });

    const sanitized = inquiries.map(sanitizePublicInquiry);
    res.json(sanitized);
  } catch (error) {
    console.error("Error fetching public inquiries:", error);
    res.status(500).json({ message: "Failed to load inquiries" });
  }
};

// 6. PATCH /api/kumbh/lost-found/:id/status — Mark report status (Found/Resolved)
// Strictly authorized: Report Owner OR Admin
exports.updateReportStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { status, adminNotes } = req.body;

    if (!["pending", "under_verification", "published", "resolved", "rejected", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const query = isObjectId
      ? { $or: [{ _id: req.params.id }, { reportId: req.params.id }] }
      : { reportId: req.params.id };

    const report = await LostFoundReport.findOne(query);

    if (!report) {
      const sample = SAMPLE_REPORTS.find((s) => s._id === req.params.id || s.reportId === req.params.id);
      if (sample) {
        return res.json({
          message: `Report status updated to ${status} (Simulated on sample data)`,
          report: { ...sample, status },
        });
      }
      return res.status(404).json({ message: "Report not found" });
    }

    const isAdmin = req.user.role === "admin";
    const isOwner = req.user.supabaseId && report.reporterContact?.userId === req.user.supabaseId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Only the report owner or an administrator can update report status." });
    }

    const updaterLabel = isAdmin ? `Admin (${req.user.name || req.user.email})` : `Report Owner (${req.user.name || "Owner"})`;

    const updateFields = {
      status,
      adminNotes: adminNotes ? adminNotes.trim() : report.adminNotes,
      reviewedBy: updaterLabel,
    };

    if (status === "published") {
      updateFields.publishedAt = report.publishedAt || new Date();
    } else if (status === "resolved") {
      updateFields.resolvedAt = new Date();
    }

    const updated = await LostFoundReport.findOneAndUpdate(
      query,
      {
        $set: updateFields,
        $push: {
          statusHistory: {
            status,
            updatedBy: updaterLabel,
            updatedAt: new Date(),
            notes: adminNotes ? adminNotes.trim() : `Status marked as ${status}`,
          },
        },
      },
      { new: true }
    );

    res.json({
      message: `Report status updated to ${status}`,
      report: sanitizePublicReport(updated, req.user.supabaseId, isAdmin),
    });
  } catch (error) {
    console.error("Error updating report status:", error);
    res.status(500).json({ message: "Failed to update report status" });
  }
};

// 7. GET /api/kumbh/lost-found/notifications/unread-count — Unread inquiry count for logged-in report owner
exports.getUnreadNotificationsCount = async (req, res) => {
  try {
    if (!req.user || !req.user.supabaseId) {
      return res.json({ unreadCount: 0 });
    }

    // Find all reports owned by the logged in user
    const userReports = await LostFoundReport.find({
      "reporterContact.userId": req.user.supabaseId,
    }).select("_id");

    if (!userReports.length) {
      return res.json({ unreadCount: 0 });
    }

    const reportIds = userReports.map((r) => r._id);

    // Count unread inquiries on user's reports
    const unreadCount = await LostFoundInquiry.countDocuments({
      reportId: { $in: reportIds },
      isReadByOwner: false,
      status: { $ne: "archived" },
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    res.status(500).json({ unreadCount: 0 });
  }
};

// 8. PATCH /api/kumbh/lost-found/:id/inquiries/mark-read — Mark inquiries on a report as read by owner
exports.markInquiriesAsRead = async (req, res) => {
  try {
    if (!req.user || !req.user.supabaseId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const query = isObjectId
      ? { $or: [{ _id: req.params.id }, { reportId: req.params.id }] }
      : { reportId: req.params.id };

    const report = await LostFoundReport.findOne(query);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const isAdmin = req.user.role === "admin";
    const isOwner = report.reporterContact?.userId === req.user.supabaseId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await LostFoundInquiry.updateMany(
      { reportId: report._id, isReadByOwner: false },
      { $set: { isReadByOwner: true } }
    );

    res.json({ message: "Inquiries marked as read" });
  } catch (error) {
    console.error("Error marking inquiries as read:", error);
    res.status(500).json({ message: "Failed to mark inquiries as read" });
  }
};

// 9. GET /api/kumbh/lost-found/admin/all — Admin list all reports
exports.getAdminReports = async (req, res) => {
  try {
    await purgeSampleReportsFromDb();
    const { status, reportType, category } = req.query;
    const query = {};

    if (status && status !== "all") query.status = status;
    if (reportType) query.reportType = reportType;
    if (category && category !== "all") query.category = category;

    const reports = await LostFoundReport.find(query).sort({ createdAt: -1 });
    res.json(reports || []);
  } catch (error) {
    console.error("Error fetching admin reports:", error);
    res.status(500).json({ message: "Failed to load admin reports" });
  }
};

// 10. GET /api/kumbh/lost-found/admin/:id/inquiries — Admin get inquiries for a report
exports.getAdminInquiries = async (req, res) => {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const query = isObjectId
      ? { $or: [{ _id: req.params.id }, { reportId: req.params.id }] }
      : { reportId: req.params.id };

    const report = await LostFoundReport.findOne(query);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const inquiries = await LostFoundInquiry.find({
      $or: [
        { reportId: report._id },
        { reportId: report._id.toString() },
        { reportId: report.reportId },
      ],
    }).sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (error) {
    console.error("Error fetching admin inquiries:", error);
    res.status(500).json({ message: "Failed to load inquiries" });
  }
};

// 11. DELETE /api/kumbh/lost-found/admin/inquiries/:inquiryId — Admin delete / moderate inquiry
exports.adminDeleteInquiry = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const inquiry = await LostFoundInquiry.findOneAndDelete({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(inquiryId) ? inquiryId : null }, { inquiryId }],
    });

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    res.json({ message: "Inquiry removed successfully" });
  } catch (error) {
    console.error("Error deleting inquiry:", error);
    res.status(500).json({ message: "Failed to delete inquiry" });
  }
};

// 12. DELETE /api/kumbh/lost-found/admin/reports/:id — Admin delete Lost & Found report
exports.adminDeleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { reportId: id }] } : { reportId: id };

    const report = await LostFoundReport.findOneAndDelete(query);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Delete associated inquiries as well
    await LostFoundInquiry.deleteMany({
      $or: [
        { reportId: report._id },
        { reportId: report._id.toString() },
        { reportId: report.reportId },
      ],
    });

    res.json({ message: "Report deleted successfully", deletedId: report._id });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ message: "Failed to delete report" });
  }
};


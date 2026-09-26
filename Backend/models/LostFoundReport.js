const mongoose = require("mongoose");

const LostFoundReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reportType: {
      type: String,
      enum: ["lost", "found"],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        "missing_child",
        "missing_elderly",
        "found_child",
        "found_elderly",
        "lost_valuable",
        "found_valuable",
        "other",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    photoUrl: {
      type: String,
      default: "",
    },
    // Details for missing or found persons
    personDetails: {
      name: { type: String, default: "" },
      age: { type: String, default: "" },
      gender: { type: String, default: "" },
      clothing: { type: String, default: "" },
      identifyingMarks: { type: String, default: "" },
    },
    // Details for lost or found items
    itemDetails: {
      itemName: { type: String, default: "" },
      itemType: { type: String, default: "" },
      color: { type: String, default: "" },
      identifyingMarks: { type: String, default: "" },
      approxValue: { type: String, default: "" },
    },
    // Location details
    location: {
      areaName: { type: String, required: true }, // e.g. Panchavati, Ram Kund
      landmark: { type: String, default: "" },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      incidentDate: { type: String, default: "" },
      incidentTime: { type: String, default: "" },
    },
    // Reporter's contact (KEPT STRICTLY PRIVATE — ADMIN ONLY)
    reporterContact: {
      name: { type: String, default: "Anonymous" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      userId: { type: String, default: "" },
    },
    // Report statuses
    status: {
      type: String,
      enum: ["pending", "under_verification", "published", "resolved", "rejected", "closed"],
      default: "pending",
      index: true,
    },
    adminNotes: {
      type: String,
      default: "",
    },
    reviewedBy: {
      type: String,
      default: "",
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        updatedBy: { type: String, default: "system" },
        updatedAt: { type: Date, default: Date.now },
        notes: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

LostFoundReportSchema.index({ "reporterContact.userId": 1 });

module.exports = mongoose.model("LostFoundReport", LostFoundReportSchema);

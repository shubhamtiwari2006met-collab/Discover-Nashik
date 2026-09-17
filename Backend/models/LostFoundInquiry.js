const mongoose = require("mongoose");

const LostFoundInquirySchema = new mongoose.Schema(
  {
    inquiryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LostFoundReport",
      required: true,
      index: true,
    },
    inquiryType: {
      type: String,
      enum: ["sighting", "found_match", "additional_info", "incorrect_info", "resolved_claim", "other"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    photoUrl: {
      type: String,
      default: "",
    },
    reporterContact: {
      name: { type: String, default: "Visitor" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      userId: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "archived"],
      default: "pending",
      index: true,
    },
    isReadByOwner: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    moderationStatus: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("LostFoundInquiry", LostFoundInquirySchema);

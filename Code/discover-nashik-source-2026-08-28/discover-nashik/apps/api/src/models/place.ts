import { HydratedDocument, InferSchemaType, Model, Schema, model, models } from "mongoose";

export const PLACE_CATEGORIES = [
  "temple",
  "ghat",
  "food",
  "hotel",
  "nature",
  "vineyard",
  "trek",
  "shopping",
  "parking",
  "hospital",
  "transport",
  "essential"
] as const;

const pointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], required: true, default: "Point" },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (coordinates: number[]) =>
          coordinates.length === 2 &&
          coordinates[0] >= -180 && coordinates[0] <= 180 &&
          coordinates[1] >= -90 && coordinates[1] <= 90,
        message: "Coordinates must be [longitude, latitude]."
      }
    }
  },
  { _id: false }
);

const translationSchema = new Schema(
  {
    language: { type: String, enum: ["en", "hi", "mr"], required: true },
    name: { type: String, required: true, trim: true },
    shortDescription: { type: String, trim: true },
    description: { type: String, trim: true }
  },
  { _id: false }
);

const placeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, enum: PLACE_CATEGORIES, required: true, index: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    shortDescription: { type: String, required: true, trim: true, maxlength: 240 },
    description: { type: String, trim: true, maxlength: 4000 },
    translations: [translationSchema],
    location: { type: pointSchema, required: true, index: "2dsphere" },
    address: { type: String, required: true, trim: true },
    area: { type: String, trim: true, index: true },
    timings: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    website: { type: String, trim: true },
    photos: [{ type: String, trim: true }],
    facilities: [{ type: String, trim: true }],
    highlights: [{ type: String, trim: true }],
    kumbhRelevant: { type: Boolean, default: false, index: true },
    featured: { type: Boolean, default: false, index: true },
    verificationStatus: {
      type: String,
      enum: ["community", "verified", "official"],
      default: "community",
      index: true
    },
    sourceName: { type: String, trim: true },
    sourceUrl: { type: String, trim: true },
    lastVerifiedAt: { type: Date },
    published: { type: Boolean, default: true, index: true }
  },
  { timestamps: true, versionKey: false }
);

placeSchema.index({ name: "text", area: "text", tags: "text", shortDescription: "text" });
placeSchema.index({ category: 1, published: 1, featured: 1 });

export type Place = InferSchemaType<typeof placeSchema>;
export type PlaceDocument = HydratedDocument<Place>;

export const PlaceModel: Model<Place> =
  (models.Place as Model<Place>) || model<Place>("Place", placeSchema);

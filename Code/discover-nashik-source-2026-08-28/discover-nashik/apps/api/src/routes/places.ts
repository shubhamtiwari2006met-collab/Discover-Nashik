import { Router } from "express";
import type { FilterQuery } from "mongoose";
import { Place, PlaceModel } from "../models/place.js";
import { requireAdmin } from "../middleware.js";
import { createPlaceSchema, updatePlaceSchema } from "../validation.js";

const router = Router();
const maximumLimit = 100;

function getLimit(value: unknown, fallback = 24) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(Math.max(Math.floor(number), 1), maximumLimit) : fallback;
}

router.get("/categories", async (_request, response, next) => {
  try {
    const categories = await PlaceModel.aggregate([
      { $match: { published: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { _id: 0, slug: "$_id", count: 1 } },
      { $sort: { slug: 1 } }
    ]);
    response.json({ data: categories });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (request, response, next) => {
  try {
    const { q, category, area, featured, kumbh, lat, lng, maxDistance } = request.query;
    const filter: FilterQuery<Place> = { published: true };
    if (typeof category === "string") filter.category = category;
    if (typeof area === "string") filter.area = new RegExp(area, "i");
    if (featured === "true") filter.featured = true;
    if (kumbh === "true") filter.kumbhRelevant = true;
    if (typeof q === "string" && q.trim()) filter.$text = { $search: q.trim() };

    const latitude = Number(lat);
    const longitude = Number(lng);
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
    if (hasCoordinates) {
      filter.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          $maxDistance: Math.min(Math.max(Number(maxDistance) || 10000, 250), 50000)
        }
      };
    }

    let query = PlaceModel.find(filter).limit(getLimit(request.query.limit));
    if (!hasCoordinates) {
      query = typeof q === "string" && q.trim()
        ? query.sort({ score: { $meta: "textScore" } })
        : query.sort({ featured: -1, verificationStatus: -1, name: 1 });
    }
    const places = await query.lean();
    response.json({ data: places, count: places.length });
  } catch (error) {
    next(error);
  }
});

router.get("/:slug", async (request, response, next) => {
  try {
    const place = await PlaceModel.findOne({ slug: request.params.slug, published: true }).lean();
    if (!place) return response.status(404).json({ error: "Place not found." });
    response.json({ data: place });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAdmin, async (request, response, next) => {
  try {
    const data = createPlaceSchema.parse(request.body);
    const place = await PlaceModel.create(data);
    response.status(201).json({ data: place });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAdmin, async (request, response, next) => {
  try {
    const data = updatePlaceSchema.parse(request.body);
    const place = await PlaceModel.findByIdAndUpdate(request.params.id, data, { new: true, runValidators: true });
    if (!place) return response.status(404).json({ error: "Place not found." });
    response.json({ data: place });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAdmin, async (request, response, next) => {
  try {
    const place = await PlaceModel.findByIdAndDelete(request.params.id);
    if (!place) return response.status(404).json({ error: "Place not found." });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

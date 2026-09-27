// app/api/business/category-data/route.ts
// Handles data storage for ALL non-hotel business categories:
// Food & Restaurants, Grocery Stores, Travel & Transport, Shopping & Retail, Healthcare / Doctors
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

// ─── SHARED TYPES ──────────────────────────────────────────────
export type Review = {
  id: string;
  reviewerName: string;
  rating: number;
  date: string;
  comment: string;
  ownerReply?: string;
  ownerReplyDate?: string;
};

export type Offer = {
  id: string;
  title: string;
  description: string;
  discountText: string;
  originalPrice?: number;
  offerPrice?: number;
  validFrom: string;
  validUntil: string;
  terms: string;
  imageUrl?: string;
  enabled: boolean;
};

export type CategoryStats = {
  profileViews: number;
  contactClicks: number;
  directionClicks: number;
  offerViews: number;
  prevProfileViews: number;
  prevContactClicks: number;
  prevDirectionClicks: number;
  prevOfferViews: number;
};

// ─── FOOD & RESTAURANT TYPES ──────────────────────────────────
export type FoodVariant = {
  label: string;
  price: number;
};

export type FoodItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  photo: string;
  price: number;
  servingSize: string;
  dietaryType: "veg" | "non-veg" | "egg" | "vegan" | "jain";
  spicyLevel: "Mild" | "Medium" | "Spicy" | "Extra Spicy";
  isBestseller: boolean;
  isChefSpecial: boolean;
  isNew: boolean;
  isSeasonal: boolean;
  available: boolean;
  variants: FoodVariant[];
  ingredients?: string;
  allergyInfo?: string;
};

export type FoodData = {
  businessId: string;
  items: FoodItem[];
  menuCategories: string[];
  cuisineTypes: string[];
  priceRange: string;
  seatingCapacity: number;
  diningOptions: string[];
  timings: {
    breakfastTimes: string;
    lunchTimes: string;
    dinnerTimes: string;
    weeklyClosedDay: string;
    temporaryClosureNotice: string;
  };
  restaurantInfo: {
    reservationContact: string;
  };
  offers: Offer[];
  reviews: Review[];
  stats: CategoryStats;
};

// ─── GROCERY STORE TYPES ──────────────────────────────────────
export type GroceryProduct = {
  id: string;
  name: string;
  category: string;
  brand: string;
  description: string;
  photo: string;
  price: number;
  unit: string;
  packSize: string;
  stockStatus: "In Stock" | "Low Stock" | "Out of Stock" | "Temporarily Unavailable";
  available: boolean;
};

export type GroceryData = {
  businessId: string;
  products: GroceryProduct[];
  storeInfo: {
    homeDelivery: boolean;
    pickupAvailable: boolean;
    parkingAvailable: boolean;
    deliveryArea: string;
    minOrderAmount: number;
    paymentMethods: string[];
    weeklyClosedDay: string;
    accessibility: string;
  };
  offers: Offer[];
  reviews: Review[];
  stats: CategoryStats;
};

// ─── TRAVEL & TRANSPORT TYPES ─────────────────────────────────
export type TransportRoute = {
  id: string;
  routeName: string;
  startingPoint: string;
  destination: string;
  stops: string;
  duration: string;
  indicativeFare: string;
  operatingDays: string;
  firstService: string;
  lastService: string;
};

export type TransportVehicle = {
  id: string;
  modelName: string;
  vehicleType: string;
  seatingCapacity: number;
  isAC: boolean;
  luggageCapacity: string;
  indicativeRate: string;
  photos: string[];
  accessibility: string;
};

export type TourPackage = {
  id: string;
  title: string;
  duration: string;
  placesCovered: string;
  itinerary: string;
  price: number;
  inclusions: string;
  exclusions: string;
  vehicleType: string;
  photos: string[];
  validUntil: string;
  terms: string;
  enabled: boolean;
};

export type TransportData = {
  businessId: string;
  serviceType: string;
  operatingArea: string;
  routes: TransportRoute[];
  vehicles: TransportVehicle[];
  tourPackages: TourPackage[];
  availabilityStatus: "Available" | "Limited Availability" | "Temporarily Unavailable" | "Not Operating";
  offers: Offer[];
  reviews: Review[];
  stats: CategoryStats;
};

// ─── SHOPPING & RETAIL TYPES ──────────────────────────────────
export type ProductVariant = {
  label: string;
  value: string;
  priceAdjustment: number;
};

export type ShoppingProduct = {
  id: string;
  name: string;
  category: string;
  brand: string;
  description: string;
  photos: string[];
  price: number;
  sku: string;
  status: "Available" | "Out of Stock" | "Coming Soon" | "Discontinued";
  collection: string;
  variants: ProductVariant[];
};

export type ShoppingData = {
  businessId: string;
  products: ShoppingProduct[];
  storeInfo: {
    pickupAvailable: boolean;
    deliveryAvailable: boolean;
    parkingAvailable: boolean;
    paymentMethods: string[];
    weeklyClosedDay: string;
    accessibility: string;
  };
  brands: string[];
  offers: Offer[];
  reviews: Review[];
  stats: CategoryStats;
};

// ─── HEALTHCARE / DOCTOR TYPES ────────────────────────────────
export type DoctorService = {
  id: string;
  serviceName: string;
  description: string;
  fee: number;
};

export type ConsultationDay = {
  day: string;
  isClosed: boolean;
  morningSession: string;
  eveningSession: string;
};

export type DoctorData = {
  businessId: string;
  doctorName: string;
  profilePhoto: string;
  specialization: string;
  qualifications: string;
  experienceYears: number;
  languages: string[];
  bio: string;
  registrationInfo: string;
  professionalMemberships: string;
  clinicName: string;
  clinicAddress: string;
  clinicFloor: string;
  clinicLandmark: string;
  clinicAccessibility: string;
  clinicParking: string;
  consultationModes: string[];
  emergencyCareAvailable: boolean;
  firstConsultationFee: number;
  followUpFee: number;
  services: DoctorService[];
  consultationHours: ConsultationDay[];
  offers: Offer[];
  reviews: Review[];
  stats: CategoryStats;
};

// ─── UNION TYPE ───────────────────────────────────────────────
export type CategoryData = FoodData | GroceryData | TransportData | ShoppingData | DoctorData;

// ─── IN-MEMORY STORE ──────────────────────────────────────────
const categoryDataStore = new Map<string, any>();

function getDefaultStats(): CategoryStats {
  return {
    profileViews: 0,
    contactClicks: 0,
    directionClicks: 0,
    offerViews: 0,
    prevProfileViews: 0,
    prevContactClicks: 0,
    prevDirectionClicks: 0,
    prevOfferViews: 0,
  };
}

function getDefaultConsultationHours(): ConsultationDay[] {
  return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => ({
    day,
    isClosed: day === "Sunday",
    morningSession: day === "Sunday" ? "" : "10:00 AM – 1:00 PM",
    eveningSession: day === "Sunday" ? "" : "5:00 PM – 8:00 PM",
  }));
}

function getInitialData(businessId: string, category: string): any {
  const cat = category.toLowerCase();

  if (cat.includes("food") || cat.includes("restaurant")) {
    return {
      businessId,
      items: [],
      menuCategories: ["Starters", "Main Course", "Breads & Rice", "Snacks", "Beverages & Desserts", "Thali", "Breakfast"],
      cuisineTypes: [],
      priceRange: "₹₹",
      seatingCapacity: 0,
      diningOptions: [],
      timings: {
        breakfastTimes: "",
        lunchTimes: "",
        dinnerTimes: "",
        weeklyClosedDay: "",
        temporaryClosureNotice: "",
      },
      restaurantInfo: { reservationContact: "" },
      offers: [],
      reviews: [],
      stats: getDefaultStats(),
    } satisfies FoodData;
  }

  if (cat.includes("grocery")) {
    return {
      businessId,
      products: [],
      storeInfo: {
        homeDelivery: false,
        pickupAvailable: false,
        parkingAvailable: false,
        deliveryArea: "",
        minOrderAmount: 0,
        paymentMethods: [],
        weeklyClosedDay: "",
        accessibility: "",
      },
      offers: [],
      reviews: [],
      stats: getDefaultStats(),
    } satisfies GroceryData;
  }

  if (cat.includes("travel") || cat.includes("transport")) {
    return {
      businessId,
      serviceType: "",
      operatingArea: "",
      routes: [],
      vehicles: [],
      tourPackages: [],
      availabilityStatus: "Available",
      offers: [],
      reviews: [],
      stats: getDefaultStats(),
    } satisfies TransportData;
  }

  if (cat.includes("shopping") || cat.includes("retail")) {
    return {
      businessId,
      products: [],
      storeInfo: {
        pickupAvailable: false,
        deliveryAvailable: false,
        parkingAvailable: false,
        paymentMethods: [],
        weeklyClosedDay: "",
        accessibility: "",
      },
      brands: [],
      offers: [],
      reviews: [],
      stats: getDefaultStats(),
    } satisfies ShoppingData;
  }

  if (cat.includes("doctor") || cat.includes("health")) {
    return {
      businessId,
      doctorName: "",
      profilePhoto: "",
      specialization: "",
      qualifications: "",
      experienceYears: 0,
      languages: [],
      bio: "",
      registrationInfo: "",
      professionalMemberships: "",
      clinicName: "",
      clinicAddress: "",
      clinicFloor: "",
      clinicLandmark: "",
      clinicAccessibility: "",
      clinicParking: "",
      consultationModes: [],
      emergencyCareAvailable: false,
      firstConsultationFee: 0,
      followUpFee: 0,
      services: [],
      consultationHours: getDefaultConsultationHours(),
      offers: [],
      reviews: [],
      stats: getDefaultStats(),
    } satisfies DoctorData;
  }

  // Fallback for unknown categories
  return {
    businessId,
    offers: [],
    reviews: [],
    stats: getDefaultStats(),
  };
}

// ─── GET HANDLER ──────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category") || "";

    if (!id) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    const key = `${id}__${category}`;
    if (!categoryDataStore.has(key)) {
      categoryDataStore.set(key, getInitialData(id, category));
    }

    return NextResponse.json(categoryDataStore.get(key));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch category data" }, { status: 500 });
  }
}

// ─── POST HANDLER ─────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const businessId = String(payload.businessId || "").trim();
    const category = String(payload.category || "").trim();

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    // Public action: Add customer review
    if (payload.action === "add_review") {
      const { reviewerName, rating, comment } = payload;
      if (!reviewerName || !rating || !comment) {
        return NextResponse.json({ error: "Name, rating and comment are required" }, { status: 400 });
      }
      const key = `${businessId}__${category}`;
      const existing = categoryDataStore.get(key) || getInitialData(businessId, category);
      const newReview: Review = {
        id: `rev-${Date.now()}`,
        reviewerName: String(reviewerName).trim(),
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        date: new Date().toISOString().split("T")[0],
        comment: String(comment).trim(),
      };
      existing.reviews = [newReview, ...(existing.reviews || [])];
      categoryDataStore.set(key, existing);
      return NextResponse.json({ success: true, review: newReview, data: existing });
    }

    // Authenticated operations require ownership
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify ownership
    const { data: reg, error: regError } = await supabase
      .from("business_registrations")
      .select("owner_id")
      .eq("id", businessId)
      .maybeSingle();

    if (regError || !reg || reg.owner_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized access to this business profile" }, { status: 403 });
    }

    const key = `${businessId}__${category}`;
    const existing = categoryDataStore.get(key) || getInitialData(businessId, category);

    // Protect customer reviews from being overwritten/modified by owner
    const protectedReviews = (existing.reviews || []).map((r: Review) => {
      const incomingReply = payload.reviews?.find((ir: any) => ir.id === r.id)?.ownerReply;
      return {
        ...r,
        ownerReply: incomingReply !== undefined ? incomingReply : r.ownerReply,
        ownerReplyDate: incomingReply ? new Date().toISOString().split("T")[0] : r.ownerReplyDate,
      };
    });

    const updated = {
      ...existing,
      ...payload,
      businessId,
      reviews: protectedReviews,
      // Protect stats from being overwritten by owner
      stats: existing.stats,
    };

    categoryDataStore.set(key, updated);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update category data" }, { status: 500 });
  }
}

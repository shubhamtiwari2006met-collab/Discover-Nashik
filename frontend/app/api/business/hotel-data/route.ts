// app/api/business/hotel-data/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export type RoomType = {
  id: string;
  name: string;
  description: string;
  photos: string[];
  totalRooms: number;
  price: number;
  isAC: boolean;
  bedType: "Single" | "Double" | "Queen" | "King" | "Twin" | "Other";
  numBeds: number;
  maxGuests: number;
  adultsAllowed: number;
  childrenAllowed: number;
  extraNotes?: string;
  bookedRooms?: number;
};

export type HotelOffer = {
  id: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  originalPrice: number;
  offerPrice: number;
  validFrom: string;
  validUntil: string;
  terms?: string;
  imageUrl?: string;
  enabled: boolean;
};

export type HotelPackage = {
  id: string;
  title: string;
  duration: string;
  inclusions: string;
  packagePrice: number;
  savings?: string;
  validUntil: string;
  terms?: string;
  enabled: boolean;
};

export type GuestReview = {
  id: string;
  reviewerName: string;
  rating: number;
  date: string;
  comment: string;
  ownerReply?: string;
  ownerReplyDate?: string;
};

export type HotelData = {
  businessId: string;
  rooms: RoomType[];
  amenities: string[];
  customAmenities: string[];
  checkInTime: string;
  checkOutTime: string;
  earlyCheckInPolicy?: string;
  lateCheckOutPolicy?: string;
  cancellationPolicy?: string;
  childPolicy?: string;
  extraBedPolicy?: string;
  petPolicy?: string;
  smokingPolicy?: string;
  idRequirements?: string;
  offers: HotelOffer[];
  packages: HotelPackage[];
  reviews: GuestReview[];
  stats: {
    profileViews: number;
    roomViews: number;
    contactClicks: number;
    directionClicks: number;
    offerViews: number;
    prevProfileViews: number;
    prevRoomViews: number;
    prevContactClicks: number;
    prevDirectionClicks: number;
  };
};

// In-memory store fallback mapped by business registration ID
const hotelDataStore = new Map<string, HotelData>();

function getInitialHotelData(businessId: string): HotelData {
  return {
    businessId,
    rooms: [
      {
        id: "room-1",
        name: "Deluxe AC Room",
        description: "Spacious air-conditioned room with king bed, attached bathroom, and city view.",
        photos: [
          "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
        ],
        totalRooms: 10,
        bookedRooms: 4,
        price: 3200,
        isAC: true,
        bedType: "King",
        numBeds: 1,
        maxGuests: 2,
        adultsAllowed: 2,
        childrenAllowed: 1,
        extraNotes: "Complimentary bottled water & morning tea."
      },
      {
        id: "room-2",
        name: "Executive Family Suite",
        description: "Large 2-bed suite ideal for families visiting Nashik and Kumbh Mela.",
        photos: [
          "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80"
        ],
        totalRooms: 5,
        bookedRooms: 2,
        price: 5500,
        isAC: true,
        bedType: "Double",
        numBeds: 2,
        maxGuests: 4,
        adultsAllowed: 4,
        childrenAllowed: 2,
        extraNotes: "Includes mini fridge & seating area."
      }
    ],
    amenities: [
      "AC",
      "Free Wi-Fi",
      "TV",
      "Water Heater / Geyser",
      "Room Service",
      "Parking",
      "24/7 Reception",
      "CCTV / Security",
      "Housekeeping",
      "Power Backup",
      "Attached Bathroom"
    ],
    customAmenities: ["Hot Water Kettles on Demand"],
    checkInTime: "12:00 PM",
    checkOutTime: "11:00 AM",
    earlyCheckInPolicy: "Subject to availability. Standard charge applies before 8:00 AM.",
    lateCheckOutPolicy: "Late check-out up to 2:00 PM allowed upon request.",
    cancellationPolicy: "Free cancellation up to 48 hours before check-in date.",
    childPolicy: "Children under 6 stay free when sharing existing bedding.",
    extraBedPolicy: "Extra mattress available at ₹500 per night.",
    petPolicy: "Pets are not allowed on the property.",
    smokingPolicy: "Non-smoking rooms. Designated smoking area outside.",
    idRequirements: "Government-issued photo ID (Aadhaar, Passport, Driving License) mandatory for all adult guests.",
    offers: [
      {
        id: "offer-1",
        title: "Weekend Special Stay Discount",
        description: "Enjoy 15% flat discount on all Deluxe and Suite rooms for weekend bookings.",
        discountType: "percentage",
        discountValue: 15,
        originalPrice: 3200,
        offerPrice: 2720,
        validFrom: "2026-09-01",
        validUntil: "2026-11-30",
        terms: "Valid on Friday, Saturday, and Sunday bookings only.",
        imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        enabled: true
      }
    ],
    packages: [
      {
        id: "pkg-1",
        title: "3-Day Pilgrimage & Heritage Stay Package",
        duration: "3 Days / 2 Nights",
        inclusions: "Deluxe AC Room, Daily Breakfast, Temple Shuttle Guide, Hot Tea/Coffee",
        packagePrice: 7500,
        savings: "Save ₹1,500 off regular rate",
        validUntil: "2027-01-31",
        terms: "Package valid for up to 2 adults. Additional night at special rate.",
        enabled: true
      }
    ],
    reviews: [
      {
        id: "rev-1",
        reviewerName: "Rohan Sharma",
        rating: 5,
        date: "2026-09-15",
        comment: "Excellent hospitality and clean rooms. Very conveniently located near Panchavati and Godavari ghats.",
        ownerReply: "Thank you Rohan! We are glad you enjoyed your stay with us.",
        ownerReplyDate: "2026-09-16"
      },
      {
        id: "rev-2",
        reviewerName: "Priya Deshmukh",
        rating: 4,
        date: "2026-09-02",
        comment: "Good staff and quick room service. Parking facility was spacious.",
      }
    ],
    stats: {
      profileViews: 1240,
      roomViews: 850,
      contactClicks: 320,
      directionClicks: 240,
      offerViews: 190,
      prevProfileViews: 980,
      prevRoomViews: 620,
      prevContactClicks: 250,
      prevDirectionClicks: 180,
    }
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    if (!hotelDataStore.has(id)) {
      hotelDataStore.set(id, getInitialHotelData(id));
    }

    const data = hotelDataStore.get(id);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch hotel data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const businessId = String(payload.businessId || "").trim();

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    // Public action: Add customer review
    if (payload.action === "add_review") {
      const { reviewerName, rating, comment } = payload;
      if (!reviewerName || !rating || !comment) {
        return NextResponse.json({ error: "Name, rating and comment are required" }, { status: 400 });
      }
      const existing = hotelDataStore.get(businessId) || getInitialHotelData(businessId);
      const newReview: GuestReview = {
        id: `rev-${Date.now()}`,
        reviewerName: String(reviewerName).trim(),
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        date: new Date().toISOString().split("T")[0],
        comment: String(comment).trim(),
      };
      existing.reviews.unshift(newReview);
      hotelDataStore.set(businessId, existing);
      return NextResponse.json({ success: true, review: newReview, data: existing });
    }

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

    const existing = hotelDataStore.get(businessId) || getInitialHotelData(businessId);
    const updated: HotelData = {
      ...existing,
      ...payload,
      businessId,
      // Retain customer reviews from being overwritten/edited
      reviews: existing.reviews.map((r) => {
        const incomingReply = payload.reviews?.find((ir: any) => ir.id === r.id)?.ownerReply;
        return {
          ...r,
          ownerReply: incomingReply !== undefined ? incomingReply : r.ownerReply,
          ownerReplyDate: incomingReply ? new Date().toISOString().split("T")[0] : r.ownerReplyDate,
        };
      }),
    };

    hotelDataStore.set(businessId, updated);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update hotel data" }, { status: 500 });
  }
}

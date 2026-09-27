"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Loader2, Building2, CheckCircle2, Plus, LogOut, FileText, Star,
  BedDouble, Utensils, ShoppingBag, Car, ShoppingCart, Stethoscope, Landmark, Layers,
  Clock, Tag, ShieldCheck, TrendingUp, Calendar, Info, Users, Image as ImageIcon,
  Edit2, Trash2, Check, X, ShieldAlert, AlertCircle, ChevronRight, Eye, Phone, MapPin, Sparkles, MessageSquare
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { parsePhotoList, normalizeImageUrl, DEFAULT_FALLBACK_IMAGE } from "@/lib/imageUrl";
import BusinessHeader from "@/components/BusinessHeader";
import BusinessSidebar from "@/components/BusinessSidebar";
import { RoomType, HotelOffer, HotelPackage, GuestReview, HotelData } from "@/app/api/business/hotel-data/route";
import type {
  FoodItem, FoodData, FoodVariant,
  GroceryProduct, GroceryData,
  TransportRoute, TransportVehicle, TourPackage, TransportData,
  ShoppingProduct, ShoppingData, ProductVariant,
  DoctorService, DoctorData, ConsultationDay,
  Offer, Review, CategoryStats,
} from "@/app/api/business/category-data/route";

type BusinessRegistration = {
  id: string;
  business_name: string;
  category: string;
  subcategory?: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  city_area?: string;
  description?: string;
  opening_time?: string;
  closing_time?: string;
  working_days?: string;
  website_url?: string;
  photos?: string;
  verification_status: "not_submitted" | "pending" | "approved" | "rejected" | "deactivated";
  rejection_reason?: string;
  admin_remarks?: string;
};

const STANDARD_AMENITIES = [
  "AC",
  "Free Wi-Fi",
  "TV",
  "Water Heater / Geyser",
  "Room Service",
  "Parking",
  "Restaurant",
  "Breakfast Included",
  "Laundry Service",
  "Housekeeping",
  "Power Backup",
  "Elevator",
  "24/7 Reception",
  "CCTV / Security",
  "Attached Bathroom",
  "Swimming Pool",
  "Gym / Fitness Center",
  "Daily Newspaper"
];

export default function BusinessDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reg, setReg] = useState<BusinessRegistration | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hotel Specific State
  const [hotelData, setHotelData] = useState<HotelData | null>(null);
  const [savingHotelData, setSavingHotelData] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Category-specific state (non-hotel)
  const [catData, setCatData] = useState<any>(null);
  const [savingCatData, setSavingCatData] = useState(false);

  // Food modals
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingFoodItem, setEditingFoodItem] = useState<FoodItem | null>(null);
  const [foodForm, setFoodForm] = useState<Partial<FoodItem>>({});

  // Grocery modals
  const [groceryModalOpen, setGroceryModalOpen] = useState(false);
  const [editingGroceryProduct, setEditingGroceryProduct] = useState<GroceryProduct | null>(null);
  const [groceryForm, setGroceryForm] = useState<Partial<GroceryProduct>>({});

  // Transport modals
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);
  const [routeForm, setRouteForm] = useState<Partial<TransportRoute>>({});
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<TransportVehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState<Partial<TransportVehicle>>({});
  const [tourPkgModalOpen, setTourPkgModalOpen] = useState(false);
  const [editingTourPkg, setEditingTourPkg] = useState<TourPackage | null>(null);
  const [tourPkgForm, setTourPkgForm] = useState<Partial<TourPackage>>({});

  // Shopping modals
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [editingShopProduct, setEditingShopProduct] = useState<ShoppingProduct | null>(null);
  const [shopForm, setShopForm] = useState<Partial<ShoppingProduct>>({});

  // Doctor modals
  const [svcModalOpen, setSvcModalOpen] = useState(false);
  const [editingSvc, setEditingSvc] = useState<DoctorService | null>(null);
  const [svcForm, setSvcForm] = useState<Partial<DoctorService>>({});

  // Category offer modal (shared across non-hotel categories)
  const [catOfferModalOpen, setCatOfferModalOpen] = useState(false);
  const [editingCatOffer, setEditingCatOffer] = useState<Offer | null>(null);
  const [catOfferForm, setCatOfferForm] = useState<Partial<Offer>>({});

  // Room Modal State
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomType | null>(null);
  const [roomForm, setRoomForm] = useState<Partial<RoomType>>({
    name: "",
    description: "",
    photos: ["", "", "", "", "", ""],
    totalRooms: 5,
    bookedRooms: 0,
    price: 3000,
    isAC: true,
    bedType: "King",
    numBeds: 1,
    maxGuests: 2,
    adultsAllowed: 2,
    childrenAllowed: 1,
    extraNotes: "",
  });

  // Custom Amenity Input State
  const [customAmenityInput, setCustomAmenityInput] = useState("");

  // Offer Modal State
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<HotelOffer | null>(null);
  const [offerForm, setOfferForm] = useState<Partial<HotelOffer>>({
    title: "",
    description: "",
    discountType: "percentage",
    discountValue: 10,
    originalPrice: 3000,
    offerPrice: 2700,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    terms: "",
    imageUrl: "",
    enabled: true,
  });

  // Package Modal State
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<HotelPackage | null>(null);
  const [packageForm, setPackageForm] = useState<Partial<HotelPackage>>({
    title: "",
    duration: "3 Days / 2 Nights",
    inclusions: "Deluxe AC Room, Breakfast, Temple Shuttle",
    packagePrice: 6000,
    savings: "Save ₹1,000",
    validUntil: new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
    terms: "",
    enabled: true,
  });

  // Reply Review State
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Analytics Period
  const [insightsPeriod, setInsightsPeriod] = useState<"7d" | "30d" | "3m">("30d");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.replace("/login?role=business");
        return;
      }

      // Fetch registration status
      const { data: regData, error: regError } = await supabase
        .from("business_registrations")
        .select("*")
        .eq("owner_id", session.user.id)
        .maybeSingle();

      if (regError || !regData) {
        window.location.replace("/business/pending");
        return;
      }

      if (regData.verification_status !== "approved") {
        window.location.replace("/business/pending");
        return;
      }

      const busReg = regData as BusinessRegistration;
      setReg(busReg);

      // Fetch Hotel Data if Category is Hotels & Stays
      if (busReg.category === "Hotels & Stays") {
        try {
          const res = await fetch(`/api/business/hotel-data?id=${busReg.id}`);
          if (res.ok) {
            const hData = await res.json();
            setHotelData(hData);
          }
        } catch (e) {
          console.error("Failed to load hotel data:", e);
        }
      } else {
        // Fetch category-specific data for non-hotel categories
        try {
          const res = await fetch(`/api/business/category-data?id=${busReg.id}&category=${encodeURIComponent(busReg.category)}`);
          if (res.ok) {
            const cData = await res.json();
            setCatData(cData);
          }
        } catch (e) {
          console.error("Failed to load category data:", e);
        }
      }

      setLoading(false);
    })();
  }, []);

  async function saveHotelData(dataToSave: HotelData) {
    if (!reg) return;
    setSavingHotelData(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/business/hotel-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dataToSave, businessId: reg.id }),
      });
      if (res.ok) {
        const json = await res.json();
        setHotelData(json.data);
        setSaveMessage("Hotel details updated successfully!");
        setTimeout(() => setSaveMessage(""), 4000);
      } else {
        const errJson = await res.json();
        alert(errJson.error || "Failed to save hotel details");
      }
    } catch (err: any) {
      alert(err.message || "Error saving hotel details");
    } finally {
      setSavingHotelData(false);
    }
  }

  async function saveCatData(dataToSave: any) {
    if (!reg) return;
    setSavingCatData(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/business/category-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dataToSave, businessId: reg.id, category: reg.category }),
      });
      if (res.ok) {
        const json = await res.json();
        setCatData(json.data);
        setSaveMessage("Details updated successfully!");
        setTimeout(() => setSaveMessage(""), 4000);
      } else {
        const errJson = await res.json();
        alert(errJson.error || "Failed to save details");
      }
    } catch (err: any) {
      alert(err.message || "Error saving details");
    } finally {
      setSavingCatData(false);
    }
  }


  // --- ROOM HANDLERS ---
  function handleOpenAddRoom() {
    setEditingRoom(null);
    setRoomForm({
      name: "",
      description: "",
      photos: ["", "", "", "", "", ""],
      totalRooms: 5,
      bookedRooms: 0,
      price: 3000,
      isAC: true,
      bedType: "King",
      numBeds: 1,
      maxGuests: 2,
      adultsAllowed: 2,
      childrenAllowed: 1,
      extraNotes: "",
    });
    setRoomModalOpen(true);
  }

  function handleOpenEditRoom(room: RoomType) {
    setEditingRoom(room);
    const photos6 = [...room.photos];
    while (photos6.length < 6) photos6.push("");
    setRoomForm({
      ...room,
      photos: photos6,
    });
    setRoomModalOpen(true);
  }

  function handleSaveRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!hotelData || !roomForm.name?.trim()) return;

    const cleanedPhotos = (roomForm.photos || []).filter((p) => p && p.trim());
    const newRoom: RoomType = {
      id: editingRoom ? editingRoom.id : `room-${Date.now()}`,
      name: roomForm.name.trim(),
      description: roomForm.description || "",
      photos: cleanedPhotos.length > 0 ? cleanedPhotos : [DEFAULT_FALLBACK_IMAGE],
      totalRooms: Number(roomForm.totalRooms) || 1,
      bookedRooms: Number(roomForm.bookedRooms) || 0,
      price: Number(roomForm.price) || 0,
      isAC: Boolean(roomForm.isAC),
      bedType: roomForm.bedType || "King",
      numBeds: Number(roomForm.numBeds) || 1,
      maxGuests: Number(roomForm.maxGuests) || 2,
      adultsAllowed: Number(roomForm.adultsAllowed) || 2,
      childrenAllowed: Number(roomForm.childrenAllowed) || 0,
      extraNotes: roomForm.extraNotes || "",
    };

    let updatedRooms = [...hotelData.rooms];
    if (editingRoom) {
      updatedRooms = updatedRooms.map((r) => (r.id === editingRoom.id ? newRoom : r));
    } else {
      updatedRooms.push(newRoom);
    }

    const updatedData = { ...hotelData, rooms: updatedRooms };
    setHotelData(updatedData);
    setRoomModalOpen(false);
    void saveHotelData(updatedData);
  }

  function handleDeleteRoom(roomId: string) {
    if (!hotelData || !confirm("Are you sure you want to delete this room type?")) return;
    const updatedRooms = hotelData.rooms.filter((r) => r.id !== roomId);
    const updatedData = { ...hotelData, rooms: updatedRooms };
    setHotelData(updatedData);
    void saveHotelData(updatedData);
  }

  // --- AMENITIES HANDLERS ---
  function toggleAmenity(amenityName: string) {
    if (!hotelData) return;
    let updated = [...hotelData.amenities];
    if (updated.includes(amenityName)) {
      updated = updated.filter((a) => a !== amenityName);
    } else {
      updated.push(amenityName);
    }
    setHotelData({ ...hotelData, amenities: updated });
  }

  function handleAddCustomAmenity() {
    if (!hotelData || !customAmenityInput.trim()) return;
    const item = customAmenityInput.trim();
    if (!hotelData.customAmenities.includes(item)) {
      const updatedCustom = [...hotelData.customAmenities, item];
      setHotelData({ ...hotelData, customAmenities: updatedCustom });
    }
    setCustomAmenityInput("");
  }

  function handleRemoveCustomAmenity(item: string) {
    if (!hotelData) return;
    const updatedCustom = hotelData.customAmenities.filter((a) => a !== item);
    setHotelData({ ...hotelData, customAmenities: updatedCustom });
  }

  // --- AVAILABILITY & POLICIES HANDLER ---
  function handleBookedCountChange(roomId: string, count: number) {
    if (!hotelData) return;
    const updatedRooms = hotelData.rooms.map((r) => {
      if (r.id === roomId) {
        const booked = Math.max(0, Math.min(r.totalRooms, count));
        return { ...r, bookedRooms: booked };
      }
      return r;
    });
    setHotelData({ ...hotelData, rooms: updatedRooms });
  }

  // --- OFFERS HANDLERS ---
  function handleSaveOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!hotelData || !offerForm.title?.trim()) return;

    const newOffer: HotelOffer = {
      id: editingOffer ? editingOffer.id : `offer-${Date.now()}`,
      title: offerForm.title.trim(),
      description: offerForm.description || "",
      discountType: offerForm.discountType || "percentage",
      discountValue: Number(offerForm.discountValue) || 0,
      originalPrice: Number(offerForm.originalPrice) || 0,
      offerPrice: Number(offerForm.offerPrice) || 0,
      validFrom: offerForm.validFrom || new Date().toISOString().split("T")[0],
      validUntil: offerForm.validUntil || new Date().toISOString().split("T")[0],
      terms: offerForm.terms || "",
      imageUrl: offerForm.imageUrl || "",
      enabled: offerForm.enabled !== undefined ? offerForm.enabled : true,
    };

    let updatedOffers = [...hotelData.offers];
    if (editingOffer) {
      updatedOffers = updatedOffers.map((o) => (o.id === editingOffer.id ? newOffer : o));
    } else {
      updatedOffers.push(newOffer);
    }

    const updatedData = { ...hotelData, offers: updatedOffers };
    setHotelData(updatedData);
    setOfferModalOpen(false);
    void saveHotelData(updatedData);
  }

  function handleDeleteOffer(offerId: string) {
    if (!hotelData || !confirm("Are you sure you want to delete this promotional offer?")) return;
    const updatedOffers = hotelData.offers.filter((o) => o.id !== offerId);
    const updatedData = { ...hotelData, offers: updatedOffers };
    setHotelData(updatedData);
    void saveHotelData(updatedData);
  }

  // --- PACKAGES HANDLERS ---
  function handleSavePackage(e: React.FormEvent) {
    e.preventDefault();
    if (!hotelData || !packageForm.title?.trim()) return;

    const newPkg: HotelPackage = {
      id: editingPackage ? editingPackage.id : `pkg-${Date.now()}`,
      title: packageForm.title.trim(),
      duration: packageForm.duration || "3 Days / 2 Nights",
      inclusions: packageForm.inclusions || "",
      packagePrice: Number(packageForm.packagePrice) || 0,
      savings: packageForm.savings || "",
      validUntil: packageForm.validUntil || new Date().toISOString().split("T")[0],
      terms: packageForm.terms || "",
      enabled: packageForm.enabled !== undefined ? packageForm.enabled : true,
    };

    let updatedPkgs = [...hotelData.packages];
    if (editingPackage) {
      updatedPkgs = updatedPkgs.map((p) => (p.id === editingPackage.id ? newPkg : p));
    } else {
      updatedPkgs.push(newPkg);
    }

    const updatedData = { ...hotelData, packages: updatedPkgs };
    setHotelData(updatedData);
    setPackageModalOpen(false);
    void saveHotelData(updatedData);
  }

  function handleDeletePackage(pkgId: string) {
    if (!hotelData || !confirm("Are you sure you want to delete this stay package?")) return;
    const updatedPkgs = hotelData.packages.filter((p) => p.id !== pkgId);
    const updatedData = { ...hotelData, packages: updatedPkgs };
    setHotelData(updatedData);
    void saveHotelData(updatedData);
  }

  // --- REVIEWS RESPONSE HANDLER ---
  function handleSaveReviewReply(reviewId: string) {
    if (!hotelData || !replyText.trim()) return;
    const updatedReviews = hotelData.reviews.map((r) => {
      if (r.id === reviewId) {
        return {
          ...r,
          ownerReply: replyText.trim(),
          ownerReplyDate: new Date().toISOString().split("T")[0],
        };
      }
      return r;
    });
    const updatedData = { ...hotelData, reviews: updatedReviews };
    setHotelData(updatedData);
    setReplyingReviewId(null);
    setReplyText("");
    void saveHotelData(updatedData);
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-[#e86f18]">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  if (!reg) return null;

  const category = reg.category;

  const categoryConfigs: Record<string, { icon: any; title: string; tabs: { id: string; label: string; icon: any }[] }> = {
    "Hotels & Stays": {
      icon: BedDouble,
      title: "Hotels & Stays Portal",
      tabs: [
        { id: "profile", label: "Business Profile", icon: Building2 },
        { id: "rooms", label: "Rooms & Accommodation", icon: BedDouble },
        { id: "amenities", label: "Amenities", icon: Star },
        { id: "availability", label: "Availability & Policies", icon: Calendar },
        { id: "offers", label: "Offers & Packages", icon: Tag },
        { id: "reviews", label: "Guest Reviews", icon: Star },
        { id: "insights", label: "Performance Insights", icon: TrendingUp },
      ],
    },
    "Food & Restaurants": {
      icon: Utensils,
      title: "Restaurant Portal",
      tabs: [
        { id: "profile", label: "Business Profile", icon: Building2 },
        { id: "menu", label: "Menu Management", icon: Utensils },
        { id: "offers", label: "Offers & Discounts", icon: Tag },
        { id: "hours", label: "Opening Hours", icon: Clock },
        { id: "reviews", label: "Reviews & Ratings", icon: Star },
        { id: "insights", label: "Visitor Insights", icon: TrendingUp },
      ],
    },
    "Grocery Stores": {
      icon: ShoppingCart,
      title: "Grocery Store Portal",
      tabs: [
        { id: "profile", label: "Business Profile", icon: Building2 },
        { id: "products", label: "Products & Categories", icon: ShoppingCart },
        { id: "offers", label: "Special Offers", icon: Tag },
        { id: "timings", label: "Store Timings", icon: Clock },
        { id: "reviews", label: "Customer Reviews", icon: Star },
        { id: "insights", label: "Performance Insights", icon: TrendingUp },
      ],
    },
    "Travel & Transport": {
      icon: Car,
      title: "Travel & Transport Portal",
      tabs: [
        { id: "profile", label: "Business Profile", icon: Building2 },
        { id: "routes", label: "Routes & Fares", icon: MapPin },
        { id: "vehicles", label: "Vehicles & Fleet", icon: Car },
        { id: "tour-packages", label: "Tour Packages", icon: Tag },
        { id: "offers", label: "Offers & Deals", icon: Tag },
        { id: "reviews", label: "Customer Reviews", icon: Star },
        { id: "insights", label: "Performance Insights", icon: TrendingUp },
      ],
    },
    "Shopping & Retail": {
      icon: ShoppingBag,
      title: "Shopping & Retail Portal",
      tabs: [
        { id: "profile", label: "Business Profile", icon: Building2 },
        { id: "products", label: "Product Catalog", icon: ShoppingBag },
        { id: "offers", label: "Offers & Sales", icon: Tag },
        { id: "reviews", label: "Customer Reviews", icon: Star },
        { id: "insights", label: "Performance Insights", icon: TrendingUp },
      ],
    },
    "Healthcare": {
      icon: Stethoscope,
      title: "Healthcare Portal",
      tabs: [
        { id: "profile", label: "Business Profile", icon: Building2 },
        { id: "doctor-info", label: "Doctor Bio & Clinic", icon: Stethoscope },
        { id: "services", label: "Services & Fees", icon: Tag },
        { id: "schedule", label: "Consultation Schedule", icon: Calendar },
        { id: "reviews", label: "Patient Reviews", icon: Star },
        { id: "insights", label: "Performance Insights", icon: TrendingUp },
      ],
    },
  };

  const currentConfig = categoryConfigs[category] || {
    icon: Layers,
    title: `${category} Portal`,
    tabs: [
      { id: "profile", label: "Business Profile", icon: Building2 },
      { id: "services", label: "Offerings & Services", icon: Layers },
      { id: "offers", label: "Special Offers", icon: Tag },
      { id: "timings", label: "Store Timings", icon: Clock },
      { id: "reviews", label: "Customer Reviews", icon: Star },
    ],
  };

  const CategoryHeaderIcon = currentConfig.icon;

  return (
    <div className="flex min-h-screen bg-[#f8f2e8] text-[#192f42] w-full">
      {/* Business Sidebar */}
      <BusinessSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        category={category}
        tabs={currentConfig.tabs}
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId)}
      />

      <div className="flex flex-1 flex-col lg:ml-64 w-full min-w-0">
        {/* Business Header */}
        <BusinessHeader
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          businessName={reg.business_name}
          category={category}
        />

        <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
          {/* Top Banner */}
          <div className="mb-6 rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-[#e86f18]">
                  <CategoryHeaderIcon className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                      Approved Listing
                    </span>
                    <span className="text-xs font-bold text-[#e86f18] uppercase tracking-wider">{category}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#173247] mt-1">{reg.business_name}</h1>
                  <p className="text-xs font-semibold text-[#667883]">{reg.city_area || reg.address}</p>
                </div>
              </div>

              {saveMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 border border-emerald-200 animate-fade-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{saveMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Content Panel */}
          <div className="rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-sm sm:p-8 min-h-[500px]">
            {/* 1. BUSINESS PROFILE TAB */}
            {activeTab === "profile" && (
              <div>
                <h2 className="text-2xl font-bold text-[#173247] border-b border-[#e1cfb0] pb-4">Business Profile Overview</h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <span className="text-xs font-bold uppercase text-[#667883]">Contact Name</span>
                    <p className="text-base font-semibold text-[#173247] mt-1">{reg.contact_name}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-[#667883]">Email Address</span>
                    <p className="text-base font-semibold text-[#173247] mt-1">{reg.email}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-[#667883]">Phone Number</span>
                    <p className="text-base font-semibold text-[#173247] mt-1">{reg.phone}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-[#667883]">Working Hours</span>
                    <p className="text-base font-semibold text-[#173247] mt-1">{reg.opening_time} - {reg.closing_time} ({reg.working_days})</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs font-bold uppercase text-[#667883]">Full Address</span>
                    <p className="text-base font-semibold text-[#173247] mt-1">{reg.address}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs font-bold uppercase text-[#667883]">Description</span>
                    <p className="text-sm leading-relaxed text-[#667883] mt-1">{reg.description || "No description provided."}</p>
                  </div>
                  {reg.photos && (
                    <div className="sm:col-span-2">
                      <span className="text-xs font-bold uppercase text-[#667883]">Photos</span>
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {parsePhotoList(reg.photos).map((photo, i) => (
                          <img
                            key={i}
                            src={normalizeImageUrl(photo)}
                            alt={`Photo ${i + 1}`}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src !== DEFAULT_FALLBACK_IMAGE) {
                                target.src = DEFAULT_FALLBACK_IMAGE;
                              }
                            }}
                            className="h-28 w-full rounded-2xl object-cover border border-[#e1cfb0]"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. ROOMS & ACCOMMODATION TAB (Hotels & Stays) */}
            {activeTab === "rooms" && category === "Hotels & Stays" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1cfb0] pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#173247]">Rooms & Accommodation Management</h2>
                    <p className="text-xs text-[#667883] mt-1">Manage your property room types, pricing, capacity, and bed arrangements.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddRoom}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-[#f07b24] hover:to-[#db6215] transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add Room Type
                  </button>
                </div>

                {!hotelData?.rooms || hotelData.rooms.length === 0 ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-[#d8c4a3] p-10 text-center">
                    <BedDouble className="mx-auto h-12 w-12 text-[#e86f18] opacity-70" />
                    <h3 className="mt-4 text-lg font-bold text-[#173247]">No Room Types Added Yet</h3>
                    <p className="mt-1 text-sm text-[#667883]">Add your available room types (Deluxe, Suite, Standard, Family) to display to visitors.</p>
                    <button
                      type="button"
                      onClick={handleOpenAddRoom}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#e86f18] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#c9580f]"
                    >
                      <Plus className="h-4 w-4" /> Add First Room Type
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {hotelData.rooms.map((room) => (
                      <article key={room.id} className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e1cfb0] bg-white p-5 shadow-sm transition-all hover:shadow-md">
                        <div>
                          <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-100 border border-[#e1cfb0] mb-4">
                            <img
                              src={room.photos[0] || DEFAULT_FALLBACK_IMAGE}
                              alt={room.name}
                              className="h-full w-full object-cover"
                            />
                            <span className={`absolute top-3 left-3 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase ${room.isAC ? "bg-blue-600 text-white" : "bg-slate-700 text-white"}`}>
                              {room.isAC ? "AC Room" : "Non-AC"}
                            </span>
                            <span className="absolute top-3 right-3 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-extrabold text-white shadow-sm">
                              ₹{room.price.toLocaleString("en-IN")} / night
                            </span>
                          </div>

                          <h3 className="text-xl font-bold text-[#173247]">{room.name}</h3>
                          {room.description && <p className="mt-1.5 text-xs text-[#667883] leading-relaxed line-clamp-2">{room.description}</p>}

                          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-[#173247] bg-[#fbf6ec] p-3 rounded-xl border border-[#e1cfb0]/60">
                            <div>
                              <span className="text-[#667883] block text-[10px] uppercase">Bed Type</span>
                              <span>{room.numBeds}x {room.bedType} Bed</span>
                            </div>
                            <div>
                              <span className="text-[#667883] block text-[10px] uppercase">Max Guests</span>
                              <span>{room.maxGuests} Guests ({room.adultsAllowed} Adults{room.childrenAllowed ? `, ${room.childrenAllowed} Child` : ""})</span>
                            </div>
                            <div>
                              <span className="text-[#667883] block text-[10px] uppercase">Total Rooms</span>
                              <span>{room.totalRooms} Rooms</span>
                            </div>
                            <div>
                              <span className="text-[#667883] block text-[10px] uppercase">Available</span>
                              <span className="text-emerald-700 font-bold">{room.totalRooms - (room.bookedRooms || 0)} Available</span>
                            </div>
                          </div>

                          {room.extraNotes && (
                            <p className="mt-3 text-[11px] font-medium text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                              <span className="font-bold">Note: </span>{room.extraNotes}
                            </p>
                          )}
                        </div>

                        <div className="mt-5 flex gap-2 border-t border-[#e1cfb0] pt-4">
                          <button
                            type="button"
                            onClick={() => handleOpenEditRoom(room)}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#d8c4a3] bg-white py-2 text-xs font-bold text-[#173247] hover:bg-orange-50"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-[#e86f18]" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoom(room.id)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. AMENITIES TAB (Hotels & Stays) */}
            {activeTab === "amenities" && category === "Hotels & Stays" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1cfb0] pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#173247]">Property Amenities</h2>
                    <p className="text-xs text-[#667883] mt-1">Select the amenities available for guests at your property.</p>
                  </div>
                  <button
                    type="button"
                    disabled={savingHotelData}
                    onClick={() => hotelData && saveHotelData(hotelData)}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  >
                    {savingHotelData ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save Amenities
                  </button>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-bold text-[#173247] uppercase tracking-wider mb-3">Standard Amenities</h3>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {STANDARD_AMENITIES.map((amenity) => {
                      const isChecked = hotelData?.amenities.includes(amenity);
                      return (
                        <label
                          key={amenity}
                          onClick={() => toggleAmenity(amenity)}
                          className={`flex items-center gap-3 rounded-2xl border p-3.5 text-xs font-bold cursor-pointer transition-all ${isChecked
                              ? "border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-sm"
                              : "border-[#e1cfb0] bg-white text-[#667883] hover:bg-orange-50/50"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(isChecked)}
                            onChange={() => { }}
                            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{amenity}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Custom Amenities */}
                  <div className="mt-8 pt-6 border-t border-[#e1cfb0]">
                    <h3 className="text-sm font-bold text-[#173247] uppercase tracking-wider mb-3">Custom Property Amenities</h3>
                    <div className="flex gap-2 max-w-md">
                      <input
                        type="text"
                        placeholder="e.g. Temple Shuttle Service, Yoga Deck..."
                        value={customAmenityInput}
                        onChange={(e) => setCustomAmenityInput(e.target.value)}
                        className="flex-1 rounded-xl border border-[#d8c4a3] bg-white px-3.5 py-2 text-xs font-medium text-[#173247] outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomAmenity}
                        className="rounded-xl bg-[#e86f18] px-4 py-2 text-xs font-bold text-white hover:bg-[#c9580f]"
                      >
                        Add Custom
                      </button>
                    </div>

                    {hotelData?.customAmenities && hotelData.customAmenities.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {hotelData.customAmenities.map((item) => (
                          <span key={item} className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-900">
                            <span>{item}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomAmenity(item)}
                              className="text-amber-700 hover:text-red-600"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. AVAILABILITY & POLICIES TAB (Hotels & Stays) */}
            {activeTab === "availability" && category === "Hotels & Stays" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1cfb0] pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#173247]">Availability & Property Policies</h2>
                    <p className="text-xs text-[#667883] mt-1">Maintain room status counters, check-in/out timings, and guest policies.</p>
                  </div>
                  <button
                    type="button"
                    disabled={savingHotelData}
                    onClick={() => hotelData && saveHotelData(hotelData)}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  >
                    {savingHotelData ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save Changes
                  </button>
                </div>

                <div className="mt-6 space-y-8">
                  {/* Room Status Table */}
                  <div>
                    <h3 className="text-sm font-bold text-[#173247] uppercase tracking-wider mb-3">Room Status Maintenance</h3>
                    {!hotelData?.rooms || hotelData.rooms.length === 0 ? (
                      <p className="text-xs text-[#667883]">Add room types first under "Rooms & Accommodation" to maintain live availability.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-[#e1cfb0] bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#fbf6ec] text-[#173247] uppercase font-bold text-[10px] border-b border-[#e1cfb0]">
                            <tr>
                              <th className="p-3.5">Room Type</th>
                              <th className="p-3.5">Total Rooms</th>
                              <th className="p-3.5">Booked / Occupied</th>
                              <th className="p-3.5">Available Rooms</th>
                              <th className="p-3.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e1cfb0]/60">
                            {hotelData.rooms.map((room) => {
                              const booked = room.bookedRooms || 0;
                              const available = Math.max(0, room.totalRooms - booked);
                              const isSoldOut = available === 0;
                              const isLimited = available <= 2 && available > 0;
                              return (
                                <tr key={room.id} className="hover:bg-orange-50/30">
                                  <td className="p-3.5 font-bold text-[#173247]">{room.name}</td>
                                  <td className="p-3.5 font-semibold">{room.totalRooms}</td>
                                  <td className="p-3.5">
                                    <input
                                      type="number"
                                      min="0"
                                      max={room.totalRooms}
                                      value={booked}
                                      onChange={(e) => handleBookedCountChange(room.id, Number(e.target.value))}
                                      className="w-20 rounded-lg border border-[#d8c4a3] p-1.5 text-xs font-bold text-[#173247] outline-none"
                                    />
                                  </td>
                                  <td className="p-3.5 font-bold text-emerald-700">{available}</td>
                                  <td className="p-3.5">
                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${isSoldOut ? "bg-red-100 text-red-700" : isLimited ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                                      {isSoldOut ? "Sold Out" : isLimited ? "Limited" : "Available"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Timings */}
                  <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-[#e1cfb0]">
                    <div>
                      <label className="text-xs font-bold text-[#173247] uppercase tracking-wider block mb-1">Standard Check-In Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 12:00 PM"
                        value={hotelData?.checkInTime || ""}
                        onChange={(e) => hotelData && setHotelData({ ...hotelData, checkInTime: e.target.value })}
                        className="w-full rounded-xl border border-[#d8c4a3] bg-white p-3 text-xs font-semibold text-[#173247] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#173247] uppercase tracking-wider block mb-1">Standard Check-Out Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 11:00 AM"
                        value={hotelData?.checkOutTime || ""}
                        onChange={(e) => hotelData && setHotelData({ ...hotelData, checkOutTime: e.target.value })}
                        className="w-full rounded-xl border border-[#d8c4a3] bg-white p-3 text-xs font-semibold text-[#173247] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#667883] uppercase tracking-wider block mb-1">Early Check-In Policy</label>
                      <textarea
                        rows={2}
                        value={hotelData?.earlyCheckInPolicy || ""}
                        onChange={(e) => hotelData && setHotelData({ ...hotelData, earlyCheckInPolicy: e.target.value })}
                        className="w-full rounded-xl border border-[#d8c4a3] bg-white p-3 text-xs font-medium text-[#173247] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#667883] uppercase tracking-wider block mb-1">Late Check-Out Policy</label>
                      <textarea
                        rows={2}
                        value={hotelData?.lateCheckOutPolicy || ""}
                        onChange={(e) => hotelData && setHotelData({ ...hotelData, lateCheckOutPolicy: e.target.value })}
                        className="w-full rounded-xl border border-[#d8c4a3] bg-white p-3 text-xs font-medium text-[#173247] outline-none"
                      />
                    </div>
                  </div>

                  {/* Property Policies */}
                  <div className="pt-4 border-t border-[#e1cfb0]">
                    <h3 className="text-sm font-bold text-[#173247] uppercase tracking-wider mb-3">Property Policies</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-bold text-[#667883] uppercase tracking-wider block mb-1">Cancellation Policy</label>
                        <textarea
                          rows={2}
                          value={hotelData?.cancellationPolicy || ""}
                          onChange={(e) => hotelData && setHotelData({ ...hotelData, cancellationPolicy: e.target.value })}
                          className="w-full rounded-xl border border-[#d8c4a3] bg-white p-3 text-xs font-medium text-[#173247] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#667883] uppercase tracking-wider block mb-1">ID Requirements</label>
                        <textarea
                          rows={2}
                          value={hotelData?.idRequirements || ""}
                          onChange={(e) => hotelData && setHotelData({ ...hotelData, idRequirements: e.target.value })}
                          className="w-full rounded-xl border border-[#d8c4a3] bg-white p-3 text-xs font-medium text-[#173247] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#667883] uppercase tracking-wider block mb-1">Child Policy</label>
                        <textarea
                          rows={2}
                          value={hotelData?.childPolicy || ""}
                          onChange={(e) => hotelData && setHotelData({ ...hotelData, childPolicy: e.target.value })}
                          className="w-full rounded-xl border border-[#d8c4a3] bg-white p-3 text-xs font-medium text-[#173247] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#667883] uppercase tracking-wider block mb-1">Pet Policy</label>
                        <textarea
                          rows={2}
                          value={hotelData?.petPolicy || ""}
                          onChange={(e) => hotelData && setHotelData({ ...hotelData, petPolicy: e.target.value })}
                          className="w-full rounded-xl border border-[#d8c4a3] bg-white p-3 text-xs font-medium text-[#173247] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. OFFERS & PACKAGES TAB (Hotels & Stays) */}
            {activeTab === "offers" && category === "Hotels & Stays" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1cfb0] pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#173247]">Offers & Stay Packages</h2>
                    <p className="text-xs text-[#667883] mt-1">Create promotional discounts and multi-day stay packages for visitors.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setEditingOffer(null); setOfferModalOpen(true); }}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:from-[#f07b24] hover:to-[#db6215]"
                    >
                      <Plus className="h-4 w-4" /> Add Offer
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingPackage(null); setPackageModalOpen(true); }}
                      className="flex items-center gap-1.5 rounded-xl border border-[#d8c4a3] bg-white px-3.5 py-2 text-xs font-bold text-[#173247] hover:bg-orange-50"
                    >
                      <Plus className="h-4 w-4 text-[#e86f18]" /> Add Package
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-8">
                  {/* Offers List */}
                  <div>
                    <h3 className="text-sm font-bold text-[#173247] uppercase tracking-wider mb-3">Promotional Offers</h3>
                    {!hotelData?.offers || hotelData.offers.length === 0 ? (
                      <p className="text-xs text-[#667883]">No active promotional offers created yet.</p>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {hotelData.offers.map((offer) => (
                          <div key={offer.id} className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4 shadow-sm relative">
                            <div className="flex justify-between items-start">
                              <span className="rounded-full bg-orange-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white uppercase">
                                {offer.discountValue}% OFF
                              </span>
                              <div className="flex gap-1">
                                <button type="button" onClick={() => { setEditingOffer(offer); setOfferForm(offer); setOfferModalOpen(true); }} className="text-xs text-orange-700 hover:text-orange-900 p-1">
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button type="button" onClick={() => handleDeleteOffer(offer.id)} className="text-xs text-red-600 hover:text-red-800 p-1">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <h4 className="mt-2 text-base font-bold text-orange-950">{offer.title}</h4>
                            <p className="mt-1 text-xs text-orange-900 leading-relaxed">{offer.description}</p>
                            <div className="mt-3 text-xs font-bold text-orange-800">
                              Valid: {offer.validFrom} to {offer.validUntil}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Packages List */}
                  <div className="pt-4 border-t border-[#e1cfb0]">
                    <h3 className="text-sm font-bold text-[#173247] uppercase tracking-wider mb-3">Stay Packages</h3>
                    {!hotelData?.packages || hotelData.packages.length === 0 ? (
                      <p className="text-xs text-[#667883]">No stay packages created yet.</p>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {hotelData.packages.map((pkg) => (
                          <div key={pkg.id} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm relative">
                            <div className="flex justify-between items-start">
                              <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white uppercase">
                                {pkg.duration}
                              </span>
                              <div className="flex gap-1">
                                <button type="button" onClick={() => { setEditingPackage(pkg); setPackageForm(pkg); setPackageModalOpen(true); }} className="text-xs text-amber-700 hover:text-amber-900 p-1">
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button type="button" onClick={() => handleDeletePackage(pkg.id)} className="text-xs text-red-600 hover:text-red-800 p-1">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <h4 className="mt-2 text-base font-bold text-amber-950">{pkg.title}</h4>
                            <p className="mt-1 text-xs text-amber-900"><span className="font-bold">Inclusions: </span>{pkg.inclusions}</p>
                            <div className="mt-3 flex justify-between items-center text-xs">
                              <span className="font-extrabold text-amber-950 text-sm">₹{pkg.packagePrice.toLocaleString("en-IN")}</span>
                              {pkg.savings && <span className="font-bold text-emerald-700">{pkg.savings}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 6. GUEST REVIEWS TAB (Hotels & Stays) */}
            {activeTab === "reviews" && category === "Hotels & Stays" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1cfb0] pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#173247]">Guest Reviews & Feedback</h2>
                    <p className="text-xs text-[#667883] mt-1">View genuine visitor reviews and post official responses. Customer ratings cannot be altered.</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2 border border-amber-200">
                    <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                    <span className="text-lg font-bold text-amber-950">4.8</span>
                    <span className="text-xs text-amber-800 font-medium">({hotelData?.reviews.length || 0} Reviews)</span>
                  </div>
                </div>

                {!hotelData?.reviews || hotelData.reviews.length === 0 ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-[#d8c4a3] p-10 text-center">
                    <Star className="mx-auto h-12 w-12 text-amber-400 opacity-70" />
                    <h3 className="mt-4 text-lg font-bold text-[#173247]">No Reviews Yet</h3>
                    <p className="mt-1 text-sm text-[#667883]">Guest feedback will appear here as visitors review your hotel listing.</p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {hotelData.reviews.map((review) => (
                      <div key={review.id} className="rounded-2xl border border-[#e1cfb0] bg-white p-5 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-[#173247] text-sm">{review.reviewerName}</span>
                            <span className="text-xs text-[#667883] ml-3">{review.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="mt-3 text-xs text-[#173247] leading-relaxed">{review.comment}</p>

                        {/* Owner Reply */}
                        {review.ownerReply ? (
                          <div className="mt-4 rounded-xl bg-orange-50/70 p-3.5 border border-orange-200 text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-[#e86f18]">Official Response from {reg.business_name}:</span>
                              {review.ownerReplyDate && <span className="text-[10px] text-[#667883]">{review.ownerReplyDate}</span>}
                            </div>
                            <p className="text-[#173247]">{review.ownerReply}</p>
                          </div>
                        ) : replyingReviewId === review.id ? (
                          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <textarea
                              rows={2}
                              placeholder="Write an official response to this review..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="w-full rounded-lg border border-[#d8c4a3] p-2 text-xs font-medium text-[#173247] outline-none"
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setReplyingReviewId(null)}
                                className="px-3 py-1.5 text-xs font-semibold text-[#667883] hover:text-[#173247]"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveReviewReply(review.id)}
                                className="px-3 py-1.5 rounded-lg bg-[#e86f18] text-xs font-bold text-white hover:bg-[#c9580f]"
                              >
                                Post Response
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setReplyingReviewId(review.id); setReplyText(""); }}
                            className="mt-3 text-xs font-bold text-[#e86f18] hover:text-[#c9580f] inline-flex items-center gap-1"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Reply to Review
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 7. PERFORMANCE INSIGHTS TAB (Hotels & Stays) */}
            {activeTab === "insights" && category === "Hotels & Stays" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1cfb0] pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#173247]">Performance Insights & Analytics</h2>
                    <p className="text-xs text-[#667883] mt-1">Real visitor engagement metrics for {reg.business_name} on Discover Nashik.</p>
                  </div>
                  <div className="flex gap-1 rounded-xl border border-[#d8c4a3] bg-white p-1">
                    {(["7d", "30d", "3m"] as const).map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setInsightsPeriod(period)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${insightsPeriod === period ? "bg-[#e86f18] text-white" : "text-[#667883] hover:bg-orange-50"
                          }`}
                      >
                        {period === "7d" ? "7 Days" : period === "30d" ? "30 Days" : "3 Months"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    {[
                      { title: "Profile Views", value: hotelData?.stats.profileViews || 0, prev: hotelData?.stats.prevProfileViews || 0 },
                      { title: "Room Page Views", value: hotelData?.stats.roomViews || 0, prev: hotelData?.stats.prevRoomViews || 0 },
                      { title: "Phone / Contact Clicks", value: hotelData?.stats.contactClicks || 0, prev: hotelData?.stats.prevContactClicks || 0 },
                      { title: "Direction / Map Clicks", value: hotelData?.stats.directionClicks || 0, prev: hotelData?.stats.prevDirectionClicks || 0 },
                    ].map((stat) => {
                      const diff = stat.value - stat.prev;
                      const pct = stat.prev > 0 ? ((diff / stat.prev) * 100).toFixed(1) : "0.0";
                      const isPos = diff >= 0;
                      return (
                        <div key={stat.title} className="rounded-2xl border border-[#e1cfb0] bg-white p-4 shadow-sm">
                          <span className="text-[10px] font-bold uppercase text-[#667883] tracking-wider block">{stat.title}</span>
                          <span className="text-2xl font-extrabold text-[#173247] mt-1 block">{stat.value.toLocaleString("en-IN")}</span>
                          <div className="mt-2 flex items-center gap-1 text-xs font-bold">
                            <span className={isPos ? "text-emerald-600" : "text-red-600"}>
                              {isPos ? `+${pct}%` : `${pct}%`}
                            </span>
                            <span className="text-[#667883] font-normal text-[10px]">vs previous period</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ═══ FOOD & RESTAURANT TABS ════════════════════════════════════ */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            {/* FOOD — MENU MANAGEMENT */}
            {activeTab === "menu" && category === "Food & Restaurants" && catData && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1cfb0] pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#173247]">Menu Management</h2>
                    <p className="text-xs text-[#667883] mt-1">Add food items, manage pricing, dietary info, and categories.</p>
                  </div>
                  <button type="button" onClick={() => { setEditingFoodItem(null); setFoodForm({ name: "", category: "Main Course", price: 200, dietaryType: "veg", spicyLevel: "Medium", available: true, servingSize: "Serves 1", variants: [], isBestseller: false, isChefSpecial: false, isNew: false, isSeasonal: false }); setFoodModalOpen(true); }} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-[#f07b24] hover:to-[#db6215] transition-all">
                    <Plus className="h-4 w-4" /> Add Menu Item
                  </button>
                </div>
                {!catData.items?.length ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-[#d8c4a3] p-10 text-center">
                    <Utensils className="mx-auto h-12 w-12 text-[#e86f18] opacity-70" />
                    <h3 className="mt-4 text-lg font-bold text-[#173247]">No Menu Items Yet</h3>
                    <p className="mt-1 text-sm text-[#667883]">Add your menu items to showcase your restaurant's offerings.</p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {catData.items.map((item: FoodItem) => (
                      <article key={item.id} className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e1cfb0] bg-white p-5 shadow-sm hover:shadow-md transition-all">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${item.dietaryType === "veg" ? "bg-emerald-100 text-emerald-800" : item.dietaryType === "vegan" ? "bg-lime-100 text-lime-800" : item.dietaryType === "jain" ? "bg-yellow-100 text-yellow-800" : item.dietaryType === "egg" ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800"}`}>{item.dietaryType}</span>
                              {item.isBestseller && <span className="ml-1.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">★ Bestseller</span>}
                              {item.isChefSpecial && <span className="ml-1.5 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">Chef Special</span>}
                              {item.isNew && <span className="ml-1.5 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">New</span>}
                              <h3 className="text-lg font-bold text-[#173247] mt-1">{item.name}</h3>
                            </div>
                            <span className="text-lg font-extrabold text-[#e86f18]">₹{item.price}</span>
                          </div>
                          {item.description && <p className="mt-2 text-xs text-[#667883] line-clamp-2">{item.description}</p>}
                          <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                            <span className="rounded bg-[#fbf6ec] px-2 py-0.5 font-semibold text-[#173247] border border-[#e1cfb0]/60">{item.category}</span>
                            <span className="rounded bg-[#fbf6ec] px-2 py-0.5 font-semibold text-[#173247] border border-[#e1cfb0]/60">🌶 {item.spicyLevel}</span>
                            <span className="rounded bg-[#fbf6ec] px-2 py-0.5 font-semibold text-[#173247] border border-[#e1cfb0]/60">{item.servingSize}</span>
                            {!item.available && <span className="rounded bg-red-50 px-2 py-0.5 font-bold text-red-700 border border-red-200">Unavailable</span>}
                          </div>
                          {item.variants?.length > 0 && (
                            <div className="mt-2 text-[10px] text-[#667883]">Variants: {item.variants.map(v => `${v.label} ₹${v.price}`).join(" · ")}</div>
                          )}
                        </div>
                        <div className="mt-4 flex gap-2 border-t border-[#e1cfb0] pt-3">
                          <button type="button" onClick={() => { setEditingFoodItem(item); setFoodForm(item); setFoodModalOpen(true); }} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#d8c4a3] bg-white py-2 text-xs font-bold text-[#173247] hover:bg-orange-50"><Edit2 className="h-3.5 w-3.5 text-[#e86f18]" /> Edit</button>
                          <button type="button" onClick={() => { if (confirm("Delete this item?")) { const u = catData.items.filter((i: FoodItem) => i.id !== item.id); void saveCatData({ ...catData, items: u }); }}} className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FOOD — TIMINGS & DINING (hours tab) */}
            {activeTab === "hours" && category === "Food & Restaurants" && catData && (
              <div>
                <h2 className="text-2xl font-bold text-[#173247] border-b border-[#e1cfb0] pb-4">Restaurant Timings & Dining Options</h2>
                <div className="mt-6 space-y-6">
                  <div className="rounded-2xl border border-[#e1cfb0] bg-white p-5 space-y-4">
                    <h3 className="text-base font-bold text-[#173247]">Meal Period Timings</h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {(["breakfastTimes", "lunchTimes", "dinnerTimes"] as const).map((key) => (
                        <div key={key}>
                          <label className="block text-xs font-bold uppercase text-[#667883] mb-1">{key === "breakfastTimes" ? "Breakfast" : key === "lunchTimes" ? "Lunch" : "Dinner"}</label>
                          <input type="text" value={catData.timings?.[key] || ""} onChange={(e) => setCatData({ ...catData, timings: { ...catData.timings, [key]: e.target.value } })} placeholder="e.g. 7:30 AM – 11:30 AM" className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs font-semibold text-[#173247] outline-none" />
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Weekly Closed Day</label><input type="text" value={catData.timings?.weeklyClosedDay || ""} onChange={(e) => setCatData({ ...catData, timings: { ...catData.timings, weeklyClosedDay: e.target.value } })} placeholder="e.g. Monday" className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Closure Notice</label><input type="text" value={catData.timings?.temporaryClosureNotice || ""} onChange={(e) => setCatData({ ...catData, timings: { ...catData.timings, temporaryClosureNotice: e.target.value } })} className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#e1cfb0] bg-white p-5 space-y-4">
                    <h3 className="text-base font-bold text-[#173247]">Dining Options & Restaurant Info</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {["Dine-in", "Takeaway", "Delivery", "Outdoor Seating", "Indoor Seating", "Family-friendly", "AC", "Wheelchair Accessible", "Parking"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 rounded-xl border border-[#e1cfb0] bg-[#fbf6ec] p-3 text-xs font-semibold cursor-pointer hover:bg-orange-50">
                          <input type="checkbox" checked={(catData.diningOptions || []).includes(opt)} onChange={() => { const cur: string[] = catData.diningOptions || []; setCatData({ ...catData, diningOptions: cur.includes(opt) ? cur.filter((o: string) => o !== opt) : [...cur, opt] }); }} className="accent-[#e86f18]" />{opt}
                        </label>
                      ))}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Cuisine Types</label><input type="text" value={(catData.cuisineTypes || []).join(", ")} onChange={(e) => setCatData({ ...catData, cuisineTypes: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} placeholder="e.g. Maharashtrian, North Indian" className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Price Range</label><select value={catData.priceRange || "₹₹"} onChange={(e) => setCatData({ ...catData, priceRange: e.target.value })} className="w-full rounded-xl border border-[#d8c4a3] bg-white p-3 text-xs outline-none"><option value="₹">₹ Budget</option><option value="₹₹">₹₹ Moderate</option><option value="₹₹₹">₹₹₹ Premium</option></select></div>
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Seating Capacity</label><input type="number" value={catData.seatingCapacity || ""} onChange={(e) => setCatData({ ...catData, seatingCapacity: Number(e.target.value) })} className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Reservation Contact</label><input type="text" value={catData.restaurantInfo?.reservationContact || ""} onChange={(e) => setCatData({ ...catData, restaurantInfo: { ...catData.restaurantInfo, reservationContact: e.target.value } })} className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                    </div>
                  </div>
                  <button type="button" onClick={() => void saveCatData(catData)} disabled={savingCatData} className="rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-6 py-3 text-sm font-bold text-white shadow-md hover:from-[#f07b24] hover:to-[#db6215] disabled:opacity-50">{savingCatData ? "Saving..." : "Save Timings & Info"}</button>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ═══ GROCERY STORE TABS ════════════════════════════════════════ */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            {/* GROCERY — PRODUCT CATALOG */}
            {activeTab === "products" && category === "Grocery Stores" && catData && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1cfb0] pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#173247]">Product Catalog</h2>
                    <p className="text-xs text-[#667883] mt-1">Manage your store's products, categories, pack sizes, and stock status.</p>
                  </div>
                  <button type="button" onClick={() => { setEditingGroceryProduct(null); setGroceryForm({ name: "", category: "Rice & Grains", price: 100, unit: "kg", packSize: "1 kg", stockStatus: "In Stock", available: true }); setGroceryModalOpen(true); }} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-[#f07b24] hover:to-[#db6215] transition-all">
                    <Plus className="h-4 w-4" /> Add Product
                  </button>
                </div>
                {!catData.products?.length ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-[#d8c4a3] p-10 text-center">
                    <ShoppingCart className="mx-auto h-12 w-12 text-[#e86f18] opacity-70" />
                    <h3 className="mt-4 text-lg font-bold text-[#173247]">No Products Added Yet</h3>
                    <p className="mt-1 text-sm text-[#667883]">Add your grocery products to display in your store catalog.</p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {catData.products.map((prod: GroceryProduct) => (
                      <article key={prod.id} className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e1cfb0] bg-white p-5 shadow-sm hover:shadow-md transition-all">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="rounded-full bg-[#fbf6ec] px-2.5 py-0.5 text-[10px] font-bold text-[#173247] border border-[#e1cfb0]/60">{prod.category}</span>
                              <h3 className="text-lg font-bold text-[#173247] mt-1">{prod.name}</h3>
                              {prod.brand && <p className="text-xs font-semibold text-[#e86f18]">{prod.brand}</p>}
                            </div>
                            <span className="text-lg font-extrabold text-[#173247]">₹{prod.price}</span>
                          </div>
                          {prod.description && <p className="mt-2 text-xs text-[#667883] line-clamp-2">{prod.description}</p>}
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
                            <span className="font-semibold text-[#667883]">Pack: {prod.packSize}</span>
                            <span className={`font-bold px-2 py-0.5 rounded-full ${prod.stockStatus === "In Stock" ? "bg-emerald-100 text-emerald-800" : prod.stockStatus === "Low Stock" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>{prod.stockStatus}</span>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2 border-t border-[#e1cfb0] pt-3">
                          <button type="button" onClick={() => { setEditingGroceryProduct(prod); setGroceryForm(prod); setGroceryModalOpen(true); }} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#d8c4a3] bg-white py-2 text-xs font-bold text-[#173247] hover:bg-orange-50"><Edit2 className="h-3.5 w-3.5 text-[#e86f18]" /> Edit</button>
                          <button type="button" onClick={() => { if (confirm("Delete product?")) { const u = catData.products.filter((p: GroceryProduct) => p.id !== prod.id); void saveCatData({ ...catData, products: u }); }}} className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* GROCERY — STORE TIMINGS & INFO */}
            {activeTab === "timings" && category === "Grocery Stores" && catData && (
              <div>
                <h2 className="text-2xl font-bold text-[#173247] border-b border-[#e1cfb0] pb-4">Delivery & Store Information</h2>
                <div className="mt-6 space-y-6">
                  <div className="rounded-2xl border border-[#e1cfb0] bg-white p-5 space-y-4">
                    <h3 className="text-base font-bold text-[#173247]">Delivery & Pickup Services</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {([{ key: "homeDelivery", label: "Home Delivery" }, { key: "pickupAvailable", label: "In-Store Pickup" }, { key: "parkingAvailable", label: "Parking" }] as const).map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 rounded-xl border border-[#e1cfb0] bg-[#fbf6ec] p-3 text-xs font-semibold cursor-pointer hover:bg-orange-50">
                          <input type="checkbox" checked={catData.storeInfo?.[key] || false} onChange={() => setCatData({ ...catData, storeInfo: { ...catData.storeInfo, [key]: !catData.storeInfo?.[key] } })} className="accent-[#e86f18]" />{label}
                        </label>
                      ))}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Delivery Area</label><input type="text" value={catData.storeInfo?.deliveryArea || ""} onChange={(e) => setCatData({ ...catData, storeInfo: { ...catData.storeInfo, deliveryArea: e.target.value } })} placeholder="e.g. Within 5 km" className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Min Order (₹)</label><input type="number" value={catData.storeInfo?.minOrderAmount || ""} onChange={(e) => setCatData({ ...catData, storeInfo: { ...catData.storeInfo, minOrderAmount: Number(e.target.value) } })} className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Payment Methods</label><input type="text" value={(catData.storeInfo?.paymentMethods || []).join(", ")} onChange={(e) => setCatData({ ...catData, storeInfo: { ...catData.storeInfo, paymentMethods: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) } })} placeholder="UPI, Cash, Cards" className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Weekly Closed Day</label><input type="text" value={catData.storeInfo?.weeklyClosedDay || ""} onChange={(e) => setCatData({ ...catData, storeInfo: { ...catData.storeInfo, weeklyClosedDay: e.target.value } })} className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                    </div>
                  </div>
                  <button type="button" onClick={() => void saveCatData(catData)} disabled={savingCatData} className="rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-6 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50">{savingCatData ? "Saving..." : "Save Store Information"}</button>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ═══ TRAVEL & TRANSPORT TABS ═══════════════════════════════════ */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            {/* TRANSPORT — ROUTES */}
            {activeTab === "routes" && category === "Travel & Transport" && catData && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1cfb0] pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#173247]">Routes & Fares</h2>
                    <p className="text-xs text-[#667883] mt-1">Manage your service routes, timings, and indicative fares.</p>
                  </div>
                  <button type="button" onClick={() => { setEditingRoute(null); setRouteForm({ routeName: "", startingPoint: "", destination: "", indicativeFare: "", operatingDays: "All Days" }); setRouteModalOpen(true); }} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-4 py-2.5 text-xs font-bold text-white shadow-md">
                    <Plus className="h-4 w-4" /> Add Route
                  </button>
                </div>
                {!catData.routes?.length ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-[#d8c4a3] p-10 text-center">
                    <MapPin className="mx-auto h-12 w-12 text-[#e86f18] opacity-70" />
                    <h3 className="mt-4 text-lg font-bold text-[#173247]">No Routes Added</h3>
                    <p className="mt-1 text-sm text-[#667883]">Add your service routes with fares and timings.</p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {catData.routes.map((rt: TransportRoute) => (
                      <article key={rt.id} className="overflow-hidden rounded-2xl border border-[#e1cfb0] bg-white p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-[#173247]">{rt.routeName}</h3>
                          <span className="text-sm font-extrabold text-[#e86f18] whitespace-nowrap">{rt.indicativeFare}</span>
                        </div>
                        <div className="mt-3 text-xs text-[#667883] space-y-1">
                          <div>📍 <strong>From:</strong> {rt.startingPoint} → <strong>To:</strong> {rt.destination}</div>
                          {rt.stops && <div>🏣 <strong>Stops:</strong> {rt.stops}</div>}
                          {rt.duration && <div>⏱ <strong>Duration:</strong> {rt.duration}</div>}
                          {rt.operatingDays && <div>📅 <strong>Days:</strong> {rt.operatingDays}</div>}
                        </div>
                        <div className="mt-4 flex gap-2 border-t border-[#e1cfb0] pt-3">
                          <button type="button" onClick={() => { setEditingRoute(rt); setRouteForm(rt); setRouteModalOpen(true); }} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#d8c4a3] bg-white py-2 text-xs font-bold text-[#173247] hover:bg-orange-50"><Edit2 className="h-3.5 w-3.5 text-[#e86f18]" /> Edit</button>
                          <button type="button" onClick={() => { if (confirm("Delete route?")) { const u = catData.routes.filter((r: TransportRoute) => r.id !== rt.id); void saveCatData({ ...catData, routes: u }); }}} className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TRANSPORT — VEHICLES */}
            {activeTab === "vehicles" && category === "Travel & Transport" && catData && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1cfb0] pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#173247]">Vehicles & Fleet</h2>
                    <p className="text-xs text-[#667883] mt-1">Add your fleet vehicles with capacity, AC status, and rates.</p>
                  </div>
                  <button type="button" onClick={() => { setEditingVehicle(null); setVehicleForm({ modelName: "", vehicleType: "Sedan", seatingCapacity: 4, isAC: true, indicativeRate: "₹12/km" }); setVehicleModalOpen(true); }} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-4 py-2.5 text-xs font-bold text-white shadow-md">
                    <Plus className="h-4 w-4" /> Add Vehicle
                  </button>
                </div>
                {!catData.vehicles?.length ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-[#d8c4a3] p-10 text-center">
                    <Car className="mx-auto h-12 w-12 text-[#e86f18] opacity-70" />
                    <h3 className="mt-4 text-lg font-bold text-[#173247]">No Vehicles Added</h3>
                    <p className="mt-1 text-sm text-[#667883]">Add your available vehicles to showcase your fleet.</p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {catData.vehicles.map((veh: TransportVehicle) => (
                      <article key={veh.id} className="overflow-hidden rounded-2xl border border-[#e1cfb0] bg-white p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${veh.isAC ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"}`}>{veh.isAC ? "AC" : "Non-AC"}</span>
                            <h3 className="text-lg font-bold text-[#173247] mt-1">{veh.modelName}</h3>
                            <p className="text-xs text-[#667883]">{veh.vehicleType} · {veh.seatingCapacity} Seats</p>
                          </div>
                          <span className="text-sm font-extrabold text-[#e86f18]">{veh.indicativeRate}</span>
                        </div>
                        <div className="mt-4 flex gap-2 border-t border-[#e1cfb0] pt-3">
                          <button type="button" onClick={() => { setEditingVehicle(veh); setVehicleForm(veh); setVehicleModalOpen(true); }} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#d8c4a3] bg-white py-2 text-xs font-bold text-[#173247] hover:bg-orange-50"><Edit2 className="h-3.5 w-3.5 text-[#e86f18]" /> Edit</button>
                          <button type="button" onClick={() => { if (confirm("Delete vehicle?")) { const u = catData.vehicles.filter((v: TransportVehicle) => v.id !== veh.id); void saveCatData({ ...catData, vehicles: u }); }}} className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TRANSPORT — TOUR PACKAGES */}
            {activeTab === "tour-packages" && category === "Travel & Transport" && catData && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1cfb0] pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#173247]">Tour Packages</h2>
                    <p className="text-xs text-[#667883] mt-1">Offer curated travel packages around Nashik.</p>
                  </div>
                  <button type="button" onClick={() => { setEditingTourPkg(null); setTourPkgForm({ title: "", duration: "1 Day", price: 2000, enabled: true }); setTourPkgModalOpen(true); }} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-4 py-2.5 text-xs font-bold text-white shadow-md">
                    <Plus className="h-4 w-4" /> Add Package
                  </button>
                </div>
                {!catData.tourPackages?.length ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-[#d8c4a3] p-10 text-center">
                    <Tag className="mx-auto h-12 w-12 text-[#e86f18] opacity-70" />
                    <h3 className="mt-4 text-lg font-bold text-[#173247]">No Tour Packages Yet</h3>
                    <p className="mt-1 text-sm text-[#667883]">Create tour packages to offer visitors.</p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {catData.tourPackages.map((pkg: TourPackage) => (
                      <article key={pkg.id} className="overflow-hidden rounded-2xl border border-[#e1cfb0] bg-white p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-bold text-[#173247]">{pkg.title}</h3>
                            <p className="text-xs text-[#667883]">{pkg.duration} · {pkg.placesCovered}</p>
                          </div>
                          <span className="text-lg font-extrabold text-[#e86f18]">₹{pkg.price?.toLocaleString("en-IN")}</span>
                        </div>
                        {pkg.inclusions && <p className="mt-2 text-xs text-[#667883]"><strong>Includes:</strong> {pkg.inclusions}</p>}
                        <div className="mt-4 flex gap-2 border-t border-[#e1cfb0] pt-3">
                          <button type="button" onClick={() => { setEditingTourPkg(pkg); setTourPkgForm(pkg); setTourPkgModalOpen(true); }} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#d8c4a3] bg-white py-2 text-xs font-bold text-[#173247] hover:bg-orange-50"><Edit2 className="h-3.5 w-3.5 text-[#e86f18]" /> Edit</button>
                          <button type="button" onClick={() => { if (confirm("Delete package?")) { const u = catData.tourPackages.filter((p: TourPackage) => p.id !== pkg.id); void saveCatData({ ...catData, tourPackages: u }); }}} className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ═══ SHOPPING & RETAIL TABS ════════════════════════════════════ */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            {/* SHOPPING — PRODUCT CATALOG */}
            {activeTab === "products" && category === "Shopping & Retail" && catData && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1cfb0] pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#173247]">Product Catalog</h2>
                    <p className="text-xs text-[#667883] mt-1">Manage products, variants, pricing, and collections.</p>
                  </div>
                  <button type="button" onClick={() => { setEditingShopProduct(null); setShopForm({ name: "", category: "General", price: 500, status: "Available", variants: [] }); setShopModalOpen(true); }} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-4 py-2.5 text-xs font-bold text-white shadow-md">
                    <Plus className="h-4 w-4" /> Add Product
                  </button>
                </div>
                {!catData.products?.length ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-[#d8c4a3] p-10 text-center">
                    <ShoppingBag className="mx-auto h-12 w-12 text-[#e86f18] opacity-70" />
                    <h3 className="mt-4 text-lg font-bold text-[#173247]">No Products Yet</h3>
                    <p className="mt-1 text-sm text-[#667883]">Add your retail products to showcase to visitors.</p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {catData.products.map((prod: ShoppingProduct) => (
                      <article key={prod.id} className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e1cfb0] bg-white p-5 shadow-sm hover:shadow-md transition-all">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="rounded-full bg-[#fbf6ec] px-2.5 py-0.5 text-[10px] font-bold text-[#173247] border border-[#e1cfb0]/60">{prod.category}</span>
                              <h3 className="text-lg font-bold text-[#173247] mt-1">{prod.name}</h3>
                              {prod.brand && <p className="text-xs font-semibold text-[#e86f18]">{prod.brand}</p>}
                            </div>
                            <span className="text-lg font-extrabold text-[#173247]">₹{prod.price}</span>
                          </div>
                          {prod.description && <p className="mt-2 text-xs text-[#667883] line-clamp-2">{prod.description}</p>}
                          <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                            <span className={`font-bold px-2 py-0.5 rounded-full ${prod.status === "Available" ? "bg-emerald-100 text-emerald-800" : prod.status === "Coming Soon" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}>{prod.status}</span>
                            {prod.collection && <span className="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-full font-semibold border border-indigo-200">{prod.collection}</span>}
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2 border-t border-[#e1cfb0] pt-3">
                          <button type="button" onClick={() => { setEditingShopProduct(prod); setShopForm(prod); setShopModalOpen(true); }} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#d8c4a3] bg-white py-2 text-xs font-bold text-[#173247] hover:bg-orange-50"><Edit2 className="h-3.5 w-3.5 text-[#e86f18]" /> Edit</button>
                          <button type="button" onClick={() => { if (confirm("Delete product?")) { const u = catData.products.filter((p: ShoppingProduct) => p.id !== prod.id); void saveCatData({ ...catData, products: u }); }}} className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ═══ HEALTHCARE / DOCTOR TABS ══════════════════════════════════ */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            {/* DOCTOR — BIO & CLINIC INFO */}
            {activeTab === "doctor-info" && category === "Healthcare" && catData && (
              <div>
                <h2 className="text-2xl font-bold text-[#173247] border-b border-[#e1cfb0] pb-4">Doctor Bio & Clinic Information</h2>
                <div className="mt-6 space-y-6">
                  <div className="rounded-2xl border border-[#e1cfb0] bg-white p-5 space-y-4">
                    <h3 className="text-base font-bold text-[#173247]">Doctor Profile</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Doctor Name</label><input type="text" value={catData.doctorName || ""} onChange={(e) => setCatData({ ...catData, doctorName: e.target.value })} className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs font-semibold text-[#173247] outline-none" /></div>
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Specialization</label><input type="text" value={catData.specialization || ""} onChange={(e) => setCatData({ ...catData, specialization: e.target.value })} placeholder="e.g. General Physician" className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Qualifications</label><input type="text" value={catData.qualifications || ""} onChange={(e) => setCatData({ ...catData, qualifications: e.target.value })} placeholder="e.g. MBBS, MD" className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Experience (Years)</label><input type="number" value={catData.experienceYears || ""} onChange={(e) => setCatData({ ...catData, experienceYears: Number(e.target.value) })} className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Languages</label><input type="text" value={(catData.languages || []).join(", ")} onChange={(e) => setCatData({ ...catData, languages: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} placeholder="Hindi, Marathi, English" className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Registration Info</label><input type="text" value={catData.registrationInfo || ""} onChange={(e) => setCatData({ ...catData, registrationInfo: e.target.value })} className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                    </div>
                    <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Professional Bio</label><textarea rows={3} value={catData.bio || ""} onChange={(e) => setCatData({ ...catData, bio: e.target.value })} className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                  </div>
                  <div className="rounded-2xl border border-[#e1cfb0] bg-white p-5 space-y-4">
                    <h3 className="text-base font-bold text-[#173247]">Clinic Information</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Clinic Name</label><input type="text" value={catData.clinicName || ""} onChange={(e) => setCatData({ ...catData, clinicName: e.target.value })} className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Clinic Address</label><input type="text" value={catData.clinicAddress || ""} onChange={(e) => setCatData({ ...catData, clinicAddress: e.target.value })} className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Floor / Landmark</label><input type="text" value={catData.clinicLandmark || ""} onChange={(e) => setCatData({ ...catData, clinicLandmark: e.target.value })} className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Parking Info</label><input type="text" value={catData.clinicParking || ""} onChange={(e) => setCatData({ ...catData, clinicParking: e.target.value })} className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                    </div>
                  </div>
                  <button type="button" onClick={() => void saveCatData(catData)} disabled={savingCatData} className="rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-6 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50">{savingCatData ? "Saving..." : "Save Doctor & Clinic Info"}</button>
                </div>
              </div>
            )}

            {/* DOCTOR — SERVICES & FEES */}
            {activeTab === "services" && category === "Healthcare" && catData && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1cfb0] pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#173247]">Services & Consultation Fees</h2>
                    <p className="text-xs text-[#667883] mt-1">Fees as provided by the healthcare professional. Actual fees may vary.</p>
                  </div>
                  <button type="button" onClick={() => { setEditingSvc(null); setSvcForm({ serviceName: "", description: "", fee: 500 }); setSvcModalOpen(true); }} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-4 py-2.5 text-xs font-bold text-white shadow-md">
                    <Plus className="h-4 w-4" /> Add Service
                  </button>
                </div>
                <div className="mt-6 space-y-6">
                  <div className="rounded-2xl border border-[#e1cfb0] bg-white p-5">
                    <h3 className="text-base font-bold text-[#173247] mb-4">Standard Consultation Fees</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">First Consultation (₹)</label><input type="number" value={catData.firstConsultationFee || ""} onChange={(e) => setCatData({ ...catData, firstConsultationFee: Number(e.target.value) })} className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                      <div><label className="block text-xs font-bold uppercase text-[#667883] mb-1">Follow-Up (₹)</label><input type="number" value={catData.followUpFee || ""} onChange={(e) => setCatData({ ...catData, followUpFee: Number(e.target.value) })} className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs outline-none" /></div>
                    </div>
                  </div>
                  {catData.services?.length > 0 && (
                    <div className="grid gap-6 md:grid-cols-2">
                      {catData.services.map((srv: DoctorService) => (
                        <div key={srv.id} className="rounded-2xl border border-[#e1cfb0] bg-white p-5">
                          <div className="flex items-start justify-between gap-2">
                            <div><h3 className="text-base font-bold text-[#173247]">{srv.serviceName}</h3>{srv.description && <p className="mt-1 text-xs text-[#667883]">{srv.description}</p>}</div>
                            <span className="text-lg font-extrabold text-[#e86f18]">₹{srv.fee}</span>
                          </div>
                          <div className="mt-3 flex gap-2 border-t border-[#e1cfb0] pt-3">
                            <button type="button" onClick={() => { setEditingSvc(srv); setSvcForm(srv); setSvcModalOpen(true); }} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#d8c4a3] bg-white py-2 text-xs font-bold text-[#173247] hover:bg-orange-50"><Edit2 className="h-3.5 w-3.5 text-[#e86f18]" /> Edit</button>
                            <button type="button" onClick={() => { if (confirm("Remove service?")) { const u = catData.services.filter((s: DoctorService) => s.id !== srv.id); void saveCatData({ ...catData, services: u }); }}} className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={() => void saveCatData(catData)} disabled={savingCatData} className="rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-6 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50">{savingCatData ? "Saving..." : "Save Fees"}</button>
                </div>
              </div>
            )}

            {/* DOCTOR — CONSULTATION SCHEDULE */}
            {activeTab === "schedule" && category === "Healthcare" && catData && (
              <div>
                <h2 className="text-2xl font-bold text-[#173247] border-b border-[#e1cfb0] pb-4">Consultation Schedule</h2>
                <div className="mt-6 space-y-6">
                  <div className="rounded-2xl border border-[#e1cfb0] bg-white p-5 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#667883] mb-1">Consultation Modes</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {["In-Person Clinic Visit", "Video Consultation", "Phone Consultation"].map((mode) => (
                            <label key={mode} className="flex items-center gap-2 rounded-xl border border-[#e1cfb0] bg-[#fbf6ec] px-3 py-2 text-xs font-semibold cursor-pointer">
                              <input type="checkbox" checked={(catData.consultationModes || []).includes(mode)} onChange={() => { const cur: string[] = catData.consultationModes || []; setCatData({ ...catData, consultationModes: cur.includes(mode) ? cur.filter((m: string) => m !== mode) : [...cur, mode] }); }} className="accent-[#e86f18]" />{mode}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-[#667883] mt-2">
                          <input type="checkbox" checked={catData.emergencyCareAvailable || false} onChange={() => setCatData({ ...catData, emergencyCareAvailable: !catData.emergencyCareAvailable })} className="accent-[#e86f18]" />
                          Emergency Care Available
                        </label>
                        <p className="text-[10px] text-[#667883] mt-1">Only enable if your clinic provides emergency services.</p>
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-[#173247] pt-2 border-t border-[#e1cfb0]">Weekly Schedule</h3>
                    <div className="space-y-2">
                      {(catData.consultationHours || []).map((day: ConsultationDay, idx: number) => (
                        <div key={day.day} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e1cfb0] bg-[#fbf6ec] p-3">
                          <span className="w-20 text-xs font-bold text-[#173247]">{day.day}</span>
                          <label className="flex items-center gap-1.5 text-xs font-semibold"><input type="checkbox" checked={day.isClosed} onChange={() => { const u = [...catData.consultationHours]; u[idx] = { ...day, isClosed: !day.isClosed }; setCatData({ ...catData, consultationHours: u }); }} className="accent-red-500" /> Closed</label>
                          {!day.isClosed && (<>
                            <input type="text" placeholder="Morning" value={day.morningSession || ""} onChange={(e) => { const u = [...catData.consultationHours]; u[idx] = { ...day, morningSession: e.target.value }; setCatData({ ...catData, consultationHours: u }); }} className="flex-1 min-w-[130px] rounded-lg border border-[#d8c4a3] p-2 text-xs outline-none" />
                            <input type="text" placeholder="Evening" value={day.eveningSession || ""} onChange={(e) => { const u = [...catData.consultationHours]; u[idx] = { ...day, eveningSession: e.target.value }; setCatData({ ...catData, consultationHours: u }); }} className="flex-1 min-w-[130px] rounded-lg border border-[#d8c4a3] p-2 text-xs outline-none" />
                          </>)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button type="button" onClick={() => void saveCatData(catData)} disabled={savingCatData} className="rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-6 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50">{savingCatData ? "Saving..." : "Save Schedule"}</button>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ═══ SHARED NON-HOTEL TABS ═════════════════════════════════════ */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            {/* OFFERS TAB (shared for all non-hotel categories) */}
            {activeTab === "offers" && category !== "Hotels & Stays" && catData && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1cfb0] pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#173247]">Offers & Deals</h2>
                    <p className="text-xs text-[#667883] mt-1">Manage special offers, discounts, and promotional deals.</p>
                  </div>
                  <button type="button" onClick={() => { setEditingCatOffer(null); setCatOfferForm({ title: "", description: "", discountText: "10% OFF", validFrom: new Date().toISOString().split("T")[0], validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0], terms: "", enabled: true }); setCatOfferModalOpen(true); }} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-4 py-2.5 text-xs font-bold text-white shadow-md">
                    <Plus className="h-4 w-4" /> Add Offer
                  </button>
                </div>
                {!catData.offers?.length ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-[#d8c4a3] p-10 text-center">
                    <Tag className="mx-auto h-12 w-12 text-[#e86f18] opacity-70" />
                    <h3 className="mt-4 text-lg font-bold text-[#173247]">No Offers Yet</h3>
                    <p className="mt-1 text-sm text-[#667883]">Create special offers and deals for your customers.</p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {catData.offers.map((off: Offer) => (
                      <article key={off.id} className="overflow-hidden rounded-2xl border border-[#e1cfb0] bg-white p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-base font-bold text-[#173247]">{off.title || "Untitled Offer"}</h3>
                            {off.description && <p className="mt-1 text-xs text-[#667883]">{off.description}</p>}
                          </div>
                          <span className="text-sm font-extrabold text-[#e86f18] whitespace-nowrap bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">{off.discountText}</span>
                        </div>
                        <div className="mt-3 text-[10px] text-[#667883]">Valid: {off.validFrom} – {off.validUntil}</div>
                        <div className="mt-3 flex gap-2 border-t border-[#e1cfb0] pt-3">
                          <button type="button" onClick={() => { setEditingCatOffer(off); setCatOfferForm(off); setCatOfferModalOpen(true); }} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#d8c4a3] bg-white py-2 text-xs font-bold text-[#173247] hover:bg-orange-50"><Edit2 className="h-3.5 w-3.5 text-[#e86f18]" /> Edit</button>
                          <button type="button" onClick={() => { if (confirm("Remove offer?")) { const u = catData.offers.filter((o: Offer) => o.id !== off.id); void saveCatData({ ...catData, offers: u }); }}} className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* REVIEWS TAB (shared for all non-hotel categories) */}
            {activeTab === "reviews" && category !== "Hotels & Stays" && catData && (
              <div>
                <div className="border-b border-[#e1cfb0] pb-4">
                  <h2 className="text-2xl font-bold text-[#173247]">Customer Reviews</h2>
                  <p className="text-xs text-[#667883] mt-1">Genuine reviews from verified visitors on Discover Nashik. Reviews cannot be edited or deleted by business owners.</p>
                </div>
                {!catData.reviews?.length ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-[#d8c4a3] p-10 text-center">
                    <Star className="mx-auto h-12 w-12 text-[#e86f18] opacity-70" />
                    <h3 className="mt-4 text-lg font-bold text-[#173247]">No Reviews Yet</h3>
                    <p className="mt-1 text-sm text-[#667883]">Customer reviews will appear here as visitors review your listing.</p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {catData.reviews.map((review: Review) => (
                      <div key={review.id} className="rounded-2xl border border-[#e1cfb0] bg-white p-5 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-[#173247] text-sm">{review.reviewerName}</span>
                            <span className="text-xs text-[#667883] ml-3">{review.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />))}
                          </div>
                        </div>
                        <p className="mt-3 text-xs text-[#173247] leading-relaxed">{review.comment}</p>
                        {review.ownerReply ? (
                          <div className="mt-4 rounded-xl bg-orange-50/70 p-3.5 border border-orange-200 text-xs">
                            <span className="font-bold text-[#e86f18]">Official Response:</span>
                            <p className="text-[#173247] mt-1">{review.ownerReply}</p>
                          </div>
                        ) : replyingReviewId === review.id ? (
                          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <textarea rows={2} placeholder="Write an official response..." value={replyText} onChange={(e) => setReplyText(e.target.value)} className="w-full rounded-lg border border-[#d8c4a3] p-2 text-xs outline-none" />
                            <div className="flex gap-2 justify-end">
                              <button type="button" onClick={() => setReplyingReviewId(null)} className="px-3 py-1.5 text-xs font-semibold text-[#667883]">Cancel</button>
                              <button type="button" onClick={() => { if (!catData || !replyText.trim()) return; const updatedReviews = catData.reviews.map((r: Review) => r.id === review.id ? { ...r, ownerReply: replyText.trim(), ownerReplyDate: new Date().toISOString().split("T")[0] } : r); setReplyingReviewId(null); setReplyText(""); void saveCatData({ ...catData, reviews: updatedReviews }); }} className="px-3 py-1.5 rounded-lg bg-[#e86f18] text-xs font-bold text-white hover:bg-[#c9580f]">Post Response</button>
                            </div>
                          </div>
                        ) : (
                          <button type="button" onClick={() => { setReplyingReviewId(review.id); setReplyText(""); }} className="mt-3 text-xs font-bold text-[#e86f18] hover:text-[#c9580f] inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> Reply</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* INSIGHTS TAB (shared for all non-hotel categories) */}
            {activeTab === "insights" && category !== "Hotels & Stays" && catData && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1cfb0] pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#173247]">Performance Insights</h2>
                    <p className="text-xs text-[#667883] mt-1">Real visitor engagement metrics on Discover Nashik.</p>
                  </div>
                </div>
                <div className="mt-6">
                  {catData.stats && (catData.stats.profileViews > 0 || catData.stats.contactClicks > 0) ? (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                      {[
                        { title: "Profile Views", value: catData.stats.profileViews || 0, prev: catData.stats.prevProfileViews || 0 },
                        { title: "Contact Clicks", value: catData.stats.contactClicks || 0, prev: catData.stats.prevContactClicks || 0 },
                        { title: "Direction Clicks", value: catData.stats.directionClicks || 0, prev: catData.stats.prevDirectionClicks || 0 },
                        { title: "Offer Views", value: catData.stats.offerViews || 0, prev: catData.stats.prevOfferViews || 0 },
                      ].map((stat) => {
                        const diff = stat.value - stat.prev;
                        const pct = stat.prev > 0 ? ((diff / stat.prev) * 100).toFixed(1) : "0.0";
                        return (
                          <div key={stat.title} className="rounded-2xl border border-[#e1cfb0] bg-white p-4 shadow-sm">
                            <span className="text-[10px] font-bold uppercase text-[#667883] tracking-wider block">{stat.title}</span>
                            <span className="text-2xl font-extrabold text-[#173247] mt-1 block">{stat.value.toLocaleString("en-IN")}</span>
                            <div className="mt-2 text-xs font-bold">
                              <span className={diff >= 0 ? "text-emerald-600" : "text-red-600"}>{diff >= 0 ? `+${pct}%` : `${pct}%`}</span>
                              <span className="text-[#667883] font-normal text-[10px] ml-1">vs previous period</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#d8c4a3] p-10 text-center">
                      <TrendingUp className="mx-auto h-12 w-12 text-[#e86f18] opacity-70" />
                      <h3 className="mt-4 text-lg font-bold text-[#173247]">Not Enough Data Yet</h3>
                      <p className="mt-1 text-sm text-[#667883]">Analytics will appear here as visitors interact with your listing.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* --- ADD / EDIT ROOM MODAL --- */}
      {roomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#e1cfb0] bg-white p-6 md:p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setRoomModalOpen(false)}
              className="absolute top-4 right-4 rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-2xl font-bold text-[#173247]">{editingRoom ? "Edit Room Type" : "Add New Room Type"}</h2>
            <p className="text-xs text-[#667883] mt-1">Configure room specifications, guest capacity, pricing, and photos.</p>

            <form onSubmit={handleSaveRoom} className="mt-6 space-y-4 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-bold text-[#173247] uppercase block mb-1">Room Name / Type *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deluxe AC Room"
                    value={roomForm.name || ""}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                    className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs font-semibold text-[#173247] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#173247] uppercase block mb-1">Price / Rate Per Night (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 3500"
                    value={roomForm.price || ""}
                    onChange={(e) => setRoomForm({ ...roomForm, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs font-semibold text-[#173247] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#173247] uppercase block mb-1">Total Rooms Available</label>
                  <input
                    type="number"
                    min="1"
                    value={roomForm.totalRooms || 1}
                    onChange={(e) => setRoomForm({ ...roomForm, totalRooms: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs font-semibold text-[#173247] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#173247] uppercase block mb-1">Air Conditioning</label>
                  <select
                    value={roomForm.isAC ? "true" : "false"}
                    onChange={(e) => setRoomForm({ ...roomForm, isAC: e.target.value === "true" })}
                    className="w-full rounded-xl border border-[#d8c4a3] bg-white p-3 text-xs font-semibold text-[#173247] outline-none"
                  >
                    <option value="true">AC Room</option>
                    <option value="false">Non-AC Room</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#173247] uppercase block mb-1">Bed Type</label>
                  <select
                    value={roomForm.bedType || "King"}
                    onChange={(e) => setRoomForm({ ...roomForm, bedType: e.target.value as any })}
                    className="w-full rounded-xl border border-[#d8c4a3] bg-white p-3 text-xs font-semibold text-[#173247] outline-none"
                  >
                    <option value="King">King Bed</option>
                    <option value="Queen">Queen Bed</option>
                    <option value="Double">Double Bed</option>
                    <option value="Single">Single Bed</option>
                    <option value="Twin">Twin Beds</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#173247] uppercase block mb-1">Number of Beds</label>
                  <input
                    type="number"
                    min="1"
                    value={roomForm.numBeds || 1}
                    onChange={(e) => setRoomForm({ ...roomForm, numBeds: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs font-semibold text-[#173247] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#173247] uppercase block mb-1">Max Guest Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={roomForm.maxGuests || 2}
                    onChange={(e) => setRoomForm({ ...roomForm, maxGuests: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs font-semibold text-[#173247] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#173247] uppercase block mb-1">Adults Allowed</label>
                  <input
                    type="number"
                    min="1"
                    value={roomForm.adultsAllowed || 2}
                    onChange={(e) => setRoomForm({ ...roomForm, adultsAllowed: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs font-semibold text-[#173247] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#173247] uppercase block mb-1">Room Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe room features, view, layout..."
                  value={roomForm.description || ""}
                  onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                  className="w-full rounded-xl border border-[#d8c4a3] p-3 text-xs font-medium text-[#173247] outline-none"
                />
              </div>

              {/* Photo URLs */}
              <div>
                <label className="font-bold text-[#173247] uppercase block mb-1">Room Photo URLs (Up to 6)</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`Photo ${idx + 1} URL`}
                      value={(roomForm.photos || [])[idx] || ""}
                      onChange={(e) => {
                        const updated = [...(roomForm.photos || [])];
                        updated[idx] = e.target.value;
                        setRoomForm({ ...roomForm, photos: updated });
                      }}
                      className="rounded-xl border border-[#d8c4a3] p-2.5 text-xs outline-none"
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[#e1cfb0]">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="rounded-xl border border-[#d8c4a3] px-5 py-2.5 text-xs font-bold text-[#667883] hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#e86f18] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#c9580f]"
                >
                  Save Room Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
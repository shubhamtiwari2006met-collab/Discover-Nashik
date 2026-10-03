"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Calendar,
  MapPin,
  Users,
  Compass,
  Clock,
  Navigation,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  Send,
  Hotel,
  Bus,
  Train,
  Car,
  Plane,
  ShieldCheck,
  HeartHandshake,
  Luggage,
  Sparkle,
  SlidersHorizontal,
  BookmarkCheck,
  Zap,
  Coffee,
  Check
} from "lucide-react";
import { useUserAuth } from "@/context/UserAuthContext";

const INTEREST_OPTIONS = [
  { id: "Spiritual", label: "Spiritual & Rituals", icon: "🕉️" },
  { id: "Kumbh experiences", label: "Kumbh Ghats & Akharas", icon: "🚩" },
  { id: "Heritage", label: "Ancient Temples & Heritage", icon: "🏛️" },
  { id: "Nature", label: "Nature & Waterfalls", icon: "🌿" },
  { id: "Culture", label: "Local Culture & History", icon: "📜" },
  { id: "Food", label: "Authentic Culinary & Sweets", icon: "🍲" },
  { id: "Photography", label: "Photography & Viewpoints", icon: "📷" },
  { id: "Shopping", label: "Bazaars & Copperware", icon: "🛍️" },
  { id: "Vineyards", label: "Vineyards & Tasting", icon: "🍷" },
  { id: "Family", label: "Family Friendly Spots", icon: "👨‍👩‍👧‍👦" }
];

export default function KumbhPlannerPage() {
  const { user, isAuthenticated, openAuthModal } = useUserAuth();
  const router = useRouter();

  // Active view: 'form' | 'itinerary' | 'history'
  const [viewMode, setViewMode] = useState<"form" | "itinerary" | "history">("form");

  // Form State
  const [destination, setDestination] = useState("Nashik + Trimbakeshwar");
  const [startDate, setStartDate] = useState("2027-08-20");
  const [endDate, setEndDate] = useState("2027-08-22");
  const [adults, setAdults] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [seniorCitizens, setSeniorCitizens] = useState(0);
  const [interests, setInterests] = useState<string[]>(["Spiritual", "Kumbh experiences", "Heritage"]);
  const [travelStyle, setTravelStyle] = useState("Balanced");
  const [budget, setBudget] = useState("Moderate");
  const [arrivalMode, setArrivalMode] = useState("Train");
  const [departureMode, setDepartureMode] = useState("Train");
  const [stayType, setStayType] = useState("Discover Nashik Partner Hotel");
  
  // Preferences
  const [prefLowWalking, setPrefLowWalking] = useState(false);
  const [prefVegetarian, setPrefVegetarian] = useState(true);
  const [prefAvoidCrowds, setPrefAvoidCrowds] = useState(false);
  const [prefEarlyMorning, setPrefEarlyMorning] = useState(true);
  const [prefAccessibility, setPrefAccessibility] = useState(false);

  // Saved / Current Trip Data
  const [savedTrips, setSavedTrips] = useState<any[]>([]);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiModifying, setAiModifying] = useState(false);

  // Add Item Modal State
  const [addingItemDayIdx, setAddingItemDayIdx] = useState<number | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemLocation, setNewItemLocation] = useState("Nashik");
  const [newItemCategory, setNewItemCategory] = useState("Spiritual");
  const [newItemTime, setNewItemTime] = useState("10:00 AM");

  // Fetch saved trips on load if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserTrips();
    }
  }, [isAuthenticated]);

  const fetchUserTrips = async () => {
    try {
      const res = await fetch("/api/kumbh/trips", {
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.trips && data.trips.length > 0) {
          setSavedTrips(data.trips);
          // If no active trip yet, set the latest saved trip
          if (!activeTrip) {
            setActiveTrip(data.trips[0]);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching trips:", err);
    }
  };

  const toggleInterest = (id: string) => {
    if (interests.includes(id)) {
      setInterests(interests.filter(i => i !== id));
    } else {
      setInterests([...interests, id]);
    }
  };

  const handleGenerateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        destination,
        startDate,
        endDate,
        travellers: {
          adults,
          children: childrenCount,
          seniorCitizens
        },
        interests,
        travelStyle,
        budget,
        arrivalMode,
        departureMode,
        stayType,
        preferences: {
          lowWalking: prefLowWalking,
          vegetarianOnly: prefVegetarian,
          avoidCrowds: prefAvoidCrowds,
          earlyMorningPreference: prefEarlyMorning,
          accessibilityNeeded: prefAccessibility
        }
      };

      const res = await fetch("/api/kumbh/trips/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveTrip(data.trip);
        setViewMode("itinerary");
        fetchUserTrips();
      } else {
        setErrorMsg(data.message || "Failed to generate personalized trip. Please try again.");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setErrorMsg("Connection error while planning your trip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAiModify = async (customPrompt?: string) => {
    const promptToSend = customPrompt || aiPrompt;
    if (!promptToSend.trim() || !activeTrip) return;

    setAiModifying(true);
    try {
      const res = await fetch(`/api/kumbh/trips/${activeTrip._id}/modify-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptToSend })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveTrip(data.trip);
        setAiPrompt("");
      } else {
        alert(data.message || "Could not apply AI change.");
      }
    } catch (err) {
      console.error("AI Modify error:", err);
      alert("Failed to communicate with AI planner engine.");
    } finally {
      setAiModifying(false);
    }
  };

  const toggleItemCompletion = async (dayIdx: number, itemIdx: number) => {
    if (!activeTrip) return;
    const updatedDays = [...activeTrip.days];
    updatedDays[dayIdx].items[itemIdx].isCompleted = !updatedDays[dayIdx].items[itemIdx].isCompleted;

    const updatedTrip = { ...activeTrip, days: updatedDays };
    setActiveTrip(updatedTrip);

    // Save to backend
    try {
      await fetch(`/api/kumbh/trips/${activeTrip._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: updatedDays })
      });
    } catch (err) {
      console.error("Save completion error:", err);
    }
  };

  const removeItem = async (dayIdx: number, itemIdx: number) => {
    if (!activeTrip) return;
    const updatedDays = [...activeTrip.days];
    updatedDays[dayIdx].items.splice(itemIdx, 1);

    const updatedTrip = { ...activeTrip, days: updatedDays };
    setActiveTrip(updatedTrip);

    try {
      await fetch(`/api/kumbh/trips/${activeTrip._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: updatedDays })
      });
    } catch (err) {
      console.error("Remove item error:", err);
    }
  };

  const handleAddItem = async () => {
    if (addingItemDayIdx === null || !newItemTitle.trim() || !activeTrip) return;

    const updatedDays = [...activeTrip.days];
    updatedDays[addingItemDayIdx].items.push({
      placeId: null,
      title: newItemTitle.trim(),
      category: newItemCategory,
      location: newItemLocation,
      startTime: newItemTime,
      endTime: "Flexible",
      durationMinutes: 60,
      travelMinutes: 15,
      notes: "Custom added activity.",
      isCompleted: false
    });

    const updatedTrip = { ...activeTrip, days: updatedDays };
    setActiveTrip(updatedTrip);
    setAddingItemDayIdx(null);
    setNewItemTitle("");

    try {
      await fetch(`/api/kumbh/trips/${activeTrip._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: updatedDays })
      });
    } catch (err) {
      console.error("Add item error:", err);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm("Are you sure you want to delete this trip itinerary?")) return;
    try {
      const res = await fetch(`/api/kumbh/trips/${tripId}`, { method: "DELETE" });
      if (res.ok) {
        const remaining = savedTrips.filter(t => t._id !== tripId);
        setSavedTrips(remaining);
        if (activeTrip?._id === tripId) {
          if (remaining.length > 0) {
            setActiveTrip(remaining[0]);
          } else {
            setActiveTrip(null);
            setViewMode("form");
          }
        }
      }
    } catch (err) {
      console.error("Delete trip error:", err);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f2e9] text-[#173247] py-8 md:py-12 relative overflow-hidden">
      {/* Background Subtle Motif */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#b86628_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="container mx-auto px-4 max-w-5xl relative z-10 space-y-8">
        
        {/* Navigation Breadcrumb & Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 sm:px-6 rounded-2xl border border-[#e1cfb0] shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href="/kumbh"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#b86628] hover:text-[#9e4129] transition-colors bg-[#fff7ed] px-3 py-1.5 rounded-xl border border-[#e7b06d]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Explore Kumbh
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#173247] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#d4a359]" /> Personalized Kumbh Trip Planner
              </h1>
              <p className="text-xs text-[#667883]">Tailored daily itineraries for Kumbh 2027 &amp; sacred Nashik</p>
            </div>
          </div>

          {/* User Auth Context Header Tag */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 bg-[#f4fbf6] border border-[#a3e6ba] px-3.5 py-1.5 rounded-xl text-xs">
              <ShieldCheck className="w-4 h-4 text-[#2e7d32]" />
              <div>
                <span className="font-bold text-[#1b5e20] block">Authenticated Pilgrim</span>
                {user?.platformId && (
                  <span className="text-[11px] font-mono text-[#2e7d32] font-semibold">{user.platformId}</span>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              className="px-4 py-2 rounded-xl bg-[#e86f18] text-white text-xs font-bold shadow-md hover:bg-[#c9580f] transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" /> Sign In to Save Trips
            </button>
          )}
        </div>

        {/* Navigation Tabs (Planner Form vs Active Itinerary vs Saved History) */}
        <div className="flex items-center justify-between border-b border-[#e1cfb0] pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("form")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                viewMode === "form"
                  ? "bg-[#2c1810] text-[#fffdf8] shadow-md"
                  : "bg-white/60 text-[#667883] hover:bg-white border border-[#e1cfb0]"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" /> 1. Configure Trip Preferences
            </button>

            {activeTrip && (
              <button
                type="button"
                onClick={() => setViewMode("itinerary")}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                  viewMode === "itinerary"
                    ? "bg-[#2c1810] text-[#fffdf8] shadow-md"
                    : "bg-white/60 text-[#667883] hover:bg-white border border-[#e1cfb0]"
                }`}
              >
                <Compass className="w-4 h-4" /> 2. My Kumbh Journey
              </button>
            )}
          </div>

          {savedTrips.length > 0 && (
            <button
              type="button"
              onClick={() => setViewMode("history")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "history"
                  ? "bg-[#d4a359] text-[#2c1810]"
                  : "bg-white/80 text-[#865d2c] border border-[#e1cfb0] hover:bg-orange-50"
              }`}
            >
              <BookmarkCheck className="w-4 h-4" /> My Saved Journeys ({savedTrips.length})
            </button>
          )}
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* VIEW MODE 1: TRIP PLANNER FORM */}
        {/* ───────────────────────────────────────────────────────────── */}
        {viewMode === "form" && (
          <form onSubmit={handleGenerateTrip} className="space-y-8">
            <div className="rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 md:p-8 shadow-[0_10px_30px_rgba(50,20,10,0.05)] space-y-8">
              
              {/* Step Title */}
              <div className="border-b border-[#f0e2cd] pb-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e86f18]">
                  Personalized AI Engine
                </span>
                <h2 className="text-2xl font-serif font-bold text-[#2c1810]">
                  Design Your Kumbh 2027 Experience
                </h2>
                <p className="text-xs text-[#667883] mt-1">
                  Fill in your travel preferences to generate a custom day-by-day structured itinerary.
                </p>
              </div>

              {/* Unauthenticated Warning Banner */}
              {!isAuthenticated && (
                <div className="p-4 rounded-2xl bg-[#fff7ed] border border-[#e7b06d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#9e4129]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#e86f18] shrink-0" />
                    <span>
                      <strong>Account required to save:</strong> You can configure your trip, but you will need to sign in or create an account to view and edit your saved itinerary.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={openAuthModal}
                    className="px-3.5 py-1.5 rounded-xl bg-[#e86f18] text-white font-bold shrink-0 hover:bg-[#c9580f] transition-colors"
                  >
                    Sign In / Register
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* GRID 1: Destination & Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#173247] mb-2 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#e86f18]" /> Primary Destination
                  </label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#d8c4a3] bg-white text-xs font-medium focus:ring-2 focus:ring-[#e86f18] focus:outline-none"
                  >
                    <option value="Nashik + Trimbakeshwar">Nashik + Trimbakeshwar (Recommended)</option>
                    <option value="Nashik City Only">Nashik City &amp; Ram Kund</option>
                    <option value="Trimbakeshwar Only">Trimbakeshwar Jyotirlinga Focus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#173247] mb-2 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#e86f18]" /> Arrival Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#d8c4a3] bg-white text-xs font-medium focus:ring-2 focus:ring-[#e86f18] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#173247] mb-2 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#e86f18]" /> Departure Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#d8c4a3] bg-white text-xs font-medium focus:ring-2 focus:ring-[#e86f18] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* GRID 2: Travellers Breakdown */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase text-[#173247] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#e86f18]" /> Travellers Breakdown
                </label>
                <div className="grid grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-[#e1cfb0]">
                  <div className="text-center space-y-1">
                    <span className="text-xs font-bold text-[#667883] block">Adults</span>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        className="w-7 h-7 rounded-lg bg-orange-100 text-[#e86f18] font-bold hover:bg-orange-200"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm w-4 text-center">{adults}</span>
                      <button
                        type="button"
                        onClick={() => setAdults(adults + 1)}
                        className="w-7 h-7 rounded-lg bg-orange-100 text-[#e86f18] font-bold hover:bg-orange-200"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-center space-y-1 border-x border-[#f0e2cd]">
                    <span className="text-xs font-bold text-[#667883] block">Children</span>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                        className="w-7 h-7 rounded-lg bg-orange-100 text-[#e86f18] font-bold hover:bg-orange-200"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm w-4 text-center">{childrenCount}</span>
                      <button
                        type="button"
                        onClick={() => setChildrenCount(childrenCount + 1)}
                        className="w-7 h-7 rounded-lg bg-orange-100 text-[#e86f18] font-bold hover:bg-orange-200"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <span className="text-xs font-bold text-[#667883] block">Seniors (60+)</span>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSeniorCitizens(Math.max(0, seniorCitizens - 1))}
                        className="w-7 h-7 rounded-lg bg-orange-100 text-[#e86f18] font-bold hover:bg-orange-200"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm w-4 text-center">{seniorCitizens}</span>
                      <button
                        type="button"
                        onClick={() => setSeniorCitizens(seniorCitizens + 1)}
                        className="w-7 h-7 rounded-lg bg-orange-100 text-[#e86f18] font-bold hover:bg-orange-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* GRID 3: Interests Selection (Multi-select) */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase text-[#173247] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#e86f18]" /> Interests &amp; Experience Categories
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {INTEREST_OPTIONS.map((item) => {
                    const selected = interests.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleInterest(item.id)}
                        className={`p-3 rounded-2xl text-left border transition-all text-xs flex flex-col justify-between gap-2 ${
                          selected
                            ? "bg-[#fff7ed] border-[#e86f18] shadow-sm text-[#9e4129] font-bold"
                            : "bg-white border-[#e1cfb0] text-[#667883] hover:border-[#e86f18]"
                        }`}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* GRID 4: Travel Style & Budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#173247] mb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#e86f18]" /> Travel Pace / Style
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Relaxed", "Balanced", "Packed"].map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setTravelStyle(style)}
                        className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          travelStyle === style
                            ? "bg-[#2c1810] text-white border-[#2c1810]"
                            : "bg-white text-[#667883] border-[#d8c4a3] hover:bg-orange-50"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#173247] mb-2 flex items-center gap-1.5">
                    <Luggage className="w-4 h-4 text-[#e86f18]" /> Budget Tier
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["Budget", "Moderate", "Premium", "Custom"].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBudget(b)}
                        className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          budget === b
                            ? "bg-[#2c1810] text-white border-[#2c1810]"
                            : "bg-white text-[#667883] border-[#d8c4a3] hover:bg-orange-50"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* GRID 5: Arrival, Departure & Accommodation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#173247] mb-2 flex items-center gap-1.5">
                    <Train className="w-4 h-4 text-[#e86f18]" /> Arrival Mode
                  </label>
                  <select
                    value={arrivalMode}
                    onChange={(e) => setArrivalMode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#d8c4a3] bg-white text-xs font-medium focus:ring-2 focus:ring-[#e86f18] focus:outline-none"
                  >
                    <option value="Train">Train (Nashik Road Station)</option>
                    <option value="Bus">State / Private Bus</option>
                    <option value="Car">Personal Car / Taxi</option>
                    <option value="Flight">Ozar Flight (ISK)</option>
                    <option value="Other">Other Mode</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#173247] mb-2 flex items-center gap-1.5">
                    <Train className="w-4 h-4 text-[#e86f18]" /> Departure Mode
                  </label>
                  <select
                    value={departureMode}
                    onChange={(e) => setDepartureMode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#d8c4a3] bg-white text-xs font-medium focus:ring-2 focus:ring-[#e86f18] focus:outline-none"
                  >
                    <option value="Train">Train</option>
                    <option value="Bus">Bus</option>
                    <option value="Car">Car / Taxi</option>
                    <option value="Flight">Flight</option>
                    <option value="Other">Other Mode</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#173247] mb-2 flex items-center gap-1.5">
                    <Hotel className="w-4 h-4 text-[#e86f18]" /> Accommodation Type
                  </label>
                  <select
                    value={stayType}
                    onChange={(e) => setStayType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#d8c4a3] bg-white text-xs font-medium focus:ring-2 focus:ring-[#e86f18] focus:outline-none"
                  >
                    <option value="Discover Nashik Partner Hotel">Discover Nashik Accommodation</option>
                    <option value="Dharamshala / Ashram">Dharamshala &amp; Ashram</option>
                    <option value="Luxury Resort">Luxury Hotel / Vineyard Resort</option>
                    <option value="Self Arranged">Self Arranged Stay</option>
                  </select>
                </div>
              </div>

              {/* GRID 6: Special Preferences (Checkboxes) */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase text-[#173247] flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-[#e86f18]" /> Special Accessibility &amp; Dietary Preferences
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#e1cfb0] text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefLowWalking}
                      onChange={(e) => setPrefLowWalking(e.target.checked)}
                      className="rounded text-[#e86f18] focus:ring-[#e86f18]"
                    />
                    <span>Low Walking / Avoid Stairs</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#e1cfb0] text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefVegetarian}
                      onChange={(e) => setPrefVegetarian(e.target.checked)}
                      className="rounded text-[#e86f18] focus:ring-[#e86f18]"
                    />
                    <span>Pure Vegetarian Food Focus</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#e1cfb0] text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefAvoidCrowds}
                      onChange={(e) => setPrefAvoidCrowds(e.target.checked)}
                      className="rounded text-[#e86f18] focus:ring-[#e86f18]"
                    />
                    <span>Avoid Peak Crowd Hours</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#e1cfb0] text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefEarlyMorning}
                      onChange={(e) => setPrefEarlyMorning(e.target.checked)}
                      className="rounded text-[#e86f18] focus:ring-[#e86f18]"
                    />
                    <span>Early Morning Darshan / Dip</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#e1cfb0] text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefAccessibility}
                      onChange={(e) => setPrefAccessibility(e.target.checked)}
                      className="rounded text-[#e86f18] focus:ring-[#e86f18]"
                    />
                    <span>Wheelchair / Ramp Access</span>
                  </label>
                </div>
              </div>

              {/* Submit CTA Button */}
              <div className="pt-4 border-t border-[#f0e2cd] flex items-center justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] text-white font-bold text-sm shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Crafting Personalized Itinerary...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Generate My Kumbh Itinerary <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </div>
          </form>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* VIEW MODE 2: ACTIVE ITINERARY DASHBOARD ("MY KUMBH JOURNEY") */}
        {/* ───────────────────────────────────────────────────────────── */}
        {viewMode === "itinerary" && activeTrip && (
          <div className="space-y-8">
            
            {/* Trip Overview Summary Header Card */}
            <div className="rounded-3xl bg-gradient-to-br from-[#2c1810] via-[#4a2417] to-[#1e100a] p-6 md:p-8 text-white shadow-2xl border border-[#d4a359]/30 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-64 h-64 bg-[#d4a359]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4a359]/20 border border-[#d4a359]/40 text-[#fce8c5] text-xs font-bold uppercase tracking-widest">
                    <BookmarkCheck className="w-3.5 h-3.5 text-[#d4a359]" /> Saved Itinerary
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#fffdf8]">
                    {activeTrip.title}
                  </h2>
                  <p className="text-xs text-[#e6d5c3] flex items-center gap-4">
                    <span>📅 {activeTrip.startDate} to {activeTrip.endDate}</span>
                    <span>👥 {activeTrip.travellers?.adults || 2} Adults, {activeTrip.travellers?.children || 0} Children</span>
                    <span>🏷️ {activeTrip.travelStyle} Pace</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode("form")}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold transition-all text-white flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-4 h-4" /> Edit Preferences
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTrip(activeTrip._id)}
                    className="px-3.5 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-xs font-bold transition-all text-red-200 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </div>

            {/* AI NATURAL LANGUAGE MODIFICATION ENGINE BAR */}
            <div className="rounded-3xl border border-[#e7b06d] bg-[#fffdf8] p-6 shadow-md space-y-4">
              <div className="flex items-center gap-2 text-[#9e4129]">
                <Zap className="w-5 h-5 text-[#e86f18]" />
                <h3 className="text-base font-bold font-serif">Ask AI to Adjust Itinerary</h3>
              </div>
              <p className="text-xs text-[#667883]">
                Type changes in plain text like &ldquo;Add Trimbakeshwar temple&rdquo;, &ldquo;Make Day 2 less hectic&rdquo;, or &ldquo;Remove shopping&rdquo;.
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Add Trimbakeshwar early morning bath or remove trekking..."
                  className="flex-1 px-4 py-3 rounded-xl border border-[#d8c4a3] bg-white text-xs font-medium focus:ring-2 focus:ring-[#e86f18] focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleAiModify()}
                />
                <button
                  type="button"
                  onClick={() => handleAiModify()}
                  disabled={aiModifying || !aiPrompt.trim()}
                  className="px-5 py-3 rounded-xl bg-[#e86f18] text-white text-xs font-bold hover:bg-[#c9580f] transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {aiModifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Modify</span>
                </button>
              </div>

              {/* Quick AI Suggestion Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span className="text-[#667883] font-semibold">Quick Suggestions:</span>
                <button
                  type="button"
                  onClick={() => handleAiModify("Add Trimbakeshwar Jyotirlinga")}
                  className="px-2.5 py-1 rounded-lg bg-orange-100/80 text-[#9e4129] font-medium hover:bg-orange-200"
                >
                  + Add Trimbakeshwar
                </button>
                <button
                  type="button"
                  onClick={() => handleAiModify("Make itinerary less hectic")}
                  className="px-2.5 py-1 rounded-lg bg-orange-100/80 text-[#9e4129] font-medium hover:bg-orange-200"
                >
                  😌 Make Itinerary Relaxed
                </button>
                <button
                  type="button"
                  onClick={() => handleAiModify("Remove shopping activities")}
                  className="px-2.5 py-1 rounded-lg bg-orange-100/80 text-[#9e4129] font-medium hover:bg-orange-200"
                >
                  🚫 Remove Shopping
                </button>
                <button
                  type="button"
                  onClick={() => handleAiModify("Low walking preferences only")}
                  className="px-2.5 py-1 rounded-lg bg-orange-100/80 text-[#9e4129] font-medium hover:bg-orange-200"
                >
                  ♿ Low Walking Only
                </button>
              </div>
            </div>

            {/* DAY-BY-DAY ITINERARY LIST */}
            <div className="space-y-6">
              {activeTrip.days && activeTrip.days.map((day: any, dayIdx: number) => (
                <div
                  key={day.dayNumber || dayIdx}
                  className="rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-sm space-y-4"
                >
                  {/* Day Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#f0e2cd] pb-3 gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#e86f18]">
                        Day {day.dayNumber} • {day.date}
                      </span>
                      <h3 className="text-xl font-serif font-bold text-[#2c1810]">
                        {day.title}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAddingItemDayIdx(dayIdx)}
                      className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-[#e7b06d] bg-[#fff7ed] text-[#e86f18] text-xs font-bold hover:bg-orange-100 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Activity
                    </button>
                  </div>

                  {/* Add Item Form inline */}
                  {addingItemDayIdx === dayIdx && (
                    <div className="p-4 rounded-2xl bg-orange-50/70 border border-[#e7b06d] space-y-3">
                      <h4 className="text-xs font-bold uppercase text-[#9e4129]">Add New Activity to Day {day.dayNumber}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Activity Title (e.g. Sula Vineyard Tour)"
                          value={newItemTitle}
                          onChange={(e) => setNewItemTitle(e.target.value)}
                          className="px-3 py-2 rounded-xl border border-[#d8c4a3] bg-white text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Location (e.g. Panchavati)"
                          value={newItemLocation}
                          onChange={(e) => setNewItemLocation(e.target.value)}
                          className="px-3 py-2 rounded-xl border border-[#d8c4a3] bg-white text-xs"
                        />
                        <select
                          value={newItemCategory}
                          onChange={(e) => setNewItemCategory(e.target.value)}
                          className="px-3 py-2 rounded-xl border border-[#d8c4a3] bg-white text-xs"
                        >
                          <option value="Spiritual">Spiritual</option>
                          <option value="Heritage">Heritage</option>
                          <option value="Nature">Nature</option>
                          <option value="Food">Food</option>
                          <option value="Shopping">Shopping</option>
                          <option value="Vineyards">Vineyards</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setAddingItemDayIdx(null)}
                          className="px-3 py-1.5 rounded-xl border border-[#d8c4a3] text-xs font-bold text-[#667883]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="px-4 py-1.5 rounded-xl bg-[#e86f18] text-white text-xs font-bold hover:bg-[#c9580f]"
                        >
                          Save Activity
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Activity Timeline Items */}
                  <div className="space-y-3">
                    {day.items && day.items.map((item: any, itemIdx: number) => (
                      <div
                        key={itemIdx}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          item.isCompleted
                            ? "bg-emerald-50/60 border-emerald-200 opacity-75"
                            : "bg-white border-[#e1cfb0] hover:border-[#e86f18]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleItemCompletion(dayIdx, itemIdx)}
                            className="mt-0.5 text-[#e86f18] hover:scale-110 transition-transform"
                          >
                            {item.isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-[#d8c4a3]" />
                            )}
                          </button>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-[#2c1810]">{item.startTime}</span>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-[#9e4129]">
                                {item.category}
                              </span>
                              <span className="text-xs text-[#667883]">📍 {item.location}</span>
                            </div>
                            <h4 className={`text-sm font-bold mt-1 ${item.isCompleted ? "line-through text-slate-500" : "text-[#173247]"}`}>
                              {item.title}
                            </h4>
                            {item.notes && (
                              <p className="text-xs text-[#667883] mt-0.5">{item.notes}</p>
                            )}
                          </div>
                        </div>

                        {/* Timing & Buffer Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#f0e2cd]">
                          <div className="text-right text-[11px] text-[#667883]">
                            <span>⏱️ {item.durationMinutes} mins</span>
                            <span className="block text-[10px] text-[#b86628]">🚘 {item.travelMinutes} mins travel buffer</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(dayIdx, itemIdx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* VIEW MODE 3: SAVED JOURNEYS HISTORY LIST */}
        {/* ───────────────────────────────────────────────────────────── */}
        {viewMode === "history" && (
          <div className="rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 md:p-8 shadow-sm space-y-6">
            <div className="border-b border-[#f0e2cd] pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#e86f18]">Your Saved Archives</span>
                <h2 className="text-2xl font-serif font-bold text-[#2c1810]">All My Saved Kumbh Journeys</h2>
              </div>
              <button
                type="button"
                onClick={() => setViewMode("form")}
                className="px-4 py-2 rounded-xl bg-[#e86f18] text-white text-xs font-bold hover:bg-[#c9580f]"
              >
                + Plan New Trip
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedTrips.map((trip) => (
                <div
                  key={trip._id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 cursor-pointer ${
                    activeTrip?._id === trip._id
                      ? "bg-[#fff7ed] border-[#e86f18] shadow-md"
                      : "bg-white border-[#e1cfb0] hover:border-[#e86f18]"
                  }`}
                  onClick={() => {
                    setActiveTrip(trip);
                    setViewMode("itinerary");
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#e86f18]">📅 {trip.startDate} to {trip.endDate}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTrip(trip._id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-base font-bold text-[#173247]">{trip.title}</h3>
                  <p className="text-xs text-[#667883]">
                    {trip.destination} • {trip.days?.length || 0} Days • {trip.travelStyle} Pace
                  </p>
                  <div className="pt-2 border-t border-[#f0e2cd] flex items-center justify-between text-xs font-bold text-[#b86628]">
                    <span>View Itinerary</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

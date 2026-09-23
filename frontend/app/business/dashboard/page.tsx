"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Loader2, Building2, CheckCircle2, Plus, LogOut, FileText, Star,
  BedDouble, Utensils, ShoppingBag, Car, ShoppingCart, Stethoscope, Landmark, Layers,
  Clock, Tag, ShieldCheck, TrendingUp, Calendar, Info, Users, Image as ImageIcon
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { parsePhotoList, normalizeImageUrl, DEFAULT_FALLBACK_IMAGE } from "@/lib/imageUrl";

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

export default function BusinessDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reg, setReg] = useState<BusinessRegistration | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

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

      // If not approved, redirect to minimal pending page
      if (regData.verification_status !== "approved") {
        window.location.replace("/business/pending");
        return;
      }

      setReg(regData as BusinessRegistration);
      setLoading(false);
    })();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-[#e86f18]">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  if (!reg) return null;

  // Category Configuration
  const category = reg.category;

  const categoryConfigs: Record<string, { icon: any; title: string; tabs: { id: string; label: string; icon: any }[] }> = {
    "Hotels & Stays": {
      icon: BedDouble,
      title: "Hotels & Stays Portal",
      tabs: [
        { id: "profile", label: "Business Profile", icon: Building2 },
        { id: "rooms", label: "Rooms & Accommodation", icon: BedDouble },
        { id: "amenities", label: "Amenities", icon: Star },
        { id: "availability", label: "Availability", icon: Calendar },
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
        { id: "services", label: "Services & Fleet", icon: Car },
        { id: "pricing", label: "Pricing & Packages", icon: Tag },
        { id: "availability", label: "Schedule & Availability", icon: Calendar },
        { id: "offers", label: "Offers", icon: Tag },
        { id: "reviews", label: "Reviews", icon: Star },
      ],
    },
    "Shopping & Retail": {
      icon: ShoppingBag,
      title: "Shopping & Retail Portal",
      tabs: [
        { id: "profile", label: "Business Profile", icon: Building2 },
        { id: "products", label: "Products Showcase", icon: ShoppingBag },
        { id: "offers", label: "Discounts & Offers", icon: Tag },
        { id: "timings", label: "Store Timings", icon: Clock },
        { id: "reviews", label: "Customer Reviews", icon: Star },
      ],
    },
    "Healthcare": {
      icon: Stethoscope,
      title: "Healthcare & Clinic Portal",
      tabs: [
        { id: "profile", label: "Clinic Profile", icon: Building2 },
        { id: "services", label: "Medical Services", icon: Stethoscope },
        { id: "doctors", label: "Doctors & Staff", icon: Users },
        { id: "timings", label: "Clinic Timings", icon: Clock },
        { id: "contact", label: "Appointments & Contact", icon: Calendar },
        { id: "reviews", label: "Patient Feedback", icon: Star },
      ],
    },
    "Temples & Religious Places": {
      icon: Landmark,
      title: "Religious Place Management",
      tabs: [
        { id: "profile", label: "Place Profile", icon: Landmark },
        { id: "timings", label: "Darshan Timings", icon: Clock },
        { id: "festivals", label: "Festivals & Events", icon: Calendar },
        { id: "facilities", label: "Visitor Facilities", icon: Star },
        { id: "info", label: "Important Information", icon: Info },
        { id: "reviews", label: "Devotee Reviews", icon: Star },
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
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Top Banner */}
      <div className="mb-8 rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-[#e86f18]">
              <CategoryHeaderIcon className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                  Approved
                </span>
                <span className="text-xs font-bold text-[#e86f18] uppercase tracking-wider">{category}</span>
              </div>
              <h1 className="text-3xl font-bold text-[#173247] mt-1">{reg.business_name}</h1>
              <p className="text-xs font-semibold text-[#667883]">{reg.city_area || reg.address}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/business/register"
              className="flex items-center gap-2 rounded-xl border border-[#d8c4a3] bg-white px-4 py-2.5 text-xs font-bold text-[#173247] hover:bg-orange-50 transition-colors"
            >
              <FileText className="h-4 w-4" /> Edit Profile
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-xl border border-[#d8c4a3] bg-white px-4 py-2.5 text-xs font-bold text-[#667883] hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="grid gap-8 lg:grid-cols-4">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-3 shadow-sm sticky top-24">
            <p className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#667883]">
              {category} Menu
            </p>
            <nav className="space-y-1">
              {currentConfig.tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                      isActive
                        ? "bg-[#e86f18] text-white shadow-md shadow-orange-500/20"
                        : "text-[#667883] hover:bg-orange-50 hover:text-[#c9580f]"
                    }`}
                  >
                    <TabIcon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3">
          <div className="rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-sm sm:p-8 min-h-[500px]">
            {/* 1. Business Profile Tab */}
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
                      <div className="mt-3 grid grid-cols-3 gap-3">
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

            {/* 2. Generic / Category Specific Tabs */}
            {activeTab !== "profile" && (
              <div>
                <div className="flex items-center justify-between border-b border-[#e1cfb0] pb-4">
                  <h2 className="text-2xl font-bold text-[#173247] capitalize">
                    {currentConfig.tabs.find((t) => t.id === activeTab)?.label || activeTab}
                  </h2>
                  <button
                    type="button"
                    onClick={() => alert(`Adding new item to ${activeTab} feature coming soon!`)}
                    className="flex items-center gap-2 rounded-xl bg-[#e86f18] px-4 py-2 text-xs font-bold text-white hover:bg-[#c9580f]"
                  >
                    <Plus className="h-4 w-4" /> Add Item
                  </button>
                </div>

                <div className="mt-8 rounded-2xl border border-dashed border-[#d8c4a3] p-10 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-[#e86f18]">
                    {CategoryHeaderIcon ? <CategoryHeaderIcon className="h-6 w-6" /> : <Layers className="h-6 w-6" />}
                  </div>
                  <h3 className="text-lg font-bold text-[#173247]">
                    Manage {currentConfig.tabs.find((t) => t.id === activeTab)?.label}
                  </h3>
                  <p className="mt-2 text-sm text-[#667883] max-w-md mx-auto">
                    You can manage your category-specific {activeTab} listings, pricing, and availability here for your approved {category} listing.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Building2, UploadCloud, CheckCircle2, Clock, MapPin, Globe, Phone, Mail, User, Image as ImageIcon, Trash2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useTranslation } from "@/lib/i18n";

const CATEGORIES = [
  "Hotels & Stays",
  "Food & Restaurants",
  "Grocery Stores",
  "Temples & Religious Places",
  "Shopping & Retail",
  "Travel & Transport",
  "Tourist Attractions",
  "Healthcare",
  "Services",
  "Other",
] as const;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function BusinessRegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    businessName: "",
    category: CATEGORIES[0] as string,
    subcategory: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    cityArea: "",
    description: "",
    openingTime: "09:00",
    closingTime: "21:00",
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    websiteUrl: "",
    photos: "",
    latitude: "",
    longitude: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetchingExisting, setFetchingExisting] = useState(true);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [detectingCoords, setDetectingCoords] = useState(false);

  // Photo upload states
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login?role=business");
          return;
        }

        // Check if existing registration exists
        const { data: existingReg, error: regError } = await supabase
          .from("business_registrations")
          .select("*")
          .eq("owner_id", session.user.id)
          .maybeSingle();

        if (regError) {
          if (regError.message?.includes("schema cache") || regError.message?.includes("business_registrations")) {
            setError("Table 'public.business_registrations' was not found in Supabase. Please run the SQL schema script (frontend/supabase_schema.sql) in your Supabase SQL Editor.");
          } else if (regError.message?.includes("infinite recursion")) {
            setError("Database policy error: Infinite recursion detected in Supabase RLS policies. Please run the updated SQL script (frontend/supabase_schema.sql) in your Supabase SQL Editor to replace old policies.");
          } else {
            console.error("Error loading existing application:", regError.message);
          }
        }

        if (existingReg && !regError) {
          setExistingId(existingReg.id);
          setForm({
            businessName: existingReg.business_name || "",
            category: existingReg.category || CATEGORIES[0],
            subcategory: existingReg.subcategory || "",
            contactName: existingReg.contact_name || "",
            phone: existingReg.phone || "",
            email: existingReg.email || session.user.email || "",
            address: existingReg.address || "",
            cityArea: existingReg.city_area || "",
            description: existingReg.description || "",
            openingTime: existingReg.opening_time || "09:00",
            closingTime: existingReg.closing_time || "21:00",
            workingDays: existingReg.working_days ? existingReg.working_days.split(",") : WEEKDAYS.slice(0, 6),
            websiteUrl: existingReg.website_url || "",
            photos: existingReg.photos || "",
            latitude: existingReg.latitude != null ? String(existingReg.latitude) : "",
            longitude: existingReg.longitude != null ? String(existingReg.longitude) : "",
          });

          if (existingReg.photos) {
            const firstPhoto = existingReg.photos.split("\n")[0]?.trim();
            if (firstPhoto) {
              setUploadedPreviewUrl(firstPhoto);
            }
          }
        } else {
          setForm((prev) => ({ ...prev, email: session.user.email || "" }));
        }
      } catch (err) {
        console.error("Error loading existing application:", err);
      } finally {
        setFetchingExisting(false);
      }
    })();
  }, []);

  function updateField(field: keyof typeof form, value: any) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleAutoDetectCoords() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingCoords(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setDetectingCoords(false);
      },
      (err) => {
        alert("Failed to get current location coordinates: " + err.message);
        setDetectingCoords(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function toggleDay(day: string) {
    setForm((current) => {
      const days = current.workingDays.includes(day)
        ? current.workingDays.filter((d) => d !== day)
        : [...current.workingDays, day];
      return { ...current, workingDays: days };
    });
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setUploadError(t("Please select a valid JPG, PNG, or WebP image."));
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError(t("Image size must be less than 5 MB."));
      e.target.value = "";
      return;
    }

    setUploadingPhoto(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        setUploadedPreviewUrl(base64Data);

        try {
          const res = await fetch("/api/business/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64Data }),
          });
          const data = await res.json();

          if (!res.ok || !data.url) {
            throw new Error(data.message || t("Unable to upload image. Please try again."));
          }

          const uploadedUrl = data.url;
          setUploadedPreviewUrl(uploadedUrl);
          setForm((prev) => ({
            ...prev,
            photos: prev.photos ? `${uploadedUrl}\n${prev.photos}` : uploadedUrl,
          }));
        } catch (apiErr: any) {
          console.error("Backend upload error:", apiErr);
          setUploadError(apiErr.message || t("Unable to upload image. Please try again."));
        } finally {
          setUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError(t("Unable to upload image. Please try again."));
      setUploadingPhoto(false);
    } finally {
      e.target.value = "";
    }
  };

  const handleRemovePhoto = () => {
    const currentUploaded = uploadedPreviewUrl;
    setUploadedPreviewUrl(null);
    setUploadError("");
    if (currentUploaded) {
      setForm((prev) => {
        const lines = prev.photos.split("\n").filter((line) => line.trim() !== currentUploaded.trim());
        return { ...prev, photos: lines.join("\n") };
      });
    }
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login?role=business");
        return;
      }

      if (!form.photos.trim() && !uploadedPreviewUrl) {
        setError(t("Please upload a business photo or provide an image URL."));
        setLoading(false);
        return;
      }

      const parsedLat = form.latitude ? parseFloat(form.latitude) : null;
      const parsedLng = form.longitude ? parseFloat(form.longitude) : null;

      const payload = {
        owner_id: session.user.id,
        business_name: form.businessName.trim(),
        category: form.category,
        subcategory: form.subcategory.trim(),
        contact_name: form.contactName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city_area: form.cityArea.trim(),
        description: form.description.trim(),
        opening_time: form.openingTime,
        closing_time: form.closingTime,
        working_days: form.workingDays.join(","),
        website_url: form.websiteUrl.trim(),
        photos: form.photos.trim(),
        latitude: parsedLat,
        longitude: parsedLng,
        verification_status: "pending",
        updated_at: new Date().toISOString(),
      };

      let dbError;
      if (existingId) {
        const { error } = await supabase
          .from("business_registrations")
          .update(payload)
          .eq("id", existingId);
        dbError = error;
      } else {
        const { error } = await supabase
          .from("business_registrations")
          .insert([payload]);
        dbError = error;
      }

      if (dbError) {
        if (dbError.message?.includes("schema cache") || dbError.message?.includes("business_registrations")) {
          throw new Error("Could not find the table 'public.business_registrations' in Supabase. Please run the SQL schema script (frontend/supabase_schema.sql) in your Supabase SQL Editor and execute: NOTIFY pgrst, 'reload schema';");
        }
        throw new Error(dbError.message);
      }

      // Update user profile role to BUSINESS
      await supabase
        .from("profiles")
        .update({ role: "BUSINESS" })
        .eq("id", session.user.id);

      setMessage("Registration submitted successfully! Redirecting to pending page...");
      setTimeout(() => {
        router.push("/business/pending");
      }, 1500);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save registration.");
    } finally {
      setLoading(false);
    }
  }

  if (fetchingExisting) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-[#e86f18]">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <Link href="/business/pending" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#667883] hover:text-[#e86f18]">
        <ArrowLeft className="h-4 w-4" /> Back to Application Overview
      </Link>

      <div className="rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-[0_20px_60px_rgba(77,58,30,0.12)] sm:p-10">
        <div className="mb-8 border-b border-[#e1cfb0] pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-[#e86f18]">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#173247]">
                {existingId ? t("Edit Business Profile") : t("Register Your Business")}
              </h1>
              <p className="mt-1 text-sm text-[#667883]">
                {t("Get your business listed and verified on Nashik's premier discovery platform.")}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Business Identity */}
          <div>
            <h2 className="mb-4 text-lg font-bold text-[#173247]">1. General Information</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-[#173247]">
                Business Name *
                <input
                  required
                  type="text"
                  placeholder="e.g. Sula Vineyards, Sadhana Restaurant"
                  value={form.businessName}
                  onChange={(e) => updateField("businessName", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </label>

              <label className="block text-sm font-semibold text-[#173247]">
                Business Category *
                <select
                  required
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-[#173247]">
                Business Type / Subcategory *
                <input
                  required
                  type="text"
                  placeholder="e.g. Fine Dining, Resort, Temple, Cab Service"
                  value={form.subcategory}
                  onChange={(e) => updateField("subcategory", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </label>

              <label className="block text-sm font-semibold text-[#173247]">
                Owner / Contact Person Name *
                <input
                  required
                  type="text"
                  placeholder="Full name of authorized person"
                  value={form.contactName}
                  onChange={(e) => updateField("contactName", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Contact & Location */}
          <div className="border-t border-[#e1cfb0] pt-6">
            <h2 className="mb-4 text-lg font-bold text-[#173247]">2. Contact & Location</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-[#173247]">
                Phone Number *
                <input
                  required
                  type="tel"
                  placeholder="+91 9876543210"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </label>

              <label className="block text-sm font-semibold text-[#173247]">
                Business Email *
                <input
                  required
                  type="email"
                  placeholder="contact@mybusiness.com"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </label>

              <label className="block text-sm font-semibold text-[#173247] sm:col-span-2">
                City / Area *
                <input
                  required
                  type="text"
                  placeholder="e.g. Panchavati, Gangapur Road, College Road, Trimbakeshwar"
                  value={form.cityArea}
                  onChange={(e) => updateField("cityArea", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </label>

              <label className="block text-sm font-semibold text-[#173247] sm:col-span-2">
                Full Address *
                <textarea
                  required
                  rows={2}
                  placeholder="Complete physical street address"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </label>

              {/* Geographic Coordinates for Nearby Places Search */}
              <div className="sm:col-span-2 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#173247] flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-amber-700" />
                      <span>GPS Coordinates (Optional for Nearby Search)</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Adding latitude & longitude allows nearby visitors to find your business based on their current location.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoDetectCoords}
                    disabled={detectingCoords}
                    className="self-start sm:self-auto rounded-xl bg-amber-700 hover:bg-amber-800 text-white px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-70"
                  >
                    {detectingCoords ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Detecting...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-3.5 w-3.5" />
                        <span>📍 Auto-Detect Location</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-[#173247]">
                    Latitude
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 19.9975"
                      value={form.latitude}
                      onChange={(e) => updateField("latitude", e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-[#173247]">
                    Longitude
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 73.7898"
                      value={form.longitude}
                      onChange={(e) => updateField("longitude", e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Operations & Details */}
          <div className="border-t border-[#e1cfb0] pt-6">
            <h2 className="mb-4 text-lg font-bold text-[#173247]">3. Operational Hours & Media</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-[#173247]">
                Opening Time *
                <input
                  required
                  type="time"
                  value={form.openingTime}
                  onChange={(e) => updateField("openingTime", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </label>

              <label className="block text-sm font-semibold text-[#173247]">
                Closing Time *
                <input
                  required
                  type="time"
                  value={form.closingTime}
                  onChange={(e) => updateField("closingTime", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </label>

              <div className="sm:col-span-2">
                <span className="block text-sm font-semibold text-[#173247] mb-2">Working Days *</span>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => {
                    const isSelected = form.workingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-[#e86f18] text-white shadow-sm"
                            : "border border-[#d8c4a3] bg-white text-[#667883] hover:bg-orange-50"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block text-sm font-semibold text-[#173247] sm:col-span-2">
                Website / Social Media URL (Optional)
                <input
                  type="url"
                  placeholder="https://www.yourbusiness.com"
                  value={form.websiteUrl}
                  onChange={(e) => updateField("websiteUrl", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </label>

              <label className="block text-sm font-semibold text-[#173247] sm:col-span-2">
                Business Description *
                <textarea
                  required
                  rows={3}
                  placeholder="Tell visitors about your offerings, history, or special features..."
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </label>

              {/* Business Photo Section */}
              <div className="sm:col-span-2 rounded-2xl border border-[#d8c4a3] bg-white p-5 shadow-sm">
                <label className="block text-sm font-bold text-[#173247] mb-1">
                  {t("Business Photo")} *
                </label>
                <p className="text-xs text-[#667883] mb-4">
                  {t("Provide a photo of your business. Upload from your device or provide an image URL (either option is acceptable).")}
                </p>

                {/* Option 1: Upload from Device */}
                <div className="mb-5 rounded-xl border border-dashed border-[#e86f18]/40 bg-orange-50/40 p-4 transition-all hover:bg-orange-50/70">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="inline-block rounded-md bg-orange-100 px-2.5 py-1 text-xs font-bold text-[#e86f18] mb-1">
                        {t("Option 1: Upload from Device")}
                      </span>
                      <p className="text-xs text-slate-600">
                        {t("Select JPG, PNG, or WebP image from your gallery or files (Max 5 MB).")}
                      </p>
                    </div>

                    <div className="relative">
                      <input
                        type="file"
                        id="business-photo-upload"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                        className="sr-only"
                      />
                      <label
                        htmlFor="business-photo-upload"
                        className={`inline-flex items-center gap-2 cursor-pointer rounded-xl bg-[#e86f18] hover:bg-[#c9580f] text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-all ${
                          uploadingPhoto ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                      >
                        {uploadingPhoto ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{t("Uploading photo...")}</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-4 w-4" />
                            <span>{uploadedPreviewUrl ? t("Change Photo") : t("Upload Business Photo")}</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Image Preview Box */}
                  {uploadedPreviewUrl && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-3 shadow-sm">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="relative h-28 w-full sm:w-40 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                          <img
                            src={uploadedPreviewUrl}
                            alt="Business photo preview"
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{t("Photo uploaded successfully")}</span>
                          </div>
                          <p className="text-xs text-slate-500 break-all line-clamp-1">
                            {uploadedPreviewUrl}
                          </p>
                          <div className="flex items-center gap-3 pt-1">
                            <label
                              htmlFor="business-photo-upload"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#e86f18] hover:underline cursor-pointer"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              <span>{t("Change Photo")}</span>
                            </label>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>{t("Remove Photo")}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div className="mt-3 rounded-lg bg-red-100 p-2.5 text-xs font-semibold text-red-800">
                      {uploadError}
                    </div>
                  )}
                </div>

                {/* Option 2: Image URL */}
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {t("Option 2: Image URL")}
                    </span>
                  </div>

                  <textarea
                    rows={2}
                    placeholder="https://example.com/photo1.jpg"
                    value={form.photos}
                    onChange={(e) => updateField("photos", e.target.value)}
                    className="w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                  <p className="mt-1 text-[11px] text-[#667883]">
                    {t("Enter image URLs (one per line). Example: https://images.unsplash.com/photo-1555396273-367ea4eb4db5")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              {message}
            </div>
          )}

          <div className="flex gap-4 border-t border-[#e1cfb0] pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#e86f18] px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#c9580f] disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {existingId ? "Update Application" : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  X,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  User,
  Package,
  Camera,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function ReportLostFoundPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [reportType, setReportType] = useState<"lost" | "found">("lost");
  const [category, setCategory] = useState<
    | "missing_child"
    | "missing_elderly"
    | "found_child"
    | "found_elderly"
    | "lost_valuable"
    | "found_valuable"
    | "other"
  >("missing_child");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  // Person details
  const [personName, setPersonName] = useState("");
  const [personAge, setPersonAge] = useState("");
  const [personGender, setPersonGender] = useState("");
  const [personClothing, setPersonClothing] = useState("");
  const [personMarks, setPersonMarks] = useState("");

  // Item details
  const [itemName, setItemName] = useState("");
  const [itemType, setItemType] = useState("");
  const [itemColor, setItemColor] = useState("");
  const [itemMarks, setItemMarks] = useState("");
  const [approxValue, setApproxValue] = useState("");

  // Location details
  const [areaName, setAreaName] = useState("");
  const [landmark, setLandmark] = useState("");
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split("T")[0]);
  const [incidentTime, setIncidentTime] = useState("");

  // Reporter contact (kept private)
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedResult, setSubmittedResult] = useState<{ reportId: string } | null>(null);

  // Handle Photo File Upload (Camera Capture or Device File Chooser) & Convert to Base64 Data URL
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      alert("Please upload a valid image file (JPG, PNG, or WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            setPhotoUrl(canvas.toDataURL("image/jpeg", 0.75));
          } else {
            setPhotoUrl(reader.result as string);
          }
        };
        img.onerror = () => setPhotoUrl(reader.result as string);
        img.src = reader.result;
      }
    };
    reader.onerror = () => {
      alert("Could not process the photo. Please try selecting a file from your device.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !areaName.trim()) {
      setError("Please fill in all required fields (Title, Description, and Area Location).");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        reportType,
        category,
        title: title.trim(),
        description: description.trim(),
        photoUrl,
        personDetails: {
          name: personName.trim(),
          age: personAge.trim(),
          gender: personGender,
          clothing: personClothing.trim(),
          identifyingMarks: personMarks.trim(),
        },
        itemDetails: {
          itemName: itemName.trim(),
          itemType: itemType.trim(),
          color: itemColor.trim(),
          identifyingMarks: itemMarks.trim(),
          approxValue: approxValue.trim(),
        },
        location: {
          areaName: areaName.trim(),
          landmark: landmark.trim(),
          incidentDate,
          incidentTime,
        },
        reporterContact: {
          name: reporterName.trim(),
          phone: reporterPhone.trim(),
          email: reporterEmail.trim(),
        },
      };

      const res = await fetch("/api/kumbh/lost-found", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("Non-JSON API response:", text);
        throw new Error(`Server returned status ${res.status}: ${res.statusText || "Unexpected response"}`);
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit report.");
      }

      setSubmittedResult({ reportId: data.reportId });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedResult) {
    return (
      <main className="min-h-screen bg-[#f8f2e8] py-14">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-8 md:p-12 shadow-[0_20px_60px_rgba(77,58,30,0.12)] text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-6">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <h1 className="text-2xl font-bold text-[#173247]">Your Report Has Been Submitted</h1>
            <p className="mt-2 text-sm text-[#667883]">
              Thank you for contributing to the safety and community support during Kumbh Mela 2027.
            </p>

            <div className="my-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-left">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Report Reference ID</div>
              <div className="text-2xl font-mono font-extrabold text-orange-600 mt-1">{submittedResult.reportId}</div>
              <p className="mt-2 text-xs text-amber-900 leading-relaxed">
                <strong>Status:</strong> Your report is awaiting verification by the moderation team and will be published once reviewed.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Link
                href="/kumbh/lost-found"
                className="rounded-2xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-orange-700 transition-colors"
              >
                View All Published Reports
              </Link>
              <button
                onClick={() => {
                  setSubmittedResult(null);
                  setTitle("");
                  setDescription("");
                  setPhotoUrl("");
                }}
                className="rounded-2xl border border-[#d8c4a3] bg-white px-6 py-3.5 text-sm font-bold text-[#173247] hover:bg-slate-50 transition-colors"
              >
                Submit Another Report
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const isPersonCategory = ["missing_child", "missing_elderly", "found_child", "found_elderly"].includes(category);

  return (
    <main className="min-h-screen bg-[#f8f2e8] py-10">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link
          href="/kumbh/lost-found"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#667883] hover:text-[#e86f18] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Lost & Found Listing
        </Link>

        <div className="rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 sm:p-10 shadow-[0_20px_60px_rgba(77,58,30,0.12)]">
          <div className="mb-8 border-b border-[#e1cfb0] pb-6">
            <h1 className="text-3xl font-extrabold text-[#173247]">Report Lost or Found Incident</h1>
            <p className="mt-1 text-sm text-[#667883]">
              Please fill in accurate details below. Your contact details are kept private and accessible only to administrators for verification.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* SECTION 1 — PHOTO */}
            <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-6">
              <h2 className="text-lg font-bold text-[#173247] flex items-center gap-2 mb-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-600 text-white text-xs font-bold">1</span>
                <span>Upload Photograph (Optional)</span>
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Attach a photo of the missing person or item using your device camera or photo gallery. Common formats (JPG, PNG, WebP) up to 5MB.
              </p>

              {photoUrl ? (
                <div className="relative aspect-[16/9] max-w-sm rounded-2xl overflow-hidden border border-orange-300 shadow-md">
                  <img src={photoUrl} alt="Uploaded Preview" className="h-full w-full object-cover" />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPhotoUrl("")}
                      className="rounded-full bg-red-600 p-1.5 text-white shadow-lg hover:bg-red-700 transition-colors"
                      title="Remove Photo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Option A: Take Photo using Device Camera */}
                  <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-orange-300 bg-white p-5 cursor-pointer hover:bg-orange-50/80 transition-colors text-center group shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 mb-2 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                      <Camera className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-bold text-[#173247]">📷 Take Photo</span>
                    <span className="text-[11px] text-slate-400 mt-1">Capture directly with device camera</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Option B: Choose Photo from Device Gallery/Files */}
                  <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-orange-300 bg-white p-5 cursor-pointer hover:bg-orange-50/80 transition-colors text-center group shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800 mb-2 group-hover:bg-amber-700 group-hover:text-white transition-colors">
                      <Upload className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-bold text-[#173247]">🖼️ Choose from Device</span>
                    <span className="text-[11px] text-slate-400 mt-1">Select from photo gallery or files</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* SECTION 2 — DESCRIPTION & DETAILS */}
            <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-6 space-y-5">
              <h2 className="text-lg font-bold text-[#173247] flex items-center gap-2 mb-1">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-600 text-white text-xs font-bold">2</span>
                <span>Report Details & Description</span>
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#173247]">
                  Report Type *
                  <select
                    value={reportType}
                    onChange={(e) => {
                      const val = e.target.value as "lost" | "found";
                      setReportType(val);
                      if (val === "lost" && !category.startsWith("missing")) setCategory("missing_child");
                      if (val === "found" && !category.startsWith("found")) setCategory("found_child");
                    }}
                    className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 text-sm outline-none focus:border-orange-500"
                  >
                    <option value="lost">🔴 Lost (I am looking for someone/something)</option>
                    <option value="found">🟢 Found (I found a person/item)</option>
                  </select>
                </label>

                <label className="block text-xs font-bold uppercase tracking-wider text-[#173247]">
                  Category *
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 text-sm outline-none focus:border-orange-500"
                  >
                    {reportType === "lost" ? (
                      <>
                        <option value="missing_child">Missing Child</option>
                        <option value="missing_elderly">Missing Elderly Person</option>
                        <option value="lost_valuable">Lost Valuable / Item</option>
                        <option value="other">Other Lost Category</option>
                      </>
                    ) : (
                      <>
                        <option value="found_child">Found Child</option>
                        <option value="found_elderly">Found Elderly Person</option>
                        <option value="found_valuable">Found Valuable / Item</option>
                        <option value="other">Other Found Category</option>
                      </>
                    )}
                  </select>
                </label>
              </div>

              <label className="block text-xs font-bold uppercase tracking-wider text-[#173247]">
                Headline / Short Title *
                <input
                  required
                  type="text"
                  placeholder={
                    isPersonCategory
                      ? "e.g. Missing 6-year-old boy near Panchavati"
                      : "e.g. Lost Gold Chain near Ram Kund Ghat"
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 text-sm outline-none focus:border-orange-500"
                />
              </label>

              {/* Dynamic Person Fields */}
              {isPersonCategory && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-orange-600" /> Person Details
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block text-xs font-semibold text-slate-700">
                      Person Name / Nickname
                      <input
                        type="text"
                        placeholder="e.g. Aarav Sharma"
                        value={personName}
                        onChange={(e) => setPersonName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#d8c4a3] bg-white px-3 py-2 text-xs outline-none"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-slate-700">
                      Approx Age
                      <input
                        type="text"
                        placeholder="e.g. 6 years, 72 years"
                        value={personAge}
                        onChange={(e) => setPersonAge(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#d8c4a3] bg-white px-3 py-2 text-xs outline-none"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-slate-700">
                      Gender
                      <select
                        value={personGender}
                        onChange={(e) => setPersonGender(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#d8c4a3] bg-white px-3 py-2 text-xs outline-none"
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </label>
                  </div>

                  <label className="block text-xs font-semibold text-slate-700">
                    What were they wearing? (Clothes, shoes, color)
                    <input
                      type="text"
                      placeholder="e.g. Blue shirt, black shorts, red slippers"
                      value={personClothing}
                      onChange={(e) => setPersonClothing(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#d8c4a3] bg-white px-3 py-2 text-xs outline-none"
                    />
                  </label>
                </div>
              )}

              {/* Dynamic Item Fields */}
              {!isPersonCategory && (
                <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-4 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-orange-900 flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-orange-600" /> Item Details
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block text-xs font-semibold text-slate-700">
                      Item Name
                      <input
                        type="text"
                        placeholder="e.g. Leather Wallet, Titan Watch"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#d8c4a3] bg-white px-3 py-2 text-xs outline-none"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-slate-700">
                      Color / Material
                      <input
                        type="text"
                        placeholder="e.g. Brown leather, Gold 22k"
                        value={itemColor}
                        onChange={(e) => setItemColor(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#d8c4a3] bg-white px-3 py-2 text-xs outline-none"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-slate-700">
                      Approx Value (Optional)
                      <input
                        type="text"
                        placeholder="e.g. ₹5,000"
                        value={approxValue}
                        onChange={(e) => setApproxValue(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#d8c4a3] bg-white px-3 py-2 text-xs outline-none"
                      />
                    </label>
                  </div>
                </div>
              )}

              <label className="block text-xs font-bold uppercase tracking-wider text-[#173247]">
                Detailed Description & Circumstances *
                <textarea
                  required
                  rows={4}
                  placeholder={
                    isPersonCategory
                      ? "Describe what happened, identifying marks (mole, birthmark, glasses), last seen circumstances..."
                      : "Describe item details, identifying marks, serial numbers, circumstances when lost/found..."
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 text-sm outline-none focus:border-orange-500"
                />
              </label>
            </div>

            {/* SECTION 3 — LOCATION & TIME */}
            <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-6 space-y-4">
              <h2 className="text-lg font-bold text-[#173247] flex items-center gap-2 mb-1">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-600 text-white text-xs font-bold">3</span>
                <span>Incident Location & Reporter Contact</span>
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#173247]">
                  {reportType === "lost" ? "Last Seen / Lost Area *" : "Found Area / Locality *"}
                  <input
                    required
                    type="text"
                    placeholder="e.g. Panchavati, Ram Kund Ghat, Tapovan"
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 text-sm outline-none focus:border-orange-500"
                  />
                </label>

                <label className="block text-xs font-bold uppercase tracking-wider text-[#173247]">
                  Landmark (Optional)
                  <input
                    type="text"
                    placeholder="e.g. Near Kalaram Temple gate 2"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 text-sm outline-none focus:border-orange-500"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#173247]">
                  Incident Date
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 text-sm outline-none focus:border-orange-500"
                  />
                </label>

                <label className="block text-xs font-bold uppercase tracking-wider text-[#173247]">
                  Approximate Time
                  <input
                    type="text"
                    placeholder="e.g. 7:30 PM, Afternoon"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 text-sm outline-none focus:border-orange-500"
                  />
                </label>
              </div>

              {/* Private Reporter Contact */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#173247] uppercase tracking-wider">Reporter Contact Info</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">Strictly Private (Admin Only)</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    placeholder="Your Full Name"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="rounded-lg border border-[#d8c4a3] px-3 py-2 text-xs outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Your Phone Number"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    className="rounded-lg border border-[#d8c4a3] px-3 py-2 text-xs outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Your Email Address"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    className="rounded-lg border border-[#d8c4a3] px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Disclaimers & Submit */}
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                <span>Accuracy & Verification Disclaimer:</span>
              </p>
              <p>
                Please ensure all provided details are accurate. False or misleading reports may be removed by administrators. For immediate emergencies, please contact local emergency authorities (112).
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-orange-600 py-4 text-center font-bold text-white shadow-lg transition-all hover:bg-orange-700 disabled:opacity-70 flex items-center justify-center gap-2 text-base"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Submitting Report...</span>
                </>
              ) : (
                <span>Submit Report</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

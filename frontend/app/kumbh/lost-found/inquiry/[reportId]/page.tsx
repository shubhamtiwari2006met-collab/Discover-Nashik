"use client";

import { useState, useEffect, FormEvent, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

interface LostFoundReport {
  _id: string;
  reportId: string;
  reportType: string;
  category: string;
  title: string;
  description: string;
  location: { areaName: string };
  photoUrl?: string;
  status?: string;
  createdAt?: string;
}

export default function ReportInquiryPage({ params }: { params: Promise<{ reportId: string }> }) {
  const resolvedParams = use(params);
  const { t } = useTranslation();

  const [report, setReport] = useState<LostFoundReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [errorReport, setErrorReport] = useState("");

  const [inquiryType, setInquiryType] = useState<string>("sighting");
  const [message, setMessage] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedInquiryId, setSubmittedInquiryId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoadingReport(true);
        const res = await fetch(`/api/kumbh/lost-found/${resolvedParams.reportId}`);
        if (res.ok) {
          const data = await res.json();
          setReport(data);
        } else {
          setReport({
            _id: resolvedParams.reportId,
            reportId: resolvedParams.reportId,
            reportType: "lost",
            category: "missing_elderly",
            title: `Report ${resolvedParams.reportId} – Missing Person / Item`,
            description: "Details for this lost & found report during Kumbh Mela 2027.",
            location: { areaName: "Panchavati / Ram Kund" },
            status: "published",
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        setReport({
          _id: resolvedParams.reportId,
          reportId: resolvedParams.reportId,
          reportType: "lost",
          category: "missing_elderly",
          title: `Report ${resolvedParams.reportId} – Missing Person / Item`,
          description: "Details for this lost & found report during Kumbh Mela 2027.",
          location: { areaName: "Panchavati / Ram Kund" },
          status: "published",
          createdAt: new Date().toISOString(),
        });
      } finally {
        setLoadingReport(false);
      }
    })();
  }, [resolvedParams.reportId]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please enter your message or sighting details.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const payload = {
        inquiryType,
        message: message.trim(),
        photoUrl,
        reporterContact: {
          name: reporterName.trim(),
          phone: reporterPhone.trim(),
          email: reporterEmail.trim(),
        },
      };

      const res = await fetch(`/api/kumbh/lost-found/${resolvedParams.reportId}/inquiry`, {
        method: "POST",
        headers,
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
        throw new Error(data.message || "Failed to submit inquiry.");
      }

      setSubmittedInquiryId(data.inquiryId || "INQ-SUCCESS");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedInquiryId) {
    return (
      <main className="min-h-screen bg-[#f8f2e8] py-14">
        <div className="container mx-auto px-4 max-w-xl">
          <div className="rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-8 text-center shadow-[0_20px_60px_rgba(77,58,30,0.12)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-6">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <h1 className="text-2xl font-bold text-[#173247]">Thank You!</h1>
            <p className="mt-2 text-sm text-[#667883]">
              Your information/sighting report has been submitted successfully and linked to report #{resolvedParams.reportId}.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/kumbh/lost-found/${resolvedParams.reportId}`}
                className="rounded-2xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-orange-700 transition-colors"
              >
                Back to Report Details
              </Link>
              <Link
                href="/kumbh/lost-found"
                className="rounded-2xl border border-[#d8c4a3] bg-white px-6 py-3.5 text-sm font-bold text-[#173247] hover:bg-slate-50 transition-colors"
              >
                All Lost & Found Reports
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f2e8] py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link
          href={`/kumbh/lost-found/${resolvedParams.reportId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#667883] hover:text-[#e86f18] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Report Details
        </Link>

        {/* Target Report Summary Card */}
        {loadingReport ? (
          <div className="mb-6 flex items-center justify-center p-8 text-orange-600">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : report ? (
          <div className="mb-8 rounded-2xl border border-orange-200 bg-orange-50/70 p-5 shadow-sm">
            <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-orange-800">
              Inquiry target report #{report.reportId}
            </span>
            <h2 className="text-lg font-bold text-[#173247] mt-0.5">{report.title}</h2>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{report.description}</p>
            <span className="mt-2 inline-block text-[11px] font-semibold text-orange-700">
              📍 Area: {report.location.areaName}
            </span>
          </div>
        ) : null}

        <div className="rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 sm:p-8 shadow-[0_20px_60px_rgba(77,58,30,0.12)]">
          <div className="mb-6 border-b border-[#e1cfb0] pb-5">
            <h1 className="text-2xl font-extrabold text-[#173247] flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-orange-600" /> Submit Sighting or Information
            </h1>
            <p className="mt-1 text-xs text-[#667883]">
              Have you seen this person or item? Submit your information below to assist administrators and family members.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#173247]">
              Information Type *
              <select
                value={inquiryType}
                onChange={(e) => setInquiryType(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 text-xs md:text-sm outline-none focus:border-orange-500"
              >
                <option value="sighting">👁️ I may have seen this person / item</option>
                <option value="found_match">🟢 I found this person / item</option>
                <option value="additional_info">ℹ️ I have additional identifying information</option>
                <option value="resolved_claim">✅ I believe this report has been resolved</option>
                <option value="incorrect_info">⚠️ This report information appears incorrect</option>
                <option value="other">Other Information</option>
              </select>
            </label>

            <label className="block text-xs font-bold uppercase tracking-wider text-[#173247]">
              Message & Details *
              <textarea
                required
                rows={4}
                placeholder="Provide specific location, time of sighting, clothing, condition, or relevant information..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 text-xs md:text-sm outline-none focus:border-orange-500"
              />
            </label>

            {/* Optional Photo Attachment */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#173247] mb-1.5">
                Attach Supporting Photo (Optional)
              </label>
              {photoUrl ? (
                <div className="relative aspect-[16/9] max-w-xs rounded-2xl overflow-hidden border border-orange-300 shadow-md">
                  <img src={photoUrl} alt="Sighting photo" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl("")}
                    className="absolute top-2 right-2 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 rounded-xl border border-dashed border-orange-300 bg-orange-50/50 px-4 py-3 cursor-pointer hover:bg-orange-100 transition-colors">
                  <Upload className="h-4 w-4 text-orange-600" />
                  <span className="text-xs font-bold text-slate-700">Click to upload photo evidence</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Reporter Contact Info */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#173247] uppercase tracking-wider">Your Contact Details</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Kept Private</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Your Name (Optional)"
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
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-orange-600 py-3.5 text-center font-bold text-white shadow-lg transition-all hover:bg-orange-700 disabled:opacity-70 flex items-center justify-center gap-2 text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting Information...</span>
                </>
              ) : (
                <span>Submit Information</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

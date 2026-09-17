"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  User,
  Package,
  ShieldAlert,
  MessageCircle,
  CheckCircle2,
  Loader2,
  Check,
  Eye,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

interface LostFoundReport {
  _id: string;
  reportId: string;
  reportType: "lost" | "found";
  category: string;
  title: string;
  description: string;
  photoUrl?: string;
  personDetails?: {
    name?: string;
    age?: string;
    gender?: string;
    clothing?: string;
    identifyingMarks?: string;
  };
  itemDetails?: {
    itemName?: string;
    itemType?: string;
    color?: string;
    identifyingMarks?: string;
    approxValue?: string;
  };
  location: {
    areaName: string;
    landmark?: string;
    latitude?: number;
    longitude?: number;
    incidentDate?: string;
    incidentTime?: string;
  };
  status: string;
  resolvedAt?: string;
  createdAt: string;
  isOwner?: boolean;
  canUpdateStatus?: boolean;
  isAdmin?: boolean;
}

interface CommunityInquiry {
  _id: string;
  inquiryId: string;
  inquiryType: string;
  message: string;
  photoUrl?: string;
  authorLabel?: string;
  createdAt: string;
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { t } = useTranslation();
  const [report, setReport] = useState<LostFoundReport | null>(null);
  const [inquiries, setInquiries] = useState<CommunityInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState("");

  // Inline Reply / Update Form State
  const [replyMessage, setReplyMessage] = useState("");
  const [replyType, setReplyType] = useState("sighting");
  const [replyName, setReplyName] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replySuccess, setReplySuccess] = useState("");

  const handleInlineReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !report) return;

    try {
      setReplySubmitting(true);
      setReplySuccess("");

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const payload = {
        inquiryType: replyType,
        message: replyMessage.trim(),
        reporterContact: {
          name: replyName.trim(),
        },
      };

      const res = await fetch(`/api/kumbh/lost-found/${report.reportId}/inquiry`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to post reply/update.");
      }

      setReplyMessage("");
      setReplyName("");
      setReplySuccess("Your update / reply has been posted successfully!");

      // Refresh inquiries immediately
      await fetchInquiries(report.reportId, { "Cache-Control": "no-cache" });
    } catch (err: any) {
      alert(err.message || "Failed to post update.");
    } finally {
      setReplySubmitting(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers: Record<string, string> = { "Cache-Control": "no-cache" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // 1. Fetch Report Details (returns report + inquiries)
      const res = await fetch(`/api/kumbh/lost-found/${resolvedParams.id}`, {
        headers,
        cache: "no-store",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Report not found or not published.");
      }
      const data: LostFoundReport & { inquiries?: CommunityInquiry[] } = await res.json();
      setReport(data);

      if (Array.isArray(data.inquiries)) {
        setInquiries(data.inquiries);
        setInquiriesLoading(false);
      }

      // 2. Fetch Public Inquiries / Timeline explicitly as well
      fetchInquiries(resolvedParams.id, headers);

      // 3. Mark inquiries as read for report owner
      if (token && (data.isOwner || data.canUpdateStatus)) {
        fetch(`/api/kumbh/lost-found/${resolvedParams.id}/inquiries/mark-read`, {
          method: "PATCH",
          headers,
          cache: "no-store",
        }).then(() => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("refresh_lost_found_unread"));
          }
        }).catch(() => {});
      }
    } catch (err: any) {
      setError(err.message || "Failed to load report details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInquiries = async (id: string, headers: Record<string, string> = {}) => {
    try {
      setInquiriesLoading(true);
      const reqHeaders = { "Cache-Control": "no-cache", ...headers };
      const res = await fetch(`/api/kumbh/lost-found/${id}/inquiries`, {
        headers: reqHeaders,
        cache: "no-store",
      });
      if (res.ok) {
        const inqData = await res.json();
        if (Array.isArray(inqData)) {
          setInquiries(inqData);
        }
      }
    } catch (err) {
      console.error("Failed to load inquiries", err);
    } finally {
      setInquiriesLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [resolvedParams.id]);

  const handleMarkAsResolved = async () => {
    if (!report) return;
    try {
      setStatusUpdating(true);
      setStatusSuccess("");
      setError("");

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        alert("Please sign in to update report status.");
        return;
      }

      const res = await fetch(`/api/kumbh/lost-found/${report.reportId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "resolved", adminNotes: "Marked as Found / Resolved" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update report status.");
      }

      setStatusSuccess("Report successfully marked as Found / Resolved!");
      setReport((prev) => prev ? { ...prev, status: "resolved", resolvedAt: new Date().toISOString() } : null);
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const [deletingReport, setDeletingReport] = useState(false);
  const handleAdminDeleteReport = async () => {
    if (!report) return;
    if (!window.confirm("Are you sure you want to permanently delete this report as an Admin? This action cannot be undone.")) return;
    try {
      setDeletingReport(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        alert("Admin authentication required.");
        return;
      }
      const res = await fetch(`/api/kumbh/lost-found/admin/reports/${report._id || report.reportId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete report.");
      }
      alert("Report deleted successfully!");
      if (typeof window !== "undefined") {
        window.location.href = "/kumbh/lost-found";
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete report.");
    } finally {
      setDeletingReport(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f2e8] py-14 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="min-h-screen bg-[#f8f2e8] py-14">
        <div className="container mx-auto px-4 max-w-xl text-center">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
            <ShieldAlert className="h-12 w-12 text-red-600 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-red-950">Unable to Display Report</h1>
            <p className="mt-2 text-xs text-red-800">{error || "The requested report is unavailable or pending moderation."}</p>
            <Link
              href="/kumbh/lost-found"
              className="mt-6 inline-block rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-orange-700"
            >
              Back to Lost & Found Listings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isMissingPerson = ["missing_child", "missing_elderly"].includes(report.category);
  const isFoundPerson = ["found_child", "found_elderly"].includes(report.category);
  const isResolved = report.status === "resolved";
  const canMarkResolved = report.canUpdateStatus && !isResolved;

  function getInquiryBadge(type: string) {
    switch (type) {
      case "sighting":
        return { label: "👁️ Sighting Report", color: "bg-blue-100 text-blue-900 border-blue-200" };
      case "found_match":
        return { label: "🟢 Found Match", color: "bg-emerald-100 text-emerald-900 border-emerald-200" };
      case "additional_info":
        return { label: "ℹ️ Additional Info", color: "bg-purple-100 text-purple-900 border-purple-200" };
      case "resolved_claim":
        return { label: "✅ Resolved Claim", color: "bg-amber-100 text-amber-900 border-amber-200" };
      default:
        return { label: "💬 Community Update", color: "bg-slate-100 text-slate-800 border-slate-200" };
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f2e8] py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/kumbh/lost-found"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#667883] hover:text-[#e86f18] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Lost & Found Listings
        </Link>

        {/* Status Update Success Banner */}
        {statusSuccess && (
          <div className="mb-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-bold text-emerald-900 flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{statusSuccess}</span>
          </div>
        )}

        {/* Emergency Alert Banner */}
        {isMissingPerson && !isResolved && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-600 text-white p-4 shadow-md flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <div className="text-xs sm:text-sm">
                <strong>Urgent Missing Person Report</strong>
                <p className="opacity-90">If you see this person, please notify authorities or submit a Report Inquiry immediately.</p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] shadow-[0_20px_60px_rgba(77,58,30,0.12)] overflow-hidden">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-[#173247] to-slate-800 text-white p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {isResolved ? (
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-extrabold text-white flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> RESOLVED / FOUND
                  </span>
                ) : isMissingPerson ? (
                  <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-extrabold text-white">🔴 MISSING PERSON</span>
                ) : isFoundPerson ? (
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-extrabold text-white">🔵 FOUND PERSON</span>
                ) : report.reportType === "lost" ? (
                  <span className="rounded-full bg-amber-600 px-3 py-1 text-xs font-extrabold text-white">🟠 LOST ITEM</span>
                ) : (
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-extrabold text-white">🟢 FOUND ITEM</span>
                )}
                <span className="font-mono text-xs text-slate-300">ID: {report.reportId}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">{report.title}</h1>
              {isResolved && report.resolvedAt && (
                <p className="mt-1 text-xs text-emerald-300 font-semibold">
                  Marked Found / Resolved on: {new Date(report.resolvedAt).toLocaleString("en-IN")}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* Authorized Action: Mark as Found / Resolved */}
              {canMarkResolved && (
                <button
                  type="button"
                  disabled={statusUpdating}
                  onClick={handleMarkAsResolved}
                  className="rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {statusUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>Mark as Found / Resolved</span>
                </button>
              )}

              {/* Admin Action: Delete Report */}
              {(report.canUpdateStatus || report.isAdmin) && (
                <button
                  type="button"
                  disabled={deletingReport}
                  onClick={handleAdminDeleteReport}
                  className="rounded-2xl border border-red-300 bg-red-50/90 px-4 py-3.5 text-sm font-bold text-red-800 shadow-md hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {deletingReport ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-red-600" />
                  )}
                  <span>Delete Report</span>
                </button>
              )}

              <Link
                href={`/kumbh/lost-found/inquiry/${report.reportId}`}
                className="rounded-2xl bg-orange-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" /> Report Inquiry / Sighting
              </Link>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            {/* Grid Layout: Photo + Core Information */}
            <div className="grid gap-8 md:grid-cols-2">
              {/* Photo Column */}
              <div>
                {report.photoUrl ? (
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#d8c4a3] shadow-md">
                    <img src={report.photoUrl} alt={report.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-[4/3] rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-300">
                    <Package className="h-16 w-16" />
                  </div>
                )}
              </div>

              {/* Attributes Column */}
              <div className="space-y-4">
                <h2 className="text-base font-bold text-[#173247] uppercase tracking-wider border-b border-[#eee2cc] pb-2">
                  Incident Information
                </h2>

                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-600 shrink-0" />
                    <span>
                      <strong>Location:</strong> {report.location.areaName} {report.location.landmark ? `(${report.location.landmark})` : ""}
                    </span>
                  </div>

                  {report.location.incidentDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-600 shrink-0" />
                      <span>
                        <strong>Incident Date:</strong> {report.location.incidentDate}
                      </span>
                    </div>
                  )}

                  {report.location.incidentTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600 shrink-0" />
                      <span>
                        <strong>Approx Time:</strong> {report.location.incidentTime}
                      </span>
                    </div>
                  )}
                </div>

                {/* Person-Specific Details */}
                {report.personDetails && (report.personDetails.name || report.personDetails.clothing) && (
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-2 text-xs text-amber-950 mt-4">
                    <h3 className="font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <User className="h-4 w-4 text-orange-600" /> Identification Traits
                    </h3>
                    {report.personDetails.name && <p><strong>Name:</strong> {report.personDetails.name}</p>}
                    {report.personDetails.age && <p><strong>Approx Age:</strong> {report.personDetails.age} years</p>}
                    {report.personDetails.gender && <p><strong>Gender:</strong> {report.personDetails.gender}</p>}
                    {report.personDetails.clothing && <p><strong>Clothing:</strong> {report.personDetails.clothing}</p>}
                    {report.personDetails.identifyingMarks && <p><strong>Identifying Marks:</strong> {report.personDetails.identifyingMarks}</p>}
                  </div>
                )}

                {/* Item-Specific Details */}
                {report.itemDetails && (report.itemDetails.itemName || report.itemDetails.color) && (
                  <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4 space-y-2 text-xs text-orange-950 mt-4">
                    <h3 className="font-extrabold uppercase tracking-wider text-orange-900 flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-orange-600" /> Item Attributes
                    </h3>
                    {report.itemDetails.itemName && <p><strong>Item Name:</strong> {report.itemDetails.itemName}</p>}
                    {report.itemDetails.color && <p><strong>Color / Material:</strong> {report.itemDetails.color}</p>}
                    {report.itemDetails.itemType && <p><strong>Type:</strong> {report.itemDetails.itemType}</p>}
                    {report.itemDetails.identifyingMarks && <p><strong>Identifying Marks:</strong> {report.itemDetails.identifyingMarks}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Circumstances & Description */}
            <div className="border-t border-[#eee2cc] pt-6">
              <h2 className="text-base font-bold text-[#173247] uppercase tracking-wider mb-2">Description & Circumstances</h2>
              <p className="text-sm leading-relaxed text-[#667883] bg-white p-5 rounded-2xl border border-[#e1cfb0]">
                {report.description}
              </p>
            </div>

            {/* Map Action Banner */}
            <div className="rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-orange-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-[#173247]">Incident Location: {report.location.areaName}</h3>
                  <p className="text-xs text-slate-500">View Nashik area map for navigation during Kumbh</p>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${report.location.areaName}, Nashik`)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-orange-300 bg-orange-50 px-5 py-2.5 text-xs font-bold text-orange-800 hover:bg-orange-100 transition-colors shrink-0"
              >
                View on Google Maps
              </a>
            </div>

            {/* COMMUNITY UPDATES & INQUIRIES SECTION */}
            <div className="border-t border-[#eee2cc] pt-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-[#173247] flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-orange-600" /> Updates & Inquiries ({inquiries.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Community sightings, information, and replies provided for this report.
                  </p>
                </div>

                <Link
                  href={`/kumbh/lost-found/inquiry/${report.reportId}`}
                  className="rounded-xl border border-orange-300 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-800 hover:bg-orange-100 transition-colors shrink-0"
                >
                  Full Form Page
                </Link>
              </div>

              {/* INLINE REPLY / UPDATE FORM */}
              <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5 space-y-4 shadow-sm">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-orange-950 flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4 text-orange-600" /> Post a Reply / Update on this Report
                </h3>

                {replySuccess && (
                  <div className="rounded-xl bg-emerald-100 p-3 text-xs font-bold text-emerald-900 border border-emerald-300">
                    {replySuccess}
                  </div>
                )}

                <form onSubmit={handleInlineReplySubmit} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Update Type *</label>
                      <select
                        value={replyType}
                        onChange={(e) => setReplyType(e.target.value)}
                        className="w-full rounded-xl border border-[#d8c4a3] bg-white px-3 py-2 text-xs outline-none focus:border-orange-500"
                      >
                        <option value="sighting">👁️ Sighting Report</option>
                        <option value="found_match">🟢 Found Match</option>
                        <option value="additional_info">ℹ️ Additional Info</option>
                        <option value="resolved_claim">✅ Believe Resolved</option>
                        <option value="other">Other Information</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Your Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="Public display name"
                        value={replyName}
                        onChange={(e) => setReplyName(e.target.value)}
                        className="w-full rounded-xl border border-[#d8c4a3] bg-white px-3 py-2 text-xs outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Your Message / Reply *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Write your update or reply regarding this lost/found report..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="w-full rounded-xl border border-[#d8c4a3] bg-white p-3 text-xs md:text-sm outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={replySubmitting}
                      className="rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-orange-700 disabled:opacity-60 flex items-center gap-1.5"
                    >
                      {replySubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Posting Reply...</span>
                        </>
                      ) : (
                        <span>Post Reply / Update</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {inquiriesLoading ? (
                <div className="flex items-center gap-2 text-xs text-orange-600 p-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading updates...
                </div>
              ) : inquiries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d8c4a3] bg-white p-6 text-center text-xs text-[#667883]">
                  No community updates or sightings submitted for this report yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {inquiries.map((inq) => {
                    const badge = getInquiryBadge(inq.inquiryType);
                    return (
                      <div
                        key={inq._id}
                        className="rounded-2xl border border-[#e1cfb0] bg-white p-5 shadow-sm space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f3e7d3] pb-3">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${badge.color}`}>
                              {badge.label}
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              By {inq.authorLabel || "Community Member"}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(inq.createdAt).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <p className="text-xs md:text-sm text-slate-800 leading-relaxed">
                          {inq.message}
                        </p>

                        {inq.photoUrl && (
                          <div className="aspect-[16/9] max-w-xs rounded-xl overflow-hidden border border-slate-200">
                            <img src={inq.photoUrl} alt="Update Photo" className="h-full w-full object-cover" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Inquiry Call to Action */}
            <div className="border-t border-[#eee2cc] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#173247]">Do you have information or a sighting?</h3>
                <p className="text-xs text-slate-500 mt-0.5">Submit an inquiry or sighting report to help reunite lost persons and items.</p>
              </div>

              <Link
                href={`/kumbh/lost-found/inquiry/${report.reportId}`}
                className="rounded-2xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-orange-700 transition-colors flex items-center gap-2 shrink-0"
              >
                <MessageCircle className="h-4 w-4" /> Submit Information / Tip
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


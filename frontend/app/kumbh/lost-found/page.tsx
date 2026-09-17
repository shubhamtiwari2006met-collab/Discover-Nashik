"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  AlertTriangle,
  MapPin,
  Calendar,
  Clock,
  User,
  Package,
  Eye,
  MessageCircle,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface PersonDetails {
  name?: string;
  age?: string;
  gender?: string;
  clothing?: string;
  identifyingMarks?: string;
}

interface ItemDetails {
  itemName?: string;
  itemType?: string;
  color?: string;
  identifyingMarks?: string;
  approxValue?: string;
}

interface ReportLocation {
  areaName: string;
  landmark?: string;
  incidentDate?: string;
  incidentTime?: string;
}

interface LostFoundReport {
  _id: string;
  reportId: string;
  reportType: "lost" | "found";
  category:
    | "missing_child"
    | "missing_elderly"
    | "found_child"
    | "found_elderly"
    | "lost_valuable"
    | "found_valuable"
    | "other";
  title: string;
  description: string;
  photoUrl?: string;
  personDetails?: PersonDetails;
  itemDetails?: ItemDetails;
  location: ReportLocation;
  status: "pending" | "under_verification" | "published" | "resolved" | "rejected" | "closed";
  createdAt: string;
}

const TAB_FILTERS = [
  { id: "all", label: "All Reports" },
  { id: "resolved", label: "✅ Resolved / Found" },
  { id: "lost", label: "Lost Only" },
  { id: "found", label: "Found Only" },
  { id: "missing_person", label: "Missing Person" },
  { id: "found_person", label: "Found Person" },
  { id: "lost_item", label: "Lost Item" },
  { id: "found_item", label: "Found Item" },
];

const FALLBACK_REPORTS: LostFoundReport[] = [];

export default function LostFoundMainPage() {
  const { t } = useTranslation();
  const [reports, setReports] = useState<LostFoundReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/kumbh/lost-found");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.reports) && data.reports.length > 0) {
            setReports(data.reports);
          } else if (isMounted) {
            setReports(FALLBACK_REPORTS);
          }
        } else {
          if (isMounted) {
            setReports(FALLBACK_REPORTS);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setReports(FALLBACK_REPORTS);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter reports locally by search query and category tab
  const filteredReports = reports.filter((r) => {
    // Tab filtering
    if (activeTab === "resolved" && r.status !== "resolved") return false;
    if (activeTab === "lost" && r.reportType !== "lost") return false;
    if (activeTab === "found" && r.reportType !== "found") return false;
    if (activeTab === "missing_person" && !["missing_child", "missing_elderly"].includes(r.category)) return false;
    if (activeTab === "found_person" && !["found_child", "found_elderly"].includes(r.category)) return false;
    if (activeTab === "lost_item" && r.category !== "lost_valuable") return false;
    if (activeTab === "found_item" && r.category !== "found_valuable") return false;

    // Search query filtering
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const searchable = [
      r.title,
      r.description,
      r.reportId,
      r.location?.areaName,
      r.location?.landmark,
      r.personDetails?.name,
      r.personDetails?.clothing,
      r.itemDetails?.itemName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(q);
  });

  function getBadgeConfig(report: LostFoundReport) {
    if (report.status === "resolved") {
      return { label: "RESOLVED", color: "bg-emerald-600 text-white", icon: CheckCircle2 };
    }
    if (["missing_child", "missing_elderly"].includes(report.category)) {
      return { label: "MISSING PERSON", color: "bg-red-600 text-white", icon: ShieldAlert };
    }
    if (["found_child", "found_elderly"].includes(report.category)) {
      return { label: "FOUND PERSON", color: "bg-blue-600 text-white", icon: User };
    }
    if (report.reportType === "lost") {
      return { label: "LOST ITEM", color: "bg-amber-600 text-white", icon: Package };
    }
    return { label: "FOUND ITEM", color: "bg-emerald-600 text-white", icon: Package };
  }

  return (
    <main className="min-h-screen bg-[#f8f2e8] py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Navigation Breadcrumb */}
        <Link
          href="/kumbh"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#667883] hover:text-[#e86f18] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> {t("Back to Kumbh Mela 2027")}
        </Link>

        {/* Hero Section */}
        <div className="rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 p-8 text-white shadow-xl md:p-10 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-orange-100">
                Kumbh Mela 2027 Helpline
              </span>
              <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">Lost & Found – Kumbh 2027</h1>
              <p className="mt-3 max-w-xl text-orange-100 leading-relaxed text-sm md:text-base">
                Report a lost person or item, or help someone by reporting something you have found during the spiritual gathering in Nashik.
              </p>
            </div>

            <Link
              href="/kumbh/lost-found/report"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-bold text-orange-600 shadow-lg hover:bg-orange-50 transition-all transform hover:-translate-y-0.5 shrink-0"
            >
              <Plus className="h-5 w-5 stroke-[3]" />
              <span>+ Report Lost or Found</span>
            </Link>
          </div>
        </div>

        {/* Emergency Alert Box */}
        <div className="mb-8 rounded-2xl border border-red-200 bg-red-50/90 p-4 shadow-sm flex items-start gap-3">
          <ShieldAlert className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-red-900 leading-snug">
            <strong className="font-bold text-red-950">Immediate Danger or Emergency?</strong>
            <p className="mt-0.5 text-red-800">
              For missing children or urgent life emergencies, please immediately contact Nashik Police / Official Emergency Services (112 or local police booths). Discover Nashik Lost & Found is a community reporting system working alongside official authorities.
            </p>
          </div>
        </div>

        {/* Search Bar & Tab Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] px-4 py-3 shadow-sm">
            <Search className="h-5 w-5 text-slate-400 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, item, description, Panchavati, Ram Kund..."
              className="w-full bg-transparent text-[#173247] outline-none text-sm md:text-base placeholder-slate-400"
            />
          </div>

          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
            {TAB_FILTERS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-2 text-xs md:text-sm font-bold transition-all shrink-0 ${
                  activeTab === tab.id
                    ? "bg-orange-600 text-white shadow-md"
                    : "bg-[#fffdf8] border border-[#e1cfb0] text-[#667883] hover:bg-orange-50 hover:text-orange-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center text-orange-600">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Showing {filteredReports.length} published report(s)</span>
            </div>

            {filteredReports.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredReports.map((report) => {
                  const badge = getBadgeConfig(report);
                  const BadgeIcon = badge.icon;
                  const formattedDate = report.location?.incidentDate || new Date(report.createdAt).toLocaleDateString();

                  return (
                    <div
                      key={report.reportId}
                      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] shadow-[0_12px_30px_rgba(77,58,30,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div>
                        {/* Header Image or Placeholder */}
                        <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden border-b border-[#eee2cc]">
                          {report.photoUrl ? (
                            <img
                              src={report.photoUrl}
                              alt={report.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-orange-50/60 text-orange-300">
                              <Package className="h-12 w-12" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase shadow-md backdrop-blur-sm shadow-black/10">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 ${badge.color}`}>
                              <BadgeIcon className="h-3 w-3" />
                              {badge.label}
                            </span>
                          </div>
                          <div className="absolute top-3 right-3 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[10px] font-mono text-white backdrop-blur-sm">
                            {report.reportId}
                          </div>
                        </div>

                        {/* Content Body */}
                        <div className="p-5">
                          <h3 className="text-lg font-bold text-[#173247] line-clamp-1 group-hover:text-orange-600 transition-colors">
                            {report.title}
                          </h3>

                          {/* Specific attributes for Person or Item */}
                          {report.personDetails?.clothing && (
                            <p className="mt-1.5 text-xs text-slate-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg line-clamp-1">
                              <strong>Wearing:</strong> {report.personDetails.clothing}
                            </p>
                          )}

                          {report.personDetails?.age && (
                            <p className="mt-1 text-xs text-slate-600">
                              <strong>Age:</strong> ~{report.personDetails.age} years {report.personDetails.gender ? `(${report.personDetails.gender})` : ""}
                            </p>
                          )}

                          {report.itemDetails?.color && (
                            <p className="mt-1.5 text-xs text-slate-700 bg-orange-50 border border-orange-200/80 px-2.5 py-1 rounded-lg line-clamp-1">
                              <strong>Color/Type:</strong> {report.itemDetails.color} {report.itemDetails.itemType ? `• ${report.itemDetails.itemType}` : ""}
                            </p>
                          )}

                          <p className="mt-3 text-xs leading-relaxed text-[#667883] line-clamp-2">
                            {report.description}
                          </p>

                          {/* Incident Metadata */}
                          <div className="mt-4 border-t border-[#eee2cc] pt-3 text-xs text-slate-500 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <MapPin className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                              <span className="truncate font-medium">{report.location?.areaName} {report.location?.landmark ? `(${report.location.landmark})` : ""}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              <span>{formattedDate} {report.location?.incidentTime ? `• ${report.location.incidentTime}` : ""}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons Footer */}
                      <div className="flex items-center gap-2 p-4 pt-0">
                        <Link
                          href={`/kumbh/lost-found/${report.reportId}`}
                          className="flex-1 rounded-xl bg-orange-600 px-3 py-2.5 text-center text-xs font-bold text-white transition-colors hover:bg-orange-700 flex items-center justify-center gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" /> View Details
                        </Link>
                        <Link
                          href={`/kumbh/lost-found/inquiry/${report.reportId}`}
                          className="flex-1 rounded-xl border border-orange-300 bg-orange-50 px-3 py-2.5 text-center text-xs font-bold text-orange-800 transition-colors hover:bg-orange-100 flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-orange-700" /> Report Inquiry
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-[#d8c4a3] bg-[#fffdf8] p-12 text-center text-[#667883]">
                <Package className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-bold text-[#173247]">No published reports match your filter</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                  If you lost or found someone or something during Kumbh 2027, click "+ Report Lost or Found" above to submit a report.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Eye,
  MapPin,
  Phone,
  Mail,
  User,
  Image as ImageIcon,
  AlertTriangle,
  Trash2,
  ShieldAlert,
  Package,
  Calendar,
  Search,
  ShieldCheck,
  UserPlus,
  Lock,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type BusinessRegistration = {
  id: string;
  owner_id: string;
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
  created_at?: string;
};

type LostFoundReportAdmin = {
  _id: string;
  reportId: string;
  reportType: "lost" | "found";
  category: string;
  title: string;
  description: string;
  photoUrl?: string;
  personDetails?: { name?: string; age?: string; gender?: string; clothing?: string; identifyingMarks?: string };
  itemDetails?: { itemName?: string; itemType?: string; color?: string; identifyingMarks?: string; approxValue?: string };
  location: {
    areaName: string;
    landmark?: string;
    incidentDate?: string;
    incidentTime?: string;
  };
  reporterContact?: {
    name?: string;
    phone?: string;
    email?: string;
    userId?: string;
  };
  status: "pending" | "under_verification" | "published" | "resolved" | "rejected" | "closed";
  createdAt: string;
};

type AdminAccount = {
  _id: string;
  id: string;
  supabaseId?: string;
  name: string;
  email: string;
  role: string;
  adminStatus: "active" | "revoked";
  isPrimaryAdmin: boolean;
  createdBy?: string;
  createdAt?: string;
  revokedAt?: string;
};

type StatusFilter = "all" | "pending" | "approved" | "rejected";

function AdminDashboardContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab = tabParam === "admins" ? "admins" : tabParam === "lost-found" ? "lost-found" : "businesses";

  const [activeMainTab, setActiveMainTab] = useState<"businesses" | "lost-found" | "admins">(initialTab);
  const [businesses, setBusinesses] = useState<BusinessRegistration[]>([]);
  const [lostFoundReports, setLostFoundReports] = useState<LostFoundReportAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [lfStatusFilter, setLfStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [activeBusinesses, setActiveBusinesses] = useState<number>(0);

  const [selectedBusiness, setSelectedBusiness] = useState<BusinessRegistration | null>(null);
  const [selectedReport, setSelectedReport] = useState<LostFoundReportAdmin | null>(null);
  const [remarksInput, setRemarksInput] = useState("");
  const [modalMode, setModalMode] = useState<"view" | "reject" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Admin Management State
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminsError, setAdminsError] = useState("");
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState("");
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [addAdminError, setAddAdminError] = useState("");
  const [addAdminSuccess, setAddAdminSuccess] = useState("");

  async function loadBusinesses() {
    try {
      const { data, error } = await supabase
        .from("business_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "PGRST205" || error.code === "42P01") {
          setBusinesses([]);
        } else {
          setError(error.message);
        }
        return;
      }
      setBusinesses(data as BusinessRegistration[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load business applications");
    }
  }

  async function loadLostFoundReports() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Try admin endpoint first
      const res = await fetch("/api/kumbh/lost-found/admin/all", { headers });
      if (res.ok) {
        const data = await res.json();
        setLostFoundReports(Array.isArray(data) ? data : []);
        return;
      }

      // Fallback to public endpoint
      const publicRes = await fetch("/api/kumbh/lost-found");
      if (publicRes.ok) {
        const publicData = await publicRes.json();
        const reports = publicData.reports || publicData;
        setLostFoundReports(Array.isArray(reports) ? reports : []);
      }
    } catch (err) {
      console.error("Failed to load Lost & Found reports in admin dashboard:", err);
    }
  }

  async function loadStats() {
    try {
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      setTotalUsers(usersCount ?? 0);

      const { count: activeCount } = await supabase
        .from("business_registrations")
        .select("id", { count: "exact", head: true })
        .eq("verification_status", "approved");
      setActiveBusinesses(activeCount ?? 0);
    } catch (err: any) {
      console.error("Stats error:", err);
    }
  }

  async function loadAdmins() {
    setAdminsLoading(true);
    setAdminsError("");
    try {
      const res = await fetch("/api/admin/admins");
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to load admin accounts" }));
        throw new Error(data.error || "Failed to load admin accounts");
      }
      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setAdminsError(err.message || "Failed to load admin accounts");
    } finally {
      setAdminsLoading(false);
    }
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAddAdminLoading(true);
    setAddAdminError("");
    setAddAdminSuccess("");

    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword || !newAdminConfirmPassword) {
      setAddAdminError("All fields are required.");
      setAddAdminLoading(false);
      return;
    }
    if (newAdminPassword !== newAdminConfirmPassword) {
      setAddAdminError("Password and Confirm Password do not match.");
      setAddAdminLoading(false);
      return;
    }
    if (newAdminPassword.length < 6) {
      setAddAdminError("Password must be at least 6 characters.");
      setAddAdminLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAdminName.trim(),
          email: newAdminEmail.trim(),
          password: newAdminPassword,
          confirmPassword: newAdminConfirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to create admin");
      }

      setAddAdminSuccess(`Admin account created successfully for ${newAdminEmail.trim()}!`);
      setNewAdminName("");
      setNewAdminEmail("");
      setNewAdminPassword("");
      setNewAdminConfirmPassword("");
      setShowAddAdminModal(false);
      loadAdmins();
    } catch (err: any) {
      setAddAdminError(err.message || "Failed to create admin");
    } finally {
      setAddAdminLoading(false);
    }
  }

  async function handleRevokeAdmin(id: string, email: string) {
    if (!confirm(`Are you sure you want to revoke Admin access for ${email}? They will immediately lose access to the Admin Dashboard.`)) return;
    setActionLoading(id);
    try {
      // Retrieve Supabase session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`/api/admin/admins/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to revoke admin access");
      }
      loadAdmins();
    } catch (err: any) {
      alert(err.message || "Failed to revoke admin access");
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => {
    const fetchAll = async () => {
      await Promise.all([loadBusinesses(), loadLostFoundReports(), loadStats(), loadAdmins()]);
      setLoading(false);
    };
    void fetchAll();
  }, []);

  // Update tab if query parameter changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "admins") {
      setActiveMainTab("admins");
    } else if (tabParam === "lost-found") {
      setActiveMainTab("lost-found");
    }
  }, [searchParams]);

  async function reviewBusiness(id: string, newStatus: "approved" | "rejected", remarks = "") {
    setActionLoading(id);
    try {
      const updates: any = {
        verification_status: newStatus,
        admin_remarks: remarks,
        updated_at: new Date().toISOString(),
      };
      if (newStatus === "rejected") {
        updates.rejection_reason = remarks;
      }

      const { error } = await supabase
        .from("business_registrations")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      if (newStatus === "rejected") {
        await fetch(`/api/places?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
      } else if (newStatus === "approved") {
        await fetch("/api/places").catch(() => {});
      }

      setBusinesses((current) =>
        current.map((b) =>
          b.id === id
            ? { ...b, verification_status: newStatus, admin_remarks: remarks, rejection_reason: remarks }
            : b
        )
      );

      await loadStats();
      setSelectedBusiness(null);
      setModalMode(null);
      setRemarksInput("");
    } catch (err: any) {
      setError(err.message || "Could not update business application");
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteBusiness(id: string) {
    if (!window.confirm("Are you sure you want to permanently delete this business? It will be removed for all users.")) return;
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from("business_registrations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await fetch(`/api/places?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});

      setBusinesses((current) => current.filter((b) => b.id !== id));
      await loadStats();
      setSelectedBusiness(null);
      setModalMode(null);
    } catch (err: any) {
      setError(err.message || "Could not delete business application");
    } finally {
      setActionLoading(null);
    }
  }

  // --- LOST & FOUND ADMIN ACTIONS ---
  async function updateLostFoundStatus(id: string, status: string) {
    setActionLoading(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/kumbh/lost-found/admin/${id}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const text = await res.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch(e) {}
        throw new Error(data.message || `Failed to update report status: ${res.status}`);
      }

      setLostFoundReports((current) =>
        current.map((r) => (r._id === id || r.reportId === id ? { ...r, status: status as any } : r))
      );
      if (selectedReport && (selectedReport._id === id || selectedReport.reportId === id)) {
        setSelectedReport({ ...selectedReport, status: status as any });
      }
    } catch (err: any) {
      setError(err.message || "Could not update report status.");
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteLostFoundReport(id: string) {
    if (!window.confirm("Are you sure you want to permanently delete this Lost & Found report? This action cannot be undone.")) return;
    setActionLoading(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/kumbh/lost-found/admin/reports/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const text = await res.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch(e) {}
        throw new Error(data.message || `Failed to delete report: ${res.status}`);
      }

      setLostFoundReports((current) => current.filter((r) => r._id !== id && r.reportId !== id));
      if (selectedReport && (selectedReport._id === id || selectedReport.reportId === id)) {
        setSelectedReport(null);
      }
      setError("");
    } catch (err: any) {
      setError(err.message || "Could not delete report.");
    } finally {
      setActionLoading(null);
    }
  }

  const counts = {
    totalBusinesses: businesses.length,
    pendingApprovals: businesses.filter((b) => b.verification_status === "pending").length,
    approved: businesses.filter((b) => b.verification_status === "approved").length,
    rejected: businesses.filter((b) => b.verification_status === "rejected").length,
    totalUsers,
    activeBusinesses,
    totalLostFound: lostFoundReports.length,
    publishedLostFound: lostFoundReports.filter((r) => r.status === "published").length,
    resolvedLostFound: lostFoundReports.filter((r) => r.status === "resolved").length,
  };

  const filteredBusinesses = statusFilter === "all"
    ? businesses
    : businesses.filter((b) => b.verification_status === statusFilter);

  const filteredReports = lostFoundReports.filter((r) => {
    if (lfStatusFilter !== "all" && r.status !== lfStatusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.reportId?.toLowerCase().includes(q) ||
      r.reporterContact?.name?.toLowerCase().includes(q) ||
      r.reporterContact?.phone?.includes(q) ||
      r.location?.areaName?.toLowerCase().includes(q)
    );
  });

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      published: "bg-emerald-100 text-emerald-800 border-emerald-200",
      resolved: "bg-blue-100 text-blue-800 border-blue-200",
      not_submitted: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return styles[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-[#e86f18]">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-2">
      {/* Top Main Section Switcher */}
      <div className="mb-6 border-b border-[#e1cfb0] pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#173247]">Admin Dashboard</h1>
          <p className="mt-1 text-[#667883]">
            Manage business applications and moderate Lost & Found reports across Discover Nashik.
          </p>
        </div>

        <div className="flex rounded-2xl border border-[#d8c4a3] bg-[#fffdf8] p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveMainTab("businesses")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs md:text-sm font-bold transition-all ${
              activeMainTab === "businesses"
                ? "bg-[#e86f18] text-white shadow-md"
                : "text-[#667883] hover:bg-orange-50 hover:text-orange-600"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Businesses ({businesses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("lost-found")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs md:text-sm font-bold transition-all ${
              activeMainTab === "lost-found"
                ? "bg-[#e86f18] text-white shadow-md"
                : "text-[#667883] hover:bg-orange-50 hover:text-orange-600"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Lost & Found Reports ({lostFoundReports.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("admins")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs md:text-sm font-bold transition-all ${
              activeMainTab === "admins"
                ? "bg-[#e86f18] text-white shadow-md"
                : "text-[#667883] hover:bg-orange-50 hover:text-orange-600"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Admin Management</span>
          </button>
        </div>
      </div>

      {error && <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

      {/* SECTION 1: BUSINESS REGISTRATIONS */}
      {activeMainTab === "businesses" && (
        <>
          {/* Stats Overview */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Applications", value: counts.totalBusinesses, icon: <Building2 className="h-5 w-5 text-[#e86f18]" />, color: "bg-[#fff8e6] border-[#e86f18]" },
              { label: "Pending Review", value: counts.pendingApprovals, icon: <Clock className="h-5 w-5 text-[#e86f18]" />, color: "bg-[#fff8e6] border-[#e86f18]" },
              { label: "Approved Businesses", value: counts.approved, icon: <CheckCircle2 className="h-5 w-5 text-[#e86f18]" />, color: "bg-[#fff8e6] border-[#e86f18]" },
              { label: "Rejected Applications", value: counts.rejected, icon: <XCircle className="h-5 w-5 text-[#e86f18]" />, color: "bg-[#fff8e6] border-[#e86f18]" },
            ].map((stat) => (
              <div key={stat.label} className={`flex items-center gap-4 rounded-2xl border p-5 ${stat.color}`}>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">{stat.icon}</div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-[#173247]">Submitted Business Registrations</h2>
            <div className="flex gap-1 rounded-xl border border-[#e1cfb0] bg-[#fffdf8] p-1">
              {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-lg px-4 py-2 text-xs font-bold capitalize transition-all ${
                    statusFilter === status
                      ? "bg-[#e86f18] text-white shadow-sm"
                      : "text-[#667883] hover:bg-orange-50 hover:text-[#c9580f]"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Applications */}
          {!filteredBusinesses.length ? (
            <div className="rounded-2xl border border-dashed border-[#d8c4a3] p-12 text-center text-[#667883]">
              No business applications found under status "{statusFilter}".
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredBusinesses.map((b) => {
                const photoList = b.photos ? b.photos.split("\n").filter(Boolean) : [];
                return (
                  <article key={b.id} className="rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-start justify-between gap-4 border-b border-[#e1cfb0] pb-4">
                      <div>
                        <h3 className="text-lg font-bold text-[#173247]">{b.business_name}</h3>
                        <p className="text-xs font-semibold text-[#e86f18]">
                          {b.category} {b.subcategory ? `• ${b.subcategory}` : ""}
                        </p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusBadge(b.verification_status)}`}>
                        {b.verification_status}
                      </span>
                    </div>

                    <dl className="mt-4 space-y-2 text-sm text-[#667883]">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[#e86f18]" />
                        <span className="font-semibold text-[#173247]">{b.contact_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[#e86f18]" />
                        <span>{b.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#e86f18]" />
                        <span>{b.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#e86f18]" />
                        <span>{b.city_area || b.address}</span>
                      </div>
                      {photoList.length > 0 && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#e86f18]">
                          <ImageIcon className="h-4 w-4" />
                          <span>{photoList.length} photo(s) attached</span>
                        </div>
                      )}
                    </dl>

                    {b.admin_remarks && (
                      <div className="mt-4 rounded-xl bg-orange-50 p-3 text-xs font-medium text-orange-900 border border-orange-200">
                        <span className="font-bold">Admin Remarks: </span>{b.admin_remarks}
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2 border-t border-[#e1cfb0] pt-4">
                      <button
                        type="button"
                        onClick={() => { setSelectedBusiness(b); setModalMode("view"); }}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#d8c4a3] bg-white px-3 py-2 text-xs font-bold text-[#173247] hover:bg-orange-50"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Details
                      </button>

                      {b.verification_status !== "approved" && (
                        <button
                          type="button"
                          disabled={actionLoading === b.id}
                          onClick={() => reviewBusiness(b.id, "approved", "Approved by admin.")}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                      )}

                      {b.verification_status !== "rejected" && (
                        <button
                          type="button"
                          disabled={actionLoading === b.id}
                          onClick={() => { setSelectedBusiness(b); setModalMode("reject"); setRemarksInput(""); }}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-60"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={actionLoading === b.id}
                        onClick={() => deleteBusiness(b.id)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* SECTION 2: LOST & FOUND REPORTS MODERATION */}
      {activeMainTab === "lost-found" && (
        <>
          {/* Stats Overview */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Total Reports", value: counts.totalLostFound, icon: <AlertTriangle className="h-5 w-5 text-orange-600" />, color: "bg-orange-50 border-orange-200" },
              { label: "Published Reports", value: counts.publishedLostFound, icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />, color: "bg-emerald-50 border-emerald-200" },
              { label: "Resolved Reports", value: counts.resolvedLostFound, icon: <Clock className="h-5 w-5 text-blue-600" />, color: "bg-blue-50 border-blue-200" },
            ].map((stat) => (
              <div key={stat.label} className={`flex items-center gap-4 rounded-2xl border p-5 ${stat.color}`}>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">{stat.icon}</div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search & Filter Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 rounded-xl border border-[#d8c4a3] bg-white px-3 py-2 text-sm shadow-sm w-full sm:max-w-xs">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search by ID, name, area, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-xs md:text-sm"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto rounded-xl border border-[#e1cfb0] bg-[#fffdf8] p-1">
              {[
                { id: "all", label: "All" },
                { id: "published", label: "Published" },
                { id: "resolved", label: "Resolved" },
                { id: "rejected", label: "Rejected" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setLfStatusFilter(filter.id)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 ${
                    lfStatusFilter === filter.id
                      ? "bg-orange-600 text-white shadow-sm"
                      : "text-[#667883] hover:bg-orange-50 hover:text-orange-600"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Lost & Found Reports */}
          {!filteredReports.length ? (
            <div className="rounded-2xl border border-dashed border-[#d8c4a3] p-12 text-center text-[#667883]">
              No Lost & Found reports found.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredReports.map((report) => (
                <article key={report._id} className="flex flex-col justify-between rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-5 shadow-sm transition-all hover:shadow-md">
                  <div>
                    <div className="flex items-start justify-between gap-3 border-b border-[#eee2cc] pb-3 mb-3">
                      <div>
                        <span className="font-mono text-[11px] font-bold text-slate-500">ID: {report.reportId}</span>
                        <h3 className="text-base font-bold text-[#173247] leading-snug">{report.title}</h3>
                      </div>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase shrink-0 ${statusBadge(report.status)}`}>
                        {report.status}
                      </span>
                    </div>

                    {report.photoUrl && (
                      <div className="mb-3 aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                        <img src={report.photoUrl} alt={report.title} className="h-full w-full object-cover" />
                      </div>
                    )}

                    <p className="text-xs text-[#667883] line-clamp-3 mb-3">{report.description}</p>

                    <div className="space-y-1 text-xs text-[#667883] border-t border-slate-100 pt-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                        <span className="truncate">{report.location?.areaName} {report.location?.landmark ? `(${report.location.landmark})` : ""}</span>
                      </div>
                      {report.reporterContact && (
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <User className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                          <span className="truncate">{report.reporterContact.name || "Visitor"} ({report.reporterContact.phone || "No phone"})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-[#eee2cc] pt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedReport(report)}
                      className="flex-1 rounded-xl border border-orange-300 bg-white px-3 py-2 text-xs font-bold text-orange-800 hover:bg-orange-50 flex items-center justify-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> Details
                    </button>

                    {report.status !== "published" && (
                      <button
                        type="button"
                        disabled={actionLoading === report._id}
                        onClick={() => updateLostFoundStatus(report._id, "published")}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Publish
                      </button>
                    )}

                    {report.status !== "resolved" && (
                      <button
                        type="button"
                        disabled={actionLoading === report._id}
                        onClick={() => updateLostFoundStatus(report._id, "resolved")}
                        className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        Resolve
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={actionLoading === report._id}
                      onClick={() => deleteLostFoundReport(report._id)}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60 flex items-center justify-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-600" /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* SECTION 3: ADMIN MANAGEMENT */}
      {activeMainTab === "admins" && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-sm">
            <div>
              <div className="flex items-center gap-2 text-[#e86f18]">
                <ShieldCheck className="h-6 w-6" />
                <h2 className="text-2xl font-bold text-[#173247]">Admin Access Control</h2>
              </div>
              <p className="mt-1 text-sm text-[#667883]">
                Manage server-authorized admin accounts and primary dashboard ownership.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAddAdminError("");
                setAddAdminSuccess("");
                setShowAddAdminModal(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-[#e86f18] px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-[#c9580f] transition-all"
            >
              <UserPlus className="h-4 w-4" />
              <span>+ Add Admin</span>
            </button>
          </div>

          {addAdminSuccess && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-bold text-emerald-800">
              {addAdminSuccess}
            </div>
          )}

          {/* Primary Admin Info */}
          <div className="rounded-3xl border border-amber-300/80 bg-amber-50/70 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600 text-white font-bold shadow-md">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <span className="inline-block rounded-full bg-amber-600 px-3 py-0.5 text-xs font-extrabold uppercase text-white tracking-wider mb-1">
                    Primary Admin (Protected Owner)
                  </span>
                  <h3 className="text-xl font-bold text-[#173247]">shubhamtiwari.2006.met@gmail.com</h3>
                  <p className="text-xs text-[#667883]">
                    Sole Primary Owner of Discover Nashik Admin System. Cannot be removed, revoked, or modified.
                  </p>
                </div>
              </div>
              <span className="rounded-xl bg-amber-200/80 px-3 py-1.5 text-xs font-bold text-amber-900 border border-amber-300">
                Protected Account
              </span>
            </div>
          </div>

          {/* Additional Admins Table */}
          <div className="rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#173247] mb-4">Additional Admins</h3>
            {adminsLoading ? (
              <div className="flex py-12 justify-center text-orange-600">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : adminsError ? (
              <p className="text-sm font-semibold text-red-600 py-4">{adminsError}</p>
            ) : admins.filter(a => !a.isPrimaryAdmin && a.email.toLowerCase() !== "shubhamtiwari.2006.met@gmail.com").length === 0 ? (
              <div className="py-12 text-center text-[#667883]">
                <UserCheck className="mx-auto h-10 w-10 opacity-40 mb-2" />
                <p className="font-semibold">No additional admins added yet.</p>
                <p className="text-xs mt-1">Use the "+ Add Admin" button above to grant Admin Dashboard access to authorized staff.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#e1cfb0] bg-[#fdf8ee] text-[#667883]">
                      <th className="p-3 font-bold">Name</th>
                      <th className="p-3 font-bold">Email</th>
                      <th className="p-3 font-bold">Status</th>
                      <th className="p-3 font-bold">Created Date</th>
                      <th className="p-3 font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins
                      .filter(a => !a.isPrimaryAdmin && a.email.toLowerCase() !== "shubhamtiwari.2006.met@gmail.com")
                      .map((admin) => (
                        <tr key={admin._id || admin.email} className="border-b border-[#eee2cc]">
                          <td className="p-3 font-bold text-[#173247]">{admin.name || "Admin"}</td>
                          <td className="p-3 font-mono text-xs">{admin.email}</td>
                          <td className="p-3">
                            <span className={`inline-block rounded-full px-3 py-1 text-xs font-extrabold uppercase ${
                              admin.adminStatus === "revoked"
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}>
                              {admin.adminStatus === "revoked" ? "Revoked" : "Active"}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-[#667883]">
                            {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                          </td>
                          <td className="p-3 text-center">
                            {admin.adminStatus === "revoked" ? (
                              <span className="text-xs text-slate-400 font-medium">Access Revoked</span>
                            ) : (
                              <button
                                type="button"
                                disabled={actionLoading === (admin._id || admin.id)}
                                onClick={() => handleRevokeAdmin(admin._id || admin.id || admin.email, admin.email)}
                                className="rounded-xl border border-red-300 bg-red-50 px-3.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                              >
                                {actionLoading === (admin._id || admin.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Remove Access"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Business Details Modal */}
      {selectedBusiness && modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-[#173247]">
              {modalMode === "view" ? selectedBusiness.business_name : "Reject Application"}
            </h2>

            {modalMode === "view" ? (
              <div className="mt-4 space-y-4 text-sm text-[#173247]">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="text-xs font-bold text-[#667883] uppercase">Category</span>
                    <p className="font-semibold">{selectedBusiness.category}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#667883] uppercase">Subcategory</span>
                    <p className="font-semibold">{selectedBusiness.subcategory || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#667883] uppercase">Contact Person</span>
                    <p className="font-semibold">{selectedBusiness.contact_name}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#667883] uppercase">Phone</span>
                    <p className="font-semibold">{selectedBusiness.phone}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#667883] uppercase">Email</span>
                    <p className="font-semibold">{selectedBusiness.email}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#667883] uppercase">City / Area</span>
                    <p className="font-semibold">{selectedBusiness.city_area || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#667883] uppercase">Timings</span>
                    <p className="font-semibold">{selectedBusiness.opening_time} - {selectedBusiness.closing_time}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#667883] uppercase">Working Days</span>
                    <p className="font-semibold">{selectedBusiness.working_days || "N/A"}</p>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-[#667883] uppercase">Full Address</span>
                  <p className="mt-1 font-semibold">{selectedBusiness.address}</p>
                </div>

                <div>
                  <span className="text-xs font-bold text-[#667883] uppercase">Description</span>
                  <p className="mt-1 font-semibold">{selectedBusiness.description || "N/A"}</p>
                </div>

                {selectedBusiness.photos && (
                  <div>
                    <span className="text-xs font-bold text-[#667883] uppercase">Attached Photos</span>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {selectedBusiness.photos.split("\n").filter(Boolean).map((url, i) => (
                        <img key={i} src={url} alt={`Photo ${i + 1}`} className="h-32 w-full rounded-xl object-cover border border-[#e1cfb0]" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-[#667883]">
                  Please enter rejection remarks or reason to inform the business owner:
                </p>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Invalid phone number provided, address unverified..."
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                  className="w-full rounded-xl border border-[#d8c4a3] bg-white p-3 text-sm outline-none focus:border-orange-500"
                />
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-[#e1cfb0] pt-4">
              <button
                type="button"
                onClick={() => { setSelectedBusiness(null); setModalMode(null); }}
                className="rounded-xl border border-[#d8c4a3] px-4 py-2 text-xs font-bold text-[#667883]"
              >
                Close
              </button>
              {modalMode === "reject" && (
                <button
                  type="button"
                  disabled={!remarksInput.trim() || actionLoading === selectedBusiness.id}
                  onClick={() => reviewBusiness(selectedBusiness.id, "rejected", remarksInput.trim())}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Submit Rejection
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lost & Found Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e1cfb0] pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-slate-500">Report ID: {selectedReport.reportId}</span>
                <h2 className="text-2xl font-bold text-[#173247]">{selectedReport.title}</h2>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-extrabold uppercase ${statusBadge(selectedReport.status)}`}>
                {selectedReport.status}
              </span>
            </div>

            <div className="mt-4 space-y-4 text-sm text-[#173247]">
              {selectedReport.photoUrl && (
                <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  <img src={selectedReport.photoUrl} alt={selectedReport.title} className="h-full w-full object-cover" />
                </div>
              )}

              <div>
                <span className="text-xs font-bold text-[#667883] uppercase">Description</span>
                <p className="mt-1 leading-relaxed">{selectedReport.description}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 border-t border-[#eee2cc] pt-3">
                <div>
                  <span className="text-xs font-bold text-[#667883] uppercase">Category</span>
                  <p className="font-semibold">{selectedReport.category}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#667883] uppercase">Report Type</span>
                  <p className="font-semibold uppercase text-orange-600">{selectedReport.reportType}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#667883] uppercase">Incident Location</span>
                  <p className="font-semibold">{selectedReport.location?.areaName} {selectedReport.location?.landmark ? `(${selectedReport.location.landmark})` : ""}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#667883] uppercase">Incident Time</span>
                  <p className="font-semibold">{selectedReport.location?.incidentDate || "N/A"} {selectedReport.location?.incidentTime || ""}</p>
                </div>
              </div>

              {selectedReport.reporterContact && (
                <div className="rounded-2xl bg-orange-50/80 p-4 border border-orange-200/80 space-y-1">
                  <span className="text-xs font-extrabold text-orange-950 uppercase tracking-wider block mb-1">Reporter Contact Information</span>
                  <p className="text-xs"><strong>Name:</strong> {selectedReport.reporterContact.name || "N/A"}</p>
                  <p className="text-xs"><strong>Phone:</strong> {selectedReport.reporterContact.phone || "N/A"}</p>
                  <p className="text-xs"><strong>Email:</strong> {selectedReport.reporterContact.email || "N/A"}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#e1cfb0] pt-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={actionLoading === selectedReport._id}
                  onClick={() => updateLostFoundStatus(selectedReport._id, "published")}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  Publish
                </button>
                <button
                  type="button"
                  disabled={actionLoading === selectedReport._id}
                  onClick={() => updateLostFoundStatus(selectedReport._id, "resolved")}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Mark Resolved
                </button>
                <button
                  type="button"
                  disabled={actionLoading === selectedReport._id}
                  onClick={() => deleteLostFoundReport(selectedReport._id)}
                  className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60 flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-600" /> Delete Report
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded-xl border border-[#d8c4a3] px-4 py-2 text-xs font-bold text-[#667883]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e1cfb0] pb-3 mb-4">
              <div className="flex items-center gap-2 text-[#e86f18]">
                <UserPlus className="h-5 w-5" />
                <h3 className="text-xl font-bold text-[#173247]">Add New Admin Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAdminModal(false)}
                className="rounded-full p-1 text-[#667883] hover:bg-orange-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#667883] mb-1">
                  Admin Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full rounded-xl border border-[#d8c4a3] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#667883] mb-1">
                  Admin Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#d8c4a3] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#667883] mb-1">
                  Initial Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#d8c4a3] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#667883] mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Re-enter password"
                  value={newAdminConfirmPassword}
                  onChange={(e) => setNewAdminConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#d8c4a3] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              {addAdminError && (
                <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
                  {addAdminError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[#e1cfb0]">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="rounded-xl border border-[#d8c4a3] px-4 py-2 text-xs font-bold text-[#667883] hover:bg-orange-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addAdminLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-[#e86f18] px-5 py-2 text-xs font-bold text-white hover:bg-[#c9580f] disabled:opacity-60"
                >
                  {addAdminLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Create Admin Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center text-[#e86f18]">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}


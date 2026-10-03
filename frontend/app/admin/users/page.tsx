"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Loader2,
  Users,
  UserCheck,
  Building2,
  ShieldCheck,
  Ban,
  Search,
  Eye,
  Trash2,
  ShieldOff,
  ShieldAlert,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  UserX,
  Lock,
  Unlock,
  MoreVertical,
  Info,
} from "lucide-react";

// ─── Types ───
type UserType = "common" | "business" | "admin";
type UserStatus = "active" | "blocked" | "revoked";
type FilterCategory = "all" | "common" | "business" | "admin" | "blocked" | "active";

interface ManagedUser {
  _id: string;
  name: string;
  email: string | null;
  mobile: string | null;
  userType: UserType;
  status: UserStatus;
  isActive?: boolean;
  emailVerified?: boolean;
  mobileVerified?: boolean;
  authProvider?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  businessStatus?: string;
  businessName?: string;
  businessType?: string;
  verificationStatus?: string;
  adminStatus?: string;
  isPrimaryAdmin?: boolean;
  createdBy?: string;
  revokedAt?: string;
  supabaseId?: string;
}

interface UserDetail extends ManagedUser {
  business?: {
    businessName: string;
    businessType: string;
    contactName: string;
    phone: string;
    email: string;
    address: string;
    description: string;
    verificationStatus: string;
    createdAt: string;
  } | null;
  blockedIdentifiers?: Array<{
    type: string;
    identifier: string;
    blockedAt: string;
    reason: string | null;
  }>;
}

interface UserStats {
  total: number;
  common: number;
  business: number;
  admin: number;
  blocked: number;
  blockedIdentifiers: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Helpers ───
function getAuthHeaders(token: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

// ─── Status Badge ───
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Active" },
    blocked: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Blocked" },
    revoked: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Revoked" },
    pending: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500", label: "Pending" },
    approved: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Approved" },
    rejected: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Rejected" },
    not_applicable: { bg: "bg-slate-50", text: "text-slate-500", dot: "bg-slate-400", label: "N/A" },
  };

  const c = config[status] || config["active"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ─── User Type Badge ───
function UserTypeBadge({ type }: { type: UserType }) {
  const config: Record<UserType, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    common: { bg: "bg-blue-50", text: "text-blue-700", icon: <UserCheck className="w-3 h-3" />, label: "Common" },
    business: { bg: "bg-purple-50", text: "text-purple-700", icon: <Building2 className="w-3 h-3" />, label: "Business" },
    admin: { bg: "bg-orange-50", text: "text-orange-700", icon: <ShieldCheck className="w-3 h-3" />, label: "Admin" },
  };

  const c = config[type];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

// ─── Confirmation Dialog ───
function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
  loading,
  showReasonInput,
  reason,
  onReasonChange,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  showReasonInput?: boolean;
  reason?: string;
  onReasonChange?: (v: string) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-6 pt-6 pb-2">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${confirmColor === "red" ? "bg-red-100" : "bg-amber-100"}`}>
            <AlertTriangle className={`w-5 h-5 ${confirmColor === "red" ? "text-red-600" : "text-amber-600"}`} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        </div>
        <div className="px-6 py-3">
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
          {showReasonInput && (
            <textarea
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 resize-none placeholder:text-slate-400"
              placeholder="Reason for blocking (optional)"
              rows={2}
              value={reason || ""}
              onChange={(e) => onReasonChange?.(e.target.value)}
            />
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 ${
              confirmColor === "red"
                ? "bg-red-600 hover:bg-red-700 shadow-sm shadow-red-200"
                : "bg-amber-600 hover:bg-amber-700 shadow-sm shadow-amber-200"
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User Detail Modal ───
function UserDetailModal({
  user,
  open,
  onClose,
}: {
  user: UserDetail | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-[#173247] to-[#1e3d55]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg shrink-0">
              {user.name ? user.name[0].toUpperCase() : "?"}
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold truncate">{user.name || "Unknown"}</h3>
              <div className="flex items-center gap-2">
                <UserTypeBadge type={user.userType} />
                <StatusBadge status={user.status} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoField label="Name" value={user.name || "—"} />
              <InfoField label="Email" value={user.email || "—"} />
              {user.mobile && <InfoField label="Mobile" value={user.mobile} />}
              <InfoField label="User Type" value={user.userType} capitalize />
              <InfoField label="Status" value={user.status} capitalize />
              <InfoField label="Registered" value={formatDateTime(user.createdAt)} />
              {user.lastLoginAt && <InfoField label="Last Login" value={formatDateTime(user.lastLoginAt)} />}
            </div>
          </div>

          {/* Common User Fields */}
          {user.userType === "common" && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Verification</h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="Email Verified" value={user.emailVerified ? "Yes" : "No"} />
                <InfoField label="Mobile Verified" value={user.mobileVerified ? "Yes" : "No"} />
                {user.authProvider && <InfoField label="Auth Provider" value={user.authProvider} />}
              </div>
            </div>
          )}

          {/* Business Info */}
          {user.userType === "business" && user.business && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Business Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoField label="Business Name" value={user.business.businessName || "—"} />
                <InfoField label="Business Type" value={user.business.businessType || "—"} />
                <InfoField label="Contact Name" value={user.business.contactName || "—"} />
                <InfoField label="Phone" value={user.business.phone || "—"} />
                <InfoField label="Business Email" value={user.business.email || "—"} />
                <InfoField label="Address" value={user.business.address || "—"} />
                <InfoField label="Verification" value={user.business.verificationStatus || "—"} capitalize />
                {user.business.description && (
                  <div className="col-span-full">
                    <InfoField label="Description" value={user.business.description} />
                  </div>
                )}
              </div>
            </div>
          )}

          {user.userType === "business" && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Business Account Status</h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="Business Status" value={user.businessStatus || "—"} capitalize />
                {user.verificationStatus && <InfoField label="Verification" value={user.verificationStatus} capitalize />}
              </div>
            </div>
          )}

          {/* Admin Info */}
          {user.userType === "admin" && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="Admin Status" value={user.adminStatus || "—"} capitalize />
                <InfoField label="Primary Admin" value={user.isPrimaryAdmin ? "Yes" : "No"} />
                {user.createdBy && <InfoField label="Created By" value={user.createdBy} />}
                {user.revokedAt && <InfoField label="Revoked At" value={formatDateTime(user.revokedAt)} />}
              </div>
            </div>
          )}

          {/* Blocked Identifiers */}
          {user.blockedIdentifiers && user.blockedIdentifiers.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-400">Blocked Identifiers</h4>
              <div className="space-y-2">
                {user.blockedIdentifiers.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 bg-red-50 rounded-lg p-3 border border-red-100">
                    <Ban className="w-4 h-4 text-red-500 shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium text-red-700 capitalize">{b.type}:</span>{" "}
                      <span className="text-red-600">{b.identifier}</span>
                      {b.reason && <span className="text-red-400 ml-2">— {b.reason}</span>}
                      <div className="text-xs text-red-400 mt-0.5">Blocked {formatDateTime(b.blockedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2.5">
      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`text-sm font-medium text-slate-800 break-all ${capitalize ? "capitalize" : ""}`}>{value}</div>
    </div>
  );
}

// ─── Main Page Component ───
export default function AdminUsersPage() {
  const supabase = createClient();

  // State
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [stats, setStats] = useState<UserStats>({ total: 0, common: 0, business: 0, admin: 0, blocked: 0, blockedIdentifiers: 0 });
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Detail modal
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor: string;
    action: (() => Promise<void>) | null;
    showReasonInput?: boolean;
  }>({ open: false, title: "", message: "", confirmLabel: "", confirmColor: "", action: null });
  const [blockReason, setBlockReason] = useState("");

  // Action menu ref for outside click
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Search debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Auth Token ───
  const getToken = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) return data.session.access_token;
    } catch {}
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || localStorage.getItem("adminToken") || null;
    }
    return null;
  }, [supabase]);

  // ─── Fetch Stats ───
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/users/stats", { credentials: "include", headers: getAuthHeaders(token) });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Failed to load stats:", e);
    } finally {
      setStatsLoading(false);
    }
  }, [getToken]);

  // ─── Fetch Users ───
  const fetchUsers = useCallback(
    async (page = 1, search = searchQuery, category = activeFilter) => {
      setLoading(true);
      setError("");
      try {
        const token = await getToken();
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
          search,
          category: category === "blocked" || category === "active" ? "all" : category,
          status: category === "blocked" ? "blocked" : category === "active" ? "active" : "all",
        });
        const res = await fetch(`/api/admin/users?${params}`, { credentials: "include", headers: getAuthHeaders(token) });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to load users");
        }
        const data = await res.json();
        setUsers(data.users || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      } catch (e: any) {
        setError(e.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    },
    [getToken, searchQuery, activeFilter]
  );

  // ─── Initial Load ───
  useEffect(() => {
    fetchStats();
    fetchUsers(1, "", "all");
  }, []);

  // ─── Search Debounce ───
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchUsers(1, searchQuery, activeFilter);
    }, 400);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // ─── Filter Change ───
  const handleFilterChange = (filter: FilterCategory) => {
    setActiveFilter(filter);
    fetchUsers(1, searchQuery, filter);
  };

  // ─── Close action menu on outside click ───
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setOpenActionMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── View User Detail ───
  const viewUser = async (user: ManagedUser) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/users/${user._id}?type=${user.userType}`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedUser(data);
      } else {
        setSelectedUser(user as any);
      }
    } catch {
      setSelectedUser(user as any);
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Delete User ───
  const confirmDelete = (user: ManagedUser) => {
    setOpenActionMenu(null);
    setConfirmDialog({
      open: true,
      title: "Delete User?",
      message:
        user.userType === "admin"
          ? `This will revoke admin access for ${user.name || user.email}. The identifier can be used to create a new account later.`
          : `This will permanently delete the account of ${user.name || user.email || user.mobile}. The identifier can be used to create a new account later.`,
      confirmLabel: "Delete",
      confirmColor: "red",
      action: async () => {
        const token = await getToken();
        const res = await fetch(`/api/admin/users/${user._id}?type=${user.userType}`, {
          method: "DELETE",
          headers: getAuthHeaders(token),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to delete user");
        }
        fetchUsers(pagination.page, searchQuery, activeFilter);
        fetchStats();
      },
    });
  };

  // ─── Block User ───
  const confirmBlock = (user: ManagedUser) => {
    setOpenActionMenu(null);
    setBlockReason("");
    setConfirmDialog({
      open: true,
      title: "Block User?",
      message: `This will prevent ${user.email || user.mobile || "this user"} from logging in or registering again. The block persists even if the user record is deleted.`,
      confirmLabel: "Block",
      confirmColor: "amber",
      showReasonInput: true,
      action: async () => {
        const token = await getToken();
        const res = await fetch(`/api/admin/users/${user._id}/block?type=${user.userType}`, {
          method: "POST",
          headers: getAuthHeaders(token),
          body: JSON.stringify({ reason: blockReason || null }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to block user");
        }
        fetchUsers(pagination.page, searchQuery, activeFilter);
        fetchStats();
      },
    });
  };

  // ─── Unblock User ───
  const confirmUnblock = (user: ManagedUser) => {
    setOpenActionMenu(null);
    setConfirmDialog({
      open: true,
      title: "Unblock User?",
      message: `This will remove the block on ${user.email || user.mobile || "this user"}. They will be able to login or register again.`,
      confirmLabel: "Unblock",
      confirmColor: "amber",
      action: async () => {
        const token = await getToken();
        const res = await fetch(`/api/admin/users/${user._id}/unblock?type=${user.userType}`, {
          method: "POST",
          headers: getAuthHeaders(token),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to unblock user");
        }
        fetchUsers(pagination.page, searchQuery, activeFilter);
        fetchStats();
      },
    });
  };

  // ─── Execute Confirm ───
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  const executeConfirm = async () => {
    if (!confirmDialog.action) return;
    setConfirmLoading(true);
    setConfirmError("");
    try {
      await confirmDialog.action();
      setConfirmDialog({ open: false, title: "", message: "", confirmLabel: "", confirmColor: "", action: null });
    } catch (e: any) {
      setConfirmError(e.message || "Operation failed");
    } finally {
      setConfirmLoading(false);
    }
  };

  // ─── Stat Cards Config ───
  const statCards = [
    { label: "Total Users", value: stats.total, icon: <Users className="w-5 h-5" />, color: "from-[#173247] to-[#1e3d55]", textColor: "text-white", iconBg: "bg-white/20" },
    { label: "Common Users", value: stats.common, icon: <UserCheck className="w-5 h-5" />, color: "from-blue-500 to-blue-600", textColor: "text-white", iconBg: "bg-white/20" },
    { label: "Business Users", value: stats.business, icon: <Building2 className="w-5 h-5" />, color: "from-purple-500 to-purple-600", textColor: "text-white", iconBg: "bg-white/20" },
    { label: "Admins", value: stats.admin, icon: <ShieldCheck className="w-5 h-5" />, color: "from-orange-500 to-orange-600", textColor: "text-white", iconBg: "bg-white/20" },
    { label: "Blocked Users", value: stats.blocked, icon: <Ban className="w-5 h-5" />, color: "from-red-500 to-red-600", textColor: "text-white", iconBg: "bg-white/20" },
  ];

  // ─── Filter Tabs Config ───
  const filterTabs: { key: FilterCategory; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "All", icon: <Users className="w-3.5 h-3.5" /> },
    { key: "common", label: "Common", icon: <UserCheck className="w-3.5 h-3.5" /> },
    { key: "business", label: "Business", icon: <Building2 className="w-3.5 h-3.5" /> },
    { key: "admin", label: "Admins", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { key: "blocked", label: "Blocked", icon: <Ban className="w-3.5 h-3.5" /> },
    { key: "active", label: "Active", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#173247] tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage common, business, and admin users</p>
        </div>
        <button
          onClick={() => {
            fetchUsers(1, searchQuery, activeFilter);
            fetchStats();
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#173247] bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`bg-gradient-to-br ${card.color} rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center ${card.textColor}`}>
                {card.icon}
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold ${card.textColor} mb-0.5`}>
              {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : card.value}
            </div>
            <div className={`text-xs font-medium ${card.textColor} opacity-80`}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search */}
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, mobile, or business name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <div className="flex flex-wrap gap-1.5">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleFilterChange(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activeFilter === tab.key
                    ? "bg-[#173247] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 sm:mx-5 mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <XCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Table */}
        <div className="border-t border-slate-100">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Users className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No users found</p>
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/80">
                      <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">User</th>
                      <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Type</th>
                      <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Email / Mobile</th>
                      <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Registered</th>
                      <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                      <th className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((user) => (
                      <tr key={`${user._id}-${user.userType}`} className="hover:bg-orange-50/30 transition-colors group">
                        {/* User */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#173247] to-[#1e4a67] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                              {user.name ? user.name[0].toUpperCase() : "?"}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 truncate max-w-[180px]">
                                {user.name || "Unknown"}
                              </div>
                              {user.businessName && (
                                <div className="text-xs text-purple-600 truncate max-w-[180px]">{user.businessName}</div>
                              )}
                              {user.isPrimaryAdmin && (
                                <span className="text-[10px] font-bold text-orange-500 uppercase">Primary</span>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Type */}
                        <td className="px-4 py-3.5">
                          <UserTypeBadge type={user.userType} />
                        </td>
                        {/* Email/Mobile */}
                        <td className="px-4 py-3.5">
                          <div className="text-sm text-slate-700 truncate max-w-[220px]">{user.email || "—"}</div>
                          {user.mobile && <div className="text-xs text-slate-400">{user.mobile}</div>}
                        </td>
                        {/* Registered */}
                        <td className="px-4 py-3.5">
                          <div className="text-sm text-slate-600">{formatDate(user.createdAt)}</div>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <StatusBadge status={user.status} />
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1" ref={openActionMenu === user._id + user.userType ? actionMenuRef : null}>
                            <button
                              onClick={() => viewUser(user)}
                              title="View Details"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {/* Show actions based on user type and status */}
                            {user.status === "blocked" ? (
                              <button
                                onClick={() => confirmUnblock(user)}
                                title="Unblock"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              >
                                <Unlock className="w-4 h-4" />
                              </button>
                            ) : (
                              <>
                                {!(user.userType === "admin" && user.isPrimaryAdmin) && (
                                  <button
                                    onClick={() => confirmBlock(user)}
                                    title="Block"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                  >
                                    <Lock className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                            {!(user.userType === "admin" && user.isPrimaryAdmin) && (
                              <button
                                onClick={() => confirmDelete(user)}
                                title="Delete"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {users.map((user) => (
                  <div key={`${user._id}-${user.userType}-m`} className="px-4 py-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#173247] to-[#1e4a67] flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {user.name ? user.name[0].toUpperCase() : "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">{user.name || "Unknown"}</div>
                          <div className="text-xs text-slate-500 truncate">{user.email || user.mobile || "—"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <UserTypeBadge type={user.userType} />
                        <StatusBadge status={user.status} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Registered {formatDate(user.createdAt)}</span>
                      {user.businessName && <span className="text-purple-500">{user.businessName}</span>}
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => viewUser(user)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      {user.status === "blocked" ? (
                        <button
                          onClick={() => confirmUnblock(user)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          <Unlock className="w-3.5 h-3.5" /> Unblock
                        </button>
                      ) : (
                        <>
                          {!(user.userType === "admin" && user.isPrimaryAdmin) && (
                            <button
                              onClick={() => confirmBlock(user)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                            >
                              <Lock className="w-3.5 h-3.5" /> Block
                            </button>
                          )}
                        </>
                      )}
                      {!(user.userType === "admin" && user.isPrimaryAdmin) && (
                        <button
                          onClick={() => confirmDelete(user)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="text-xs text-slate-500">
                    Showing {(pagination.page - 1) * pagination.limit + 1}–
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => fetchUsers(pagination.page - 1, searchQuery, activeFilter)}
                      disabled={pagination.page <= 1}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      let pageNum: number;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => fetchUsers(pageNum, searchQuery, activeFilter)}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                            pagination.page === pageNum
                              ? "bg-[#173247] text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => fetchUsers(pagination.page + 1, searchQuery, activeFilter)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedUser(null);
        }}
      />

      {/* Loading overlay for detail */}
      {detailOpen && detailLoading && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" />
          <Loader2 className="relative z-10 w-8 h-8 animate-spin text-white" />
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmError || confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        confirmColor={confirmDialog.confirmColor}
        onConfirm={executeConfirm}
        onCancel={() => {
          setConfirmDialog({ open: false, title: "", message: "", confirmLabel: "", confirmColor: "", action: null });
          setConfirmError("");
          setBlockReason("");
        }}
        loading={confirmLoading}
        showReasonInput={confirmDialog.showReasonInput}
        reason={blockReason}
        onReasonChange={setBlockReason}
      />
    </div>
  );
}

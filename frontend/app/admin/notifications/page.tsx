"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Bell, Loader2, Send, Settings2, XCircle } from "lucide-react";

type AutomationSettings = {
  globalAutomationEnabled: boolean;
  categories: { lostFound: boolean; groupTracker: boolean; tripPlanner: boolean };
  tripReminders: { sevenDays: boolean; oneDay: boolean; tripDay: boolean };
};

type HistoryItem = {
  _id: string;
  title: string;
  message: string;
  category: string;
  source: string;
  status: string;
  recipientScope: string;
  recipientCount: number;
  createdAt: string;
  scheduledAt?: string;
};
type SupabaseNotification = { id: string; title: string; message: string; created_at: string };
type NotificationOverview = { total: number; today: number; unread: number; automated: number; manual: number; scheduled: number };

const DEFAULT_SETTINGS: AutomationSettings = {
  globalAutomationEnabled: true,
  categories: { lostFound: true, groupTracker: true, tripPlanner: true },
  tripReminders: { sevenDays: true, oneDay: true, tripDay: true },
};

const CATEGORY_LABELS: [keyof AutomationSettings["categories"], string][] = [
  ["lostFound", "Lost & Found"],
  ["groupTracker", "Group Tracker"],
  ["tripPlanner", "Trip Planner"],
];

const REMINDER_LABELS: [keyof AutomationSettings["tripReminders"], string][] = [
  ["sevenDays", "7 days before"],
  ["oneDay", "1 day before"],
  ["tripDay", "Trip day"],
];

const supabase = createClient();

function toDateTimeLocalValue(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<SupabaseNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [centralError, setCentralError] = useState("");
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AutomationSettings>(DEFAULT_SETTINGS);
  const [overview, setOverview] = useState<NotificationOverview>({ total: 0, today: 0, unread: 0, automated: 0, manual: 0, scheduled: 0 });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minimumScheduledAt, setMinimumScheduledAt] = useState("");
  const [form, setForm] = useState({
    title: "",
    message: "",
    category: "general",
    recipientScope: "ALL",
    identityType: "platform",
    identityId: "",
    groupCode: "",
    scheduledAt: "",
    expiresAt: "",
  });

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from("notifications")
        .select("id, title, message, created_at")
        .order("created_at", { ascending: false });
      if (supabaseError) throw supabaseError;
      setNotifications((data || []) as SupabaseNotification[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load existing notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCentralDashboard = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const [overviewResponse, settingsResponse, historyResponse] = await Promise.all([
        fetch("/api/admin/notifications/overview", { headers, cache: "no-store" }),
        fetch("/api/admin/notifications/settings", { headers, cache: "no-store" }),
        fetch("/api/admin/notifications", { headers, cache: "no-store" }),
      ]);
      const [overviewData, settingsData, historyData] = await Promise.all([
        overviewResponse.json(), settingsResponse.json(), historyResponse.json(),
      ]);
      if (!overviewResponse.ok || !settingsResponse.ok || !historyResponse.ok) {
        throw new Error(overviewData.message || settingsData.message || historyData.message || "Admin authorization required");
      }
      setOverview(overviewData);
      setSettings(settingsData.settings);
      setHistory(historyData.notifications || []);
      setCentralError("");
    } catch (loadError) {
      console.error("Central notification dashboard failed to load:", loadError);
      setCentralError(loadError instanceof Error ? loadError.message : "Failed to load notification controls");
    }
  }, [getAuthHeaders]);

  const loadHistory = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (categoryFilter) params.set("category", categoryFilter);
      if (sourceFilter) params.set("source", sourceFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (fromDate) params.set("from", new Date(`${fromDate}T00:00:00`).toISOString());
      if (toDate) params.set("to", new Date(`${toDate}T23:59:59.999`).toISOString());
      const response = await fetch(`/api/admin/notifications?${params}`, { headers, cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load notification history");
      setHistory(data.notifications || []);
    } catch (loadError) {
      console.error("Notification history filter failed:", loadError);
      setCentralError(loadError instanceof Error ? loadError.message : "Failed to filter notification history");
    }
  }, [categoryFilter, fromDate, getAuthHeaders, sourceFilter, statusFilter, toDate]);

  useEffect(() => {
    void Promise.resolve().then(() => Promise.all([loadNotifications(), loadCentralDashboard()]));
  }, [loadCentralDashboard, loadNotifications]);

  useEffect(() => {
    void Promise.resolve().then(loadHistory);
  }, [loadHistory]);

  const saveSettings = async (next: AutomationSettings) => {
    setSettings(next);
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/admin/notifications/settings", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save automation settings");
      setSettings(data.settings);
      setCentralError("");
    } catch (saveError) {
      console.error("Notification setting update failed:", saveError);
      setCentralError(saveError instanceof Error ? saveError.message : "Failed to save automation settings");
      void loadCentralDashboard();
    } finally {
      setSaving(false);
    }
  };

  const sendNotification = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.scheduledAt) {
      const scheduledTime = new Date(form.scheduledAt).getTime();
      if (!Number.isFinite(scheduledTime) || scheduledTime <= Date.now() + 60_000) {
        setCentralError("Choose a schedule time at least one minute in the future.");
        return;
      }
    }
    if (!window.confirm("Create this notification for the selected recipients?")) return;
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const scheduledAt = form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null;
      const expiresAt = form.expiresAt ? new Date(form.expiresAt).toISOString() : null;
      const body = {
        ...form,
        scheduledAt,
        expiresAt,
        referenceId: form.recipientScope === "GROUP" ? form.groupCode : undefined,
        referenceType: form.recipientScope === "GROUP" ? "group" : undefined,
      };
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create notification");
      setCentralError(`Notification created for ${data.createdCount} eligible recipient(s).`);
      setForm((current) => ({ ...current, title: "", message: "", scheduledAt: "", expiresAt: "" }));
      await Promise.all([loadCentralDashboard(), loadHistory()]);
    } catch (sendError) {
      console.error("Manual notification creation failed:", sendError);
      setCentralError(sendError instanceof Error ? sendError.message : "Failed to create notification");
    } finally {
      setSaving(false);
    }
  };

  const cancelScheduled = async (id: string) => {
    if (!window.confirm("Cancel this scheduled notification for all recipients?")) return;
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/notifications/${id}/cancel`, { method: "PATCH", headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to cancel notification");
      await Promise.all([loadCentralDashboard(), loadHistory()]);
    } catch (cancelError) {
      console.error("Scheduled notification cancellation failed:", cancelError);
      setCentralError(cancelError instanceof Error ? cancelError.message : "Failed to cancel notification");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-orange-600">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-6">
      <div className="flex items-center gap-3">
        <Bell className="h-7 w-7 text-orange-600" />
        <h1 className="text-3xl font-bold text-[#173247]">Admin Notifications</h1>
      </div>

      <section className="space-y-5 rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-orange-600" />
          <h2 className="text-xl font-serif font-bold text-[#173247]">Automated Notification Control</h2>
        </div>
        {centralError && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{centralError}</p>}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            ["Total notifications", overview.total],
            ["Sent today", overview.today],
            ["Unread", overview.unread],
            ["Automated", overview.automated],
            ["Manual", overview.manual],
            ["Scheduled", overview.scheduled],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#e1cfb0] bg-white p-3">
              <p className="text-xs font-semibold text-[#667883]">{label}</p>
              <p className="mt-1 text-2xl font-bold text-[#173247]">{value}</p>
            </div>
          ))}
        </div>

        <label className="flex items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <span>
            <span className="block font-bold text-[#173247]">Automated Notifications</span>
            <span className="text-xs text-[#667883]">Global automation switch</span>
          </span>
          <input
            type="checkbox"
            checked={settings.globalAutomationEnabled}
            disabled={saving}
            onChange={(event) => void saveSettings({ ...settings, globalAutomationEnabled: event.target.checked })}
            className="h-5 w-5 accent-orange-600"
          />
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="font-bold text-[#173247]">Notification categories</h3>
            {CATEGORY_LABELS.map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-xl border border-[#e1cfb0] bg-white px-4 py-3 text-sm">
                {label}
                <input
                  type="checkbox"
                  checked={settings.categories[key]}
                  disabled={saving}
                  onChange={(event) => void saveSettings({ ...settings, categories: { ...settings.categories, [key]: event.target.checked } })}
                  className="h-5 w-5 accent-orange-600"
                />
              </label>
            ))}
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-[#173247]">Trip reminders</h3>
            {REMINDER_LABELS.map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-xl border border-[#e1cfb0] bg-white px-4 py-3 text-sm">
                {label}
                <input
                  type="checkbox"
                  checked={settings.tripReminders[key]}
                  disabled={saving}
                  onChange={(event) => void saveSettings({ ...settings, tripReminders: { ...settings.tripReminders, [key]: event.target.checked } })}
                  className="h-5 w-5 accent-orange-600"
                />
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-5 shadow-sm">
        <h2 className="text-xl font-serif font-bold text-[#173247]">Create / Schedule Notification</h2>
        <form onSubmit={sendNotification} className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-semibold text-[#334b5a]">
            Title
            <input required maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full rounded-lg border border-[#d8c4a3] bg-white px-3 py-2" />
          </label>
          <label className="space-y-1 text-sm font-semibold text-[#334b5a]">
            Category
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="w-full rounded-lg border border-[#d8c4a3] bg-white px-3 py-2">
              <option value="general">General</option>
              <option value="lost_found">Lost &amp; Found</option>
              <option value="group_tracker">Group Tracker</option>
              <option value="trip_planner">Trip Planner</option>
            </select>
          </label>
          <label className="space-y-1 text-sm font-semibold text-[#334b5a] sm:col-span-2">
            Message
            <textarea required maxLength={5000} rows={3} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="w-full rounded-lg border border-[#d8c4a3] bg-white px-3 py-2" />
          </label>
          <label className="space-y-1 text-sm font-semibold text-[#334b5a]">
            Recipient scope
            <select value={form.recipientScope} onChange={(event) => setForm({ ...form, recipientScope: event.target.value })} className="w-full rounded-lg border border-[#d8c4a3] bg-white px-3 py-2">
              <option value="ALL">All eligible users</option>
              <option value="CATEGORY">Eligible users in selected category</option>
              <option value="USER">Specific user</option>
              <option value="GROUP">Specific group</option>
            </select>
          </label>
          {form.recipientScope === "USER" && (
            <div className="flex gap-2">
              <select value={form.identityType} onChange={(event) => setForm({ ...form, identityType: event.target.value })} className="rounded-lg border border-[#d8c4a3] bg-white px-2 py-2 text-sm">
                <option value="platform">Platform user</option>
                <option value="app_user">Trip Planner user</option>
              </select>
              <input required placeholder="MongoDB user ID" value={form.identityId} onChange={(event) => setForm({ ...form, identityId: event.target.value })} className="min-w-0 flex-1 rounded-lg border border-[#d8c4a3] bg-white px-3 py-2 text-sm" />
            </div>
          )}
          {form.recipientScope === "GROUP" && (
            <label className="space-y-1 text-sm font-semibold text-[#334b5a]">
              Group code
              <input required value={form.groupCode} onChange={(event) => setForm({ ...form, groupCode: event.target.value.toUpperCase() })} className="w-full rounded-lg border border-[#d8c4a3] bg-white px-3 py-2" />
            </label>
          )}
          <label className="space-y-1 text-sm font-semibold text-[#334b5a]">
            Schedule (optional)
            <input type="datetime-local" min={minimumScheduledAt} onFocus={() => setMinimumScheduledAt(toDateTimeLocalValue(new Date(Date.now() + 120_000)))} value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} className="w-full rounded-lg border border-[#d8c4a3] bg-white px-3 py-2" />
          </label>
          <label className="space-y-1 text-sm font-semibold text-[#334b5a]">
            Expiry (optional)
            <input type="datetime-local" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} className="w-full rounded-lg border border-[#d8c4a3] bg-white px-3 py-2" />
          </label>
          <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 font-bold text-white hover:bg-orange-700 disabled:opacity-50 sm:col-span-2">
            <Send className="h-4 w-4" /> {form.scheduledAt ? "Schedule notification" : "Send notification"}
          </button>
        </form>
      </section>

      <section className="space-y-4 rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-serif font-bold text-[#173247]">MongoDB Notification History</h2>
          <div className="flex flex-wrap gap-2">
            <select aria-label="Filter category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-lg border border-[#d8c4a3] bg-white px-2 py-1.5 text-xs">
              <option value="">All categories</option>
              {["lost_found", "group_tracker", "trip_planner", "general"].map((value) => <option key={value}>{value}</option>)}
            </select>
            <select aria-label="Filter source" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="rounded-lg border border-[#d8c4a3] bg-white px-2 py-1.5 text-xs">
              <option value="">All sources</option>
              {["AUTOMATED", "MANUAL", "SCHEDULED"].map((value) => <option key={value}>{value}</option>)}
            </select>
            <select aria-label="Filter status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-[#d8c4a3] bg-white px-2 py-1.5 text-xs">
              <option value="">All statuses</option>
              {["PENDING", "SENT", "CANCELLED", "FAILED"].map((value) => <option key={value}>{value}</option>)}
            </select>
            <input aria-label="History from date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="rounded-lg border border-[#d8c4a3] bg-white px-2 py-1.5 text-xs" />
            <input aria-label="History to date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="rounded-lg border border-[#d8c4a3] bg-white px-2 py-1.5 text-xs" />
          </div>
        </div>
        {history.length === 0 ? <p className="text-sm text-[#667883]">No MongoDB notifications match these filters.</p> : (
          <ul className="space-y-3">
            {history.map((item) => (
              <li key={item._id} className="rounded-xl border border-[#e1cfb0] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#173247]">{item.title}</h3>
                    <p className="mt-1 text-sm text-[#667883]">{item.message}</p>
                    <p className="mt-2 text-xs text-[#667883]">
                      {item.category} · {item.source} · {item.status} · {item.recipientScope} · {item.recipientCount} recipient(s)
                    </p>
                    <time className="mt-1 block text-xs text-[#8c6b43]">{new Date(item.scheduledAt || item.createdAt).toLocaleString()}</time>
                  </div>
                  {item.source === "SCHEDULED" && item.status === "PENDING" && (
                    <button type="button" onClick={() => void cancelScheduled(item._id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-50">
                      <XCircle className="h-4 w-4" /> Cancel
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[#173247]">Existing Supabase Notifications</h2>
        {error && <p className="mb-4 text-red-600">{error}</p>}
        {notifications.length === 0 ? (
          <p className="text-[#667883]">No notifications.</p>
        ) : (
          <ul className="space-y-4">
            {notifications.map((notification) => (
              <li key={notification.id} className="rounded-xl border border-[#e1cfb0] bg-[#fffdf8] p-4">
                <h3 className="font-semibold text-[#173247]">{notification.title}</h3>
                <p className="text-sm text-[#667883]">{notification.message}</p>
                <span className="mt-2 block text-xs text-[#667883]">
                  {new Date(notification.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

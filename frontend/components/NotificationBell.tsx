"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Settings2, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUserAuth } from "@/context/UserAuthContext";
import { enableWebPush, getPushDeviceDetails } from "@/lib/firebase/messaging";

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  category: string;
  createdAt: string;
  isRead: boolean;
};

type Preferences = { enabled: boolean; pushEnabled: boolean; categories: Record<string, boolean> };

const CATEGORY_LABELS = [
  ["lost_found", "Lost & Found"],
  ["group_tracker", "Group Tracker"],
  ["trip_planner", "Trip Planner"],
];
const supabase = createClient();

export default function NotificationBell() {
  const { isAuthenticated: isAppUser } = useUserAuth();
  const [platformToken, setPlatformToken] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [open, setOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [error, setError] = useState("");

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {};
    if (platformToken) headers.Authorization = `Bearer ${platformToken}`;
    return headers;
  }, [platformToken]);

  const load = useCallback(async () => {
    try {
      const [notificationsResponse, preferencesResponse] = await Promise.all([
        fetch("/api/notifications", { credentials: "include", headers: getHeaders(), cache: "no-store" }),
        fetch("/api/notifications/preferences", { credentials: "include", headers: getHeaders(), cache: "no-store" }),
      ]);
      if (notificationsResponse.status === 401 || preferencesResponse.status === 401) return;
      if (!notificationsResponse.ok || !preferencesResponse.ok) {
        throw new Error("Could not load notifications");
      }
      const data = await notificationsResponse.json();
      const preferenceData = await preferencesResponse.json();
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setRecipientId(data.recipientId || "");
      setPreferences({
        enabled: preferenceData.preferences.enabled,
        pushEnabled: preferenceData.preferences.pushEnabled === true,
        categories: preferenceData.preferences.categories instanceof Array
          ? Object.fromEntries(preferenceData.preferences.categories)
          : preferenceData.preferences.categories || {},
      });
      setError("");
    } catch (loadError) {
      console.error("Notification load failed:", loadError);
      setError("Notifications are temporarily unavailable.");
    }
  }, [getHeaders]);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setPlatformToken(data.session?.access_token || "");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setPlatformToken(session?.access_token || "");
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAppUser && !platformToken) return;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [isAppUser, platformToken, load]);

  useEffect(() => {
    if (!recipientId) return;
    const channel = supabase.channel(`notifications:${recipientId}`, {
      config: { broadcast: { self: false } },
    });
    channel.on("broadcast", { event: "NOTIFICATION_CREATED" }, ({ payload }) => {
      const notification = payload?.notification as NotificationItem | undefined;
      if (!notification) return;
      setItems((current) => [notification, ...current.filter((item) => item._id !== notification._id)].slice(0, 50));
      setUnreadCount((current) => current + (notification.isRead ? 0 : 1));
    }).subscribe((status) => {
      if (status === "SUBSCRIBED") void load();
    });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, recipientId]);

  const markRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH", credentials: "include", headers: getHeaders(),
      });
      if (!response.ok) throw new Error("Could not mark notification as read");
      setItems((current) => current.map((item) => item._id === id ? { ...item, isRead: true } : item));
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (markError) {
      console.error("Mark notification read failed:", markError);
      setError("Could not update the notification.");
    }
  };

  const markAllRead = async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH", credentials: "include", headers: getHeaders(),
      });
      if (!response.ok) throw new Error("Could not mark notifications as read");
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (markError) {
      console.error("Mark all notifications read failed:", markError);
      setError("Could not update notifications.");
    }
  };

  const savePreferences = async (updated: Preferences) => {
    const previous = preferences;
    setPreferences(updated);
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        credentials: "include",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!response.ok) throw new Error("Could not save notification preferences");
      setError("");
      return true;
    } catch (saveError) {
      console.error("Notification preferences save failed:", saveError);
      setPreferences(previous);
      setError("Could not save notification preferences.");
      return false;
    }
  };

  const setPushEnabled = async (enabled: boolean) => {
    setPushBusy(true);
    setError("");
    const updated = { ...(preferences || { enabled: true, pushEnabled: false, categories: {} }), pushEnabled: enabled };
    try {
      if (enabled) {
        const token = await enableWebPush();
        const { browser, deviceId } = getPushDeviceDetails();
        const response = await fetch("/api/notifications/push/register", {
          method: "POST",
          credentials: "include",
          headers: { ...getHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ token, platform: "web", browser, deviceId }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Could not register this device for push notifications.");
        if (!(await savePreferences(updated))) {
          await fetch("/api/notifications/push/devices", {
            method: "DELETE",
            credentials: "include",
            headers: getHeaders(),
          });
        }
      } else {
        const response = await fetch("/api/notifications/push/devices", {
          method: "DELETE",
          credentials: "include",
          headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Could not disable push notifications for this account.");
        await savePreferences(updated);
      }
    } catch (pushError) {
      console.error("Push notification preference update failed:", pushError);
      setError(pushError instanceof Error ? pushError.message : "Could not update push notifications.");
    } finally {
      setPushBusy(false);
    }
  };

  if (!isAppUser && !platformToken) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-full p-2 text-[#e86f18] transition-colors hover:bg-[#fff1e6] hover:text-[#c9580f]"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-4 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-[4.5rem] z-[60] max-h-[calc(100dvh-5.5rem)] overflow-y-auto rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] shadow-2xl md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:max-h-[calc(100dvh-6rem)] md:w-[min(24rem,calc(100vw-2rem))]">
          <div className="flex items-center justify-between border-b border-[#e1cfb0] p-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#173247]">Notifications</h2>
              <p className="text-xs text-[#667883]">{unreadCount} unread</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => { setShowPreferences((value) => !value); }} className="rounded-lg p-2 text-[#667883] hover:bg-orange-50" aria-label="Notification preferences">
                <Settings2 className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-[#667883] hover:bg-orange-50" aria-label="Close notifications">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showPreferences ? (
            <div className="space-y-3 p-4">
              <h3 className="text-sm font-bold text-[#173247]">Notification preferences</h3>
              <label className="flex items-center justify-between gap-3 text-sm text-[#334b5a]">
                <span>All notifications</span>
                <input
                  type="checkbox"
                  checked={preferences?.enabled ?? true}
                  onChange={(event) => void savePreferences({ ...(preferences || { enabled: true, pushEnabled: false, categories: {} }), enabled: event.target.checked })}
                />
              </label>
              {CATEGORY_LABELS.map(([key, label]) => (
                <label key={key} className="flex items-center justify-between gap-3 text-sm text-[#334b5a]">
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={preferences?.categories[key] !== false}
                    onChange={(event) => void savePreferences({
                      ...(preferences || { enabled: true, pushEnabled: false, categories: {} }),
                      categories: { ...(preferences?.categories || {}), [key]: event.target.checked },
                    })}
                  />
                </label>
              ))}
              <div className="border-t border-[#e1cfb0]/70 pt-3">
                <label className="flex items-center justify-between gap-3 text-sm font-semibold text-[#334b5a]">
                  <span>Push notifications</span>
                  <input
                    type="checkbox"
                    checked={preferences?.pushEnabled ?? false}
                    disabled={pushBusy}
                    onChange={(event) => void setPushEnabled(event.target.checked)}
                  />
                </label>
                <p className="mt-1 text-xs leading-relaxed text-[#667883]">
                  Receive notifications on this browser when Discover Nashik is in the background.
                </p>
              </div>
              {error && <p role="status" className="text-xs text-red-700">{error}</p>}
            </div>
          ) : (
            <>
              {unreadCount > 0 && (
                <button type="button" onClick={() => void markAllRead()} className="flex w-full items-center justify-center gap-2 border-b border-[#e1cfb0]/70 py-2 text-xs font-bold text-orange-700 hover:bg-orange-50">
                  <CheckCheck className="h-4 w-4" /> Mark all as read
                </button>
              )}
              {error && <p role="status" className="px-4 pt-3 text-xs text-red-700">{error}</p>}
              <div className="max-h-[min(60vh,28rem)] overflow-y-auto">
                {items.length === 0 ? (
                  <p className="p-6 text-center text-sm text-[#667883]">You’re all caught up.</p>
                ) : items.map((item) => (
                  <article key={item._id} className={`border-b border-[#e1cfb0]/60 p-4 ${item.isRead ? "" : "bg-orange-50/60"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[#173247]">{item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-[#526572]">{item.message}</p>
                        <p className="mt-2 text-[11px] text-[#8c6b43]">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                      {!item.isRead && (
                        <button type="button" onClick={() => void markRead(item._id)} className="shrink-0 rounded-lg p-2 text-orange-700 hover:bg-orange-100" aria-label="Mark as read">
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

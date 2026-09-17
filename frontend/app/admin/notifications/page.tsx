"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";

export default function AdminNotificationsPage() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications() {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, message, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setNotifications(data as any[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-orange-600">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-3xl font-bold text-[#173247] mb-4">Admin Notifications</h1>
      {error && <p className="mb-4 text-red-600">{error}</p>}
      {notifications.length === 0 ? (
        <p className="text-[#667883]">No notifications.</p>
      ) : (
        <ul className="space-y-4">
          {notifications.map((n) => (
            <li key={n.id} className="rounded-xl border border-[#e1cfb0] bg-[#fffdf8] p-4">
              <h3 className="font-semibold text-[#173247]">{n.title}</h3>
              <p className="text-sm text-[#667883]">{n.message}</p>
              <span className="mt-2 block text-xs text-[#667883]">
                {new Date(n.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

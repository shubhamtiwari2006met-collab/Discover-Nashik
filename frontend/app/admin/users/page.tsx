"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Trash2 } from "lucide-react";

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadUsers() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, role, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setUsers(data as any[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user? This action cannot be undone.")) return;
    setActionLoading(id);
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
      setUsers((cur) => cur.filter((u) => u.id !== id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => {
    void loadUsers();
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
      <h1 className="text-3xl font-bold text-[#173247] mb-4">User Management</h1>
      {error && <p className="mb-4 text-red-600">{error}</p>}
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-[#fffdf8]">
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2 text-left">Joined</th>
            <th className="p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-[#d8c4a3]">
              <td className="p-2">{u.email}</td>
              <td className="p-2 capitalize">{u.role?.toLowerCase()}</td>
              <td className="p-2 text-sm text-[#667883]">{new Date(u.created_at).toLocaleDateString()}</td>
              <td className="p-2 text-center">
                <button
                  onClick={() => deleteUser(u.id)}
                  disabled={actionLoading === u.id}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  {actionLoading === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

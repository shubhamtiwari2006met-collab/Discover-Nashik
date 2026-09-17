"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Plus, Edit, Trash2, MapPin, Bus, CalendarDays, CheckCircle2, AlertCircle, X, Search, Eye, AlertTriangle } from "lucide-react";

// Types
interface ExistingPlace {
  _id: string;
  name: string;
  category: string;
  location: string;
  description: string;
  image?: string;
  latitude?: number;
  longitude?: number;
}

interface KumbhLocation {
  _id: string;
  name: string;
  category: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  image?: string;
  kumbhImportance?: string;
  instructions?: string;
  nearbyFacilities?: string;
  isPublished?: boolean;
  placeId?: ExistingPlace | string | null;
}

interface KumbhTransport {
  _id: string;
  title: string;
  category: string;
  description: string;
  routeOrDetails?: string;
  locationOrStation?: string;
  advisories?: string;
  image?: string;
  isPublished?: boolean;
}

interface KumbhEvent {
  _id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  location?: string;
  instructions?: string;
  status: "upcoming" | "completed";
  image?: string;
  isPublished?: boolean;
}

interface LostFoundReportAdmin {
  _id: string;
  reportId: string;
  reportType: "lost" | "found";
  category: string;
  title: string;
  description: string;
  photoUrl?: string;
  personDetails?: any;
  itemDetails?: any;
  location: any;
  reporterContact?: {
    name?: string;
    phone?: string;
    email?: string;
    userId?: string;
  };
  status: "pending" | "under_verification" | "published" | "resolved" | "rejected" | "closed";
  adminNotes?: string;
  reviewedBy?: string;
  createdAt: string;
}

type TabType = "locations" | "transport" | "events" | "lost-found";

function AdminKumbhContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const initialTab = (["locations", "transport", "events", "lost-found"] as TabType[]).includes(
    searchParams.get("tab") as TabType
  )
    ? (searchParams.get("tab") as TabType)
    : "locations";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Data lists
  const [locations, setLocations] = useState<KumbhLocation[]>([]);
  const [transports, setTransports] = useState<KumbhTransport[]>([]);
  const [events, setEvents] = useState<KumbhEvent[]>([]);
  const [existingPlaces, setExistingPlaces] = useState<ExistingPlace[]>([]);
  const [lostFoundReports, setLostFoundReports] = useState<LostFoundReportAdmin[]>([]);
  const [selectedLostFound, setSelectedLostFound] = useState<LostFoundReportAdmin | null>(null);
  const [reportInquiries, setReportInquiries] = useState<any[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  // Modals state
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ id: string; title: string; type: TabType } | null>(null);

  // Forms data
  const [locationForm, setLocationForm] = useState({
    name: "",
    placeId: "",
    category: "Ghat",
    description: "",
    address: "",
    latitude: "",
    longitude: "",
    image: "",
    kumbhImportance: "",
    instructions: "",
    nearbyFacilities: "",
    isPublished: true,
  });

  const [transportForm, setTransportForm] = useState({
    title: "",
    category: "Bus",
    description: "",
    routeOrDetails: "",
    locationOrStation: "",
    advisories: "",
    image: "",
    isPublished: true,
  });

  const [eventForm, setEventForm] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    description: "",
    location: "",
    instructions: "",
    status: "upcoming" as "upcoming" | "completed",
    image: "",
    isPublished: true,
  });

  // Load Session Token helper
  async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  // Load All Data from backend APIs
  async function loadAllData() {
    setLoading(true);
    setError("");
    try {
      const headers = await getAuthHeaders();
      const [locRes, transRes, evtRes, placeRes] = await Promise.all([
        fetch("/api/kumbh/locations?admin=true"),
        fetch("/api/kumbh/transport?admin=true"),
        fetch("/api/kumbh/events?admin=true"),
        fetch("/api/places"),
      ]);

      if (locRes.ok) setLocations(await locRes.json());
      if (transRes.ok) setTransports(await transRes.json());
      if (evtRes.ok) setEvents(await evtRes.json());
      if (placeRes.ok) setExistingPlaces(await placeRes.json());

      // Load Lost & Found reports – try admin endpoint first, fallback to public
      let lfLoaded = false;
      try {
        const lfRes = await fetch("/api/kumbh/lost-found/admin/all", { headers });
        if (lfRes.ok) {
          const lfData = await lfRes.json();
          setLostFoundReports(Array.isArray(lfData) ? lfData : []);
          lfLoaded = true;
        }
      } catch (adminErr) {
        console.warn("Admin LF endpoint failed, trying public endpoint...", adminErr);
      }

      // Fallback: fetch from public endpoint
      if (!lfLoaded) {
        try {
          const publicRes = await fetch("/api/kumbh/lost-found");
          if (publicRes.ok) {
            const publicData = await publicRes.json();
            const reports = publicData.reports || publicData;
            setLostFoundReports(Array.isArray(reports) ? reports : []);
          }
        } catch (pubErr) {
          console.warn("Public LF endpoint also failed:", pubErr);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load Kumbh management data");
    } finally {
      setLoading(false);
    }
  }

  // Update Lost & Found Status (Publish, Reject, Resolve)
  async function handleUpdateLostFoundStatus(id: string, status: string, notes?: string) {
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/kumbh/lost-found/admin/${id}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status, adminNotes: notes || "" }),
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch(e) {}
      if (!res.ok) throw new Error(data.message || `Failed to update report status: ${res.status}`);

      setSuccess(`Report status updated to '${status}' successfully!`);
      if (selectedLostFound && selectedLostFound._id === id) {
        setSelectedLostFound({ ...selectedLostFound, status: status as any, adminNotes: notes || "" });
      }
      await loadAllData();
    } catch (err: any) {
      setError(err.message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  }

  // Delete Lost & Found Report permanently (Admin only)
  async function handleDeleteLostFoundReport(id: string) {
    if (!confirm("Are you sure you want to permanently delete this Lost & Found report? This cannot be undone.")) return;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/kumbh/lost-found/admin/reports/${id}`, {
        method: "DELETE",
        headers,
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch(e) {}
      if (!res.ok) throw new Error(data.message || `Failed to delete report: ${res.status}`);

      setSuccess("Lost & Found report deleted successfully!");
      if (selectedLostFound && (selectedLostFound._id === id || selectedLostFound.reportId === id)) {
        setSelectedLostFound(null);
      }
      setLostFoundReports((current) => current.filter((r) => r._id !== id && r.reportId !== id));
      await loadAllData();
    } catch (err: any) {
      setError(err.message || "Delete failed.");
    } finally {
      setActionLoading(false);
    }
  }

  // View Submitted Inquiries for a Report
  async function handleFetchInquiries(reportId: string) {
    setLoadingInquiries(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/kumbh/lost-found/admin/${reportId}/inquiries`, { headers });
      if (res.ok) {
        setReportInquiries(await res.json());
      }
    } catch (err) {
      console.error("Failed to load inquiries:", err);
    } finally {
      setLoadingInquiries(false);
    }
  }

  // Delete / Moderate Inquiry for a Report
  async function handleDeleteInquiry(inquiryId: string, reportId: string) {
    if (!confirm("Are you sure you want to remove this community inquiry?")) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/kumbh/lost-found/admin/inquiries/${inquiryId}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setSuccess("Inquiry removed successfully!");
        handleFetchInquiries(reportId);
      } else {
        const text = await res.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch(e) {}
        setError(data.message || `Failed to remove inquiry: ${res.status}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to remove inquiry.");
    }
  }

  useEffect(() => {
    void loadAllData();
  }, []);

  // When selecting an existing place in Location Form
  const handleSelectExistingPlace = (placeId: string) => {
    if (!placeId) {
      setLocationForm((prev) => ({ ...prev, placeId: "" }));
      return;
    }
    const found = existingPlaces.find((p) => p._id === placeId);
    if (found) {
      setLocationForm((prev) => ({
        ...prev,
        placeId: found._id,
        name: prev.name || found.name,
        category: prev.category || (["Ghat", "Temple", "Parking", "Medical/Help", "Emergency"].includes(found.category) ? found.category : "Temple"),
        description: prev.description || found.description,
        address: prev.address || found.location,
        image: prev.image || found.image || "",
        latitude: prev.latitude || (found.latitude ? String(found.latitude) : ""),
        longitude: prev.longitude || (found.longitude ? String(found.longitude) : ""),
      }));
    }
  };

  // -------------------------------------------------------------
  // LOCATION HANDLERS
  // -------------------------------------------------------------
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationForm.name.trim()) {
      setError("Location name is required");
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const headers = await getAuthHeaders();
      const payload = {
        name: locationForm.name.trim(),
        placeId: locationForm.placeId || null,
        category: locationForm.category,
        description: locationForm.description,
        address: locationForm.address,
        latitude: locationForm.latitude ? parseFloat(locationForm.latitude) : null,
        longitude: locationForm.longitude ? parseFloat(locationForm.longitude) : null,
        image: locationForm.image,
        kumbhImportance: locationForm.kumbhImportance,
        instructions: locationForm.instructions,
        nearbyFacilities: locationForm.nearbyFacilities,
        isPublished: locationForm.isPublished,
      };

      const url = modalMode === "add" ? "/api/kumbh/locations" : `/api/kumbh/locations/${selectedItem._id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to save location");

      setSuccess(`Kumbh location ${modalMode === "add" ? "added" : "updated"} successfully!`);
      setModalMode(null);
      await loadAllData();
    } catch (err: any) {
      setError(err.message || "Action failed. Make sure you are logged in as Admin.");
    } finally {
      setActionLoading(false);
    }
  };

  const executeDeleteLocation = async (id: string) => {
    setActionLoading(true);
    setError("");
    setDeleteConfirmItem(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/kumbh/locations/${id}`, { method: "DELETE", headers });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete location");
      }
      setSuccess("Location deleted successfully!");
      await loadAllData();
    } catch (err: any) {
      setError(err.message || "Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // TRANSPORT HANDLERS
  // -------------------------------------------------------------
  const handleSaveTransport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transportForm.title.trim() || !transportForm.description.trim()) {
      setError("Title and description are required");
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const headers = await getAuthHeaders();
      const url = modalMode === "add" ? "/api/kumbh/transport" : `/api/kumbh/transport/${selectedItem._id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const res = await fetch(url, { method, headers, body: JSON.stringify(transportForm) });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to save transport entry");

      setSuccess(`Transport entry ${modalMode === "add" ? "added" : "updated"} successfully!`);
      setModalMode(null);
      await loadAllData();
    } catch (err: any) {
      setError(err.message || "Action failed. Make sure you are logged in as Admin.");
    } finally {
      setActionLoading(false);
    }
  };

  const executeDeleteTransport = async (id: string) => {
    setActionLoading(true);
    setError("");
    setDeleteConfirmItem(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/kumbh/transport/${id}`, { method: "DELETE", headers });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete transport entry");
      }
      setSuccess("Transport entry deleted successfully!");
      await loadAllData();
    } catch (err: any) {
      setError(err.message || "Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // EVENT HANDLERS
  // -------------------------------------------------------------
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !eventForm.date) {
      setError("Event title and date are required");
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const headers = await getAuthHeaders();
      const url = modalMode === "add" ? "/api/kumbh/events" : `/api/kumbh/events/${selectedItem._id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const res = await fetch(url, { method, headers, body: JSON.stringify(eventForm) });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to save event");

      setSuccess(`Kumbh event ${modalMode === "add" ? "added" : "updated"} successfully!`);
      setModalMode(null);
      await loadAllData();
    } catch (err: any) {
      setError(err.message || "Action failed. Make sure you are logged in as Admin.");
    } finally {
      setActionLoading(false);
    }
  };

  const executeDeleteEvent = async (id: string) => {
    setActionLoading(true);
    setError("");
    setDeleteConfirmItem(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/kumbh/events/${id}`, { method: "DELETE", headers });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete event");
      }
      setSuccess("Event deleted successfully!");
      await loadAllData();
    } catch (err: any) {
      setError(err.message || "Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to open Add Modal
  const openAddModal = () => {
    setSelectedItem(null);
    setError("");
    if (activeTab === "locations") {
      setLocationForm({
        name: "",
        placeId: "",
        category: "Ghat",
        description: "",
        address: "",
        latitude: "",
        longitude: "",
        image: "",
        kumbhImportance: "",
        instructions: "",
        nearbyFacilities: "",
        isPublished: true,
      });
    } else if (activeTab === "transport") {
      setTransportForm({
        title: "",
        category: "Bus",
        description: "",
        routeOrDetails: "",
        locationOrStation: "",
        advisories: "",
        image: "",
        isPublished: true,
      });
    } else if (activeTab === "events") {
      setEventForm({
        title: "",
        date: new Date().toISOString().split("T")[0],
        startTime: "",
        endTime: "",
        description: "",
        location: "",
        instructions: "",
        status: "upcoming",
        image: "",
        isPublished: true,
      });
    }
    setModalMode("add");
  };

  // Helper to open Edit Modal
  const openEditModal = (item: any) => {
    setSelectedItem(item);
    setError("");
    if (activeTab === "locations") {
      setLocationForm({
        name: item.name || "",
        placeId: item.placeId?._id || item.placeId || "",
        category: item.category || "Ghat",
        description: item.description || "",
        address: item.address || "",
        latitude: item.latitude ? String(item.latitude) : "",
        longitude: item.longitude ? String(item.longitude) : "",
        image: item.image || "",
        kumbhImportance: item.kumbhImportance || "",
        instructions: item.instructions || "",
        nearbyFacilities: item.nearbyFacilities || "",
        isPublished: item.isPublished !== undefined ? item.isPublished : true,
      });
    } else if (activeTab === "transport") {
      setTransportForm({
        title: item.title || "",
        category: item.category || "Bus",
        description: item.description || "",
        routeOrDetails: item.routeOrDetails || "",
        locationOrStation: item.locationOrStation || "",
        advisories: item.advisories || "",
        image: item.image || "",
        isPublished: item.isPublished !== undefined ? item.isPublished : true,
      });
    } else if (activeTab === "events") {
      setEventForm({
        title: item.title || "",
        date: item.date ? new Date(item.date).toISOString().split("T")[0] : "",
        startTime: item.startTime || "",
        endTime: item.endTime || "",
        description: item.description || "",
        location: item.location || "",
        instructions: item.instructions || "",
        status: item.status || "upcoming",
        image: item.image || "",
        isPublished: item.isPublished !== undefined ? item.isPublished : true,
      });
    }
    setModalMode("edit");
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[#e86f18]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-3 font-semibold text-[#173247]">Loading Kumbh Management...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-2">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#173247]">Kumbh Mela 2027 Management</h1>
          <p className="mt-1 text-[#667883]">Add, edit, and publish verified information for Kumbh 2027 visitors.</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e86f18] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#c9580f] transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add New {activeTab === "locations" ? "Location" : activeTab === "transport" ? "Transport Option" : "Event / Date"}
        </button>
      </div>

      {error && <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700 border border-red-200">{error}</div>}
      {success && <div className="mb-6 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700 border border-emerald-200">{success}</div>}

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-[#e1cfb0] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("locations")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all cursor-pointer ${
            activeTab === "locations" ? "bg-[#e86f18] text-white shadow-sm" : "bg-[#fffdf8] text-[#667883] hover:bg-orange-50"
          }`}
        >
          <MapPin className="h-4 w-4" /> Important Locations ({locations.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("transport")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all cursor-pointer ${
            activeTab === "transport" ? "bg-[#e86f18] text-white shadow-sm" : "bg-[#fffdf8] text-[#667883] hover:bg-orange-50"
          }`}
        >
          <Bus className="h-4 w-4" /> Getting Around ({transports.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("events")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all cursor-pointer ${
            activeTab === "events" ? "bg-[#e86f18] text-white shadow-sm" : "bg-[#fffdf8] text-[#667883] hover:bg-orange-50"
          }`}
        >
          <CalendarDays className="h-4 w-4" /> Dates & Planning ({events.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("lost-found")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all cursor-pointer ${
            activeTab === "lost-found" ? "bg-[#e86f18] text-white shadow-sm" : "bg-[#fffdf8] text-[#667883] hover:bg-orange-50"
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-amber-300" /> Lost & Found Moderation ({lostFoundReports.length})
        </button>
      </div>

      {/* TAB 1: LOCATIONS TABLE / GRID */}
      {activeTab === "locations" && (
        <div className="grid gap-6 md:grid-cols-2">
          {locations.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-[#d8c4a3] bg-[#fffdf8] p-12 text-center text-[#667883]">
              No Kumbh locations added yet. Click &quot;Add New Location&quot; to get started.
            </div>
          ) : (
            locations.map((loc) => (
              <article key={loc._id} className="rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-4 border-b border-[#e1cfb0] pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#173247]">{loc.name}</h3>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-800">
                          {loc.category}
                        </span>
                        {loc.placeId && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                            Linked Place
                          </span>
                        )}
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${loc.isPublished !== false ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                          {loc.isPublished !== false ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(loc)}
                        className="rounded-lg p-2 text-slate-600 hover:bg-orange-100 hover:text-orange-700 cursor-pointer"
                        title="Edit Location"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmItem({ id: loc._id, title: loc.name, type: "locations" })}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-100 cursor-pointer"
                        title="Delete Location"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-[#667883]">
                    {loc.address && <p><span className="font-semibold text-[#173247]">Address:</span> {loc.address}</p>}
                    {loc.description && <p><span className="font-semibold text-[#173247]">Description:</span> {loc.description}</p>}
                    {loc.kumbhImportance && (
                      <p className="rounded-lg bg-orange-50 p-2 text-orange-950 border border-orange-100">
                        <span className="font-bold text-orange-800">Kumbh Importance:</span> {loc.kumbhImportance}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* TAB 2: TRANSPORT TABLE / GRID */}
      {activeTab === "transport" && (
        <div className="grid gap-6 md:grid-cols-2">
          {transports.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-[#d8c4a3] bg-[#fffdf8] p-12 text-center text-[#667883]">
              No transport entries added yet. Click &quot;Add New Transport Option&quot; to get started.
            </div>
          ) : (
            transports.map((t) => (
              <article key={t._id} className="rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-4 border-b border-[#e1cfb0] pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#173247]">{t.title}</h3>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800">
                          {t.category}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${t.isPublished !== false ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                          {t.isPublished !== false ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(t)}
                        className="rounded-lg p-2 text-slate-600 hover:bg-orange-100 hover:text-orange-700 cursor-pointer"
                        title="Edit Transport Info"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmItem({ id: t._id, title: t.title, type: "transport" })}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-100 cursor-pointer"
                        title="Delete Transport Info"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-[#667883]">
                    <p><span className="font-semibold text-[#173247]">Details:</span> {t.description}</p>
                    {t.routeOrDetails && <p><span className="font-semibold text-[#173247]">Route/Schedule:</span> {t.routeOrDetails}</p>}
                    {t.advisories && <p className="text-red-700 font-medium"><span className="font-bold">Advisory:</span> {t.advisories}</p>}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* TAB 3: EVENTS TABLE / GRID */}
      {activeTab === "events" && (
        <div className="grid gap-6 md:grid-cols-2">
          {events.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-[#d8c4a3] bg-[#fffdf8] p-12 text-center text-[#667883]">
              No events added yet. Click &quot;Add New Event / Date&quot; to get started.
            </div>
          ) : (
            events.map((evt) => (
              <article key={evt._id} className="rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-4 border-b border-[#e1cfb0] pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#173247]">{evt.title}</h3>
                      <p className="text-xs font-bold text-[#e86f18]">
                        {new Date(evt.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {evt.startTime ? ` • ${evt.startTime}` : ""}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${evt.status === "completed" ? "bg-slate-200 text-slate-700" : "bg-orange-100 text-orange-800"}`}>
                          {evt.status}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${evt.isPublished !== false ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                          {evt.isPublished !== false ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(evt)}
                        className="rounded-lg p-2 text-slate-600 hover:bg-orange-100 hover:text-orange-700 cursor-pointer"
                        title="Edit Event"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmItem({ id: evt._id, title: evt.title, type: "events" })}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-100 cursor-pointer"
                        title="Delete Event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-[#667883]">
                    {evt.location && <p><span className="font-semibold text-[#173247]">Location:</span> {evt.location}</p>}
                    {evt.description && <p><span className="font-semibold text-[#173247]">Description:</span> {evt.description}</p>}
                    {evt.instructions && <p className="text-amber-800 font-medium"><span className="font-bold">Instructions:</span> {evt.instructions}</p>}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* TAB 4: LOST & FOUND MODERATION */}
      {activeTab === "lost-found" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lostFoundReports.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-[#d8c4a3] bg-[#fffdf8] p-12 text-center text-[#667883]">
                No Lost & Found reports submitted yet.
              </div>
            ) : (
              lostFoundReports.map((report) => (
                <article
                  key={report._id}
                  className="rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 border-b border-[#e1cfb0] pb-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            {report.reportId}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                              report.status === "published"
                                ? "bg-emerald-100 text-emerald-800"
                                : report.status === "resolved"
                                ? "bg-blue-100 text-blue-800"
                                : report.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {report.status}
                          </span>
                        </div>
                        <h3 className="mt-2 text-base font-bold text-[#173247] line-clamp-1">{report.title}</h3>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-[#667883]">
                      <p><span className="font-semibold text-[#173247]">Category:</span> {report.category}</p>
                      <p><span className="font-semibold text-[#173247]">Location:</span> {report.location?.areaName}</p>
                      <p className="line-clamp-2"><span className="font-semibold text-[#173247]">Details:</span> {report.description}</p>

                      {report.reporterContact && (
                        <div className="mt-2 rounded-xl bg-slate-100 p-2.5 text-[11px] text-slate-800 border border-slate-200">
                          <p className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1">🔒 Private Reporter Info:</p>
                          <p><strong>Name:</strong> {report.reporterContact.name || "N/A"}</p>
                          <p><strong>Phone:</strong> {report.reporterContact.phone || "N/A"}</p>
                          <p><strong>Email:</strong> {report.reporterContact.email || "N/A"}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-[#eee2cc] pt-3 flex flex-wrap gap-2">
                    {report.status !== "published" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateLostFoundStatus(report._id, "published")}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        Publish
                      </button>
                    )}
                    {report.status !== "resolved" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateLostFoundStatus(report._id, "resolved")}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {report.status !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateLostFoundStatus(report._id, "rejected")}
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
                      >
                        Reject
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteLostFoundReport(report._id)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"
                    >
                      Delete Report
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLostFound(report);
                        handleFetchInquiries(report._id);
                      }}
                      className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-800 hover:bg-orange-100"
                    >
                      View Details & Inquiries
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-7 w-7 flex-shrink-0" />
              <h3 className="text-xl font-bold text-[#173247]">Confirm Delete</h3>
            </div>
            <p className="mt-3 text-sm text-[#667883]">
              Are you sure you want to delete <strong className="text-[#173247]">&quot;{deleteConfirmItem.title}&quot;</strong>? This action will permanently remove it from MongoDB and the public site.
            </p>

            <div className="mt-6 flex justify-end gap-3 border-t border-[#e1cfb0] pt-4">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="rounded-xl border border-[#d8c4a3] px-4 py-2 text-xs font-bold text-[#667883] hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  if (deleteConfirmItem.type === "locations") executeDeleteLocation(deleteConfirmItem.id);
                  else if (deleteConfirmItem.type === "transport") executeDeleteTransport(deleteConfirmItem.id);
                  else if (deleteConfirmItem.type === "events") executeDeleteEvent(deleteConfirmItem.id);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {actionLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT FORM MODAL */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e1cfb0] pb-4">
              <h2 className="text-xl font-bold text-[#173247]">
                {modalMode === "add" ? "Add New" : "Edit"}{" "}
                {activeTab === "locations" ? "Kumbh Location" : activeTab === "transport" ? "Transport Option" : "Kumbh Event / Date"}
              </h2>
              <button onClick={() => setModalMode(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* LOCATION FORM */}
            {activeTab === "locations" && (
              <form onSubmit={handleSaveLocation} className="mt-5 space-y-4 text-sm text-[#173247]">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">
                    Select Existing Discover Nashik Place (Optional)
                  </label>
                  <select
                    value={locationForm.placeId}
                    onChange={(e) => handleSelectExistingPlace(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                  >
                    <option value="">-- Standalone Kumbh Location (None) --</option>
                    {existingPlaces.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Location Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Ram Kund Bathing Ghat"
                      value={locationForm.name}
                      onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Category *</label>
                    <select
                      value={locationForm.category}
                      onChange={(e) => setLocationForm({ ...locationForm, category: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                    >
                      {["Ghat", "Temple", "Parking", "Medical/Help", "Entry/Exit", "Emergency", "Other"].map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Address / Location Details</label>
                  <input
                    type="text"
                    placeholder="e.g. Panchavati, Nashik"
                    value={locationForm.address}
                    onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Latitude (Optional)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="20.0063"
                      value={locationForm.latitude}
                      onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Longitude (Optional)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="73.7915"
                      value={locationForm.longitude}
                      onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Description</label>
                  <textarea
                    rows={2}
                    placeholder="General description of the place..."
                    value={locationForm.description}
                    onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Why Important During Kumbh 2027</label>
                  <textarea
                    rows={2}
                    placeholder="Why this location is critical during Kumbh..."
                    value={locationForm.kumbhImportance}
                    onChange={(e) => setLocationForm({ ...locationForm, kumbhImportance: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Kumbh Instructions</label>
                    <input
                      type="text"
                      placeholder="Crowd rules, entry gates..."
                      value={locationForm.instructions}
                      onChange={(e) => setLocationForm({ ...locationForm, instructions: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Nearby Facilities</label>
                    <input
                      type="text"
                      placeholder="Medical, water, toilets..."
                      value={locationForm.nearbyFacilities}
                      onChange={(e) => setLocationForm({ ...locationForm, nearbyFacilities: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Photo URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={locationForm.image}
                    onChange={(e) => setLocationForm({ ...locationForm, image: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="loc-published"
                    checked={locationForm.isPublished}
                    onChange={(e) => setLocationForm({ ...locationForm, isPublished: e.target.checked })}
                    className="h-4 w-4 rounded border-[#d8c4a3] text-[#e86f18] focus:ring-[#e86f18]"
                  />
                  <label htmlFor="loc-published" className="text-xs font-bold text-[#173247] cursor-pointer">
                    Publish location on public website immediately
                  </label>
                </div>

                <div className="flex justify-end gap-3 border-t border-[#e1cfb0] pt-4">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="rounded-xl border border-[#d8c4a3] px-4 py-2 text-xs font-bold text-[#667883]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex items-center gap-2 rounded-xl bg-[#e86f18] px-5 py-2 text-xs font-bold text-white hover:bg-[#c9580f] disabled:opacity-60"
                  >
                    {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {actionLoading ? "Saving..." : "Save Location"}
                  </button>
                </div>
              </form>
            )}

            {/* TRANSPORT FORM */}
            {activeTab === "transport" && (
              <form onSubmit={handleSaveTransport} className="mt-5 space-y-4 text-sm text-[#173247]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Title *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Special Shuttle Bus Service"
                      value={transportForm.title}
                      onChange={(e) => setTransportForm({ ...transportForm, title: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Category *</label>
                    <select
                      value={transportForm.category}
                      onChange={(e) => setTransportForm({ ...transportForm, category: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                    >
                      {["Bus", "Railway", "Shuttle", "Parking", "Walking Route", "Traffic Advisory", "Transport Point", "Other"].map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Description *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe the transport service or advisory..."
                    value={transportForm.description}
                    onChange={(e) => setTransportForm({ ...transportForm, description: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Route / Schedule Details</label>
                  <input
                    type="text"
                    placeholder="e.g. Tapovan Parking to Panchavati every 5 mins"
                    value={transportForm.routeOrDetails}
                    onChange={(e) => setTransportForm({ ...transportForm, routeOrDetails: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Location / Station Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Nashik Road Railway Station"
                    value={transportForm.locationOrStation}
                    onChange={(e) => setTransportForm({ ...transportForm, locationOrStation: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Public Advisories / Safety Rules</label>
                  <input
                    type="text"
                    placeholder="e.g. No private vehicles permitted after 6 AM"
                    value={transportForm.advisories}
                    onChange={(e) => setTransportForm({ ...transportForm, advisories: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={transportForm.image}
                    onChange={(e) => setTransportForm({ ...transportForm, image: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="trans-published"
                    checked={transportForm.isPublished}
                    onChange={(e) => setTransportForm({ ...transportForm, isPublished: e.target.checked })}
                    className="h-4 w-4 rounded border-[#d8c4a3] text-[#e86f18] focus:ring-[#e86f18]"
                  />
                  <label htmlFor="trans-published" className="text-xs font-bold text-[#173247] cursor-pointer">
                    Publish transport info on public website immediately
                  </label>
                </div>

                <div className="flex justify-end gap-3 border-t border-[#e1cfb0] pt-4">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="rounded-xl border border-[#d8c4a3] px-4 py-2 text-xs font-bold text-[#667883]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex items-center gap-2 rounded-xl bg-[#e86f18] px-5 py-2 text-xs font-bold text-white hover:bg-[#c9580f] disabled:opacity-60"
                  >
                    {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {actionLoading ? "Saving..." : "Save Transport Info"}
                  </button>
                </div>
              </form>
            )}

            {/* EVENT FORM */}
            {activeTab === "events" && (
              <form onSubmit={handleSaveEvent} className="mt-5 space-y-4 text-sm text-[#173247]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Event / Occasion Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. First Shahi Snan"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Date *</label>
                    <input
                      required
                      type="date"
                      value={eventForm.date}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Start Time (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 06:00 AM"
                      value={eventForm.startTime}
                      onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">End Time (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 12:00 PM"
                      value={eventForm.endTime}
                      onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Status</label>
                    <select
                      value={eventForm.status}
                      onChange={(e) => setEventForm({ ...eventForm, status: e.target.value as "upcoming" | "completed" })}
                      className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Ram Kund, Panchavati"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Overview of the event..."
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Important Instructions</label>
                  <input
                    type="text"
                    placeholder="Viewing area access, guidelines..."
                    value={eventForm.instructions}
                    onChange={(e) => setEventForm({ ...eventForm, instructions: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#667883]">Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={eventForm.image}
                    onChange={(e) => setEventForm({ ...eventForm, image: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 outline-none focus:border-[#e86f18]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="evt-published"
                    checked={eventForm.isPublished}
                    onChange={(e) => setEventForm({ ...eventForm, isPublished: e.target.checked })}
                    className="h-4 w-4 rounded border-[#d8c4a3] text-[#e86f18] focus:ring-[#e86f18]"
                  />
                  <label htmlFor="evt-published" className="text-xs font-bold text-[#173247] cursor-pointer">
                    Publish event on public website immediately
                  </label>
                </div>

                <div className="flex justify-end gap-3 border-t border-[#e1cfb0] pt-4">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="rounded-xl border border-[#d8c4a3] px-4 py-2 text-xs font-bold text-[#667883]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex items-center gap-2 rounded-xl bg-[#e86f18] px-5 py-2 text-xs font-bold text-white hover:bg-[#c9580f] disabled:opacity-60"
                  >
                    {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {actionLoading ? "Saving..." : "Save Event"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* LOST & FOUND ADMIN DETAILS MODAL */}
      {selectedLostFound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl my-8 rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-[#e1cfb0] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded-md">
                    {selectedLostFound.reportId}
                  </span>
                  <span className="text-xs font-bold uppercase text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full">
                    {selectedLostFound.category}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-[#173247] mt-1">{selectedLostFound.title}</h2>
              </div>
              <button
                onClick={() => setSelectedLostFound(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedLostFound.photoUrl && (
              <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden border border-slate-200">
                <img src={selectedLostFound.photoUrl} alt="Report Photo" className="h-full w-full object-cover" />
              </div>
            )}

            <div className="space-y-3 text-xs text-slate-700">
              <p><strong>Description:</strong> {selectedLostFound.description}</p>
              <p><strong>Location:</strong> {selectedLostFound.location?.areaName} {selectedLostFound.location?.landmark ? `(${selectedLostFound.location.landmark})` : ""}</p>
              <p><strong>Incident Date/Time:</strong> {selectedLostFound.location?.incidentDate} {selectedLostFound.location?.incidentTime}</p>
              <p><strong>Current Status:</strong> <span className="font-extrabold uppercase text-orange-700">{selectedLostFound.status}</span></p>
            </div>

            {/* Private Reporter Contact Box */}
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-950 space-y-1">
              <h3 className="font-bold uppercase tracking-wider text-amber-900 border-b border-amber-200 pb-1 mb-2">
                🔒 Private Reporter Contact Information (Admin Only)
              </h3>
              <p><strong>Reporter Name:</strong> {selectedLostFound.reporterContact?.name || "N/A"}</p>
              <p><strong>Phone Number:</strong> {selectedLostFound.reporterContact?.phone || "N/A"}</p>
              <p><strong>Email:</strong> {selectedLostFound.reporterContact?.email || "N/A"}</p>
              <p><strong>User ID:</strong> {selectedLostFound.reporterContact?.userId || "Guest"}</p>
            </div>

            {/* Submitted Inquiries List */}
            <div className="border-t border-[#eee2cc] pt-4">
              <h3 className="text-sm font-bold text-[#173247] mb-3">Submitted Community Inquiries & Sightings</h3>
              {loadingInquiries ? (
                <div className="flex items-center gap-2 text-xs text-orange-600">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading inquiries...
                </div>
              ) : reportInquiries.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No community inquiries submitted for this report yet.</p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {reportInquiries.map((inq) => (
                    <div key={inq._id} className="rounded-xl border border-slate-200 bg-white p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{inq.inquiryType}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{new Date(inq.createdAt).toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteInquiry(inq._id, selectedLostFound._id)}
                            className="rounded bg-red-50 p-1 text-red-600 hover:bg-red-100 hover:text-red-700"
                            title="Remove / Moderate Inquiry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-700">{inq.message}</p>
                      {inq.reporterContact && (
                        <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          From: {inq.reporterContact.name} ({inq.reporterContact.phone || "No Phone"})
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e1cfb0] pt-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateLostFoundStatus(selectedLostFound._id, "published")}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Approve & Publish
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateLostFoundStatus(selectedLostFound._id, "resolved")}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Mark Resolved
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateLostFoundStatus(selectedLostFound._id, "rejected")}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
                >
                  Reject Report
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteLostFoundReport(selectedLostFound._id)}
                  className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                >
                  Delete Report
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLostFound(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminKumbhPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center text-[#e86f18]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <AdminKumbhContent />
    </Suspense>
  );
}


"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Settings,
  Shield,
  Bell,
  Sliders,
  Calendar,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  Phone,
  Globe,
  Radio,
  UserCheck,
  Server,
  Eye,
  EyeOff,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type TabType = "general" | "kumbh" | "notifications" | "profile";

function AdminSettingsContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTabFromQuery = searchParams.get("tab") as TabType;
  const [activeTab, setActiveTab] = useState<TabType>(
    ["general", "kumbh", "notifications", "profile"].includes(activeTabFromQuery)
      ? activeTabFromQuery
      : "general"
  );

  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType;
    if (tabParam && ["general", "kumbh", "notifications", "profile"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Loading & Feedback States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Admin profile data
  const [adminUser, setAdminUser] = useState<{ id?: string; email?: string; name?: string; role?: string } | null>(null);

  // Form State - General Settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "Discover Nashik",
    siteTagline: "The Official Spiritual & Tourism Portal of Nashik",
    supportEmail: "discover.nashik15@gmail.com",
    supportPhone: "+91 9767173376",
    maintenanceMode: false,
    autoApproveBusinesses: false,
    publicLostFoundAllowed: true,
    defaultLanguage: "English",
  });

  // Form State - Kumbh Mela Settings
  const [kumbhSettings, setKumbhSettings] = useState({
    crowdAlertsEnabled: true,
    emergencyHotline: "108 / 112",
    autoPublishLostFound: false,
    shuttleStatusActive: true,
    maxGroupTrackerLimit: "50",
    specialAnnouncements: "Kumbh Mela 2027 preparation underway. All visitors register early!",
  });

  // Form State - Notification Preferences
  const [notificationSettings, setNotificationSettings] = useState({
    emailOnNewBusiness: true,
    emailOnEmergencyLostFound: true,
    dailySummaryDigest: false,
    browserSoundAlerts: true,
    notifyOnNewAdmin: true,
  });

  // Form State - Change Password
  const [passwordState, setPasswordState] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  // Load Settings from LocalStorage & Supabase Auth on Mount
  useEffect(() => {
    async function init() {
      try {
        // Load admin profile
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, email, role")
            .eq("id", session.user.id)
            .maybeSingle();

          setAdminUser({
            id: session.user.id,
            email: session.user.email || profile?.email || "admin@discovernashik.com",
            name: profile?.name || session.user.email?.split("@")[0] || "System Admin",
            role: profile?.role || "Admin",
          });
        }

        // Restore persisted settings if available
        const savedGen = localStorage.getItem("dn_admin_general_settings");
        if (savedGen) setGeneralSettings((prev) => ({ ...prev, ...JSON.parse(savedGen) }));

        const savedKumbh = localStorage.getItem("dn_admin_kumbh_settings");
        if (savedKumbh) setKumbhSettings((prev) => ({ ...prev, ...JSON.parse(savedKumbh) }));

        const savedNotif = localStorage.getItem("dn_admin_notif_settings");
        if (savedNotif) setNotificationSettings((prev) => ({ ...prev, ...JSON.parse(savedNotif) }));

      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSuccessMsg("");
    setErrorMsg("");
    router.replace(`/admin/settings?tab=${tab}`);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      // Save settings to LocalStorage
      localStorage.setItem("dn_admin_general_settings", JSON.stringify(generalSettings));
      localStorage.setItem("dn_admin_kumbh_settings", JSON.stringify(kumbhSettings));
      localStorage.setItem("dn_admin_notif_settings", JSON.stringify(notificationSettings));

      // Simulate API network latency
      await new Promise((resolve) => setTimeout(resolve, 600));

      setSuccessMsg("Settings updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (!confirm("Are you sure you want to reset all settings to system defaults?")) return;
    localStorage.removeItem("dn_admin_general_settings");
    localStorage.removeItem("dn_admin_kumbh_settings");
    localStorage.removeItem("dn_admin_notif_settings");

    setGeneralSettings({
      siteName: "Discover Nashik",
      siteTagline: "The Official Spiritual & Tourism Portal of Nashik",
      supportEmail: "support@discovernashik.com",
      supportPhone: "+91 253 2500100",
      maintenanceMode: false,
      autoApproveBusinesses: false,
      publicLostFoundAllowed: true,
      defaultLanguage: "English",
    });

    setKumbhSettings({
      crowdAlertsEnabled: true,
      emergencyHotline: "108 / 112",
      autoPublishLostFound: false,
      shuttleStatusActive: true,
      maxGroupTrackerLimit: "50",
      specialAnnouncements: "Kumbh Mela 2027 preparation underway. All visitors register early!",
    });

    setNotificationSettings({
      emailOnNewBusiness: true,
      emailOnEmergencyLostFound: true,
      dailySummaryDigest: false,
      browserSoundAlerts: true,
      notifyOnNewAdmin: true,
    });

    setSuccessMsg("All settings have been reset to default values.");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!passwordState.newPassword || !passwordState.confirmPassword) {
      setErrorMsg("Please provide both new password and confirmation.");
      return;
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      setErrorMsg("New password and confirm password do not match.");
      return;
    }
    if (passwordState.newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }

    setPasswordUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordState.newPassword,
      });

      if (error) throw error;

      setSuccessMsg("Password updated successfully!");
      setPasswordState({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password.");
    } finally {
      setPasswordUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-[#e86f18]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-4">
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#e1cfb0] pb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#173247] flex items-center gap-2">
            <Settings className="h-8 w-8 text-[#e86f18]" />
            Admin Settings
          </h1>
          <p className="mt-1 text-sm text-[#667883]">
            Configure platform parameters, Kumbh Mela 2027 settings, notifications, and security preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 rounded-xl border border-[#d8c4a3] bg-white px-3.5 py-2 text-xs font-bold text-[#173247] hover:bg-orange-50 transition-all shadow-sm"
          >
            <RotateCcw className="h-4 w-4 text-[#e86f18]" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Banner Alerts */}
      {successMsg && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-semibold text-emerald-800 shadow-sm animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm font-semibold text-red-800 shadow-sm animate-fadeIn">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Navigation Header */}
      <div className="mb-8 flex overflow-x-auto rounded-2xl border border-[#d8c4a3] bg-[#fffdf8] p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => handleTabChange("general")}
          className={`flex flex-1 min-w-[130px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${activeTab === "general"
            ? "bg-[#e86f18] text-white shadow-md"
            : "text-[#667883] hover:bg-orange-50 hover:text-[#e86f18]"
            }`}
        >
          <Sliders className="h-4 w-4" />
          <span>General</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("kumbh")}
          className={`flex flex-1 min-w-[150px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${activeTab === "kumbh"
            ? "bg-[#e86f18] text-white shadow-md"
            : "text-[#667883] hover:bg-orange-50 hover:text-[#e86f18]"
            }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Kumbh 2027</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("notifications")}
          className={`flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${activeTab === "notifications"
            ? "bg-[#e86f18] text-white shadow-md"
            : "text-[#667883] hover:bg-orange-50 hover:text-[#e86f18]"
            }`}
        >
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("profile")}
          className={`flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${activeTab === "profile"
            ? "bg-[#e86f18] text-white shadow-md"
            : "text-[#667883] hover:bg-orange-50 hover:text-[#e86f18]"
            }`}
        >
          <Shield className="h-4 w-4" />
          <span>Profile & Security</span>
        </button>
      </div>

      {/* Main Settings Form Container */}
      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* TAB 1: GENERAL SETTINGS */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#173247] mb-1 flex items-center gap-2">
                <Globe className="h-5 w-5 text-[#e86f18]" />
                Site Identity & Support Info
              </h2>
              <p className="text-xs text-[#667883] mb-6">
                Configure primary branding and customer support contacts displayed across the website.
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#173247] mb-2">
                    Portal Name
                  </label>
                  <input
                    type="text"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                    className="w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-2.5 text-sm text-[#173247] focus:border-[#e86f18] focus:outline-none focus:ring-2 focus:ring-[#e86f18]/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#173247] mb-2">
                    Default Portal Language
                  </label>
                  <select
                    value={generalSettings.defaultLanguage}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, defaultLanguage: e.target.value })}
                    className="w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-2.5 text-sm text-[#173247] focus:border-[#e86f18] focus:outline-none focus:ring-2 focus:ring-[#e86f18]/20"
                  >
                    <option value="English">English</option>
                    <option value="Marathi">Marathi (मराठी)</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#173247] mb-2">
                    Portal Tagline / Mantra
                  </label>
                  <input
                    type="text"
                    value={generalSettings.siteTagline}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteTagline: e.target.value })}
                    className="w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-2.5 text-sm text-[#173247] focus:border-[#e86f18] focus:outline-none focus:ring-2 focus:ring-[#e86f18]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#173247] mb-2">
                    Official Support Email
                  </label>
                  <div className="flex items-center rounded-xl border border-[#d8c4a3] bg-white px-3 py-2 text-sm">
                    <Mail className="h-4 w-4 text-[#e86f18] mr-2 shrink-0" />
                    <input
                      type="email"
                      value={generalSettings.supportEmail}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
                      className="w-full bg-transparent outline-none text-[#173247]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#173247] mb-2">
                    Helpline / Support Phone
                  </label>
                  <div className="flex items-center rounded-xl border border-[#d8c4a3] bg-white px-3 py-2 text-sm">
                    <Phone className="h-4 w-4 text-[#e86f18] mr-2 shrink-0" />
                    <input
                      type="text"
                      value={generalSettings.supportPhone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, supportPhone: e.target.value })}
                      className="w-full bg-transparent outline-none text-[#173247]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* System Control Toggles */}
            <div className="rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#173247] mb-1 flex items-center gap-2">
                <Server className="h-5 w-5 text-[#e86f18]" />
                Platform Automation & Controls
              </h2>
              <p className="text-xs text-[#667883] mb-6">
                Manage operational toggles for business moderation and public portal availability.
              </p>

              <div className="space-y-4 divide-y divide-[#eee2cc]">
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#173247]">Maintenance Mode</h3>
                    <p className="text-xs text-[#667883]">
                      Temporarily display a maintenance screen to non-admin visitors.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generalSettings.maintenanceMode}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, maintenanceMode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e86f18]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#173247]">Auto-Approve Business Listings</h3>
                    <p className="text-xs text-[#667883]">
                      Automatically publish submitted business registrations without manual admin review.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generalSettings.autoApproveBusinesses}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, autoApproveBusinesses: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e86f18]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#173247]">Allow Public Lost & Found Submissions</h3>
                    <p className="text-xs text-[#667883]">
                      Enable pilgrims and tourists to submit missing items and lost persons reports directly.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generalSettings.publicLostFoundAllowed}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, publicLostFoundAllowed: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e86f18]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KUMBH MELA 2027 SETTINGS */}
        {activeTab === "kumbh" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#173247] mb-1 flex items-center gap-2">
                <Radio className="h-5 w-5 text-[#e86f18]" />
                Kumbh Mela 2027 Operations & Alerts
              </h2>
              <p className="text-xs text-[#667883] mb-6">
                Configure live broadcast channels, emergency hotline routing, and visitor group tracking.
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#173247] mb-2">
                    Kumbh Emergency Hotline
                  </label>
                  <input
                    type="text"
                    value={kumbhSettings.emergencyHotline}
                    onChange={(e) => setKumbhSettings({ ...kumbhSettings, emergencyHotline: e.target.value })}
                    className="w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-2.5 text-sm text-[#173247] focus:border-[#e86f18] focus:outline-none focus:ring-2 focus:ring-[#e86f18]/20"
                    placeholder="e.g. 108 / 112"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#173247] mb-2">
                    Max Group Tracker Members
                  </label>
                  <input
                    type="number"
                    value={kumbhSettings.maxGroupTrackerLimit}
                    onChange={(e) => setKumbhSettings({ ...kumbhSettings, maxGroupTrackerLimit: e.target.value })}
                    className="w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-2.5 text-sm text-[#173247] focus:border-[#e86f18] focus:outline-none focus:ring-2 focus:ring-[#e86f18]/20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#173247] mb-2">
                    Banner Announcement text
                  </label>
                  <textarea
                    rows={3}
                    value={kumbhSettings.specialAnnouncements}
                    onChange={(e) => setKumbhSettings({ ...kumbhSettings, specialAnnouncements: e.target.value })}
                    className="w-full rounded-xl border border-[#d8c4a3] bg-white p-4 text-sm text-[#173247] focus:border-[#e86f18] focus:outline-none focus:ring-2 focus:ring-[#e86f18]/20"
                    placeholder="Global announcement displayed at the top of the Kumbh Mela portal..."
                  />
                </div>
              </div>

              <div className="mt-6 space-y-4 border-t border-[#eee2cc] pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#173247]">Live Crowd Alerts System</h3>
                    <p className="text-xs text-[#667883]">
                      Enable real-time density alerts and route advisories for Ghats and Akharas.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kumbhSettings.crowdAlertsEnabled}
                      onChange={(e) => setKumbhSettings({ ...kumbhSettings, crowdAlertsEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e86f18]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#173247]">Shuttle & Transport Tracker</h3>
                    <p className="text-xs text-[#667883]">
                      Show live electric shuttle schedules and parking hub availability.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kumbhSettings.shuttleStatusActive}
                      onChange={(e) => setKumbhSettings({ ...kumbhSettings, shuttleStatusActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e86f18]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#173247] mb-1 flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#e86f18]" />
              Email & System Alerts
            </h2>
            <p className="text-xs text-[#667883] mb-6">
              Choose when and how admins receive notifications for system events.
            </p>

            <div className="space-y-4 divide-y divide-[#eee2cc]">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h3 className="text-sm font-bold text-[#173247]">New Business Application Email</h3>
                  <p className="text-xs text-[#667883]">
                    Receive instant email notifications when a business submits a registration request.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailOnNewBusiness}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailOnNewBusiness: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e86f18]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <h3 className="text-sm font-bold text-[#173247]">Emergency Lost Person / Found Alerts</h3>
                  <p className="text-xs text-[#667883]">
                    High priority email alerts for urgent lost child or vulnerable missing person reports.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailOnEmergencyLostFound}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailOnEmergencyLostFound: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e86f18]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <h3 className="text-sm font-bold text-[#173247]">Daily Admin Summary Digest</h3>
                  <p className="text-xs text-[#667883]">
                    Receive a consolidated daily email summarizing visitor stats and pending reviews.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.dailySummaryDigest}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, dailySummaryDigest: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e86f18]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <h3 className="text-sm font-bold text-[#173247]">Dashboard Sound Notifications</h3>
                  <p className="text-xs text-[#667883]">
                    Play audible chime when new notifications land while dashboard is open.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.browserSoundAlerts}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, browserSoundAlerts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e86f18]"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE & SECURITY */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Profile Info */}
            <div className="rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#173247] mb-1 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#e86f18]" />
                Admin Account Details
              </h2>
              <p className="text-xs text-[#667883] mb-6">
                Active administrator credentials and session identity.
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-[#d8c4a3] bg-white p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#667883] block mb-1">
                    Full Name / Alias
                  </span>
                  <p className="text-base font-bold text-[#173247]">
                    {adminUser?.name || "System Admin"}
                  </p>
                </div>

                <div className="rounded-xl border border-[#d8c4a3] bg-white p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#667883] block mb-1">
                    Email Address
                  </span>
                  <p className="text-base font-bold text-[#173247]">
                    {adminUser?.email || "admin@discovernashik.com"}
                  </p>
                </div>

                <div className="rounded-xl border border-[#d8c4a3] bg-white p-4 md:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#667883] block mb-1">
                    Role & Permissions
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="inline-block rounded-full bg-[#e86f18] px-3 py-1 text-xs font-bold text-white uppercase">
                      {adminUser?.role || "Administrator"}
                    </span>
                    <span className="text-xs text-[#667883]">
                      Full Administrative Access to Business Registrations, Kumbh Mela, and User Accounts.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password Form */}
            <div className="rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#173247] mb-1 flex items-center gap-2">
                <Lock className="h-5 w-5 text-[#e86f18]" />
                Change Password
              </h2>
              <p className="text-xs text-[#667883] mb-6">
                Update your admin account security credentials.
              </p>

              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#173247] mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordState.newPassword}
                      onChange={(e) => setPasswordState({ ...passwordState, newPassword: e.target.value })}
                      className="w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-2.5 pr-10 text-sm text-[#173247] focus:border-[#e86f18] focus:outline-none focus:ring-2 focus:ring-[#e86f18]/20"
                      placeholder="Minimum 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#173247] mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordState.confirmPassword}
                    onChange={(e) => setPasswordState({ ...passwordState, confirmPassword: e.target.value })}
                    className="w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-2.5 text-sm text-[#173247] focus:border-[#e86f18] focus:outline-none focus:ring-2 focus:ring-[#e86f18]/20"
                    placeholder="Re-enter new password"
                  />
                </div>

                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={passwordUpdating}
                  className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#173247] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#254964] disabled:opacity-60 transition-all"
                >
                  {passwordUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  <span>Update Password</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Save Button Bar */}
        {activeTab !== "profile" && (
          <div className="flex items-center justify-end gap-3 border-t border-[#e1cfb0] pt-6">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#e86f18] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#c9580f] active:scale-95 disabled:opacity-60 transition-all"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save Settings</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center text-[#e86f18]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <AdminSettingsContent />
    </Suspense>
  );
}


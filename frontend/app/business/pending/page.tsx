"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock, FileText, LogOut, Building2, CheckCircle2, XCircle, Loader2, Calendar, MessageSquare, MapPin, Tag } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useTranslation } from "@/lib/i18n";

type RegistrationRecord = {
  id: string;
  business_name: string;
  category: string;
  subcategory?: string;
  city_area?: string;
  verification_status: "not_submitted" | "pending" | "approved" | "rejected" | "deactivated";
  rejection_reason?: string;
  admin_remarks?: string;
  created_at?: string;
  updated_at?: string;
};

export default function BusinessPendingPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [reg, setReg] = useState<RegistrationRecord | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.replace("/login?role=business");
        return;
      }

      setUserName(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "");
      setUserEmail(session.user.email || "");

      const { data: registration } = await supabase
        .from("business_registrations")
        .select("*")
        .eq("owner_id", session.user.id)
        .maybeSingle();

      if (registration?.verification_status === "approved") {
        window.location.replace("/business/dashboard");
        return;
      }

      setReg(registration || null);
      setLoading(false);
    })();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-[#e86f18]">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  const status = reg?.verification_status || "not_submitted";
  const remarks = reg?.admin_remarks || reg?.rejection_reason;

  const statusConfig = {
    not_submitted: {
      icon: <FileText className="h-7 w-7" />,
      badge: "bg-blue-100 text-blue-800 border-blue-200",
      title: t("Registration Not Submitted"),
      message: t("You have not submitted your business registration application yet."),
    },
    pending: {
      icon: <Clock className="h-7 w-7" />,
      badge: "bg-amber-100 text-amber-800 border-amber-200",
      title: t("Application Pending Review"),
      message: t("Your business application is under review by Nashik Admins."),
    },
    rejected: {
      icon: <XCircle className="h-7 w-7" />,
      badge: "bg-red-100 text-red-800 border-red-200",
      title: t("Application Rejected"),
      message: t("Your registration was reviewed and requires updates before approval."),
    },
    approved: {
      icon: <CheckCircle2 className="h-7 w-7" />,
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      title: t("Application Approved"),
      message: t("Your business registration is approved!"),
    },
    deactivated: {
      icon: <XCircle className="h-7 w-7" />,
      badge: "bg-gray-100 text-gray-800 border-gray-200",
      title: t("Account Deactivated"),
      message: t("Your business application is currently deactivated. Please contact support."),
    },
  }[status];

  const submissionDate = reg?.created_at
    ? new Date(reg.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      {/* Account Info Card */}
      <div className="mb-6 rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-[0_15px_40px_rgba(77,58,30,0.08)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1cfb0] pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-[#e86f18]">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#173247]">{t("Business Portal")}</h1>
              <p className="text-xs font-semibold text-[#667883]">{userEmail}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-xl border border-[#d8c4a3] bg-white px-4 py-2.5 text-xs font-bold text-[#667883] hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" /> {t("Sign Out")}
          </button>
        </div>

        {/* Application Status Banner */}
        <div className="mt-6 rounded-2xl border border-[#e1cfb0] bg-orange-50/50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm text-[#e86f18]">
              {statusConfig.icon}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-[#173247]">{statusConfig.title}</h2>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusConfig.badge}`}>
                  {t(status)}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#667883]">{statusConfig.message}</p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#e1cfb0] bg-white p-4">
            <span className="flex items-center gap-2 text-xs font-bold uppercase text-[#667883]">
              <Building2 className="h-4 w-4 text-[#e86f18]" /> {t("Business Name")}
            </span>
            <p className="mt-1 text-base font-bold text-[#173247]">
              {reg?.business_name || t("Not specified")}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e1cfb0] bg-white p-4">
            <span className="flex items-center gap-2 text-xs font-bold uppercase text-[#667883]">
              <Tag className="h-4 w-4 text-[#e86f18]" /> {t("Category")}
            </span>
            <p className="mt-1 text-base font-bold text-[#173247]">
              {reg?.category ? `${t(reg.category)}${reg.subcategory ? ` (${reg.subcategory})` : ''}` : t("Not selected")}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e1cfb0] bg-white p-4">
            <span className="flex items-center gap-2 text-xs font-bold uppercase text-[#667883]">
              <Calendar className="h-4 w-4 text-[#e86f18]" /> {t("Submission Date")}
            </span>
            <p className="mt-1 text-base font-bold text-[#173247]">
              {submissionDate || t("Not submitted yet")}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-4">
            <span className="flex items-center gap-2 text-xs font-bold uppercase text-[#667883]">
              <MapPin className="h-4 w-4 text-[#e86f18]" /> {t("Location")}
            </span>
            <p className="mt-1 text-base font-bold text-[#173247]">
              {reg?.city_area || t("Not provided")}
            </p>
          </div>
        </div>

        {/* Admin Remarks / Rejection Reason */}
        {remarks && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <span className="flex items-center gap-2 text-xs font-bold uppercase text-red-800">
              <MessageSquare className="h-4 w-4" /> {t("Admin Remarks")}
            </span>
            <p className="mt-2 text-sm font-semibold text-red-700">{remarks}</p>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="mt-8">
          <Link
            href="/business/register"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e86f18] px-6 py-4 text-sm font-bold text-white shadow-md transition-all hover:bg-[#c9580f]"
          >
            <FileText className="h-5 w-5" />
            {status === "not_submitted" ? t("Register Your Business") : t("Edit Business Profile")}
          </Link>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  Calendar,
  FileText,
  ArrowLeft,
  ChevronRight,
  MapPin,
  Lock,
  Mail,
  Phone
} from "lucide-react";
import { PRIVACY_POLICY } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: "Privacy Policy | Discover Nashik",
  description:
    "Official Privacy Policy for Discover Nashik - details regarding data collection, encryption, security commitments, and user rights under Indian data protection legislation.",
  openGraph: {
    title: "Privacy Policy | Discover Nashik",
    description:
      "Official Privacy Policy for Discover Nashik digital tourism and Kumbh Mela 2027 platform.",
    type: "website",
  },
};

export default function PrivacyPage() {
  const doc = PRIVACY_POLICY;

  return (
    <div className="min-h-screen bg-[#fffdf8] text-[#173247]">
      {/* Header Banner */}
      <div className="border-b border-[#e7b06d] bg-gradient-to-b from-[#fff7ed] via-[#fffdf8] to-[#fffdf8] pt-12 pb-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#e86f18] hover:text-[#c9580f] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Discover Nashik</span>
          </Link>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-orange-100 border border-orange-200 text-[#e86f18] shrink-0 mt-1">
              <Shield className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100/80 px-2.5 py-0.5 text-xs font-bold text-[#a45317]">
                  <Lock className="w-3 h-3" /> Data Protection Commitment
                </span>
                <span className="text-xs text-[#667883]">
                  Version {doc.version}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold font-serif text-[#173247] tracking-tight">
                {doc.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#667883]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#a45317]" />
                  Effective: {doc.lastUpdated}
                </span>
                <span>•</span>
                <Link
                  href="/terms"
                  className="font-semibold text-[#e86f18] hover:underline"
                >
                  View Terms &amp; Conditions →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Document Summary Box */}
        <div className="mb-10 rounded-2xl border border-orange-200 bg-orange-50/60 p-5 text-sm text-[#8a5323] leading-relaxed shadow-sm">
          <span className="font-bold text-[#173247] block text-base mb-1">
            Privacy Principles at Discover Nashik
          </span>
          <p>{doc.summary}</p>
        </div>

        {/* Section List */}
        <div className="space-y-10">
          {doc.sections.map((sec) => (
            <section
              key={sec.id}
              id={sec.id}
              className="scroll-mt-10 rounded-2xl border border-[#ecdcc3] bg-white p-6 sm:p-8 shadow-sm transition-all"
            >
              <h2 className="text-lg sm:text-xl font-bold font-serif text-[#173247] mb-4 flex items-center gap-3 pb-3 border-b border-[#f4e6d4]">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-[#e86f18] text-white text-xs font-mono font-bold shadow-sm shrink-0">
                  {sec.number}
                </span>
                <span>{sec.title}</span>
              </h2>

              {sec.content && sec.content.length > 0 && (
                <div className="space-y-3 text-sm sm:text-base text-[#334b5c] leading-relaxed">
                  {sec.content.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
              )}

              {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                <ul className="mt-4 space-y-2.5 text-sm sm:text-base text-[#334b5c]">
                  {sec.bulletPoints.map((bp, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <ChevronRight className="w-4 h-4 text-[#e86f18] shrink-0 mt-1" />
                      <span>{bp}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* Grievance Support Card */}
        <div className="mt-12 rounded-2xl border border-[#e7b06d] bg-gradient-to-br from-[#fff7ed] to-white p-6 sm:p-8 text-center shadow-md">
          <Lock className="w-8 h-8 text-[#e86f18] mx-auto mb-3" />
          <h3 className="text-xl font-bold font-serif text-[#173247] mb-2">
            Data Protection &amp; Grievance Redressal
          </h3>
          <p className="text-sm text-[#667883] max-w-lg mx-auto mb-5">
            To exercise your rights (access, correction, erasure) or report
            privacy grievances, reach out to our designated officer:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-semibold">
            <a
              href="mailto:discover.nashik15@gmail.com"
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#e7b06d] px-4 py-2.5 text-[#173247] hover:bg-orange-50 transition-colors shadow-sm"
            >
              <Mail className="w-4 h-4 text-[#e86f18]" />
              <span>discover.nashik15@gmail.com</span>
            </a>
            <a
              href="tel:+919767173376"
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#e7b06d] px-4 py-2.5 text-[#173247] hover:bg-orange-50 transition-colors shadow-sm"
            >
              <Phone className="w-4 h-4 text-[#e86f18]" />
              <span>+91 9767173376</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

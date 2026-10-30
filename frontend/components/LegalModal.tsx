"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  FileText,
  Shield,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Calendar,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import {
  TERMS_AND_CONDITIONS,
  PRIVACY_POLICY,
  LegalDocument
} from "@/lib/legalContent";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: "terms" | "privacy";
}

export function LegalModal({
  isOpen,
  onClose,
  initialDoc = "terms"
}: LegalModalProps) {
  const [activeDoc, setActiveDoc] = useState<"terms" | "privacy">(initialDoc);

  useEffect(() => {
    setActiveDoc(initialDoc);
  }, [initialDoc]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentDocument: LegalDocument =
    activeDoc === "terms" ? TERMS_AND_CONDITIONS : PRIVACY_POLICY;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-3 sm:p-5 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div
        className="relative flex flex-col w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl sm:rounded-3xl border border-[#e7b06d] bg-[#fffdf8] shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#f1d9b6] bg-gradient-to-r from-[#fff7ed] via-[#fffdf8] to-[#fff7ed] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-orange-100 border border-orange-200 text-[#e86f18] shrink-0">
              {activeDoc === "terms" ? (
                <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </div>
            <div>
              <h2
                id="legal-modal-title"
                className="text-lg sm:text-xl font-bold font-serif text-[#173247] leading-tight"
              >
                {currentDocument.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-[#667883] mt-0.5">
                <span className="font-semibold text-[#a45317]">
                  Version {currentDocument.version}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#a45317]" />
                  {currentDocument.lastUpdated}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#667883] hover:bg-orange-100 hover:text-[#c9580f] transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Document Switcher Tabs */}
        <div className="flex border-b border-[#f1d9b6] bg-[#fbf5eb] px-5 sm:px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveDoc("terms")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeDoc === "terms"
                ? "border-[#e86f18] text-[#e86f18] bg-[#fffdf8] rounded-t-lg"
                : "border-transparent text-[#667883] hover:text-[#173247]"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Terms &amp; Conditions</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDoc("privacy")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeDoc === "privacy"
                ? "border-[#e86f18] text-[#e86f18] bg-[#fffdf8] rounded-t-lg"
                : "border-transparent text-[#667883] hover:text-[#173247]"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6 text-[#173247] text-sm leading-relaxed">
          {/* Summary Box */}
          <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-3.5 sm:p-4 text-xs sm:text-sm text-[#8a5323] flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#e86f18] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#173247] block mb-0.5">
                Official Discover Nashik Document
              </span>
              <p>{currentDocument.summary}</p>
            </div>
          </div>

          {/* Document Sections */}
          <div className="space-y-6">
            {currentDocument.sections.map((sec) => (
              <section
                key={sec.id}
                id={sec.id}
                className="scroll-mt-6 border-b border-[#f4e6d4] pb-5 last:border-b-0 last:pb-0"
              >
                <h3 className="text-base sm:text-lg font-bold font-serif text-[#173247] mb-2 flex items-baseline gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fde9d7] text-[#c9580f] text-xs font-mono font-bold shrink-0">
                    {sec.number}
                  </span>
                  <span>{sec.title}</span>
                </h3>

                {sec.content && sec.content.length > 0 && (
                  <div className="space-y-2 text-xs sm:text-sm text-[#334b5c] pl-8">
                    {sec.content.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                )}

                {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                  <ul className="mt-2.5 space-y-2 text-xs sm:text-sm text-[#334b5c] pl-8">
                    {sec.bulletPoints.map((bp, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <ChevronRight className="w-3.5 h-3.5 text-[#e86f18] shrink-0 mt-1" />
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#f1d9b6] bg-[#fbf5eb] px-5 py-3.5 sm:px-6">
          <Link
            href={activeDoc === "terms" ? "/terms" : "/privacy"}
            target="_blank"
            className="text-xs font-bold text-[#e86f18] hover:text-[#c9580f] hover:underline flex items-center gap-1.5 transition-colors"
          >
            <span>Open in dedicated page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#e86f18] text-white font-bold text-xs sm:text-sm shadow-md hover:bg-[#c9580f] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>I Understand &amp; Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}

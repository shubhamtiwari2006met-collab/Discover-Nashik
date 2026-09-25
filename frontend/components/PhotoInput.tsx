"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import { Camera, Upload, Link as LinkIcon, X, Check, Image as ImageIcon, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export interface PhotoInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  className?: string;
  maxSizeMB?: number;
  placeholderUrl?: string;
}

export default function PhotoInput({
  value,
  onChange,
  label,
  description,
  className = "",
  maxSizeMB = 5,
  placeholderUrl = "https://images.unsplash.com/photo-..."
}: PhotoInputProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"camera" | "device" | "url">("camera");
  const [urlInput, setUrlInput] = useState<string>("");
  const [urlError, setUrlError] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const deviceInputRef = useRef<HTMLInputElement>(null);

  // Process File (Camera or Device) -> Canvas Compress -> Base64
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type.toLowerCase())) {
      alert(t("Please upload a valid image file (JPG, PNG, or WebP).") || "Please upload a valid image file (JPG, PNG, or WebP).");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Image size should be less than ${maxSizeMB}MB.`);
      return;
    }

    setProcessing(true);
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            onChange(canvas.toDataURL("image/jpeg", 0.75));
          } else {
            onChange(reader.result as string);
          }
          setProcessing(false);
        };
        img.onerror = () => {
          onChange(reader.result as string);
          setProcessing(false);
        };
        img.src = reader.result;
      } else {
        setProcessing(false);
      }
    };

    reader.onerror = () => {
      alert("Could not process photo. Please try choosing a photo from your device.");
      setProcessing(false);
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // URL Submission Handler
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError("");
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    if (trimmed.toLowerCase().startsWith("javascript:")) {
      setUrlError("Invalid URL format.");
      return;
    }

    if (
      !trimmed.startsWith("http://") &&
      !trimmed.startsWith("https://") &&
      !trimmed.startsWith("data:image/")
    ) {
      setUrlError("URL must start with http:// or https://");
      return;
    }

    onChange(trimmed);
    setUrlInput("");
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="space-y-0.5">
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
            {label}
          </label>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={deviceInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* PHOTO PREVIEW (If photo present) */}
      {value ? (
        <div className="relative aspect-[16/9] max-w-sm rounded-2xl overflow-hidden border border-orange-300 dark:border-slate-700 bg-slate-900 shadow-md group">
          <img
            src={value}
            alt="Selected Photo Preview"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80";
            }}
          />

          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-full bg-red-600 p-1.5 text-white shadow-lg hover:bg-red-700 transition-colors"
              title="Remove Photo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-sm rounded-xl p-2 flex items-center justify-between text-white text-xs opacity-90 group-hover:opacity-100 transition-opacity">
            <span className="truncate pr-2 text-[11px] font-mono">
              {value.startsWith("data:") ? "Uploaded Image" : value}
            </span>
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-orange-400 font-bold hover:underline shrink-0 text-[11px]"
            >
              Change Photo
            </button>
          </div>
        </div>
      ) : (
        /* DUAL / TRIPLE METHOD CONTROLLER */
        <div className="rounded-2xl border border-orange-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 p-3 shadow-sm space-y-3">
          {/* Tab Selection Bar */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("camera")}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "camera"
                  ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              <span>📷 Take Photo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("device")}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "device"
                  ? "bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>🖼️ From Device</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "url"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>🔗 Image URL</span>
            </button>
          </div>

          {/* TAB 1: CAMERA */}
          {activeTab === "camera" && (
            <div
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-orange-300 dark:border-slate-700 bg-orange-50/40 dark:bg-slate-800/20 p-6 cursor-pointer hover:bg-orange-50 transition-colors text-center group"
            >
              {processing ? (
                <div className="flex items-center gap-2 text-orange-600 text-xs font-bold py-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Processing camera photo...</span>
                </div>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 mb-2 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <Camera className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Click to Open Camera
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Capture directly using device camera (JPG, PNG up to {maxSizeMB}MB)
                  </span>
                </>
              )}
            </div>
          )}

          {/* TAB 2: DEVICE FILE */}
          {activeTab === "device" && (
            <div
              onClick={() => deviceInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-300 dark:border-slate-700 bg-amber-50/40 dark:bg-slate-800/20 p-6 cursor-pointer hover:bg-amber-50 transition-colors text-center group"
            >
              {processing ? (
                <div className="flex items-center gap-2 text-amber-700 text-xs font-bold py-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading file...</span>
                </div>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800 mb-2 group-hover:bg-amber-700 group-hover:text-white transition-colors">
                    <Upload className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Choose from Gallery / Files
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Select JPG, PNG, WebP image from your device
                  </span>
                </>
              )}
            </div>
          )}

          {/* TAB 3: IMAGE URL */}
          {activeTab === "url" && (
            <form onSubmit={handleUrlSubmit} className="space-y-2 p-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={placeholderUrl}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs outline-none focus:border-orange-500 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-colors shrink-0 flex items-center gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Apply</span>
                </button>
              </div>
              {urlError && <p className="text-[11px] text-red-600 font-semibold">{urlError}</p>}
              <p className="text-[10px] text-slate-400">
                Paste any direct image web link (e.g. Unsplash, Imgur, Cloudinary).
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

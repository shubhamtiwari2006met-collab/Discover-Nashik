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
  const handleUrlSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
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

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Stop active camera stream helper
  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  // Cleanup camera stream on unmount
  React.useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Handle Tab change - stop stream if switching away from camera tab
  const handleTabChange = (tab: "camera" | "device" | "url") => {
    if (tab !== "camera") {
      stopCameraStream();
    }
    setCameraError("");
    setActiveTab(tab);
  };

  // Start Camera - Triggers Native Browser Permission Dialog ("Allow while using the site", "Allow this time", "Don't allow")
  const startCamera = async () => {
    if (processing) return;
    setCameraError("");

    // Check Permissions API if supported to detect if user previously denied permission in site settings
    if (typeof navigator !== "undefined" && navigator.permissions && navigator.permissions.query) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: "camera" as any });
        if (permissionStatus.state === "denied") {
          setCameraError(
            t("Camera permission was denied. You can enable camera access in browser settings, or select 'From Device' / 'Image URL'.") ||
              "Camera permission was denied. You can enable camera access in browser settings, or select 'From Device' / 'Image URL'."
          );
          return;
        }
      } catch {
        // Permissions query for "camera" is non-standard or unsupported in some browsers (e.g., Firefox/Safari); ignore & proceed
      }
    }

    if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        setCameraStream(stream);
        setIsCameraActive(true);
      } catch (err: any) {
        console.warn("Camera permission denied or camera error:", err);
        setIsCameraActive(false);

        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setCameraError(
            t("Camera permission was denied. You can enable camera access in browser settings, or select 'From Device' / 'Image URL'.") ||
              "Camera permission was denied. You can enable camera access in browser settings, or select 'From Device' / 'Image URL'."
          );
        } else {
          // Fallback to native file capture if WebRTC stream unsupported or hardware unavailable
          cameraInputRef.current?.click();
        }
      }
    } else {
      cameraInputRef.current?.click();
    }
  };

  // Attach stream to video element when camera becomes active
  React.useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(console.error);
    }
  }, [isCameraActive, cameraStream]);

  // Capture Photo Snapshot from Live Camera Stream
  const capturePhoto = () => {
    if (!videoRef.current) return;
    setProcessing(true);

    const video = videoRef.current;
    const maxDim = 1200;
    let width = video.videoWidth || 640;
    let height = video.videoHeight || 480;

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
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
      onChange(dataUrl);
    }

    stopCameraStream();
    setProcessing(false);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="space-y-0.5">
          <label className="text-sm font-bold text-[#173247] dark:text-slate-200 block">
            {label}
          </label>
          {description && (
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{description}</p>
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
        <div className="rounded-2xl border border-orange-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 shadow-sm space-y-3">
          {/* Tab Selection Bar */}
          <div className="grid grid-cols-3 gap-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => handleTabChange("camera")}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "camera"
                  ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm border border-slate-300/50 dark:border-slate-600"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              <span>📷 Take Photo</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("device")}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "device"
                  ? "bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-sm border border-slate-300/50 dark:border-slate-600"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>🖼️ From Device</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("url")}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "url"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-300/50 dark:border-slate-600"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>🔗 Image URL</span>
            </button>
          </div>

          {/* TAB 1: CAMERA */}
          {activeTab === "camera" && (
            <div>
              {isCameraActive ? (
                <div className="flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-slate-950 border-2 border-orange-400/80 p-3 space-y-3">
                  <div className="relative aspect-[16/9] w-full max-w-sm rounded-xl overflow-hidden bg-black flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      disabled={processing}
                      className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
                    >
                      {processing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      <span>📸 Take Snapshot</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="px-4 py-2.5 bg-slate-800 text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div
                    onClick={startCamera}
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-orange-400/80 dark:border-orange-500/50 bg-orange-50/70 dark:bg-slate-800/50 p-6 cursor-pointer hover:bg-orange-100/60 transition-colors text-center group"
                  >
                    {processing ? (
                      <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 text-xs font-bold py-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Processing camera photo...</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-200/80 dark:bg-orange-950 text-orange-700 dark:text-orange-300 mb-2 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                          <Camera className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-extrabold text-[#173247] dark:text-white">
                          Click to Open Camera
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                          Capture directly using device camera (JPG, PNG up to {maxSizeMB}MB)
                        </span>
                      </>
                    )}
                  </div>
                  {cameraError && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium text-center px-2">
                      {cameraError}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DEVICE FILE */}
          {activeTab === "device" && (
            <div
              onClick={() => deviceInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-400/80 dark:border-amber-500/50 bg-amber-50/70 dark:bg-slate-800/50 p-6 cursor-pointer hover:bg-amber-100/60 transition-colors text-center group"
            >
              {processing ? (
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 text-xs font-bold py-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading file...</span>
                </div>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-200/80 dark:bg-amber-950 text-amber-800 dark:text-amber-300 mb-2 group-hover:bg-amber-700 group-hover:text-white transition-colors">
                    <Upload className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-extrabold text-[#173247] dark:text-white">
                    Choose from Gallery / Files
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    Select JPG, PNG, WebP image from your device
                  </span>
                </>
              )}
            </div>
          )}

          {/* TAB 3: IMAGE URL */}
          {activeTab === "url" && (
            <div className="space-y-2 p-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={placeholderUrl}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleUrlSubmit();
                    }
                  }}
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs outline-none focus:border-orange-500 text-slate-900 dark:text-white font-medium"
                />
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-colors shrink-0 flex items-center gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Apply</span>
                </button>
              </div>
              {urlError && <p className="text-[11px] text-red-600 font-semibold">{urlError}</p>}
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Paste any direct image web link (e.g. Unsplash, Imgur, Cloudinary).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};
const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

export async function enableWebPush(): Promise<string> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("Notification" in window)) {
    throw new Error("Push notifications are not supported by this browser.");
  }
  if (!Object.values(firebaseConfig).every(Boolean) || !vapidKey) {
    throw new Error("Push notifications are not configured for this site.");
  }

  if (!(await isSupported().catch(() => false))) {
    throw new Error("Push notifications are not supported by this browser.");
  }

  let permission = Notification.permission;
  if (permission === "default") permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(permission === "denied"
      ? "Push notifications are blocked in this browser's site settings."
      : "Notification permission was not granted.");
  }

  const app = getApps().find((existing) => existing.name === "[DEFAULT]") || initializeApp(firebaseConfig);
  const workerUrl = new URL("/firebase-messaging-sw.js", window.location.origin);
  Object.entries(firebaseConfig).forEach(([key, value]) => workerUrl.searchParams.set(key, value));
  await navigator.serviceWorker.register(workerUrl.toString(), { scope: "/" });
  const serviceWorkerRegistration = await navigator.serviceWorker.ready;
  if (!serviceWorkerRegistration.active) {
    throw new Error("The push notification service worker is not active yet. Please try again.");
  }

  const token = await getToken(getMessaging(app), {
    vapidKey,
    serviceWorkerRegistration,
  });
  if (!token) throw new Error("This browser could not create a push notification token.");
  return token;
}

export function getPushDeviceDetails() {
  const agent = navigator.userAgent;
  const browser = /Edg\//.test(agent) ? "Edge"
    : /Firefox\//.test(agent) ? "Firefox"
      : /Chrome\//.test(agent) ? "Chrome"
        : /Safari\//.test(agent) ? "Safari"
          : "Other";
  const storageKey = "discover_nashik_push_device_id";
  let deviceId = localStorage.getItem(storageKey);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(storageKey, deviceId);
  }
  return { browser, deviceId };
}

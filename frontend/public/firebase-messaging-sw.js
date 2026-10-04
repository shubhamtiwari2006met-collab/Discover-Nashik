const workerUrl = new URL(self.location.href);
const firebaseConfig = {
  apiKey: workerUrl.searchParams.get("apiKey"),
  authDomain: workerUrl.searchParams.get("authDomain"),
  projectId: workerUrl.searchParams.get("projectId"),
  storageBucket: workerUrl.searchParams.get("storageBucket"),
  messagingSenderId: workerUrl.searchParams.get("messagingSenderId"),
  appId: workerUrl.searchParams.get("appId"),
};

self.addEventListener("notificationclick", (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  const data = event.notification.data || {};
  event.notification.close();
  let destination;
  try {
    destination = new URL(data.url || "/", self.location.origin);
    if (destination.origin !== self.location.origin) destination = new URL("/", self.location.origin);
  } catch {
    destination = new URL("/", self.location.origin);
  }
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
    const appWindow = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (appWindow && "navigate" in appWindow) {
      const navigated = await appWindow.navigate(destination.href);
      return (navigated || appWindow).focus();
    }
    return self.clients.openWindow(destination.href);
  }));
});

if (Object.values(firebaseConfig).every(Boolean)) {
  importScripts(
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js"
  );
  firebase.initializeApp(firebaseConfig);
  firebase.messaging().onBackgroundMessage((payload) => {
    const data = payload.data || {};
    const title = data.category === "group_tracker" ? "Group Tracker update"
      : data.category === "lost_found" ? "Lost & Found update"
        : data.category === "trip_planner" ? "Trip Planner reminder"
          : "Discover Nashik notification";
    return self.registration.showNotification(title, {
      body: "Open Discover Nashik to view this notification.",
      icon: "/icon.png",
      tag: data.notificationId || "discover-nashik-notification",
      data,
    });
  });
}

const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

let warnedAboutMissingCredentials = false;

function configuredCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, '\n') };
}

function getFirebaseMessaging() {
  const credentials = configuredCredentials();
  if (!credentials) {
    if (!warnedAboutMissingCredentials) {
      console.warn('[Notifications] FCM is not configured; push delivery is disabled');
      warnedAboutMissingCredentials = true;
    }
    return null;
  }

  const existingApp = getApps().find((app) => app.name === '[DEFAULT]');
  const app = existingApp || initializeApp({
    credential: cert(credentials),
    projectId: credentials.projectId,
  });
  return getMessaging(app);
}

module.exports = { getFirebaseMessaging };

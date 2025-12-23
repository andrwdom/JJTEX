"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
};

function readFirebaseConfig(): FirebaseClientConfig {
  const raw = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  } as const;

  const missing: string[] = [];
  if (!raw.apiKey || raw.apiKey === "YOUR_NEW_FIREBASE_API_KEY") missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!raw.authDomain) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!raw.projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!raw.appId || raw.appId === "YOUR_NEW_APP_ID") missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");

  if (missing.length) {
    throw new Error(
      `Firebase client config missing: ${missing.join(", ")}. ` +
        `Create frontend/.env.production (or frontend/.env.local) from env.production.template and rebuild.`
    );
  }

  return {
    apiKey: raw.apiKey!,
    authDomain: raw.authDomain!,
    projectId: raw.projectId!,
    storageBucket: raw.storageBucket,
    messagingSenderId: raw.messagingSenderId,
    appId: raw.appId!,
    measurementId: raw.measurementId,
  };
}

export function isFirebaseConfigured(): boolean {
  try {
    readFirebaseConfig();
    return true;
  } catch {
    return false;
  }
}

export function getFirebaseApp(): FirebaseApp {
  const config = readFirebaseConfig();
  return getApps().length ? getApp() : initializeApp(config);
}

export function getFirebaseAuth(): Auth {
  const app = getFirebaseApp();
  return getAuth(app);
}
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
    getAuth,
    signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
    createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
    signInWithPopup as firebaseSignInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    GoogleAuthProvider,
    type User
} from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Mode Logic
const hasKeys = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const isForceMock = process.env.NEXT_PUBLIC_FORCE_MOCK === 'true';
let isMockEnabled = !hasKeys || isForceMock;

let app: any;
let auth: any;

if (!isMockEnabled) {
    try {
        console.log("🌐 Initializing Firebase Web SDK...");
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        auth = getAuth(app);

        // Analytics (Client-side only)
        if (typeof window !== 'undefined') {
            isSupported().then(yes => yes && getAnalytics(app));
        }
    } catch (error) {
        console.error("❌ Firebase initialization failed, switching to mock mode.", error);
        isMockEnabled = true;
    }
}

// Minimal mock auth for development
if (isMockEnabled || !auth) {
    console.warn("⚠️ Frontend using mock authentication.");
    auth = {
        currentUser: {
            uid: 'dev-user-id',
            email: 'dev@hisabpati.com',
            displayName: 'Dev User',
            getIdToken: async () => 'mock-token'
        },
        onAuthStateChanged: (callback: any) => {
            callback(auth.currentUser);
            return () => { };
        },
        signOut: async () => console.log("Mock Sign Out")
    };
}

// Wrapped Auth Functions
export const signInWithEmailAndPassword = async (a: any, e: string, p: string) => {
    if (isMockEnabled) {
        console.log("Mock Login Success");
        return { user: auth.currentUser };
    }
    return firebaseSignInWithEmailAndPassword(a, e, p);
};

export const createUserWithEmailAndPassword = async (a: any, e: string, p: string) => {
    if (isMockEnabled) {
        console.log("Mock Signup Success");
        return { user: auth.currentUser };
    }
    return firebaseCreateUserWithEmailAndPassword(a, e, p);
};

export const signInWithPopup = async (a: any, p: any) => {
    if (isMockEnabled) {
        console.log("Mock Popup Login Success");
        return { user: auth.currentUser };
    }
    return firebaseSignInWithPopup(a, p);
};

export const signOut = async (a: any) => {
    if (isMockEnabled) {
        console.log("Mock Sign Out Success");
        return;
    }
    return firebaseSignOut(a);
};

export const onAuthStateChanged = (a: any, callback: any) => {
    if (isMockEnabled) {
        callback(auth.currentUser);
        return () => { };
    }
    return firebaseOnAuthStateChanged(a, callback);
};

export { auth, app, isMockEnabled, GoogleAuthProvider, type User };

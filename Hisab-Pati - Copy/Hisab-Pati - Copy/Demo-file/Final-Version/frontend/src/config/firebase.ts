import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { APP_CONFIG } from '../../../../shared/constants';

const firebaseConfig = {
    apiKey: APP_CONFIG.FIREBASE.API_KEY,
    authDomain: APP_CONFIG.FIREBASE.AUTH_DOMAIN,
    projectId: APP_CONFIG.FIREBASE.PROJECT_ID,
    storageBucket: APP_CONFIG.FIREBASE.STORAGE_BUCKET,
    messagingSenderId: APP_CONFIG.FIREBASE.MESSAGING_SENDER_ID,
    appId: APP_CONFIG.FIREBASE.APP_ID,
    measurementId: APP_CONFIG.FIREBASE.MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };

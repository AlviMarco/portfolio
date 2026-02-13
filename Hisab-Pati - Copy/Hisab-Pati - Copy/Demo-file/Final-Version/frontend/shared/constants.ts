/**
 * Global application constants and configuration keys.
 * Centralizing these variables ensures professional and clean code separation.
 */

export const APP_CONFIG = {
    VERSION: '2.2.0',
    API_URL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api',
    FIREBASE: {
        API_KEY: (import.meta as any).env?.VITE_FIREBASE_API_KEY,
        AUTH_DOMAIN: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN,
        PROJECT_ID: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID,
        STORAGE_BUCKET: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET,
        MESSAGING_SENDER_ID: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
        APP_ID: (import.meta as any).env?.VITE_FIREBASE_APP_ID,
        MEASUREMENT_ID: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID,
        PHOTO_URL: "https://ui-avatars.com/api/?name=Hisab+Pati&background=0b3c5d&color=fff&size=256",
    },
    THEME: {
        DEFAULT: 'light',
        STORAGE_KEY: 'regal_dark_mode',
    },
    AUTH: {
        SESSION_KEY: 'regal_user_session',
        MOCK_ENABLED: (import.meta as any).env?.VITE_USE_MOCK === 'true',
    },
    AI: {
        GEMINI_API_KEY: (import.meta as any).env?.VITE_GOOGLE_API_KEY,
    }
};

export const DB_CONFIG = {
    NAME: 'RegalAccountingDB',
    VERSION: 5,
};

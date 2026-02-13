import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from the backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isMockEnabled = process.env.MOCK_AUTH === 'true' || !process.env.FIREBASE_PROJECT_ID;

let auth: any;

if (isMockEnabled) {
    console.warn('⚠️ Firebase credentials missing or MOCK_AUTH=true. Using mock authentication.');
    auth = {
        verifyIdToken: async (token: string) => {
            if (token === 'mock-token') {
                return { uid: 'dev-user-id', email: 'dev@hisabpati.com' };
            }
            // For development, we might want to accept any token as mock
            return { uid: 'dev-user-id', email: 'dev@hisabpati.com' };
        }
    };
} else {
    try {
        const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
        // Normalization: 
        // 1. Remove outer quotes
        // 2. Replace literal \n sequences with real newlines
        // 3. Ensure header/footer have proper newlines
        let privateKey = rawKey
            .replace(/^"(.*)"$/, '$1')
            .replace(/\\n/g, '\n');

        if (privateKey && !privateKey.includes('\n', 27)) {
            // If there's no newline after the header, try to fix it
            privateKey = privateKey
                .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
                .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----\n');
        }

        const firebaseConfig = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        };

        // Check if admin is defined and has apps safely
        const apps = (admin as any)?.apps || [];

        if (apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert(firebaseConfig as any),
            });
        }
        auth = admin.auth();
        console.log('✅ Firebase Admin initialized successfully.');
    } catch (error) {
        console.error('❌ Firebase initialization failed, falling back to mock:', error);
        auth = {
            verifyIdToken: async (token: string) => {
                return { uid: 'dev-user-id', email: 'dev@hisabpati.com' };
            }
        };
    }
}

export { auth };
export default admin;

import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database
    databaseUrl: process.env.DATABASE_URL || '',

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

    // Better Auth
    betterAuthUrl: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
    betterAuthSecret: process.env.BETTER_AUTH_SECRET || '',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',

    // Pagination defaults
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100,
};

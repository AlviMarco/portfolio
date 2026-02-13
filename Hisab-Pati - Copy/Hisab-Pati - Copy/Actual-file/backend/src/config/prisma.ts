import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

class PrismaService {
    private static instance: PrismaClient;

    private constructor() { }

    public static getInstance(): PrismaClient {
        if (!PrismaService.instance) {
            const url = process.env.DATABASE_URL;
            console.log('🔍 Checking DATABASE_URL:', url ? 'FOUND' : 'MISSING');

            if (!url) {
                throw new Error('DATABASE_URL is not defined in environment variables');
            }

            const pool = new pg.Pool({ connectionString: url });
            const adapter = new PrismaPg(pool);

            console.log('🚀 Initializing PrismaClient with PrismaPg adapter...');
            PrismaService.instance = new PrismaClient({ adapter } as any);
        }
        return PrismaService.instance;
    }
}

export const prisma = PrismaService.getInstance();

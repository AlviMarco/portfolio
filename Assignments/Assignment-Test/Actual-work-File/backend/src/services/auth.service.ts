import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/helpers';
import { ValidationError, AuthenticationError, ConflictError } from '../utils/errors';

const prisma = new PrismaClient();

export interface RegisterInput {
    email: string;
    password: string;
    name: string;
    role?: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export const authService = {
    async register(input: RegisterInput) {
        const { email, password, name, role = 'STUDENT' } = input;

        // Validation
        if (!email || !password || !name) {
            throw new ValidationError('Email, password, and name are required');
        }

        if (password.length < 6) {
            throw new ValidationError('Password must be at least 6 characters');
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictError('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                name,
                role: role as any,
            },
        });

        // Create account with password
        await prisma.account.create({
            data: {
                userId: user.id,
                accountId: email,
                providerId: 'credential',
                password: hashedPassword,
            },
        });

        // Generate token
        const token = generateToken(user);

        return {
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            token,
        };
    },

    async login(input: LoginInput) {
        const { email, password } = input;

        // Validation
        if (!email || !password) {
            throw new ValidationError('Email and password are required');
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: { accounts: true },
        });

        if (!user) {
            throw new AuthenticationError('Invalid email or password');
        }

        // Check password
        const account = user.accounts.find((a: any) => a.providerId === 'credential');
        if (!account) {
            throw new AuthenticationError('Invalid email or password');
        }

        const isValidPassword = await bcrypt.compare(password, account.password || '');
        if (!isValidPassword) {
            throw new AuthenticationError('Invalid email or password');
        }

        // Generate token
        const token = generateToken(user);

        return {
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            token,
        };
    },

    async getMe(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new AuthenticationError('User not found');
        }

        return { id: user.id, email: user.email, name: user.name, role: user.role };
    },
};

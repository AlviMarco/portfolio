import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
    secret: process.env.BETTER_AUTH_SECRET!,
    trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:5000"],
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "student",
                required: false,
            },
        },
    },
});
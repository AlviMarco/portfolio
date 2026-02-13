-- Create enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BANNED', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column to User table
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" DEFAULT 'ACTIVE' NOT NULL;

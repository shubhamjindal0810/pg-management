-- Migration to add expected_checkout column to bookings table
-- Run this SQL manually in your database or use: psql <your-connection-string> -f ADD_EXPECTED_CHECKOUT_MIGRATION.sql

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "expected_checkout" TIMESTAMP(3);


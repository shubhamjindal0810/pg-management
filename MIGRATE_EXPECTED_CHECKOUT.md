# Migration: Add expected_checkout to bookings table

## Issue
The `expected_checkout` column exists in the Prisma schema but hasn't been added to the database, causing queries to fail.

## Solution
Run the migration SQL to add the column to your database.

### Option 1: Using Prisma Migrate (Recommended)
```bash
npx prisma migrate deploy
```

### Option 2: Manual SQL
Run the SQL from `ADD_EXPECTED_CHECKOUT_MIGRATION.sql`:
```sql
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "expected_checkout" TIMESTAMP(3);
```

### Option 3: Using psql
```bash
psql <your-connection-string> -f ADD_EXPECTED_CHECKOUT_MIGRATION.sql
```

## Note
The code has been updated to work without this column by using explicit `select` statements. Once the migration is run, you can revert to using `include` if desired, but the current implementation will continue to work.


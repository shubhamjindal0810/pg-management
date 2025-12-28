# Fix: "prepared statement already exists" Error

## Problem

You're seeing this error:
```
ConnectorError: prepared statement "s2" already exists
```

This happens when:
- You're using **Transaction Mode (port 6543)** with Supabase
- Prisma is trying to use prepared statements
- PgBouncer in Transaction Mode **does NOT support prepared statements**

## Solution: Add `?pgbouncer=true` to Connection String

### Step 1: Check Your Current Connection String

Your `DATABASE_URL` should look like this for Transaction Mode:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Important:** The `?pgbouncer=true` parameter is **required** - it tells Prisma to disable prepared statements.

### Step 2: Verify Your Connection String Format

Make sure your connection string has:
- ✅ Port `6543` (Transaction Mode)
- ✅ `?pgbouncer=true` at the end
- ✅ Pooler endpoint (not direct database endpoint)

**Correct format:**
```
postgresql://postgres:[PASSWORD]@[POOLER-ENDPOINT]:6543/postgres?pgbouncer=true
```

**Wrong format (will cause this error):**
```
postgresql://postgres:[PASSWORD]@[POOLER-ENDPOINT]:6543/postgres
# Missing ?pgbouncer=true ❌
```

### Step 3: Update Your Environment Variable

**For Local Development (.env):**
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**For Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `DATABASE_URL`
3. Make sure it ends with `?pgbouncer=true`
4. Update if needed
5. Redeploy

### Step 4: Regenerate Prisma Client

After updating the connection string, regenerate Prisma Client:

```bash
npx prisma generate
```

### Step 5: Restart Your Application

```bash
# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

## Why This Happens

1. **Transaction Mode (6543)** uses PgBouncer for connection pooling
2. **PgBouncer** doesn't support prepared statements
3. **Prisma** uses prepared statements by default for performance
4. **Solution**: `?pgbouncer=true` tells Prisma to disable prepared statements

## Connection String Examples

### Transaction Mode (Production/Serverless) ✅
```
postgresql://postgres:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Session Mode (Migrations/Development) ✅
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

## Quick Verification

Test if your connection string is correct:

```bash
# This should work without errors
DATABASE_URL="your-connection-string?pgbouncer=true" npx prisma db pull
```

If you see the "prepared statement" error, your connection string is missing `?pgbouncer=true`.

## Common Mistakes

1. **Missing `?pgbouncer=true`**
   - ❌ `postgresql://...:6543/postgres`
   - ✅ `postgresql://...:6543/postgres?pgbouncer=true`

2. **Using Session Mode connection with Transaction Mode port**
   - ❌ `postgresql://...@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true`
   - ✅ `postgresql://...@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true`

3. **Extra parameters in wrong order**
   - ❌ `postgresql://...:6543/postgres?sslmode=require&pgbouncer=true`
   - ✅ `postgresql://...:6543/postgres?pgbouncer=true&sslmode=require`

## Still Having Issues?

1. **Double-check your connection string:**
   ```bash
   echo $DATABASE_URL
   # Should end with ?pgbouncer=true
   ```

2. **Verify in Supabase Dashboard:**
   - Go to Settings → Database
   - Select "Transaction mode"
   - Copy the connection string
   - **Manually add `?pgbouncer=true`** at the end

3. **Test with a simple query:**
   ```bash
   DATABASE_URL="your-url?pgbouncer=true" npx prisma db execute --stdin
   # Then type: SELECT 1;
   ```

4. **Clear all caches:**
   ```bash
   rm -rf .next
   rm -rf node_modules/.prisma
   npx prisma generate
   npm run dev
   ```

## References

- See [SUPABASE_CONNECTION.md](./SUPABASE_CONNECTION.md) for full configuration guide
- [Prisma PgBouncer Documentation](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#pgbouncer)


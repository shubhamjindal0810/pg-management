# Fix: MaxClientsInSessionMode Error

## Problem

You're seeing this error:
```
FATAL: MaxClientsInSessionMode: max clients reached - in Session mode max clients are limited to pool_size
```

This happens because:
- You're using **Session Mode (port 5432)** which has strict connection limits
- Next.js build process creates multiple database connections simultaneously
- Supabase Session Mode has a limited number of concurrent connections

## Solution: Switch to Transaction Mode

### Step 1: Get Your Transaction Mode Connection String

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Find **Connection string** section
4. Select **Transaction mode** (port 6543)
5. Copy the connection string
6. **Add `?pgbouncer=true`** to the end

Example:
```
postgresql://postgres:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Step 2: Update Your Environment Variable

**For Local Development (.env file):**
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**For Vercel (Environment Variables):**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `DATABASE_URL` with Transaction Mode connection string
3. Make sure it's set for **Production**, **Preview**, and **Development**

### Step 3: Rebuild Your Application

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

## Why Transaction Mode?

- ✅ **Connection Pooling**: Handles many concurrent connections efficiently
- ✅ **Serverless Friendly**: Perfect for Next.js builds and serverless functions
- ✅ **No Connection Limits**: PgBouncer manages connections intelligently
- ✅ **Better Performance**: Optimized for short-lived connections

## Important Notes

### Use Different Modes for Different Tasks

**Transaction Mode (6543) - Use for:**
- ✅ Next.js builds (`npm run build`)
- ✅ Production deployments
- ✅ Serverless functions
- ✅ Application runtime

**Session Mode (5432) - Use for:**
- ✅ Database migrations (`prisma migrate deploy`)
- ✅ Prisma Studio (`prisma studio`)
- ✅ Direct database queries
- ✅ Long-running scripts

### Running Migrations

When you need to run migrations, temporarily use Session Mode:

```bash
# Use Session Mode for migrations
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" npx prisma migrate deploy

# Then switch back to Transaction Mode for your app
```

### Quick Fix Script

Create a script to easily switch between modes:

**package.json:**
```json
{
  "scripts": {
    "db:migrate": "DATABASE_URL=\"postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres\" npx prisma migrate deploy",
    "db:studio": "DATABASE_URL=\"postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres\" npx prisma studio"
  }
}
```

## Verification

After updating, test the connection:

```bash
# Test Transaction Mode
npm run build
```

If the build succeeds without connection errors, you're good to go! 🎉

## Still Having Issues?

1. **Check your connection string format:**
   - Must include `:6543` (Transaction Mode port)
   - Must include `?pgbouncer=true` at the end
   - Password should be URL-encoded if it contains special characters

2. **Verify in Supabase Dashboard:**
   - Go to Settings → Database
   - Check "Connection Pooling" is enabled
   - Verify the pooler endpoint is correct

3. **Clear caches:**
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   npm run build
   ```

## References

- See [SUPABASE_CONNECTION.md](./SUPABASE_CONNECTION.md) for detailed configuration
- [Supabase Connection Pooling Docs](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)


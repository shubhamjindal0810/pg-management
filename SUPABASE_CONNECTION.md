# Supabase Connection Configuration

This guide explains how to configure Prisma to work with Supabase PostgreSQL in serverless environments.

## Connection Modes

Supabase offers two connection modes:

### 1. Session Mode (Port 5432)
- Direct PostgreSQL connection
- Supports prepared statements
- Better for long-running connections
- **Use for**: Development, migrations, Prisma Studio

### 2. Transaction Mode (Port 6543) - **Recommended for Serverless**
- Uses PgBouncer connection pooling
- Better for serverless functions (Vercel, AWS Lambda, etc.)
- **Does NOT support prepared statements**
- **Use for**: Production serverless deployments

## Configuration for Transaction Mode

To use Transaction Mode (port 6543) with Prisma, you need to:

### 1. Update Your DATABASE_URL

Add `?pgbouncer=true` to your connection string to disable prepared statements:

**Session Mode (Development/Migrations):**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Transaction Mode (Production/Serverless):**
```
postgresql://postgres:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 2. Environment Variables Setup

For **development** (use Session Mode):
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

For **production** (use Transaction Mode):
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### 3. Prisma Schema Configuration

The Prisma schema is already configured correctly. The `?pgbouncer=true` parameter in the connection string tells Prisma to:
- Disable prepared statements
- Use connection pooling compatible queries
- Work with PgBouncer in transaction mode

## Important Notes

1. **Migrations**: Always run migrations using Session Mode (port 5432) without `?pgbouncer=true`
   ```bash
   # Use direct connection for migrations
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" npx prisma migrate deploy
   ```

2. **Prisma Studio**: Use Session Mode for Prisma Studio
   ```bash
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" npx prisma studio
   ```

3. **Production**: Use Transaction Mode for all production serverless functions

## Getting Your Connection Strings from Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Find **Connection string** section
4. Select **Transaction mode** for serverless
5. Select **Session mode** for migrations/development
6. Copy the connection string and add `?pgbouncer=true` for transaction mode

## Vercel Configuration

In your Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add `DATABASE_URL` with Transaction Mode connection string:
   ```
   postgresql://postgres:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
3. Make sure to set it for **Production**, **Preview**, and **Development** environments

## Testing the Connection

Test your connection:
```bash
# Test Transaction Mode connection
DATABASE_URL="your-transaction-mode-url?pgbouncer=true" npx prisma db pull
```

## Troubleshooting

### Error: "prepared statement does not exist"
- **Cause**: Using Transaction Mode without `?pgbouncer=true`
- **Solution**: Add `?pgbouncer=true` to your connection string

### Error: "too many connections"
- **Cause**: Not using connection pooling
- **Solution**: Use Transaction Mode (port 6543) with `?pgbouncer=true`

### Migrations failing
- **Cause**: Trying to run migrations with Transaction Mode
- **Solution**: Use Session Mode (port 5432) for migrations

## References

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Prisma with PgBouncer](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#pgbouncer)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)


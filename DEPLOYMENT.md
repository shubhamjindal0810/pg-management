# Deployment Guide - Vercel

This guide will walk you through deploying your PG Management System to Vercel.

## Prerequisites

1. **GitHub/GitLab/Bitbucket Account** - Your code needs to be in a Git repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Production Database** - You'll need a PostgreSQL database (recommended: [Supabase](https://supabase.com), [Neon](https://neon.tech), or [Railway](https://railway.app))

## Step 1: Push Your Code to Git

If you haven't already, initialize a Git repository and push to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/pg-management.git
git push -u origin main
```

## Step 2: Set Up Production Database

### Option A: Supabase (Recommended - Free tier available)

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the **Connection string** (URI format)
   - **For Development/Migrations**: Use Session Mode (port 5432)
     - `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - **For Production/Serverless**: Use Transaction Mode (port 6543) with `?pgbouncer=true`
     - `postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true`

**📖 See [SUPABASE_CONNECTION.md](./SUPABASE_CONNECTION.md) for detailed configuration guide.**

### Option B: Neon (Recommended - Serverless PostgreSQL)

1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new project
3. Copy the connection string from the dashboard

### Option C: Railway

1. Go to [railway.app](https://railway.app) and create an account
2. Create a new PostgreSQL database
3. Copy the connection string from the database settings

## Step 3: Run Database Migrations

Before deploying, you need to set up your production database schema:

```bash
# Set your production DATABASE_URL temporarily
export DATABASE_URL="your-production-database-url"

# Generate Prisma Client
npx prisma generate

# Push schema to production database
npx prisma db push

# Or run migrations (if you have migration files)
npx prisma migrate deploy
```

**Note:** For production, prefer using migrations (`prisma migrate deploy`) over `db push`.

## Step 4: Deploy to Vercel

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com) and sign in**

2. **Click "Add New Project"**

3. **Import your Git repository**
   - Connect your GitHub/GitLab/Bitbucket account if not already connected
   - Select your `pg-management` repository
   - Click "Import"

4. **Configure Project Settings**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

5. **Add Environment Variables**
   
   Click "Environment Variables" and add the following:

   ```
   DATABASE_URL=your-production-database-connection-string
   NEXTAUTH_SECRET=generate-a-random-secret-here
   NEXTAUTH_URL=https://your-app-name.vercel.app
   ```

   **How to generate NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```
   Or use an online generator: https://generate-secret.vercel.app/32

   **Important:** 
   - For `NEXTAUTH_URL`, use your Vercel deployment URL (you can update this after first deployment)
   - Add these variables for **Production**, **Preview**, and **Development** environments

6. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (usually 2-5 minutes)

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project or create new
   - Set environment variables when prompted

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Step 5: Configure Build Settings for Prisma

Vercel needs to generate the Prisma Client during build. Update your `package.json` to include a postinstall script:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

This ensures Prisma Client is generated after dependencies are installed.

## Step 6: Set Up Environment Variables in Vercel

After your first deployment, update environment variables in Vercel:

1. Go to your project on Vercel
2. Click **Settings** → **Environment Variables**
3. Add/Update these variables:

   | Variable | Value | Environment |
   |----------|-------|-------------|
   | `DATABASE_URL` | Your production database URL | Production, Preview, Development |
   | `NEXTAUTH_SECRET` | Your generated secret | Production, Preview, Development |
   | `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production |
   | `NEXTAUTH_URL` | `https://your-preview-url.vercel.app` | Preview |
   | `NEXTAUTH_URL` | `http://localhost:3000` | Development |

4. **Redeploy** after adding environment variables

## Step 7: Set Up Cron Jobs (Optional)

Your app has cron jobs configured in `vercel.json` for:
- Automated billing (`/api/cron/billing`)
- Payment reminders (`/api/cron/payment-reminders`)
- Mark overdue bills (`/api/cron/mark-overdue`)

Vercel will automatically set these up based on your `vercel.json` configuration.

**Note:** For cron jobs to work, you need a Vercel Pro plan or higher. On the free plan, you can use external cron services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)

## Step 8: Verify Deployment

1. **Check Build Logs**
   - Go to your project → **Deployments**
   - Click on the latest deployment
   - Check for any build errors

2. **Test Your Application**
   - Visit your Vercel URL: `https://your-app.vercel.app`
   - Test login functionality
   - Verify database connections

3. **Check Function Logs**
   - Go to **Functions** tab in Vercel dashboard
   - Monitor for any runtime errors

## Step 9: Set Up Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` to your custom domain

## Troubleshooting

### Build Fails with Prisma Errors

**Error:** `Prisma Client has not been generated yet`

**Solution:** Add `postinstall` script to `package.json`:
```json
"scripts": {
  "postinstall": "prisma generate"
}
```

### Database Connection Errors

**Error:** `Can't reach database server`

**Solutions:**
1. Verify `DATABASE_URL` is correct in Vercel environment variables
2. Check if your database allows connections from Vercel IPs
3. For Supabase: 
   - Use **Transaction Mode (port 6543)** with `?pgbouncer=true` for serverless
   - Use **Session Mode (port 5432)** for migrations
   - See [SUPABASE_CONNECTION.md](./SUPABASE_CONNECTION.md) for details
4. Ensure SSL is enabled in connection string (add `?sslmode=require` if not using Supabase pooler)

### NextAuth Errors

**Error:** `NEXTAUTH_SECRET is not set`

**Solution:** 
1. Generate a secret: `openssl rand -base64 32`
2. Add it to Vercel environment variables
3. Redeploy

### Image Optimization Errors

If you see errors about external images, check `next.config.js` - the `remotePatterns` should already be configured.

## Post-Deployment Checklist

- [ ] Database schema is migrated
- [ ] Environment variables are set
- [ ] First admin user is created (you may need to do this via database or a seed script)
- [ ] Cron jobs are configured (if using Vercel Pro)
- [ ] Custom domain is set up (if applicable)
- [ ] SSL certificate is active (automatic with Vercel)
- [ ] Application is accessible and functional

## Creating Your First Admin User

After deployment, you'll need to create an admin user. You can do this by:

1. **Using Prisma Studio** (local):
   ```bash
   DATABASE_URL="your-production-url" npx prisma studio
   ```

2. **Using a seed script** (recommended):
   Create a one-time script to create an admin user, then run it locally with production DATABASE_URL

3. **Direct database access**: Use your database provider's SQL editor

## Monitoring and Analytics

- **Vercel Analytics**: Enable in project settings for performance monitoring
- **Function Logs**: Monitor API routes and server actions in Vercel dashboard
- **Database Monitoring**: Use your database provider's monitoring tools

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)


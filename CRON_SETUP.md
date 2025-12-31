# Cron Job Setup Guide

This application includes automated billing and payment reminder systems that need to be set up as cron jobs.

## Available Cron Endpoints

### 1. Automated Billing (`/api/cron/billing`)
- **Purpose**: Generates bills for all active tenants on the 1st of each month
- **Schedule**: Run on the 1st of each month at 00:00 (midnight)
- **Method**: GET
- **URL**: `https://yourdomain.com/api/cron/billing`

### 2. Daily Maintenance (`/api/cron/daily`)
- **Purpose**: Performs daily maintenance tasks:
  - Marks bills as overdue if due date has passed
  - Sends payment reminders for bills due in the next 3 days
- **Schedule**: Run daily at 09:00 AM
- **Method**: GET
- **URL**: `https://yourdomain.com/api/cron/daily`

**Note**: This consolidated endpoint combines the previous `payment-reminders` and `mark-overdue` endpoints to reduce the number of cron jobs from 3 to 2 (fits within Vercel's free tier limit).

## Setup Options

### Option 1: Vercel Cron (Recommended for Vercel deployments)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/billing",
      "schedule": "0 0 1 * *"
    },
    {
      "path": "/api/cron/daily",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Total: 2 cron jobs** (fits within Vercel's free tier limit of 2 cron jobs)

### Option 2: External Cron Service

Use services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Cronitor](https://cronitor.io)

Configure each endpoint with the appropriate schedule.

### Option 3: Server Cron (Linux/Unix)

Add to your server's crontab:

```bash
# Automated billing - 1st of each month at midnight
0 0 1 * * curl https://yourdomain.com/api/cron/billing

# Daily maintenance - Daily at 9 AM (marks overdue + sends reminders)
0 9 * * * curl https://yourdomain.com/api/cron/daily
```

## Security

For production, uncomment the authorization check in each route file and set `CRON_SECRET` environment variable:

```typescript
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

Then configure your cron service to send the header:
```
Authorization: Bearer YOUR_CRON_SECRET
```

## Payment Reminders Implementation

Currently, payment reminders are logged to the console. To implement actual notifications:

1. **SMS**: Integrate with Twilio
2. **Email**: Use SendGrid, Resend, or similar
3. **WhatsApp**: Use WhatsApp Business API
4. **Push Notifications**: For tenant app

Update the reminder logic in `/app/api/cron/daily/route.ts` to send actual notifications.


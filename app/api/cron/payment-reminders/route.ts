import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

// This endpoint should be called daily by a cron job
// It sends payment reminders for bills due in the next 3 days
export async function GET(request: Request) {
  // Verify the request is from a cron service
  const headersList = headers();
  const authHeader = headersList.get('authorization');

  // In production, use a secret token
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get bills due in the next 3 days that are not paid
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const billsDue = await db.bill.findMany({
      where: {
        status: { in: ['SENT', 'PARTIAL', 'DRAFT'] },
        dueDate: {
          gte: today,
          lte: threeDaysFromNow,
        },
      },
      include: {
        tenant: {
          include: {
            user: { select: { name: true, phone: true, email: true } },
            bed: {
              include: {
                room: {
                  include: {
                    property: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const remindersSent = [];
    const errors = [];

    for (const bill of billsDue) {
      try {
        const totalAmount = Number(bill.totalAmount);
        const paidAmount = Number(bill.paidAmount);
        const balance = totalAmount - paidAmount;
        const daysUntilDue = Math.ceil(
          (bill.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // TODO: Implement actual notification sending (SMS/Email/WhatsApp)
        // For now, we'll just log the reminder
        console.log('Payment Reminder:', {
          tenant: bill.tenant.user.name,
          phone: bill.tenant.user.phone,
          email: bill.tenant.user.email,
          billId: bill.id,
          amount: balance,
          dueDate: bill.dueDate,
          daysUntilDue,
        });

        // You can integrate with:
        // - Twilio for SMS
        // - SendGrid/Resend for Email
        // - WhatsApp Business API
        // - Push notifications

        remindersSent.push({
          billId: bill.id,
          tenantName: bill.tenant.user.name,
          phone: bill.tenant.user.phone,
          amount: balance,
          daysUntilDue,
        });
      } catch (error: any) {
        errors.push(`Error sending reminder for bill ${bill.id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Payment reminders processed. ${remindersSent.length} reminders sent.`,
      remindersSent: remindersSent.length,
      details: remindersSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to send payment reminders', message: error.message },
      { status: 500 }
    );
  }
}


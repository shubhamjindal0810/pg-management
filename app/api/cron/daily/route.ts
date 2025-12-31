import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

// This endpoint should be called daily by a cron job
// It performs two tasks:
// 1. Marks bills as overdue if the due date has passed
// 2. Sends payment reminders for bills due in the next 3 days
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

    // ============================================
    // TASK 1: Mark bills as overdue
    // ============================================
    const overdueBills = await db.bill.findMany({
      where: {
        status: { in: ['SENT', 'PARTIAL'] },
        dueDate: { lt: today },
      },
    });

    const markedOverdue = [];
    for (const bill of overdueBills) {
      await db.bill.update({
        where: { id: bill.id },
        data: { status: 'OVERDUE' },
      });
      markedOverdue.push(bill.id);
    }

    // ============================================
    // TASK 2: Send payment reminders
    // ============================================
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
      message: 'Daily maintenance completed',
      tasks: {
        markOverdue: {
          count: markedOverdue.length,
          billIds: markedOverdue,
        },
        paymentReminders: {
          count: remindersSent.length,
          details: remindersSent,
        },
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to run daily maintenance', message: error.message },
      { status: 500 }
    );
  }
}


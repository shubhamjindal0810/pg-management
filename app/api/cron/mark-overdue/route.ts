import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

// This endpoint should be called daily by a cron job
// It marks bills as overdue if the due date has passed and they're not paid
export async function GET(request: Request) {
  const headersList = headers();
  const authHeader = headersList.get('authorization');

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find bills that are past due and not paid
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

    return NextResponse.json({
      success: true,
      message: `Marked ${markedOverdue.length} bills as overdue.`,
      count: markedOverdue.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to mark overdue bills', message: error.message },
      { status: 500 }
    );
  }
}

